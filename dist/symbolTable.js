"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolTable = void 0;
const TYPE_WIDTH = {
    decimal: 8,
    doubleDecimal: 16,
    letters: 64,
    letter: 1,
    int: 4,
    bool: 1,
};
class SymbolTable {
    constructor() {
        this.symbols = new Map();
        this.nextOffset = 0;
    }
    get(name) {
        return this.symbols.get(name);
    }
    entries() {
        return Array.from(this.symbols.values()).sort((a, b) => a.offset - b.offset);
    }
    bind(name, type, value, level = 0) {
        const existing = this.symbols.get(name);
        if (existing) {
            const updated = { ...existing, value };
            this.symbols.set(name, updated);
            return { action: 'update', entry: updated };
        }
        const width = TYPE_WIDTH[type];
        const entry = {
            name,
            type,
            width,
            level,
            offset: this.nextOffset,
            value,
        };
        this.nextOffset += width;
        this.symbols.set(name, entry);
        return { action: 'declare', entry };
    }
}
exports.SymbolTable = SymbolTable;
//# sourceMappingURL=symbolTable.js.map