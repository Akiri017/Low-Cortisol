export declare enum DiagnosticSeverity {
    Error = "error",
    Warning = "warning"
}
export type Diagnostic = {
    severity: DiagnosticSeverity;
    message: string;
    start: number;
    end: number;
};
//# sourceMappingURL=diagnostics.d.ts.map