import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'MCP server is accessible',
    timestamp: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'MCP server POST is accessible',
    timestamp: new Date().toISOString()
  });
}