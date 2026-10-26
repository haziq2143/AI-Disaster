import assert from 'node:assert/strict';
import test from 'node:test';
import { getTrustedClientAddress } from '../src/lib/requestRateLimit.js';

test('does not trust proxy headers unless explicitly configured', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalTrustProxyHeaders = process.env.TRUST_PROXY_HEADERS;
  process.env.NODE_ENV = 'production';
  delete process.env.TRUST_PROXY_HEADERS;

  try {
    const request = new Request('https://example.test/api/auth/login', {
      headers: { 'x-forwarded-for': '203.0.113.1', 'x-real-ip': '203.0.113.2' }
    });
    assert.equal(getTrustedClientAddress(request), null);
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalTrustProxyHeaders === undefined) delete process.env.TRUST_PROXY_HEADERS;
    else process.env.TRUST_PROXY_HEADERS = originalTrustProxyHeaders;
  }
});

test('accepts a valid client IP only when trusted proxy headers are enabled', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalTrustProxyHeaders = process.env.TRUST_PROXY_HEADERS;
  process.env.NODE_ENV = 'production';
  process.env.TRUST_PROXY_HEADERS = 'true';

  try {
    const request = new Request('https://example.test/api/auth/login', {
      headers: { 'x-forwarded-for': '203.0.113.8, 10.0.0.1' }
    });
    assert.equal(getTrustedClientAddress(request), '203.0.113.8');

    const invalidRequest = new Request('https://example.test/api/auth/login', {
      headers: { 'x-real-ip': 'spoofed-address' }
    });
    assert.equal(getTrustedClientAddress(invalidRequest), null);
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalTrustProxyHeaders === undefined) delete process.env.TRUST_PROXY_HEADERS;
    else process.env.TRUST_PROXY_HEADERS = originalTrustProxyHeaders;
  }
});
