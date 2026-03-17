import { explainLex, explainParse, explainSemantics } from './explainability';
import { lex } from './lexer';
import { parse } from './parser';
import { analyzeSemantics } from './semantics';
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

  const parseResult = parse(result.tokens);
  // eslint-disable-next-line no-console
  console.log('\n' + explainParse(parseResult).join('\n'));

  if (parseResult.ok) {
    const semResult = analyzeSemantics(parseResult.statement);
    // eslint-disable-next-line no-console
    console.log('\n' + explainSemantics(semResult).join('\n'));

    if (!semResult.ok && semResult.diagnostics.length > 0) {
      // eslint-disable-next-line no-console
      console.log('\nSemantic Diagnostics:');
      for (const d of semResult.diagnostics) {
        // eslint-disable-next-line no-console
        console.log(`- (${d.severity}) ${d.message} [${d.start}, ${d.end})`);
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

  if (!parseResult.ok && parseResult.diagnostics.length > 0) {
    // eslint-disable-next-line no-console
    console.log('\nParser Diagnostics:');
    for (const d of parseResult.diagnostics) {
      // eslint-disable-next-line no-console
      console.log(`- (${d.severity}) ${d.message} [${d.start}, ${d.end})`);
    }
  }
}

main();
