You will build the "Front-End" of a compiler for your language, covering:

* **Lexical Analysis:** Recognizing your custom vocabulary.  
* **Syntax Analysis:** Enforcing your custom grammar rules.  
* **Semantic Analysis:** Validating variable bindings and data types.  
* **The Explainability Layer:** Your compiler must actively "talk" to the user, explaining exactly what it is thinking at each step of the compilation process.

**SPECIFICATIONS:**

**Phase 1: The Language Specification (Design Time)**

Before writing the compiler, you must invent the language. Your language must include:

* Custom Data Types: At least 2 (e.g., instead of int and string, maybe num and text, or zolt and blarp).  
* Custom Assignment Operator: (e.g., instead of \=, maybe \~ or \-\>).  
* Custom Delimiter: (e.g., instead of ;, maybe . or \!).  
* Custom Output Keyword: (e.g., instead of print, maybe shout or display).

**Phase 2: The Compiler Implementation**

Your program must accept a single line of code written in your new language. It will run it through the three phases.

**Step 1: The Lexer (Lexical Analysis)**

* **Action:** Break the string into tokens and identify them based on your custom rules.  
* **Explainability Layer:** The program must print each token it finds and what category it belongs to.

**Step 2: The Parser (Syntax Analysis)**

* **Action:** Check if the sequence of tokens forms a valid statement (e.g., DataType \-\> Identifier \-\> Operator \-\> Literal \-\> Delimiter).  
* **Explainability Layer:** The program must print the grammar rule it is trying to match, and state whether the structure is valid or missing a piece.

**Step 3: The Semantic Analyzer (Name, Scope, & Binding)**

* **Action:**  
  * 1\. Check if the value matches the data type (e.g., if type is num, the value cannot be "Hello").  
  * 2\. "Bind" the variable by saving its Name, Type, and Value into a Symbol Table.  
* **Explainability Layer:** The program must explicitly state that it is checking types, and then announce that it is binding the variable into memory.

**Optional Phase: Going Beyond the Minimum (Creative Expansion)**  
**To achieve the highest grades (and compete for the top spots), you are encouraged to add advanced features based on past and future discussions. Examples include:**

* **Error Handling & Recovery Strategies:** If the user forgets a delimiter, implement Phrase-Level Recovery to insert it. If there’s an invalid token, use Panic Mode Recovery to skip it and continue parsing. Make your Explainability Layer report these strategies\!  
* **Control Structures:** Add syntax and parsing for if statements or while loops.  
* **Object-Oriented Concepts:** Introduce a basic class declaration or object instantiation rule.  
* **Mathematical Expressions:** Allow the parser to handle age \~ 10 \+ 5\. instead of just direct assignment.

**Sample Execution & The "Explainability Layer"**

**digit \=** integer data type

**\~ \=** assignment operator

**. \=** end of statement delimiter

**Test Case 1: The Perfect Code**  
**Input Code: digit age \~ 20\.**

**Output:**  
\--- STARTING LEXICAL ANALYSIS \---  
\[LEXER\] Found 'digit' \-\> Identified as DATATYPE  
\[LEXER\] Found 'age'   \-\> Identified as IDENTIFIER  
\[LEXER\] Found '\~'     \-\> Identified as ASSIGN\_OPERATOR  
\[LEXER\] Found '20'    \-\> Identified as NUMERIC\_LITERAL  
\[LEXER\] Found '.'     \-\> Identified as DELIMITER  
✓ Lexical Analysis Complete. 0 Unknown Tokens.

\--- STARTING SYNTAX ANALYSIS \---  
\[PARSER\] Checking statement structure...  
\[PARSER\] Expected rule: \[DATATYPE\] \[ID\] \[ASSIGN\] \[LITERAL\] \[DELIM\]  
\[PARSER\] Actual structure matches expected rule perfectly.  
✓ Syntax Analysis Complete. No structural errors.

\--- STARTING SEMANTIC ANALYSIS \---  
\[SEMANTICS\] Checking Type Compatibility...  
\[SEMANTICS\] Variable 'age' is declared as 'digit'. Value is '20' (Numeric).  
\[SEMANTICS\] Types match. No coercion needed.  
\[SEMANTICS\] Binding variable 'age' to Symbol Table.  
✓ Semantic Analysis Complete.

**Test Case 2: The Semantic Error (Type Mismatch)**  
**Input Code: digit age \~ "Twenty".**

**Output:**  
\--- STARTING LEXICAL ANALYSIS \---  
\[LEXER\] Found 'digit'    \-\> Identified as DATATYPE  
\[LEXER\] Found 'age'      \-\> Identified as IDENTIFIER  
\[LEXER\] Found '\~'        \-\> Identified as ASSIGN\_OPERATOR  
\[LEXER\] Found '"Twenty"' \-\> Identified as STRING\_LITERAL  
\[LEXER\] Found '.'        \-\> Identified as DELIMITER  
✓ Lexical Analysis Complete.

\--- STARTING SYNTAX ANALYSIS \---  
\[PARSER\] Checking statement structure...  
\[PARSER\] Expected rule: \[DATATYPE\] \[ID\] \[ASSIGN\] \[LITERAL\] \[DELIM\]  
✓ Syntax Analysis Complete. Structure is valid.

\--- STARTING SEMANTIC ANALYSIS \---  
\[SEMANTICS\] Checking Type Compatibility...  
\[SEMANTICS\] FATAL ERROR: Variable 'age' is declared as 'digit', but value '"Twenty"' is a STRING.  
\[SEMANTICS\] Recovery Strategy: Compiler will discard assignment to prevent memory corruption.

| GRADING RUBRICS \- FINAL PROJECT CS0035 |  |  |  |  |
| ----- | :---- | :---- | :---- | :---- |
| **Category** | **Excellent (100%)** | **Satisfactory (80%)** | **Needs Improvement (50%)** | **Points** |
| **Lexical & Syntax Analysis (30 pts)** | Flawlessly tokenizes input and accurately checks grammar rules based on the custom language. | Tokenizes correctly but has minor bugs in grammar validation. | Struggles to tokenize or fails to validate basic syntax structure. | / 30 |
| **Semantic Analysis & Binding (30 pts)** | Accurately catches type mismatches and successfully binds valid variables to a Symbol Table. | Checks types but Symbol Table implementation is flawed or missing. | Does not check for logical/type errors; accepts invalid bindings. | / 30 |
| **The Explainability Layer (30 pts)** | Console output is beautifully formatted, clear, and explains exactly what the compiler is doing at every step. | Output exists but is difficult to read or skips major steps in the explanation. | Minimal output. Does not adequately explain the compiler's thought process. | / 30 |
| **Video Demonstration  (10 pts)** | Clear, confident presentation within the 5-minute limit. Code execution is perfectly demonstrated. | Video is slightly over time or the explanation is a bit unclear, but code runs. | No video submitted, or video fails to demonstrate the working program. | / 10 |

