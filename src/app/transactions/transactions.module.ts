import { NgModule } from '@angular/core';
import '@angular/compiler';
import { TransactionsListComponent } from './transactions-list/transactions-list.component';

@NgModule({
  imports: [TransactionsListComponent],
  exports: [TransactionsListComponent],
})
export class TransactionsModule {}

export { TransactionsListComponent };
