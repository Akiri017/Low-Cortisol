import type { DataTypeLexeme, OutputKeywordLexeme } from './language';
import type { Token } from './token';
export type Expression = {
    kind: 'NumericLiteralExpr';
    token: Token;
} | {
    kind: 'IdentifierExpr';
    token: Token;
} | {
    kind: 'UnaryExpr';
    operator: '-' | '+';
    operand: Expression;
} | {
    kind: 'BinaryExpr';
    operator: '+' | '-' | '*' | '/';
    left: Expression;
    right: Expression;
} | {
    kind: 'StringLiteralExpr';
    token: Token;
} | {
    kind: 'CharLiteralExpr';
    token: Token;
};
export type CompareOperator = '<' | '<=' | '>' | '>=' | '==' | '!=';
export type Condition = {
    kind: 'CompareCondition';
    operator: CompareOperator;
    left: Expression;
    right: Expression;
};
export type AssignmentStatement = {
    kind: 'AssignmentStatement';
    dataType: DataTypeLexeme;
    identifier: string;
    assignOperator: ':';
    expression: Expression;
    delimiter: '.';
};
export type OutputStatement = {
    kind: 'OutputStatement';
    keyword: OutputKeywordLexeme;
    value: Token;
    delimiter: '.';
};
export type IfStatement = {
    kind: 'IfStatement';
    condition: Condition;
    body: Statement[];
    delimiter: '.';
};
export type WhileStatement = {
    kind: 'WhileStatement';
    condition: Condition;
    body: Statement[];
    delimiter: '.';
};
export type FieldDeclaration = {
    kind: 'FieldDeclaration';
    dataType: DataTypeLexeme;
    name: string;
    assignOperator: ':';
    expression: Expression;
    delimiter: '.';
};
export type ClassDeclaration = {
    kind: 'ClassDeclaration';
    name: string;
    fields: FieldDeclaration[];
    delimiter: '.';
};
export type Statement = AssignmentStatement | OutputStatement | IfStatement | WhileStatement | ClassDeclaration;
//# sourceMappingURL=ast.d.ts.map