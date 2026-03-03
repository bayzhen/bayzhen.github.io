---
layout: article
title: "Network Architecture Design"
description: "Replication optimization, session management, lobby/matchmaking, reconnection, and protocol dispatch"
lang: en
level: advanced
tags: ["Networking", "Replication", "Matchmaking"]
series: shooter-game-design
series_title: "射击游戏系统设计"
title_suffix: "Shooter Game Design"
order: 8
prev:
  title: "AI System Design"
  url: "07-ai-system.html"
next:
  title: "Animation System Design"
  url: "09-animation-system.html"
---

## 1. Two Network Layers

A multiplayer shooter operates on **two distinct network layers**:

```
┌─────────────────────────────────────────────┐
│  Layer 1 — Lobby / Matchmaking              │
│  TCP long connection to lobby server         │
│  Handles: login, rooms, matchmaking, chat    │
├─────────────────────────────────────────────┤
│  Layer 2 — In-Game Replication               │
│  UDP connection to dedicated game server     │
│  Handles: actor replication, RPCs, physics   │
└─────────────────────────────────────────────┘
```

| Layer | Protocol | Connection Type | Lifetime |
| --- | --- | --- | --- |
| Lobby | TCP | Persistent | From login to logout |
| In-Game | UDP | Per-match | From match start to end |

This separation means the player stays connected to the lobby even while in a match — allowing them to receive messages, friend requests, and queue notifications.

## 2. Replication Graph

In a match with 10–20 players, *naively* (朴素地) replicating every actor to every client wastes enormous bandwidth. A **Replication Graph** solves this by intelligently routing updates:

### Actor Classification

Every replicated actor is classified into a routing category:

| Category | Behavior | Example |
| --- | --- | --- |
| Always Relevant | Sent to all clients every frame | Game State, round timer |
| Spatially Static | Sent only to nearby clients, never moves | Pickup spawners, barriers |
| Spatially Dynamic | Sent to nearby clients, position updates | Characters, projectiles |
| Dormancy Aware | Stops replicating when unchanged | Doors, *interactables* (可交互物) |
| Connection Specific | Sent only to the owning client | Player's own inventory |

### Spatial Grid

The map is divided into a **2D grid** (typically 100m × 100m cells). Each client only receives updates for actors in nearby cells:

```
┌──────┬──────┬──────┬──────┐
│      │      │      │      │
│      │  P1  │  ●   │      │   P1 = Player 1
│      │      │      │      │   ●  = Enemy
├──────┼──────┼──────┼──────┤
│      │      │      │      │   P1 receives updates for
│      │      │  P2  │      │   actors in neighboring cells
│      │      │      │      │   (shaded area around P1)
├──────┼──────┼──────┼──────┤
│      │      │      │      │
│      │      │      │      │
│      │      │      │      │
└──────┴──────┴──────┴──────┘
```

### Frequency Buckets

Dynamic actors are further *throttled* (限流) using frequency buckets — not every actor updates every frame:

```
Bucket 0: Updated every frame     (the player's own character)
Bucket 1: Updated every 2 frames  (nearby enemies)
Bucket 2: Updated every 3 frames  (distant actors)
```

### Per-Connection Relevancy

Each client connection has a **personal relevancy node** that always includes:

- The player's own *pawn* (棋子/角色)
- The current view target (when spectating)
- Owned actors (weapons, abilities, UI data)

> 句型解析: "Not every actor updates every frame" — 并非每个 Actor 都在每帧更新。通过频率桶 (frequency buckets) 机制，远处的 Actor 更新频率更低，减少带宽消耗。

## 3. Session Management

The **session service** manages the TCP connection to the lobby server:

### Session State Machine

```
None → Opening → Opened → (Active Play)
                    │
                    ├── Disconnected → Reconnecting → Opened
                    │                      │
                    │                      └── ReconnectFailed
                    │
                    └── ActiveClosed (player logs out)
```

### Heartbeat Mechanism

A **heartbeat** keeps the connection alive and detects disconnects:

```
Heartbeat Design:
├── Send heartbeat request every N seconds
├── Server responds with heartbeat acknowledgment
├── If no response within 15 seconds → connection is dead
├── Maintain a waiting counter for unacknowledged beats
└── On timeout → trigger reconnection flow
```

### Reconnection Strategy

When the connection drops, the system attempts *automatic reconnection* (自动重连):

```
Reconnection Flow:
├── Attempt 1: Immediately retry
├── Attempt 2: Wait interval, then retry
├── Attempt 3: Wait longer interval, then retry
│
├── On success: Re-authenticate with lobby server
│   └── Restore room/match state
│
└── All attempts failed: Show disconnection UI
    └── Player can manually retry or return to login
```

Configuration:
- Max retry attempts: 3
- Connection timeout: 10 seconds
- Retry interval: configurable (often 0–3 seconds)

## 4. Message Queue System

Network messages are processed through a **queue** to prevent frame spikes:

```
Send Pipeline:
├── Application layer creates Protobuf message
├── Encrypt if enabled (XOR cipher)
├── Enqueue to send queue
└── ProcessSendQueue() drains 2 messages per frame

Receive Pipeline:
├── TCP layer receives raw bytes
├── Parse header, check encryption flag
├── Decrypt if needed
├── Enqueue to receive queue
└── ProcessReceiveQueue() handles 2 messages per frame
```

The **per-frame limit** (每帧限制) prevents the game from *stalling* (卡顿) when many messages arrive at once. Two messages per frame is a typical default, but can be adjusted based on profiling.

## 5. Protocol Dispatch

Incoming messages are routed to the correct handler through a **protocol dispatch** system:

```
Incoming Message
    │
    ├── Parse command ID from header
    │
    ├── Dispatch to handler based on command ID:
    │   ├── Login Handler     — authentication, token refresh
    │   ├── Lobby Handler     — room management, matchmaking
    │   ├── Shop Handler      — purchases, inventory
    │   ├── Social Handler    — friends, chat
    │   └── Setting Handler   — preferences, key bindings
    │
    └── Handler deserializes Protobuf body
        └── Updates the corresponding Data Center
```

### Data Center Pattern

Each domain has a **Data Center** — a centralized data store that caches server data locally:

| Data Center | Cached Data |
| --- | --- |
| Login | Player account, auth tokens, server state |
| Room | Room members, settings, DS connection info |
| Player | Profile, stats, inventory |
| Setting | Control bindings, graphics options |
| Battle Pass | Season progress, rewards |

Data Centers *decouple* (解耦) the UI from the network — the UI reads from the Data Center, not directly from network messages.

## 6. Matchmaking Flow

The matchmaking process connects players to a game server:

```
1. Client → Lobby: match_join_req (mode, region)
       │
2. Lobby → Client: match_join_res (confirmed)
       │
3. Lobby searches for compatible players...
       │
4. Lobby → Client: match_complete_ntf (players found)
       │
5. Lobby allocates a Dedicated Server (DS)
       │
6. Lobby → Client: enter_battle_ntf (DS IP, port, token)
       │
7. Client connects to DS using: open IP:Port?UID=xxx&TOKEN=xxx
       │
8. DS → Client: ready_confirm_ntf (all players loaded)
       │
9. Match begins
```

### DS Server Selection

Players ping multiple **server clusters** (服务器集群) to find the best connection:

```
Ping Test Flow:
├── Retrieve cluster list from lobby
├── Ping each cluster's test endpoints
├── Calculate average ping and packet loss
├── Select the cluster with lowest average ping
└── Report results to lobby for matchmaking
```

The ping results influence matchmaking — the system tries to place players in matches hosted on their *preferred* (首选的) cluster.

> 句型解析: "Players ping multiple server clusters to find the best connection" — 玩家对多个服务器集群进行延迟测试 (ping)，选择网络质量最好的集群进行游戏。

## 7. In-Game Network Synchronization

During gameplay, the dedicated server uses **RPCs** (Remote Procedure Calls) for real-time communication:

### RPC Types

| Type | Direction | Reliability | Use Case |
| --- | --- | --- | --- |
| Server RPC | Client → Server | Reliable | Player actions (fire, use ability) |
| Client RPC | Server → Client | Reliable | Personalized notifications (death cam) |
| Multicast | Server → All | Reliable/Unreliable | Visual events (explosions, kill feed) |

### Data Compression

Network data is *quantized* (量化) to reduce bandwidth:

| Data Type | Precision | Bandwidth Saving |
| --- | --- | --- |
| Position | 1mm accuracy | ~50% reduction vs. full float |
| Position (high precision) | 0.1mm accuracy | ~30% reduction |
| Direction | 10-bit normalized | ~60% reduction |
| Rotation | Compressed quaternion | ~50% reduction |

### Player State Replication

Critical player data is replicated to all clients:

```
Replicated Player Data:
├── Kill count, death count, assist count
├── Selected character and skin
├── Team ID
├── Load progress (0–100%)
├── Connection status (connected, disconnected, offline)
├── Vote status (surrender votes)
└── Headshot count, rescue count, damage dealt
```

## 8. Anti-Cheat Network Design

The authoritative server model provides the foundation for anti-cheat, but additional measures are needed:

### Server-Side Validation

```
Attack Validation:
├── Is the weapon in a valid state to fire?
├── Is there enough ammo?
├── Is the fire rate within allowed limits?
├── Is the reported hit position plausible?
│   └── Compare with server-side line trace
└── Is the damage amount within expected range?
```

### Position Verification

```
Movement Validation:
├── Is the player's reported position reachable?
├── Is the movement speed within allowed limits?
├── Has the player teleported suspiciously?
└── Are position updates arriving at expected intervals?
```

### Telemetry Collection

Suspicious behavior is logged and sent to an anti-cheat service for analysis. This includes:

- Abnormal hit rates
- Impossible movement patterns
- *Anomalous* (异常的) timing between actions

## 9. Reconnection in Match

When a player disconnects during a match, the system handles it *gracefully* (优雅地):

```
Player Disconnects:
├── Server marks player as "disconnected"
├── AI takes over the character (optional)
├── Reconnection window opens (e.g., 2 minutes)
│
Player Reconnects:
├── Re-authenticate with lobby
├── Lobby provides DS connection info
├── Client reconnects to the same DS
├── Server restores player state:
│   ├── Current character and loadout
│   ├── Kill/death counters
│   ├── Active abilities and effects
│   └── Current match phase
└── Player resumes playing
```

The key design insight is that the server **never destroys** the disconnected player's state until the match ends — it stays in memory, ready to be *reclaimed* (恢复) on reconnection.

## 10. Key Takeaways

- Shooters use **two network layers**: persistent TCP for lobby/matchmaking and per-match UDP for gameplay
- A **Replication Graph** with spatial grid, frequency buckets, and connection-specific nodes optimizes bandwidth
- **Session management** includes heartbeat, automatic reconnection, and graceful *degradation* (降级)
- A **message queue** with per-frame limits prevents network traffic from causing frame spikes
- **Protocol dispatch** routes messages to domain-specific handlers that update local Data Centers
- **Matchmaking** follows a multi-step flow: join → match → allocate DS → connect → ready
- In-game synchronization uses **RPCs** (Server, Client, Multicast) with quantized data compression
- **Reconnection** preserves player state on the server, allowing seamless return to the match
