/**
 * Landing page for the Google Sheets MCP Server
 * This is what users see when they visit the root URL
 * Like a homepage that explains what this API does
 */
export default function Home() {
  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Google Sheets MCP Server</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">📊 Job Tracking Made Easy</h2>
        <p className="text-gray-700">
          This Model Context Protocol (MCP) server helps you track job applications 
          by automatically adding job details to a Google Sheet. Perfect for organizing 
          your job search and keeping track of applications.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">🛠️ Available Tools</h3>
          <ul className="space-y-2 text-sm">
            <li><strong>append_job_row</strong> - Add job details to your Google Sheet</li>
            <li><strong>lookup_jobs</strong> - Search for existing job applications by company name</li>
            <li><strong>health_check</strong> - Check server configuration status</li>
            <li><strong>test_connection</strong> - Test Google Apps Script connectivity</li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">🔗 MCP Endpoint</h3>
          <p className="text-sm text-gray-600 mb-2">Connect your MCP client to:</p>
          <code className="bg-gray-100 px-2 py-1 rounded text-sm">
            /api/mcp
          </code>
          <p className="text-xs text-gray-500 mt-2">
            Requires API key authentication in production
          </p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">⚙️ Setup Required</h3>
        <p className="text-sm text-gray-700 mb-3">
          To use this server, you need to configure:
        </p>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• <strong>SCRIPT_URL</strong> - Your Google Apps Script webhook URL</li>
          <li>• <strong>SECRET_KEY</strong> - Authentication key for your Google Apps Script</li>
          <li>• <strong>MCP_API_KEY</strong> - API key for MCP server access (production only)</li>
        </ul>
      </div>

      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>Built with Next.js and Vercel MCP Adapter</p>
      </footer>
    </main>
  );
}