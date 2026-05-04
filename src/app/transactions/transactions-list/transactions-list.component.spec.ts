import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AccountResponse } from '../interfaces/account-response.interface';
import { TransactionResponse } from '../interfaces/transaction-response.interface';
import { AccountsService } from '../services/accounts.service';
import { TransactionsService } from '../services/transactions.service';
import { TransactionsListComponent } from './transactions-list.component';

describe('TransactionsListComponent', () => {
  let fixture: ComponentFixture<TransactionsListComponent>;
  let component: TransactionsListComponent;

  const transaction: TransactionResponse = {
    id: 1,
    idAccount: 10,
    amount: 150,
    description: 'Pago',
    concept: 'CREDIT',
    status: 'ACTIVE',
  };

  const account: AccountResponse = {
    id: 10,
    accountNumber: '123456',
    balance: 1000,
    status: 'ACTIVE',
  };

  const accountsService = {
    getAccountByNumber: jest.fn(),
    getAccountById: jest.fn(),
  };

  const transactionsService = {
    listTransactions: jest.fn(),
    createTransaction: jest.fn(),
    updateTransactionStatus: jest.fn(),
    generateAccountStatementReport: jest.fn(),
  };

  beforeEach(async () => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    accountsService.getAccountByNumber.mockReturnValue(of(account));
    accountsService.getAccountById.mockReturnValue(of(account));
    transactionsService.listTransactions.mockReturnValue(of({
      data: [transaction],
      page: { page: 1, pageSize: 10, totalCount: 1, totalPages: 1 },
    }));
    transactionsService.createTransaction.mockReturnValue(of(transaction));
    transactionsService.updateTransactionStatus.mockReturnValue(of({ ...transaction, status: 'INACTIVE' }));
    transactionsService.generateAccountStatementReport.mockReturnValue(of({
      idUser: 5,
      startDate: '2026-05-01',
      endDate: '2026-05-04',
      generatedAt: '2026-05-04',
      totalDebits: 0,
      totalCredits: 1,
      pdfBase64: btoa('pdf'),
    }));

    await TestBed.configureTestingModule({
      imports: [TransactionsListComponent],
      providers: [
        { provide: AccountsService, useValue: accountsService },
        { provide: TransactionsService, useValue: transactionsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionsListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads transactions and account numbers on init', () => {
    component.ngOnInit();

    expect(component.transactions()).toEqual([transaction]);
    expect(component.accountNumbersById()).toEqual({ 10: '123456' });
    expect(component.isLoading()).toBe(false);
  });

  it('uses the account number filter before listing transactions', () => {
    component.filtersForm.controls.accountNumber.setValue('123456');

    component.loadTransactions(2);

    expect(accountsService.getAccountByNumber).toHaveBeenCalledWith('123456');
    expect(transactionsService.listTransactions).toHaveBeenCalledWith(expect.objectContaining({
      page: 2,
      idAccount: 10,
    }));
  });

  it('shows an error when loading transactions fails', () => {
    transactionsService.listTransactions.mockReturnValueOnce(throwError(() => new Error('No disponible')));

    component.loadTransactions();

    expect(component.errorMessage()).toBe('No disponible');
    expect(component.isLoading()).toBe(false);
  });

  it('creates a transaction and reloads the first page', () => {
    component.transactionForm.setValue({
      accountNumber: '123456',
      amount: 25,
      description: ' deposito ',
      concept: 'CREDIT',
    });

    component.createTransaction();

    expect(transactionsService.createTransaction).toHaveBeenCalledWith({
      idAccount: 10,
      amount: 25,
      description: 'deposito',
      concept: 'CREDIT',
      status: 'ACTIVE',
    });
    expect(component.successMessage()).toBe('Transaccion creada correctamente.');
    expect(component.isSaving()).toBe(false);
  });

  it('does not create a transaction when the form is invalid', () => {
    component.createTransaction();

    expect(transactionsService.createTransaction).not.toHaveBeenCalled();
    expect(component.transactionForm.touched).toBe(true);
  });

  it('opens and closes the report modal', () => {
    component.openReportModal();

    expect(component.isReportModalOpen()).toBe(true);

    component.closeReportModal();

    expect(component.isReportModalOpen()).toBe(false);
  });

  it('validates report date range before downloading', () => {
    component.reportForm.setValue({
      idUser: 5,
      startDate: '2026-05-04',
      endDate: '2026-05-01',
    });

    component.downloadAccountStatementReport();

    expect(component.errorMessage()).toBe('La fecha inicial no puede ser mayor que la fecha final.');
    expect(transactionsService.generateAccountStatementReport).not.toHaveBeenCalled();
  });

  it('downloads a report when the form is valid', () => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: jest.fn().mockReturnValue('blob:url'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: jest.fn(),
    });
    const click = jest.fn();
    jest.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click,
    } as unknown as HTMLAnchorElement);

    component.reportForm.setValue({
      idUser: 5,
      startDate: '2026-05-01',
      endDate: '2026-05-04',
    });

    component.downloadAccountStatementReport();

    expect(transactionsService.generateAccountStatementReport).toHaveBeenCalledWith({
      idUser: 5,
      startDate: '2026-05-01',
      endDate: '2026-05-04',
    });
    expect(click).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
    expect(component.successMessage()).toBe('Reporte descargado correctamente.');
  });

  it('inactivates an active transaction', () => {
    component.toggleStatus(transaction);

    expect(transactionsService.updateTransactionStatus).toHaveBeenCalledWith(1, 'INACTIVE');
    expect(component.successMessage()).toBe('Transaccion inactivada correctamente.');
  });

  it('does not reactivate an inactive transaction', () => {
    component.toggleStatus({ ...transaction, status: 'INACTIVE' });

    expect(transactionsService.updateTransactionStatus).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe('Una transaccion inactiva no se puede activar de nuevo.');
  });

  it('moves between pages only when possible', () => {
    transactionsService.listTransactions.mockImplementation((filters) => of({
      data: [],
      page: { page: filters.page, pageSize: 10, totalCount: 30, totalPages: 3 },
    }));
    component.page.set({ page: 2, pageSize: 10, totalCount: 30, totalPages: 3 });

    component.nextPage();
    component.previousPage();

    expect(transactionsService.listTransactions).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }));
    expect(transactionsService.listTransactions).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    component.page.set({ page: 3, pageSize: 10, totalCount: 30, totalPages: 3 });
    expect(component.canGoNextPage()).toBe(false);
  });

  it('formats debit amounts and account numbers for display', () => {
    component.accountNumbersById.set({ 10: '123456' });

    expect(component.isDebit({ ...transaction, concept: 'DEBIT' })).toBe(true);
    expect(component.formatAmount({ ...transaction, concept: 'DEBIT' })).toContain('(');
    expect(component.accountNumber(transaction)).toBe('123456');
    expect(component.accountNumber({ ...transaction, idAccount: null })).toBe('-');
  });
});
