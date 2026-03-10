---
layout: article
title: "Sync Flags and Smart Properties: Automatic Network Replication"
description: "How declarative property flags automate state synchronization across servers and clients"
level: intermediate
tags: ["Game Server", "English", "Reading"]
series: game-server-gameplay
series_title: "Game Server Gameplay Framework: English Reading"
order: 3
prev:
  title: "Composition Over Inheritance: The Entity-Component System"
  url: "02-entity-component.html"
next:
  title: "Four Pillars of Gameplay: Avatar, BattleAvatar, Room, and Space"
  url: "04-game-entities.html"
---

In a multiplayer game, the hardest bug is the one where two players see different things. A health bar reads 80 on your screen but 50 on mine. This framework attacks that problem at the declaration site: you tell each property *who should see it*, and the engine handles the rest.

## Declaring Properties

Properties are defined with a `Property()` function that accepts a combination of bit flags:

- `SERVER_ONLY` — lives on the server; clients never see it
- `OWN_CLIENT` — sent only to the owning player's client
- `ALL_CLIENTS` — broadcast to every nearby client
- `PERSISTENT` — saved to the database on write
- `SPECTATOR` — visible to spectators watching a match

A player's gold might be `OWN_CLIENT | PERSISTENT` — only you see your balance, and it survives a server restart. A character's position might be `ALL_CLIENTS` — everyone nearby must know where you stand.

> **Word Notes**
> - *declaration site* — 声明处，定义属性的代码位置。"Errors caught at the declaration site are cheapest to fix."
> - *bit flag* /bɪt flæɡ/ — 位标志，用二进制位表示选项。"Combine bit flags with the OR operator."

## How Replication Works

Under the hood, a `PropertyMetaClass` scans every class at creation time. It collects all `Property()` calls into two internal dictionaries: `__property_all__` for values and `__property_flag__` for their flags. When a property changes, the engine checks its flags and automatically pushes the update to the right destinations — no manual RPC call needed.

This is powerful because it removes an entire category of bugs. If you forget to broadcast a health change, the property flag catches it for you. If a designer adds a new stat, they declare the flag once and replication just works.

> **Word Notes**
> - *replication* /ˌreplɪˈkeɪʃn/ — 复制，同步。"Network replication keeps clients in sync."
> - *under the hood* — 在底层，在内部。"Under the hood, the metaclass does the heavy lifting."

## Custom Types

Simple integers and strings are easy, but games have nested data — an inventory is a list of items, each with its own properties. The framework provides `CustomMapType` and `CustomListType` base classes for structured data. Changes to nested fields still trigger correct replication, because these types override `__setitem__` and `__delitem__` to notify the property system.

> **Word Notes**
> - *nested* /ˈnestɪd/ — 嵌套的。"Nested data structures require special handling."

## Key Takeaways

- Property flags (`SERVER_ONLY`, `OWN_CLIENT`, `ALL_CLIENTS`, `PERSISTENT`, `SPECTATOR`) declare intent at definition time
- The metaclass scans and registers all properties automatically
- State changes replicate to the correct audience without manual RPC
- Custom collection types ensure nested data stays synchronized

*Declare once, replicate everywhere — that is the property system's promise.*
