# AGENTS

Repository-wide rules for Codex agents working in `block-puzzle`.

## Scope

- This repository is the active Block Puzzle / Block Blast-style educational example built on the local SDK.
- `game/**` is the active game implementation.
- The reusable engine is consumed through `@gamedevland/engine` from the sibling SDK workspace.
- `/Users/alexandr/projects/repositories/projects/references/block-blast/` is a gameplay reference only.
  Use it to understand core rules and feel; do not copy its Defold/Lua architecture.
- `/Users/alexandr/projects/repositories/projects/slide-merge/` is the current SDK implementation reference.
- `docs/**` contains GDDs, implementation plans, and project design documents.

## Product Boundary

Build only the base Block Puzzle mechanic unless the user explicitly expands scope:

- board;
- three available blocks under the board;
- drag-and-drop from slots to board;
- placement validation and placement;
- completed row/column detection;
- tile clear / burn feedback;
- score update;
- generation of the next three blocks after the current three are used.

Do not add game over, revive, boosters, ads, shop, progression, levels, missions, daily rewards,
settings, pause menus, tutorial, onboarding, analytics, localization, complex popups, or extra modes
unless explicitly requested.

## Mandatory Inputs

Before significant changes, check:

1. This file and `game/AGENTS.md`.
2. Runtime contracts exported by `@gamedevland/engine`.
3. `docs/block_puzzle_base_mechanics_gdd.md` and
   `docs/block_puzzle_base_mechanics_implementation_plan.md` when working on base mechanics.
4. SDK docs in `../sdk/**`.
5. `slide-merge/**` for current SDK patterns.
6. `references/block-blast/**` only for gameplay behavior.
7. Local project configs.

## Architecture

- Optimize for students reading the code in a course.
- Keep implementation minimal, explicit, and easy to explain.
- Preserve `FSM -> Command -> Scene Service -> Domain Model`.
- Keep scene classes thin.
- Put Block Puzzle rules in focused `game/**` domain/services.
- Use SDK primitives before adding local helper layers.
- Use layout JSON, prefab JSON, and typed configs for authored presentation data.
- Do not hardcode hand-tuned visual values in runtime TS when they can live in data.
- Do not introduce smart generation, meta systems, or generic frameworks during the base-mechanics phase.

## SDK Boundary

- Game code may import engine APIs only from:
  - `@gamedevland/engine`
  - `@gamedevland/engine/<subsystem>` public exports.
- Deep imports into SDK internals are forbidden.
- If game code starts duplicating lifecycle, node lookup, input, prefab, tween, asset, or config helpers,
  evaluate a narrow SDK API first.

## Validation

- Required checks after source changes:
  - `npm run typecheck`
  - `npm run lint`
- Do not launch browsers, browser automation, GUI apps, or local dev servers unless explicitly requested.
- Docs-only changes do not require static checks unless source/config files changed.
