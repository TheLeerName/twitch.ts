# twitch.ts
- contains almost every endpoint of Twitch API (with comments and types of response)
- contains every Twitch EventSub event (with comments and types of response)
- run tests to see features

# Install
- `npm i github:TheLeerName/twitch.ts#v1.5.1`

# Tests
> [!NOTE]
> Before doing any tests, build them!
> 1. `npm i`
> 2. `npm run build`
- [Opening WebSocket session for EventSub](src/test.ts#L4-L9)
- [Getting user access token via authorization code grant flow](src/test-authorization-code.ts#L3-L24)
