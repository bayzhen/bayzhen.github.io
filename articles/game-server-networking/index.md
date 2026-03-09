---
layout: series-index
title: "Game Server Networking: English Reading"
description: "How a distributed Python game server handles networking — RPC, mailboxes, stubs, and async I/O"
series_id: game-server-networking
title_suffix: "陈栢成"
lang: en
---

## About This Series

Modern online games run on clusters of servers that must talk to each other constantly — routing player actions, syncing game state, and recovering from failures. This series walks through a real production game server's networking layer, piece by piece. If you've ever wondered what happens between "player presses a button" and "the server responds," this is for you.

## What You'll Find

- **The Big Picture** — how a distributed game server is organized into halls, battles, and microservices
- **The RPC System** — the decorator-driven mechanism that lets servers call each other's methods
- **Mailbox & Stub Patterns** — how servers address and discover each other without hard-coded IPs
- **Connection Lifecycle** — heartbeats, player sessions, disconnection handling, and reconnection
- **Async Model & Scalability** — coroutines, sharding, and load balancing under the hood

## How to Use This Series

Each article is 300–500 words — short enough to copy out by hand in one sitting. Difficult words are annotated inline. Read straight through for the full picture, or jump to any article that interests you.

Start with [The Big Picture](01-big-picture.html).
