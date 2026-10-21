import {
  getActiveChatThread,
  getMessageInputElement,
  extractRecentMessages,
  extractSidebarChatList,
  isMessengerUrl,
} from '../utils/messenger-dom';
import { simulateHumanTyping, injectTextInstantly, submitMessage } from '../utils/human-typing';
import { getSettings, saveDiscoveredContacts } from '../utils/storage';

export default defineContentScript({
  matches: ['*://*.facebook.com/*', '*://*.messenger.com/*'],
  runAt: 'document_idle',
  main() {
    if (!isMessengerUrl()) {
      return;
    }

    console.log('[Social Auto-Chat AI] Content script active on Messenger.');

    let currentThreadId: string | null = null;
    let lastSeenMessageText = '';
    let isTypingInProgress = false;

    // Periodically poll for chat switch or thread changes and scan sidebar contacts
    setInterval(async () => {
      // 1. Scan sidebar contacts automatically
      const sidebarContacts = extractSidebarChatList();
      if (sidebarContacts.length > 0) {
        await saveDiscoveredContacts(sidebarContacts);
      }

      // 2. Check active thread switch
      const activeThread = getActiveChatThread();
      if (!activeThread) return;

      if (activeThread.id !== currentThreadId) {
        currentThreadId = activeThread.id;
        const messages = extractRecentMessages(10);
        if (messages.length > 0) {
          lastSeenMessageText = messages[messages.length - 1].text;
        }

        try {
          chrome.runtime.sendMessage({
            type: 'CHAT_SWITCHED',
            thread: activeThread,
          });
        } catch {
          // SW might be temporarily inactive
        }
      }
    }, 1500);

    // MutationObserver to catch incoming messages in real-time
    const observer = new MutationObserver(async (mutations) => {
      if (isTypingInProgress) return;

      const activeThread = getActiveChatThread();
      if (!activeThread) return;

      const messages = extractRecentMessages(15);
      if (messages.length === 0) return;

      const latest = messages[messages.length - 1];

      // Only trigger if the latest message is from the other person ('them')
      // and it's different from the last seen text
      if (latest.sender === 'them' && latest.text !== lastSeenMessageText) {
        lastSeenMessageText = latest.text;

        try {
          chrome.runtime.sendMessage({
            type: 'NEW_MESSAGES_DETECTED',
            thread: activeThread,
            messages: messages,
          });
        } catch (err) {
          console.error('[Social Auto-Chat AI] Failed to send message to background:', err);
        }
      }
    });

    const targetNode = document.querySelector('[role="main"]') || document.body;
    observer.observe(targetNode, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Listen for commands from Background Service Worker
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      (async () => {
        if (message.type === 'INJECT_TYPING_PAYLOAD') {
          const inputEl = getMessageInputElement();
          if (!inputEl) {
            sendResponse({ success: false, error: 'Could not find message input box' });
            return;
          }

          const settings = await getSettings();
          isTypingInProgress = true;

          try {
            if (message.autoSend) {
              // Simulate real human typing at configured WPM
              await simulateHumanTyping(inputEl, message.text, {
                wpm: settings.safety.typingSpeedWpm || 60,
                addJitter: settings.safety.humanJitter ?? true,
              });

              // Submit the message
              await new Promise((r) => setTimeout(r, 400));
              await submitMessage(inputEl);
            } else {
              // Manual approval: inject immediately into input box for review
              injectTextInstantly(inputEl, message.text);
            }

            sendResponse({ success: true });
          } catch (err: any) {
            sendResponse({ success: false, error: err.message });
          } finally {
            isTypingInProgress = false;
          }
        } else if (message.type === 'SCAN_CHATS_REQUEST') {
          const contacts = extractSidebarChatList();
          if (contacts.length > 0) {
            await saveDiscoveredContacts(contacts);
          }
          sendResponse({ success: true, contacts });
        } else if (message.type === 'TRIGGER_REPLY_NOW') {
          const activeThread = getActiveChatThread();
          const messages = extractRecentMessages(15);
          if (activeThread && messages.length > 0) {
            try {
              chrome.runtime.sendMessage({
                type: 'TRIGGER_FORCE_REPLY',
                thread: activeThread,
                messages: messages,
              });
              sendResponse({ success: true });
            } catch (err: any) {
              sendResponse({ success: false, error: err.message });
            }
          } else {
            sendResponse({ success: false, error: 'No active chat or messages detected' });
          }
        } else if (message.type === 'APPROVE_AND_SEND') {
          const inputEl = getMessageInputElement();
          if (inputEl) {
            await submitMessage(inputEl);
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'Input box not found' });
          }
        }
      })();
      return true; // keeps channel open for async response
    });
  },
});
