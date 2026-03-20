export { lex } from './lexer';
export { parse, parseProgram } from './parser';
export { analyzeSemantics } from './semantics';
export { SymbolTable } from './symbolTable';
export { ClassTable } from './classTable';
export { TokenType } from './token';
export { DiagnosticSeverity } from './diagnostics';
export { explainLex, explainParse, explainSemantics } from './explainability';
export type { LexResult } from './lexer';
export type { ParseResult, ParseSuccess, ParseFailure } from './parser';
export type { SemanticResult, SemanticAction } from './semantics';
export type { Token } from './token';
export type { Diagnostic } from './diagnostics';
export type { SymbolEntry } from './symbolTable';
export type { ClassEntry } from './classTable';
//# sourceMappingURL=browser.d.ts.map