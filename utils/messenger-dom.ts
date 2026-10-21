import type { ChatMessage, ChatThread, DiscoveredContact } from '../types';

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
  const inputEl = getMessageInputElement();
  const messages: ChatMessage[] = [];

  // Calculate chat center based on the message input box
  // This is the most accurate reference because the input box spans exactly the conversation width
  let chatCenter = window.innerWidth / 2;
  let chatLeft = 0;
  let chatWidth = window.innerWidth;

  if (inputEl) {
    const inputRect = inputEl.getBoundingClientRect();
    chatLeft = inputRect.left;
    chatWidth = inputRect.width;
    chatCenter = inputRect.left + inputRect.width / 2;
  } else {
    const mainRect = mainArea.getBoundingClientRect();
    chatLeft = mainRect.left;
    chatWidth = mainRect.width;
    chatCenter = mainRect.left + mainRect.width / 2;
  }

  // Find message elements. In Facebook, text is placed in dir="auto" containers inside the message area.
  const messageNodes = Array.from(
    mainArea.querySelectorAll<HTMLElement>('div[dir="auto"], span[dir="auto"]')
  );

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

    // Must be horizontally within the chat column
    if (rect.right < chatLeft - 20) continue;

    // Strategy 1: Proximity to friend's avatar image (incoming bubbles always have the avatar on the left)
    const rowContainer = node.closest('[role="row"]') || node.closest('div[class*="x78zum5"]') || node.parentElement;
    const hasIncomingAvatar = rowContainer?.querySelector('img[alt], div[role="img"]') !== null &&
      rect.left < chatCenter;

    // Strategy 2: Horizontal alignment relative to the input box midpoint
    // Outgoing bubbles start past 42% of the input box width from the right
    const isMe = !hasIncomingAvatar && (rect.left > chatCenter - 25);

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
 * Automatically extracts the full list of contacts and conversations from Messenger's sidebar
 */
export function extractSidebarChatList(): DiscoveredContact[] {
  const contacts: DiscoveredContact[] = [];
  const seenIds = new Set<string>();

  // Look for chat links in sidebar/navigation
  const chatLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href*="/t/"]'));

  for (const link of chatLinks) {
    const href = link.getAttribute('href') || '';
    const match = href.match(/\/t\/([0-9a-zA-Z._-]+)/);
    if (!match) continue;

    const threadId = match[1];
    if (seenIds.has(threadId) || threadId === 'unknown') continue;

    let contactName = '';
    let avatarUrl: string | undefined = undefined;
    let snippet: string | undefined = undefined;

    // Strategy 1: Check img alt and src
    const imgEl = link.querySelector<HTMLImageElement>('img');
    if (imgEl) {
      avatarUrl = imgEl.src;
      const alt = imgEl.getAttribute('alt')?.trim();
      if (alt && !/profile photo|profile picture|story|avatar/i.test(alt)) {
        contactName = alt;
      }
    }

    // Strategy 2: Check text spans inside the link
    const textNodes = Array.from(link.querySelectorAll<HTMLElement>('span[dir="auto"], div[dir="auto"]'))
      .map((el) => el.innerText?.trim())
      .filter((t) => Boolean(t) && t.length > 0);

    if (textNodes.length > 0) {
      if (!contactName) {
        contactName = textNodes[0];
      }
      if (textNodes.length > 1) {
        // Find snippet that is not a short timestamp (e.g. not "10m", "1h", "2d")
        const candidateSnippet = textNodes.slice(1).find((t) => t !== contactName && !/^\d+[smhdw]$/i.test(t));
        if (candidateSnippet) {
          snippet = candidateSnippet;
        }
      }
    }

    // Fallback: aria-label on link or parent
    if (!contactName) {
      const aria = link.getAttribute('aria-label') || link.closest('[role="row"]')?.getAttribute('aria-label');
      if (aria) {
        contactName = aria.replace(/conversation with/i, '').replace(/chat with/i, '').trim();
      }
    }

    if (contactName && contactName.length > 0) {
      seenIds.add(threadId);
      contacts.push({
        id: threadId,
        name: contactName,
        avatarUrl,
        snippet,
        lastSeen: Date.now(),
      });
    }
  }

  return contacts;
}

/**
 * Returns true if the user is currently on Messenger or Facebook Messages.
 */
export function isMessengerUrl(): boolean {
  const host = window.location.hostname;
  const path = window.location.pathname;
  return host.includes('messenger.com') || (host.includes('facebook.com') && path.includes('/messages'));
}
