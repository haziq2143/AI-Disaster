import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { consumeRateLimit } from './database.js';

function trustedClientAddress(request) {
  if (process.env.TRUST_PROXY_HEADERS !== 'true') {
    return process.env.NODE_ENV === 'development' ? '127.0.0.1' : null;
  }

  const address = request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0].trim();
  return address && isIP(address) ? address : null;
}

export function getTrustedClientAddress(request) {
  return trustedClientAddress(request);
}

export async function checkRequestRateLimit(request, scope, limit, windowSeconds) {
  const address = trustedClientAddress(request);
  if (!address) return { available: false };

  const addressHash = createHash('sha256').update(address).digest('hex');
  const result = await consumeRateLimit(`${scope}:${addressHash}`, limit, windowSeconds);
  return { available: true, ...result };
}

export function rateLimitUnavailableResponse() {
  return Response.json(
    { success: false, error: 'Pembatasan keamanan belum dikonfigurasi. Hubungi administrator.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } }
  );
}

export function rateLimitExceededResponse(retryAfterSeconds) {
  return Response.json(
    { success: false, error: 'Terlalu banyak permintaan. Tunggu sebelum mencoba lagi.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSeconds), 'Cache-Control': 'no-store' }
    }
  );
}
