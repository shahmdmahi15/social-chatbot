# Social Auto-Chat AI 💬🤖
### Real-Time Autonomous Facebook Messenger Assistant with Multilingual & Banglish Intelligence

An autonomous, human-simulated Chrome Extension (Manifest V3) that impersonates you on Facebook Messenger in real-time using your **Agent Router / OpenRouter** API key.

Designed with a modern Side Panel UI, granular contact targeting, rapid message coalescing, anti-detection typing simulation, and native support for **English**, **Bangla (বাংলা)**, and **Banglish (Phonetic Bengali)**.

---

## ✨ Key Features

- **Side Panel Interface (`chrome.sidePanel`)**: Stays open beside your Messenger tab without resetting or closing when clicking on the webpage.
- **Selective Contact Targeting**: Select specific contacts or thread IDs from the Side Panel to whitelist who the bot replies to, or toggle all chats.
- **Multilingual & Banglish Adaptation**:
  - **Banglish (Phonetic English alphabet)**: Detects and speaks authentic Banglish (e.g., *"ki obstha bro, kemon acho"*, *"ei to bhalo, tui kemon achis?"*, *"accha pore call dicchi"*).
  - **Bangla (বাংলা)**: Detects and replies in Bengali script.
  - **English**: Casual texting flow.
  - **Mixed / Bilingual**: Natural code-switching between languages.
- **Live Persona & Directive Command Box**: Give instructions on the fly (e.g. *"Tell him I'm in a meeting right now and will meet at 8 PM, don't agree to coffee"*).
- **Message Burst Coalescing**: Debounces rapid incoming messages (4.5s buffer) so the bot responds to the whole idea rather than each single word bubble.
- **Human Typing Simulation**: Realistic typing with WPM calculation, keystroke jitter, and punctuation pauses that activate Facebook's live *"typing..."* indicator.
- **Safety Modes**:
  - ⚡ **Auto-Pilot Mode**: Fully autonomous reply generation and sending.
  - 🛡️ **Review First (Manual Approval) Mode**: Generates the reply and injects it into Messenger's chat box, allowing you to review or edit before hitting Send.
  - 🛑 **Off / Kill-Switch**: Pauses all automation instantly.
- **Universal LLM Router Support**: Works with OpenRouter or any custom OpenAI-compatible Agent Router endpoint (Gemini 2.5 Flash, Claude 3.5 Sonnet, GPT-4o Mini, DeepSeek, etc.).

---

## 🛠️ Tech Stack

- **Framework**: [WXT](https://wxt.dev/) (Next-Gen Web Extension Framework built on Vite)
- **UI & Styling**: React 19, Tailwind CSS v4, Lucide Icons
- **Language**: TypeScript (Strict type safety)
- **Architecture**: Chrome Manifest V3 (Side Panel + Background Service Worker + Content Script)
- **Package Manager**: `pnpm`

---

## 🚀 Quick Start Guide

### 1. Build the Extension
```bash
# Clone the repository
git clone https://github.com/shahmdmahi15/social-chatbot.git
cd social-chatbot

# Install dependencies with pnpm
pnpm install

# Build for Chrome (creates .output/chrome-mv3)
pnpm run build

# Or create a production zip
pnpm run zip
```

### 2. Load into Google Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked** in the top-left.
4. Select the `.output/chrome-mv3` folder inside this repository.
5. The extension **Social Auto-Chat AI (Messenger Agent)** is now installed!

---

## ⚙️ How to Setup with Agent Router / OpenRouter

1. Click the **Social Auto-Chat AI** puzzle icon in your Chrome toolbar to open the **Side Panel**.
2. Click the **Settings** tab.
3. Configure your API credentials:
   - **API Base URL**: `https://openrouter.ai/api/v1` (or your custom router endpoint).
   - **API Key**: Paste your Agent Router or OpenRouter key (`sk-or-v1-...`).
   - **LLM Model**: Select a recommended model (e.g. `google/gemini-2.5-flash` for high speed & low cost, or `anthropic/claude-3.5-sonnet` for nuanced humor and conversational warmth).
4. Click **Test API Key Connection** to verify your setup.
5. Configure your preferred **Coalescing Buffer** (default 4.5s) and **Typing Speed** (default 60 WPM).

---

## 💬 How to Use on Facebook Messenger

1. Navigate to [messenger.com](https://www.messenger.com/) or [facebook.com/messages](https://www.facebook.com/messages).
2. Click on the chat conversation with the friend you want to chat with.
3. Open the extension Side Panel:
   - In the **Monitor** tab, you will see the detected conversation name.
   - Click **Target Chat** to whitelist this person.
4. Go to the **Persona & Lang** tab:
   - Set the language strategy (select **Auto-Detect** or **Banglish Only**).
   - In the **Live Directive / Command Box**, type instructions for what the AI should do (e.g. *"Act chill. Tell him I'm studying for tomorrow's exam, but we can play games later"*).
5. Choose your mode at the top:
   - Start with **Review First** mode to inspect the drafted responses.
   - Switch to **Auto-Pilot** when you are confident and want the bot to converse autonomously.
6. Open the **Logs** tab anytime to inspect live timestamps, reasoning steps, and sent messages.

---

## 🛡️ Anti-Detection Best Practices
- Keep your **Coalescing Buffer** between 3.5s and 6.0s.
- Keep **Human Keystroke Jitter** enabled.
- Avoid setting typing speeds above 80 WPM to prevent robotic behavior.
- Use **Review First** mode whenever discussing sensitive or financial matters.

---

## 📜 License
MIT License. Created by [shahmdmahi15](https://github.com/shahmdmahi15).
