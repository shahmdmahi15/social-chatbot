export interface TypingSimulationOptions {
  wpm?: number; // words per minute (e.g. 55)
  addJitter?: boolean;
  onProgress?: (progress: number) => void;
}

/**
 * Calculates human-like typing delay for a character.
 */
function getCharDelay(wpm: number, addJitter: boolean): number {
  // Average word length is ~5 characters.
  // Delay per char in ms = (60,000 ms) / (WPM * 5)
  const baseDelay = 60000 / (Math.max(20, wpm) * 5);
  if (!addJitter) return baseDelay;

  // Jitter: gaussian-like random variation between 0.6x and 1.5x
  const jitter = 0.6 + Math.random() * 0.9;
  return Math.floor(baseDelay * jitter);
}

/**
 * Inserts text into Meta's Lexical/Draft.js contenteditable editor and optionally submits it.
 */
export async function simulateHumanTyping(
  inputElement: HTMLElement,
  text: string,
  options: TypingSimulationOptions = {}
): Promise<boolean> {
  const { wpm = 60, addJitter = true, onProgress } = options;

  if (!inputElement) return false;

  // 1. Focus the textbox
  inputElement.focus();
  await new Promise((r) => setTimeout(r, 150));

  // 2. Select existing text if any and clear
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(inputElement);
  selection?.removeAllRanges();
  selection?.addRange(range);

  // 3. Type character-by-character to trigger Facebook's typing indicators
  for (let i = 0; i < text.length; i++) {
    const char = text[i] || '';
    if (!char) continue;
    
    // Use document.execCommand to update Lexical state correctly
    const success = document.execCommand('insertText', false, char);
    if (!success) {
      // Fallback: Dispatch synthetic InputEvent
      const inputEvent = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: char,
      });
      inputElement.dispatchEvent(inputEvent);

      const textNode = document.createTextNode(char);
      inputElement.appendChild(textNode);

      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / text.length) * 100));
    }

    // Delay between keystrokes
    const delay = getCharDelay(wpm, addJitter);
    // Extra pause after punctuation (comma, period, question mark)
    const extraPause = /[.,?!]/.test(char) ? 120 + Math.random() * 200 : 0;
    await new Promise((r) => setTimeout(r, delay + extraPause));
  }

  return true;
}

/**
 * Fast text injection without character-by-character delay (e.g. for Manual Approval drafting)
 */
export function injectTextInstantly(inputElement: HTMLElement, text: string): boolean {
  if (!inputElement) return false;

  inputElement.focus();
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(inputElement);
  selection?.removeAllRanges();
  selection?.addRange(range);

  const success = document.execCommand('insertText', false, text);
  if (!success) {
    inputElement.innerText = text;
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
  return true;
}

/**
 * Dispatches Enter key or clicks Facebook Messenger send button to submit the message
 */
export async function submitMessage(inputElement: HTMLElement): Promise<boolean> {
  if (!inputElement) return false;

  inputElement.focus();
  await new Promise((r) => setTimeout(r, 100));

  // 1. Dispatch Enter keydown and keyup events
  const enterEventDown = new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  });

  const enterEventUp = new KeyboardEvent('keyup', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true,
  });

  inputElement.dispatchEvent(enterEventDown);
  inputElement.dispatchEvent(enterEventUp);

  // 2. Fallback: Search for the send button near the input container
  await new Promise((r) => setTimeout(r, 150));
  const container = inputElement.closest('[role="main"]') || document.body;
  const sendButton = container.querySelector<HTMLElement>(
    'div[role="button"][aria-label*="Send"], div[role="button"][aria-label*="Press enter to send"], [aria-label*="Send message"]'
  );

  if (sendButton) {
    sendButton.click();
    return true;
  }

  return true;
}
