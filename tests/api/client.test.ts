// filename: tests/api/client.test.ts
// --- API Client: Timeout & Retry Handling ---
// Changes:
//   1. Timeout enforcement (15s)
//   2. 429 → retry
//   3. Network errors → ApiClientError

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch, ApiClientError } from '@/services/api/client';

describe('ApiClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('throws ApiClientError on timeout', async () => {
    vi.stubGlobal('fetch', () => {
      const controller = new AbortController();
      controller.abort();
      return Promise.reject(new Error('AbortError'));
    });

    await expect(apiFetch('/api/test')).rejects.toBeInstanceOf(ApiClientError);
    await expect(apiFetch('/api/test')).rejects.toHaveProperty('message', expect.stringContaining('timeout'));
  });

  it('retries on 429', async () => {
    let attempt = 0;
    vi.stubGlobal('fetch', () => {
      attempt++;
      if (attempt < 3) {
        return Promise.resolve({ ok: false, status: 429, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ data: 'ok' }) });
    });

    const result = await apiFetch('/api/test');
    expect(result).toEqual({ data: 'ok' });
    expect(attempt).toBe(3);
  });

  it('throws ApiClientError on network failure', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Network error')));

    await expect(apiFetch('/api/test')).rejects.toBeInstanceOf(ApiClientError);
    await expect(apiFetch('/api/test')).rejects.toHaveProperty('message', expect.stringContaining('Network'));
  });
});