"use strict";
// Browser entry point for the Low Cortisol Compiler
// This exports the necessary functions for the web UI
Object.defineProperty(exports, "__esModule", { value: true });
exports.explainSemantics = exports.explainParse = exports.explainLex = exports.DiagnosticSeverity = exports.TokenType = exports.ClassTable = exports.SymbolTable = exports.analyzeSemantics = exports.parseProgram = exports.parse = exports.lex = void 0;
var lexer_1 = require("./lexer");
Object.defineProperty(exports, "lex", { enumerable: true, get: function () { return lexer_1.lex; } });
var parser_1 = require("./parser");
Object.defineProperty(exports, "parse", { enumerable: true, get: function () { return parser_1.parse; } });
Object.defineProperty(exports, "parseProgram", { enumerable: true, get: function () { return parser_1.parseProgram; } });
var semantics_1 = require("./semantics");
Object.defineProperty(exports, "analyzeSemantics", { enumerable: true, get: function () { return semantics_1.analyzeSemantics; } });
var symbolTable_1 = require("./symbolTable");
Object.defineProperty(exports, "SymbolTable", { enumerable: true, get: function () { return symbolTable_1.SymbolTable; } });
var classTable_1 = require("./classTable");
Object.defineProperty(exports, "ClassTable", { enumerable: true, get: function () { return classTable_1.ClassTable; } });
var token_1 = require("./token");
Object.defineProperty(exports, "TokenType", { enumerable: true, get: function () { return token_1.TokenType; } });
var diagnostics_1 = require("./diagnostics");
Object.defineProperty(exports, "DiagnosticSeverity", { enumerable: true, get: function () { return diagnostics_1.DiagnosticSeverity; } });
var explainability_1 = require("./explainability");
Object.defineProperty(exports, "explainLex", { enumerable: true, get: function () { return explainability_1.explainLex; } });
Object.defineProperty(exports, "explainParse", { enumerable: true, get: function () { return explainability_1.explainParse; } });
Object.defineProperty(exports, "explainSemantics", { enumerable: true, get: function () { return explainability_1.explainSemantics; } });
//# sourceMappingURL=browser.js.map