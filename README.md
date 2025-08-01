# Google Sheets MCP Server

A Model Context Protocol (MCP) server that helps you track job applications by automatically adding job details to a Google Sheet. Built with TypeScript, Next.js, and the Vercel MCP Adapter.

## What This Does

This MCP server provides AI assistants (like ChatGPT, Claude, or Cursor) with tools to:
- **Add job details** to your Google Sheet automatically
- **Look up existing applications** by company name to avoid duplicate applications
- **Check daily application stats** to track your job search progress
- **Check server health** to ensure everything is configured properly  
- **Test connections** to your Google Apps Script
- **Get OAuth info** for Claude MCP integration

Think of it as a bridge between AI assistants and your Google Sheets, making job tracking effortless during conversations.

## Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- A Google Apps Script webhook (see setup below)
- Vercel account (for deployment)

### 2. Installation

```bash
# Clone or download this project
cd google-sheets-mcp-ts

# Install dependencies
npm install

# Copy environment template
cp .env.local .env.local.example
```

### 3. Google Apps Script Setup

First, you need to create a Google Apps Script that will receive data and add it to your sheet:

1. **Create a new Google Sheet** for job tracking
2. **Open Google Apps Script** (script.google.com)
3. **Create a new project** and paste this code:

```javascript
function doPost(e) {
  // Get the data from the request
  const data = JSON.parse(e.postData.contents);
  
  // Verify the secret key (basic security)
  if (data.secret !== 'your-secret-key-here') {
    return ContentService
      .createTextOutput('Unauthorized')
      .setMimeType(ContentService.MimeType.TEXT);
  }
  
  // Open your Google Sheet (replace with your sheet ID)
  const sheet = SpreadsheetApp.openById('your-google-sheet-id').getActiveSheet();
  
  // Add a new row with the job data
  sheet.appendRow([
    new Date(),           // Timestamp
    data.company,         // Company name
    data.role,           // Job role
    data.description,    // Job description
    data.date,           // Application date
    data.source          // Job source
  ]);
  
  return ContentService
    .createTextOutput('Job added successfully!')
    .setMimeType(ContentService.MimeType.TEXT);
}
```

4. **Deploy the script** as a web app:
   - Click "Deploy" → "New deployment"
   - Choose "Web app" as the type
   - Set execute as "Me" and access to "Anyone"
   - Copy the deployment URL

### 4. Environment Configuration

Edit your `.env.local` file with your actual values:

```bash
# Google Apps Script Configuration
SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
SECRET_KEY=your-secret-key-here

# MCP Server Authentication (leave empty for local development)
MCP_API_KEY=
```

### 5. Local Development

```bash
# Start the development server
npm run dev

# Test the MCP endpoint
npm run test
```

Visit `http://localhost:3000` to see the landing page and `http://localhost:3000/api/mcp` for the MCP endpoint.

## Using the Tools

### Tool 1: append_job_row

Adds a job to your Google Sheet.

**Parameters:**
- `company` (required): Company name
- `role` (required): Job title
- `description` (optional): Full job description
- `date` (optional): Application date (MM/DD/YYYY)
- `source` (optional): Where you found the job

**Example usage in AI chat:**
```
"Add this job to my sheet: Company is TechCorp, role is Software Engineer, 
description is 'Build React applications', applied on 01/15/2024, found on LinkedIn"
```

### Tool 2: health_check

Checks if the server is configured correctly.

**Parameters:** None

**Returns:** Status of server configuration

### Tool 3: test_connection

Tests if the Google Apps Script is reachable.

**Parameters:** None

**Returns:** Connection test results

## MCP Client Configuration

### For Cursor IDE

Add to your Cursor settings:

```json
{
  "mcpServers": {
    "google-sheets-job-tracker": {
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```

### For OpenAI Playground

- **URL**: `http://localhost:3000/api/mcp`
- **Headers**: None needed for local development

### For Production

- **URL**: `https://your-deployment.vercel.app/api/mcp`
- **Headers**: `x-api-key: your-production-api-key`

## Deployment to Vercel

### 1. Deploy the Project

```bash
# Deploy to Vercel
vercel deploy --prod
```

### 2. Set Environment Variables

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add these variables:
   - `SCRIPT_URL`: Your Google Apps Script URL
   - `SECRET_KEY`: Your Google Apps Script secret
   - `MCP_API_KEY`: A secure API key for production

### 3. Update Client Configuration

Update your MCP clients to use the production URL and API key:

```json
{
  "mcpServers": {
    "google-sheets-job-tracker": {
      "url": "https://your-deployment.vercel.app/api/mcp",
      "headers": {
        "x-api-key": "your-production-api-key"
      }
    }
  }
}
```

## Security

- **Local Development**: No authentication required
- **Production**: Requires API key via `x-api-key` header or `Authorization: Bearer` header
- **Google Apps Script**: Protected by secret key verification
- **HTTPS**: Automatic with Vercel deployment

## Claude MCP Integration

### For Claude Desktop/macOS App

Configure Claude with your MCP server:
- **Server URL**: `https://your-deployed-domain.vercel.app/api/mcp`
- **Authentication**: Bearer token with your API key

### For Claude API Integration

For developers using Claude's Messages API:

```json
{
  "type": "url", 
  "url": "https://your-deployed-domain.vercel.app/api/mcp",
  "name": "google-sheets-job-tracker",
  "authorization_token": "YOUR_API_KEY_HERE"
}
```

### Example Usage in Claude

When calling Claude's Messages API with MCP:

```bash
curl https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "anthropic-beta: mcp-client-2025-04-04" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 1000,
    "messages": [{"role": "user", "content": "Add a job application for TechCorp as Software Engineer"}],
    "mcp_servers": [
      {
        "type": "url",
        "url": "https://your-domain.vercel.app/api/mcp",
        "name": "google-sheets-job-tracker",
        "authorization_token": "your-api-key"
      }
    ]
  }'
```

### Authentication Methods

**API Key Authentication (Recommended):**
```bash
# Using Authorization header
Authorization: Bearer your-api-key

# Using x-api-key header
x-api-key: your-api-key
```

## Testing

### Manual Testing

```bash
# Test tools list
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Test adding a job
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0", 
    "id": 2, 
    "method": "tools/call", 
    "params": {
      "name": "append_job_row",
      "arguments": {
        "company": "TestCorp",
        "role": "Developer",
        "description": "Test job",
        "date": "01/15/2024",
        "source": "Manual test"
      }
    }
  }'
```

### Using MCP Inspector

```bash
# Install and run MCP inspector
npx @modelcontextprotocol/inspector@latest http://localhost:3000/api/mcp
```

## Troubleshooting

### "Cannot find module" errors
- Run `npm install` to install dependencies
- Check that Node.js 18+ is installed

### "Environment variable not set" errors
- Check your `.env.local` file has the correct variables
- For production, verify Vercel environment variables

### "Google Apps Script request failed"
- Verify your `SCRIPT_URL` is correct
- Check that your Google Apps Script is deployed as a web app
- Ensure the `SECRET_KEY` matches in both places

### "Unauthorized" errors
- For local development, remove or comment out `MCP_API_KEY`
- For production, verify the API key in your client configuration

## Project Structure

```
google-sheets-mcp-ts/
├── app/
│   ├── api/
│   │   └── mcp/
│   │       └── route.ts          # Main MCP server logic
│   ├── layout.tsx                # App layout
│   └── page.tsx                  # Landing page
├── .env.local                    # Environment variables
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── vercel.json                   # Vercel deployment config
└── README.md                     # This file
```

## License

MIT License - feel free to use this for your own job tracking needs!
