export interface AccountStatementReportResponse {
  idUser: number;
  startDate: string;
  endDate: string;
  generatedAt: string;
  totalDebits: number;
  totalCredits: number;
  pdfBase64: string;
}
