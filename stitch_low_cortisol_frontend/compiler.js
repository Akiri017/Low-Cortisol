// Browser-compatible compiler bridge
// This module uses the ACTUAL Low Cortisol Compiler from your TypeScript source

import {
  lex,
  parse,
  analyzeSemantics,
  SymbolTable,
  TokenType,
  DiagnosticSeverity,
  explainLex,
  explainParse,
  explainSemantics,
  ClassTable
} from './compiler-bundle.js';

function splitTopLevelStatementTokens(tokens, sourceLength) {
  const eofTemplate = tokens.find(t => t.type === TokenType.EOF) || {
    type: TokenType.EOF,
    lexeme: '',
    span: { start: sourceLength, end: sourceLength }
  };

  const statements = [];
  let current = [];
  let braceDepth = 0;

  for (const token of tokens) {
    if (token.type === TokenType.EOF) {
      break;
    }

    current.push(token);

    if (token.type === TokenType.LBrace) {
      braceDepth += 1;
      continue;
    }

    if (token.type === TokenType.RBrace) {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }

    if (token.type === TokenType.Delimiter && braceDepth === 0) {
      statements.push([...current, eofTemplate]);
      current = [];
    }
  }

  if (current.length > 0) {
    statements.push([...current, eofTemplate]);
  }

  return statements;
}

/**
 * Main compilation function that uses your actual TypeScript compiler
 * @param {string} source - The Low Cortisol source code to compile
 * @returns {Object} Compilation results with lexer, parser, and semantic analysis
 */
export function compileSource(source) {
  console.log('[Compiler] Starting compilation with REAL compiler...');
  console.log('[Compiler] Source:', source);

  // Step 1: Lexical Analysis (using YOUR lexer)
  const lexResult = lex(source);
  const lexExplanation = explainLex(lexResult);

  console.log('[Compiler] Lexical analysis complete:', {
    tokenCount: lexResult.tokens.length,
    diagnostics: lexResult.diagnostics.length,
    unknownCount: lexResult.unknownCount
  });
  console.log('[Compiler] Lex Explanation:', lexExplanation);

  // Step 2: Parsing (using YOUR parser)
  // Split into top-level statements so multi-statement inputs are handled correctly.
  let parseResults = [];
  let parseExplanations = [];

  try {
    const statementTokenGroups = splitTopLevelStatementTokens(lexResult.tokens, source.length);
    parseResults = statementTokenGroups.map(group => parse(group));
    parseExplanations = parseResults.map(result => explainParse(result));

  } catch (error) {
    console.error('[Compiler] Parse error:', error);
    parseResults = [{
      ok: false,
      statement: null,
      diagnostics: [{
        severity: 'Error',
        message: `Parse error: ${error.message}`,
        start: 0,
        end: source.length
      }],
      expectedRule: 'Valid statement',
      actualPattern: 'Error',
      recoveries: []
    }];
    parseExplanations = [['[PARSER] FATAL ERROR: Parse exception']];
  }

  console.log('[Compiler] Parsing complete:', {
    statementCount: parseResults.length,
    parseResults: parseResults.map(r => ({ ok: r.ok, diagnostics: r.diagnostics?.length || 0 }))
  });
  console.log('[Compiler] Parse Explanations:', parseExplanations);

  // Step 3: Semantic Analysis (using YOUR semantic analyzer)
  const semanticResults = [];
  const semanticExplanations = [];
  const sharedSymbolTable = new SymbolTable();
  const sharedClassTable = new ClassTable();

  for (const parseResult of parseResults) {
    if (!parseResult.ok || !parseResult.statement) {
      // Skip semantic analysis for failed parses
      semanticResults.push({
        ok: false,
        diagnostics: [{
          severity: 'Error',
          message: 'Cannot perform semantic analysis on invalid parse result',
          start: 0,
          end: 0
        }],
        actions: [],
        symbolTable: { entries: () => [] },
        classTable: { entries: () => [] }
      });
      semanticExplanations.push(['[SEMANTICS] Skipped due to parse failure']);
      continue;
    }

    try {
      const semResult = analyzeSemantics(parseResult.statement, sharedSymbolTable, sharedClassTable);
      semanticResults.push(semResult);

      // Generate semantic explanation
      const semExplanation = explainSemantics(semResult);
      semanticExplanations.push(semExplanation);

      console.log('[Compiler] Semantic analysis for statement:', {
        ok: semResult.ok,
        diagnostics: semResult.diagnostics?.length || 0,
        symbols: typeof semResult.symbolTable?.entries === 'function' ? semResult.symbolTable.entries().length : 0,
        classes: typeof semResult.classTable?.entries === 'function' ? semResult.classTable.entries().length : 0,
        actions: semResult.actions?.length || 0
      });
    } catch (error) {
      console.error('[Compiler] Semantic analysis error:', error);
      semanticResults.push({
        ok: false,
        diagnostics: [{
          severity: 'Error',
          message: `Semantic error: ${error.message}`,
          start: 0,
          end: 0
        }],
        actions: [],
        symbolTable: { entries: () => [] },
        classTable: { entries: () => [] }
      });
      semanticExplanations.push([`[SEMANTICS] FATAL ERROR: ${error.message}`]);
    }
  }

  // Use one final snapshot to avoid duplicating entries across multi-statement programs.
  const symbolTables = [{ entries: sharedSymbolTable.entries() }];
  const classTables = [{ entries: sharedClassTable.entries() }];

  console.log('[Compiler] Semantic Explanations:', semanticExplanations);

  // Determine if there are errors
  const hasErrors =
    lexResult.diagnostics.some(d => d.severity === 'Error' || d.severity === DiagnosticSeverity.Error) ||
    parseResults.some(r => !r.ok) ||
    semanticResults.some(r => !r.ok);

  console.log('[Compiler] Compilation complete:', {
    hasErrors,
    totalSymbols: symbolTables[0].entries.length,
    totalClasses: classTables[0].entries.length
  });

  return {
    lexResult,
    lexExplanation,
    parseResults,
    parseExplanations,
    semanticResults,
    semanticExplanations,
    symbolTables,
    classTables,
    hasErrors
  };
}

// Export TokenType enum for UI to use
export { TokenType };
