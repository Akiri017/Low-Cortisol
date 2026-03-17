export declare enum TokenType {
    DataType = "DATATYPE",
    OutputKeyword = "OUTPUT_KEYWORD",
    IfKeyword = "IF_KEYWORD",
    WhileKeyword = "WHILE_KEYWORD",
    ClassKeyword = "CLASS_KEYWORD",
    Identifier = "IDENTIFIER",
    AssignOperator = "ASSIGN_OPERATOR",
    Delimiter = "DELIMITER",
    LBrace = "LBRACE",
    RBrace = "RBRACE",
    Less = "LESS",
    LessEqual = "LESS_EQUAL",
    Greater = "GREATER",
    GreaterEqual = "GREATER_EQUAL",
    EqualEqual = "EQUAL_EQUAL",
    BangEqual = "BANG_EQUAL",
    Plus = "PLUS",
    Minus = "MINUS",
    Star = "STAR",
    Slash = "SLASH",
    NumericLiteral = "NUMERIC_LITERAL",
    StringLiteral = "STRING_LITERAL",
    CharLiteral = "CHAR_LITERAL",
    Unknown = "UNKNOWN",
    EOF = "EOF"
}
export type SourceSpan = {
    start: number;
    end: number;
};
export type Token = {
    type: TokenType;
    lexeme: string;
    span: SourceSpan;
};
//# sourceMappingURL=token.d.ts.map