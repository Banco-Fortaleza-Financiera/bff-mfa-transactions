import { ConceptTransaction } from './concept-transaction.interface';
import { Status } from './status.interface';

export interface TransactionListFilters {
  page: number;
  pageSize: number;
  search?: string;
  idAccount?: number | null;
  concept?: ConceptTransaction | '';
  status?: Status | '';
}
