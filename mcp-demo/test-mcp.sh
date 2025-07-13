#!/bin/bash

# Test MCP server capabilities
echo "Testing MCP server capabilities..."

# Test list tools
echo "1. Listing available tools:"
curl -X POST https://mcp-demo-qx5n86jsf-kvn8888s-projects.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}' | jq

echo -e "\n2. Calling roll_dice tool:"
curl -X POST https://mcp-demo-qx5n86jsf-kvn8888s-projects.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "roll_dice", "arguments": {"sides": 6}}}' | jq

echo -e "\n3. Calling greet tool:"
curl -X POST https://mcp-demo-qx5n86jsf-kvn8888s-projects.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "greet", "arguments": {"name": "World"}}}' | jq

echo -e "\n4. Calling current_time tool:"
curl -X POST https://mcp-demo-qx5n86jsf-kvn8888s-projects.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "current_time", "arguments": {}}}' | jq