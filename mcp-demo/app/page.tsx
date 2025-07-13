export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">MCP Demo Server</h1>
      <p className="mb-4">
        This is a simple Model Context Protocol (MCP) server demo running on Vercel.
      </p>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Available Tools:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>roll_dice</strong> - Rolls an N-sided die</li>
          <li><strong>greet</strong> - Greets someone with a message</li>
          <li><strong>current_time</strong> - Gets the current time</li>
        </ul>
      </div>
      <p className="mt-4 text-sm text-gray-600">
        MCP endpoint: <code>/api/mcp</code>
      </p>
    </main>
  );
}