import {
  FormControl,
  FormGroup
} from '@angular/forms';

export type AccountStatementReportForm = FormGroup<{
  idUser: FormControl<number | null>;
  startDate: FormControl<string>;
  endDate: FormControl<string>;
}>;
