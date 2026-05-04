import { ConceptTransaction } from './concept-transaction.interface';
import { Status } from './status.interface';

export interface TransactionCreateRequest {
  idAccount: number;
  amount: number;
  description?: string;
  concept: ConceptTransaction;
  status?: Status;
}
