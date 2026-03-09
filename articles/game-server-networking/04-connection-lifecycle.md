---
layout: article
title: "Connection Lifecycle: Heartbeats, Sessions, and Reconnection"
description: "How the server tracks who's alive, manages player sessions, and handles disconnections gracefully"
lang: en
level: intermediate
tags: ["Game Server", "Sessions", "Reliability"]
series: game-server-networking
series_title: "Game Server Networking: English Reading"
title_suffix: "Game Server Networking"
order: 4
prev:
  title: "Mailbox & Stub Patterns"
  url: "03-mailbox-stub.html"
next:
  title: "Async Model & Scalability"
  url: "05-async-scalability.html"
---

Players disconnect. Servers crash. Networks hiccup. A good game server doesn't just handle the happy path — it handles everything going wrong at once.

## The Heartbeat: Proof of Life

Every game server sends a periodic **lease** to its stub — a lightweight RPC that says "I'm still here." The stub timestamps each lease. If a server misses its window, the stub declares it dead and removes it from the registry.

```python
def check_keep_alive(self):
    out_dur = max(2 * GAME_PROXY_LEASE, 15)
    now = time.time()
    for sid, info in self.game_proxies.items():
        if info.alive_time + out_dur < now:
            self.remove_game_proxy(sid, now)
```

The timeout is deliberately generous — at least twice the lease interval or 15 seconds, whichever is larger. This avoids false positives from brief network blips.

> **Word Notes**
> - *lease* /liːs/ — 租约（这里指定期续约的心跳信号）。"Each server renews its lease every few seconds."
> - *false positive* — 误报。"A generous timeout avoids false positives."

## Player Sessions: Seven States of Login

A player's connection isn't just "connected" or "disconnected." The engine tracks seven distinct states:

| State | Meaning |
|-------|---------|
| CONNECTING | TCP handshake in progress |
| CONNECTED | Authenticated, in lobby |
| QUEUING | Waiting in login queue |
| CHECKINGIN | Loading account data |
| AVATARING | Creating/selecting character |
| LOADING | Entering game world |
| RELAYING | Reconnecting from another device |

Each state transition triggers specific logic. For example, moving from `LOADING` to `CONNECTED` means the player is ready to play — time to sync their inventory and notify friends.

> **Word Notes**
> - *handshake* /ˈhændʃeɪk/ — 握手（网络连接建立过程）。"The TCP handshake completes before login begins."
> - *transition* /trænˈzɪʃən/ — 转换，过渡。"Each state transition triggers specific logic."

## Graceful Disconnection

When a player's client drops, `on_lose_client()` fires. But the server doesn't destroy the player entity immediately — it starts a **delay timer**:

```python
def on_lose_client(self):
    self.delay_destroy_timer = self.add_timer(
        10, lambda: self.destroy()
    )
```

Ten seconds. That's the grace period. If the player reconnects within that window, the timer is cancelled and they resume exactly where they left off. No data lost, no re-login needed.

## Reconnection: The Relay System

What if a player switches devices — say, from phone to tablet? The engine supports this through a **relay** mechanism. The new connection triggers `on_relay_request()`, which resets the session state and links the new client to the existing server-side entity.

The engine even caches recent RPC responses. If the reconnecting client re-sends a request it already sent (common during network instability), the server returns the cached result instead of processing it twice.

> **Word Notes**
> - *grace period* — 宽限期。"The 10-second grace period prevents premature cleanup."
> - *premature* /ˌpriːməˈtʃʊr/ — 过早的。"Premature destruction would force a full re-login."

## Key Takeaways

- Heartbeat leases with generous timeouts detect dead servers without false alarms
- Seven login states give fine-grained control over session behavior
- Delayed destruction and relay support enable seamless reconnection
- RPC response caching prevents duplicate processing

*The best disconnection handling is the kind the player never notices.*
