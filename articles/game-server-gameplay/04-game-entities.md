---
layout: article
title: "Four Pillars of Gameplay: Avatar, BattleAvatar, Room, and Space"
description: "How four core entity types model the entire lifecycle of a multiplayer match"
level: intermediate
tags: ["Game Server", "English", "Reading"]
series: game-server-gameplay
series_title: "Game Server Gameplay Framework: English Reading"
order: 4
prev:
  title: "Sync Flags and Smart Properties: Automatic Network Replication"
  url: "03-property-system.html"
next:
  title: "Persistence and Hot-Reload: Keeping the Server Alive"
  url: "05-persistence.html"
---

A player logs in, queues for a match, fights a battle, and returns to the lobby. Behind that simple journey are four entity types, each with a distinct responsibility. Understanding them is understanding the entire gameplay loop.

## Avatar: Your Lobby Self

The `Avatar` is your persistent identity. It exists from the moment you log in until you log out. It holds your profile, currency, friends list, and matchmaking state. It is marked `PERSISTENT` and saved to MongoDB every fifteen minutes.

The Avatar also acts as a gatekeeper. Every client RPC passes through rate-limiting checks — `call_times` and `call_count` — to prevent exploits. When you go offline briefly, the Avatar survives with an offline timer, holding your place.

> **Word Notes**
> - *gatekeeper* /ˈɡeɪtkiːpər/ — 守门人，把关者。"The Avatar acts as a gatekeeper for client requests."
> - *exploit* /ɪkˈsplɔɪt/ (n.) — 漏洞利用。"Rate limiting prevents exploits from flooding the server."

## BattleAvatar: Your Combat Self

When you enter a battle, the server creates a `BattleAvatar` — a separate entity living inside a battle Space. It holds a mailbox reference back to your Avatar so the two can communicate across servers. A lease-and-heartbeat mechanism keeps them in sync: if the heartbeat stops, the BattleAvatar knows you disconnected and starts a reconnection timer.

This split is crucial. Battle logic runs at a high tick rate on a dedicated server. Keeping it isolated from lobby logic means a chat message cannot stall your combat frame.

> **Word Notes**
> - *lease* /liːs/ — 租约，这里指有期限的授权。"The lease expires if the heartbeat stops."
> - *tick rate* — 帧率，服务器每秒更新次数。"A higher tick rate means smoother combat."

## Room: The Match Organizer

Before a battle begins, players gather in a `Room`. The Room manages team assignments, ready-checks, and countdown timers. It follows a finite state machine: Idle → Loading → Running → Destroying. The `go_next_step()` method advances this FSM, creating a Space when all players are loaded.

Rooms come in many flavors — `MatchRoom` for ranked play, `RushMatchRoom` for fast modes, `MirrorRoom` for mirrored gameplay — but they all inherit the same state machine backbone.

> **Word Notes**
> - *finite state machine* — 有限状态机（FSM），用有限的状态和转换描述行为。"The room follows a finite state machine pattern."
> - *backbone* /ˈbækbəʊn/ — 骨干，核心支撑。"The FSM is the backbone of room management."

## Space: The Battle Arena

A `Space` is the physical world where combat happens. Marked with `@SpaceClass`, it is a singleton per battle instance. It manages entity entry and exit, spatial queries, and physics boundaries. When the battle ends, the Space notifies all BattleAvatars, transfers rewards back to their Avatars, and destroys itself.

## Key Takeaways

- Avatar persists across sessions; BattleAvatar lives only during a match
- Mailbox + heartbeat keep the two synchronized across servers
- Room uses an FSM to orchestrate the pre-battle flow
- Space owns the physical world and entity lifecycle during combat

*Four entities, four jobs — and the player never sees the seams.*
