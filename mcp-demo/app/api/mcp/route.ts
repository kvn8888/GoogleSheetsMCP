import { z } from 'zod';
import { createMcpHandler } from '@vercel/mcp-adapter';
import { NextRequest } from 'next/server';

// Simple API key authentication middleware
function authenticateRequest(request: NextRequest): boolean {
  const apiKey = process.env.MCP_API_KEY;
  if (!apiKey) {
    // If no API key is set, allow access (for local development)
    return true;
  }
  
  const authHeader = request.headers.get('authorization');
  const providedKey = authHeader?.replace('Bearer ', '') || request.headers.get('x-api-key');
  
  return providedKey === apiKey;
}

const handler = createMcpHandler(
  (server) => {
    // Simple dice rolling tool
    server.tool(
      'roll_dice',
      'Rolls an N-sided die',
      { sides: z.number().int().min(2) },
      async ({ sides }) => {
        const value = 1 + Math.floor(Math.random() * sides);
        return {
          content: [{ type: 'text', text: `🎲 You rolled a ${value}!` }],
        };
      },
    );

    // Simple greeting tool
    server.tool(
      'greet',
      'Greets someone with a message',
      { name: z.string() },
      async ({ name }) => {
        return {
          content: [{ type: 'text', text: `Hello, ${name}! 👋` }],
        };
      },
    );

    // Current time tool
    server.tool(
      'current_time',
      'Gets the current time',
      {},
      async () => {
        const now = new Date().toISOString();
        return {
          content: [{ type: 'text', text: `Current time: ${now}` }],
        };
      },
    );
  },
  {},
  { basePath: '/api' },
);

// Wrap handlers with authentication
async function authenticatedHandler(request: NextRequest) {
  if (!authenticateRequest(request)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Provide API key via Authorization header or x-api-key header.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return handler(request);
}

export { authenticatedHandler as GET, authenticatedHandler as POST, authenticatedHandler as DELETE };