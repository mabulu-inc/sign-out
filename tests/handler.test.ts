import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@smplcty/auth', () => ({
  revokeSession: vi.fn(),
}));

vi.mock('../src/pool.js', () => ({
  getPool: vi.fn().mockResolvedValue({}),
}));

import { revokeSession } from '@smplcty/auth';
import { handler } from '../src/index.js';

const mockRevoke = vi.mocked(revokeSession);

function event(body: string): Record<string, unknown> {
  return {
    body,
    headers: {},
    requestContext: { http: { method: 'POST', path: '/sign-out' } },
  };
}

describe('sign-out handler', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('revokes the session and returns 200', async () => {
    const res = await handler(event('{"session_id":"abc-123"}') as never);
    expect(res.statusCode).toBe(200);
    expect(mockRevoke).toHaveBeenCalledWith(
      expect.anything(),
      'abc-123',
    );
  });

  it('returns 400 when session_id is missing', async () => {
    const res = await handler(event('{}') as never);
    expect(res.statusCode).toBe(400);
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it('returns 400 when session_id is empty', async () => {
    const res = await handler(event('{"session_id":""}') as never);
    expect(res.statusCode).toBe(400);
    expect(mockRevoke).not.toHaveBeenCalled();
  });

  it('returns 400 on invalid body', async () => {
    const res = await handler(event('null') as never);
    expect(res.statusCode).toBe(400);
  });
});
