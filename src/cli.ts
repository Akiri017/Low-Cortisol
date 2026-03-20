import { explainLex } from './explainability';
import { lex } from './lexer';
import { parseProgram } from './parser';
import { analyzeSemantics } from './semantics';
import { SymbolTable } from './symbolTable';
import { ClassTable } from './classTable';
import { TokenType } from './token';
import * as fs from 'node:fs';

type CliInputMode =
  | { kind: 'inline'; source: string }
  | { kind: 'file'; path: string; source: string }
  | { kind: 'stdin'; source: string };

function readCliInput(argv: string[]): CliInputMode | null {
  const args = argv.slice(2);
  if (args.length === 0) return null;

  const first = args[0];
  if (first === '--file' || first === '-f') {
    const path = args[1];
    if (!path) return null;
    const source = fs.readFileSync(path, 'utf8');
    return { kind: 'file', path, source };
  }

  if (first === '--stdin') {
    // Read entire stdin as UTF-8. This avoids shell escaping issues.
    const source = fs.readFileSync(0, 'utf8');
    return { kind: 'stdin', source };
  }

  const source = args.join(' ');
  return { kind: 'inline', source };
}

function printUsage(): void {
  // eslint-disable-next-line no-console
  console.error('Usage:');
  // eslint-disable-next-line no-console
  console.error('  node dist/cli.js "<single line of Low Cortisol code>"');
  // eslint-disable-next-line no-console
  console.error('  node dist/cli.js --file <path>');
  // eslint-disable-next-line no-console
  console.error('  <program> | node dist/cli.js --stdin');
}

function main(): void {
  const input = readCliInput(process.argv);
  if (!input) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const source = input.source.trimEnd();
  if (source.length === 0) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const result = lex(source);
  const lines = explainLex(result);
  // eslint-disable-next-line no-console
  console.log(lines.join('\n'));

  const parseProgramResult = parseProgram(result.tokens);
  const actualPattern = result.tokens
    .filter((t) => t.type !== TokenType.EOF)
    .map((t) => `[${t.type}]`)
    .join(' ');

  // eslint-disable-next-line no-console
  console.log('\n--- STARTING SYNTAX ANALYSIS ---');
  // eslint-disable-next-line no-console
  console.log('[PARSER] Checking statement structure...');
  // eslint-disable-next-line no-console
  console.log('[PARSER] Expected rule: [PROGRAM] := <statement>*');
  // eslint-disable-next-line no-console
  console.log(`[PARSER] Actual structure: ${actualPattern || '(empty)'}`);

  for (const r of parseProgramResult.recoveries) {
    if (r.strategy === 'Phrase-Level') {
      // eslint-disable-next-line no-console
      console.log(`[PARSER] Recovery Strategy (Phrase-Level): ${r.message}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(
        `[PARSER] Recovery Strategy (Panic-Mode): ${r.message} Skipped ${r.skipped.type} ('${r.skipped.lexeme}').`,
      );
    }
  }

  if (parseProgramResult.ok) {
    // eslint-disable-next-line no-console
    console.log('[PARSER] Program structure is valid.');
    // eslint-disable-next-line no-console
    console.log('Syntax Analysis Complete. No structural errors.');
  } else {
    const first = parseProgramResult.diagnostics[0];
    // eslint-disable-next-line no-console
    console.log(`[PARSER] STRUCTURAL ERROR: ${first?.message ?? 'Unknown parse failure.'}`);
    // eslint-disable-next-line no-console
    console.log('Syntax Analysis Complete. Structural errors detected.');
  }

  if (parseProgramResult.ok) {
    const symbolTable = new SymbolTable();
    const classTable = new ClassTable();
    let semOk = true;

    // eslint-disable-next-line no-console
    console.log('\n--- STARTING SEMANTIC ANALYSIS ---');
    // eslint-disable-next-line no-console
    console.log('[SEMANTICS] Checking Type Compatibility...');

    for (const statement of parseProgramResult.statements) {
      const semResult = analyzeSemantics(statement, symbolTable, classTable);
      for (const action of semResult.actions) {
        if (action.kind === 'typeCheck') {
          // eslint-disable-next-line no-console
          console.log(`[SEMANTICS] ${action.message}`);
        } else if (action.kind === 'bind') {
          const verb = action.action === 'declare' ? 'Binding' : 'Updating';
          // eslint-disable-next-line no-console
          console.log(
            `[SEMANTICS] ${verb} variable '${action.entry.name}' into Symbol Table (type=${action.entry.type}, offset=${action.entry.offset}).`,
          );
        } else if (action.kind === 'bindClass') {
          // eslint-disable-next-line no-console
          console.log(`[SEMANTICS] Declaring class '${action.entry.name}'.`);
        } else {
          // eslint-disable-next-line no-console
          console.log(
            `[SEMANTICS] Declaring field '${action.entry.name}' in class '${action.className}' (type=${action.entry.type}, offset=${action.entry.offset}).`,
          );
        }
      }

      if (!semResult.ok) {
        semOk = false;
        if (semResult.diagnostics.length > 0) {
          const first = semResult.diagnostics[0]!;
          // eslint-disable-next-line no-console
          console.log(`[SEMANTICS] FATAL ERROR: ${first.message}`);
        }
        break;
      }
    }

    // eslint-disable-next-line no-console
    console.log(semOk ? 'Semantic Analysis Complete.' : 'Semantic Analysis Complete. Errors detected.');

    // eslint-disable-next-line no-console
    console.log('Symbol Table:');
    const symbols = symbolTable.entries();
    if (symbols.length === 0) {
      // eslint-disable-next-line no-console
      console.log('  (empty)');
    } else {
      for (const e of symbols) {
        // eslint-disable-next-line no-console
        console.log(`  ${e.name} | type=${e.type} | value=${e.value} | width=${e.width} | level=${e.level} | offset=${e.offset}`);
      }
    }

    // eslint-disable-next-line no-console
    console.log('Class Table:');
    const classes = classTable.entries();
    if (classes.length === 0) {
      // eslint-disable-next-line no-console
      console.log('  (empty)');
    } else {
      for (const c of classes) {
        // eslint-disable-next-line no-console
        console.log(`  class ${c.name}`);
        if (c.fields.length === 0) {
          // eslint-disable-next-line no-console
          console.log('    (no fields)');
          continue;
        }
        for (const f of c.fields) {
          // eslint-disable-next-line no-console
          console.log(`    ${f.name} | type=${f.type} | value=${f.value} | width=${f.width} | level=${f.level} | offset=${f.offset}`);
        }
      }
    }
  }

  if (result.diagnostics.length > 0) {
    // eslint-disable-next-line no-console
    console.log('\nDiagnostics:');
    for (const d of result.diagnostics) {
      // eslint-disable-next-line no-console
      console.log(`- (${d.severity}) ${d.message} [${d.start}, ${d.end})`);
    }
  }

  if (!parseProgramResult.ok && parseProgramResult.diagnostics.length > 0) {
    // eslint-disable-next-line no-console
    console.log('\nParser Diagnostics:');
    for (const d of parseProgramResult.diagnostics) {
      // eslint-disable-next-line no-console
      console.log(`- (${d.severity}) ${d.message} [${d.start}, ${d.end})`);
    }
  }
}

main();
