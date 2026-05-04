import { ConceptTransaction } from './concept-transaction.interface';
import { Status } from './status.interface';

export interface TransactionResponse {
  id: number;
  idAccount?: number | null;
  amount: number;
  description: string;
  concept: ConceptTransaction;
  status: Status;
  created_at?: string | null;
  updated_at?: string | null;
}
