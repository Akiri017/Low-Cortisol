"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const explainability_1 = require("./explainability");
const lexer_1 = require("./lexer");
const parser_1 = require("./parser");
const semantics_1 = require("./semantics");
const fs = __importStar(require("node:fs"));
function readCliInput(argv) {
    const args = argv.slice(2);
    if (args.length === 0)
        return null;
    const first = args[0];
    if (first === '--file' || first === '-f') {
        const path = args[1];
        if (!path)
            return null;
        const source = fs.readFileSync(path, 'utf8');
        return { kind: 'file', path, source };
    }
    if (first === '--stdin') {
        // Read entire stdin as UTF-8. This avoids shell escaping issues.
        const source = fs.readFileSync(0, 'utf8');
        return { kind: 'stdin', source };
    }
    const source = args.join(' ');
    return { kind: 'inline', source };
}
function printUsage() {
    // eslint-disable-next-line no-console
    console.error('Usage:');
    // eslint-disable-next-line no-console
    console.error('  node dist/cli.js "<single line of Low Cortisol code>"');
    // eslint-disable-next-line no-console
    console.error('  node dist/cli.js --file <path>');
    // eslint-disable-next-line no-console
    console.error('  <program> | node dist/cli.js --stdin');
}
function main() {
    const input = readCliInput(process.argv);
    if (!input) {
        printUsage();
        process.exitCode = 1;
        return;
    }
    const source = input.source.trimEnd();
    if (source.length === 0) {
        printUsage();
        process.exitCode = 1;
        return;
    }
    const result = (0, lexer_1.lex)(source);
    const lines = (0, explainability_1.explainLex)(result);
    // eslint-disable-next-line no-console
    console.log(lines.join('\n'));
    const parseResult = (0, parser_1.parse)(result.tokens);
    // eslint-disable-next-line no-console
    console.log('\n' + (0, explainability_1.explainParse)(parseResult).join('\n'));
    if (parseResult.ok) {
        const semResult = (0, semantics_1.analyzeSemantics)(parseResult.statement);
        // eslint-disable-next-line no-console
        console.log('\n' + (0, explainability_1.explainSemantics)(semResult).join('\n'));
        if (!semResult.ok && semResult.diagnostics.length > 0) {
            // eslint-disable-next-line no-console
            console.log('\nSemantic Diagnostics:');
            for (const d of semResult.diagnostics) {
                // eslint-disable-next-line no-console
                console.log(`- (${d.severity}) ${d.message} [${d.start}, ${d.end})`);
            }
        }
    }
    if (result.diagnostics.length > 0) {
        // eslint-disable-next-line no-console
        console.log('\nDiagnostics:');
        for (const d of result.diagnostics) {
            // eslint-disable-next-line no-console
            console.log(`- (${d.severity}) ${d.message} [${d.start}, ${d.end})`);
        }
    }
    if (!parseResult.ok && parseResult.diagnostics.length > 0) {
        // eslint-disable-next-line no-console
        console.log('\nParser Diagnostics:');
        for (const d of parseResult.diagnostics) {
            // eslint-disable-next-line no-console
            console.log(`- (${d.severity}) ${d.message} [${d.start}, ${d.end})`);
        }
    }
}
main();
//# sourceMappingURL=cli.js.map