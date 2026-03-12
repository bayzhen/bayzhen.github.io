---
layout: article
title: "State Synchronization"
description: "Snapshots, delta compression, and interest management — how servers keep 100 players seeing the same world"
lang: en
level: intermediate
tags: ["Multiplayer Netcode", "State Sync", "English Reading"]
series: multiplayer-netcode
series_title: "Multiplayer Netcode: English Reading"
title_suffix: "Multiplayer Netcode: English Reading"
order: 5
prev:
  title: "Rollback Netcode"
  url: "04-rollback-netcode.html"
next:
  title: "Cheating and Anti-Cheat"
  url: "06-anti-cheat.html"
---

Imagine you are the server of a 100-player battle royale. Every 50 milliseconds, you must tell each player where all other 99 players are, what they are doing, and what the world looks like. That is 2,000 updates per second, per client. Multiply by 100 clients, and you face a staggering bandwidth problem. State synchronization is the art of solving it.

## Full Snapshots: The Brute-Force Approach

The simplest strategy is to send a full snapshot of the entire game world to every client, every tick. Each snapshot contains every entity's position, health, animation state, and other properties. For a small game with 10 players, this works fine. Each snapshot might be 2 KB, and at 20 Hz (20 snapshots per second), each client receives 40 KB/s.

But with 100 players and 500 dynamic objects, a full snapshot can exceed 50 KB. At 20 Hz, that is 1 MB/s per client. For 100 clients, the server needs 100 MB/s of upload bandwidth. No ordinary server can afford that.

> **Word Notes**
> - *staggering* /ˈstaeɡərɪŋ/ — 令人震惊的，极大的。"The staggering cost forced the team to redesign."
> - *snapshot* /ˈsnaepʃɑːt/ — 快照，某一时刻的完整状态。"The server captures a snapshot 20 times per second."

## Delta Compression: Only Send What Changed

The solution is delta compression. Instead of sending the full world state, the server compares the current snapshot to the last one the client acknowledged. It then sends only the differences. If a player stood still, their position takes zero bytes in the delta. If only 30 out of 500 objects changed, the delta is 30 times smaller than a full snapshot.

Valve's Source engine pioneered this approach. The server keeps a history of recent snapshots. When a client acknowledges snapshot #42, the server computes the difference between #42 and the current #47, and sends that delta. A typical delta in Counter-Strike might be only 200 to 500 bytes, down from 10 KB for a full snapshot.

## Interest Management: Ignore What You Cannot See

Delta compression shrinks each update, but interest management eliminates updates entirely. The idea is simple: a player does not need to know about enemies 2 kilometers away. The server divides the world into regions and only sends entities within each client's area of interest.

In a battle royale map of 4 km by 4 km, a player's area of interest might be a 500-meter radius. That covers roughly 5% of the map. The server can skip 95% of entities for that client. Combined with delta compression, bandwidth drops from megabytes to kilobytes.

> **Word Notes**
> - *acknowledged* /əkˈnɑːlɪdʒd/ — 确认收到的。"The server waits until the client has acknowledged the packet."
> - *eliminate* /ɪˈlɪmɪneɪt/ — 消除。"Interest management eliminates unnecessary updates."

## Priority-Based Updates

Even within a player's area of interest, not all entities deserve equal bandwidth. An enemy 10 meters away matters far more than a tree 400 meters away. Priority-based updating assigns each entity a relevance score based on distance, visibility, and gameplay importance.

Unreal Engine's replication system does exactly this. Each replicated actor has a priority value. Closer actors get higher priority and update more frequently — perhaps every tick. Distant actors update every 5th or 10th tick. The server maintains a per-client priority queue and fills each outgoing packet with the highest-priority updates first, never exceeding the bandwidth budget.

This budget is typically 30 to 50 KB/s per client. If the server cannot fit all updates into one packet, lower-priority entities simply wait until the next tick.

## Snapshot Interpolation: Smoothing the Result

On the client side, snapshots arrive at discrete intervals — every 50 ms at 20 Hz. Without smoothing, entities would teleport between positions. Snapshot interpolation solves this by always rendering between two received snapshots.

The client introduces a small artificial delay — typically one snapshot interval (50 ms). It then interpolates entity positions between the previous snapshot and the current one. This produces smooth, continuous movement even at low tick rates.

> **Word Notes**
> - *discrete* /dɪˈskriːt/ — 离散的，不连续的。"Snapshots arrive at discrete intervals, not continuously."
> - *interpolate* /ɪnˈtɜːrpəleɪt/ — 插值。"The client interpolates positions between two snapshots."

## Putting It All Together

A modern 100-player server combines all these techniques. Full snapshots serve as baselines. Delta compression reduces each update to hundreds of bytes. Interest management cuts the entity count by 90% or more. Priority-based updating ensures the bandwidth budget is never exceeded. And on the client, snapshot interpolation hides the gaps between ticks.

*The server does not show you the whole world — it shows you just enough of the world, just often enough, to make you believe nothing is missing.*
