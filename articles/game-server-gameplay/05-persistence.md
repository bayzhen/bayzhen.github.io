---
layout: article
title: "Persistence and Hot-Reload: Keeping the Server Alive"
description: "How MongoDB persistence, manager singletons, and hot-reload keep a live game running"
level: intermediate
tags: ["Game Server", "English", "Reading"]
series: game-server-gameplay
series_title: "Game Server Gameplay Framework: English Reading"
order: 5
prev:
  title: "Four Pillars of Gameplay: Avatar, BattleAvatar, Room, and Space"
  url: "04-game-entities.html"
---

A game server that must restart to apply a bugfix is a game server that kicks thousands of players offline. This framework is designed to stay alive — through crashes, patches, and traffic spikes — using three strategies: smart persistence, manager singletons, and hot code reload.

## MongoDB Persistence

Entities that need to survive restarts are marked with the `@Persistent` decorator, which takes a save interval in seconds. An Avatar, for example, saves every 900 seconds (fifteen minutes). For critical data like tournament results, the `ENTITY_FLAG_REALTIME_SAVE` flag triggers an immediate write on every change.

The database layer talks to MongoDB through a distributed `DBManager`. Loads use `load_from_db()` with callback IDs so the response arrives asynchronously. This non-blocking design means a slow database query never freezes the game loop.

> **Word Notes**
> - *asynchronously* /eɪˈsɪŋkrənəsli/ — 异步地。"Data loads asynchronously to avoid blocking."
> - *non-blocking* — 非阻塞的。"Non-blocking I/O keeps the game loop smooth."
> - *traffic spike* — 流量尖峰，突然的访问量增加。"The server handled the traffic spike gracefully."

## Manager Singletons

Not every system fits neatly into an entity. Matchmaking, rankings, chat, payments, and analytics each need a global coordination point. The framework models these as **Stub entities** — singleton services distributed across the cluster.

`MatchStub` coordinates queue logic. `RankListStub` aggregates leaderboard data. `BattleServerStub` tracks which servers have capacity for new battles. Each Stub is a full entity with its own RPC methods, but only one instance exists per service per shard. Other entities reach them through `call_shardid_stub()`, a targeted cross-server call.

> **Word Notes**
> - *aggregate* /ˈæɡrɪɡeɪt/ — 汇总，聚合。"The stub aggregates ranking data from all servers."
> - *shard* /ʃɑːrd/ — 分片，数据库或服务器的分区。"Each shard handles a subset of the player base."

## Hot-Reload: Patching Without Downtime

The most surprising feature is hot code reload. When a developer pushes a fix, the `HotfixManager` reloads changed Python modules without restarting the process. A `pre_reload_script()` hook lets each component clean up state before the new code takes over.

This is not magic — it works because the component architecture keeps state in entity properties (data) and behavior in component methods (code). Reloading replaces the methods while the properties remain untouched. The separation of data and logic, which seemed like a design luxury, turns out to be an operational necessity.

> **Word Notes**
> - *downtime* /ˈdaʊntaɪm/ — 停机时间。"Hot-reload eliminates scheduled downtime."
> - *operational necessity* — 运维上的必要性。"What seemed optional became an operational necessity."

## Key Takeaways

- `@Persistent` decorator + save intervals balance data safety against write load
- Real-time save flags protect critical data like tournament results
- Manager Stubs provide global coordination as singleton entities
- Hot-reload swaps code while preserving entity state — zero downtime

*The best server update is the one your players never notice.*
