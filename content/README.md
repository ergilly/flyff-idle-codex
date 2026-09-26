# Game content

Content is grouped by ownership rather than by file extension:

- `source/game-data` contains the upstream reference JSON used to build the read-only game database.
- `authored` contains local game design and presentation data such as shops, quests, maps, and progression.
- `generated` contains reproducible build outputs such as `game-data.db`.

Run `npm run content:validate -w @flyff-idle/api` after editing authored content. The API validates document
shape when it starts, while the validation command also checks references against canonical game data.

Authored catalogs store IDs and layout rules. They do not copy names, prices, stack limits, or other item metadata;
those values continue to come from the canonical game-data records in `source/game-data/items.json`.

Every authored document has a `version` field so the format can evolve without silently accepting incompatible data.
