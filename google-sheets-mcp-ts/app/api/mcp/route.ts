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
        
        // DEBUG: Log the received parameters
        console.log('🔍 DEBUG: Received parameters:', {
          company,
          role,
          description,
          date,
          source,
          jobType,
          allArgs: { company, role, description, date, source, jobType }
        });

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
          action: 'add',                        // Specify this is an ADD action
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

    /**
     * TOOL 4: lookup_jobs
     * This tool looks up existing job applications by company name
     * Like searching a database to see if you've already applied to a company
     */
    server.tool(
      'lookup_jobs',
      'Look up existing job applications by company name to see if you have already applied',
      {
        company: z.string().describe('Company name to search for (case-insensitive, partial matches allowed)'),
      },
      async ({ company }) => {
        // Get secret configuration from environment variables
        const scriptUrl = process.env.SCRIPT_URL;
        const secretKey = process.env.SECRET_KEY;
        
        // Check if required environment variables are set
        if (!scriptUrl) {
          throw new Error('SCRIPT_URL environment variable is not set');
        }
        
        if (!secretKey) {
          throw new Error('SECRET_KEY environment variable is not set');
        }

        // Prepare the lookup request payload
        const payload = {
          secret: secretKey,                    // Authentication for Google Apps Script
          action: 'lookup',                     // Specify this is a LOOKUP action
          company,                              // Company name to search for
        };

        try {
          // Make HTTP request to Google Apps Script for lookup
          const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          // Check if the request was successful
          if (!response.ok) {
            throw new Error(`Google Apps Script request failed: ${response.status} ${response.statusText}`);
          }

          // Parse the JSON response from Google Apps Script
          const responseData = await response.json();

          // Check if the lookup was successful
          if (!responseData.success) {
            return {
              content: [
                { 
                  type: 'text', 
                  text: `❌ Lookup failed: ${responseData.message}` 
                }
              ],
            };
          }

          // Format the results for display
          const results = responseData.results || [];
          
          if (results.length === 0) {
            return {
              content: [
                { 
                  type: 'text', 
                  text: `🔍 No job applications found for "${company}".\n\nYou haven't applied to this company yet!` 
                }
              ],
            };
          }

          // Format the results nicely
          let resultText = `🔍 Found ${results.length} job application(s) for "${company}":\n\n`;
          
          results.forEach((job: any, index: number) => {
            resultText += `📋 Application #${index + 1} (Row ${job.rowNumber}):\n`;
            resultText += `   Company: ${job.company}\n`;
            resultText += `   Role: ${job.role}\n`;
            resultText += `   Description: ${job.description || 'N/A'}\n`;
            resultText += `   Date Applied: ${job.date || 'N/A'}\n`;
            resultText += `   Source: ${job.source || 'N/A'}\n`;
            resultText += `   Type: ${job.type || 'N/A'}\n\n`;
          });

          return {
            content: [
              { 
                type: 'text', 
                text: resultText 
              }
            ],
          };
        } catch (error) {
          // If something went wrong, return an error message
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          return {
            content: [
              { 
                type: 'text', 
                text: `❌ Failed to lookup jobs: ${errorMessage}` 
              }
            ],
          };
        }
      },
    );

    /**
     * TOOL 5: daily_application_stats
     * This tool shows how many job applications were submitted today
     * Like a daily productivity tracker for your job search
     */
    server.tool(
      'daily_application_stats',
      'Get statistics for job applications submitted today',
      {}, // No input parameters needed
      async () => {
        // Get secret configuration from environment variables
        const scriptUrl = process.env.SCRIPT_URL;
        const secretKey = process.env.SECRET_KEY;
        
        // Check if required environment variables are set
        if (!scriptUrl) {
          throw new Error('SCRIPT_URL environment variable is not set');
        }
        
        if (!secretKey) {
          throw new Error('SECRET_KEY environment variable is not set');
        }

        // Prepare the daily stats request payload
        const payload = {
          secret: secretKey,                    // Authentication for Google Apps Script
          action: 'daily_stats',                // Specify this is a DAILY_STATS action
        };

        try {
          // Make HTTP request to Google Apps Script for daily stats
          const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          // Check if the request was successful
          if (!response.ok) {
            throw new Error(`Google Apps Script request failed: ${response.status} ${response.statusText}`);
          }

          // Parse the JSON response from Google Apps Script
          const responseData = await response.json();

          // Check if the stats lookup was successful
          if (!responseData.success) {
            return {
              content: [
                { 
                  type: 'text', 
                  text: `❌ Daily stats failed: ${responseData.message}` 
                }
              ],
            };
          }

          // Format the daily stats for display
          const todayCount = responseData.todayCount || 0;
          const todayApplications = responseData.todayApplications || [];
          const date = responseData.date || 'today';
          
          if (todayCount === 0) {
            return {
              content: [
                { 
                  type: 'text', 
                  text: `📊 Daily Application Stats for ${date}:\n\n🎯 Applications submitted today: 0\n\nNo job applications were submitted today yet. Keep up the job search!` 
                }
              ],
            };
          }

          // Format the results with details
          let resultText = `📊 Daily Application Stats for ${date}:\n\n`;
          resultText += `🎯 Total applications submitted today: ${todayCount}\n\n`;
          
          if (todayApplications.length > 0) {
            resultText += `📋 Today's Applications:\n\n`;
            
            todayApplications.forEach((job: any, index: number) => {
              resultText += `${index + 1}. ${job.company} - ${job.role}\n`;
              if (job.source) resultText += `   Source: ${job.source}\n`;
              if (job.type) resultText += `   Type: ${job.type}\n`;
              resultText += `\n`;
            });
          }

          // Add motivational message based on count
          if (todayCount >= 5) {
            resultText += `🔥 Great job! You're crushing it with ${todayCount} applications today!`;
          } else if (todayCount >= 3) {
            resultText += `💪 Good work! ${todayCount} applications is solid progress.`;
          } else if (todayCount >= 1) {
            resultText += `👍 Nice start! You've applied to ${todayCount} position${todayCount > 1 ? 's' : ''} today.`;
          }

          return {
            content: [
              { 
                type: 'text', 
                text: resultText 
              }
            ],
          };
        } catch (error) {
          // If something went wrong, return an error message
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          return {
            content: [
              { 
                type: 'text', 
                text: `❌ Failed to get daily stats: ${errorMessage}` 
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
  
  // DEBUG: Log incoming request details
  try {
    const body = await request.clone().text();
    console.log('🔍 DEBUG: Incoming MCP request:', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      body: body
    });
  } catch (e) {
    console.log('🔍 DEBUG: Could not log request body:', e);
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