import { DiagnosticSeverity, type Diagnostic } from './diagnostics';
import { DATA_TYPES, OUTPUT_KEYWORDS } from './language';
import { TokenType, type Token } from './token';
import type { Condition, Expression, FieldDeclaration, Statement } from './ast';

export type ParseSuccess = {
  ok: true;
  statement: Statement;
  diagnostics: Diagnostic[];
  expectedRule: string;
  actualPattern: string;
  recoveries: RecoveryAction[];
};

export type ParseFailure = {
  ok: false;
  statement: null;
  diagnostics: Diagnostic[];
  expectedRule: string;
  actualPattern: string;
  recoveries: RecoveryAction[];
};

export type ParseResult = ParseSuccess | ParseFailure;

export type RecoveryAction =
  | {
      strategy: 'Phrase-Level';
      action: 'insertDelimiter';
      message: string;
    }
  | {
      strategy: 'Panic-Mode';
      action: 'skipToken';
      message: string;
      skipped: { type: TokenType; lexeme: string };
    };

const LITERAL_TYPES = new Set<TokenType>([
  TokenType.NumericLiteral,
  TokenType.StringLiteral,
  TokenType.CharLiteral,
]);

const NUMERIC_TYPES = new Set<string>(['decimal', 'doubleDecimal', 'int']);

function patternOf(tokens: Token[]): string {
  const parts: string[] = [];
  for (const t of tokens) {
    if (t.type === TokenType.EOF) break;
    parts.push(`[${t.type}]`);
  }
  return parts.join(' ');
}

class Parser {
  private readonly tokens: Token[];
  private index = 0;
  readonly diagnostics: Diagnostic[] = [];
  readonly recoveries: RecoveryAction[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(offset = 0): Token {
    const i = this.index + offset;
    return this.tokens[i] ?? this.tokens[this.tokens.length - 1]!;
  }

  private at(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private consume(): Token {
    const t = this.peek();
    this.index += 1;
    return t;
  }

  currentToken(): Token {
    return this.peek();
  }

  consumeCurrentToken(): Token {
    return this.consume();
  }

  private errorAt(token: Token, message: string): void {
    this.diagnostics.push({
      severity: DiagnosticSeverity.Error,
      message,
      start: token.span.start,
      end: token.span.end,
    });
  }

  private warnAt(token: Token, message: string): void {
    this.diagnostics.push({
      severity: DiagnosticSeverity.Warning,
      message,
      start: token.span.start,
      end: token.span.end,
    });
  }

  private errorAtEnd(message: string): void {
    const eof = this.tokens.find((t) => t.type === TokenType.EOF) ?? this.tokens[this.tokens.length - 1]!;
    this.diagnostics.push({
      severity: DiagnosticSeverity.Error,
      message,
      start: eof.span.start,
      end: eof.span.end,
    });
  }

  private expect(type: TokenType, expectation: string): Token | null {
    const t = this.peek();
    if (t.type === type) return this.consume();

    if (t.type === TokenType.EOF) {
      this.errorAtEnd(`Expected ${expectation}, but reached end of input.`);
      return null;
    }

    this.errorAt(t, `Expected ${expectation}, but found ${t.type} ('${t.lexeme}').`);
    return null;
  }

  private panicSkipOne(reason: string): void {
    const t = this.peek();
    if (t.type === TokenType.EOF) return;
    this.recoveries.push({
      strategy: 'Panic-Mode',
      action: 'skipToken',
      message: reason,
      skipped: { type: t.type, lexeme: t.lexeme },
    });
    this.consume();
  }

  parseStatement(): { statement: Statement | null; expectedRule: string } {
    const first = this.peek();

    if (first.type === TokenType.DataType) {
      return { statement: this.parseAssignment(), expectedRule: '[DATATYPE] [IDENTIFIER] [ASSIGN_OPERATOR] [LITERAL] [DELIMITER]' };
    }

    if (first.type === TokenType.OutputKeyword) {
      return { statement: this.parseOutput(), expectedRule: '[OUTPUT_KEYWORD] [VALUE] [DELIMITER]' };
    }

    if (first.type === TokenType.IfKeyword) {
      return { statement: this.parseIf(), expectedRule: '[IF] [EXPR] [COMPARE_OP] [EXPR] [LBRACE] <statements> [RBRACE] [DELIMITER]' };
    }

    if (first.type === TokenType.WhileKeyword) {
      return { statement: this.parseWhile(), expectedRule: '[WHILE] [EXPR] [COMPARE_OP] [EXPR] [LBRACE] <statements> [RBRACE] [DELIMITER]' };
    }

    if (first.type === TokenType.ClassKeyword) {
      return { statement: this.parseClass(), expectedRule: '[CLASS] [IDENTIFIER] [LBRACE] <fields> [RBRACE] [DELIMITER]' };
    }

    if (first.type === TokenType.EOF) {
      this.errorAtEnd('Expected a statement, but input was empty.');
      return { statement: null, expectedRule: '[DATATYPE] ... OR [OUTPUT_KEYWORD] ...' };
    }

    this.errorAt(
      first,
      `Expected statement to start with DATATYPE, OUTPUT_KEYWORD, IF, WHILE, or CLASS, but found ${first.type} ('${first.lexeme}').`,
    );
    return { statement: null, expectedRule: '[DATATYPE] ... OR [OUTPUT_KEYWORD] ... OR [IF] ... OR [WHILE] ... OR [CLASS] ...' };
  }

  private parseIf(): Statement | null {
    this.expect(TokenType.IfKeyword, "keyword 'if'");
    const condition = this.parseCondition();
    const body = this.parseBlockStatements();
    const delimOk = this.expectOrRecoverDelimiter();
    if (!condition || !body || !delimOk) return null;
    return { kind: 'IfStatement', condition, body, delimiter: '.' };
  }

  private parseWhile(): Statement | null {
    this.expect(TokenType.WhileKeyword, "keyword 'while'");
    const condition = this.parseCondition();
    const body = this.parseBlockStatements();
    const delimOk = this.expectOrRecoverDelimiter();
    if (!condition || !body || !delimOk) return null;
    return { kind: 'WhileStatement', condition, body, delimiter: '.' };
  }

  private parseClass(): Statement | null {
    this.expect(TokenType.ClassKeyword, "keyword 'class'");
    const nameTok = this.expect(TokenType.Identifier, 'a class name IDENTIFIER');
    const lbrace = this.expect(TokenType.LBrace, "'{' to start class body");
    if (!nameTok || !lbrace) {
      // attempt to recover by skipping until delimiter
      while (this.peek().type !== TokenType.EOF && this.peek().type !== TokenType.Delimiter) this.consume();
      this.expectOrRecoverDelimiter();
      return null;
    }

    const fields: FieldDeclaration[] = [];
    while (this.peek().type !== TokenType.EOF && this.peek().type !== TokenType.RBrace) {
      const f = this.parseFieldDeclaration();
      if (f) {
        fields.push(f);
        continue;
      }

      // Panic-mode inside class body: skip until next delimiter or closing brace.
      if (this.peek().type === TokenType.RBrace) break;
      this.panicSkipOne('Skipping unexpected token inside class body (panic-mode recovery).');
      while (this.peek().type !== TokenType.EOF && this.peek().type !== TokenType.Delimiter && this.peek().type !== TokenType.RBrace) {
        this.panicSkipOne('Skipping token while recovering inside class body.');
      }
      if (this.peek().type === TokenType.Delimiter) this.consume();
    }

    const rbrace = this.expect(TokenType.RBrace, "'}' to close class body");
    const delimOk = this.expectOrRecoverDelimiter();
    if (!rbrace || !delimOk) return null;

    return { kind: 'ClassDeclaration', name: nameTok.lexeme, fields, delimiter: '.' };
  }

  private parseFieldDeclaration(): FieldDeclaration | null {
    const dtTok = this.expect(TokenType.DataType, 'a field DATATYPE');
    const nameTok = this.expect(TokenType.Identifier, 'a field name IDENTIFIER');
    const assignTok = this.expect(TokenType.AssignOperator, 'an ASSIGN_OPERATOR (:) in field declaration');

    if (!dtTok || !nameTok || !assignTok) return null;

    const declaredTypeLex = dtTok.lexeme;
    const isNumeric = NUMERIC_TYPES.has(declaredTypeLex);
    let expression: Expression | null = null;
    if (isNumeric) {
      expression = this.parseNumericExpression();
    } else {
      const valueTok = this.peek();
      if (
        valueTok.type === TokenType.Identifier ||
        valueTok.type === TokenType.StringLiteral ||
        valueTok.type === TokenType.CharLiteral ||
        valueTok.type === TokenType.NumericLiteral
      ) {
        const tok = this.consume();
        expression =
          tok.type === TokenType.StringLiteral
            ? { kind: 'StringLiteralExpr', token: tok }
            : tok.type === TokenType.CharLiteral
              ? { kind: 'CharLiteralExpr', token: tok }
              : tok.type === TokenType.Identifier
                ? { kind: 'IdentifierExpr', token: tok }
                : { kind: 'NumericLiteralExpr', token: tok };
      } else {
        if (valueTok.type === TokenType.EOF) {
          this.errorAtEnd('Expected a field initializer value, but reached end of input.');
        } else {
          this.errorAt(valueTok, `Expected a field initializer value, but found ${valueTok.type} ('${valueTok.lexeme}').`);
        }
      }
    }

    const delimOk = this.expectOrRecoverDelimiter();
    if (!expression || !delimOk) return null;

    const dtLex = dtTok.lexeme as any;
    return {
      kind: 'FieldDeclaration',
      dataType: dtLex,
      name: nameTok.lexeme,
      assignOperator: ':',
      expression,
      delimiter: '.',
    };
  }

  private parseCondition(): Condition | null {
    const left = this.parseNumericExpression();
    const opTok = this.peek();
    const op = this.parseCompareOperator();
    const right = this.parseNumericExpression();

    if (!left || !op || !right) {
      if (opTok.type === TokenType.EOF) this.errorAtEnd('Expected a numeric comparison in condition.');
      return null;
    }

    return { kind: 'CompareCondition', operator: op, left, right };
  }

  private parseCompareOperator(): Condition['operator'] | null {
    const t = this.peek();
    switch (t.type) {
      case TokenType.Less:
        this.consume();
        return '<';
      case TokenType.LessEqual:
        this.consume();
        return '<=';
      case TokenType.Greater:
        this.consume();
        return '>';
      case TokenType.GreaterEqual:
        this.consume();
        return '>=';
      case TokenType.EqualEqual:
        this.consume();
        return '==';
      case TokenType.BangEqual:
        this.consume();
        return '!=';
      default:
        if (t.type === TokenType.EOF) {
          this.errorAtEnd('Expected a comparison operator in condition.');
        } else {
          this.errorAt(t, `Expected a comparison operator in condition, but found ${t.type} ('${t.lexeme}').`);
        }
        return null;
    }
  }

  private parseBlockStatements(): Statement[] | null {
    const lbrace = this.expect(TokenType.LBrace, "'{' to start a block");
    if (!lbrace) return null;
    const statements: Statement[] = [];

    while (this.peek().type !== TokenType.EOF && this.peek().type !== TokenType.RBrace) {
      const { statement } = this.parseStatement();
      if (statement) {
        statements.push(statement);
        continue;
      }

      // Panic-mode within a block: skip until delimiter or end of block.
      this.panicSkipOne('Skipping unexpected token inside block (panic-mode recovery).');
      while (this.peek().type !== TokenType.EOF && this.peek().type !== TokenType.Delimiter && this.peek().type !== TokenType.RBrace) {
        this.panicSkipOne('Skipping token while recovering inside block.');
      }
      if (this.peek().type === TokenType.Delimiter) this.consume();
    }

    const rbrace = this.expect(TokenType.RBrace, "'}' to close a block");
    if (!rbrace) return null;
    return statements;
  }

  private expectOrRecoverDelimiter(): boolean {
    const delimTok = this.peek();
    if (delimTok.type === TokenType.Delimiter) {
      this.consume();
      return true;
    }

    if (delimTok.type === TokenType.EOF || delimTok.type === TokenType.RBrace) {
      this.warnAt(delimTok, "Missing statement delimiter '.' at end of statement. Inserted '.' (phrase-level recovery). ");
      this.recoveries.push({
        strategy: 'Phrase-Level',
        action: 'insertDelimiter',
        message: "Inserted missing '.' delimiter.",
      });
      return true;
    }

    this.errorAt(delimTok, `Expected statement delimiter '.', but found ${delimTok.type} ('${delimTok.lexeme}').`);
    return false;
  }

  private parseAssignment(): Statement | null {
    const dtTok = this.expect(TokenType.DataType, 'a DATATYPE');
    const idTok = this.expect(TokenType.Identifier, 'an IDENTIFIER after DATATYPE');
    const assignTok = this.expect(TokenType.AssignOperator, 'an ASSIGN_OPERATOR (:) after IDENTIFIER');

    const declaredTypeLex = dtTok?.lexeme ?? '';
    const isNumeric = NUMERIC_TYPES.has(declaredTypeLex);

    let expression: Expression | null = null;
    if (isNumeric) {
      expression = this.parseNumericExpression();
    } else {
      // Non-numeric assignments remain literal/identifier-only in v1.
      const valueTok = this.peek();
      if (
        valueTok.type === TokenType.Identifier ||
        valueTok.type === TokenType.StringLiteral ||
        valueTok.type === TokenType.CharLiteral ||
        valueTok.type === TokenType.NumericLiteral
      ) {
        const tok = this.consume();
        expression =
          tok.type === TokenType.StringLiteral
            ? { kind: 'StringLiteralExpr', token: tok }
            : tok.type === TokenType.CharLiteral
              ? { kind: 'CharLiteralExpr', token: tok }
              : tok.type === TokenType.Identifier
                ? { kind: 'IdentifierExpr', token: tok }
                : { kind: 'NumericLiteralExpr', token: tok };
      } else {
        if (valueTok.type === TokenType.EOF) {
          this.errorAtEnd('Expected a value after ASSIGN_OPERATOR, but reached end of input.');
        } else {
          this.errorAt(valueTok, `Expected a value after ASSIGN_OPERATOR, but found ${valueTok.type} ('${valueTok.lexeme}').`);
        }
      }

      // If an operator shows up, panic-skip until delimiter.
      while (
        this.peek().type === TokenType.Plus ||
        this.peek().type === TokenType.Minus ||
        this.peek().type === TokenType.Star ||
        this.peek().type === TokenType.Slash
      ) {
        this.panicSkipOne('Unexpected arithmetic operator in non-numeric assignment; skipping.');
      }
    }

    const delimTok = this.peek();
    let delimOk = false;
    if (delimTok.type === TokenType.Delimiter) {
      this.consume();
      delimOk = true;
    } else {
      if (delimTok.type === TokenType.EOF) {
        // Phrase-level recovery: insert the missing delimiter.
        const eof = this.peek();
        this.warnAt(eof, "Missing statement delimiter '.' at end of statement. Inserted '.' (phrase-level recovery). ");
        this.recoveries.push({
          strategy: 'Phrase-Level',
          action: 'insertDelimiter',
          message: "Inserted missing '.' delimiter.",
        });
        delimOk = true;
      } else {
        this.errorAt(delimTok, `Expected statement delimiter '.', but found ${delimTok.type} ('${delimTok.lexeme}').`);
      }
    }

    // If any mandatory pieces were missing, abort AST creation.
    if (!dtTok || !idTok || !assignTok || !expression || !delimOk) return null;

    const dtLex = dtTok.lexeme;
    const kw = dtLex as (typeof DATA_TYPES)[number];
    if (!(DATA_TYPES as readonly string[]).includes(dtLex)) {
      this.errorAt(dtTok, `Unknown datatype '${dtLex}'.`);
      return null;
    }

    return {
      kind: 'AssignmentStatement',
      dataType: kw,
      identifier: idTok.lexeme,
      assignOperator: ':',
      expression,
      delimiter: '.',
    };
  }

  private parseOutput(): Statement | null {
    const kwTok = this.expect(TokenType.OutputKeyword, 'an OUTPUT_KEYWORD');

    const valueTok = this.peek();
    let value: Token | null = null;
    if (
      valueTok.type === TokenType.Identifier ||
      LITERAL_TYPES.has(valueTok.type)
    ) {
      value = this.consume();
    } else {
      if (valueTok.type === TokenType.EOF) {
        this.errorAtEnd('Expected a value after OUTPUT_KEYWORD, but reached end of input.');
      } else {
        this.errorAt(valueTok, `Expected a value after OUTPUT_KEYWORD, but found ${valueTok.type} ('${valueTok.lexeme}').`);
      }
    }

    const delimTok = this.peek();
    let delimOk = false;
    if (delimTok.type === TokenType.Delimiter) {
      this.consume();
      delimOk = true;
    } else {
      if (delimTok.type === TokenType.EOF) {
        const eof = this.peek();
        this.warnAt(eof, "Missing statement delimiter '.' at end of statement. Inserted '.' (phrase-level recovery). ");
        this.recoveries.push({
          strategy: 'Phrase-Level',
          action: 'insertDelimiter',
          message: "Inserted missing '.' delimiter.",
        });
        delimOk = true;
      } else {
        this.errorAt(delimTok, `Expected statement delimiter '.', but found ${delimTok.type} ('${delimTok.lexeme}').`);
      }
    }

    if (!kwTok || !value || !delimOk) return null;

    const kwLex = kwTok.lexeme;
    const kw = kwLex as (typeof OUTPUT_KEYWORDS)[number];
    if (!(OUTPUT_KEYWORDS as readonly string[]).includes(kwLex)) {
      this.errorAt(kwTok, `Unknown output keyword '${kwLex}'.`);
      return null;
    }

    return {
      kind: 'OutputStatement',
      keyword: kw,
      value,
      delimiter: '.',
    };
  }

  private parseNumericExpression(): Expression | null {
    return this.parseAdditive();
  }

  private parseAdditive(): Expression | null {
    let left = this.parseMultiplicative();
    if (!left) return null;

    while (this.peek().type === TokenType.Plus || this.peek().type === TokenType.Minus) {
      const opTok = this.consume();
      const right = this.parseMultiplicative();
      if (!right) return left;
      left = {
        kind: 'BinaryExpr',
        operator: opTok.type === TokenType.Plus ? '+' : '-',
        left,
        right,
      };
    }
    return left;
  }

  private parseMultiplicative(): Expression | null {
    let left = this.parseUnary();
    if (!left) return null;

    while (this.peek().type === TokenType.Star || this.peek().type === TokenType.Slash) {
      const opTok = this.consume();
      const right = this.parseUnary();
      if (!right) return left;
      left = {
        kind: 'BinaryExpr',
        operator: opTok.type === TokenType.Star ? '*' : '/',
        left,
        right,
      };
    }
    return left;
  }

  private parseUnary(): Expression | null {
    const t = this.peek();
    if (t.type === TokenType.Plus || t.type === TokenType.Minus) {
      this.consume();
      const operand = this.parseUnary();
      if (!operand) return null;
      return { kind: 'UnaryExpr', operator: t.type === TokenType.Minus ? '-' : '+', operand };
    }
    return this.parsePrimaryNumeric();
  }

  private parsePrimaryNumeric(): Expression | null {
    // Panic-skip unexpected tokens until we find a plausible operand or hit delimiter/EOF.
    while (true) {
      const t = this.peek();
      if (t.type === TokenType.NumericLiteral) {
        return { kind: 'NumericLiteralExpr', token: this.consume() };
      }
      if (t.type === TokenType.Identifier) {
        return { kind: 'IdentifierExpr', token: this.consume() };
      }
      if (t.type === TokenType.StringLiteral) {
        return { kind: 'StringLiteralExpr', token: this.consume() };
      }
      if (t.type === TokenType.CharLiteral) {
        return { kind: 'CharLiteralExpr', token: this.consume() };
      }

      if (t.type === TokenType.EOF || t.type === TokenType.Delimiter) {
        this.errorAt(t, 'Expected a numeric literal or identifier in numeric expression.');
        return null;
      }

      this.warnAt(t, `Unexpected token in numeric expression: ${t.type} ('${t.lexeme}').`);
      this.panicSkipOne('Skipping unexpected token in numeric expression (panic-mode recovery).');
    }
  }
}

export function parse(tokens: Token[]): ParseResult {
  const parser = new Parser(tokens);
  const { statement, expectedRule } = parser.parseStatement();
  const actualPattern = patternOf(tokens);

  // If there are extra non-EOF tokens after a successful parse, flag them.
  if (statement) {
    const firstExtra = parser.currentToken();
    if (firstExtra.type !== TokenType.EOF) {
      parser.diagnostics.push({
        severity: DiagnosticSeverity.Error,
        message: `Unexpected token after complete statement: ${firstExtra.type} ('${firstExtra.lexeme}').`,
        start: firstExtra.span.start,
        end: firstExtra.span.end,
      });
    }
  }

  const hasErrors = parser.diagnostics.some((d) => d.severity === DiagnosticSeverity.Error);
  const ok = !hasErrors && statement !== null;
  if (ok) {
    return {
      ok: true,
      statement,
      diagnostics: parser.diagnostics,
      expectedRule,
      actualPattern,
      recoveries: parser.recoveries,
    };
  }

  return {
    ok: false,
    statement: null,
    diagnostics: parser.diagnostics,
    expectedRule,
    actualPattern,
    recoveries: parser.recoveries,
  };
}

export type ParseProgramResult = {
  ok: boolean;
  statements: Statement[];
  diagnostics: Diagnostic[];
  recoveries: RecoveryAction[];
};

export function parseProgram(tokens: Token[]): ParseProgramResult {
  const parser = new Parser(tokens);
  const statements: Statement[] = [];

  while (parser.currentToken().type !== TokenType.EOF) {
    const start = parser.currentToken();
    const { statement } = parser.parseStatement();
    if (statement) {
      statements.push(statement);
      continue;
    }

    // Panic-mode: skip tokens until delimiter or EOF to re-sync.
    parser.recoveries.push({
      strategy: 'Panic-Mode',
      action: 'skipToken',
      message: 'Statement parse failed; skipping tokens until delimiter to recover.',
      skipped: { type: start.type, lexeme: start.lexeme },
    });

    while (parser.currentToken().type !== TokenType.EOF && parser.currentToken().type !== TokenType.Delimiter) {
      parser.consumeCurrentToken();
    }
    if (parser.currentToken().type === TokenType.Delimiter) {
      parser.consumeCurrentToken();
    }
  }

  const hasErrors = parser.diagnostics.some((d) => d.severity === DiagnosticSeverity.Error);
  return { ok: !hasErrors, statements, diagnostics: parser.diagnostics, recoveries: parser.recoveries };
}
