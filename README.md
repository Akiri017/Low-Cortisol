# Low Cortisol Programming Language Compiler

A compiler for the Low Cortisol Programming Language with full TypeScript implementation and beautiful web interface.

## 📚 Project Structure

```
TN35_SANTOS_CS0035FINALPROJECT/
├── src/                          # TypeScript compiler source
│   ├── lexer.ts                  # Lexical analyzer
│   ├── parser.ts                 # Syntax analyzer
│   ├── semantics.ts              # Semantic analyzer
│   ├── explainability.ts         # Step-by-step explanation
│   ├── symbolTable.ts            # Symbol table
│   ├── classTable.ts             # Class table
│   └── ...                       # Other modules
├── dist/                         # Compiled JavaScript
├── docs/                         # Project documentation
│   ├── CS0035 Programming Languages Final Project Specifications.md
│   ├── Language Specifications.md
│   └── plan-lowCortisolProgrammingLanguage.prompt.md
├── stitch_low_cortisol_frontend/ # Web UI
│   ├── index.html                # Single-page web application
│   ├── app.js                    # Frontend logic
│   ├── compiler.js               # Compiler bridge
│   ├── compiler-bundle.js        # Backend bundle
│   └── README.md                 # Frontend documentation
└── BACKEND_FRONTEND_INTEGRATION_SUMMARY.md
```

## 🚀 Quick Start

### Backend Compiler
```bash
# Build the compiler
npm run build

# Run tests
npm test
```

### Frontend Web UI
```bash
# Build browser bundle
npm run build:browser

# Start web server
cd stitch_low_cortisol_frontend
npm start

# Open http://localhost:8000
```

## 📖 Language Overview

Low Cortisol is a simple, type-safe programming language with:

**Data Types:**
- `int` - Integer numbers
- `decimal` - Single-precision decimals
- `doubleDecimal` - Double-precision decimals
- `letters` - Strings
- `letter` - Single character
- `bool` - Boolean (true/false or 0/1)

**Syntax:**
```
# Variable declarations
int age : 20.
letters name : "Farmer".
decimal price : 99.99.

# Class declarations
class Crop {
  letters name : "Parsnip".
  int harvestDays : 4.
}.

# Output
display "Hello World!".
displayln age.
```

See [Language Specifications](./docs/Language%20Specifications.md) for full details.

## 🏗️ Architecture

### Backend Compiler (TypeScript)
```
Source Code
    ↓
Lexer (lexer.ts)
    ↓
Parser (parser.ts)
    ↓
Semantic Analyzer (semantics.ts)
    ↓
Symbol Table + Class Table
    ↓
Explainability (explainability.ts)
```

### Frontend Integration
```
Web UI (HTML/CSS/JS)
    ↓
Compiler Bridge (compiler.js)
    ↓
Backend Bundle (compiler-bundle.js)
    ↓
TypeScript Compiler Core
```

**No code duplication** - frontend uses 100% of backend!

## ✨ Features

### Compiler Features
- ✅ **Lexical Analysis**
  - Token recognition
  - Unknown token detection
  - Position tracking

- ✅ **Syntax Analysis**
  - Multi-statement parsing
  - Error recovery (phrase-level & panic-mode)
  - Pattern matching

- ✅ **Semantic Analysis**
  - Type checking
  - Symbol table generation
  - Class table generation
  - Memory layout (width, offset)

- ✅ **Explainability**
  - Step-by-step compilation logs
  - Three-phase explanation (lex, parse, semantics)

### Web UI Features
- ✅ Beautiful Stardew Valley-themed interface
- ✅ Real-time compilation feedback
- ✅ Interactive token visualization
- ✅ Complete symbol table display
- ✅ Class table with field layouts
- ✅ Semantic action tracking
- ✅ Comprehensive diagnostics

## 📚 Documentation

- **Project Specs:** [docs/CS0035 Programming Languages Final Project Specifications.md](./docs/CS0035%20Programming%20Languages%20Final%20Project%20Specifications.md)
- **Language Specs:** [docs/Language Specifications.md](./docs/Language%20Specifications.md)
- **Integration Details:** [BACKEND_FRONTEND_INTEGRATION_SUMMARY.md](./BACKEND_FRONTEND_INTEGRATION_SUMMARY.md)
- **Frontend Docs:** [stitch_low_cortisol_frontend/README.md](./stitch_low_cortisol_frontend/README.md)

## 🧪 Testing

Frontend testing guide: [stitch_low_cortisol_frontend/TESTING_GUIDE.md](./stitch_low_cortisol_frontend/TESTING_GUIDE.md)

## 🎯 Project Status

- ✅ Phase 0: Language contract
- ✅ Phase 1: Lexer implementation
- ✅ Phase 2: Parser implementation
- ✅ Phase 3: Semantic analysis
- ✅ Phase 4: Creative expansions (explainability, classes)
- ✅ Phase 5: Web UI implementation
- ✅ Backend-Frontend integration (complete)

## 🛠️ Tech Stack

**Backend:**
- TypeScript 5.9.3
- Vitest (testing)
- ESBuild (bundling)

**Frontend:**
- HTML5, CSS (Tailwind)
- Vanilla JavaScript
- Material Design Icons
- Stardew Valley theme

## 📦 NPM Scripts

```bash
npm run build           # Compile TypeScript → JavaScript
npm run build:browser   # Build browser bundle
npm run lint            # Type checking
npm run test            # Run tests
npm run test:watch      # Watch mode
```

## 🌾 Credits

Low Cortisol Programming Language Compiler - CS0035 Final Project

---

**Happy Compiling! 🎉**
