# AI Client Integration Guide

Aurex Advisor is an MCP (Model Context Protocol) server that can connect to 9+ AI assistants. This guide shows you how to integrate with each supported client.

---

## Quick Start

1. **Start the Advisor**:
   ```bash
   cd apps/advisor
   pnpm install
   pnpm dev
   ```
   The Advisor will run on `http://localhost:3100`

2. **Choose your AI client** from the list below and follow the setup instructions

3. **Use the tools**: All clients get access to these MCP tools:
   - `advisor.market_status` — Current market overview + active signals
   - `advisor.get_strategy` — Structured market context for AI reasoning
   - `advisor.publish_signal` — Manually trigger signal publication
   - `advisor.risk_check` — Portfolio risk analysis
   - `advisor.behavior_alert` — Behavioral anomaly warnings
   - `advisor.publisher_stats` — Publishing accuracy + revenue stats
   - `advisor.configure` — Update Advisor settings
   - `advisor.execute` — Execute trades via wallet
   - `advisor.confirm_execution` — Confirm pending executions

---

## Supported Clients

### 1. Claude Code (Anthropic CLI)

**Transport**: stdio  
**Best for**: Command-line AI workflows

#### Setup

1. Install Claude Code (if not already installed):
   ```bash
   # Follow instructions at https://github.com/anthropics/claude-code
   ```

2. Add to your Claude Code MCP settings (`~/.claude/settings.json`):
   ```json
   {
     "mcpServers": {
       "aurex-advisor": {
         "command": "npx",
         "args": ["-y", "@aurex/advisor"],
         "env": {
           "AUREX_RPC_URL": "https://rpc.xlayer.tech",
           "AUREX_CHAIN_ID": "196"
         }
       }
     }
   }
   ```

3. Restart Claude Code

4. Test: Ask Claude "What's the current market status on Aurex?"

---

### 2. Cursor (AI-first IDE)

**Transport**: stdio  
**Best for**: Coding with AI assistance

#### Setup

1. Open Cursor settings (Cmd/Ctrl + ,)

2. Navigate to **Features** → **MCP Servers**

3. Add configuration:
   ```json
   {
     "mcpServers": {
       "aurex-advisor": {
         "command": "npx",
         "args": ["-y", "@aurex/advisor"],
         "env": {
           "AUREX_RPC_URL": "https://rpc.xlayer.tech",
           "AUREX_CHAIN_ID": "196"
         }
       }
     }
   }
   ```

4. Reload Cursor window

5. Test: Open Cursor chat and ask "Check Aurex market status"

---

### 3. Windsurf (Codeium IDE)

**Transport**: stdio  
**Best for**: AI-powered development

#### Setup

1. Open Windsurf settings

2. Go to **MCP Servers** section

3. Add Aurex Advisor:
   ```json
   {
     "mcpServers": {
       "aurex-advisor": {
         "command": "npx",
         "args": ["-y", "@aurex/advisor"],
         "env": {
           "AUREX_RPC_URL": "https://rpc.xlayer.tech"
         }
       }
     }
   }
   ```

4. Reload window

5. Test: Use Windsurf AI to query Aurex tools

---

### 4. Cline (VSCode Extension)

**Transport**: stdio  
**Best for**: VSCode users

#### Setup

1. Install Cline extension from VSCode marketplace

2. Open Cline settings (click Cline icon in sidebar → Settings)

3. Add MCP server configuration:
   ```json
   {
     "mcpServers": {
       "aurex-advisor": {
         "command": "npx",
         "args": ["-y", "@aurex/advisor"],
         "env": {
           "AUREX_RPC_URL": "https://rpc.xlayer.tech"
         }
       }
     }
   }
   ```

4. Restart VSCode

5. Test: Open Cline chat and ask about Aurex signals

---

### 5. Continue.dev (Open-source AI Assistant)

**Transport**: stdio  
**Best for**: Open-source AI workflows

#### Setup

1. Install Continue extension in VSCode

2. Open Continue config: `~/.continue/config.json`

3. Add MCP server:
   ```json
   {
     "mcpServers": {
       "aurex-advisor": {
         "command": "npx",
         "args": ["-y", "@aurex/advisor"],
         "env": {
           "AUREX_RPC_URL": "https://rpc.xlayer.tech"
         }
       }
     }
   }
   ```

4. Reload Continue

5. Test: Use Continue chat to interact with Aurex

---

### 6. Zed Editor

**Transport**: stdio  
**Best for**: High-performance editing with AI

#### Setup

1. Open Zed settings (Cmd/Ctrl + ,)

2. Navigate to **MCP Servers**

3. Add configuration:
   ```json
   {
     "mcpServers": {
       "aurex-advisor": {
         "command": "npx",
         "args": ["-y", "@aurex/advisor"],
         "env": {
           "AUREX_RPC_URL": "https://rpc.xlayer.tech"
         }
       }
     }
   }
   ```

4. Restart Zed

5. Test: Use Zed AI assistant to query Aurex

---

### 7. Claude Desktop App

**Transport**: stdio  
**Best for**: Desktop AI conversations

#### Setup

1. Open Claude Desktop settings

2. Navigate to **Developer** → **MCP Servers**

3. Add Aurex Advisor:
   ```json
   {
     "mcpServers": {
       "aurex-advisor": {
         "command": "npx",
         "args": ["-y", "@aurex/advisor"],
         "env": {
           "AUREX_RPC_URL": "https://rpc.xlayer.tech"
         }
       }
     }
   }
   ```

4. Restart Claude Desktop

5. Test: Ask Claude about Aurex market signals

---

### 8. OpenClaw (AI Agent Platform)

**Transport**: http (streamable)  
**Best for**: Building autonomous AI agents

#### Setup

1. Install OpenClaw:
   ```bash
   npm install -g openclaw
   ```

2. Build the Aurex plugin:
   ```bash
   cd apps/openclaw-plugin
   npm install
   npm run plugin:build
   ```

3. Install plugin:
   ```bash
   openclaw plugins install ./dist
   ```

4. Configure gateway in `apps/advisor/.env`:
   ```bash
   OPENCLAW_GATEWAY_URL=http://localhost:18789
   OPENCLAW_GATEWAY_TOKEN=your-token
   OPENCLAW_AGENT_ID=main
   ```

5. Test: OpenClaw will auto-discover Aurex tools

**Available Tools** (OpenClaw-specific):
- `aurex.get_strategy`
- `aurex.market_status`
- `aurex.send_message` — Push messages to Aurex Web UI feed
- `aurex.execute_trade` — Execute trades with confirmation
- `aurex.get_prices` — Token price tracking

---

### 9. Hermes AI

**Transport**: SSE (Server-Sent Events)  
**Best for**: Real-time AI streaming

#### Setup

1. Configure Hermes to connect via SSE

2. Point to Advisor SSE endpoint:
   ```
   http://localhost:3100/mcp/sse
   ```

3. Enable auto-reconnect in Hermes settings

4. Connection config:
   ```json
   {
     "name": "aurex-advisor",
     "url": "http://localhost:3100/mcp/sse",
     "transport": "sse",
     "reconnect": true,
     "headers": {
       "X-Aurex-Version": "0.1.0"
     }
   }
   ```

5. Test: Hermes will stream Aurex updates in real-time

---

## Programmatic Configuration

You can fetch client-specific configuration from the Advisor API:

```bash
# Get configuration for any supported client
curl http://localhost:3100/api/plugin?client=claude-code
curl http://localhost:3100/api/plugin?client=cursor
curl http://localhost:3100/api/plugin?client=windsurf
curl http://localhost:3100/api/plugin?client=cline
curl http://localhost:3100/api/plugin?client=continue
curl http://localhost:3100/api/plugin?client=zed
curl http://localhost:3100/api/plugin?client=claude-desktop
curl http://localhost:3100/api/plugin?client=openclaw
curl http://localhost:3100/api/plugin?client=hermes
```

Response includes:
- `manifest` — Plugin metadata (name, version, tools)
- `connection` — Client-specific connection config

---

## Environment Variables

All stdio-based clients support these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `AUREX_RPC_URL` | X Layer RPC endpoint | `https://rpc.xlayer.tech` |
| `AUREX_CHAIN_ID` | Chain ID for X Layer | `196` |
| `AUREX_PRIVATE_KEY` | Private key for signing (optional) | - |
| `AUREX_SIGNER_PROVIDER` | Signer backend (`private-key` or `onchainos`) | `private-key` |
| `AUREX_POOL_IDS` | Comma-separated pool IDs to watch | - |

**Security Note**: Never commit `AUREX_PRIVATE_KEY` to version control. Use environment variables or secure key management.

---

## Troubleshooting

### "Advisor not running"
- Check that `pnpm dev` is running in `apps/advisor`
- Verify port 3100 is not blocked
- Check logs: `apps/advisor` terminal output

### "MCP server not found"
- Ensure `npx` is in your PATH
- Try running `npx -y @aurex/advisor` manually to test
- Check client-specific MCP settings location

### "Connection refused"
- Verify Advisor URL is correct (`http://localhost:3100`)
- For remote Advisor, update URL in client config
- Check firewall settings

### "Tools not appearing"
- Restart your AI client after adding MCP config
- Check client logs for MCP initialization errors
- Verify JSON syntax in config files

---

## Advanced: Custom MCP Client

To integrate a custom MCP client:

1. Implement MCP protocol (stdio, http, or sse transport)
2. Connect to Advisor endpoint:
   - stdio: `npx -y @aurex/advisor`
   - http: `http://localhost:3100/mcp`
   - sse: `http://localhost:3100/mcp/sse`
3. Discover tools via MCP `tools/list` request
4. Call tools via MCP `tools/call` request

See [MCP Specification](https://modelcontextprotocol.io) for protocol details.

---

## Web Dashboard

All clients can also interact with the Aurex Web Dashboard:

```bash
cd apps/web
pnpm dev
```

Open `http://localhost:3000` to:
- Browse signal marketplace
- View publisher leaderboard
- Monitor Advisor status
- Execute trades via UI
- See AI recommendations in the feed

---

## Next Steps

- Read [AUREX_ARCHITECTURE_WHITEPAPER.md](./AUREX_ARCHITECTURE_WHITEPAPER.md) for protocol details
- Check [ADVISOR_ACTIONS.md](./ADVISOR_ACTIONS.md) for available strategy actions
- See [ROADMAP.md](./ROADMAP.md) for upcoming features

---

## Support

- GitHub Issues: https://github.com/Aurex-Onchain/Aurex/issues
- Documentation: https://github.com/Aurex-Onchain/Aurex/tree/main/docs
