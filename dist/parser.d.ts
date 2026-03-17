import { type Diagnostic } from './diagnostics';
import { TokenType, type Token } from './token';
import type { Statement } from './ast';
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
export type RecoveryAction = {
    strategy: 'Phrase-Level';
    action: 'insertDelimiter';
    message: string;
} | {
    strategy: 'Panic-Mode';
    action: 'skipToken';
    message: string;
    skipped: {
        type: TokenType;
        lexeme: string;
    };
};
export declare function parse(tokens: Token[]): ParseResult;
export type ParseProgramResult = {
    ok: boolean;
    statements: Statement[];
    diagnostics: Diagnostic[];
    recoveries: RecoveryAction[];
};
export declare function parseProgram(tokens: Token[]): ParseProgramResult;
//# sourceMappingURL=parser.d.ts.map