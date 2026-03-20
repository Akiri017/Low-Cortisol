## Plan: Stardew Enhanced Medium UI

Enhance the existing medium web UI in place by adding a stronger Stardew Valley visual layer and moderate motion system, while keeping compiler integration shared and stable. The implementation is frontend-first in stitch_low_cortisol_frontend, reuses existing compile pipeline, and introduces reusable design tokens, motion rules, and view-level interaction upgrades.

**Steps**
1. Phase 1: UI contract freeze and motion language
- Define enhancement boundaries for in-place redesign only.
- Keep existing compile entrypoint and output shape from app.js compile and update view functions.
- Establish motion language for moderate intensity:
  - Staggered reveal for cards and rows.
  - Status and progress transitions for compile lifecycle.
  - Panel refresh transitions on result updates.
- Add accessibility and performance constraints:
  - Respect prefers-reduced-motion.
  - Use transform and opacity transitions first.
  - Cap concurrent animated elements per render cycle.

2. Phase 2: Design tokenization and Stardew visual upgrade foundation
- Expand and normalize visual tokens in index.html Tailwind config and CSS custom properties:
  - Wood, parchment, meadow green, lake blue, ember error, neutral text scales.
  - Shared shadow tiers and texture classes.
- Standardize typography roles for heading, body, technical labels.
- Build reusable utility class patterns for card shells, status badges, ribbons, panel headers, and table rows.
- Keep current 4-view layout and nav structure, but improve hierarchy and readability with consistent spacing and section balance.

3. Phase 3: View-by-view enhancement rollout (parallelizable after Phase 2)
- IDE view enhancement:
  - Improve editor panel atmosphere and compile call-to-action prominence.
  - Add subtle compile-state motion and diagnostics transition cues.
- Lexer view enhancement:
  - Add staggered token card entry and token health feedback transitions.
  - Improve lexical metadata panel readability and visual grouping.
- Parser/Semantics view enhancement:
  - Add structured animation for validation states and semantic progress bars.
  - Improve grammar and semantic explanation card hierarchy.
- Results view enhancement:
  - Add symbol/class row reveal and update highlight transitions.
  - Improve success banner and summary card readability without overwhelming visual noise.

4. Phase 4: App.js interaction updates (depends on Phase 3)
- Add centralized animation hooks in app.js for:
  - View switch transitions in switchView.
  - Post-compile staged rendering transitions in updateLexerView, updateParserView, updateResultsView.
- Add lightweight lifecycle state classes:
  - compiling, success, warning, error visual states.
- Preserve existing data mapping and compiler calls; only adjust rendering order and class application.
- Add graceful fallback behavior when motion is disabled.

5. Phase 5: UX flow refinements (allowed by decision, depends on Phase 4)
- Improve compile feedback loop:
  - Immediate compile-start feedback.
  - Clear completion state and error emphasis handoff.
- Improve cross-view continuity:
  - Maintain user orientation when switching between IDE, Lexer, Parser/Semantics, and Results.
- Tune spacing and section ordering where needed to reduce cognitive load during debugging.

6. Phase 6: Validation and parity verification
- Confirm output parity with current behavior for representative sources (valid, syntax issue, semantic mismatch, expression-heavy input).
- Verify no change to compiler-core logic and bundle contract.
- Run frontend manual checks for animation smoothness, responsiveness, and reduced-motion support.
- Run project tests and browser bundle rebuild to ensure integration stability.

**Relevant files**
- c:/Users/Ianne/TN35_SANTOS_CS0035FINALPROJECT/stitch_low_cortisol_frontend/index.html — token system expansion, visual component classes, keyframes, reduced-motion rules, section structure refinements.
- c:/Users/Ianne/TN35_SANTOS_CS0035FINALPROJECT/stitch_low_cortisol_frontend/app.js — transition orchestration in switchView, compile lifecycle states, staged updates in updateLexerView/updateParserView/updateResultsView.
- c:/Users/Ianne/TN35_SANTOS_CS0035FINALPROJECT/stitch_low_cortisol_frontend/docs/TESTING_GUIDE.md — add manual test checklist for animation behavior and CLI parity checks.
- c:/Users/Ianne/TN35_SANTOS_CS0035FINALPROJECT/stitch_low_cortisol_frontend/docs/README.md — document enhanced UI behavior, accessibility notes, and run/validation flow.
- c:/Users/Ianne/TN35_SANTOS_CS0035FINALPROJECT/stitch_low_cortisol_frontend/pelican_town_rustic/DESIGN.md — align new visuals with existing Stardew design intent and formalize motion language.

**Verification**
1. Rebuild browser bundle and run frontend server, then execute baseline compile scenarios to confirm unchanged compiler outcomes.
2. Validate each view for moderate motion behavior:
- Entry transitions.
- Panel refresh transitions.
- Status/progress transitions.
3. Validate reduced-motion mode using OS/browser setting and ensure content remains readable and complete without motion.
4. Compare key outputs in IDE, Lexer, Parser/Semantics, and Results against pre-enhancement behavior for parity.
5. Check mobile and desktop viewport behavior for layout stability and animation performance.

**Decisions**
- Scope includes in-place medium UI enhancement only (no separate route/page).
- Animation depth is moderate, focused on readability-first motion.
- Compiler contract remains shared and stable; small UX flow tweaks are permitted in frontend presentation.
- Out of scope: compiler core feature additions, backend API changes, and heavy cinematic animation.

**Further Considerations**
1. If motion causes readability drop in dense result panels, prefer reducing stagger count before reducing color richness.
2. If performance drops on lower-end devices, disable non-essential decorative glow effects first.
3. Consider adding a future toggle for Enhanced Visual Effects level after baseline enhancement is stable.
