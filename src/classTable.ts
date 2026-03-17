import type { DataTypeLexeme } from './language';

export type ClassFieldEntry = {
  name: string;
  type: DataTypeLexeme;
  width: number;
  offset: number;
  value: string;
};

export type ClassEntry = {
  name: string;
  fields: ClassFieldEntry[];
};

const TYPE_WIDTH: Record<DataTypeLexeme, number> = {
  decimal: 8,
  doubleDecimal: 16,
  letters: 64,
  letter: 1,
  int: 4,
  bool: 1
};

export class ClassTable {
  private readonly classes = new Map<string, ClassEntry>();

  get(name: string): ClassEntry | undefined {
    return this.classes.get(name);
  }

  entries(): ClassEntry[] {
    return Array.from(this.classes.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  declareClass(name: string): { ok: true; entry: ClassEntry } | { ok: false; message: string } {
    const existing = this.classes.get(name);
    if (existing) return { ok: false, message: `Class '${name}' is already declared.` };

    const entry: ClassEntry = { name, fields: [] };
    this.classes.set(name, entry);
    return { ok: true, entry };
  }

  declareField(
    className: string,
    field: { name: string; type: DataTypeLexeme; value: string },
  ): { ok: true; entry: ClassFieldEntry } | { ok: false; message: string } {
    const cls = this.classes.get(className);
    if (!cls) return { ok: false, message: `Class '${className}' is not declared.` };

    if (cls.fields.some((f) => f.name === field.name)) {
      return { ok: false, message: `Duplicate field '${field.name}' in class '${className}'.` };
    }

    const width = TYPE_WIDTH[field.type];
    const offset = cls.fields.reduce((sum, f) => sum + f.width, 0);
    const entry: ClassFieldEntry = {
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
