import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

/**
 * OAuth Callback Handler
 * This handles the OAuth callback from Claude when users authorize the MCP integration
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    return NextResponse.json({
      error: 'OAuth authorization failed',
      details: error,
      description: searchParams.get('error_description')
    }, { status: 400 });
  }

  // Validate required parameters
  if (!code || !state) {
    return NextResponse.json({
      error: 'Missing required OAuth parameters',
      missing: { code: !code, state: !state }
    }, { status: 400 });
  }

  // Validate state parameter (CSRF protection)
  const storedStateInfo = global.oauthStates?.get(state);
  if (!storedStateInfo) {
    return NextResponse.json({
      error: 'Invalid or expired OAuth state'
    }, { status: 400 });
  }

  // Clean up expired states (older than 10 minutes)
  const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
  if (storedStateInfo.timestamp < tenMinutesAgo) {
    global.oauthStates.delete(state);
    return NextResponse.json({
      error: 'OAuth state expired'
    }, { status: 400 });
  }

  // Exchange authorization code for access token
  try {
    const clientId = process.env.OAUTH_CLIENT_ID;
    const clientSecret = process.env.OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.OAUTH_REDIRECT_URI || `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/oauth/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json({
        error: 'OAuth not configured - missing client credentials'
      }, { status: 500 });
    }

    // Prepare token exchange request
    const tokenData = {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      code_verifier: storedStateInfo.codeVerifier
    };

    // Exchange code for token
    const tokenResponse = await fetch('https://api.anthropic.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams(tokenData)
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      return NextResponse.json({
        error: 'Token exchange failed',
        status: tokenResponse.status,
        details: errorData
      }, { status: 400 });
    }

    const tokenResult = await tokenResponse.json();

    // Clean up the used state
    global.oauthStates.delete(state);

    // In production, you would store the tokens securely (database, Redis, etc.)
    // For this demo, we'll just return them to the user
    return NextResponse.json({
      success: true,
      message: 'OAuth authorization successful!',
      tokens: {
        access_token: tokenResult.access_token,
        token_type: tokenResult.token_type,
        expires_in: tokenResult.expires_in,
        refresh_token: tokenResult.refresh_token,
        scope: tokenResult.scope
      },
      instructions: {
        usage: 'Use the access_token as a Bearer token in the Authorization header',
        example: `Authorization: Bearer ${tokenResult.access_token}`
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: 'Failed to process OAuth callback',
      details: errorMessage
    }, { status: 500 });
  }
}