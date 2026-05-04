import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { TransactionsService } from './transactions.service';
import { DeviceContextService } from './device-context.service';

describe('TransactionsService', () => {
  const deviceContext = {
    getDeviceIp: jest.fn().mockResolvedValue('10.0.0.2'),
    getSession: jest.fn().mockReturnValue('session-2'),
    getAuthorization: jest.fn().mockReturnValue('Bearer abc'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        TransactionsService,
        { provide: DeviceContextService, useValue: deviceContext },
      ],
    });
  });

  it('lists transactions with filters and pagination metadata', async () => {
    const headers = new Headers({
      'x-page': '2',
      'x-page-size': '5',
      'x-total-count': '6',
      'x-total-pages': '2',
    });
    const fetchMock = jest.fn().mockResolvedValue(response([
      { id: 1, idAccount: 10, amount: 25, concept: 'CREDIT', status: 'ACTIVE' },
    ], true, headers));
    globalThis.fetch = fetchMock;

    const result = await firstValueFrom(TestBed.inject(TransactionsService).listTransactions({
      page: 2,
      pageSize: 5,
      search: ' pago ',
      idAccount: 10,
      concept: 'CREDIT',
      status: 'ACTIVE',
    }));

    expect(fetchMock.mock.calls[0][0]).toBe('/channel/v1/transactions?search=pago&idAccount=10&concept=CREDIT&status=ACTIVE');
    expect(result.page).toEqual({ page: 2, pageSize: 5, totalCount: 6, totalPages: 2 });
    expect(result.data[0].description).toBe('');
  });

  it('creates a transaction with json headers', async () => {
    const fetchMock = jest.fn().mockResolvedValue(response({
      id: 3,
      idAccount: 1,
      amount: 15,
      description: 'Deposito',
      concept: 'CREDIT',
      status: 'ACTIVE',
    }));
    globalThis.fetch = fetchMock;

    const created = await firstValueFrom(TestBed.inject(TransactionsService).createTransaction({
      idAccount: 1,
      amount: 15,
      description: 'Deposito',
      concept: 'CREDIT',
      status: 'ACTIVE',
    }));

    expect(created.id).toBe(3);
    expect(fetchMock).toHaveBeenCalledWith('/channel/v1/transactions', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        idAccount: 1,
        amount: 15,
        description: 'Deposito',
        concept: 'CREDIT',
        status: 'ACTIVE',
      }),
    }));
    expect((fetchMock.mock.calls[0][1].headers as Headers).get('Content-Type')).toBe('application/json');
  });

  it('updates the transaction status', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(response({
      id: 4,
      idAccount: 1,
      amount: 20,
      description: '',
      concept: 'DEBIT',
      status: 'INACTIVE',
    }));

    const updated = await firstValueFrom(
      TestBed.inject(TransactionsService).updateTransactionStatus(4, 'INACTIVE')
    );

    expect(updated.status).toBe('INACTIVE');
    expect(globalThis.fetch).toHaveBeenCalledWith('/channel/v1/transactions/4', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ status: 'INACTIVE' }),
    }));
  });

  it('generates an account statement report', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(response({
      idUser: 5,
      startDate: '2026-05-01',
      endDate: '2026-05-04',
      generatedAt: '2026-05-04',
      totalDebits: 1,
      totalCredits: 2,
      pdfBase64: 'abc',
    }));

    const report = await firstValueFrom(TestBed.inject(TransactionsService).generateAccountStatementReport({
      idUser: 5,
      startDate: '2026-05-01',
      endDate: '2026-05-04',
    }));

    expect(report.pdfBase64).toBe('abc');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/channel/v1/transactions/reports/account-statement?idUser=5&startDate=2026-05-01&endDate=2026-05-04',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('throws the detail message when the request fails', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(response({ detail: 'Error del servicio' }, false));

    await expect(firstValueFrom(TestBed.inject(TransactionsService).listTransactions({ page: 1, pageSize: 10 })))
      .rejects.toThrow('Error del servicio');
  });
});

function response(body: unknown, ok = true, headers = new Headers()): Response {
  return {
    ok,
    headers,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response;
}
