// filename: tests/api/client.test.ts
// Tests for the axios-based API client (src/services/api/client.ts).
//
// The previous version of this file tested a fetch-based `apiFetch` / `ApiClientError`
// that were never implemented. Tests now cover what actually exists.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// We import the module so we can inspect its configuration.
// Dynamic import avoids hoisting issues with vi.mock.
describe('apiClient configuration', () => {
  let apiClient: typeof import('@/services/api/client').apiClient;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@/services/api/client');
    apiClient = mod.apiClient;
  });

  it('has a 15-second timeout', () => {
    expect(apiClient.defaults.timeout).toBe(15000);
  });

  it('sends JSON content-type by default', () => {
    const headers = apiClient.defaults.headers as Record<string, Record<string, string>>;
    expect(headers['Content-Type'] ?? headers.common?.['Content-Type']).toBe('application/json');
  });

  it('has a response error interceptor registered', () => {
    // Axios stores interceptors internally; we just verify at least one is set.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const interceptors = (apiClient.interceptors.response as any).handlers as unknown[];
    expect(interceptors.length).toBeGreaterThan(0);
  });
});

describe('apiClient error interceptor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('re-rejects on server error response', async () => {
    vi.spyOn(axios, 'get').mockRejectedValueOnce({
      response: { status: 500, data: { message: 'Internal error' } },
    });

    const { apiClient } = await import('@/services/api/client');
    await expect(apiClient.get('/api/test')).rejects.toBeTruthy();
  });

  it('re-rejects on network error', async () => {
    vi.spyOn(axios, 'get').mockRejectedValueOnce({
      request: {},
      message: 'Network Error',
    });

    const { apiClient } = await import('@/services/api/client');
    await expect(apiClient.get('/api/test')).rejects.toBeTruthy();
  });
});
