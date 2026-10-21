import type { ChatMessage, ChatThread } from '../types';

/**
 * Finds the currently active chat's thread info from Messenger DOM and URL.
 */
export function getActiveChatThread(): ChatThread | null {
  // 1. Thread ID from URL
  const match = window.location.pathname.match(/\/t\/([0-9a-zA-Z._-]+)/);
  const threadId = match ? match[1] : 'unknown';

  // 2. Contact Name from Chat Header
  let name = '';

  // Look in the active header of the main chat area
  const mainArea = document.querySelector('[role="main"]') || document.body;
  
  // Strategy A: Header title or link
  const headerNameEl = mainArea.querySelector<HTMLElement>(
    'header h1, header h2, header [role="heading"], [role="banner"] [role="heading"], header a[role="link"] span, div[class*="x14vqqas"] span'
  );
  if (headerNameEl && headerNameEl.textContent?.trim()) {
    name = headerNameEl.textContent.trim();
  }

  // Strategy B: Left sidebar active item
  if (!name) {
    const activeSidebarItem = document.querySelector<HTMLElement>(
      '[role="navigation"] [role="row"][aria-selected="true"], [role="navigation"] a[aria-current="page"] span, [role="navigation"] a[href*="/t/' + threadId + '"] span'
    );
    if (activeSidebarItem && activeSidebarItem.textContent?.trim()) {
      name = activeSidebarItem.textContent.trim();
    }
  }

  if (!name && threadId !== 'unknown') {
    name = `Chat (${threadId})`;
  }

  if (!name && threadId === 'unknown') {
    return null;
  }

  return {
    id: threadId,
    name: name || 'Active Conversation',
    lastActive: Date.now(),
    isTargeted: false,
  };
}

/**
 * Finds the message input textbox in Messenger.
 */
export function getMessageInputElement(): HTMLElement | null {
  const mainArea = document.querySelector('[role="main"]') || document.body;

  // Messenger uses role="textbox" with contenteditable="true"
  const input = mainArea.querySelector<HTMLElement>(
    'div[role="textbox"][contenteditable="true"]'
  );
  if (input) return input;

  // Fallbacks
  return document.querySelector<HTMLElement>(
    'div[contenteditable="true"][aria-label*="Message"], div[contenteditable="true"][aria-label*="মেসেজ"]'
  );
}

/**
 * Extracts recent messages from the active chat window.
 */
export function extractRecentMessages(limit = 15): ChatMessage[] {
  const mainArea = document.querySelector('[role="main"]') || document.body;
  const messages: ChatMessage[] = [];

  // Find message elements. In Facebook, text is placed in dir="auto" containers inside the message area.
  // We look for text nodes inside the conversation viewport
  const messageNodes = Array.from(
    mainArea.querySelectorAll<HTMLElement>('div[dir="auto"], span[dir="auto"]')
  );

  const mainRect = mainArea.getBoundingClientRect();
  const mainCenter = mainRect.left + mainRect.width / 2;

  // Filter out headers, placeholders, timestamps, or system info
  const validTextNodes: { el: HTMLElement; text: string; isMe: boolean }[] = [];

  for (const node of messageNodes) {
    const text = node.innerText?.trim();
    if (!text) continue;

    // Skip input placeholder or status text
    if (text === 'Aa' || text === 'Message...' || text === 'মেসেজ...') continue;
    if (node.closest('[role="textbox"]') || node.closest('[role="navigation"]')) continue;

    const rect = node.getBoundingClientRect();
    // Exclude zero-dimension or off-screen elements
    if (rect.width === 0 || rect.height === 0 || rect.bottom < 0) continue;

    // Determine outgoing ('me') vs incoming ('them') based on horizontal position relative to main area center
    // In Messenger web, outgoing bubbles are aligned to the right half; incoming to the left half
    const isMe = rect.left > mainCenter - 40;

    validTextNodes.push({ el: node, text, isMe });
  }

  // De-duplicate nested elements (e.g. child span inside parent div)
  const deduped: { text: string; isMe: boolean }[] = [];
  for (let i = 0; i < validTextNodes.length; i++) {
    const current = validTextNodes[i];
    // If next element contains current text or is identical, skip
    const isDuplicate = deduped.length > 0 && deduped[deduped.length - 1].text === current.text;
    if (!isDuplicate) {
      deduped.push({ text: current.text, isMe: current.isMe });
    }
  }

  // Return last N messages
  const sliced = deduped.slice(-limit);
  for (let i = 0; i < sliced.length; i++) {
    const item = sliced[i];
    messages.push({
      id: `msg-${i}-${Date.now()}`,
      sender: item.isMe ? 'me' : 'them',
      senderName: item.isMe ? 'You' : 'Friend',
      text: item.text,
      timestamp: Date.now() - (sliced.length - i) * 60000,
    });
  }

  return messages;
}

/**
 * Returns true if the user is currently on Messenger or Facebook Messages.
 */
export function isMessengerUrl(): boolean {
  const host = window.location.hostname;
  const path = window.location.pathname;
  return host.includes('messenger.com') || (host.includes('facebook.com') && path.includes('/messages'));
}
