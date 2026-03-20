"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeSemantics = analyzeSemantics;
const diagnostics_1 = require("./diagnostics");
const token_1 = require("./token");
const classTable_1 = require("./classTable");
const symbolTable_1 = require("./symbolTable");
function isNumericType(t) {
    return t === 'decimal' || t === 'doubleDecimal' || t === 'int';
}
function inferValueType(token) {
    if (token.type === token_1.TokenType.Identifier && (token.lexeme === 'true' || token.lexeme === 'false')) {
        return 'Boolean';
    }
    switch (token.type) {
        case token_1.TokenType.NumericLiteral:
            return 'Numeric';
        case token_1.TokenType.StringLiteral:
            return 'String';
        case token_1.TokenType.CharLiteral:
            return 'Char';
        case token_1.TokenType.Identifier:
            return 'Identifier';
        default:
            return 'Unknown';
    }
}
function typeAllowsValue(declared, valueType) {
    if (valueType === 'Identifier')
        return true; // checked via symbol table
    switch (declared) {
        case 'decimal':
        case 'doubleDecimal':
        case 'int':
            return valueType === 'Numeric';
        case 'letters':
            return valueType === 'String';
        case 'letter':
            return valueType === 'Char';
        case 'bool':
            return valueType === 'Boolean';
        default:
            return false;
    }
}
function isBoolNumericLiteral(token) {
    return token.type === token_1.TokenType.NumericLiteral && (token.lexeme === '0' || token.lexeme === '1');
}
function boolMeaning(token) {
    if (token.lexeme === '0' || token.lexeme === 'false')
        return 'false';
    if (token.lexeme === '1' || token.lexeme === 'true')
        return 'true';
    return null;
}
function describeAssignedValueType(declaredType, valueToken, inferredType) {
    if (declaredType !== 'bool')
        return inferredType;
    const meaning = boolMeaning(valueToken);
    if (!meaning)
        return inferredType;
    return `Boolean (${valueToken.lexeme} = ${meaning})`;
}
function normalizeLiteralValue(token) {
    return token.lexeme;
}
function expressionToken(expr) {
    switch (expr.kind) {
        case 'NumericLiteralExpr':
        case 'IdentifierExpr':
        case 'StringLiteralExpr':
        case 'CharLiteralExpr':
            return expr.token;
        case 'UnaryExpr':
            return expressionToken(expr.operand);
        case 'BinaryExpr':
            return expressionToken(expr.left);
    }
}
function expressionLabel(expr) {
    switch (expr.kind) {
        case 'NumericLiteralExpr':
        case 'IdentifierExpr':
        case 'StringLiteralExpr':
        case 'CharLiteralExpr':
            return expr.token.lexeme;
        case 'UnaryExpr':
            return `${expr.operator}${expressionLabel(expr.operand)}`;
        case 'BinaryExpr':
            return `${expressionLabel(expr.left)} ${expr.operator} ${expressionLabel(expr.right)}`;
    }
}
function evaluateNumericExpression(expr, table, errorAt) {
    switch (expr.kind) {
        case 'NumericLiteralExpr': {
            const n = Number.parseFloat(expr.token.lexeme);
            if (Number.isNaN(n)) {
                errorAt(expr.token, `Invalid numeric literal '${expr.token.lexeme}'.`);
                return null;
            }
            return n;
        }
        case 'IdentifierExpr': {
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
        case 'UnaryExpr': {
            const v = evaluateNumericExpression(expr.operand, table, errorAt);
            if (v === null)
                return null;
            return expr.operator === '-' ? -v : v;
        }
        case 'BinaryExpr': {
            const l = evaluateNumericExpression(expr.left, table, errorAt);
            const r = evaluateNumericExpression(expr.right, table, errorAt);
            if (l === null || r === null)
                return null;
            switch (expr.operator) {
                case '+':
                    return l + r;
                case '-':
                    return l - r;
                case '*':
                    return l * r;
                case '/':
                    return l / r;
            }
            return null;
        }
        case 'StringLiteralExpr':
        case 'CharLiteralExpr':
            errorAt(expr.token, `Non-numeric literal '${expr.token.lexeme}' used in numeric expression.`);
            return null;
    }
}
function analyzeSemantics(statement, symbolTable, classTable) {
    const table = symbolTable ?? new symbolTable_1.SymbolTable();
    const classes = classTable ?? new classTable_1.ClassTable();
    const diagnostics = [];
    const actions = [];
    const errorAt = (token, message) => {
        diagnostics.push({
            severity: diagnostics_1.DiagnosticSeverity.Error,
            message,
            start: token.span.start,
            end: token.span.end,
        });
    };
    const fail = () => ({ ok: false, diagnostics, actions, symbolTable: table, classTable: classes });
    const succeed = () => ({ ok: true, diagnostics, actions, symbolTable: table, classTable: classes });
    const analyzeStatement = (s, scopeLevel = 0) => {
        switch (s.kind) {
            case 'AssignmentStatement': {
                const declaredType = s.dataType;
                const name = s.identifier;
                const expr = s.expression;
                if (isNumericType(declaredType)) {
                    actions.push({
                        kind: 'typeCheck',
                        message: `Variable '${name}' is declared as '${declaredType}'. Checking numeric expression...`,
                    });
                    const evaluated = evaluateNumericExpression(expr, table, errorAt);
                    if (evaluated === null)
                        return false;
                    // Redeclaration/update rules: allow re-binding only if existing type matches.
                    const existing = table.get(name);
                    if (existing && existing.type !== declaredType) {
                        errorAt(expressionToken(expr), `Redeclaration error: '${name}' was previously '${existing.type}' and cannot be redeclared as '${declaredType}'.`);
                        return false;
                    }
                    const bind = table.bind(name, declaredType, String(evaluated), scopeLevel);
                    actions.push({ kind: 'bind', action: bind.action, entry: bind.entry });
                    return true;
                }
                // Non-numeric assignment: only accept a single literal or identifier.
                let valueToken = null;
                if (expr.kind === 'StringLiteralExpr' || expr.kind === 'CharLiteralExpr' || expr.kind === 'NumericLiteralExpr' || expr.kind === 'IdentifierExpr') {
                    valueToken = expr.token;
                }
                if (!valueToken) {
                    // Should not happen with the current parser, but keep it safe.
                    errorAt(expressionToken(expr), 'Invalid expression for non-numeric assignment.');
                    return false;
                }
                const valueType = inferValueType(valueToken);
                const displayValueType = describeAssignedValueType(declaredType, valueToken, valueType);
                actions.push({
                    kind: 'typeCheck',
                    message: `Variable '${name}' is declared as '${declaredType}'. Value is '${valueToken.lexeme}' (${displayValueType}).`,
                });
                let effectiveValue = normalizeLiteralValue(valueToken);
                if (valueType === 'Identifier') {
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
                }
                else {
                    const boolNumeric = declaredType === 'bool' && isBoolNumericLiteral(valueToken);
                    if (!boolNumeric && !typeAllowsValue(declaredType, valueType)) {
                        errorAt(valueToken, `Type mismatch: Variable '${name}' is declared as '${declaredType}', but value '${valueToken.lexeme}' is ${valueType}.`);
                        return false;
                    }
                }
                // Redeclaration/update rules: allow re-binding only if existing type matches.
                const existing = table.get(name);
                if (existing && existing.type !== declaredType) {
                    errorAt(valueToken, `Redeclaration error: '${name}' was previously '${existing.type}' and cannot be redeclared as '${declaredType}'.`);
                    return false;
                }
                const bind = table.bind(name, declaredType, effectiveValue, scopeLevel);
                actions.push({ kind: 'bind', action: bind.action, entry: bind.entry });
                return true;
            }
            case 'OutputStatement': {
                const expr = s.expression;
                actions.push({
                    kind: 'typeCheck',
                    message: `Output checks expression '${expressionLabel(expr)}'.`,
                });
                if (expr.kind === 'StringLiteralExpr' || expr.kind === 'CharLiteralExpr' || expr.kind === 'NumericLiteralExpr') {
                    return true;
                }
                if (expr.kind === 'IdentifierExpr') {
                    const ref = table.get(expr.token.lexeme);
                    if (!ref) {
                        errorAt(expr.token, `Undeclared identifier '${expr.token.lexeme}' used in output statement.`);
                        return false;
                    }
                    return true;
                }
                const evaluated = evaluateNumericExpression(expr, table, errorAt);
                if (evaluated === null)
                    return false;
                return true;
            }
            case 'IfStatement':
            case 'WhileStatement': {
                const keyword = s.kind === 'IfStatement' ? 'if' : 'while';
                actions.push({
                    kind: 'typeCheck',
                    message: `Checking ${keyword} condition (numeric comparison)...`,
                });
                const left = evaluateNumericExpression(s.condition.left, table, errorAt);
                const right = evaluateNumericExpression(s.condition.right, table, errorAt);
                if (left === null || right === null)
                    return false;
                for (const inner of s.body) {
                    if (!analyzeStatement(inner, scopeLevel + 1))
                        return false;
                }
                return true;
            }
            case 'ClassDeclaration': {
                const name = s.name;
                const decl = classes.declareClass(name);
                if (!decl.ok) {
                    // Create a fake token span by anchoring to the first field token if available.
                    const anchorExpr = s.fields[0]?.expression;
                    if (anchorExpr)
                        errorAt(expressionToken(anchorExpr), decl.message);
                    else
                        diagnostics.push({ severity: diagnostics_1.DiagnosticSeverity.Error, message: decl.message, start: 0, end: 0 });
                    return false;
                }
                actions.push({ kind: 'bindClass', action: 'declare', entry: decl.entry });
                for (const f of s.fields) {
                    const fieldType = f.dataType;
                    const fieldName = f.name;
                    const expr = f.expression;
                    let fieldValue = null;
                    if (isNumericType(fieldType)) {
                        const evaluated = evaluateNumericExpression(expr, table, errorAt);
                        if (evaluated === null)
                            return false;
                        fieldValue = String(evaluated);
                    }
                    else {
                        let valueToken = null;
                        if (expr.kind === 'StringLiteralExpr' ||
                            expr.kind === 'CharLiteralExpr' ||
                            expr.kind === 'NumericLiteralExpr' ||
                            expr.kind === 'IdentifierExpr') {
                            valueToken = expr.token;
                        }
                        if (!valueToken) {
                            errorAt(expressionToken(expr), 'Invalid expression for non-numeric field initializer.');
                            return false;
                        }
                        const valueType = inferValueType(valueToken);
                        fieldValue = normalizeLiteralValue(valueToken);
                        if (valueType === 'Identifier') {
                            const ref = table.get(valueToken.lexeme);
                            if (!ref) {
                                errorAt(valueToken, `Undeclared identifier '${valueToken.lexeme}' used as field initializer.`);
                                return false;
                            }
                            if (ref.type !== fieldType) {
                                errorAt(valueToken, `Type mismatch: Field '${fieldName}' is '${fieldType}' but identifier '${ref.name}' is '${ref.type}'.`);
                                return false;
                            }
                            fieldValue = ref.value;
                        }
                        else {
                            const boolNumeric = fieldType === 'bool' && isBoolNumericLiteral(valueToken);
                            if (!boolNumeric && !typeAllowsValue(fieldType, valueType)) {
                                errorAt(valueToken, `Type mismatch: Field '${fieldName}' is declared as '${fieldType}', but value '${valueToken.lexeme}' is ${valueType}.`);
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
                    actions.push({ kind: 'bindField', className: name, action: 'declare', entry: bound.entry });
                }
                return true;
            }
        }
    };
    const ok = analyzeStatement(statement, 0);
    if (!ok)
        return fail();
    return succeed();
}
//# sourceMappingURL=semantics.js.map