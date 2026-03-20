import { describe, expect, it } from 'vitest';

import { lex } from '../src/lexer';
import { parseProgram } from '../src/parser';
import { analyzeSemantics } from '../src/semantics';
import { SymbolTable } from '../src/symbolTable';
import { ClassTable } from '../src/classTable';
import { DiagnosticSeverity } from '../src/diagnostics';

function runPipeline(source: string) {
  const lexResult = lex(source);
  const parsed = parseProgram(lexResult.tokens);
  const symbolTable = new SymbolTable();
  const classTable = new ClassTable();

  const semanticResults = parsed.statements.map((statement) =>
    analyzeSemantics(statement, symbolTable, classTable)
  );

  return {
    lexResult,
    parsed,
    semanticResults,
    symbolTable,
    classTable,
  };
}

describe('Phase 6 parity verification', () => {
  it('handles valid representative source without compiler errors', () => {
    const source = `int age:20.\nletters season:$Spring$.\nclass Crop { int days:4. }.`;
    const result = runPipeline(source);

    const hasLexErrors = result.lexResult.diagnostics.some((d) => d.severity === DiagnosticSeverity.Error);
    const hasParseErrors = result.parsed.diagnostics.some((d) => d.severity === DiagnosticSeverity.Error);
    const hasSemanticErrors = result.semanticResults.some((sem) => !sem.ok);

    expect(hasLexErrors).toBe(false);
    expect(hasParseErrors).toBe(false);
    expect(hasSemanticErrors).toBe(false);
    expect(result.symbolTable.get('age')?.type).toBe('int');
    expect(result.symbolTable.get('season')?.type).toBe('letters');
    expect(result.classTable.get('Crop')).toBeTruthy();
  });

  it('surfaces syntax issue diagnostics for malformed statement patterns', () => {
    const source = 'decimal : x 12.';
    const result = runPipeline(source);

    expect(result.parsed.diagnostics.length).toBeGreaterThan(0);
    expect(result.parsed.recoveries.length).toBeGreaterThan(0);
  });

  it('surfaces semantic mismatch diagnostics when type contracts are violated', () => {
    const source = 'decimal amount:$text$.';
    const result = runPipeline(source);

    const hasParseErrors = result.parsed.diagnostics.some((d) => d.severity === DiagnosticSeverity.Error);
    expect(hasParseErrors).toBe(false);

    expect(result.semanticResults.length).toBe(1);
    expect(result.semanticResults[0]?.ok).toBe(false);
    expect(result.semanticResults[0]?.diagnostics[0]?.message).toContain('Non-numeric literal');
  });

  it('keeps expression-heavy input behavior stable and computes expected value', () => {
    const source = 'decimal total:2+3*4-5/5.';
    const result = runPipeline(source);

    const hasLexErrors = result.lexResult.diagnostics.some((d) => d.severity === DiagnosticSeverity.Error);
    const hasParseErrors = result.parsed.diagnostics.some((d) => d.severity === DiagnosticSeverity.Error);
    const hasSemanticErrors = result.semanticResults.some((sem) => !sem.ok);

    expect(hasLexErrors).toBe(false);
    expect(hasParseErrors).toBe(false);
    expect(hasSemanticErrors).toBe(false);
    expect(result.symbolTable.get('total')?.value).toBe('13');
  });
});
