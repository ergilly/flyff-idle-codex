# Flyff Idle

Idle game prototype inspired by Fly For Fun.

## Structure

- `apps/web`: Next.js frontend using atomic component folders.
- `apps/api`: Express backend with auth, character data, Jest unit tests, and Playwright API tests.
- `docs/api/openapi.yaml`: API schema documentation.

## First Run

```bash
npm install
npm run dev
```

Web: `http://localhost:3000`

API: `http://localhost:4000`

Demo account:

- Email: `test@flyff-idle.local`
- Password: `password123`

## Tests

```bash
npm run test:unit
npm run test:e2e
```

## Code Quality

```bash
npm run lint
npm run format:check
```
