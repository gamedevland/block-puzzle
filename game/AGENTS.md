# AGENTS (game)

Rules for implementing `block-puzzle/game/**` on top of the SDK public API.

## Scope

- `game/**` is the active Block Puzzle implementation.
- The current project contains a clean starter shell:
  - `boot` scene;
  - `game` scene;
  - minimal scene layout JSON files;
  - base image assets;
  - global DI with engine layout nodes and `ResponsiveLayoutComponent`.

## Gameplay Scope

Implement only the base mechanic until the user expands scope:

- 8x8 board or another config-defined board size;
- three available block shapes under the board;
- drag-and-drop shape placement;
- valid-cell preview and invalid placement feedback;
- shape placement onto board cells;
- full row/column detection;
- line clear / burn effects;
- score update;
- spawning the next three shapes after all current slots are used.

Do not add game over, revive, boosters, ads, shop, progression, levels, tutorial, settings, popups,
analytics, localization, or extra modes during base-mechanics implementation.

## Implementation Rules

- Use only public SDK package barrels:
  - `@gamedevland/engine`
  - `@gamedevland/engine/<subsystem>`.
- Deep imports into SDK internals are forbidden.
- Keep code minimal, focused, and readable for students.
- Preserve layout-driven scene structure, FSM-driven flow, scene-scoped services, and node-driven components/actions.
- Use focused domain classes for board, shapes, placement, line detection, score rules, and slots.
- Commands execute use-case steps triggered by FSM.
- Components/actions own node-local visuals, input, preview, animations, and text/texture updates.
- Keep authored visual data in layout JSON, prefab JSON, or typed config JSON.
- Use SDK fail-fast APIs directly; do not add local lifecycle wrappers around SDK guarantees.
- Use SDK input routing. Do not use PIXI input flags or cursor styling.
- Runtime tweens and particles must be lifecycle-owned.

## Suggested Feature Shape

- `game/src/scenes/game/domain/**`: board, shapes, score, slots, move result.
- `game/src/scenes/game/services/**`: scene-scoped gameplay/session services.
- `game/src/scenes/game/commands/**`: FSM command steps.
- `game/src/scenes/game/components/**`: board, slots, drag preview, score, effects.
- `game/src/scenes/game/configs/**`: events, FSM, scene DI, schemas, types.
- `game/assets/json/configs/**`: board/shape/scoring/animation data.
- `game/assets/json/layouts/**`: static scene hierarchy.
- `game/assets/json/prefabs/**`: repeated runtime-created visual structures.

Add only files needed by the current base mechanic.

## Validation

- Run after game source changes:
  - `npm run typecheck`
  - `npm run lint`
- Do not launch browsers or dev servers unless explicitly requested.
