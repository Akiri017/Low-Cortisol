// src/diagnostics.ts
var DiagnosticSeverity = /* @__PURE__ */ ((DiagnosticSeverity2) => {
  DiagnosticSeverity2["Error"] = "error";
  DiagnosticSeverity2["Warning"] = "warning";
  return DiagnosticSeverity2;
})(DiagnosticSeverity || {});

// src/language.ts
var DATA_TYPES = ["decimal", "doubleDecimal", "letters", "letter", "int", "bool"];
var OUTPUT_KEYWORDS = ["display", "displayln", "displayf"];
var ASSIGN_OPERATOR = ":";
var STATEMENT_DELIMITER = ".";

// src/token.ts
var TokenType = /* @__PURE__ */ ((TokenType2) => {
  TokenType2["DataType"] = "DATATYPE";
  TokenType2["OutputKeyword"] = "OUTPUT_KEYWORD";
  TokenType2["IfKeyword"] = "IF_KEYWORD";
  TokenType2["WhileKeyword"] = "WHILE_KEYWORD";
  TokenType2["ClassKeyword"] = "CLASS_KEYWORD";
  TokenType2["Identifier"] = "IDENTIFIER";
  TokenType2["AssignOperator"] = "ASSIGN_OPERATOR";
  TokenType2["Delimiter"] = "DELIMITER";
  TokenType2["LBrace"] = "LBRACE";
  TokenType2["RBrace"] = "RBRACE";
  TokenType2["Less"] = "LESS";
  TokenType2["LessEqual"] = "LESS_EQUAL";
  TokenType2["Greater"] = "GREATER";
  TokenType2["GreaterEqual"] = "GREATER_EQUAL";
  TokenType2["EqualEqual"] = "EQUAL_EQUAL";
  TokenType2["BangEqual"] = "BANG_EQUAL";
  TokenType2["Plus"] = "PLUS";
  TokenType2["Minus"] = "MINUS";
  TokenType2["Star"] = "STAR";
  TokenType2["Slash"] = "SLASH";
  TokenType2["NumericLiteral"] = "NUMERIC_LITERAL";
  TokenType2["StringLiteral"] = "STRING_LITERAL";
  TokenType2["CharLiteral"] = "CHAR_LITERAL";
  TokenType2["Unknown"] = "UNKNOWN";
  TokenType2["EOF"] = "EOF";
  return TokenType2;
})(TokenType || {});

// src/lexer.ts
var isWhitespace = (ch) => ch === " " || ch === "	" || ch === "\n" || ch === "\r";
var isDigit = (ch) => ch >= "0" && ch <= "9";
var isIdentStart = (ch) => ch >= "A" && ch <= "Z" || ch >= "a" && ch <= "z" || ch === "_";
var isIdentPart = (ch) => isIdentStart(ch) || isDigit(ch);
function makeToken(type, lexeme, start, end) {
  return { type, lexeme, span: { start, end } };
}
function pushToken(tokens, counts, token) {
  tokens.push(token);
  counts[token.type] = (counts[token.type] ?? 0) + 1;
}
function initCounts() {
  return Object.values(TokenType).reduce((acc, t) => {
    acc[t] = 0;
    return acc;
  }, {});
}
function lex(source) {
  const tokens = [];
  const diagnostics = [];
  const counts = initCounts();
  let unknownCount = 0;
  let index = 0;
  const length = source.length;
  const addUnknown = (lexeme, start, end, message) => {
    unknownCount += 1;
    pushToken(tokens, counts, makeToken("UNKNOWN" /* Unknown */, lexeme, start, end));
    diagnostics.push({
      severity: "error" /* Error */,
      message,
      start,
      end
    });
  };
  while (index < length) {
    const ch = source[index];
    if (isWhitespace(ch)) {
      index += 1;
      continue;
    }
    const start = index;
    if (ch === ASSIGN_OPERATOR) {
      index += 1;
      pushToken(tokens, counts, makeToken("ASSIGN_OPERATOR" /* AssignOperator */, ASSIGN_OPERATOR, start, index));
      continue;
    }
    if (ch === STATEMENT_DELIMITER) {
      index += 1;
      pushToken(tokens, counts, makeToken("DELIMITER" /* Delimiter */, STATEMENT_DELIMITER, start, index));
      continue;
    }
    if (ch === "{") {
      index += 1;
      pushToken(tokens, counts, makeToken("LBRACE" /* LBrace */, "{", start, index));
      continue;
    }
    if (ch === "}") {
      index += 1;
      pushToken(tokens, counts, makeToken("RBRACE" /* RBrace */, "}", start, index));
      continue;
    }
    if (ch === "<") {
      if (index + 1 < length && source[index + 1] === "=") {
        index += 2;
        pushToken(tokens, counts, makeToken("LESS_EQUAL" /* LessEqual */, "<=", start, index));
      } else {
        index += 1;
        pushToken(tokens, counts, makeToken("LESS" /* Less */, "<", start, index));
      }
      continue;
    }
    if (ch === ">") {
      if (index + 1 < length && source[index + 1] === "=") {
        index += 2;
        pushToken(tokens, counts, makeToken("GREATER_EQUAL" /* GreaterEqual */, ">=", start, index));
      } else {
        index += 1;
        pushToken(tokens, counts, makeToken("GREATER" /* Greater */, ">", start, index));
      }
      continue;
    }
    if (ch === "=") {
      if (index + 1 < length && source[index + 1] === "=") {
        index += 2;
        pushToken(tokens, counts, makeToken("EQUAL_EQUAL" /* EqualEqual */, "==", start, index));
      } else {
        index += 1;
        addUnknown("=", start, index, "Unknown token '='. Did you mean '=='?");
      }
      continue;
    }
    if (ch === "!") {
      if (index + 1 < length && source[index + 1] === "=") {
        index += 2;
        pushToken(tokens, counts, makeToken("BANG_EQUAL" /* BangEqual */, "!=", start, index));
      } else {
        index += 1;
        addUnknown("!", start, index, "Unknown token '!'. Did you mean '!='?");
      }
      continue;
    }
    if (ch === "+") {
      index += 1;
      pushToken(tokens, counts, makeToken("PLUS" /* Plus */, "+", start, index));
      continue;
    }
    if (ch === "-") {
      index += 1;
      pushToken(tokens, counts, makeToken("MINUS" /* Minus */, "-", start, index));
      continue;
    }
    if (ch === "*") {
      index += 1;
      pushToken(tokens, counts, makeToken("STAR" /* Star */, "*", start, index));
      continue;
    }
    if (ch === "/") {
      index += 1;
      pushToken(tokens, counts, makeToken("SLASH" /* Slash */, "/", start, index));
      continue;
    }
    if (ch === "$") {
      const delimiterLen = index + 1 < length && source[index + 1] === "$" ? 2 : 1;
      index += delimiterLen;
      const contentStart = index;
      let closed = false;
      while (index < length) {
        const c = source[index];
        if (c === "\\") {
          index += 1;
          if (index < length) index += 1;
          continue;
        }
        if (delimiterLen === 2) {
          if (c === "$" && index + 1 < length && source[index + 1] === "$") {
            index += 2;
            closed = true;
            break;
          }
        } else {
          if (c === "$") {
            index += 1;
            closed = true;
            break;
          }
        }
        index += 1;
      }
      const lexeme = source.slice(start, index);
      if (!closed) {
        addUnknown(lexeme, start, index, "Unterminated $-delimited literal. Expected closing $ (or $$).");
      } else {
        const contentEnd = index - delimiterLen;
        const content = source.slice(contentStart, contentEnd);
        const t = content.length === 1 ? "CHAR_LITERAL" /* CharLiteral */ : "STRING_LITERAL" /* StringLiteral */;
        pushToken(tokens, counts, makeToken(t, lexeme, start, index));
      }
      continue;
    }
    if (ch === '"') {
      index += 1;
      let closed = false;
      while (index < length) {
        const c = source[index];
        if (c === "\\") {
          index += 1;
          if (index < length) index += 1;
          continue;
        }
        if (c === '"') {
          index += 1;
          closed = true;
          break;
        }
        index += 1;
      }
      const lexeme = source.slice(start, index);
      if (!closed) {
        const hint = lexeme.includes('\\"') || lexeme.includes("\\'") ? ' Hint: your source contains backslashes before quotes (e.g. \\"), which is often caused by shell escaping. In PowerShell, either wrap the whole program in single quotes, or escape embedded double-quotes as `" (backtick + quote), not \\".' : "";
        addUnknown(lexeme, start, index, `Unterminated string literal.${hint}`);
      } else {
        pushToken(tokens, counts, makeToken("STRING_LITERAL" /* StringLiteral */, lexeme, start, index));
      }
      continue;
    }
    if (ch === "'") {
      index += 1;
      if (index >= length) {
        addUnknown(source.slice(start, index), start, index, "Unterminated char literal.");
        continue;
      }
      if (source[index] === "\\") {
        index += 2;
      } else {
        index += 1;
      }
      if (index >= length || source[index] !== "'") {
        while (index < length && !isWhitespace(source[index]) && source[index] !== STATEMENT_DELIMITER) {
          if (source[index] === ASSIGN_OPERATOR) break;
          index += 1;
        }
        addUnknown(source.slice(start, index), start, index, "Malformed char literal. Expected closing '.");
        continue;
      }
      index += 1;
      const lexeme = source.slice(start, index);
      pushToken(tokens, counts, makeToken("CHAR_LITERAL" /* CharLiteral */, lexeme, start, index));
      continue;
    }
    if (isDigit(ch)) {
      index += 1;
      while (index < length && isDigit(source[index])) index += 1;
      if (index < length && source[index] === "." && index + 1 < length && isDigit(source[index + 1])) {
        index += 1;
        while (index < length && isDigit(source[index])) index += 1;
      }
      const lexeme = source.slice(start, index);
      pushToken(tokens, counts, makeToken("NUMERIC_LITERAL" /* NumericLiteral */, lexeme, start, index));
      continue;
    }
    if (isIdentStart(ch)) {
      index += 1;
      while (index < length && isIdentPart(source[index])) index += 1;
      const lexeme = source.slice(start, index);
      if (DATA_TYPES.includes(lexeme)) {
        pushToken(tokens, counts, makeToken("DATATYPE" /* DataType */, lexeme, start, index));
      } else if (OUTPUT_KEYWORDS.includes(lexeme)) {
        pushToken(tokens, counts, makeToken("OUTPUT_KEYWORD" /* OutputKeyword */, lexeme, start, index));
      } else if (lexeme === "if") {
        pushToken(tokens, counts, makeToken("IF_KEYWORD" /* IfKeyword */, lexeme, start, index));
      } else if (lexeme === "while") {
        pushToken(tokens, counts, makeToken("WHILE_KEYWORD" /* WhileKeyword */, lexeme, start, index));
      } else if (lexeme === "class") {
        pushToken(tokens, counts, makeToken("CLASS_KEYWORD" /* ClassKeyword */, lexeme, start, index));
      } else {
        pushToken(tokens, counts, makeToken("IDENTIFIER" /* Identifier */, lexeme, start, index));
      }
      continue;
    }
    index += 1;
    while (index < length && !isWhitespace(source[index]) && !isDigit(source[index]) && !isIdentStart(source[index]) && source[index] !== ASSIGN_OPERATOR && source[index] !== STATEMENT_DELIMITER && source[index] !== "{" && source[index] !== "}" && source[index] !== "<" && source[index] !== ">" && source[index] !== "=" && source[index] !== "!" && source[index] !== "+" && source[index] !== "-" && source[index] !== "*" && source[index] !== "/" && source[index] !== "$" && source[index] !== '"' && source[index] !== "'") {
      index += 1;
    }
    addUnknown(source.slice(start, index), start, index, `Unknown token '${source.slice(start, index)}'.`);
  }
  pushToken(tokens, counts, makeToken("EOF" /* EOF */, "", length, length));
  return {
    tokens,
    diagnostics,
    counts,
    unknownCount
  };
}

// src/parser.ts
var LITERAL_TYPES = /* @__PURE__ */ new Set([
  "NUMERIC_LITERAL" /* NumericLiteral */,
  "STRING_LITERAL" /* StringLiteral */,
  "CHAR_LITERAL" /* CharLiteral */
]);
var NUMERIC_TYPES = /* @__PURE__ */ new Set(["decimal", "doubleDecimal", "int"]);
function patternOf(tokens) {
  const parts = [];
  for (const t of tokens) {
    if (t.type === "EOF" /* EOF */) break;
    parts.push(`[${t.type}]`);
  }
  return parts.join(" ");
}
var Parser = class {
  constructor(tokens) {
    this.index = 0;
    this.diagnostics = [];
    this.recoveries = [];
    this.tokens = tokens;
  }
  peek(offset = 0) {
    const i = this.index + offset;
    return this.tokens[i] ?? this.tokens[this.tokens.length - 1];
  }
  at(type) {
    return this.peek().type === type;
  }
  consume() {
    const t = this.peek();
    this.index += 1;
    return t;
  }
  currentToken() {
    return this.peek();
  }
  consumeCurrentToken() {
    return this.consume();
  }
  errorAt(token, message) {
    this.diagnostics.push({
      severity: "error" /* Error */,
      message,
      start: token.span.start,
      end: token.span.end
    });
  }
  warnAt(token, message) {
    this.diagnostics.push({
      severity: "warning" /* Warning */,
      message,
      start: token.span.start,
      end: token.span.end
    });
  }
  errorAtEnd(message) {
    const eof = this.tokens.find((t) => t.type === "EOF" /* EOF */) ?? this.tokens[this.tokens.length - 1];
    this.diagnostics.push({
      severity: "error" /* Error */,
      message,
      start: eof.span.start,
      end: eof.span.end
    });
  }
  expect(type, expectation) {
    const t = this.peek();
    if (t.type === type) return this.consume();
    if (t.type === "EOF" /* EOF */) {
      this.errorAtEnd(`Expected ${expectation}, but reached end of input.`);
      return null;
    }
    this.errorAt(t, `Expected ${expectation}, but found ${t.type} ('${t.lexeme}').`);
    return null;
  }
  panicSkipOne(reason) {
    const t = this.peek();
    if (t.type === "EOF" /* EOF */) return;
    this.recoveries.push({
      strategy: "Panic-Mode",
      action: "skipToken",
      message: reason,
      skipped: { type: t.type, lexeme: t.lexeme }
    });
    this.consume();
  }
  parseStatement() {
    const first = this.peek();
    if (first.type === "DATATYPE" /* DataType */) {
      return { statement: this.parseAssignment(), expectedRule: "[DATATYPE] [IDENTIFIER] [ASSIGN_OPERATOR] [LITERAL] [DELIMITER]" };
    }
    if (first.type === "OUTPUT_KEYWORD" /* OutputKeyword */) {
      return { statement: this.parseOutput(), expectedRule: "[OUTPUT_KEYWORD] [VALUE] [DELIMITER]" };
    }
    if (first.type === "IF_KEYWORD" /* IfKeyword */) {
      return { statement: this.parseIf(), expectedRule: "[IF] [EXPR] [COMPARE_OP] [EXPR] [LBRACE] <statements> [RBRACE] [DELIMITER]" };
    }
    if (first.type === "WHILE_KEYWORD" /* WhileKeyword */) {
      return { statement: this.parseWhile(), expectedRule: "[WHILE] [EXPR] [COMPARE_OP] [EXPR] [LBRACE] <statements> [RBRACE] [DELIMITER]" };
    }
    if (first.type === "CLASS_KEYWORD" /* ClassKeyword */) {
      return { statement: this.parseClass(), expectedRule: "[CLASS] [IDENTIFIER] [LBRACE] <fields> [RBRACE] [DELIMITER]" };
    }
    if (first.type === "EOF" /* EOF */) {
      this.errorAtEnd("Expected a statement, but input was empty.");
      return { statement: null, expectedRule: "[DATATYPE] ... OR [OUTPUT_KEYWORD] ..." };
    }
    this.errorAt(
      first,
      `Expected statement to start with DATATYPE, OUTPUT_KEYWORD, IF, WHILE, or CLASS, but found ${first.type} ('${first.lexeme}').`
    );
    return { statement: null, expectedRule: "[DATATYPE] ... OR [OUTPUT_KEYWORD] ... OR [IF] ... OR [WHILE] ... OR [CLASS] ..." };
  }
  parseIf() {
    this.expect("IF_KEYWORD" /* IfKeyword */, "keyword 'if'");
    const condition = this.parseCondition();
    const body = this.parseBlockStatements();
    const delimOk = this.expectOrRecoverDelimiter();
    if (!condition || !body || !delimOk) return null;
    return { kind: "IfStatement", condition, body, delimiter: "." };
  }
  parseWhile() {
    this.expect("WHILE_KEYWORD" /* WhileKeyword */, "keyword 'while'");
    const condition = this.parseCondition();
    const body = this.parseBlockStatements();
    const delimOk = this.expectOrRecoverDelimiter();
    if (!condition || !body || !delimOk) return null;
    return { kind: "WhileStatement", condition, body, delimiter: "." };
  }
  parseClass() {
    this.expect("CLASS_KEYWORD" /* ClassKeyword */, "keyword 'class'");
    const nameTok = this.expect("IDENTIFIER" /* Identifier */, "a class name IDENTIFIER");
    const lbrace = this.expect("LBRACE" /* LBrace */, "'{' to start class body");
    if (!nameTok || !lbrace) {
      while (this.peek().type !== "EOF" /* EOF */ && this.peek().type !== "DELIMITER" /* Delimiter */) this.consume();
      this.expectOrRecoverDelimiter();
      return null;
    }
    const fields = [];
    while (this.peek().type !== "EOF" /* EOF */ && this.peek().type !== "RBRACE" /* RBrace */) {
      const f = this.parseFieldDeclaration();
      if (f) {
        fields.push(f);
        continue;
      }
      if (this.peek().type === "RBRACE" /* RBrace */) break;
      this.panicSkipOne("Skipping unexpected token inside class body (panic-mode recovery).");
      while (this.peek().type !== "EOF" /* EOF */ && this.peek().type !== "DELIMITER" /* Delimiter */ && this.peek().type !== "RBRACE" /* RBrace */) {
        this.panicSkipOne("Skipping token while recovering inside class body.");
      }
      if (this.peek().type === "DELIMITER" /* Delimiter */) this.consume();
    }
    const rbrace = this.expect("RBRACE" /* RBrace */, "'}' to close class body");
    const delimOk = this.expectOrRecoverDelimiter();
    if (!rbrace || !delimOk) return null;
    return { kind: "ClassDeclaration", name: nameTok.lexeme, fields, delimiter: "." };
  }
  parseFieldDeclaration() {
    const dtTok = this.expect("DATATYPE" /* DataType */, "a field DATATYPE");
    const nameTok = this.expect("IDENTIFIER" /* Identifier */, "a field name IDENTIFIER");
    const assignTok = this.expect("ASSIGN_OPERATOR" /* AssignOperator */, "an ASSIGN_OPERATOR (:) in field declaration");
    if (!dtTok || !nameTok || !assignTok) return null;
    const declaredTypeLex = dtTok.lexeme;
    const isNumeric = NUMERIC_TYPES.has(declaredTypeLex);
    let expression = null;
    if (isNumeric) {
      expression = this.parseNumericExpression();
    } else {
      const valueTok = this.peek();
      if (valueTok.type === "IDENTIFIER" /* Identifier */ || valueTok.type === "STRING_LITERAL" /* StringLiteral */ || valueTok.type === "CHAR_LITERAL" /* CharLiteral */ || valueTok.type === "NUMERIC_LITERAL" /* NumericLiteral */) {
        const tok = this.consume();
        expression = tok.type === "STRING_LITERAL" /* StringLiteral */ ? { kind: "StringLiteralExpr", token: tok } : tok.type === "CHAR_LITERAL" /* CharLiteral */ ? { kind: "CharLiteralExpr", token: tok } : tok.type === "IDENTIFIER" /* Identifier */ ? { kind: "IdentifierExpr", token: tok } : { kind: "NumericLiteralExpr", token: tok };
      } else {
        if (valueTok.type === "EOF" /* EOF */) {
          this.errorAtEnd("Expected a field initializer value, but reached end of input.");
        } else {
          this.errorAt(valueTok, `Expected a field initializer value, but found ${valueTok.type} ('${valueTok.lexeme}').`);
        }
      }
    }
    const delimOk = this.expectOrRecoverDelimiter();
    if (!expression || !delimOk) return null;
    const dtLex = dtTok.lexeme;
    return {
      kind: "FieldDeclaration",
      dataType: dtLex,
      name: nameTok.lexeme,
      assignOperator: ":",
      expression,
      delimiter: "."
    };
  }
  parseCondition() {
    const left = this.parseNumericExpression();
    const opTok = this.peek();
    const op = this.parseCompareOperator();
    const right = this.parseNumericExpression();
    if (!left || !op || !right) {
      if (opTok.type === "EOF" /* EOF */) this.errorAtEnd("Expected a numeric comparison in condition.");
      return null;
    }
    return { kind: "CompareCondition", operator: op, left, right };
  }
  parseCompareOperator() {
    const t = this.peek();
    switch (t.type) {
      case "LESS" /* Less */:
        this.consume();
        return "<";
      case "LESS_EQUAL" /* LessEqual */:
        this.consume();
        return "<=";
      case "GREATER" /* Greater */:
        this.consume();
        return ">";
      case "GREATER_EQUAL" /* GreaterEqual */:
        this.consume();
        return ">=";
      case "EQUAL_EQUAL" /* EqualEqual */:
        this.consume();
        return "==";
      case "BANG_EQUAL" /* BangEqual */:
        this.consume();
        return "!=";
      default:
        if (t.type === "EOF" /* EOF */) {
          this.errorAtEnd("Expected a comparison operator in condition.");
        } else {
          this.errorAt(t, `Expected a comparison operator in condition, but found ${t.type} ('${t.lexeme}').`);
        }
        return null;
    }
  }
  parseBlockStatements() {
    const lbrace = this.expect("LBRACE" /* LBrace */, "'{' to start a block");
    if (!lbrace) return null;
    const statements = [];
    while (this.peek().type !== "EOF" /* EOF */ && this.peek().type !== "RBRACE" /* RBrace */) {
      const { statement } = this.parseStatement();
      if (statement) {
        statements.push(statement);
        continue;
      }
      this.panicSkipOne("Skipping unexpected token inside block (panic-mode recovery).");
      while (this.peek().type !== "EOF" /* EOF */ && this.peek().type !== "DELIMITER" /* Delimiter */ && this.peek().type !== "RBRACE" /* RBrace */) {
        this.panicSkipOne("Skipping token while recovering inside block.");
      }
      if (this.peek().type === "DELIMITER" /* Delimiter */) this.consume();
    }
    const rbrace = this.expect("RBRACE" /* RBrace */, "'}' to close a block");
    if (!rbrace) return null;
    return statements;
  }
  expectOrRecoverDelimiter() {
    const delimTok = this.peek();
    if (delimTok.type === "DELIMITER" /* Delimiter */) {
      this.consume();
      return true;
    }
    if (delimTok.type === "EOF" /* EOF */ || delimTok.type === "RBRACE" /* RBrace */) {
      this.warnAt(delimTok, "Missing statement delimiter '.' at end of statement. Inserted '.' (phrase-level recovery). ");
      this.recoveries.push({
        strategy: "Phrase-Level",
        action: "insertDelimiter",
        message: "Inserted missing '.' delimiter."
      });
      return true;
    }
    this.errorAt(delimTok, `Expected statement delimiter '.', but found ${delimTok.type} ('${delimTok.lexeme}').`);
    return false;
  }
  parseAssignment() {
    const dtTok = this.expect("DATATYPE" /* DataType */, "a DATATYPE");
    const idTok = this.expect("IDENTIFIER" /* Identifier */, "an IDENTIFIER after DATATYPE");
    const assignTok = this.expect("ASSIGN_OPERATOR" /* AssignOperator */, "an ASSIGN_OPERATOR (:) after IDENTIFIER");
    const declaredTypeLex = dtTok?.lexeme ?? "";
    const isNumeric = NUMERIC_TYPES.has(declaredTypeLex);
    let expression = null;
    if (isNumeric) {
      expression = this.parseNumericExpression();
    } else {
      const valueTok = this.peek();
      if (valueTok.type === "IDENTIFIER" /* Identifier */ || valueTok.type === "STRING_LITERAL" /* StringLiteral */ || valueTok.type === "CHAR_LITERAL" /* CharLiteral */ || valueTok.type === "NUMERIC_LITERAL" /* NumericLiteral */) {
        const tok = this.consume();
        expression = tok.type === "STRING_LITERAL" /* StringLiteral */ ? { kind: "StringLiteralExpr", token: tok } : tok.type === "CHAR_LITERAL" /* CharLiteral */ ? { kind: "CharLiteralExpr", token: tok } : tok.type === "IDENTIFIER" /* Identifier */ ? { kind: "IdentifierExpr", token: tok } : { kind: "NumericLiteralExpr", token: tok };
      } else {
        if (valueTok.type === "EOF" /* EOF */) {
          this.errorAtEnd("Expected a value after ASSIGN_OPERATOR, but reached end of input.");
        } else {
          this.errorAt(valueTok, `Expected a value after ASSIGN_OPERATOR, but found ${valueTok.type} ('${valueTok.lexeme}').`);
        }
      }
      while (this.peek().type === "PLUS" /* Plus */ || this.peek().type === "MINUS" /* Minus */ || this.peek().type === "STAR" /* Star */ || this.peek().type === "SLASH" /* Slash */) {
        this.panicSkipOne("Unexpected arithmetic operator in non-numeric assignment; skipping.");
      }
    }
    const delimTok = this.peek();
    let delimOk = false;
    if (delimTok.type === "DELIMITER" /* Delimiter */) {
      this.consume();
      delimOk = true;
    } else {
      if (delimTok.type === "EOF" /* EOF */) {
        const eof = this.peek();
        this.warnAt(eof, "Missing statement delimiter '.' at end of statement. Inserted '.' (phrase-level recovery). ");
        this.recoveries.push({
          strategy: "Phrase-Level",
          action: "insertDelimiter",
          message: "Inserted missing '.' delimiter."
        });
        delimOk = true;
      } else {
        this.errorAt(delimTok, `Expected statement delimiter '.', but found ${delimTok.type} ('${delimTok.lexeme}').`);
      }
    }
    if (!dtTok || !idTok || !assignTok || !expression || !delimOk) return null;
    const dtLex = dtTok.lexeme;
    const kw = dtLex;
    if (!DATA_TYPES.includes(dtLex)) {
      this.errorAt(dtTok, `Unknown datatype '${dtLex}'.`);
      return null;
    }
    return {
      kind: "AssignmentStatement",
      dataType: kw,
      identifier: idTok.lexeme,
      assignOperator: ":",
      expression,
      delimiter: "."
    };
  }
  parseOutput() {
    const kwTok = this.expect("OUTPUT_KEYWORD" /* OutputKeyword */, "an OUTPUT_KEYWORD");
    const valueTok = this.peek();
    let value = null;
    if (valueTok.type === "IDENTIFIER" /* Identifier */ || LITERAL_TYPES.has(valueTok.type)) {
      value = this.consume();
    } else {
      if (valueTok.type === "EOF" /* EOF */) {
        this.errorAtEnd("Expected a value after OUTPUT_KEYWORD, but reached end of input.");
      } else {
        this.errorAt(valueTok, `Expected a value after OUTPUT_KEYWORD, but found ${valueTok.type} ('${valueTok.lexeme}').`);
      }
    }
    const delimTok = this.peek();
    let delimOk = false;
    if (delimTok.type === "DELIMITER" /* Delimiter */) {
      this.consume();
      delimOk = true;
    } else {
      if (delimTok.type === "EOF" /* EOF */) {
        const eof = this.peek();
        this.warnAt(eof, "Missing statement delimiter '.' at end of statement. Inserted '.' (phrase-level recovery). ");
        this.recoveries.push({
          strategy: "Phrase-Level",
          action: "insertDelimiter",
          message: "Inserted missing '.' delimiter."
        });
        delimOk = true;
      } else {
        this.errorAt(delimTok, `Expected statement delimiter '.', but found ${delimTok.type} ('${delimTok.lexeme}').`);
      }
    }
    if (!kwTok || !value || !delimOk) return null;
    const kwLex = kwTok.lexeme;
    const kw = kwLex;
    if (!OUTPUT_KEYWORDS.includes(kwLex)) {
      this.errorAt(kwTok, `Unknown output keyword '${kwLex}'.`);
      return null;
    }
    return {
      kind: "OutputStatement",
      keyword: kw,
      value,
      delimiter: "."
    };
  }
  parseNumericExpression() {
    return this.parseAdditive();
  }
  parseAdditive() {
    let left = this.parseMultiplicative();
    if (!left) return null;
    while (this.peek().type === "PLUS" /* Plus */ || this.peek().type === "MINUS" /* Minus */) {
      const opTok = this.consume();
      const right = this.parseMultiplicative();
      if (!right) return left;
      left = {
        kind: "BinaryExpr",
        operator: opTok.type === "PLUS" /* Plus */ ? "+" : "-",
        left,
        right
      };
    }
    return left;
  }
  parseMultiplicative() {
    let left = this.parseUnary();
    if (!left) return null;
    while (this.peek().type === "STAR" /* Star */ || this.peek().type === "SLASH" /* Slash */) {
      const opTok = this.consume();
      const right = this.parseUnary();
      if (!right) return left;
      left = {
        kind: "BinaryExpr",
        operator: opTok.type === "STAR" /* Star */ ? "*" : "/",
        left,
        right
      };
    }
    return left;
  }
  parseUnary() {
    const t = this.peek();
    if (t.type === "PLUS" /* Plus */ || t.type === "MINUS" /* Minus */) {
      this.consume();
      const operand = this.parseUnary();
      if (!operand) return null;
      return { kind: "UnaryExpr", operator: t.type === "MINUS" /* Minus */ ? "-" : "+", operand };
    }
    return this.parsePrimaryNumeric();
  }
  parsePrimaryNumeric() {
    while (true) {
      const t = this.peek();
      if (t.type === "NUMERIC_LITERAL" /* NumericLiteral */) {
        return { kind: "NumericLiteralExpr", token: this.consume() };
      }
      if (t.type === "IDENTIFIER" /* Identifier */) {
        return { kind: "IdentifierExpr", token: this.consume() };
      }
      if (t.type === "STRING_LITERAL" /* StringLiteral */) {
        return { kind: "StringLiteralExpr", token: this.consume() };
      }
      if (t.type === "CHAR_LITERAL" /* CharLiteral */) {
        return { kind: "CharLiteralExpr", token: this.consume() };
      }
      if (t.type === "EOF" /* EOF */ || t.type === "DELIMITER" /* Delimiter */) {
        this.errorAt(t, "Expected a numeric literal or identifier in numeric expression.");
        return null;
      }
      this.warnAt(t, `Unexpected token in numeric expression: ${t.type} ('${t.lexeme}').`);
      this.panicSkipOne("Skipping unexpected token in numeric expression (panic-mode recovery).");
    }
  }
};
function parse(tokens) {
  const parser = new Parser(tokens);
  const { statement, expectedRule } = parser.parseStatement();
  const actualPattern = patternOf(tokens);
  if (statement) {
    const firstExtra = parser.currentToken();
    if (firstExtra.type !== "EOF" /* EOF */) {
      parser.diagnostics.push({
        severity: "error" /* Error */,
        message: `Unexpected token after complete statement: ${firstExtra.type} ('${firstExtra.lexeme}').`,
        start: firstExtra.span.start,
        end: firstExtra.span.end
      });
    }
  }
  const hasErrors = parser.diagnostics.some((d) => d.severity === "error" /* Error */);
  const ok = !hasErrors && statement !== null;
  if (ok) {
    return {
      ok: true,
      statement,
      diagnostics: parser.diagnostics,
      expectedRule,
      actualPattern,
      recoveries: parser.recoveries
    };
  }
  return {
    ok: false,
    statement: null,
    diagnostics: parser.diagnostics,
    expectedRule,
    actualPattern,
    recoveries: parser.recoveries
  };
}
function parseProgram(tokens) {
  const parser = new Parser(tokens);
  const statements = [];
  while (parser.currentToken().type !== "EOF" /* EOF */) {
    const start = parser.currentToken();
    const { statement } = parser.parseStatement();
    if (statement) {
      statements.push(statement);
      continue;
    }
    parser.recoveries.push({
      strategy: "Panic-Mode",
      action: "skipToken",
      message: "Statement parse failed; skipping tokens until delimiter to recover.",
      skipped: { type: start.type, lexeme: start.lexeme }
    });
    while (parser.currentToken().type !== "EOF" /* EOF */ && parser.currentToken().type !== "DELIMITER" /* Delimiter */) {
      parser.consumeCurrentToken();
    }
    if (parser.currentToken().type === "DELIMITER" /* Delimiter */) {
      parser.consumeCurrentToken();
    }
  }
  const hasErrors = parser.diagnostics.some((d) => d.severity === "error" /* Error */);
  return { ok: !hasErrors, statements, diagnostics: parser.diagnostics, recoveries: parser.recoveries };
}

// src/classTable.ts
var TYPE_WIDTH = {
  decimal: 8,
  doubleDecimal: 16,
  letters: 64,
  letter: 1,
  int: 4,
  bool: 1
};
var ClassTable = class {
  constructor() {
    this.classes = /* @__PURE__ */ new Map();
  }
  get(name) {
    return this.classes.get(name);
  }
  entries() {
    return Array.from(this.classes.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
  declareClass(name) {
    const existing = this.classes.get(name);
    if (existing) return { ok: false, message: `Class '${name}' is already declared.` };
    const entry = { name, fields: [] };
    this.classes.set(name, entry);
    return { ok: true, entry };
  }
  declareField(className, field) {
    const cls = this.classes.get(className);
    if (!cls) return { ok: false, message: `Class '${className}' is not declared.` };
    if (cls.fields.some((f) => f.name === field.name)) {
      return { ok: false, message: `Duplicate field '${field.name}' in class '${className}'.` };
    }
    const width = TYPE_WIDTH[field.type];
    const offset = cls.fields.reduce((sum, f) => sum + f.width, 0);
    const entry = {
      name: field.name,
      type: field.type,
      width,
      level: 1,
      offset,
      value: field.value
    };
    cls.fields.push(entry);
    return { ok: true, entry };
  }
};

// src/symbolTable.ts
var TYPE_WIDTH2 = {
  decimal: 8,
  doubleDecimal: 16,
  letters: 64,
  letter: 1,
  int: 4,
  bool: 1
};
var SymbolTable = class {
  constructor() {
    this.symbols = /* @__PURE__ */ new Map();
    this.nextOffset = 0;
  }
  get(name) {
    return this.symbols.get(name);
  }
  entries() {
    return Array.from(this.symbols.values()).sort((a, b) => a.offset - b.offset);
  }
  bind(name, type, value) {
    const existing = this.symbols.get(name);
    if (existing) {
      const updated = { ...existing, value };
      this.symbols.set(name, updated);
      return { action: "update", entry: updated };
    }
    const width = TYPE_WIDTH2[type];
    const entry = {
      name,
      type,
      width,
      level: 0,
      offset: this.nextOffset,
      value
    };
    this.nextOffset += width;
    this.symbols.set(name, entry);
    return { action: "declare", entry };
  }
};

// src/semantics.ts
function isNumericType(t) {
  return t === "decimal" || t === "doubleDecimal" || t === "int";
}
function inferValueType(token) {
  if (token.type === "IDENTIFIER" /* Identifier */ && (token.lexeme === "true" || token.lexeme === "false")) {
    return "Boolean";
  }
  switch (token.type) {
    case "NUMERIC_LITERAL" /* NumericLiteral */:
      return "Numeric";
    case "STRING_LITERAL" /* StringLiteral */:
      return "String";
    case "CHAR_LITERAL" /* CharLiteral */:
      return "Char";
    case "IDENTIFIER" /* Identifier */:
      return "Identifier";
    default:
      return "Unknown";
  }
}
function typeAllowsValue(declared, valueType) {
  if (valueType === "Identifier") return true;
  switch (declared) {
    case "decimal":
    case "doubleDecimal":
    case "int":
      return valueType === "Numeric";
    case "letters":
      return valueType === "String";
    case "letter":
      return valueType === "Char";
    case "bool":
      return valueType === "Boolean";
    default:
      return false;
  }
}
function isBoolNumericLiteral(token) {
  return token.type === "NUMERIC_LITERAL" /* NumericLiteral */ && (token.lexeme === "0" || token.lexeme === "1");
}
function boolMeaning(token) {
  if (token.lexeme === "0" || token.lexeme === "false") return "false";
  if (token.lexeme === "1" || token.lexeme === "true") return "true";
  return null;
}
function describeAssignedValueType(declaredType, valueToken, inferredType) {
  if (declaredType !== "bool") return inferredType;
  const meaning = boolMeaning(valueToken);
  if (!meaning) return inferredType;
  return `Boolean (${valueToken.lexeme} = ${meaning})`;
}
function normalizeLiteralValue(token) {
  return token.lexeme;
}
function expressionToken(expr) {
  switch (expr.kind) {
    case "NumericLiteralExpr":
    case "IdentifierExpr":
    case "StringLiteralExpr":
    case "CharLiteralExpr":
      return expr.token;
    case "UnaryExpr":
      return expressionToken(expr.operand);
    case "BinaryExpr":
      return expressionToken(expr.left);
  }
}
function evaluateNumericExpression(expr, table, errorAt) {
  switch (expr.kind) {
    case "NumericLiteralExpr": {
      const n = Number.parseFloat(expr.token.lexeme);
      if (Number.isNaN(n)) {
        errorAt(expr.token, `Invalid numeric literal '${expr.token.lexeme}'.`);
        return null;
      }
      return n;
    }
    case "IdentifierExpr": {
      const ref = table.get(expr.token.lexeme);
      if (!ref) {
        errorAt(expr.token, `Undeclared identifier '${expr.token.lexeme}' used in numeric expression.`);
        return null;
      }
      if (!isNumericType(ref.type)) {
        errorAt(expr.token, `Non-numeric identifier '${ref.name}' (type '${ref.type}') used in numeric expression.`);
        return null;
      }
      const n = Number.parseFloat(ref.value);
      if (Number.isNaN(n)) {
        errorAt(expr.token, `Identifier '${ref.name}' has non-numeric stored value '${ref.value}'.`);
        return null;
      }
      return n;
    }
    case "UnaryExpr": {
      const v = evaluateNumericExpression(expr.operand, table, errorAt);
      if (v === null) return null;
      return expr.operator === "-" ? -v : v;
    }
    case "BinaryExpr": {
      const l = evaluateNumericExpression(expr.left, table, errorAt);
      const r = evaluateNumericExpression(expr.right, table, errorAt);
      if (l === null || r === null) return null;
      switch (expr.operator) {
        case "+":
          return l + r;
        case "-":
          return l - r;
        case "*":
          return l * r;
        case "/":
          return l / r;
      }
      return null;
    }
    case "StringLiteralExpr":
    case "CharLiteralExpr":
      errorAt(expr.token, `Non-numeric literal '${expr.token.lexeme}' used in numeric expression.`);
      return null;
  }
}
function analyzeSemantics(statement, symbolTable, classTable) {
  const table = symbolTable ?? new SymbolTable();
  const classes = classTable ?? new ClassTable();
  const diagnostics = [];
  const actions = [];
  const errorAt = (token, message) => {
    diagnostics.push({
      severity: "error" /* Error */,
      message,
      start: token.span.start,
      end: token.span.end
    });
  };
  const fail = () => ({ ok: false, diagnostics, actions, symbolTable: table, classTable: classes });
  const succeed = () => ({ ok: true, diagnostics, actions, symbolTable: table, classTable: classes });
  const analyzeStatement = (s) => {
    switch (s.kind) {
      case "AssignmentStatement": {
        const declaredType = s.dataType;
        const name = s.identifier;
        const expr = s.expression;
        if (isNumericType(declaredType)) {
          actions.push({
            kind: "typeCheck",
            message: `Variable '${name}' is declared as '${declaredType}'. Checking numeric expression...`
          });
          const evaluated = evaluateNumericExpression(expr, table, errorAt);
          if (evaluated === null) return false;
          const existing2 = table.get(name);
          if (existing2 && existing2.type !== declaredType) {
            errorAt(
              expressionToken(expr),
              `Redeclaration error: '${name}' was previously '${existing2.type}' and cannot be redeclared as '${declaredType}'.`
            );
            return false;
          }
          const bind2 = table.bind(name, declaredType, String(evaluated));
          actions.push({ kind: "bind", action: bind2.action, entry: bind2.entry });
          return true;
        }
        let valueToken = null;
        if (expr.kind === "StringLiteralExpr" || expr.kind === "CharLiteralExpr" || expr.kind === "NumericLiteralExpr" || expr.kind === "IdentifierExpr") {
          valueToken = expr.token;
        }
        if (!valueToken) {
          errorAt(expressionToken(expr), "Invalid expression for non-numeric assignment.");
          return false;
        }
        const valueType = inferValueType(valueToken);
        const displayValueType = describeAssignedValueType(declaredType, valueToken, valueType);
        actions.push({
          kind: "typeCheck",
          message: `Variable '${name}' is declared as '${declaredType}'. Value is '${valueToken.lexeme}' (${displayValueType}).`
        });
        let effectiveValue = normalizeLiteralValue(valueToken);
        if (valueType === "Identifier") {
          const ref = table.get(valueToken.lexeme);
          if (!ref) {
            errorAt(valueToken, `Undeclared identifier '${valueToken.lexeme}' used as assignment value.`);
            return false;
          }
          if (ref.type !== declaredType) {
            errorAt(valueToken, `Type mismatch: '${name}' is '${declaredType}' but identifier '${ref.name}' is '${ref.type}'.`);
            return false;
          }
          effectiveValue = ref.value;
        } else {
          const boolNumeric = declaredType === "bool" && isBoolNumericLiteral(valueToken);
          if (!boolNumeric && !typeAllowsValue(declaredType, valueType)) {
            errorAt(
              valueToken,
              `Type mismatch: Variable '${name}' is declared as '${declaredType}', but value '${valueToken.lexeme}' is ${valueType}.`
            );
            return false;
          }
        }
        const existing = table.get(name);
        if (existing && existing.type !== declaredType) {
          errorAt(valueToken, `Redeclaration error: '${name}' was previously '${existing.type}' and cannot be redeclared as '${declaredType}'.`);
          return false;
        }
        const bind = table.bind(name, declaredType, effectiveValue);
        actions.push({ kind: "bind", action: bind.action, entry: bind.entry });
        return true;
      }
      case "OutputStatement": {
        const valueToken = s.value;
        const valueType = inferValueType(valueToken);
        actions.push({
          kind: "typeCheck",
          message: `Output checks value '${valueToken.lexeme}' (${valueType}).`
        });
        if (valueToken.type === "IDENTIFIER" /* Identifier */) {
          const ref = table.get(valueToken.lexeme);
          if (!ref) {
            errorAt(valueToken, `Undeclared identifier '${valueToken.lexeme}' used in output statement.`);
            return false;
          }
        }
        return true;
      }
      case "IfStatement":
      case "WhileStatement": {
        const keyword = s.kind === "IfStatement" ? "if" : "while";
        actions.push({
          kind: "typeCheck",
          message: `Checking ${keyword} condition (numeric comparison)...`
        });
        const left = evaluateNumericExpression(s.condition.left, table, errorAt);
        const right = evaluateNumericExpression(s.condition.right, table, errorAt);
        if (left === null || right === null) return false;
        for (const inner of s.body) {
          if (!analyzeStatement(inner)) return false;
        }
        return true;
      }
      case "ClassDeclaration": {
        const name = s.name;
        const decl = classes.declareClass(name);
        if (!decl.ok) {
          const anchorExpr = s.fields[0]?.expression;
          if (anchorExpr) errorAt(expressionToken(anchorExpr), decl.message);
          else diagnostics.push({ severity: "error" /* Error */, message: decl.message, start: 0, end: 0 });
          return false;
        }
        actions.push({ kind: "bindClass", action: "declare", entry: decl.entry });
        for (const f of s.fields) {
          const fieldType = f.dataType;
          const fieldName = f.name;
          const expr = f.expression;
          let fieldValue = null;
          if (isNumericType(fieldType)) {
            const evaluated = evaluateNumericExpression(expr, table, errorAt);
            if (evaluated === null) return false;
            fieldValue = String(evaluated);
          } else {
            let valueToken = null;
            if (expr.kind === "StringLiteralExpr" || expr.kind === "CharLiteralExpr" || expr.kind === "NumericLiteralExpr" || expr.kind === "IdentifierExpr") {
              valueToken = expr.token;
            }
            if (!valueToken) {
              errorAt(expressionToken(expr), "Invalid expression for non-numeric field initializer.");
              return false;
            }
            const valueType = inferValueType(valueToken);
            fieldValue = normalizeLiteralValue(valueToken);
            if (valueType === "Identifier") {
              const ref = table.get(valueToken.lexeme);
              if (!ref) {
                errorAt(valueToken, `Undeclared identifier '${valueToken.lexeme}' used as field initializer.`);
                return false;
              }
              if (ref.type !== fieldType) {
                errorAt(
                  valueToken,
                  `Type mismatch: Field '${fieldName}' is '${fieldType}' but identifier '${ref.name}' is '${ref.type}'.`
                );
                return false;
              }
              fieldValue = ref.value;
            } else {
              const boolNumeric = fieldType === "bool" && isBoolNumericLiteral(valueToken);
              if (!boolNumeric && !typeAllowsValue(fieldType, valueType)) {
                errorAt(
                  valueToken,
                  `Type mismatch: Field '${fieldName}' is declared as '${fieldType}', but value '${valueToken.lexeme}' is ${valueType}.`
                );
                return false;
              }
            }
          }
          const bound = classes.declareField(name, { name: fieldName, type: fieldType, value: fieldValue });
          if (!bound.ok) {
            const anchor = expressionToken(expr);
            errorAt(anchor, bound.message);
            return false;
          }
          actions.push({ kind: "bindField", className: name, action: "declare", entry: bound.entry });
        }
        return true;
      }
    }
  };
  const ok = analyzeStatement(statement);
  if (!ok) return fail();
  return succeed();
}

// src/explainability.ts
function printableLexeme(lexeme) {
  if (lexeme === "") return "(empty)";
  return lexeme.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
}
function explainLex(result) {
  const lines = [];
  lines.push("--- STARTING LEXICAL ANALYSIS ---");
  for (const token of result.tokens) {
    if (token.type === "EOF" /* EOF */) continue;
    lines.push(`[LEXER] Found '${printableLexeme(token.lexeme)}' -> Identified as ${token.type}`);
  }
  const tokenCounts = Object.values(TokenType).filter((t) => t !== "EOF" /* EOF */).map((t) => `${t}=${result.counts[t] ?? 0}`).join(", ");
  lines.push(`Token counts: ${tokenCounts}`);
  lines.push(`Lexical Analysis Complete. ${result.unknownCount} Unknown Tokens.`);
  return lines;
}
function explainParse(result) {
  const lines = [];
  lines.push("--- STARTING SYNTAX ANALYSIS ---");
  lines.push("[PARSER] Checking statement structure...");
  lines.push(`[PARSER] Expected rule: ${result.expectedRule}`);
  lines.push(`[PARSER] Actual structure: ${result.actualPattern || "(empty)"}`);
  if (result.recoveries.length > 0) {
    for (const r of result.recoveries) {
      if (r.strategy === "Phrase-Level") {
        lines.push(`[PARSER] Recovery Strategy (Phrase-Level): ${r.message}`);
      } else {
        lines.push(
          `[PARSER] Recovery Strategy (Panic-Mode): ${r.message} Skipped ${r.skipped.type} ('${printableLexeme(r.skipped.lexeme)}').`
        );
      }
    }
  }
  if (result.ok) {
    lines.push("[PARSER] Actual structure matches expected rule.");
    const warningCount = result.diagnostics.filter((d) => d.severity === "warning").length;
    if (warningCount > 0 || result.recoveries.length > 0) {
      lines.push(`Syntax Analysis Complete. ${warningCount} warning(s); recovery applied.`);
    } else {
      lines.push("Syntax Analysis Complete. No structural errors.");
    }
    return lines;
  }
  const first = result.diagnostics[0];
  if (first) {
    lines.push(`[PARSER] STRUCTURAL ERROR: ${first.message}`);
  } else {
    lines.push("[PARSER] STRUCTURAL ERROR: Unknown parse failure.");
  }
  lines.push("Syntax Analysis Complete. Structural errors detected.");
  return lines;
}
function formatSymbolTable(entries) {
  const lines = [];
  lines.push("Symbol Table:");
  if (entries.length === 0) {
    lines.push("  (empty)");
    return lines;
  }
  for (const e of entries) {
    lines.push(
      `  ${e.name} | type=${e.type} | value=${e.value} | width=${e.width} | level=${e.level} | offset=${e.offset}`
    );
  }
  return lines;
}
function formatClassTable(entries) {
  const lines = [];
  lines.push("Class Table:");
  if (entries.length === 0) {
    lines.push("  (empty)");
    return lines;
  }
  for (const c of entries) {
    lines.push(`  class ${c.name}`);
    if (c.fields.length === 0) {
      lines.push("    (no fields)");
      continue;
    }
    for (const f of c.fields) {
      lines.push(
        `    ${f.name} | type=${f.type} | value=${f.value} | width=${f.width} | level=${f.level} | offset=${f.offset}`
      );
    }
  }
  return lines;
}
function explainSemantics(result) {
  const lines = [];
  lines.push("--- STARTING SEMANTIC ANALYSIS ---");
  lines.push("[SEMANTICS] Checking Type Compatibility...");
  for (const action of result.actions) {
    if (action.kind === "typeCheck") {
      lines.push(`[SEMANTICS] ${action.message}`);
    } else if (action.kind === "bind") {
      const verb = action.action === "declare" ? "Binding" : "Updating";
      lines.push(
        `[SEMANTICS] ${verb} variable '${action.entry.name}' into Symbol Table (type=${action.entry.type}, offset=${action.entry.offset}).`
      );
    } else if (action.kind === "bindClass") {
      lines.push(`[SEMANTICS] Declaring class '${action.entry.name}'.`);
    } else {
      lines.push(
        `[SEMANTICS] Declaring field '${action.entry.name}' in class '${action.className}' (type=${action.entry.type}, offset=${action.entry.offset}).`
      );
    }
  }
  if (result.ok) {
    lines.push("Semantic Analysis Complete.");
  } else {
    const first = result.diagnostics[0];
    if (first) lines.push(`[SEMANTICS] FATAL ERROR: ${first.message}`);
    lines.push("Semantic Analysis Complete. Errors detected.");
  }
  lines.push(...formatSymbolTable(result.symbolTable.entries()));
  lines.push(...formatClassTable(result.classTable.entries()));
  return lines;
}
export {
  ClassTable,
  DiagnosticSeverity,
  SymbolTable,
  TokenType,
  analyzeSemantics,
  explainLex,
  explainParse,
  explainSemantics,
  lex,
  parse,
  parseProgram
};
//# sourceMappingURL=compiler-bundle.js.map
