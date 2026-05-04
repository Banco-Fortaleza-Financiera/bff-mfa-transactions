import { Routes } from '@angular/router';
import { TransactionsListComponent } from './transactions/transactions-list/transactions-list.component';

export const routes: Routes = [
  {
    path: 'transactions',
    component: TransactionsListComponent,
  },
  {
    path: '',
    redirectTo: 'transactions',
    pathMatch: 'full',
  },
];
