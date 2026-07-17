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
