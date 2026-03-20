// Browser entry point for the Low Cortisol Compiler
// This exports the necessary functions for the web UI

export { lex } from './lexer';
export { parse, parseProgram } from './parser';
export { analyzeSemantics } from './semantics';
export { SymbolTable } from './symbolTable';
export { ClassTable } from './classTable';
export { TokenType } from './token';
export { DiagnosticSeverity } from './diagnostics';
export { explainLex, explainParse, explainSemantics } from './explainability';

// Re-export types for frontend use
export type { LexResult } from './lexer';
export type { ParseResult, ParseSuccess, ParseFailure } from './parser';
export type { SemanticResult, SemanticAction } from './semantics';
export type { Token } from './token';
export type { Diagnostic } from './diagnostics';
export type { SymbolEntry } from './symbolTable';
export type { ClassEntry } from './classTable';
