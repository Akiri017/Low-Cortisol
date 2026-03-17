import { describe, expect, it } from 'vitest';

import { explainLex } from '../src/explainability';
import { lex } from '../src/lexer';
import { TokenType } from '../src/token';

function typesOf(source: string): TokenType[] {
  return lex(source).tokens.map((t) => t.type);
}

function lexemesOf(source: string): string[] {
  return lex(source).tokens.map((t) => t.lexeme);
}

describe('Phase 1 lexer', () => {
  it('tokenizes a spaced declaration/assignment', () => {
    const source = 'decimal x : 12 .';
    expect(typesOf(source)).toEqual([
      TokenType.DataType,
      TokenType.Identifier,
      TokenType.AssignOperator,
      TokenType.NumericLiteral,
      TokenType.Delimiter,
      TokenType.EOF,
    ]);
    expect(lexemesOf(source)).toEqual(['decimal', 'x', ':', '12', '.', '']);
  });

  it('tokenizes when punctuation is adjacent (no spaces)', () => {
    const source = 'letters name:$Ian$.';
    const result = lex(source);
    expect(result.tokens.map((t) => t.type)).toEqual([
      TokenType.DataType,
      TokenType.Identifier,
      TokenType.AssignOperator,
      TokenType.StringLiteral,
      TokenType.Delimiter,
      TokenType.EOF,
    ]);
    expect(result.tokens.map((t) => t.lexeme)).toEqual(['letters', 'name', ':', '$Ian$', '.', '']);
  });

  it('tokenizes a $-delimited char literal', () => {
    const source = 'letter initial:$G$.';
    const result = lex(source);
    expect(result.tokens.map((t) => t.type)).toEqual([
      TokenType.DataType,
      TokenType.Identifier,
      TokenType.AssignOperator,
      TokenType.CharLiteral,
      TokenType.Delimiter,
      TokenType.EOF,
    ]);
    expect(result.tokens.map((t) => t.lexeme)).toEqual(['letter', 'initial', ':', '$G$', '.', '']);
  });

  it('keeps decimal point inside numeric literal and still recognizes delimiter', () => {
    const source = 'decimal pi:3.14.';
    const result = lex(source);
    expect(result.tokens.map((t) => t.type)).toEqual([
      TokenType.DataType,
      TokenType.Identifier,
      TokenType.AssignOperator,
      TokenType.NumericLiteral,
      TokenType.Delimiter,
      TokenType.EOF,
    ]);
    expect(result.tokens.map((t) => t.lexeme)).toEqual(['decimal', 'pi', ':', '3.14', '.', '']);
  });

  it('recognizes output keywords', () => {
    const source = 'display $Hi$.';
    expect(typesOf(source)).toEqual([
      TokenType.OutputKeyword,
      TokenType.StringLiteral,
      TokenType.Delimiter,
      TokenType.EOF,
    ]);
  });

  it('produces UNKNOWN token + diagnostic for invalid lexemes', () => {
    const source = 'decimal x : @ .';
    const result = lex(source);
    expect(result.unknownCount).toBe(1);
    expect(result.diagnostics.length).toBe(1);
    expect(result.tokens.some((t) => t.type === TokenType.Unknown && t.lexeme === '@')).toBe(true);
  });

  it('adds a shell-escaping hint for unterminated strings containing \\"', () => {
    // Common when users type \" inside a shell argument instead of passing plain quotes.
    const source = 'letters name:"Ian\\".';
    const result = lex(source);
    expect(result.unknownCount).toBe(1);
    expect(result.diagnostics.length).toBe(1);
    expect(result.diagnostics[0]!.message).toContain('Unterminated string literal');
    expect(result.diagnostics[0]!.message).toContain('Hint:');
  });

  it('explainability prints each non-EOF token', () => {
    const source = 'decimal x:12.';
    const result = lex(source);
    const lines = explainLex(result);
    expect(lines[0]).toContain('LEXICAL ANALYSIS');
    // Should mention at least the first real token
    expect(lines.join('\n')).toContain("Found 'decimal'");
  });
});
