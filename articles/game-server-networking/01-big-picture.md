---
layout: article
title: "The Big Picture: A Distributed Game Server"
description: "How a Python game server splits into halls, battles, and microservices — and why it needs to"
lang: en
level: intermediate
tags: ["Game Server", "Networking", "Architecture"]
series: game-server-networking
series_title: "Game Server Networking: English Reading"
title_suffix: "Game Server Networking"
order: 1
next:
  title: "The RPC System"
  url: "02-rpc-system.html"
---

Imagine thousands of players logging in at the same time. One server can't handle them all. So we split the work — and that split is where all the interesting engineering begins.

## Why Distribute?

A single-process game server hits its limits fast. CPU-bound game logic, memory-hungry player states, and unpredictable traffic spikes all conspire to bring it down. The solution is to spread the workload across multiple processes, often on multiple machines.

> **Word Notes**
> - *conspire* /kənˈspaɪər/ — 合谋，共同导致。"Several factors conspired to cause the outage."
> - *workload* /ˈwɜːrkloʊd/ — 工作负载。"The workload is distributed evenly across servers."

## The Three Pillars

This particular engine organizes its servers into three categories:

**Hall Servers** handle the lobby — login, matchmaking, inventory, and social features. When a player opens the game, they connect here first. Each hall server manages a pool of `Account` and `Avatar` entities that represent players.

**Battle Servers** host the actual gameplay. When a match starts, the hall server hands players off to a battle server. Here, `BattleAvatar` entities run the real-time game logic.

**Microservice Clusters** provide shared, stateless services — leaderboards, chat, global announcements. These run independently and can scale horizontally. Any hall or battle server can call them.

> **Word Notes**
> - *hand off* — 移交，传递。"The hall server hands players off to the battle server."
> - *stateless* /ˈsteɪtləs/ — 无状态的。"Stateless services don't remember previous requests."

## How They Connect

Servers don't call each other directly with raw sockets. Instead, they use a **Mailbox** system — an opaque reference that encodes a target's address. Think of it as a phone number for a server entity. You don't need to know which machine it's on; you just dial the mailbox.

A central **Stub** acts as the phone book. When a hall server starts, it registers with the `GameProxyStub`. When a microservice comes online, it registers with the `MicroServiceStub`. These stubs track who's alive, who's busy, and who should receive the next request.

## The Takeaway

This architecture follows a classic pattern: **split by responsibility, connect by abstraction**. Hall servers own player state. Battle servers own gameplay. Microservices own shared data. And they all communicate through mailboxes and stubs, never caring about physical topology.

> **Word Notes**
> - *opaque* /oʊˈpeɪk/ — 不透明的，不可见内部的。"The mailbox is an opaque handle — you don't see inside it."
> - *topology* /təˈpɑːlədʒi/ — 拓扑结构。"Network topology describes how nodes are connected."

## Key Takeaways

- A game server cluster splits into hall, battle, and microservice roles
- Mailboxes abstract away physical addresses
- Stubs act as central registries for service discovery

*One server is simple. A thousand servers talking to each other — that's where the real game begins.*
