# Local game content

The JSON files in this directory are the editable, game-specific content used by the API.

Run `npm run content:validate -w @flyff-idle/api` after editing them. The API validates the document shape when it starts, while the validation command also checks references against the canonical game data.

Shop files contain merchant layout, tab labels, and item IDs. Item names, prices, stack limits, and other item metadata continue to come from the canonical game-data records in `docs/json/items.json`; do not copy those fields into shop content.

The `version` field allows the content format to evolve without silently accepting an older or incompatible document.
