# Repository Development Instructions

These instructions apply to all code changes in this repository.

## Modular design

- Keep each production file focused on one feature, responsibility, or domain concept.
- Prefer small composable modules over large files containing unrelated behavior.
- Extract stateful workflows, domain calculations, data access, and reusable UI into dedicated modules.
- Treat a file approaching 300 lines as a prompt to review its responsibilities and split it when there is a coherent boundary. Do not split files mechanically when doing so would make the code harder to follow.
- Do not add new behavior to an already oversized file without first extracting the relevant feature into a focused module.

## Atomic component design

- Organize UI code according to the existing atomic design directories: `atoms`, `molecules`, `organisms`, and `pages`.
- Atoms are small reusable UI primitives and must not contain feature-specific business logic.
- Molecules compose atoms into a focused interaction or presentation unit.
- Organisms compose atoms and molecules into feature-level sections and may coordinate feature state.
- Pages compose organisms and connect page-level data and actions. Pages should not contain low-level UI implementations or domain calculations.
- Place hooks and non-visual feature logic outside component files when they can be tested or reused independently.
- Before adding a component, choose the lowest atomic level that accurately describes its responsibility.

## Unit tests

- Every behavior change, bug fix, or new production module must include corresponding unit-test coverage in the same change.
- Test observable behavior, domain rules, edge cases, and regression scenarios rather than implementation details.
- Keep unit tests beside the production code they cover, using `name.test.ts` or `name.test.tsx`.
- When touching untested code, add focused coverage for the behavior being changed.
- Refactors must preserve or improve existing coverage. Move tests alongside extracted modules when responsibilities move.
- Do not claim a change is complete until the relevant unit tests and typechecks pass. Run lint and formatting checks when available.

## Change review

- Before finishing, review changed files for mixed responsibilities, misplaced atomic components, missing colocated tests, and avoidable file growth.
- Report the verification commands run and any checks that could not be completed.

## Domain rules and data ownership

- Keep each business or domain rule in one canonical module and reuse it from every consumer.
- Do not duplicate progression mappings, pricing rules, equipment requirements, travel rules, or other domain decisions across components or services.
- Use game data as the source of truth for item metadata wherever it provides the required field.
- Local shop inventory files may define which items a vendor stocks and how those items are organized, but must not duplicate game-data metadata.
- Enforce security, authorization, ownership, pricing, inventory, and eligibility rules on the API even when the UI also validates them for user feedback.

## Type safety and dependencies

- Keep TypeScript strict and use precise domain types at module boundaries.
- Do not introduce unexplained `any`, unsafe type assertions, ignored TypeScript errors, or lint suppressions. If an exceptional suppression is unavoidable, keep it narrow and document why it is safe.
- Validate untrusted runtime data before treating it as a domain type.
- Avoid adding a dependency when a small, clear local implementation is sufficient.

## UI quality

- Make interactive UI accessible by keyboard and expose appropriate semantic roles, names, labels, and state.
- Preserve visible focus behavior and do not rely on hover as the only way to access information or actions.
- Keep layouts usable at the application's supported viewport sizes and prevent content from overflowing its owning panel.
- Async UI must provide appropriate loading, empty, disabled, and error states. Avoid stale or ambiguous UI while operations are pending.

## Behavioral safety and scope

- Preserve existing behavior during refactors. For risky changes, establish regression coverage before moving or rewriting code.
- Keep changes scoped to the user's request and preserve unrelated worktree changes.
- Do not overwrite or remove existing work merely to simplify a refactor.
- Prefer incremental, independently verifiable changes over broad rewrites.

## Test quality

- Cover boundary conditions, validation failures, authorization failures, and error paths in addition to successful behavior.
- Keep tests deterministic and independent of execution order or external mutable state.
- Use the narrowest suitable test level: unit tests for domain logic, component tests for interactions, integration tests for boundaries, and end-to-end tests only for critical cross-system flows.
- Avoid tests that merely duplicate implementation details or assert static markup without meaningful behavior.
