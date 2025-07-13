# MCP Demo Setup Instructions

## Making the Vercel Deployment Public with Authentication

### Step 1: Set API Key in Vercel

```bash
# Navigate to your project directory
cd mcp-demo

# Add the API key environment variable
vercel env add MCP_API_KEY
# When prompted, enter a secure API key like: mcp-demo-secret-key-2025

# Redeploy with the new environment variable
vercel deploy --prod
```

### Step 2: Remove Vercel's Default Authentication

The current issue is that Vercel is applying SSO authentication to the entire project. To make the API endpoint public while keeping API key protection:

1. **Option A: Update Vercel Project Settings**
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Under "Security" or "Authentication", disable SSO protection
   - Or set the protection to exclude `/api/*` routes

2. **Option B: Use Environment Variables**
   ```bash
   # Disable Vercel's built-in protection
   vercel env add VERCEL_PROTECT_MODE
   # Set value to: "custom" or "none"
   ```

### Step 3: Test the Public Endpoint

Once deployed without SSO protection:

```bash
# Test without API key (should get 401)
curl -X POST https://your-deployment.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Test with API key (should work)
curl -X POST https://your-deployment.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "x-api-key: mcp-demo-secret-key-2025" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
```

### Current Status

✅ **API key authentication implemented** - prevents spam and unauthorized usage
✅ **Local development works** - no authentication required for localhost
❌ **Vercel SSO blocking access** - need to disable project-level authentication

### Next Steps

1. Access your Vercel dashboard
2. Navigate to the project settings
3. Disable SSO protection for API routes
4. Redeploy and test

This will give you a publicly accessible MCP endpoint that's protected by your custom API key, preventing spam while allowing legitimate usage with proper authentication.