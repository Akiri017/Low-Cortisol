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

const TYPE_WIDTH: Record<DataTypeLexeme, number> = {
  decimal: 8,
  doubleDecimal: 16,
  letters: 64,
  letter: 1,
  int: 4,
  bool: 1,
};

export class SymbolTable {
  private readonly symbols = new Map<string, SymbolEntry>();
  private nextOffset = 0;

  get(name: string): SymbolEntry | undefined {
    return this.symbols.get(name);
  }

  entries(): SymbolEntry[] {
    return Array.from(this.symbols.values()).sort((a, b) => a.offset - b.offset);
  }

  bind(name: string, type: DataTypeLexeme, value: string, level = 0): { action: BindAction; entry: SymbolEntry } {
    const existing = this.symbols.get(name);
    if (existing) {
      const updated: SymbolEntry = { ...existing, value };
      this.symbols.set(name, updated);
      return { action: 'update', entry: updated };
    }

    const width = TYPE_WIDTH[type];
    const entry: SymbolEntry = {
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
