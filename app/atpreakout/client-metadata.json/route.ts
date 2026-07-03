import { NextResponse } from 'next/server';

// Served at https://eny.space/atpreakout/client-metadata.json
// Keep client_id, client_uri, and redirect_uris in sync with your deploy URL.
export function GET() {
  return NextResponse.json({
  "client_id": "https://eny.space/atpreakout/client-metadata.json",
  "client_name": "ATpreakout",
  "client_uri": "https://eny.space/atpreakout",
  "redirect_uris": [
    "https://eny.space/atpreakout/"
  ],
  "scope": "atproto transition:generic",
  "grant_types": [
    "authorization_code",
    "refresh_token"
  ],
  "response_types": [
    "code"
  ],
  "application_type": "web",
  "token_endpoint_auth_method": "none",
  "dpop_bound_access_tokens": true
});
}
