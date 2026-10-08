# twitch.ts
- contains almost every endpoint of Twitch API (with comments and types of response)
- contains every Twitch EventSub event (with comments and types of response)
- run tests to see features
- using axios to do http requests, it is recommended to use axios-retry to retry connection when no internet

## Install
- `npm i --allow-git=all github:TheLeerName/twitch.ts#v2.0.0`

## [Tests](tests.md)

## TODO
- change create.js in doc-maker to correspond with v3
- make eventsub
- make client for user access and app access tokens (like discord.js does)