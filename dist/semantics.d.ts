import { type Diagnostic } from './diagnostics';
import type { Statement } from './ast';
import { ClassTable, type ClassEntry, type ClassFieldEntry } from './classTable';
import { SymbolTable, type BindAction, type SymbolEntry } from './symbolTable';
export type SemanticAction = {
    kind: 'typeCheck';
    message: string;
} | {
    kind: 'bind';
    action: BindAction;
    entry: SymbolEntry;
} | {
    kind: 'bindClass';
    action: 'declare';
    entry: ClassEntry;
} | {
    kind: 'bindField';
    className: string;
    action: 'declare';
    entry: ClassFieldEntry;
};
export type SemanticSuccess = {
    ok: true;
    diagnostics: Diagnostic[];
    actions: SemanticAction[];
    symbolTable: SymbolTable;
    classTable: ClassTable;
};
export type SemanticFailure = {
    ok: false;
    diagnostics: Diagnostic[];
    actions: SemanticAction[];
    symbolTable: SymbolTable;
    classTable: ClassTable;
};
export type SemanticResult = SemanticSuccess | SemanticFailure;
export declare function analyzeSemantics(statement: Statement, symbolTable?: SymbolTable, classTable?: ClassTable): SemanticResult;
//# sourceMappingURL=semantics.d.ts.map