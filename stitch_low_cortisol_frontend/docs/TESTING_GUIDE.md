# Quick Testing Guide - Backend Integration

## Server Running ✅
The frontend server is now running at: **http://localhost:8000**

## Test Cases

### Test 1: Basic Variable Declarations
**Input:**
```
int age : 20.
letters name : "Farmer".
decimal price : 99.99.
```

**What to Check:**
1. Go to **Lexer** tab - Should show 12+ tokens with correct types
2. Go to **Parser/Semantics** tab - Should show 3 valid statements
3. Go to **Results** tab and verify:
   - ✅ "Compilation Logs" section shows step-by-step lexer, parser, and semantic logs
   - ✅ "Symbol Table" shows 3 variables with name, type, value, width, level, and offset
   - ✅ "Semantic Actions" shows bind operations for each variable

### Test 2: Class Declaration
**Input:**
```
class Crop {
  letters name : "Parsnip".
  int harvestDays : 4.
}.
```

**What to Check:**
1. **Results** tab:
   - ✅ "Class Table" section appears and shows "Crop" class
   - ✅ Shows 2 fields: "name" and "harvestDays"
   - ✅ Each field displays type, width, and offset

### Test 3: Type Error
**Input:**
```
int age : "this is text not a number".
```

**What to Check:**
1. **Results** tab:
   - ✅ Shows error in Diagnostics panel
   - ✅ Compilation logs show the type mismatch error
   - ✅ Error severity is "Error"

### Test 4: Unknown Tokens
**Input:**
```
int age : 20.
@#$ invalid tokens.
```

**What to Check:**
1. **Lexer** tab:
   - ✅ Unknown tokens appear with red error styling
   - ✅ "Lexical Status" shows issues count
2. **Results** tab:
   - ✅ Diagnostics show lexical errors

### Test 5: Multiple Statements
**Input:**
```
int count : 15.
letters season : "Spring".
decimal temp : 72.5.
bool sunny : 1.
```

**What to Check:**
1. **Parser/Semantics** tab - Shows 4 valid statements
2. **Results** tab:
   - ✅ Symbol table has 4 entries
   - ✅ Each has unique offset values
   - ✅ Compilation logs show analysis for all 4 statements

## Key Features to Verify

### Compilation Logs (New!)
- Located in Results tab, left column
- Shows three sections:
  1. Lexical analysis (token recognition)
  2. Syntax analysis (parsing)
  3. Semantic analysis (type checking)
- Color coded: Headers (blue), Errors (red), Complete (green)

### Enhanced Symbol Table
- Now shows 6 columns: Name, Type, Value, Width, Level, Offset
- Memory layout information is visible
- Previously missing columns now displayed

### Class Table (New!)
- Located in Results tab, right column
- Shows class name with icon
- Lists all fields with their metadata
- Shows field types, widths, and offsets

### Semantic Actions (New!)
- Located in Results tab, below class table
- Shows step-by-step semantic analysis actions
- Icons indicate action type (typeCheck, bind, bindClass, bindField)

### Lexer Enhancements
- Unknown tokens highlighted in red
- Better token type display (uses actual enum values)
- Explanation logs shown at bottom of token grid

### Parser Enhancements
- Parse explanation logs shown for each statement
- Recovery actions displayed when parser fixes errors

## Expected Output Example

When you compile `int age : 20.`:

**Compilation Logs should show:**
```
--- STARTING LEXICAL ANALYSIS ---
[LEXER] Found 'int' -> Identified as DATATYPE
[LEXER] Found 'age' -> Identified as IDENTIFIER
[LEXER] Found ':' -> Identified as ASSIGN_OPERATOR
[LEXER] Found '20' -> Identified as NUMERIC_LITERAL
[LEXER] Found '.' -> Identified as DELIMITER
...
--- STARTING SYNTAX ANALYSIS ---
[PARSER] Checking statement structure...
[PARSER] Expected rule: DataType Identifier : Literal .
[PARSER] Actual structure: DATATYPE IDENTIFIER ASSIGN_OPERATOR NUMERIC_LITERAL DELIMITER
[PARSER] Actual structure matches expected rule.
Syntax Analysis Complete. No structural errors.
--- STARTING SEMANTIC ANALYSIS ---
[SEMANTICS] Checking Type Compatibility...
[SEMANTICS] int requires Numeric value; found Numeric.
[SEMANTICS] Type check passed.
[SEMANTICS] Binding variable 'age' into Symbol Table (type=int, offset=0).
Semantic Analysis Complete.
```

**Symbol Table should show:**
| Symbol Name | Type | Value | Width | Level | Offset |
|-------------|------|-------|-------|-------|--------|
| age         | int  | 20    | 4     | 0     | 0      |

**Semantic Actions should show:**
- ✅ Type check passed for 'age'
- ✅ Declared variable 'age' (type: int)

## All Backend Features Now Available ✅

1. ✅ **Lexical Analysis** with explainability
2. ✅ **Syntax Analysis** with explainability
3. ✅ **Semantic Analysis** with explainability
4. ✅ **Complete Symbol Table** (all fields)
5. ✅ **Class Table** (full support)
6. ✅ **Semantic Action Tracing**
7. ✅ **Comprehensive Diagnostics**
8. ✅ **Token Counts** and metadata
9. ✅ **Error Recovery** information
10. ✅ **Memory Layout** information (width, offset)

The frontend now uses **100% of your backend compiler functionality**!

## Phase 6 Validation And Parity Verification

### Automated checks

Run these from project root:

```bash
npm test
npm run build:browser
```

Coverage target for parity file: `tests/phase6.parity.test.ts`

- Valid representative program
- Syntax-issue representative program
- Semantic-mismatch representative program
- Expression-heavy representative program

### Bundle contract verification

Verify the frontend still compiles through the same bridge contract:

1. `stitch_low_cortisol_frontend/app.js` still calls `compileSource` from `compiler.js`
2. `stitch_low_cortisol_frontend/compiler.js` still returns the same top-level shape:
   - `lexResult`
   - `lexExplanation`
   - `parseResults`
   - `parseExplanations`
   - `semanticResults`
   - `semanticExplanations`
   - `symbolTables`
   - `classTables`
   - `hasErrors`

### Manual frontend checks (animation and responsiveness)

1. Start frontend server and compile once on each view flow (IDE -> Lexer -> Parser/Semantics -> Results).
2. Confirm moderate motion behavior:
   - View entry transitions
   - Panel refresh transitions
   - Status/progress transitions
3. Enable reduced-motion in OS/browser and re-check:
   - Content remains complete and readable
   - No blocked interactions
4. Check desktop and mobile widths for layout stability.

### Representative sources for parity spot-check

```txt
VALID
int age:20.
letters season:$Spring$.

SYNTAX ISSUE
decimal : x 12.

SEMANTIC MISMATCH
decimal amount:$text$.

EXPRESSION HEAVY
decimal total:2+3*4-5/5.
```
