import { DeviceContextService } from './device-context.service';

describe('DeviceContextService', () => {
  const originalCrypto = globalThis.crypto;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    jest.restoreAllMocks();
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        randomUUID: () => 'session-created',
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
  });

  it('returns device ip from shell session first', async () => {
    sessionStorage.setItem('bff_shell_auth_session', JSON.stringify({ deviceIp: '192.168.1.20' }));

    await expect(new DeviceContextService().getDeviceIp()).resolves.toBe('192.168.1.20');
  });

  it('stores the resolved device ip', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ ip: '10.10.10.10' }),
    } as Response);

    await expect(new DeviceContextService().getDeviceIp()).resolves.toBe('10.10.10.10');
    expect(localStorage.getItem('bff.deviceIp')).toBe('10.10.10.10');
  });

  it('creates and stores a session when none exists', () => {
    expect(new DeviceContextService().getSession()).toBe('session-created');
    expect(sessionStorage.getItem('bff.session')).toBe('session-created');
  });

  it('returns authorization for a valid shell session', () => {
    sessionStorage.setItem('bff_shell_auth_session', JSON.stringify({
      authenticated: true,
      tokenType: 'Bearer',
      accessToken: 'token-123',
      expiresAt: '2999-01-01T00:00:00.000Z',
    }));

    expect(new DeviceContextService().getAuthorization()).toBe('Bearer token-123');
  });

  it('returns empty authorization when the shell session is expired', () => {
    sessionStorage.setItem('bff_shell_auth_session', JSON.stringify({
      authenticated: true,
      accessToken: 'token-123',
      expiresAt: '2000-01-01T00:00:00.000Z',
    }));

    expect(new DeviceContextService().getAuthorization()).toBe('');
  });
});
