import type { PersonaConfig, ChatMessage, ChatThread } from '../types';
import { detectThreadLanguage } from './language-detector';

export function buildSystemPrompt(
  persona: PersonaConfig,
  thread: ChatThread,
  history: ChatMessage[]
): string {
  const detectedLanguage = persona.languagePreference === 'auto'
    ? detectThreadLanguage(history)
    : persona.languagePreference;

  let languageInstruction = '';
  switch (detectedLanguage) {
    case 'banglish':
      languageInstruction = `
- CRITICAL LANGUAGE RULE: The conversation is in BANGLISH (Bengali written with the English/Latin alphabet, e.g., "ki obstha bro", "kalke dekha hobe", "ami ektu busy chilam").
- You MUST reply strictly in authentic, natural Banglish.
- Match the spelling and tone of the other person (e.g., use words like "bhai/bro", "accha", "thik ache", "dekhi", "hobe").
- Do NOT use formal dictionary English unless they specifically switch.
- Do NOT use Bengali script Unicode unless they started writing in Bengali script.`;
      break;

    case 'bangla':
      languageInstruction = `
- CRITICAL LANGUAGE RULE: The conversation is in BANGLA (বাংলা হরফে লেখা).
- You MUST reply strictly in natural, friendly Bengali script (e.g., "এই তো ভাই, কী খবর তোমার?", "কালকে কথা বলি?").
- Avoid overly formal or archaic literary words (সাধু ভাষা পরিহার করো, চলিত ও কথ্য ভাষায় কথা বলো).`;
      break;

    case 'mixed':
      languageInstruction = `
- CRITICAL LANGUAGE RULE: The conversation is MIXED (Banglish + English or Bangla + English).
- Flow seamlessly between casual English and Banglish slang just like urban bilingual friends do (e.g. "Yeah bro, amio eita bhabtesilam. Let's do it!").`;
      break;

    case 'english':
    default:
      languageInstruction = `
- CRITICAL LANGUAGE RULE: The conversation is in ENGLISH.
- Reply in natural, casual conversational English suitable for Facebook Messenger.
- Use casual phrasing, contractions (I'm, don't, can't), and realistic texting flow.`;
      break;
  }

  const lengthInstruction = {
    short: 'Keep your reply very short and punchy (1 to 2 sentences max). Real people text in quick bites.',
    medium: 'Keep your reply natural (2 to 3 sentences max).',
    detailed: 'You may provide a thoughtful, complete answer (up to 4-5 sentences), but remain conversational.',
  }[persona.replyLength];

  const emojiInstruction = persona.useEmojis
    ? 'Feel free to use occasional friendly emojis (e.g., 😂, 🙌, 👍, 😅, ✌️, ❤️, 🖤), but do not overdo them.'
    : 'Do not use emojis; keep the text clean.';

  return `You are a personal conversational assistant writing natural chat replies on Facebook Messenger for conversations with "${thread.name}".

### TONE & PERSONALITY:
${persona.userPersona || 'Casual, friendly, warm, and authentic.'}

### USER'S CURRENT DIRECTIVE / GOAL:
${persona.customInstructions || 'Be warm, responsive, and match the vibe and closeness of the conversation.'}

${languageInstruction}

### CHATTING STYLE & FORMATTING RULES:
1. ${lengthInstruction}
2. ${emojiInstruction}
3. PERSPECTIVE: Write in the first-person singular ("I", "me", "ami", "amar") as the account owner chatting naturally with their contact. Match the recipient's familiarity, warmth, and vibe.
4. If the message is affectionate or familiar (e.g., "jan", "ailabiu", "kemon aso", "babu"), respond warmly, lovingly, or playfully in the same tone and dialect.
5. Never sound like a corporate customer support bot or AI assistant. Avoid phrases like "How can I help you?", "As an AI model...", or "Feel free to ask".
6. If the contact asks a personal question you don't have specifics for (e.g., "Where are you?", "Did you eat?"), give a casual, natural human response (e.g., "Wait, ektu busy achi, pore bolchi" or "ha ei matro").
7. Output ONLY the raw reply text to be sent in Messenger. Do NOT include markdown formatting, quotes around the text, or conversational prefixes like "Reply:".`;
}

export function formatChatHistoryForLLM(messages: ChatMessage[]): { role: 'user' | 'assistant'; content: string }[] {
  // Format history turns.
  // In Messenger:
  // 'them' (the friend) -> 'user' in LLM chat role
  // 'me' (the account owner) -> 'assistant' in LLM chat role
  const formattedTurns: { role: 'user' | 'assistant'; content: string }[] = [];

  for (const msg of messages) {
    const text = (msg.text || '').trim();
    if (!text) continue;

    const role: 'user' | 'assistant' = msg.sender === 'them' ? 'user' : 'assistant';

    // If consecutive messages have the same role, coalesce them with a newline
    // Many strict LLM providers (Anthropic, Responses API) disallow consecutive same-role turns
    const lastTurn = formattedTurns.length > 0 ? formattedTurns[formattedTurns.length - 1] : undefined;
    if (lastTurn && lastTurn.role === role) {
      lastTurn.content += `\n${text}`;
    } else {
      formattedTurns.push({ role, content: text });
    }
  }

  // Ensure conversation does not end on an assistant turn (many models reject finishing on assistant turn)
  const finalTurn = formattedTurns.length > 0 ? formattedTurns[formattedTurns.length - 1] : undefined;
  if (finalTurn && finalTurn.role === 'assistant') {
    formattedTurns.push({
      role: 'user',
      content: 'Please reply naturally and keep the conversation going.',
    });
  }

  // Fallback if no text extracted
  if (formattedTurns.length === 0) {
    formattedTurns.push({ role: 'user', content: 'Hi' });
  }

  return formattedTurns;
}
