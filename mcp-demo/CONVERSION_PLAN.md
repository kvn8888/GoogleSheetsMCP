# Converting Google Sheets MCP to Vercel MCP

## Current Implementation (Python + FastMCP)

The existing Google Sheets MCP server uses:
- **Runtime**: Python 3.11 with FastMCP
- **Tool**: `append_job_row` - adds job data to Google Sheets via Apps Script webhook
- **Dependencies**: fastmcp, httpx, pydantic
- **Environment variables**: `SCRIPT_URL`, `SECRET_KEY`

## Conversion to Vercel MCP (Node.js + @vercel/mcp-adapter)

### 1. New Directory Structure
```
google-sheets-mcp-ts/
├── package.json
├── vercel.json
├── app/
│   ├── api/
│   │   └── mcp/
│   │       └── route.ts
│   └── page.tsx (optional landing page)
└── README.md
```

### 2. Required Changes

#### Dependencies
Replace Python dependencies with Node.js equivalents:
- `fastmcp` → `@vercel/mcp-adapter`
- `httpx` → `fetch` (built-in) or `axios`
- `pydantic` → `zod` for validation

#### Tool Implementation
Convert the `append_job_row` function from Python to TypeScript:

```typescript
server.tool(
  'append_job_row',
  'Append a job row to Google Sheets',
  {
    company: z.string(),
    role: z.string(),
    description: z.string().optional(),
    date: z.string().optional(),
    source: z.string().optional(),
  },
  async ({ company, role, description, date, source }) => {
    const payload = {
      secret: process.env.SECRET_KEY,
      company,
      role,
      description: description || "",
      date: date || "",
      source: source || "",
    };
    
    const response = await fetch(process.env.SCRIPT_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    return {
      content: [{ type: 'text', text }],
    };
  }
);
```

### 3. Environment Variables Needed
The same environment variables from the Python version:
- `SCRIPT_URL` - Google Apps Script webhook URL
- `SECRET_KEY` - Authentication secret for the webhook

### 4. Benefits of Conversion
- **Performance**: Potentially faster cold starts with Node.js
- **Ecosystem**: Access to npm ecosystem and modern JavaScript tooling
- **Standard**: Uses the official Vercel MCP adapter
- **Debugging**: Better integration with Vercel's debugging tools

### 5. Migration Steps
1. Create new TypeScript project structure
2. Port the `append_job_row` tool logic
3. Set up environment variables in Vercel
4. Test with MCP inspector
5. Deploy and verify functionality

Would you like me to implement this conversion?