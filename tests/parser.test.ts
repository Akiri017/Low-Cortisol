import { describe, expect, it } from 'vitest';

import { lex } from '../src/lexer';
import { parse } from '../src/parser';

describe('Phase 2 parser', () => {
  it('parses a valid assignment/declaration statement', () => {
    const source = 'decimal x:12.';
    const lexed = lex(source);
    const parsed = parse(lexed.tokens);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.statement.kind).toBe('AssignmentStatement');
    if (parsed.statement.kind !== 'AssignmentStatement') return;
    expect(parsed.statement.dataType).toBe('decimal');
    expect(parsed.statement.identifier).toBe('x');
    expect(parsed.statement.expression.kind).toBe('NumericLiteralExpr');
    if (parsed.statement.expression.kind !== 'NumericLiteralExpr') return;
    expect(parsed.statement.expression.token.lexeme).toBe('12');
  });

  it('parses a valid output statement', () => {
    const source = 'display $Hi$.';
    const parsed = parse(lex(source).tokens);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.statement.kind).toBe('OutputStatement');
  });

  it('rejects missing delimiter as a syntax error', () => {
    const source = 'decimal x:12';
    const parsed = parse(lex(source).tokens);
    // Phase 4 recovery: missing delimiter is inserted (warning) and parsing succeeds.
    expect(parsed.ok).toBe(true);
    expect(parsed.diagnostics.some((d) => d.message.includes("Missing statement delimiter '.'"))).toBe(true);
  });

  it('rejects wrong token order with a precise expectation', () => {
    const source = 'decimal : x 12.';
    const parsed = parse(lex(source).tokens);
    expect(parsed.ok).toBe(false);
    expect(parsed.diagnostics.length).toBeGreaterThan(0);
    expect(parsed.diagnostics[0]!.message).toContain('Expected');
  });

  it('parses numeric expressions with precedence (* before +)', () => {
    const source = 'decimal x:2+3*4.';
    const parsed = parse(lex(source).tokens);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    if (parsed.statement.kind !== 'AssignmentStatement') return;
    expect(parsed.statement.expression.kind).toBe('BinaryExpr');
  });

  it('recovers from an unexpected token in an expression (panic-mode skip)', () => {
    const source = 'decimal x:10+@5.';
    const parsed = parse(lex(source).tokens);
    expect(parsed.ok).toBe(true);
    expect(parsed.recoveries.some((r) => r.strategy === 'Panic-Mode')).toBe(true);
  });

  it('parses an if-statement with a braced block and numeric comparison', () => {
    const source = 'if 1 < 2 { displayln $ok$. }.';
    const parsed = parse(lex(source).tokens);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.statement.kind).toBe('IfStatement');
    if (parsed.statement.kind !== 'IfStatement') return;
    expect(parsed.statement.condition.kind).toBe('CompareCondition');
    expect(parsed.statement.body.length).toBe(1);
    expect(parsed.statement.body[0]!.kind).toBe('OutputStatement');
  });

  it('parses a while-statement with a braced block and != comparison', () => {
    const source = 'while 1 != 2 { decimal x:1. }.';
    const parsed = parse(lex(source).tokens);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.statement.kind).toBe('WhileStatement');
    if (parsed.statement.kind !== 'WhileStatement') return;
    expect(parsed.statement.body.length).toBe(1);
    expect(parsed.statement.body[0]!.kind).toBe('AssignmentStatement');
  });

  it('parses a class declaration with multiple typed fields', () => {
    const source = 'class Person { decimal age:20. letters name:$Ian$. }.';
    const parsed = parse(lex(source).tokens);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.statement.kind).toBe('ClassDeclaration');
    if (parsed.statement.kind !== 'ClassDeclaration') return;
    expect(parsed.statement.name).toBe('Person');
    expect(parsed.statement.fields.length).toBe(2);
    expect(parsed.statement.fields[0]!.kind).toBe('FieldDeclaration');
  });
});
