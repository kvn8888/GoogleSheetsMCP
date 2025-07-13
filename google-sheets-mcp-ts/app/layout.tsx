import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Google Sheets MCP Server',
  description: 'Model Context Protocol server for Google Sheets job tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}