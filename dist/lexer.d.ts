import { type Diagnostic } from './diagnostics';
import { TokenType, type Token } from './token';
export type LexResult = {
    tokens: Token[];
    diagnostics: Diagnostic[];
    counts: Record<TokenType, number>;
    unknownCount: number;
};
export declare function lex(source: string): LexResult;
//# sourceMappingURL=lexer.d.ts.map