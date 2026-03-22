import { DiagnosticSeverity, type Diagnostic } from './diagnostics';
import {
  ASSIGN_OPERATOR,
  DATA_TYPES,
  OUTPUT_KEYWORDS,
  STATEMENT_DELIMITER,
} from './language';
import { TokenType, type Token } from './token';

export type LexResult = {
  tokens: Token[];
  diagnostics: Diagnostic[];
  counts: Record<TokenType, number>;
  unknownCount: number;
};

const isWhitespace = (ch: string) => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
const isDigit = (ch: string) => ch >= '0' && ch <= '9';
const isIdentStart = (ch: string) => (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch === '_';
const isIdentPart = (ch: string) => isIdentStart(ch) || isDigit(ch);
const isDoubleQuoteDelimiter = (ch: string) => ch === '"' || ch === '\u201C' || ch === '\u201D';

function makeToken(type: TokenType, lexeme: string, start: number, end: number): Token {
  return { type, lexeme, span: { start, end } };
}

function pushToken(tokens: Token[], counts: Record<TokenType, number>, token: Token): void {
  tokens.push(token);
  counts[token.type] = (counts[token.type] ?? 0) + 1;
}

function initCounts(): Record<TokenType, number> {
  return Object.values(TokenType).reduce((acc, t) => {
    acc[t] = 0;
    return acc;
  }, {} as Record<TokenType, number>);
}

export function lex(source: string): LexResult {
  const tokens: Token[] = [];
  const diagnostics: Diagnostic[] = [];
  const counts = initCounts();
  let unknownCount = 0;

  let index = 0;
  const length = source.length;

  const addUnknown = (lexeme: string, start: number, end: number, message: string) => {
    unknownCount += 1;
    pushToken(tokens, counts, makeToken(TokenType.Unknown, lexeme, start, end));
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      message,
      start,
      end,
    });
  };

  while (index < length) {
    const ch = source[index]!;

    if (isWhitespace(ch)) {
      index += 1;
      continue;
    }

    const start = index;

    if (ch === ASSIGN_OPERATOR) {
      index += 1;
      pushToken(tokens, counts, makeToken(TokenType.AssignOperator, ASSIGN_OPERATOR, start, index));
      continue;
    }

    if (ch === STATEMENT_DELIMITER) {
      index += 1;
      pushToken(tokens, counts, makeToken(TokenType.Delimiter, STATEMENT_DELIMITER, start, index));
      continue;
    }

    if (ch === '{') {
      index += 1;
      pushToken(tokens, counts, makeToken(TokenType.LBrace, '{', start, index));
      continue;
    }

    if (ch === '}') {
      index += 1;
      pushToken(tokens, counts, makeToken(TokenType.RBrace, '}', start, index));
      continue;
    }

    // Comparison operators (multi-char first)
    if (ch === '<') {
      if (index + 1 < length && source[index + 1]! === '=') {
        index += 2;
        pushToken(tokens, counts, makeToken(TokenType.LessEqual, '<=', start, index));
      } else {
        index += 1;
        pushToken(tokens, counts, makeToken(TokenType.Less, '<', start, index));
      }
      continue;
    }

    if (ch === '>') {
      if (index + 1 < length && source[index + 1]! === '=') {
        index += 2;
        pushToken(tokens, counts, makeToken(TokenType.GreaterEqual, '>=', start, index));
      } else {
        index += 1;
        pushToken(tokens, counts, makeToken(TokenType.Greater, '>', start, index));
      }
      continue;
    }

    if (ch === '=') {
      if (index + 1 < length && source[index + 1]! === '=') {
        index += 2;
        pushToken(tokens, counts, makeToken(TokenType.EqualEqual, '==', start, index));
      } else {
        // Single '=' isn't part of the language contract; treat as unknown.
        index += 1;
        addUnknown('=', start, index, "Unknown token '='. Did you mean '=='?");
      }
      continue;
    }

    if (ch === '!') {
      if (index + 1 < length && source[index + 1]! === '=') {
        index += 2;
        pushToken(tokens, counts, makeToken(TokenType.BangEqual, '!=', start, index));
      } else {
        index += 1;
        addUnknown('!', start, index, "Unknown token '!'. Did you mean '!='?");
      }
      continue;
    }

    if (ch === '+') {
      index += 1;
      pushToken(tokens, counts, makeToken(TokenType.Plus, '+', start, index));
      continue;
    }

    if (ch === '-') {
      index += 1;
      pushToken(tokens, counts, makeToken(TokenType.Minus, '-', start, index));
      continue;
    }

    if (ch === '*') {
      index += 1;
      pushToken(tokens, counts, makeToken(TokenType.Star, '*', start, index));
      continue;
    }

    if (ch === '/') {
      index += 1;
      pushToken(tokens, counts, makeToken(TokenType.Slash, '/', start, index));
      continue;
    }

    // Dollar-delimited literals: $...$ or $$...$$
    // - If the literal content is exactly 1 character, classify as CHAR_LITERAL
    // - Otherwise classify as STRING_LITERAL
    if (ch === '$') {
      const delimiterLen = index + 1 < length && source[index + 1]! === '$' ? 2 : 1;
      index += delimiterLen; // consume opening $ or $$

      const contentStart = index;
      let closed = false;
      while (index < length) {
        const c = source[index]!;
        if (c === '\\') {
          // skip escape sequence: \X
          index += 1;
          if (index < length) index += 1;
          continue;
        }

        if (delimiterLen === 2) {
          if (c === '$' && index + 1 < length && source[index + 1]! === '$') {
            index += 2;
            closed = true;
            break;
          }
        } else {
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
      } else {
        const contentEnd = index - delimiterLen;
        const content = source.slice(contentStart, contentEnd);
        const t = content.length === 1 ? TokenType.CharLiteral : TokenType.StringLiteral;
        pushToken(tokens, counts, makeToken(t, lexeme, start, index));
      }
      continue;
    }

    if (isDoubleQuoteDelimiter(ch)) {
      index += 1; // consume opening quote
      let closed = false;
      while (index < length) {
        const c = source[index]!;
        if (c === '\\') {
          // skip escape sequence: \X
          index += 1;
          if (index < length) index += 1;
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
        const hint =
          lexeme.includes('\\"') || lexeme.includes('\\\'')
            ?
              " Hint: your source contains backslashes before quotes (e.g. \\\"), which is often caused by shell escaping. In PowerShell, either wrap the whole program in single quotes, or escape embedded double-quotes as `\" (backtick + quote), not \\\"." 
            : '';
        addUnknown(lexeme, start, index, `Unterminated string literal.${hint}`);
      } else {
        pushToken(tokens, counts, makeToken(TokenType.StringLiteral, lexeme, start, index));
      }
      continue;
    }

    if (ch === "'") {
      index += 1; // consume opening quote
      if (index >= length) {
        addUnknown(source.slice(start, index), start, index, 'Unterminated char literal.');
        continue;
      }

      if (source[index]! === '\\') {
        // escaped char
        index += 2;
      } else {
        index += 1;
      }

      if (index >= length || source[index]! !== "'") {
        // consume until whitespace/punct as unknown
        while (index < length && !isWhitespace(source[index]!) && source[index]! !== STATEMENT_DELIMITER) {
          if (source[index]! === ASSIGN_OPERATOR) break;
          index += 1;
        }
        addUnknown(source.slice(start, index), start, index, 'Malformed char literal. Expected closing \'.');
        continue;
      }

      index += 1; // consume closing quote
      const lexeme = source.slice(start, index);
      pushToken(tokens, counts, makeToken(TokenType.CharLiteral, lexeme, start, index));
      continue;
    }

    if (isDigit(ch)) {
      index += 1;
      while (index < length && isDigit(source[index]!)) index += 1;

      // If we see a dot followed by a digit, treat it as a decimal part.
      if (index < length && source[index]! === '.' && index + 1 < length && isDigit(source[index + 1]!)) {
        index += 1; // consume dot
        while (index < length && isDigit(source[index]!)) index += 1;
      }

      const lexeme = source.slice(start, index);
      pushToken(tokens, counts, makeToken(TokenType.NumericLiteral, lexeme, start, index));
      continue;
    }

    if (isIdentStart(ch)) {
      index += 1;
      while (index < length && isIdentPart(source[index]!)) index += 1;
      const lexeme = source.slice(start, index);

      if ((DATA_TYPES as readonly string[]).includes(lexeme)) {
        pushToken(tokens, counts, makeToken(TokenType.DataType, lexeme, start, index));
      } else if ((OUTPUT_KEYWORDS as readonly string[]).includes(lexeme)) {
        pushToken(tokens, counts, makeToken(TokenType.OutputKeyword, lexeme, start, index));
      } else if (lexeme === 'if') {
        pushToken(tokens, counts, makeToken(TokenType.IfKeyword, lexeme, start, index));
      } else if (lexeme === 'while') {
        pushToken(tokens, counts, makeToken(TokenType.WhileKeyword, lexeme, start, index));
      } else if (lexeme === 'class') {
        pushToken(tokens, counts, makeToken(TokenType.ClassKeyword, lexeme, start, index));
      } else {
        pushToken(tokens, counts, makeToken(TokenType.Identifier, lexeme, start, index));
      }
      continue;
    }

    // Unknown token: consume a run of non-whitespace characters that are not known single-char tokens.
    index += 1;
    while (
      index < length &&
      !isWhitespace(source[index]!) &&
      !isDigit(source[index]!) &&
      !isIdentStart(source[index]!) &&
      source[index]! !== ASSIGN_OPERATOR &&
      source[index]! !== STATEMENT_DELIMITER &&
      source[index]! !== '{' &&
      source[index]! !== '}' &&
      source[index]! !== '<' &&
      source[index]! !== '>' &&
      source[index]! !== '=' &&
      source[index]! !== '!' &&
      source[index]! !== '+' &&
      source[index]! !== '-' &&
      source[index]! !== '*' &&
      source[index]! !== '/' &&
      source[index]! !== '$' &&
      source[index]! !== '"' &&
      source[index]! !== "'"
    ) {
      index += 1;
    }

    addUnknown(source.slice(start, index), start, index, `Unknown token '${source.slice(start, index)}'.`);
  }

  pushToken(tokens, counts, makeToken(TokenType.EOF, '', length, length));

  return {
    tokens,
    diagnostics,
    counts,
    unknownCount,
  };
}
