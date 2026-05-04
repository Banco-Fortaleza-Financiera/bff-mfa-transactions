import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';

import { ConceptTransaction } from '../interfaces/concept-transaction.interface';
import { PageMetadata } from '../interfaces/page-metadata.interface';
import { Status } from '../interfaces/status.interface';
import { TransactionCreateRequest } from '../interfaces/transaction-create-request.interface';
import { TransactionResponse } from '../interfaces/transaction-response.interface';
import { AccountsService } from '../services/accounts.service';
import { TransactionsService } from '../services/transactions.service';
import { AccountStatementReportForm } from '../types/account-statement-report-form.types';
import { TransactionFiltersForm } from '../types/transaction-filters-form.types';
import { TransactionForm } from '../types/transaction-form.types';

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './transactions-list.component.html',
  styleUrl: './transactions-list.component.scss',
})
export class TransactionsListComponent implements OnInit {
  readonly transactions = signal<TransactionResponse[]>([]);
  readonly accountNumbersById = signal<Record<number, string>>({});

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isDownloadingReport = signal(false);
  readonly isReportModalOpen = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly page = signal<PageMetadata>({
    totalCount: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });

  readonly statuses: Status[] = ['ACTIVE', 'INACTIVE'];
  readonly concepts: ConceptTransaction[] = ['DEBIT', 'CREDIT'];

  readonly filtersForm: TransactionFiltersForm;
  readonly reportForm: AccountStatementReportForm;
  readonly transactionForm: TransactionForm;

  private readonly fb = inject(FormBuilder);
  private readonly accountsService = inject(AccountsService);
  private readonly transactionsService = inject(TransactionsService);

  constructor() {
    this.filtersForm = this.createFiltersForm();
    this.reportForm = this.createReportForm();
    this.transactionForm = this.createTransactionForm();
  }

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(page = this.filtersForm.controls.page.value): void {
    if (this.filtersForm.invalid) {
      this.filtersForm.markAllAsTouched();
      return;
    }

    const filters = this.filtersForm.getRawValue();
    const pageToLoad = Math.max(1, page);
    this.isLoading.set(true);
    this.errorMessage.set('');

    const accountNumber = filters.accountNumber.trim();
    const accountFilter$: Observable<number | null> = accountNumber
      ? this.accountsService.getAccountByNumber(accountNumber).pipe(map((account) => account.id))
      : of(null);

    accountFilter$
      .pipe(
        switchMap((idAccount) => this.transactionsService.listTransactions({
          page: pageToLoad,
          pageSize: filters.pageSize,
          search: filters.search,
          idAccount,
          concept: filters.concept,
          status: filters.status,
        })),
        switchMap((response) => {
          const accountIds = Array.from(new Set(
            response.data
              .map((transaction) => transaction.idAccount)
              .filter((id): id is number => typeof id === 'number')
          ));

          if (!accountIds.length) {
            return of({ response, accountNumbersById: {} });
          }

          return forkJoin(
            accountIds.map((id) => this.accountsService.getAccountById(id).pipe(
              map((account) => [id, account.accountNumber] as const),
              catchError(() => of([id, String(id)] as const))
            ))
          ).pipe(
            map((accounts) => ({
              response,
              accountNumbersById: Object.fromEntries(accounts),
            }))
          );
        })
      )
      .subscribe({
        next: ({ response, accountNumbersById }) => {
          this.transactions.set(response.data);
          this.accountNumbersById.set(accountNumbersById);
          this.page.set(response.page);
          this.filtersForm.controls.page.setValue(response.page.page, { emitEvent: false });
          this.filtersForm.controls.pageSize.setValue(response.page.pageSize, { emitEvent: false });
          this.isLoading.set(false);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.isLoading.set(false);
        },
      });
  }

  createTransaction(): void {
    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const accountNumber = this.transactionForm.controls.accountNumber.value.trim();

    this.accountsService.getAccountByNumber(accountNumber).pipe(
      switchMap((account) => this.transactionsService.createTransaction(this.toTransactionCreateRequest(account.id)))
    ).subscribe({
      next: () => {
        this.successMessage.set('Transaccion creada correctamente.');
        this.resetTransactionForm();
        this.filtersForm.controls.page.setValue(1);
        this.loadTransactions(1);
        this.isSaving.set(false);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isSaving.set(false);
      },
    });
  }

  openReportModal(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.reportForm.reset({
      idUser: null,
      startDate: '',
      endDate: '',
    });
    this.isReportModalOpen.set(true);
  }

  closeReportModal(): void {
    if (!this.isDownloadingReport()) {
      this.isReportModalOpen.set(false);
    }
  }

  downloadAccountStatementReport(): void {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }

    const value = this.reportForm.getRawValue();

    if (value.startDate > value.endDate) {
      this.errorMessage.set('La fecha inicial no puede ser mayor que la fecha final.');
      return;
    }

    this.isDownloadingReport.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.transactionsService.generateAccountStatementReport({
      idUser: Number(value.idUser),
      startDate: value.startDate,
      endDate: value.endDate,
    }).subscribe({
      next: (report) => {
        if (!report.pdfBase64) {
          this.errorMessage.set('El reporte no devolvio un PDF para descargar.');
          this.isDownloadingReport.set(false);
          return;
        }

        this.downloadPdf(report.pdfBase64, `estado-cuenta-${report.idUser}-${report.startDate}-${report.endDate}.pdf`);
        this.successMessage.set('Reporte descargado correctamente.');
        this.isDownloadingReport.set(false);
        this.isReportModalOpen.set(false);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isDownloadingReport.set(false);
      },
    });
  }

  toggleStatus(transaction: TransactionResponse): void {
    if (transaction.status === 'INACTIVE') {
      this.errorMessage.set('Una transaccion inactiva no se puede activar de nuevo.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.transactionsService.updateTransactionStatus(transaction.id, 'INACTIVE').subscribe({
      next: () => {
        this.successMessage.set('Transaccion inactivada correctamente.');
        this.loadTransactions();
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isLoading.set(false);
      },
    });
  }

  previousPage(): void {
    const current = this.page();
    if (current.page > 1) {
      this.loadTransactions(current.page - 1);
    }
  }

  nextPage(): void {
    const current = this.page();
    if (this.canGoNextPage()) {
      this.loadTransactions(current.page + 1);
    }
  }

  canGoNextPage(): boolean {
    const current = this.page();
    return current.page < current.totalPages;
  }

  hasError(control: AbstractControl, error: string): boolean {
    return control.touched && control.hasError(error);
  }

  accountNumberControl(): AbstractControl {
    return this.transactionForm.controls.accountNumber;
  }

  reportEndDateControl(): AbstractControl {
    return this.reportForm.controls.endDate;
  }

  reportIdUserControl(): AbstractControl {
    return this.reportForm.controls.idUser;
  }

  reportStartDateControl(): AbstractControl {
    return this.reportForm.controls.startDate;
  }

  formatAmount(transaction: TransactionResponse): string {
    const amount = this.formatCurrency(transaction.amount);
    return transaction.concept === 'DEBIT' ? `(${amount})` : amount;
  }

  isDebit(transaction: TransactionResponse): boolean {
    return transaction.concept === 'DEBIT';
  }

  accountNumber(transaction: TransactionResponse): string {
    return transaction.idAccount ? this.accountNumbersById()[transaction.idAccount] ?? String(transaction.idAccount) : '-';
  }

  private createFiltersForm(): TransactionFiltersForm {
    return this.fb.group({
      search: this.fb.nonNullable.control('', [Validators.maxLength(128)]),
      accountNumber: this.fb.nonNullable.control('', [
        Validators.pattern(/^[0-9]{0,32}$/),
      ]),
      concept: this.fb.nonNullable.control<ConceptTransaction | ''>(''),
      status: this.fb.nonNullable.control<Status | ''>(''),
      page: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
      pageSize: this.fb.nonNullable.control(10, [Validators.required, Validators.min(1), Validators.max(100)]),
    });
  }

  private createReportForm(): AccountStatementReportForm {
    return this.fb.group({
      idUser: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
      startDate: this.fb.nonNullable.control('', [Validators.required]),
      endDate: this.fb.nonNullable.control('', [Validators.required]),
    });
  }

  private createTransactionForm(): TransactionForm {
    return this.fb.group({
      accountNumber: this.fb.nonNullable.control('', [
        Validators.required,
        Validators.pattern(/^[0-9]{1,32}$/),
      ]),
      amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
      description: this.fb.nonNullable.control('', [Validators.maxLength(255)]),
      concept: this.fb.nonNullable.control<ConceptTransaction>('CREDIT', [Validators.required]),
    });
  }

  private toTransactionCreateRequest(idAccount: number): TransactionCreateRequest {
    const value = this.transactionForm.getRawValue();

    return {
      idAccount,
      amount: Number(value.amount),
      description: value.description.trim(),
      concept: value.concept,
      status: 'ACTIVE',
    };
  }

  private resetTransactionForm(): void {
    this.transactionForm.reset({
      accountNumber: '',
      amount: null,
      description: '',
      concept: 'CREDIT',
    });
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
    }).format(value);
  }

  private downloadPdf(pdfBase64: string, fileName: string): void {
    const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, '').replace(/\s/g, '');
    const binary = atob(cleanBase64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
