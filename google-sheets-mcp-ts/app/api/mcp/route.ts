// Import dependencies for building our MCP server
import { z } from 'zod';                              // Zod: validates input data (like checking if a string is actually a string)
import { createMcpHandler } from '@vercel/mcp-adapter'; // Vercel's official MCP adapter - handles all the complex MCP protocol stuff for us
import { NextRequest } from 'next/server';             // Next.js type for HTTP requests - like Express.js but for Next.js

/**
 * Authentication middleware function
 * This checks if someone is allowed to use our API
 * Like a bouncer at a club - checks if you have the right "password" (API key)
 */
function authenticateRequest(request: NextRequest): boolean {
  const apiKey = process.env.MCP_API_KEY;
  
  if (!apiKey) {
    // If no API key is set in environment, allow everyone (good for local development)
    return true;
  }
  
  // Look for the API key in the request headers (where clients send authentication info)
  // Check two possible header formats: "Authorization: Bearer key" or "x-api-key: key"
  const authHeader = request.headers.get('authorization');
  const providedKey = authHeader?.replace('Bearer ', '') || request.headers.get('x-api-key');
  
  // Return true if the provided key matches our secret key, false otherwise
  return providedKey === apiKey;
}

/**
 * Create the main MCP handler
 * This is like creating a router in Express.js - it defines what our API can do
 */
const handler = createMcpHandler(
  (server) => {
    
    /**
     * TOOL 1: append_job_row
     * This is the main tool that adds job information to a Google Sheet
     * Think of it like a form submission that goes to Google Sheets
     */
    server.tool(
      'append_job_row',                                    // Tool name (what clients will call)
      'Append a job row to the Google Sheet via Apps Script webhook', // Human-readable description
      {
        // Define what inputs this tool accepts (like function parameters)
        // Zod schemas validate the data - ensures we get what we expect
        company: z.string().describe('Company name'),      // Required: must be a string
        role: z.string().describe('Job title'),            // Required: must be a string
        description: z.string().optional().describe(       // Optional: can be undefined
          'Job description and software qualifications, always include the responsibilities, minimum requirements and additional qualifications verbatim. There is no character limit in any of the fields'
        ),
        date: z.string().optional().describe('Current date in MM/DD/YYYY format. Not the job posting date'),    // Optional string
        source: z.string().optional().describe('Source of the job posting'),         // Optional string
        jobType: z.string().optional().describe('Job type, e.g. DevOps, Cloud, Web, Full Stack, Backend, Frontend, General, Embedded, etc. NOT the type of internship (Part-Time, Full-Time, etc.)'),         // Optional string
      },
      // The actual function that runs when this tool is called
      async ({ company, role, description, date, source, jobType }) => {

        // Get secret configuration from environment variables
        // These are like passwords stored securely on the server
        const scriptUrl = process.env.SCRIPT_URL;    // The Google Apps Script webhook URL
        const secretKey = process.env.SECRET_KEY;    // Secret key to authenticate with Google Apps Script
        
        // Check if required environment variables are set
        // Like checking if you have your car keys before trying to drive
        if (!scriptUrl) {
          throw new Error('SCRIPT_URL environment variable is not set');
        }
        
        if (!secretKey) {
          throw new Error('SECRET_KEY environment variable is not set');
        }

        // Prepare the data to send to Google Apps Script
        // This matches exactly what the original Python code sent
        const payload = {
          secret: secretKey,                    // Authentication for Google Apps Script
          company,                              // Job company name
          role,                                 // Job title/role
          description: description || '',       // Job description (empty string if not provided)
          date: date || '',                     // Application date (empty string if not provided)
          source: source || '',                 // Where the job was found (empty string if not provided)
          type: jobType || '',                  // Job type (empty string if not provided)
        };

        try {
          // Make HTTP request to Google Apps Script
          // This is like filling out a web form and clicking "Submit"
          const response = await fetch(scriptUrl, {
            method: 'POST',                              // POST request (sending data)
            headers: {
              'Content-Type': 'application/json',        // Tell the server we're sending JSON data
            },
            body: JSON.stringify(payload),               // Convert our data to JSON string
          });

          // Check if the request was successful
          // Like checking if your form submission went through
          if (!response.ok) {
            throw new Error(`Google Apps Script request failed: ${response.status} ${response.statusText}`);
          }

          // Get the response text from Google Apps Script
          const responseText = await response.text();

          // Return success message to the user
          // This is what the MCP client (like ChatGPT) will see
          return {
            content: [
              { 
                type: 'text', 
                text: `✅ Job successfully added to Google Sheet!\n\nResponse: ${responseText}` 
              }
            ],
          };
        } catch (error) {
          // If something went wrong, return an error message
          // Like showing "Error: Could not submit form" to the user
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          return {
            content: [
              { 
                type: 'text', 
                text: `❌ Failed to add job to Google Sheet: ${errorMessage}` 
              }
            ],
          };
        }
      },
    );

    /**
     * TOOL 2: health_check
     * This tool checks if everything is configured properly
     * Like a "system status" page that shows green/red lights
     */
    server.tool(
      'health_check',
      'Check if the Google Sheets MCP server is working properly',
      {}, // No input parameters needed
      async () => {
        // Check what environment variables are configured
        const scriptUrl = process.env.SCRIPT_URL;
        const secretKey = process.env.SECRET_KEY;
        
        // Create a status report
        const checks = {
          server: 'OK',                                           // Server is running
          scriptUrl: scriptUrl ? 'Configured' : 'Missing',       // Is Google Apps Script URL set?
          secretKey: secretKey ? 'Configured' : 'Missing',       // Is secret key set?
          timestamp: new Date().toISOString(),                   // When this check was performed
        };

        // Return the status report
        return {
          content: [
            { 
              type: 'text', 
              text: `🔍 Google Sheets MCP Server Health Check:\n\n${JSON.stringify(checks, null, 2)}` 
            }
          ],
        };
      },
    );

    /**
     * TOOL 3: test_connection
     * This tool tests if we can reach the Google Apps Script without actually sending data
     * Like pinging a website to see if it's online
     */
    server.tool(
      'test_connection',
      'Test the connection to Google Apps Script (without writing data)',
      {}, // No input parameters needed
      async () => {
        const scriptUrl = process.env.SCRIPT_URL;
        
        // Check if we have a URL to test
        if (!scriptUrl) {
          return {
            content: [
              { 
                type: 'text', 
                text: '❌ Cannot test connection: SCRIPT_URL not configured' 
              }
            ],
          };
        }

        try {
          // Try to connect to the Google Apps Script URL
          // OPTIONS request is safe - it doesn't change any data
          const response = await fetch(scriptUrl, {
            method: 'OPTIONS', // OPTIONS is like knocking on the door to see if anyone's home
          });

          // Report the connection test results
          return {
            content: [
              { 
                type: 'text', 
                text: `🔗 Connection test result:\n\nURL: ${scriptUrl}\nStatus: ${response.status}\nReachable: ${response.ok ? 'Yes' : 'No'}` 
              }
            ],
          };
        } catch (error) {
          // If connection failed, explain what went wrong
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return {
            content: [
              { 
                type: 'text', 
                text: `❌ Connection test failed: ${errorMessage}` 
              }
            ],
          };
        }
      },
    );
  },
  {},                    // Additional MCP server options (we don't need any)
  { basePath: '/api' },  // URL prefix for our API (makes URLs like /api/mcp)
);

/**
 * Authenticated Handler Wrapper
 * This wraps our MCP handler with authentication
 * Like having a security guard check IDs before letting people into a building
 */
async function authenticatedHandler(request: NextRequest) {
  // Check if the request has valid authentication
  if (!authenticateRequest(request)) {
    // If authentication fails, return an error response
    // This is like a bouncer saying "Sorry, you can't come in"
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Provide API key via Authorization header or x-api-key header.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // If authentication passes, let the request go to our MCP handler
  return handler(request);
}

/**
 * Export the handlers for different HTTP methods
 * Next.js App Router expects these specific exports
 * 
 * GET: For retrieving data (like browser visiting a page)
 * POST: For sending data (like submitting a form)
 * DELETE: For removing data (MCP protocol might use this)
 */
export { authenticatedHandler as GET, authenticatedHandler as POST, authenticatedHandler as DELETE };