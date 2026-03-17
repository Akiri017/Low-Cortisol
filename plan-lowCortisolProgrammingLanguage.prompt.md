## Plan: One-Week TS Compiler Front-End

Build a TypeScript compiler front-end core first (lexer, parser, semantics, explainability, tests), then add a medium web UI after core stability. This maximizes grading confidence under 3-4 hours/day while still targeting high-grade expansions (error recovery + math expressions), with control structures as stretch.

**Progress**
- Phase 0 language contract is finalized using Language Specifications.md (custom datatypes, assignment operator, delimiter, output keywords, and language name).
- Next active phase: Phase 1 lexer implementation (then parser, then semantics).
- Grammar policy locked: statement delimiter is mandatory (Java/C++-style). Missing delimiter is a syntax error, with optional phrase-level recovery in expansion phase.
- Execution order confirmed: start with Lexer, then Parser, then Semantic Analysis.

**Steps**
1. Phase 0 (Day 1): Project setup and language contract
    - Define custom language tokens and grammar contract in a short design doc aligned to rubric (2+ custom data types, assignment operator, delimiter, output keyword).
    -  Define canonical statement forms for v1 and v2:
        1. v1: declaration/assignment and output statement.
        2. v2: arithmetic expression in assignment and optional control structure (stretch).
    - Choose CLI execution path as initial interface and lock standard explainability message format for all phases.

2. Phase 1 (Days 1-2): Lexer + Explainability foundation
    - Implement token model and lexer with category detection for datatype, identifier, assign operator, literals, delimiter, keyword, unknown.
    - Add explainability logger that prints each recognized token and summary counts.
    - Add lexer tests for valid tokens, malformed tokens, and unknown token handling.
    - Gate to proceed: lexer passes all planned test cases and output formatting is readable and consistent.

3. Phase 2 (Days 2-3): Parser + structural diagnostics
    - Implement parser for baseline grammar:
    - assignment/declaration statement pattern.
    - output statement pattern.
    - Add parser explainability: show expected rule, actual token pattern, and precise missing/invalid piece.
    - Add parser tests for valid statements and syntax failures (missing delimiter, wrong token order).
    - Gate to proceed: parser accepts valid baseline statements and rejects malformed structures with clear reasoning.

4. Phase 3 (Days 3-4): Semantic analysis + symbol binding
    - Implement semantic type checks between declared datatype and literal/expression result.
    - Implement symbol table binding (name, type, width, level, offset) and redeclaration/update rules.
    - Add semantic explainability for type verification and binding actions.
    - Add semantic tests for valid bindings, type mismatch, undeclared usage (if output references symbol), and rebinding behavior.
    - Gate to proceed: full pipeline works for rubric sample-style cases and symbol table state is correct.

5. Phase 4 (Days 4-5): Creative expansion priority A and B
    - Implement math expressions in assignment with operator precedence for +, -, *, / and numeric type constraints.
    - Implement error recovery:
        1. phrase-level insertion for missing delimiter.
        2. panic-mode skip for invalid/unexpected token and continue where safe.
    - Extend explainability logs to explicitly announce chosen recovery strategy and recovery result.
    - Add focused tests for expression parsing and recovery scenarios.
    - Gate to proceed: at least 3 expansion scenarios run end-to-end with clear recovery narration.

6. Phase 5 (Days 5-6): Local web UI wrapper (post-core)
    - Build a medium UI that calls the same TS compiler core:
    - single input area for source line(s).
    - panels for lexical, syntax, semantic logs.
    - panel/table for current symbol table.
    - Keep architecture shared: UI must not duplicate compiler logic.
    - Add quick manual test checklist for UI rendering and result parity with CLI.

7. Phase 6 (Day 6-7): Stretch and submission hardening
    - Stretch: add a minimal control structure only if all required and priority expansions are stable.
    - Finalize demo cases:
        1. perfect valid case.
        2. semantic mismatch case.
        3. syntax/recovery case.
        4. expression case.
    - Final regression pass and packaging (README, run instructions, test commands).

**Relevant files**
- Existing specification source:
    1. c:/Users/Ianne/TN35_SANTOS_CS0035FINALPROJECT/CS0035 Programming Languages Final Project Specifications.md
    2. New implementation artifacts to be created in execution phase:
        - TypeScript compiler core modules (language definition, lexer, parser, semantic analyzer, symbol table, explainability formatter, entrypoint).
        - Automated tests for each compiler phase and end-to-end scenarios.
        - Local web UI files that consume shared compiler core.

**Verification**
1. Run unit tests per phase: lexer, parser, semantic analyzer.
2. Run integration tests for end-to-end statement compilation and symbol table updates.
3. Execute manual cases that mirror rubric examples plus expansion-specific edge cases.
4. Verify explainability output contains:
    - token-by-token classification.
    - parser rule matching details.
    - semantic type/binding narrative.
    - explicit recovery narration where triggered.
5. Confirm CLI and UI outputs are behaviorally consistent for the same input.

**Decisions**
- Chosen stack: full-stack TypeScript with CLI-first execution and web UI added after core stabilization.
- Included in committed scope: mandatory phases, explainability layer, symbol table, math expressions, error recovery.
- Conditional scope: control structures only after all above pass tests.
- Excluded from scope: deployment/cloud hosting, heavy visual polish, advanced OOP language features unless time remains.

**Further Considerations**
1. Language design freeze by end of Day 1 prevents cascading parser/semantic changes later.
2. Control structures should be implemented as a strict subset (single if form) if activated, not a broad grammar expansion.
3. If schedule slips, preserve high grade likelihood by prioritizing explainability quality and recovery robustness over extra syntax breadth.
