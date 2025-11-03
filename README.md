# Mastra AI Summarizer & Translator

This is a **Mastra-based AI application** that uses **Google Gemini Flash** to **summarize** and **translate text** efficiently.  
The app is built using the **Mastra framework** and deployed to **Mastra Cloud**, making it accessible via a public **A2A (Agent-to-Agent)** endpoint.

---

## Features

- **AI Summarization:** Automatically summarizes long text into concise, clear statements.  
- **AI Translation:** Translates summarized text into multiple languages using **LibreTranslate API**.  
- ⚡ **Powered by Gemini Flash:** Uses Google’s `gemini-2.0-flash` model for fast and context-aware text generation.  
- **A2A Integration:** Can be connected directly to platforms like **Telex** for automation and workflows.  
- **Secure Configuration:** Uses environment variables for API key protection.

---

## How It Works

1. The app receives text input.
2. It generates a concise summary using **Google Gemini Flash**.
3. If a target language is provided, it translates the summary.
4. Returns a clean, structured response (summary + translation).

---

### Prerequisites

Make sure you have:

- **Node.js** (version 18 or newer)
- **npm** (comes with Node.js)
- A **Google API Key** for Gemini access
- (Optional) Mastra Cloud account for deployment

---

### 1. Clone the Repository

```bash
git clone https://github.com/Kessi-ux/summarizerTranslatorAgent.git
cd [summarizerTranslatorAgent]

```
# 2. Install Dependencies

``` bash
npm install
```
# 3. Set Up Environment Variables

Create a file named .env in your project root:

```bash
GEMINI_API_KEY
GEMINI_MODEL
```
The .env file is used to load your API key securely during runtime.

# 4. Run the App Locally
``` bash
npm run dev
```

Once running, visit:

``` bash
 Playground: http://localhost:4112/
│ API:        http://localhost:4112/api
```