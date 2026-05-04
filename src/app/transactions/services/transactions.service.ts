import { Injectable, inject } from '@angular/core';
import { from, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AccountStatementReportRequest } from '../interfaces/account-statement-report-request.interface';
import { AccountStatementReportResponse } from '../interfaces/account-statement-report-response.interface';
import { ApiErrorResponse } from '../interfaces/api-error-response.interface';
import { PagedResponse } from '../interfaces/paged-response.interface';
import { Status } from '../interfaces/status.interface';
import { StatusUpdateRequest } from '../interfaces/status-update-request.interface';
import { TransactionCreateRequest } from '../interfaces/transaction-create-request.interface';
import { TransactionListFilters } from '../interfaces/transaction-list-filters.interface';
import { TransactionResponse } from '../interfaces/transaction-response.interface';
import { paginationFromHeaders } from '../utils/pagination.util';
import { DeviceContextService } from './device-context.service';

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private readonly baseUrl = `${environment.transactionsApiBaseUrl}/transactions`;
  private readonly deviceContextService = inject(DeviceContextService);

  listTransactions(filters: TransactionListFilters): Observable<PagedResponse<TransactionResponse>> {
    const url = this.withParams(this.baseUrl, filters);
    return from(
      this.headers(filters)
        .then((headers) => this.request<TransactionResponse[]>(url, { method: 'GET', headers }))
        .then((response) => ({
          data: response.body.map((transaction) => this.mapTransactionResponse(transaction)),
          page: paginationFromHeaders(response.headers, filters),
        }))
    );
  }

  createTransaction(request: TransactionCreateRequest): Observable<TransactionResponse> {
    return from(
      this.jsonHeaders()
        .then((headers) => this.request<TransactionResponse>(this.baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(request),
        }))
        .then((response) => this.mapTransactionResponse(response.body))
    );
  }

  updateTransactionStatus(id: number, status: Status): Observable<TransactionResponse> {
    return from(
      this.jsonHeaders()
        .then((headers) => this.request<TransactionResponse>(`${this.baseUrl}/${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(this.statusRequest(status)),
        }))
        .then((response) => this.mapTransactionResponse(response.body))
    );
  }

  generateAccountStatementReport(request: AccountStatementReportRequest): Observable<AccountStatementReportResponse> {
    const params = new URLSearchParams({
      idUser: String(request.idUser),
      startDate: request.startDate,
      endDate: request.endDate,
    });

    return from(
      this.headers()
        .then((headers) => this.request<AccountStatementReportResponse>(
          `${this.baseUrl}/reports/account-statement?${params.toString()}`,
          { method: 'GET', headers }
        ))
        .then((response) => response.body)
    );
  }

  async headers(filters?: Partial<TransactionListFilters>): Promise<Headers> {
    const headers = new Headers({
      'x-device-ip': await this.deviceContextService.getDeviceIp(),
      'x-session': this.deviceContextService.getSession(),
    });
    const authorization = this.deviceContextService.getAuthorization();

    if (authorization) {
      headers.set('Authorization', authorization);
    }

    if (filters?.page) {
      headers.set('x-page', String(filters.page));
    }

    if (filters?.pageSize) {
      headers.set('x-page-size', String(filters.pageSize));
    }

    return headers;
  }

  async jsonHeaders(): Promise<Headers> {
    const headers = await this.headers();
    headers.set('Content-Type', 'application/json');
    return headers;
  }

  private withParams(url: string, filters: TransactionListFilters): string {
    const params = new URLSearchParams();

    if (filters.search?.trim()) {
      params.set('search', filters.search.trim());
    }

    if (filters.idAccount) {
      params.set('idAccount', String(filters.idAccount));
    }

    if (filters.concept) {
      params.set('concept', filters.concept);
    }

    if (filters.status) {
      params.set('status', filters.status);
    }

    const query = params.toString();
    return query ? `${url}?${query}` : url;
  }

  statusRequest(status: Status): StatusUpdateRequest {
    return { status };
  }

  private mapTransactionResponse(transaction: TransactionResponse): TransactionResponse {
    return {
      ...transaction,
      description: transaction.description ?? '',
    };
  }

  request<T>(url: string, init: RequestInit): Promise<{ body: T; headers: Headers }> {
    return fetch(url, init).then(async (response) => {
      const body = await this.readJson<T | ApiErrorResponse>(response);

      if (!response.ok) {
        const apiError = body as ApiErrorResponse;
        throw new Error(apiError.message || apiError.detail || 'No fue posible completar la operacion.');
      }

      return {
        body: body as T,
        headers: response.headers,
      };
    });
  }

  private async readJson<T>(response: Response): Promise<T> {
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  }
}
