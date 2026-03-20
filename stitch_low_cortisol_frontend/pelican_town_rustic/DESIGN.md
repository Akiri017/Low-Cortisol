# The Design System: Editorial Rusticism

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Hearth"**

This design system reimagines the nostalgic, pixelated charm of retro RPGs through a high-end editorial lens. We are moving away from the "flatness" of modern SaaS and instead embracing **Organic Maximalism**. The goal is to create a digital space that feels like a well-worn leather journal or a sun-drenched potting shed. 

We break the "template" look by using intentional asymmetry—heavy top-weighted headers, overlapping "wooden" containers, and typography that breathes with massive scale shifts. By blending the precision of *Plus Jakarta Sans* with the warmth of the earth-tone palette, we create an experience that is both whimsically cozy and professionally authoritative.

---

## 2. Colors: Tonal Depth & Organic Transitions
Our palette is rooted in the earth, using `primary` browns and `secondary` greens to anchor the user in a rustic environment.

- **The "No-Line" Rule:** Under no circumstances shall a `1px` solid border be used to define sections. Boundaries are established through background shifts. A `surface-container-low` (#faf0d3) section should sit directly on a `surface` (#fff6dd) background. Use the `spacing-12` (4rem) to let the color change act as the separator.
- **Surface Hierarchy & Nesting:** Treat the UI as stacked materials. 
    - **Base:** `surface` (#fff6dd) - The "Paper."
    - **In-set Content:** `surface-container` (#f2e8c9) - The "Tabletop."
    - **Floating Elements:** `surface-bright` - The "Raised Slate."
- **The "Glass & Gradient" Rule:** To elevate the "Retro" feel into "Premium," use semi-transparent overlays for modals. Use `surface` at 80% opacity with a `20px` backdrop-blur to create a "Frosted Sap" effect.
- **Signature Textures:** For primary CTAs, do not use flat hex codes. Apply a subtle linear gradient from `primary` (#7d5231) to `primary_dim` (#6f4626) at a 135-degree angle to mimic the natural grain of polished timber.

---

## 3. Typography: The Editorial Hand
We pair the geometric clarity of *Plus Jakarta Sans* with the soft, friendly approachability of *Be Vietnam Pro*.

- **Display (Plus Jakarta Sans):** Used for "Hero" moments. `display-lg` (3.5rem) should be used with tight letter-spacing (-0.04em) to create a bold, blocky impact reminiscent of RPG title screens.
- **Headlines (Plus Jakarta Sans):** These are your "Signposts." Use `headline-md` (1.75rem) in `on_surface` (#332f1d) to provide structure.
- **Body (Be Vietnam Pro):** Our "Journal" font. `body-lg` (1rem) provides the legibility needed for long-form cozy narratives.
- **Labels (Space Grotesk):** To add a hint of "Tech-Craft," use *Space Grotesk* for UI metadata and inventory counts. It provides a sharp, monospaced contrast to the rounded body text.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are too "digital." We use atmospheric layering to create depth.

- **The Layering Principle:** Instead of a drop shadow, elevate a card by placing a `surface-container-lowest` (#ffffff) element on top of a `surface-container-high` (#ece2c1) background. This creates a "Paper-on-Wood" tactile feel.
- **Ambient Shadows:** For floating dialogue boxes, use a "Soil Shadow": `0 20px 40px rgba(51, 47, 29, 0.08)`. The shadow is a tinted version of `on_surface`, making it feel like a natural occlusion of light.
- **The "Ghost Border" Fallback:** If a boundary is required for accessibility, use `outline-variant` (#b4ad94) at **15% opacity**. It should be felt, not seen.
- **The Plank Effect:** For containers, utilize the `DEFAULT` (0.25rem) roundedness to mimic hand-cut wood. Never use `full` rounding for containers; keep them architectural and sturdy.

---

## 5. Components: The Inventory Aesthetic

### Buttons: The "Slot" Paradigm
- **Primary:** Mimic a filled inventory slot. Background: Gradient of `primary` to `primary_dim`. Text: `on_primary` (#fff0e7). Shape: `md` (0.375rem) radius.
- **Secondary:** Use `secondary_container` (#91f78e). These should feel like "Active Growth" or "Equipped" states.
- **Tertiary:** No background. Use `tertiary` (#006384) text with an underline that only appears on hover.

### Cards: The "Crate" Structure
Forbid divider lines. Use `spacing-4` (1.4rem) between header and body.
- **Structure:** A `surface-container-highest` header area transitioning into a `surface-container-low` body. 
- **The "Pixel Art" Icon:** Every card should lead with a pixel-style icon contained in a `secondary_fixed` (#91f78e) square.

### Input Fields: The "Etched" Style
- **Field:** Use `surface_container_lowest` (#ffffff) with a 2px inset "shadow" (a darker tint of the background) rather than a border.
- **Label:** Always use `label-md` in `primary` (#7d5231) to keep the "Earth" tone dominant.

### Additional Signature Component: The "Ribbon Banner"
For page titles or high-level alerts, use a full-width container in `tertiary` (#006384) that overlaps the main content grid by `spacing-2` (0.7rem) to break the vertical flow and add a sense of whimsical layering.

---

## 6. Do's and Don'ts

### Do:
- **Asymmetric Layouts:** Place text on the left and allow an image/illustration to bleed off the right edge of the screen.
- **Negative Space:** Use `spacing-16` (5.5rem) to separate major thematic blocks. The "Cozy" vibe requires room to breathe.
- **Micro-Interactions:** When hovering over a button, it should "lift" (TranslateY -2px) and the color should shift to its `fixed_dim` variant.

### Don't:
- **Don't use Pure Black:** Never use #000000. Use `on_surface` (#332f1d) for all "black" needs to maintain the warm, organic feel.
- **Don't use Sharp Corners:** Avoid `none` rounding. Everything in nature has a weathered edge; use the `sm` to `lg` scale exclusively.
- **Don't use Dividers:** If you feel the need to use a horizontal rule `<hr>`, use a background color shift or a `spacing-8` gap instead. Lines are for blueprints; tones are for gardens.