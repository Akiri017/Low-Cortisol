export enum DiagnosticSeverity {
  Error = 'error',
  Warning = 'warning',
}

export type Diagnostic = {
  severity: DiagnosticSeverity;
  message: string;
  start: number;
  end: number;
};
