import type { DataTypeLexeme } from './language';
export type SymbolEntry = {
    name: string;
    type: DataTypeLexeme;
    width: number;
    level: number;
    offset: number;
    value: string;
};
export type BindAction = 'declare' | 'update';
export declare class SymbolTable {
    private readonly symbols;
    private nextOffset;
    get(name: string): SymbolEntry | undefined;
    entries(): SymbolEntry[];
    bind(name: string, type: DataTypeLexeme, value: string, level?: number): {
        action: BindAction;
        entry: SymbolEntry;
    };
}
//# sourceMappingURL=symbolTable.d.ts.map