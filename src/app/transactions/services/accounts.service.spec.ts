import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AccountsService } from './accounts.service';
import { DeviceContextService } from './device-context.service';

describe('AccountsService', () => {
  const deviceContext = {
    getDeviceIp: jest.fn().mockResolvedValue('10.0.0.1'),
    getSession: jest.fn().mockReturnValue('session-1'),
    getAuthorization: jest.fn().mockReturnValue('Bearer token'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        AccountsService,
        { provide: DeviceContextService, useValue: deviceContext },
      ],
    });
  });

  it('gets an account by id with device headers', async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({
      id: 7,
      accountNumber: '123',
      balance: 100,
      status: 'ACTIVE',
    }));
    globalThis.fetch = fetchMock;

    const account = await firstValueFrom(TestBed.inject(AccountsService).getAccountById(7));

    expect(account.accountNumber).toBe('123');
    expect(fetchMock).toHaveBeenCalledWith('/channel/v1/accounts/7', expect.objectContaining({
      method: 'GET',
      headers: expect.any(Headers),
    }));
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get('x-device-ip')).toBe('10.0.0.1');
    expect(headers.get('x-session')).toBe('session-1');
    expect(headers.get('Authorization')).toBe('Bearer token');
  });

  it('encodes the account number when searching by number', async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({
      id: 8,
      accountNumber: '001 002',
      balance: 50,
      status: 'ACTIVE',
    }));
    globalThis.fetch = fetchMock;

    await firstValueFrom(TestBed.inject(AccountsService).getAccountByNumber('001 002'));

    expect(fetchMock.mock.calls[0][0]).toBe('/channel/v1/accounts/number/001%20002');
  });

  it('throws the api message when the request fails', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(response({ message: 'Cuenta no encontrada' }, false));

    await expect(firstValueFrom(TestBed.inject(AccountsService).getAccountById(99)))
      .rejects.toThrow('Cuenta no encontrada');
  });
});

function response(body: unknown, ok = true): Response {
  return {
    ok,
    headers: new Headers(),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}
