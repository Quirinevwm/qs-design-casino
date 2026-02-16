# Smol news agent: where AI intelligence meets design insight

Daily digest agent that analyzes AI engineering news through a design lens. Fetches updates from news.smol.ai, extracts top 3 insights about agents and models, and delivers them with focus on how they influence portal and CLI design.

## Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Azure AI Foundry credentials and Slack/Teams webhook
   ```

3. **Test the digest**:
   ```bash
   pnpm run digest
   ```

4. **Run with scheduler**:
   ```bash
   pnpm start
   ```

## Architecture

- **Scraper** - Fetches and parses news.smol.ai content
- **AI analyzer** - Uses Azure AI Foundry models to extract design-relevant insights
- **Notifier** - Sends formatted digests to Slack/Teams
- **Scheduler** - Runs daily at configured time

## Configuration

See `.env.example` for all available environment variables.

### Azure AI Foundry setup

Get your API key from Azure AI Foundry portal and configure the endpoint and model in `.env`.

### Teams webhook setup

1. In Teams, go to your channel and click the three dots menu
2. Select "Connectors" or "Workflows" 
3. Add an "Incoming Webhook"
4. Give it a name and upload an icon (optional)
5. Copy the webhook URL to your `.env`

## Development

```bash
pnpm run dev      # Watch mode
pnpm run build    # Compile TypeScript
pnpm run digest   # Run digest once (no scheduler)
```

## What it delivers

Top 3 daily insights focused on:
- AI agent architectures and capabilities
- Model training and inference improvements
- Design implications for portals, CLIs, and developer tools

Each insight includes context and practical implications for building intelligent interfaces.
