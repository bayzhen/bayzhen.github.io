---
layout: article
title: "Mailbox & Stub Patterns: Addressing Without Hard-Coding"
description: "How mailboxes and central stubs replace hard-coded addresses with flexible service discovery"
lang: en
level: advanced
tags: ["Game Server", "Design Patterns", "Service Discovery"]
series: game-server-networking
series_title: "Game Server Networking: English Reading"
title_suffix: "Game Server Networking"
order: 3
prev:
  title: "The RPC System"
  url: "02-rpc-system.html"
next:
  title: "Connection Lifecycle"
  url: "04-connection-lifecycle.html"
---

In a distributed system, the hardest question isn't "how do I send a message?" It's "where do I send it?" Mailboxes and stubs answer that question elegantly.

## The Mailbox: A Network Address You Don't Have to Understand

A Mailbox is a small, opaque object that encodes everything needed to reach a remote entity — IP, port, and entity ID. You never construct one by hand. You receive it from the system and pass it around like a token.

```python
self.call(target_mailbox, "some_method", arg1, arg2)
```

The caller doesn't know — or care — which physical machine hosts the target. The mailbox handles routing transparently. If the target moves to a different server, you get a new mailbox. Your code doesn't change.

> **Word Notes**
> - *transparently* /trænsˈpærəntli/ — 透明地，无感知地。"The system handles routing transparently."
> - *token* /ˈtoʊkən/ — 令牌，凭证。"Pass the mailbox around like a token."

## Stubs: The Phone Book

If a mailbox is a phone number, a **Stub** is the phone book. Stubs are singleton entities that run on well-known addresses. Every server registers with them at startup.

**GameProxyStub** tracks all game servers. When a hall server needs to send a player to a battle server, it asks the stub: "Which battle server has capacity?" The stub returns a mailbox.

**MicroServiceStub** tracks all microservice instances. It manages a state machine for each connection:

```
INVALID → CREATING → STARTED → READY
```

Only `READY` services receive traffic. If a service crashes and restarts, the stub detects the gap through lease expiration and walks the state machine again.

> **Word Notes**
> - *singleton* /ˈsɪŋɡəltən/ — 单例（只有一个实例的对象）。"The stub runs as a singleton on a known address."
> - *state machine* — 状态机。"The stub manages a state machine for each proxy connection."

## The Hub-and-Spoke Model

The overall pattern is **hub-and-spoke**: stubs sit at the center, and all other servers connect to them like spokes on a wheel. This has clear trade-offs.

**Advantages**: Simple discovery. Any server can find any other server by asking the stub. No peer-to-peer mesh to maintain. Adding a new server is just a registration call.

**Risks**: The stub is a single point of failure. If it goes down, discovery stops. The engine mitigates this with persistent global data — stubs can recover their state from a shared store after a restart.

```python
def _recover_shard_config(self):
    proxy_num = GameUtils.get_global_data(GD_PROXY_NUM_KEY)
    shard_config = GameUtils.get_global_data(GD_SHARD_CONFIG_KEY)
```

> **Word Notes**
> - *mitigate* /ˈmɪtɪɡeɪt/ — 缓解，减轻。"The engine mitigates the risk with recovery logic."
> - *hub-and-spoke* — 中心辐射模型。"All servers connect to a central hub."

## Real-World Analogy

Think of a taxi dispatch center. Drivers (servers) register with the center (stub). When a passenger (request) arrives, the center picks the best available driver and hands over a phone number (mailbox). The passenger calls the driver directly — the center doesn't relay every message.

## Key Takeaways

- Mailboxes are opaque handles for routing; callers never hard-code addresses
- Stubs are central registries that track server health and state
- The hub-and-spoke model simplifies discovery at the cost of a central dependency
- Recovery mechanisms let stubs survive restarts

*Good abstractions don't just hide complexity — they make the complex feel obvious.*
