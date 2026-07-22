# Flyff Idle

Idle game prototype inspired by Fly For Fun.

## What Exists So Far

Flyff Idle is currently a monorepo with a Next.js frontend and an Express API. The implemented flow is:

1. Register or log in.
2. Store an authenticated session token in the browser.
3. Load the character selection screen.
4. Show 8 character slots in a responsive grid.
5. Render existing characters with Flyff class icons.
6. Render empty slots as plus cards.

The app defaults to dark mode and includes a persisted light/dark theme toggle.

## Project Structure

- `apps/web`: Next.js App Router frontend.
- `apps/web/src/components`: Atomic component folders.
- `apps/web/public/images/classes`: Local Flyff class icon assets.
- `apps/api`: Express backend.
- `apps/api/src/data`: SQLite setup, migration, seed, and repositories.
- `docs/api/openapi.yaml`: API schema documentation.

## Local Setup

```bash
npm install
npm run game-data:build
npm run db:migrate -w @flyff-idle/api
npm run db:seed -w @flyff-idle/api
npm run dev
```

Web runs at `http://localhost:3000`.

API runs at `http://localhost:4000`.

API docs are available at `http://localhost:4000/swagger`.

## Seeded Test Accounts

- Email: `test@flyff-idle.local`
- Password: `password123`

The seed creates this admin player with a full eight-slot roster, including:

- `Fresh Vagrant`, Vagrant, level 1
- `Saint Morning`, Mercenary, level 15
- `Buff Pang Jr`, Assist, level 18

Additional seeded accounts use the same password:

- `thirdjobs@flyff-idle.local`: admin player with third-job characters.
- `secondjobs@flyff-idle.local`: admin player with level 120 second-job characters, Legendary Golden weapons, and matching level 105 armor sets.
- `empty@flyff-idle.local`: non-admin player with no characters.

## Frontend

The frontend is built with Next.js and follows an atomic component structure:

- `atoms`: low-level UI controls.
- `molecules`: composed UI pieces such as character cards and theme toggle.
- `organisms`: feature-level UI such as login form and character roster.
- `templates`: page shells.
- `pages`: page-level compositions.

Current screens:

- Login/register
- Character selection

## Backend

The API is built with Express and TypeScript.

Implemented endpoints:

- `GET /health`
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/characters`
- `GET /swagger`

Authentication uses JWT bearer tokens. Passwords are hashed with `bcryptjs`.

## Databases

The API uses SQLite through Node 24's built-in `node:sqlite` module.

- The mutable player database defaults to `apps/api/dev.db` and is ignored by Git.
- The generated, read-only game reference database is `apps/api/data/game-data.db` and is built from
  `docs/json` with `npm run game-data:build`.

The databases are kept separate so deployments can replace game reference data without changing player
accounts, characters, or inventories.

Node currently marks `node:sqlite` as experimental, so local commands may print an `ExperimentalWarning`.

### User

- `id`
- `email`
- `displayName`
- `passwordHash`
- `createdAt`
- `updatedAt`

### Character

- `id`
- `playerId`
- `slotIndex`
- `name`
- `job`
- `level`
- `exp`
- `penya`
- `inventorySize`
- `createdAt`
- `updatedAt`

### Stats

Stored as columns on `characters` and returned as a nested API object:

- `str`
- `sta`
- `dex`
- `int`

### Equipment

Stored as nullable columns on `characters` and returned as a nested API object:

- `helmet`
- `suit`
- `gloves`
- `boots`
- `flying`
- `csBoots`
- `csGloves`
- `csSuit`
- `csHelm`
- `mask`
- `cloak`
- `ammo`
- `offhand`
- `mainhand`
- `ringR`
- `earringR`
- `necklace`
- `earringL`
- `ringL`

### Inventory

Inventory capacity is stored on the character as `inventorySize`, currently defaulting to `50`.

Occupied inventory slots are stored in `character_inventory_items`:

- `id`
- `characterId`
- `slotIndex`
- `itemId`
- `quantity`
- `createdAt`
- `updatedAt`

## Tests

```bash
npm run test
npm run test:unit
npm run test:api
npm run test:ui
```

Test coverage currently includes:

- API auth unit tests
- API route and database integration tests with Jest and Supertest
- Frontend component tests with Jest and Testing Library
- Frontend login/register UI tests with Playwright

## Code Quality

```bash
npm run lint
npm run format:check
```

Use Prettier to format all files:

```bash
npm run format
```

## Useful Commands

```bash
npm run build
npm run db:migrate -w @flyff-idle/api
npm run db:seed -w @flyff-idle/api
npm run db:reset-test-accounts
npm run dev
```

`db:reset-test-accounts` transactionally restores only the four documented seeded accounts. Other player
accounts are not changed.

## Hosting

The production configuration exports the frontend as static files and runs the API against a persistent SQLite
file. See [the hosting guide](docs/hosting.md) for the supplied Ubuntu/Oracle Always Free installer, HTTPS setup,
deploy command, backups, and production test-account reset command.

## Likely Next Feature

The next natural feature is character creation:

1. Click an empty character slot.
2. Enter a character name.
3. Create a new character in that `slotIndex`.
4. Persist starting stats, empty equipment, inventory size, and `penya`.
5. Refresh the roster.
