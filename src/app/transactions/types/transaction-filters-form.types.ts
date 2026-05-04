import {
  FormControl,
  FormGroup
} from '@angular/forms';

import { ConceptTransaction } from '../interfaces/concept-transaction.interface';
import { Status } from '../interfaces/status.interface';

export type TransactionFiltersForm = FormGroup<{
  search: FormControl<string>;
  accountNumber: FormControl<string>;
  concept: FormControl<ConceptTransaction | ''>;
  status: FormControl<Status | ''>;
  page: FormControl<number>;
  pageSize: FormControl<number>;
}>;
