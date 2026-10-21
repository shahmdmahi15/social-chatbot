import type { ChatLanguage } from '../types';

// Common Banglish phonetic markers & vocabulary
const BANGLISH_KEYWORDS = new Set([
  'kemon', 'acho', 'aso', 'achen', 'ki', 'khobor', 'obstha', 'obostha',
  'bhai', 'bro', 'dost', 'mama', 'apu', 'vai', 'vaiya',
  'kothay', 'kothaye', 'kobe', 'keno', 'kemne', 'kivabe', 'kno', 'knoo',
  'ami', 'tumi', 'tui', 'apni', 'amra', 'tomra', 'oder', 'amader', 'tomader',
  'achi', 'asi', 'aso', 'achen', 'chilam', 'thakbo', 'thako',
  'korchi', 'korsi', 'korbo', 'koro', 'koren', 'korlam',
  'jabo', 'jaschi', 'jacchi', 'gelam', 'gesilam', 'ashbo', 'ashi', 'aschi',
  'ha', 'haa', 'na', 'naa', 'thik', 'accha', 'achha', 'acha',
  'valoi', 'valo', 'bhalo', 'kharap', 'shun', 'shono', 'bolo', 'boltechi',
  'ekhon', 'ekhn', 'pore', 'ajke', 'kalke', 'shokal', 'raat', 'shondha',
  'dekha', 'hobe', 'hoise', 'hoiche', 'hoyeche', 'hoyni', 'parbo', 'parbona',
  'jan', 'jaan', 'valobashi', 'valobasho', 'valobasbe', 'ailabiu', 'babu', 'priyo', 'mon', 'shona', 'kew'
]);

export function detectLanguage(text: string): ChatLanguage {
  if (!text || text.trim().length === 0) return 'english';

  // 1. Check for Bengali Unicode script (\u0980 - \u09FF)
  const bengaliCharMatch = text.match(/[\u0980-\u09FF]/g);
  const totalChars = text.replace(/\s+/g, '').length;
  
  if (bengaliCharMatch && (bengaliCharMatch.length / totalChars) > 0.25) {
    return 'bangla';
  }

  // 2. Normalize and tokenize text for Banglish detection
  const words = text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'0-9]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);

  if (words.length === 0) return 'english';

  let banglishMatchCount = 0;
  for (const word of words) {
    if (BANGLISH_KEYWORDS.has(word)) {
      banglishMatchCount++;
    } else {
      // Check common suffixes like -techi, -tesi, -bo, -lam, -chi
      if (/(techi|tesi|lam|si|chi|bo|ben|ish)$/.test(word) && word.length >= 4) {
        banglishMatchCount += 0.8;
      }
    }
  }

  const banglishRatio = banglishMatchCount / words.length;

  if (banglishRatio >= 0.25 || banglishMatchCount >= 2) {
    return 'banglish';
  }

  // 3. Check for mixed
  if (bengaliCharMatch && bengaliCharMatch.length > 0) {
    return 'mixed';
  }

  return 'english';
}

export function detectThreadLanguage(messages: { text: string }[]): ChatLanguage {
  if (!messages || messages.length === 0) return 'english';

  const recent = messages.slice(-8); // Inspect last 8 messages
  let banglaCount = 0;
  let banglishCount = 0;
  let englishCount = 0;

  for (const msg of recent) {
    const lang = detectLanguage(msg.text);
    if (lang === 'bangla') banglaCount++;
    else if (lang === 'banglish') banglishCount++;
    else if (lang === 'mixed') { banglishCount += 0.5; banglaCount += 0.5; }
    else englishCount++;
  }

  if (banglaCount >= 3 || banglaCount > englishCount && banglaCount > banglishCount) {
    return 'bangla';
  }
  if (banglishCount >= 2 || banglishCount > englishCount) {
    return 'banglish';
  }
  if (banglishCount > 0 && englishCount > 0) {
    return 'mixed';
  }
  return 'english';
}
