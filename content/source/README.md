# Game-data source

These JSON files are the upstream reference data used by `npm run game-data:build`. They provide canonical item,
monster, quest, NPC, job, skill, set, map-monster, and upgrade records.

Application code reads the generated database and should not edit these files while the server is running. After a
source update, rebuild `content/generated/game-data.db` and regenerate the derived indexes with
`npm run content:generate`.
