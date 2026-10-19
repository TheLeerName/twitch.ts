# twitch.ts
- contains every endpoint of Twitch Helix and EventSub API (with comments and types of response)
- using axios to do http requests, it is recommended to use axios-retry to retry connection when no internet
- using ReconnectingWebSocket to do WebSocket connections

## Install
- `npm i --allow-git=all github:TheLeerName/twitch.ts#dev-2.0`

## [Tests](tests.md)

## TODO
- make eventsub