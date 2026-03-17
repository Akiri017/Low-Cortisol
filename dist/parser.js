"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = parse;
exports.parseProgram = parseProgram;
const diagnostics_1 = require("./diagnostics");
const language_1 = require("./language");
const token_1 = require("./token");
const LITERAL_TYPES = new Set([
    token_1.TokenType.NumericLiteral,
    token_1.TokenType.StringLiteral,
    token_1.TokenType.CharLiteral,
]);
const NUMERIC_TYPES = new Set(['decimal', 'doubleDecimal', 'int']);
function patternOf(tokens) {
    const parts = [];
    for (const t of tokens) {
        if (t.type === token_1.TokenType.EOF)
            break;
        parts.push(`[${t.type}]`);
    }
    return parts.join(' ');
}
class Parser {
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
            severity: diagnostics_1.DiagnosticSeverity.Error,
            message,
            start: token.span.start,
            end: token.span.end,
        });
    }
    warnAt(token, message) {
        this.diagnostics.push({
            severity: diagnostics_1.DiagnosticSeverity.Warning,
            message,
            start: token.span.start,
            end: token.span.end,
        });
    }
    errorAtEnd(message) {
        const eof = this.tokens.find((t) => t.type === token_1.TokenType.EOF) ?? this.tokens[this.tokens.length - 1];
        this.diagnostics.push({
            severity: diagnostics_1.DiagnosticSeverity.Error,
            message,
            start: eof.span.start,
            end: eof.span.end,
        });
    }
    expect(type, expectation) {
        const t = this.peek();
        if (t.type === type)
            return this.consume();
        if (t.type === token_1.TokenType.EOF) {
            this.errorAtEnd(`Expected ${expectation}, but reached end of input.`);
            return null;
        }
        this.errorAt(t, `Expected ${expectation}, but found ${t.type} ('${t.lexeme}').`);
        return null;
    }
    panicSkipOne(reason) {
        const t = this.peek();
        if (t.type === token_1.TokenType.EOF)
            return;
        this.recoveries.push({
            strategy: 'Panic-Mode',
            action: 'skipToken',
            message: reason,
            skipped: { type: t.type, lexeme: t.lexeme },
        });
        this.consume();
    }
    parseStatement() {
        const first = this.peek();
        if (first.type === token_1.TokenType.DataType) {
            return { statement: this.parseAssignment(), expectedRule: '[DATATYPE] [IDENTIFIER] [ASSIGN_OPERATOR] [LITERAL] [DELIMITER]' };
        }
        if (first.type === token_1.TokenType.OutputKeyword) {
            return { statement: this.parseOutput(), expectedRule: '[OUTPUT_KEYWORD] [VALUE] [DELIMITER]' };
        }
        if (first.type === token_1.TokenType.IfKeyword) {
            return { statement: this.parseIf(), expectedRule: '[IF] [EXPR] [COMPARE_OP] [EXPR] [LBRACE] <statements> [RBRACE] [DELIMITER]' };
        }
        if (first.type === token_1.TokenType.WhileKeyword) {
            return { statement: this.parseWhile(), expectedRule: '[WHILE] [EXPR] [COMPARE_OP] [EXPR] [LBRACE] <statements> [RBRACE] [DELIMITER]' };
        }
        if (first.type === token_1.TokenType.ClassKeyword) {
            return { statement: this.parseClass(), expectedRule: '[CLASS] [IDENTIFIER] [LBRACE] <fields> [RBRACE] [DELIMITER]' };
        }
        if (first.type === token_1.TokenType.EOF) {
            this.errorAtEnd('Expected a statement, but input was empty.');
            return { statement: null, expectedRule: '[DATATYPE] ... OR [OUTPUT_KEYWORD] ...' };
        }
        this.errorAt(first, `Expected statement to start with DATATYPE, OUTPUT_KEYWORD, IF, WHILE, or CLASS, but found ${first.type} ('${first.lexeme}').`);
        return { statement: null, expectedRule: '[DATATYPE] ... OR [OUTPUT_KEYWORD] ... OR [IF] ... OR [WHILE] ... OR [CLASS] ...' };
    }
    parseIf() {
        this.expect(token_1.TokenType.IfKeyword, "keyword 'if'");
        const condition = this.parseCondition();
        const body = this.parseBlockStatements();
        const delimOk = this.expectOrRecoverDelimiter();
        if (!condition || !body || !delimOk)
            return null;
        return { kind: 'IfStatement', condition, body, delimiter: '.' };
    }
    parseWhile() {
        this.expect(token_1.TokenType.WhileKeyword, "keyword 'while'");
        const condition = this.parseCondition();
        const body = this.parseBlockStatements();
        const delimOk = this.expectOrRecoverDelimiter();
        if (!condition || !body || !delimOk)
            return null;
        return { kind: 'WhileStatement', condition, body, delimiter: '.' };
    }
    parseClass() {
        this.expect(token_1.TokenType.ClassKeyword, "keyword 'class'");
        const nameTok = this.expect(token_1.TokenType.Identifier, 'a class name IDENTIFIER');
        const lbrace = this.expect(token_1.TokenType.LBrace, "'{' to start class body");
        if (!nameTok || !lbrace) {
            // attempt to recover by skipping until delimiter
            while (this.peek().type !== token_1.TokenType.EOF && this.peek().type !== token_1.TokenType.Delimiter)
                this.consume();
            this.expectOrRecoverDelimiter();
            return null;
        }
        const fields = [];
        while (this.peek().type !== token_1.TokenType.EOF && this.peek().type !== token_1.TokenType.RBrace) {
            const f = this.parseFieldDeclaration();
            if (f) {
                fields.push(f);
                continue;
            }
            // Panic-mode inside class body: skip until next delimiter or closing brace.
            if (this.peek().type === token_1.TokenType.RBrace)
                break;
            this.panicSkipOne('Skipping unexpected token inside class body (panic-mode recovery).');
            while (this.peek().type !== token_1.TokenType.EOF && this.peek().type !== token_1.TokenType.Delimiter && this.peek().type !== token_1.TokenType.RBrace) {
                this.panicSkipOne('Skipping token while recovering inside class body.');
            }
            if (this.peek().type === token_1.TokenType.Delimiter)
                this.consume();
        }
        const rbrace = this.expect(token_1.TokenType.RBrace, "'}' to close class body");
        const delimOk = this.expectOrRecoverDelimiter();
        if (!rbrace || !delimOk)
            return null;
        return { kind: 'ClassDeclaration', name: nameTok.lexeme, fields, delimiter: '.' };
    }
    parseFieldDeclaration() {
        const dtTok = this.expect(token_1.TokenType.DataType, 'a field DATATYPE');
        const nameTok = this.expect(token_1.TokenType.Identifier, 'a field name IDENTIFIER');
        const assignTok = this.expect(token_1.TokenType.AssignOperator, 'an ASSIGN_OPERATOR (:) in field declaration');
        if (!dtTok || !nameTok || !assignTok)
            return null;
        const declaredTypeLex = dtTok.lexeme;
        const isNumeric = NUMERIC_TYPES.has(declaredTypeLex);
        let expression = null;
        if (isNumeric) {
            expression = this.parseNumericExpression();
        }
        else {
            const valueTok = this.peek();
            if (valueTok.type === token_1.TokenType.Identifier ||
                valueTok.type === token_1.TokenType.StringLiteral ||
                valueTok.type === token_1.TokenType.CharLiteral ||
                valueTok.type === token_1.TokenType.NumericLiteral) {
                const tok = this.consume();
                expression =
                    tok.type === token_1.TokenType.StringLiteral
                        ? { kind: 'StringLiteralExpr', token: tok }
                        : tok.type === token_1.TokenType.CharLiteral
                            ? { kind: 'CharLiteralExpr', token: tok }
                            : tok.type === token_1.TokenType.Identifier
                                ? { kind: 'IdentifierExpr', token: tok }
                                : { kind: 'NumericLiteralExpr', token: tok };
            }
            else {
                if (valueTok.type === token_1.TokenType.EOF) {
                    this.errorAtEnd('Expected a field initializer value, but reached end of input.');
                }
                else {
                    this.errorAt(valueTok, `Expected a field initializer value, but found ${valueTok.type} ('${valueTok.lexeme}').`);
                }
            }
        }
        const delimOk = this.expectOrRecoverDelimiter();
        if (!expression || !delimOk)
            return null;
        const dtLex = dtTok.lexeme;
        return {
            kind: 'FieldDeclaration',
            dataType: dtLex,
            name: nameTok.lexeme,
            assignOperator: ':',
            expression,
            delimiter: '.',
        };
    }
    parseCondition() {
        const left = this.parseNumericExpression();
        const opTok = this.peek();
        const op = this.parseCompareOperator();
        const right = this.parseNumericExpression();
        if (!left || !op || !right) {
            if (opTok.type === token_1.TokenType.EOF)
                this.errorAtEnd('Expected a numeric comparison in condition.');
            return null;
        }
        return { kind: 'CompareCondition', operator: op, left, right };
    }
    parseCompareOperator() {
        const t = this.peek();
        switch (t.type) {
            case token_1.TokenType.Less:
                this.consume();
                return '<';
            case token_1.TokenType.LessEqual:
                this.consume();
                return '<=';
            case token_1.TokenType.Greater:
                this.consume();
                return '>';
            case token_1.TokenType.GreaterEqual:
                this.consume();
                return '>=';
            case token_1.TokenType.EqualEqual:
                this.consume();
                return '==';
            case token_1.TokenType.BangEqual:
                this.consume();
                return '!=';
            default:
                if (t.type === token_1.TokenType.EOF) {
                    this.errorAtEnd('Expected a comparison operator in condition.');
                }
                else {
                    this.errorAt(t, `Expected a comparison operator in condition, but found ${t.type} ('${t.lexeme}').`);
                }
                return null;
        }
    }
    parseBlockStatements() {
        const lbrace = this.expect(token_1.TokenType.LBrace, "'{' to start a block");
        if (!lbrace)
            return null;
        const statements = [];
        while (this.peek().type !== token_1.TokenType.EOF && this.peek().type !== token_1.TokenType.RBrace) {
            const { statement } = this.parseStatement();
            if (statement) {
                statements.push(statement);
                continue;
            }
            // Panic-mode within a block: skip until delimiter or end of block.
            this.panicSkipOne('Skipping unexpected token inside block (panic-mode recovery).');
            while (this.peek().type !== token_1.TokenType.EOF && this.peek().type !== token_1.TokenType.Delimiter && this.peek().type !== token_1.TokenType.RBrace) {
                this.panicSkipOne('Skipping token while recovering inside block.');
            }
            if (this.peek().type === token_1.TokenType.Delimiter)
                this.consume();
        }
        const rbrace = this.expect(token_1.TokenType.RBrace, "'}' to close a block");
        if (!rbrace)
            return null;
        return statements;
    }
    expectOrRecoverDelimiter() {
        const delimTok = this.peek();
        if (delimTok.type === token_1.TokenType.Delimiter) {
            this.consume();
            return true;
        }
        if (delimTok.type === token_1.TokenType.EOF || delimTok.type === token_1.TokenType.RBrace) {
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
    parseAssignment() {
        const dtTok = this.expect(token_1.TokenType.DataType, 'a DATATYPE');
        const idTok = this.expect(token_1.TokenType.Identifier, 'an IDENTIFIER after DATATYPE');
        const assignTok = this.expect(token_1.TokenType.AssignOperator, 'an ASSIGN_OPERATOR (:) after IDENTIFIER');
        const declaredTypeLex = dtTok?.lexeme ?? '';
        const isNumeric = NUMERIC_TYPES.has(declaredTypeLex);
        let expression = null;
        if (isNumeric) {
            expression = this.parseNumericExpression();
        }
        else {
            // Non-numeric assignments remain literal/identifier-only in v1.
            const valueTok = this.peek();
            if (valueTok.type === token_1.TokenType.Identifier ||
                valueTok.type === token_1.TokenType.StringLiteral ||
                valueTok.type === token_1.TokenType.CharLiteral ||
                valueTok.type === token_1.TokenType.NumericLiteral) {
                const tok = this.consume();
                expression =
                    tok.type === token_1.TokenType.StringLiteral
                        ? { kind: 'StringLiteralExpr', token: tok }
                        : tok.type === token_1.TokenType.CharLiteral
                            ? { kind: 'CharLiteralExpr', token: tok }
                            : tok.type === token_1.TokenType.Identifier
                                ? { kind: 'IdentifierExpr', token: tok }
                                : { kind: 'NumericLiteralExpr', token: tok };
            }
            else {
                if (valueTok.type === token_1.TokenType.EOF) {
                    this.errorAtEnd('Expected a value after ASSIGN_OPERATOR, but reached end of input.');
                }
                else {
                    this.errorAt(valueTok, `Expected a value after ASSIGN_OPERATOR, but found ${valueTok.type} ('${valueTok.lexeme}').`);
                }
            }
            // If an operator shows up, panic-skip until delimiter.
            while (this.peek().type === token_1.TokenType.Plus ||
                this.peek().type === token_1.TokenType.Minus ||
                this.peek().type === token_1.TokenType.Star ||
                this.peek().type === token_1.TokenType.Slash) {
                this.panicSkipOne('Unexpected arithmetic operator in non-numeric assignment; skipping.');
            }
        }
        const delimTok = this.peek();
        let delimOk = false;
        if (delimTok.type === token_1.TokenType.Delimiter) {
            this.consume();
            delimOk = true;
        }
        else {
            if (delimTok.type === token_1.TokenType.EOF) {
                // Phrase-level recovery: insert the missing delimiter.
                const eof = this.peek();
                this.warnAt(eof, "Missing statement delimiter '.' at end of statement. Inserted '.' (phrase-level recovery). ");
                this.recoveries.push({
                    strategy: 'Phrase-Level',
                    action: 'insertDelimiter',
                    message: "Inserted missing '.' delimiter.",
                });
                delimOk = true;
            }
            else {
                this.errorAt(delimTok, `Expected statement delimiter '.', but found ${delimTok.type} ('${delimTok.lexeme}').`);
            }
        }
        // If any mandatory pieces were missing, abort AST creation.
        if (!dtTok || !idTok || !assignTok || !expression || !delimOk)
            return null;
        const dtLex = dtTok.lexeme;
        const kw = dtLex;
        if (!language_1.DATA_TYPES.includes(dtLex)) {
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
    parseOutput() {
        const kwTok = this.expect(token_1.TokenType.OutputKeyword, 'an OUTPUT_KEYWORD');
        const valueTok = this.peek();
        let value = null;
        if (valueTok.type === token_1.TokenType.Identifier ||
            LITERAL_TYPES.has(valueTok.type)) {
            value = this.consume();
        }
        else {
            if (valueTok.type === token_1.TokenType.EOF) {
                this.errorAtEnd('Expected a value after OUTPUT_KEYWORD, but reached end of input.');
            }
            else {
                this.errorAt(valueTok, `Expected a value after OUTPUT_KEYWORD, but found ${valueTok.type} ('${valueTok.lexeme}').`);
            }
        }
        const delimTok = this.peek();
        let delimOk = false;
        if (delimTok.type === token_1.TokenType.Delimiter) {
            this.consume();
            delimOk = true;
        }
        else {
            if (delimTok.type === token_1.TokenType.EOF) {
                const eof = this.peek();
                this.warnAt(eof, "Missing statement delimiter '.' at end of statement. Inserted '.' (phrase-level recovery). ");
                this.recoveries.push({
                    strategy: 'Phrase-Level',
                    action: 'insertDelimiter',
                    message: "Inserted missing '.' delimiter.",
                });
                delimOk = true;
            }
            else {
                this.errorAt(delimTok, `Expected statement delimiter '.', but found ${delimTok.type} ('${delimTok.lexeme}').`);
            }
        }
        if (!kwTok || !value || !delimOk)
            return null;
        const kwLex = kwTok.lexeme;
        const kw = kwLex;
        if (!language_1.OUTPUT_KEYWORDS.includes(kwLex)) {
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
    parseNumericExpression() {
        return this.parseAdditive();
    }
    parseAdditive() {
        let left = this.parseMultiplicative();
        if (!left)
            return null;
        while (this.peek().type === token_1.TokenType.Plus || this.peek().type === token_1.TokenType.Minus) {
            const opTok = this.consume();
            const right = this.parseMultiplicative();
            if (!right)
                return left;
            left = {
                kind: 'BinaryExpr',
                operator: opTok.type === token_1.TokenType.Plus ? '+' : '-',
                left,
                right,
            };
        }
        return left;
    }
    parseMultiplicative() {
        let left = this.parseUnary();
        if (!left)
            return null;
        while (this.peek().type === token_1.TokenType.Star || this.peek().type === token_1.TokenType.Slash) {
            const opTok = this.consume();
            const right = this.parseUnary();
            if (!right)
                return left;
            left = {
                kind: 'BinaryExpr',
                operator: opTok.type === token_1.TokenType.Star ? '*' : '/',
                left,
                right,
            };
        }
        return left;
    }
    parseUnary() {
        const t = this.peek();
        if (t.type === token_1.TokenType.Plus || t.type === token_1.TokenType.Minus) {
            this.consume();
            const operand = this.parseUnary();
            if (!operand)
                return null;
            return { kind: 'UnaryExpr', operator: t.type === token_1.TokenType.Minus ? '-' : '+', operand };
        }
        return this.parsePrimaryNumeric();
    }
    parsePrimaryNumeric() {
        // Panic-skip unexpected tokens until we find a plausible operand or hit delimiter/EOF.
        while (true) {
            const t = this.peek();
            if (t.type === token_1.TokenType.NumericLiteral) {
                return { kind: 'NumericLiteralExpr', token: this.consume() };
            }
            if (t.type === token_1.TokenType.Identifier) {
                return { kind: 'IdentifierExpr', token: this.consume() };
            }
            if (t.type === token_1.TokenType.StringLiteral) {
                return { kind: 'StringLiteralExpr', token: this.consume() };
            }
            if (t.type === token_1.TokenType.CharLiteral) {
                return { kind: 'CharLiteralExpr', token: this.consume() };
            }
            if (t.type === token_1.TokenType.EOF || t.type === token_1.TokenType.Delimiter) {
                this.errorAt(t, 'Expected a numeric literal or identifier in numeric expression.');
                return null;
            }
            this.warnAt(t, `Unexpected token in numeric expression: ${t.type} ('${t.lexeme}').`);
            this.panicSkipOne('Skipping unexpected token in numeric expression (panic-mode recovery).');
        }
    }
}
function parse(tokens) {
    const parser = new Parser(tokens);
    const { statement, expectedRule } = parser.parseStatement();
    const actualPattern = patternOf(tokens);
    // If there are extra non-EOF tokens after a successful parse, flag them.
    if (statement) {
        const firstExtra = parser.currentToken();
        if (firstExtra.type !== token_1.TokenType.EOF) {
            parser.diagnostics.push({
                severity: diagnostics_1.DiagnosticSeverity.Error,
                message: `Unexpected token after complete statement: ${firstExtra.type} ('${firstExtra.lexeme}').`,
                start: firstExtra.span.start,
                end: firstExtra.span.end,
            });
        }
    }
    const hasErrors = parser.diagnostics.some((d) => d.severity === diagnostics_1.DiagnosticSeverity.Error);
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
function parseProgram(tokens) {
    const parser = new Parser(tokens);
    const statements = [];
    while (parser.currentToken().type !== token_1.TokenType.EOF) {
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
        while (parser.currentToken().type !== token_1.TokenType.EOF && parser.currentToken().type !== token_1.TokenType.Delimiter) {
            parser.consumeCurrentToken();
        }
        if (parser.currentToken().type === token_1.TokenType.Delimiter) {
            parser.consumeCurrentToken();
        }
    }
    const hasErrors = parser.diagnostics.some((d) => d.severity === diagnostics_1.DiagnosticSeverity.Error);
    return { ok: !hasErrors, statements, diagnostics: parser.diagnostics, recoveries: parser.recoveries };
}
//# sourceMappingURL=parser.js.map