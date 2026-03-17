export const LANGUAGE_NAME = 'Low Cortisol Programming Language';

// Custom language contract (from Language Specifications.md)
export const DATA_TYPES = ['decimal', 'doubleDecimal', 'letters', 'letter', 'int', 'bool'] as const; // add other traditional datatypes like int
export type DataTypeLexeme = (typeof DATA_TYPES)[number];

export const OUTPUT_KEYWORDS = ['display', 'displayln', 'displayf'] as const;
export type OutputKeywordLexeme = (typeof OUTPUT_KEYWORDS)[number];

export const ASSIGN_OPERATOR = ':' as const;
export const STATEMENT_DELIMITER = '.' as const;
