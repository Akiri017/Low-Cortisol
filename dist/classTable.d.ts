import type { DataTypeLexeme } from './language';
export type ClassFieldEntry = {
    name: string;
    type: DataTypeLexeme;
    width: number;
    level: number;
    offset: number;
    value: string;
};
export type ClassEntry = {
    name: string;
    fields: ClassFieldEntry[];
};
export declare class ClassTable {
    private readonly classes;
    get(name: string): ClassEntry | undefined;
    entries(): ClassEntry[];
    declareClass(name: string): {
        ok: true;
        entry: ClassEntry;
    } | {
        ok: false;
        message: string;
    };
    declareField(className: string, field: {
        name: string;
        type: DataTypeLexeme;
        value: string;
    }): {
        ok: true;
        entry: ClassFieldEntry;
    } | {
        ok: false;
        message: string;
    };
}
//# sourceMappingURL=classTable.d.ts.map