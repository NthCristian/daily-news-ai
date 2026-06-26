# AINews

AI-powered daily news digest delivered straight to Telegram. Fetches RSS feeds from multiple news sources, summarizes them using an LLM, and broadcasts a curated, Portuguese-language briefing to subscribers.

> **Stack:** TypeScript · Bun · OpenAI API · Grammy · Telegram Bot API · GitHub Actions

---

## Features

- **Multi-source RSS ingestion** — Aggregates feeds from G1, BBC, Hacker News, Wired, and other outlets
- **LLM-powered summarization** — Each article is condensed into a 1–3 sentence Portuguese summary and categorized
- **Smart categorization** — Articles are grouped into Technology, Politics, Brazil's Technology, and Brazil's Politics
- **Telegram delivery** — Formatted HTML messages sent directly to subscribers with automatic 4096-character chunking
- **Subscription management** — Telegram bot handles `/start`, `/subscribe`, and `/unsubscribe` commands
- **Daily automation** — GitHub Actions cron job runs the broadcast every day at 9:00 AM BRT
- **Graceful error handling** — Skips broken feeds, handles missing subscribers, and provides detailed console logs

---

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│  RSS Feeds   │────▶│  NewsFetcher     │────▶│  NewsSummarizer      │
│  (G1, BBC…)  │     │  (raw XML)       │     │  (LLM → JSON)        │
└──────────────┘     └──────────────────┘     └──────────┬───────────┘
                                                         │
                                                         ▼
┌──────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│  Telegram    │◀────│  MessageBroad-   │◀────│  MessageFormatter    │
│  Subscribers │     │  caster          │     │  (HTML + chunking)   │
└──────────────┘     └──────────────────┘     └──────────────────────┘
```

### Modules

| Module        | Path            | Responsibility                                                                                               |
| ------------- | --------------- | ------------------------------------------------------------------------------------------------------------ |
| **AI Client** | `lib/ai/`       | Shared OpenAI-compatible API wrapper with configurable base URL, model, and API key                          |
| **News**      | `lib/news/`     | RSS feed fetching, truncation, and LLM summarization into structured JSON                                    |
| **Telegram**  | `lib/telegram/` | Bot (`grammy`), subscription manager (file-based JSON), message formatter (HTML + chunking), and broadcaster |
| **CLI**       | `index.ts`      | Entry point with `bot` and `broadcast` subcommands                                                           |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- A Telegram bot token (from [@BotFather](https://t.me/BotFather))
- Access to an OpenAI-compatible LLM API (model name, base URL, API key)

### Installation

```bash
git clone <repository-url>
cd AINews
bun install
```

### Environment Variables

Create a `.env` file or export the following variables:

| Variable             | Required | Default        | Description                                          |
| -------------------- | -------- | -------------- | ---------------------------------------------------- |
| `MODEL_NAME`         | Yes      | —              | LLM model identifier (e.g., `gpt-4o`, `gpt-4o-mini`) |
| `BASE_URL`           | No       | OpenAI default | LLM API base URL (set for OpenRouter, Azure, etc.)   |
| `API_KEY`            | Yes      | —              | LLM API key                                          |
| `TELEGRAM_BOT_TOKEN` | Yes      | —              | Telegram bot token from BotFather                    |

---

## Usage

### Start the Telegram Bot

```bash
bun index.ts bot
```

The bot polls Telegram for commands:

- `/start` — Introduction and available commands
- `/subscribe` — Opt in to daily news broadcasts
- `/unsubscribe` — Opt out from daily news broadcasts

Subscriptions persist to `subscription.json` in the project root.

### Run a Broadcast

```bash
bun index.ts broadcast
```

Fetches the latest RSS feeds, summarizes via LLM, and sends the digest to all subscribers. Skips the API calls gracefully if no one is subscribed.

---

## GitHub Actions

The included workflow (`.github/workflows/daily-broadcast.yml`) runs the broadcast automatically:

- **Schedule:** Every day at 9:00 AM Brasília time (12:00 UTC)
- **Manual trigger:** `workflow_dispatch` in the Actions tab
- **Secrets required:** `MODEL_NAME`, `BASE_URL`, `API_KEY`, `TELEGRAM_BOT_TOKEN`

### Setting Up Secrets

1. Go to your repository on GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Add each secret:
    - `MODEL_NAME`
    - `BASE_URL` (if using a custom endpoint)
    - `API_KEY`
    - `TELEGRAM_BOT_TOKEN`

---

## Project Structure

```
AINews/
├── .github/
│   └── workflows/
│       └── daily-broadcast.yml    # Scheduled news broadcast
├── lib/
│   ├── ai/
│   │   ├── config.ts              # LLM configuration
│   │   └── api-client.ts          # Shared OpenAI client wrapper
│   ├── news/
│   │   ├── config.ts              # RSS feed URLs & limits
│   │   ├── types.ts               # NewsItem, SummarizedNews types
│   │   ├── news-fetcher.ts        # RSS feed downloader
│   │   └── news-summarizer.ts     # LLM-based summarization
│   └── telegram/
│       ├── config.ts              # Bot token & file paths
│       ├── types.ts               # SubscriptionList type
│       ├── bot.ts                 # Grammy bot (commands)
│       ├── subscription-manager.ts # JSON-based subscriber CRUD
│       ├── message-formatter.ts   # HTML formatting + chunking
│       └── message-broadcaster.ts # Sends messages to all subscribers
├── index.ts                       # CLI entry point
├── package.json
├── tsconfig.json
└── README.md
```

---

## Design Decisions

| Decision                    | Rationale                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| **Bun runtime**             | Native TypeScript, fast startup, ESM-first                                                |
| **Constructor injection**   | All dependencies (API client, subscription manager) are injectable for testability        |
| **File-based persistence**  | `subscription.json` avoids database setup; sufficient for small user bases                |
| **Message chunking**        | Telegram enforces a 4096 UTF-8 character limit; messages are split at category boundaries |
| **HTML entity escaping**    | Prevents formatting corruption from auto-resolved HTML entities                           |
| **Early exit on broadcast** | Skips LLM API calls when there are zero subscribers, saving cost and time                 |
