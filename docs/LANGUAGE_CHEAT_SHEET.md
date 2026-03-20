# Low Cortisol Programming Language - 1-Page Cheat Sheet

## 1. Language Identity
- **Language name:** Low Cortisol Programming Language
- **Assignment operator:** `:`
- **Statement delimiter:** `.`

## 2. Core Data Types
| Data Type | Meaning | Example |
| --- | --- | --- |
| `int` | Integer number | `int age : 20.` |
| `decimal` | Decimal number | `decimal price : 99.99.` |
| `doubleDecimal` | Higher-precision decimal number | `doubleDecimal pi : 3.14159265.` |
| `letters` | String/text value | `letters name : "Farmer".` |
| `letter` | Single character | `letter grade : 'A'.` |
| `bool` | Boolean value (`true`/`false`, also `1`/`0`) | `bool isReady : true.` |

## 3. Keywords and What They Mean
| Keyword | Category | Meaning |
| --- | --- | --- |
| `display` | Output | Prints a value (no automatic newline rule enforced by parser). |
| `displayln` | Output | Output keyword variant for line-style display. |
| `displayf` | Output | Output keyword variant for formatted-style display. |
| `if` | Control flow | Executes a block when a numeric comparison condition is true. |
| `while` | Control flow | Repeats a block while a numeric comparison condition is true. |
| `class` | OOP | Declares a class with typed fields. |

## 4. Valid Statement Patterns (Grammar Quick View)
1. **Variable declaration/assignment**  
   `DATATYPE IDENTIFIER : VALUE .`
2. **Output statement**  
   `display|displayln|displayf EXPR .`
3. **If statement**  
   `if EXPR COMPARE_OP EXPR { <statements> } .`
4. **While statement**  
   `while EXPR COMPARE_OP EXPR { <statements> } .`
5. **Class declaration**  
   `class IDENTIFIER { <field declarations> } .`

## 5. Operators and Symbols
| Symbol | Meaning |
| --- | --- |
| `:` | Assignment operator |
| `.` | End-of-statement delimiter |
| `{` `}` | Block delimiters (for `if`, `while`, `class`) |
| `+ - * /` | Arithmetic operators |
| `< <= > >= == !=` | Comparison operators |

## 6. Literal Rules
- **Numeric literal:** `123`, `45`, `99.99`
- **String literal:** `"hello"` or dollar-delimited like `$hello$` / `$$hello world$$`
- **Char literal:** `'A'` (single character), or `$A$`
- **Boolean literal (semantic level):** `true`, `false`, `1`, `0`

## 7. Type Compatibility Rules
1. `int`, `decimal`, `doubleDecimal` must receive numeric values/expressions.
2. `letters` must receive string values.
3. `letter` must receive a character value.
4. `bool` accepts `true`, `false`, `1`, or `0`.
5. Identifier assignment is allowed only when referenced variable type matches.

## 8. Quick Examples
```lowcortisol
int age : 20.
decimal total : 10.5 + 2 * 3.
letters player : "Abigail".
letter rank : 'S'.
bool planted : true.

displayln player.
display age + 1.

if age >= 18 {
  display "Adult".
}.

while age < 21 {
   int age : age + 1.
}.

class Crop {
  letters name : "Parsnip".
  int days : 4.
}.
```

## 9. Common Mistakes to Avoid
1. Using `=` instead of `:`
2. Forgetting the final `.` delimiter
3. Assigning wrong literal types (example: `int x : "hello".`)
4. Using undeclared identifiers in output or expressions
5. Missing `}` before the statement-ending `.` in block statements
