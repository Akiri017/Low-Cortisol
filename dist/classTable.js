"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassTable = void 0;
const TYPE_WIDTH = {
    decimal: 8,
    doubleDecimal: 16,
    letters: 64,
    letter: 1,
    int: 4,
    bool: 1
};
class ClassTable {
    constructor() {
        this.classes = new Map();
    }
    get(name) {
        return this.classes.get(name);
    }
    entries() {
        return Array.from(this.classes.values()).sort((a, b) => a.name.localeCompare(b.name));
    }
    declareClass(name) {
        const existing = this.classes.get(name);
        if (existing)
            return { ok: false, message: `Class '${name}' is already declared.` };
        const entry = { name, fields: [] };
        this.classes.set(name, entry);
        return { ok: true, entry };
    }
    declareField(className, field) {
        const cls = this.classes.get(className);
        if (!cls)
            return { ok: false, message: `Class '${className}' is not declared.` };
        if (cls.fields.some((f) => f.name === field.name)) {
            return { ok: false, message: `Duplicate field '${field.name}' in class '${className}'.` };
        }
        const width = TYPE_WIDTH[field.type];
        const offset = cls.fields.reduce((sum, f) => sum + f.width, 0);
        const entry = {
            name: field.name,
            type: field.type,
            width,
            offset,
            value: field.value,
        };
        cls.fields.push(entry);
        return { ok: true, entry };
    }
}
exports.ClassTable = ClassTable;
//# sourceMappingURL=classTable.js.map