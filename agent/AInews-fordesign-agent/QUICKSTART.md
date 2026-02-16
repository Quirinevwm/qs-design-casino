# Quick start guide

## Setup (do this once)

1. **Get Azure AI Foundry credentials**:
   - Go to https://ai.azure.com/ (or your Azure portal)
   - Create or select an AI Foundry resource
   - Get your endpoint URL and API key
   - Note: Endpoint should look like `https://your-resource.openai.azure.com/openai/v1/`

2. **Get Teams webhook**:
   - In Microsoft Teams, go to the channel where you want notifications
   - Click the three dots (...) next to the channel name
   - Select "Workflows" or "Connectors"
   - Search for and add "Incoming Webhook"
   - Give it a name like "AI News Digest"
   - Copy the webhook URL

3. **Configure environment**:
   ```bash
   cd ~/Qcode/smol-news-agent
   cp .env.example .env
   # Edit .env and add your credentials
   ```

4. **Test it**:
   ```bash
   pnpm run digest
   ```

This will scrape news.smol.ai, analyze with AI, and send top 3 design insights to Teams!

## Run daily

To run automatically every day at 9am:
```bash
pnpm start
```

Keep this running in the background (or deploy to Azure Functions for serverless execution).

## What you'll get

Teams messages with 3 insights like:

**1. Multi-model orchestration patterns emerging**
_Technical context about GPT-5.3-Codex + Claude Opus 4.6_
💡 **Design implications**: Portal interfaces should support model selection dropdowns and orchestration configs...

**2. Agent swarm architectures scaling to 100+ sub-agents**
_Details about parallel execution improvements_
💡 **Design implications**: CLI output needs to handle concurrent agent status, consider TUI frameworks...

**3. Context window optimizations enabling new UX patterns**
_200K context support details_
💡 **Design implications**: Design for longer conversation histories, pagination vs. infinite scroll tradeoffs...
