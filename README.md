# FedRAMP MAS Boundary Scoping Tool

React + TypeScript + Vite rebuild of the original single-file `MAS_Interactive_v5.html` reference
(kept in [`reference/`](reference/) for comparison), plus a new auto-generate pipeline that classifies
an uploaded services list into the diagram via the Anthropic API.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set `ANTHROPIC_API_KEY` to a real key — required for the "Auto-Generate" upload
feature. Everything else (editing, drag-and-drop, resize, export) works without it.

## Run

```bash
npm run dev:all
```

This starts the Vite dev server (`http://localhost:5173`) and the classification backend
(`http://localhost:8787`) together. Vite proxies `/api/*` requests to the backend, so the frontend
always calls same-origin `/api/classify`.

Run them separately if you prefer: `npm run dev` (frontend only) and `npm run server` (backend only).

## Project structure

- `src/` — the app. `state/useDiagramState.ts` holds all diagram state (layers, zones, cards,
  services) with localStorage autosave and an undo/redo history stack; `components/` are the
  presentational pieces; `utils/` has color math, PNG/JSON/SVG export, file-text-extraction, and
  the auto-generate merge logic (`classifyMerge.ts`).
- `server/` — a small Express proxy. It holds `ANTHROPIC_API_KEY` server-side and exposes
  `POST /api/classify`, so the key is never sent to the browser.
- `reference/` — the original HTML file and build spec, kept for behavioral comparison.

## Notes

- The classification model defaults to `claude-sonnet-4-6` (per the build spec) — override with
  `ANTHROPIC_MODEL` in `.env` if that ID isn't available on your account.
- The classification contract splits each item into `type: "component"` (a functional card, e.g.
  "Core Applications") or `type: "service"` (a specific named product, e.g. "AWS Lambda", rendered
  as a Leveraged Cloud Services chip). Components use the MAS scope scale (`status`); services use
  the FedRAMP auth scale (`service_status`). See `server/systemPrompt.ts` for the full contract.
- Auto-generate first clears every still-unfilled default placeholder card (detected by its
  bracketed `[...]` desc text, e.g. `[SaaS Tool B]` — a card a user edited or added never matches
  this pattern, so it's never touched) from every layer/zone, then merges classified results in —
  see `isPlaceholderCard` and `mergeComponentsIntoCards`/`mergeServicesIntoChips` in
  `src/utils/classifyMerge.ts`. The placeholder-matching logic in those merge functions (replacing
  a still-present placeholder in place by name/example-text similarity, rather than appending) now
  mainly matters for a service chip's `[Add service...]` placeholder, since card placeholders are
  already gone by the time it runs. Re-running Auto-Generate a second time is non-destructive: by
  then nothing bracketed is left to strip, so new results merge in alongside whatever real content
  (classified or hand-edited) already exists rather than clearing it.
- External zones use a 2-column layout: Customer/Agency Env. alone in a narrow fixed-width left
  column (`Zone`'s `fixedWidth` prop), and every other zone — Scoping Gaps, Corporate, and any
  user-added zones — stacked vertically in a fluid full-width right column (`.zone-right-column`
  in `BottomRow.tsx`), so their cards can wrap into a proper multi-column grid instead of a single
  narrow stack.
- Card sizing is proportional flexbox (`flex: 1 1 var(--card-min-width)`, floor ~140-160px) so a
  layer with few cards renders them wider and a layer with many compacts and wraps; dragging a
  card's resize handle sets an explicit flex-basis that overrides this for that card.
- The diagram and layer containers render at their natural width — no page-level `max-width` or
  centering (an earlier version added this for print layout; it was reverted per explicit
  direction). `.services-card` is capped at `max-width: 480px` so its chips wrap into consistent
  rows (~4 per row) instead of the row length fluctuating with whatever horizontal space happens
  to be free. `.cards-row` and `.bottom-row` both use `align-items: flex-start` so a short card or
  zone doesn't stretch to match a taller sibling (e.g. a card next to a tall services box, or the
  Customer/Corporate zones next to a heavily-populated Scoping Gaps zone) — each sizes to its own
  content height independently.
- Undo/redo (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z) snapshots layers/zones — not the Consultant/Client/Date
  fields, and not while a text field is focused, so native text-edit undo still works there.
- PNG export uses `html2canvas` at `scale: 4` (sharp enough to stay readable when placed into a
  Word doc at normal page width, not just at 100% browser zoom), mirroring the original's approach
  of cloning the diagram DOM and swapping inputs/textareas for plain text nodes before rasterizing.
  It clones and stacks three separate elements — diagram, external zones, and the legend (each via
  its own ref in `App.tsx`) — so the legend is included in the export, not just what's visible in
  the two diagram containers.
- JSON export (`src/utils/exportJson.ts`) is a pure data dump of `layers`/`zones`/`meta` in a
  versioned envelope — no rendering involved.
- SVG export (`src/utils/exportSvg.ts`) walks the live rendered DOM for every `.layer`/`.zone`/
  `.card`/`.chip`, reading position via `getBoundingClientRect()` and styling (colors, dashed
  borders, corner radii) via `getComputedStyle()`, but pulls all text from the data model (not
  `innerText`) via `data-layer-id`/`data-zone-id`/`data-card-id`/`data-service-id` attributes on
  those elements. Output is native `<rect>`/`<text>`/`<circle>` shapes — no `foreignObject` — so
  it opens as separate editable elements in Illustrator/Figma. Card `desc`/`eg` text is wrapped
  into `<tspan>` lines using `canvas.measureText()` against the card's actual rendered width, so
  it respects manual card resizing.
- This is set up for local development only; there's no production build/deploy configuration yet.
