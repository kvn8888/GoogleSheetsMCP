# MCP Demo Server

A simple Model Context Protocol (MCP) server demo built for Vercel using the `@vercel/mcp-adapter`.

## Features

This demo includes three simple tools:
- **roll_dice**: Rolls an N-sided die
- **greet**: Greets someone with a message  
- **current_time**: Gets the current time

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Test the MCP server using the MCP inspector:
   ```bash
   npx @modelcontextprotocol/inspector@latest http://localhost:3000/api/mcp
   ```

## Deployment

Deploy to Vercel:

```bash
vercel deploy
```

## Usage

Once deployed, you can connect to this MCP server from MCP-compatible clients like Cursor or Claude using the URL:

```
https://your-deployment.vercel.app/api/mcp
```

**Important:** The production deployment requires API key authentication to prevent spam.

### Setting up Authentication

1. **Local Development**: No API key required (runs open by default)

2. **Production**: Set the `MCP_API_KEY` environment variable in Vercel:
   ```bash
   vercel env add MCP_API_KEY
   # Enter your secure API key when prompted
   vercel deploy --prod
   ```

3. **Using with API Key**: Include the API key in requests via:
   - `Authorization: Bearer YOUR_API_KEY` header, or
   - `x-api-key: YOUR_API_KEY` header

### Testing with curl

```bash
# Test with API key
curl -X POST https://your-deployment.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Test roll_dice tool
curl -X POST https://your-deployment.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "roll_dice", "arguments": {"sides": 6}}}'
```

## Configuration

For MCP clients like Cursor, add this to your configuration:

```json
{
  "mcpServers": {
    "demo-server": {
      "url": "https://your-deployment.vercel.app/api/mcp",
      "headers": {
        "x-api-key": "YOUR_API_KEY"
      }
    }
  }
}
```

## VS Code Integration

To use this MCP server with VS Code:

1. **Install Cursor IDE** (recommended - has native MCP support)
2. **Add to Cursor settings** with the configuration above
3. **Alternative**: Use MCP-compatible VS Code extensions

## Security Notes

- API keys prevent unauthorized usage and potential charges
- Local development runs without authentication for convenience
- Production endpoints are protected but publicly accessible with valid API key
- Store API keys securely and rotate them regularly