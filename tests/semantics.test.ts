import { describe, expect, it } from 'vitest';

import { lex } from '../src/lexer';
import { parse } from '../src/parser';
import { analyzeSemantics } from '../src/semantics';

function parseStatement(source: string) {
  const parsed = parse(lex(source).tokens);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error('Parse failed unexpectedly');
  return parsed.statement;
}

describe('Phase 3 semantics', () => {
  it('binds a valid declaration/assignment into the symbol table', () => {
    const stmt = parseStatement('decimal x:12.');
    const sem = analyzeSemantics(stmt);
    expect(sem.ok).toBe(true);
    const entry = sem.symbolTable.get('x');
    expect(entry).toBeTruthy();
    expect(entry!.type).toBe('decimal');
    expect(entry!.value).toBe('12');
  });

  it('evaluates numeric expressions and binds the computed value', () => {
    const stmt = parseStatement('decimal x:2+3*4.');
    const sem = analyzeSemantics(stmt);
    expect(sem.ok).toBe(true);
    expect(sem.symbolTable.get('x')!.value).toBe('14');
  });

  it('rejects type mismatch (numeric type assigned a string)', () => {
    const stmt = parseStatement('decimal x:$Hi$.');
    const sem = analyzeSemantics(stmt);
    expect(sem.ok).toBe(false);
    expect(sem.symbolTable.get('x')).toBeUndefined();
  });

  it('accepts bool literals true/false', () => {
    const stmt = parseStatement('bool isReady:true.');
    const sem = analyzeSemantics(stmt);
    expect(sem.ok).toBe(true);
    expect(sem.symbolTable.get('isReady')!.value).toBe('true');
  });

  it('accepts bool literals 0/1', () => {
    const stmt = parseStatement('bool isSunny:1.');
    const sem = analyzeSemantics(stmt);
    expect(sem.ok).toBe(true);
    expect(sem.symbolTable.get('isSunny')!.value).toBe('1');
  });

  it('reports bool numeric values using boolean meaning in semantic actions', () => {
    const stmt = parseStatement('bool raining:0.');
    const sem = analyzeSemantics(stmt);
    expect(sem.ok).toBe(true);
    const typeCheckAction = sem.actions.find((a) => a.kind === 'typeCheck');
    expect(typeCheckAction).toBeTruthy();
    if (!typeCheckAction || typeCheckAction.kind !== 'typeCheck') return;
    expect(typeCheckAction.message).toContain('0 = false');
    expect(typeCheckAction.message).toContain('Boolean');
  });

  it('rejects bool values other than true/false/0/1', () => {
    const stmt = parseStatement('bool bad:2.');
    const sem = analyzeSemantics(stmt);
    expect(sem.ok).toBe(false);
    expect(sem.diagnostics[0]!.message).toContain('Type mismatch');
  });

  it('rejects output of undeclared identifier', () => {
    const stmt = parseStatement('display x.');
    const sem = analyzeSemantics(stmt);
    expect(sem.ok).toBe(false);
    expect(sem.diagnostics[0]!.message).toContain('Undeclared identifier');
  });

  it('updates an existing binding when redeclared with the same type', () => {
    const s1 = parseStatement('decimal x:10.');
    const r1 = analyzeSemantics(s1);
    expect(r1.ok).toBe(true);

    const before = r1.symbolTable.get('x')!;
    expect(before.value).toBe('10');

    const s2 = parseStatement('decimal x:11.');
    const r2 = analyzeSemantics(s2, r1.symbolTable);
    expect(r2.ok).toBe(true);
    const after = r2.symbolTable.get('x')!;
    expect(after.offset).toBe(before.offset);
    expect(after.value).toBe('11');
  });

  it('rejects redeclaration with a different type', () => {
    const r1 = analyzeSemantics(parseStatement('decimal x:10.'));
    expect(r1.ok).toBe(true);

    const r2 = analyzeSemantics(parseStatement('letters x:$Yo$.'), r1.symbolTable);
    expect(r2.ok).toBe(false);
    expect(r2.diagnostics[0]!.message).toContain('Redeclaration error');
  });

  it('type-checks an if-statement condition and analyzes the body', () => {
    const stmt = parseStatement('if 1 < 2 { decimal x:1. }.');
    const sem = analyzeSemantics(stmt);
    expect(sem.ok).toBe(true);
    expect(sem.symbolTable.get('x')!.value).toBe('1');
  });

  it('rejects non-numeric operands in a comparison condition', () => {
    const stmt = parseStatement('if $a$ < 2 { decimal x:1. }.');
    const sem = analyzeSemantics(stmt);
    expect(sem.ok).toBe(false);
    expect(sem.diagnostics[0]!.message).toContain('Non-numeric');
  });

  it('declares a class and binds its fields into the class table', () => {
    const stmt = parseStatement('class Person { decimal age:20. letters name:$Ian$. }.');
    const sem = analyzeSemantics(stmt);
    expect(sem.ok).toBe(true);
    const cls = sem.classTable.get('Person');
    expect(cls).toBeTruthy();
    expect(cls!.fields.length).toBe(2);
    expect(cls!.fields[0]!.name).toBe('age');
    expect(cls!.fields[0]!.value).toBe('20');
  });

  it('rejects duplicate fields within the same class', () => {
    const stmt = parseStatement('class C { decimal x:1. decimal x:2. }.');
    const sem = analyzeSemantics(stmt);
    expect(sem.ok).toBe(false);
    expect(sem.diagnostics[0]!.message).toContain('Duplicate field');
  });
});
