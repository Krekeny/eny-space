import { NextResponse } from 'next/server';

export function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const base = `${origin}/atpreakout`;
  return NextResponse.json({
    client_id: `${base}/client-metadata.json`,
    client_name: 'ATpreakout',
    client_uri: base,
    redirect_uris: [`${base}/`],
    scope: 'atproto transition:generic',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    application_type: 'web',
    token_endpoint_auth_method: 'none',
    dpop_bound_access_tokens: true,
  });
}