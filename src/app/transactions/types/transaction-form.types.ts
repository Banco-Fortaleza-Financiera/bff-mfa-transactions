import {
  FormControl,
  FormGroup
} from '@angular/forms';

import { ConceptTransaction } from '../interfaces/concept-transaction.interface';

export type TransactionForm = FormGroup<{
  accountNumber: FormControl<string>;
  amount: FormControl<number | null>;
  description: FormControl<string>;
  concept: FormControl<ConceptTransaction>;
}>;
