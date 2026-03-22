"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lex = lex;
const diagnostics_1 = require("./diagnostics");
const language_1 = require("./language");
const token_1 = require("./token");
const isWhitespace = (ch) => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
const isDigit = (ch) => ch >= '0' && ch <= '9';
const isIdentStart = (ch) => (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch === '_';
const isIdentPart = (ch) => isIdentStart(ch) || isDigit(ch);
const isDoubleQuoteDelimiter = (ch) => ch === '"' || ch === '\u201C' || ch === '\u201D';
function makeToken(type, lexeme, start, end) {
    return { type, lexeme, span: { start, end } };
}
function pushToken(tokens, counts, token) {
    tokens.push(token);
    counts[token.type] = (counts[token.type] ?? 0) + 1;
}
function initCounts() {
    return Object.values(token_1.TokenType).reduce((acc, t) => {
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
        pushToken(tokens, counts, makeToken(token_1.TokenType.Unknown, lexeme, start, end));
        diagnostics.push({
            severity: diagnostics_1.DiagnosticSeverity.Error,
            message,
            start,
            end,
        });
    };
    while (index < length) {
        const ch = source[index];
        if (isWhitespace(ch)) {
            index += 1;
            continue;
        }
        const start = index;
        if (ch === language_1.ASSIGN_OPERATOR) {
            index += 1;
            pushToken(tokens, counts, makeToken(token_1.TokenType.AssignOperator, language_1.ASSIGN_OPERATOR, start, index));
            continue;
        }
        if (ch === language_1.STATEMENT_DELIMITER) {
            index += 1;
            pushToken(tokens, counts, makeToken(token_1.TokenType.Delimiter, language_1.STATEMENT_DELIMITER, start, index));
            continue;
        }
        if (ch === '{') {
            index += 1;
            pushToken(tokens, counts, makeToken(token_1.TokenType.LBrace, '{', start, index));
            continue;
        }
        if (ch === '}') {
            index += 1;
            pushToken(tokens, counts, makeToken(token_1.TokenType.RBrace, '}', start, index));
            continue;
        }
        // Comparison operators (multi-char first)
        if (ch === '<') {
            if (index + 1 < length && source[index + 1] === '=') {
                index += 2;
                pushToken(tokens, counts, makeToken(token_1.TokenType.LessEqual, '<=', start, index));
            }
            else {
                index += 1;
                pushToken(tokens, counts, makeToken(token_1.TokenType.Less, '<', start, index));
            }
            continue;
        }
        if (ch === '>') {
            if (index + 1 < length && source[index + 1] === '=') {
                index += 2;
                pushToken(tokens, counts, makeToken(token_1.TokenType.GreaterEqual, '>=', start, index));
            }
            else {
                index += 1;
                pushToken(tokens, counts, makeToken(token_1.TokenType.Greater, '>', start, index));
            }
            continue;
        }
        if (ch === '=') {
            if (index + 1 < length && source[index + 1] === '=') {
                index += 2;
                pushToken(tokens, counts, makeToken(token_1.TokenType.EqualEqual, '==', start, index));
            }
            else {
                // Single '=' isn't part of the language contract; treat as unknown.
                index += 1;
                addUnknown('=', start, index, "Unknown token '='. Did you mean '=='?");
            }
            continue;
        }
        if (ch === '!') {
            if (index + 1 < length && source[index + 1] === '=') {
                index += 2;
                pushToken(tokens, counts, makeToken(token_1.TokenType.BangEqual, '!=', start, index));
            }
            else {
                index += 1;
                addUnknown('!', start, index, "Unknown token '!'. Did you mean '!='?");
            }
            continue;
        }
        if (ch === '+') {
            index += 1;
            pushToken(tokens, counts, makeToken(token_1.TokenType.Plus, '+', start, index));
            continue;
        }
        if (ch === '-') {
            index += 1;
            pushToken(tokens, counts, makeToken(token_1.TokenType.Minus, '-', start, index));
            continue;
        }
        if (ch === '*') {
            index += 1;
            pushToken(tokens, counts, makeToken(token_1.TokenType.Star, '*', start, index));
            continue;
        }
        if (ch === '/') {
            index += 1;
            pushToken(tokens, counts, makeToken(token_1.TokenType.Slash, '/', start, index));
            continue;
        }
        // Dollar-delimited literals: $...$ or $$...$$
        // - If the literal content is exactly 1 character, classify as CHAR_LITERAL
        // - Otherwise classify as STRING_LITERAL
        if (ch === '$') {
            const delimiterLen = index + 1 < length && source[index + 1] === '$' ? 2 : 1;
            index += delimiterLen; // consume opening $ or $$
            const contentStart = index;
            let closed = false;
            while (index < length) {
                const c = source[index];
                if (c === '\\') {
                    // skip escape sequence: \X
                    index += 1;
                    if (index < length)
                        index += 1;
                    continue;
                }
                if (delimiterLen === 2) {
                    if (c === '$' && index + 1 < length && source[index + 1] === '$') {
                        index += 2;
                        closed = true;
                        break;
                    }
                }
                else {
                    if (c === '$') {
                        index += 1;
                        closed = true;
                        break;
                    }
                }
                index += 1;
            }
            const lexeme = source.slice(start, index);
            if (!closed) {
                addUnknown(lexeme, start, index, 'Unterminated $-delimited literal. Expected closing $ (or $$).');
            }
            else {
                const contentEnd = index - delimiterLen;
                const content = source.slice(contentStart, contentEnd);
                const t = content.length === 1 ? token_1.TokenType.CharLiteral : token_1.TokenType.StringLiteral;
                pushToken(tokens, counts, makeToken(t, lexeme, start, index));
            }
            continue;
        }
        if (isDoubleQuoteDelimiter(ch)) {
            index += 1; // consume opening quote
            let closed = false;
            while (index < length) {
                const c = source[index];
                if (c === '\\') {
                    // skip escape sequence: \X
                    index += 1;
                    if (index < length)
                        index += 1;
                    continue;
                }
                if (isDoubleQuoteDelimiter(c)) {
                    index += 1; // consume closing quote
                    closed = true;
                    break;
                }
                index += 1;
            }
            const lexeme = source.slice(start, index);
            if (!closed) {
                const hint = lexeme.includes('\\"') || lexeme.includes('\\\'')
                    ?
                        " Hint: your source contains backslashes before quotes (e.g. \\\"), which is often caused by shell escaping. In PowerShell, either wrap the whole program in single quotes, or escape embedded double-quotes as `\" (backtick + quote), not \\\"."
                    : '';
                addUnknown(lexeme, start, index, `Unterminated string literal.${hint}`);
            }
            else {
                pushToken(tokens, counts, makeToken(token_1.TokenType.StringLiteral, lexeme, start, index));
            }
            continue;
        }
        if (ch === "'") {
            index += 1; // consume opening quote
            if (index >= length) {
                addUnknown(source.slice(start, index), start, index, 'Unterminated char literal.');
                continue;
            }
            if (source[index] === '\\') {
                // escaped char
                index += 2;
            }
            else {
                index += 1;
            }
            if (index >= length || source[index] !== "'") {
                // consume until whitespace/punct as unknown
                while (index < length && !isWhitespace(source[index]) && source[index] !== language_1.STATEMENT_DELIMITER) {
                    if (source[index] === language_1.ASSIGN_OPERATOR)
                        break;
                    index += 1;
                }
                addUnknown(source.slice(start, index), start, index, 'Malformed char literal. Expected closing \'.');
                continue;
            }
            index += 1; // consume closing quote
            const lexeme = source.slice(start, index);
            pushToken(tokens, counts, makeToken(token_1.TokenType.CharLiteral, lexeme, start, index));
            continue;
        }
        if (isDigit(ch)) {
            index += 1;
            while (index < length && isDigit(source[index]))
                index += 1;
            // If we see a dot followed by a digit, treat it as a decimal part.
            if (index < length && source[index] === '.' && index + 1 < length && isDigit(source[index + 1])) {
                index += 1; // consume dot
                while (index < length && isDigit(source[index]))
                    index += 1;
            }
            const lexeme = source.slice(start, index);
            pushToken(tokens, counts, makeToken(token_1.TokenType.NumericLiteral, lexeme, start, index));
            continue;
        }
        if (isIdentStart(ch)) {
            index += 1;
            while (index < length && isIdentPart(source[index]))
                index += 1;
            const lexeme = source.slice(start, index);
            if (language_1.DATA_TYPES.includes(lexeme)) {
                pushToken(tokens, counts, makeToken(token_1.TokenType.DataType, lexeme, start, index));
            }
            else if (language_1.OUTPUT_KEYWORDS.includes(lexeme)) {
                pushToken(tokens, counts, makeToken(token_1.TokenType.OutputKeyword, lexeme, start, index));
            }
            else if (lexeme === 'if') {
                pushToken(tokens, counts, makeToken(token_1.TokenType.IfKeyword, lexeme, start, index));
            }
            else if (lexeme === 'while') {
                pushToken(tokens, counts, makeToken(token_1.TokenType.WhileKeyword, lexeme, start, index));
            }
            else if (lexeme === 'class') {
                pushToken(tokens, counts, makeToken(token_1.TokenType.ClassKeyword, lexeme, start, index));
            }
            else {
                pushToken(tokens, counts, makeToken(token_1.TokenType.Identifier, lexeme, start, index));
            }
            continue;
        }
        // Unknown token: consume a run of non-whitespace characters that are not known single-char tokens.
        index += 1;
        while (index < length &&
            !isWhitespace(source[index]) &&
            !isDigit(source[index]) &&
            !isIdentStart(source[index]) &&
            source[index] !== language_1.ASSIGN_OPERATOR &&
            source[index] !== language_1.STATEMENT_DELIMITER &&
            source[index] !== '{' &&
            source[index] !== '}' &&
            source[index] !== '<' &&
            source[index] !== '>' &&
            source[index] !== '=' &&
            source[index] !== '!' &&
            source[index] !== '+' &&
            source[index] !== '-' &&
            source[index] !== '*' &&
            source[index] !== '/' &&
            source[index] !== '$' &&
            source[index] !== '"' &&
            source[index] !== "'") {
            index += 1;
        }
        addUnknown(source.slice(start, index), start, index, `Unknown token '${source.slice(start, index)}'.`);
    }
    pushToken(tokens, counts, makeToken(token_1.TokenType.EOF, '', length, length));
    return {
        tokens,
        diagnostics,
        counts,
        unknownCount,
    };
}
//# sourceMappingURL=lexer.js.map