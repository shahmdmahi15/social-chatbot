import {
  getSettings,
  addLog,
  setBotStatus,
  setCurrentThread,
  setPendingDraft,
} from '../utils/storage';
import { buildSystemPrompt, formatChatHistoryForLLM } from '../utils/prompt-builder';
import { generateChatReply } from '../utils/agent-router';
import type { ChatThread, ChatMessage, ExtensionMessage } from '../types';

export default defineBackground(() => {
  console.log('[Social Auto-Chat AI] Background Service Worker initialized.');

  // Set up declarativeNetRequest rules for AgentRouter & OpenRouter headers
  setupProviderHeadersRules();

  // 1. Enable Side Panel on extension icon click
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.warn('Could not set side panel behavior:', err);
    });
  }

  // Backup action click listener
  chrome.action.onClicked.addListener(async (tab) => {
    if (tab.id && tab.windowId) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  });

  // Coalescing timers mapped by thread ID
  const coalescingTimers = new Map<string, number>();

  // Main runtime message router
  chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
    (async () => {
      try {
        if (message.type === 'CHAT_SWITCHED') {
          await setCurrentThread(message.thread);
          sendResponse({ success: true });
        } else if (message.type === 'NEW_MESSAGES_DETECTED') {
          await handleNewIncomingMessages(message.thread, message.messages, sender.tab?.id);
          sendResponse({ success: true });
        } else if (message.type === 'TRIGGER_FORCE_REPLY') {
          await executeGenerationAndReply(message.thread, message.messages, sender.tab?.id);
          sendResponse({ success: true });
        } else if (message.type === 'APPROVE_AND_SEND') {
          if (sender.tab?.id) {
            await chrome.tabs.sendMessage(sender.tab.id, {
              type: 'APPROVE_AND_SEND',
              text: message.text,
            });
          } else {
            // Find active Messenger tab
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (activeTab?.id) {
              await chrome.tabs.sendMessage(activeTab.id, {
                type: 'APPROVE_AND_SEND',
                text: message.text,
              });
            }
          }
          await setPendingDraft(null);
          await setBotStatus('idle');
          await addLog({
            type: 'sent',
            threadName: message.threadId,
            message: `Approved & Sent: "${message.text}"`,
          });
          sendResponse({ success: true });
        } else if (message.type === 'SCAN_CHATS_REQUEST') {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (activeTab?.id) {
            try {
              const resp = await chrome.tabs.sendMessage(activeTab.id, { type: 'SCAN_CHATS_REQUEST' });
              sendResponse(resp);
            } catch (tabErr) {
              sendResponse({ success: false, error: 'Could not communicate with Messenger tab' });
            }
          } else {
            sendResponse({ success: false, error: 'No active tab found' });
          }
        } else if (message.type === 'REJECT_DRAFT') {
          await setPendingDraft(null);
          await setBotStatus('idle');
          await addLog({
            type: 'error',
            threadName: message.threadId,
            message: 'Draft rejected by user.',
          });
          sendResponse({ success: true });
        }
      } catch (err: any) {
        console.error('[Social Auto-Chat AI] Error in background message listener:', err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep channel open
  });

  /**
   * Filters and buffers incoming messages with a coalescing debounce
   */
  async function handleNewIncomingMessages(
    thread: ChatThread,
    messages: ChatMessage[],
    tabId?: number
  ) {
    const settings = await getSettings();

    // Check if bot is disabled
    if (settings.botMode === 'disabled') {
      return;
    }

    // Check targeting logic
    const isTargeted =
      settings.targetAllContacts ||
      settings.targetContacts.includes(thread.id) ||
      settings.targetContacts.some((c) =>
        thread.name.toLowerCase().includes(c.toLowerCase())
      );

    if (!isTargeted) {
      console.log(`[Social Auto-Chat AI] Skipping thread ${thread.name} (not targeted)`);
      return;
    }

    // Check if last message is from 'them'
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.sender !== 'them') {
      return;
    }

    await setCurrentThread(thread);

    // Cancel existing coalescing timer for this thread if one is running
    if (coalescingTimers.has(thread.id)) {
      clearTimeout(coalescingTimers.get(thread.id)!);
    }

    await setBotStatus('coalescing');
    await addLog({
      type: 'coalescing',
      threadName: thread.name,
      message: `Received: "${lastMessage.text}". Waiting ${settings.safety.coalesceDelayMs / 1000}s for consecutive messages...`,
    });

    // Start coalescing timer
    const timerId = setTimeout(async () => {
      coalescingTimers.delete(thread.id);
      await executeGenerationAndReply(thread, messages, tabId);
    }, settings.safety.coalesceDelayMs) as unknown as number;

    coalescingTimers.set(thread.id, timerId);
  }

  /**
   * Calls the active LLM Provider with assembled prompt and history, then injects or requests approval
   */
  async function executeGenerationAndReply(
    thread: ChatThread,
    messages: ChatMessage[],
    tabId?: number
  ) {
    const settings = await getSettings();
    await setBotStatus('thinking');

    const activeProvider = settings.activeProvider || 'agentrouter';
    const activeConfig =
      settings.providers?.[activeProvider] ||
      settings.providers?.agentrouter ||
      settings.router;

    const providerName = activeConfig.name || activeProvider.toUpperCase();

    await addLog({
      type: 'thinking',
      threadName: thread.name,
      message: `Analyzing conversation vibe & generating reply via ${providerName} (${activeConfig.model})...`,
    });

    try {
      const systemPrompt = buildSystemPrompt(settings.persona, thread, messages);
      const formattedHistory = formatChatHistoryForLLM(messages);

      const generatedReply = await generateChatReply({
        provider: activeProvider,
        config: activeConfig,
        systemPrompt,
        messages: formattedHistory,
        onFallback: async (oldModel, newModel, reason) => {
          await addLog({
            type: 'coalescing',
            threadName: thread.name,
            message: `⚠️ ${oldModel} failed${reason ? ` (${reason})` : ''}. Auto-switching to ${newModel}...`,
          });
        },
      });

      await addLog({
        type: 'generated',
        threadName: thread.name,
        message: `Generated response: "${generatedReply}"`,
      });

      // Target tab resolution
      let targetTabId = tabId;
      if (!targetTabId) {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        targetTabId = activeTab?.id;
      }

      if (settings.botMode === 'autopilot') {
        await setBotStatus('typing');
        await addLog({
          type: 'typing',
          threadName: thread.name,
          message: `Simulating human typing (~${settings.safety.typingSpeedWpm} WPM)...`,
        });

        if (targetTabId) {
          await chrome.tabs.sendMessage(targetTabId, {
            type: 'INJECT_TYPING_PAYLOAD',
            text: generatedReply,
            autoSend: true,
          });
        }

        await setBotStatus('idle');
        await addLog({
          type: 'sent',
          threadName: thread.name,
          message: `Successfully replied to ${thread.name}: "${generatedReply}"`,
        });
      } else {
        // Manual approval mode: store draft and inject into input box without sending
        await setBotStatus('waiting_approval');
        await setPendingDraft({
          threadId: thread.id,
          threadName: thread.name,
          text: generatedReply,
        });

        if (targetTabId) {
          await chrome.tabs.sendMessage(targetTabId, {
            type: 'INJECT_TYPING_PAYLOAD',
            text: generatedReply,
            autoSend: false,
          });
        }

        await addLog({
          type: 'approval_required',
          threadName: thread.name,
          message: `Draft ready in input box. Click 'Approve' to send or edit manually.`,
        });
      }
    } catch (err: any) {
      await setBotStatus('error');
      await addLog({
        type: 'error',
        threadName: thread.name,
        message: `Generation failed: ${err.message}`,
      });
    }
  }

  /**
   * Sets up declarativeNetRequest rules for spoofing required headers for AgentRouter & OpenRouter
   */
  async function setupProviderHeadersRules() {
    if (!chrome.declarativeNetRequest || !chrome.declarativeNetRequest.updateDynamicRules) {
      return;
    }
    try {
      const AGENTROUTER_RULE_ID = 1001;
      const OPENROUTER_RULE_ID = 1002;

      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [AGENTROUTER_RULE_ID, OPENROUTER_RULE_ID],
        addRules: [
          {
            id: AGENTROUTER_RULE_ID,
            priority: 1,
            action: {
              type: 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType,
              requestHeaders: [
                {
                  header: 'Originator',
                  operation: 'set' as chrome.declarativeNetRequest.HeaderOperation,
                  value: 'codex_cli_rs',
                },
                {
                  header: 'User-Agent',
                  operation: 'set' as chrome.declarativeNetRequest.HeaderOperation,
                  value: 'codex_cli_rs/0.149.1',
                },
              ],
            },
            condition: {
              urlFilter: '||agentrouter.org',
              resourceTypes: [
                'xmlhttprequest' as chrome.declarativeNetRequest.ResourceType,
                'other' as chrome.declarativeNetRequest.ResourceType,
              ],
            },
          },
          {
            id: OPENROUTER_RULE_ID,
            priority: 1,
            action: {
              type: 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType,
              requestHeaders: [
                {
                  header: 'HTTP-Referer',
                  operation: 'set' as chrome.declarativeNetRequest.HeaderOperation,
                  value: 'https://github.com/shahmdmahi15/social-chatbot',
                },
                {
                  header: 'X-Title',
                  operation: 'set' as chrome.declarativeNetRequest.HeaderOperation,
                  value: 'Social Auto-Chat AI',
                },
              ],
            },
            condition: {
              urlFilter: '||openrouter.ai',
              resourceTypes: [
                'xmlhttprequest' as chrome.declarativeNetRequest.ResourceType,
                'other' as chrome.declarativeNetRequest.ResourceType,
              ],
            },
          },
        ],
      });
    } catch (err) {
      console.warn('[Social Auto-Chat AI] Failed to setup declarativeNetRequest rules:', err);
    }
  }
});
