
import { NextResponse } from 'next/server'
const base = `${process.env.NEXT_PUBLIC_APP_ORIGIN ?? 'https://eny.space'}/atpreakout`
export const GET = () => NextResponse.json({
  client_id: `${base}/client-metadata.json`, client_name: 'ATpreakout', client_uri: base,
  redirect_uris: [`${base}/`], scope: 'atproto transition:generic',
  grant_types: ['authorization_code','refresh_token'], response_types: ['code'],
  application_type: 'web', token_endpoint_auth_method: 'none', dpop_bound_access_tokens: true,
})