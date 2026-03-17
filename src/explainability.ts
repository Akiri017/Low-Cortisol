import type { LexResult } from './lexer';
import type { ParseResult } from './parser';
import type { SemanticResult } from './semantics';
import { TokenType } from './token';
import type { SymbolEntry } from './symbolTable';
import type { ClassEntry } from './classTable';

function printableLexeme(lexeme: string): string {
  if (lexeme === '') return '(empty)';
  return lexeme
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

export function explainLex(result: LexResult): string[] {
  const lines: string[] = [];
  lines.push('--- STARTING LEXICAL ANALYSIS ---');

  for (const token of result.tokens) {
    if (token.type === TokenType.EOF) continue;
    lines.push(`[LEXER] Found '${printableLexeme(token.lexeme)}' -> Identified as ${token.type}`);
  }

  // Summary
  const tokenCounts = Object.values(TokenType)
    .filter((t) => t !== TokenType.EOF)
    .map((t) => `${t}=${result.counts[t] ?? 0}`)
    .join(', ');

  lines.push(`Token counts: ${tokenCounts}`);
  lines.push(`Lexical Analysis Complete. ${result.unknownCount} Unknown Tokens.`);
  return lines;
}

export function explainParse(result: ParseResult): string[] {
  const lines: string[] = [];
  lines.push('--- STARTING SYNTAX ANALYSIS ---');
  lines.push('[PARSER] Checking statement structure...');
  lines.push(`[PARSER] Expected rule: ${result.expectedRule}`);
  lines.push(`[PARSER] Actual structure: ${result.actualPattern || '(empty)'}`);

  if (result.recoveries.length > 0) {
    for (const r of result.recoveries) {
      if (r.strategy === 'Phrase-Level') {
        lines.push(`[PARSER] Recovery Strategy (Phrase-Level): ${r.message}`);
      } else {
        lines.push(
          `[PARSER] Recovery Strategy (Panic-Mode): ${r.message} Skipped ${r.skipped.type} ('${printableLexeme(r.skipped.lexeme)}').`,
        );
      }
    }
  }

  if (result.ok) {
    lines.push('[PARSER] Actual structure matches expected rule.');
    const warningCount = result.diagnostics.filter((d) => d.severity === 'warning').length;
    if (warningCount > 0 || result.recoveries.length > 0) {
      lines.push(`Syntax Analysis Complete. ${warningCount} warning(s); recovery applied.`);
    } else {
      lines.push('Syntax Analysis Complete. No structural errors.');
    }
    return lines;
  }

  const first = result.diagnostics[0];
  if (first) {
    lines.push(`[PARSER] STRUCTURAL ERROR: ${first.message}`);
  } else {
    lines.push('[PARSER] STRUCTURAL ERROR: Unknown parse failure.');
  }
  lines.push('Syntax Analysis Complete. Structural errors detected.');
  return lines;
}

function formatSymbolTable(entries: SymbolEntry[]): string[] {
  const lines: string[] = [];
  lines.push('Symbol Table:');
  if (entries.length === 0) {
    lines.push('  (empty)');
    return lines;
  }

  for (const e of entries) {
    lines.push(
      `  ${e.name} | type=${e.type} | value=${e.value} | width=${e.width} | level=${e.level} | offset=${e.offset}`,
    );
  }
  return lines;
}

function formatClassTable(entries: ClassEntry[]): string[] {
  const lines: string[] = [];
  lines.push('Class Table:');
  if (entries.length === 0) {
    lines.push('  (empty)');
    return lines;
  }

  for (const c of entries) {
    lines.push(`  class ${c.name}`);
    if (c.fields.length === 0) {
      lines.push('    (no fields)');
      continue;
    }
    for (const f of c.fields) {
      lines.push(`    ${f.name} | type=${f.type} | value=${f.value} | width=${f.width} | offset=${f.offset}`);
    }
  }
  return lines;
}

export function explainSemantics(result: SemanticResult): string[] {
  const lines: string[] = [];
  lines.push('--- STARTING SEMANTIC ANALYSIS ---');
  lines.push('[SEMANTICS] Checking Type Compatibility...');

  for (const action of result.actions) {
    if (action.kind === 'typeCheck') {
      lines.push(`[SEMANTICS] ${action.message}`);
    } else if (action.kind === 'bind') {
      const verb = action.action === 'declare' ? 'Binding' : 'Updating';
      lines.push(
        `[SEMANTICS] ${verb} variable '${action.entry.name}' into Symbol Table (type=${action.entry.type}, offset=${action.entry.offset}).`,
      );
    } else if (action.kind === 'bindClass') {
      lines.push(`[SEMANTICS] Declaring class '${action.entry.name}'.`);
    } else {
      lines.push(
        `[SEMANTICS] Declaring field '${action.entry.name}' in class '${action.className}' (type=${action.entry.type}, offset=${action.entry.offset}).`,
      );
    }
  }

  if (result.ok) {
    lines.push('Semantic Analysis Complete.');
  } else {
    const first = result.diagnostics[0];
    if (first) lines.push(`[SEMANTICS] FATAL ERROR: ${first.message}`);
    lines.push('Semantic Analysis Complete. Errors detected.');
  }

  lines.push(...formatSymbolTable(result.symbolTable.entries()));
  lines.push(...formatClassTable(result.classTable.entries()));
  return lines;
}
