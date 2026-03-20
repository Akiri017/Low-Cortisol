# Low Cortisol Compiler - Web Frontend

A beautiful Stardew Valley-themed web interface for the Low Cortisol Programming Language compiler.

## 🚀 Quick Start

```bash
# Start the development server
npm start

# Open your browser
# Navigate to http://localhost:8000
```

## 🎨 Features

- **IDE View** - Write and edit Low Cortisol code
- **Lexer View** - Visualize tokens with detailed analysis
- **Parser/Semantics View** - See syntax validation and semantic analysis
- **Results View** - Complete compilation results with:
  - Step-by-step compilation logs
  - Symbol table with memory layout
  - Class table with field definitions
  - Semantic action tracking
  - Comprehensive diagnostics

## 🏗️ Architecture

This frontend uses **100% of your backend compiler**:

```
User Interface (HTML/CSS/JS)
        ↓
Frontend Logic (app.js)
        ↓
Compiler Bridge (compiler.js)
        ↓
Backend Bundle (compiler-bundle.js)
        ↓
Your TypeScript Compiler (src/*.ts)
```

No code duplication - the frontend is a pure UI layer!

## 🔧 How It Works

### Compilation Flow

1. **User writes code** in the IDE view
2. **Frontend calls** `compileSource()` from `compiler.js`
3. **Compiler bridge** uses your real backend:
   - `lex()` - Lexical analysis
   - `parse()` / `parseProgram()` - Syntax analysis
   - `analyzeSemantics()` - Semantic analysis
4. **Explainability functions** generate step-by-step logs:
   - `explainLex()` - Token recognition logs
   - `explainParse()` - Parsing logs
   - `explainSemantics()` - Type checking logs
5. **Results displayed** in all views with full details

### Backend Integration

All backend features are fully integrated:

✅ **Lexer Module** (`lexer.ts`)
- Token recognition
- Unknown token detection
- Diagnostic generation

✅ **Parser Module** (`parser.ts`)
- Multi-statement support
- Error recovery
- Pattern matching

✅ **Semantic Analyzer** (`semantics.ts`)
- Type checking
- Symbol table generation
- Class table generation
- Semantic action tracking

✅ **Explainability** (`explainability.ts`)
- Step-by-step compilation logs
- Three-phase explanation (lex, parse, semantics)

✅ **Data Structures**
- Symbol table with 6 fields (name, type, value, width, level, offset)
- Class table with field layouts
- Semantic actions array
- Complete diagnostics

## 📖 Language Syntax

```
# Variable declarations
int age : 20.
letters name : "Farmer".
decimal price : 99.99.
bool isRaining : 0.
letter grade : 'A'.

# Class declarations
class Crop {
  letters name : "Parsnip".
  int harvestDays : 4.
}.
```

## 🧪 Testing

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive test cases.

Quick test:
1. Click "Load Example" button
2. Click "Compile"
3. Navigate through tabs to see results
4. Check "Results" tab for:
   - Compilation logs
   - Symbol table
   - Class table (if classes declared)
   - Semantic actions

## 🔄 Rebuilding

When you modify the TypeScript compiler source:

```bash
# From project root
npm run build:browser
```

This will:
1. Compile TypeScript → JavaScript (`tsc`)
2. Bundle for browser → `compiler-bundle.js` (`esbuild`)

The frontend automatically uses the updated bundle!

## 📚 Documentation

- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - How to test all features
- **[INTEGRATION_FIXED.md](./INTEGRATION_FIXED.md)** - What was fixed and how integration works

## 🎯 What's Displayed

### Lexer View
- Token grid with icons
- Unknown tokens highlighted in red
- Lexical explanation logs
- Token count statistics
- Health status

### Parser/Semantics View
- Parse results per statement
- Valid/Invalid status with reasons
- Error recovery information
- Parse explanation logs
- Semantic validation status

### Results View
- **Compilation Logs** - Full trace of all compilation phases
- **Diagnostics** - Errors, warnings, and info messages
- **Symbol Table** - All variables with complete metadata
- **Class Table** - Class declarations with field layouts
- **Semantic Actions** - Type checks, bindings, declarations

## 🌾 Theme

Beautiful Stardew Valley-inspired design with:
- Rustic earth tones (browns, greens, blues)
- Custom Material Design color palette
- Responsive layout
- Smooth animations
- Themed icons and components

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS (Tailwind), Vanilla JavaScript
- **Backend**: TypeScript compiler (bundled with esbuild)
- **Server**: Node.js (development)
- **Fonts**: Plus Jakarta Sans, Be Vietnam Pro, Space Grotesk
- **Icons**: Material Symbols

## 📦 Files

```
stitch_low_cortisol_frontend/
├── index.html              # Main UI
├── app.js                  # Frontend logic
├── compiler.js             # Compiler bridge
├── compiler-bundle.js      # Backend bundle (generated)
├── server.js               # Dev server
├── package.json            # NPM scripts
└── README.md               # This file
```

## ✅ Integration Status

**Backend-Frontend Integration: COMPLETE** ✅

All backend features are now available in the frontend:
- ✅ Lexical analysis with explanation
- ✅ Syntax analysis with explanation
- ✅ Semantic analysis with explanation
- ✅ Complete symbol table (6 fields)
- ✅ Class table with fields
- ✅ Semantic action tracking
- ✅ Comprehensive diagnostics
- ✅ Error recovery information
- ✅ Memory layout details

No code duplication - frontend uses 100% of the backend compiler!

---

**Happy Compiling! 🌾**
