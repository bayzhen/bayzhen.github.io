---
layout: article
title: "The RPC System: Calling Methods Across Servers"
description: "How Python decorators turn ordinary methods into network-callable RPCs with type checking and indexing"
lang: en
level: intermediate
tags: ["Game Server", "RPC", "Networking"]
series: game-server-networking
series_title: "Game Server Networking: English Reading"
title_suffix: "Game Server Networking"
order: 2
prev:
  title: "The Big Picture"
  url: "01-big-picture.html"
next:
  title: "Mailbox & Stub Patterns"
  url: "03-mailbox-stub.html"
---

What if calling a method on a remote server looked exactly like calling a local function? That's the promise of RPC — and this engine delivers it with a single decorator.

## Decorators as Network Contracts

In this codebase, you mark a method as network-callable with `@rpc_method`. The decorator takes a visibility flag and a list of argument types:

```python
@rpc_method(SERVER_ONLY, Int(), Str())
def update_score(self, player_id, reason):
    pass
```

That one line does a lot. It declares that `update_score` can only be called from another server (not a client), and that it expects an integer and a string. The engine validates arguments before they ever reach your logic.

> **Word Notes**
> - *decorator* /ˈdekəreɪtər/ — 装饰器（Python 语法特性）。"A decorator wraps a function to add behavior."
> - *contract* /ˈkɑːntrækt/ — 契约，约定。"The decorator serves as a contract between caller and callee."

## Visibility Controls

Not every RPC should be callable by everyone. The system defines five visibility levels:

- **CLIENT_ONLY** — only the owning player's client can call this
- **CLIENT_ANY** — any client can call this (useful for broadcasts)
- **SERVER_ONLY** — only other servers can call this
- **CLIENT_SERVER** — both clients and servers
- **CLIENT_STUB** — server-to-client push notifications

This is access control baked into the protocol layer. A client literally cannot invoke a `SERVER_ONLY` method — the engine rejects it before dispatch.

> **Word Notes**
> - *dispatch* /dɪˈspætʃ/ — 分派，发送。"The engine dispatches the call to the correct handler."
> - *baked into* — 内置于，融入其中。"Security is baked into the protocol, not bolted on."

## MD5-Based Indexing

Sending full method names over the network wastes bandwidth. Instead, the engine hashes each RPC name with MD5 to produce a compact 4-byte index:

```python
def calculate_rpc_index(name, salt):
    m = md5()
    m.update(name + salt)
    b = m.digest()
    return ((b[-4] & 0x7F) << 24) | (b[-3] << 16) | (b[-2] << 8) | b[-1]
```

Both sides pre-compute the same index table at startup. When a call arrives, the engine looks up the index to find the handler. Fast, compact, and collision-resistant.

> **Word Notes**
> - *bandwidth* /ˈbændwɪdθ/ — 带宽。"Reducing bandwidth usage is critical for real-time games."
> - *collision-resistant* — 抗碰撞的（不同输入产生相同输出的概率极低）。"MD5 is collision-resistant enough for RPC indexing."

## Callbacks

RPCs are fire-and-forget by default — you call a method and move on. But sometimes you need a response. The engine provides a callback mechanism:

```python
self.call_rpc_back(caller_mailbox, callback_id, result)
```

The caller registers a callback ID before making the call. When the remote side finishes, it sends results back to that ID. Simple, but effective for request-response patterns.

## Key Takeaways

- `@rpc_method` turns any method into a network-callable RPC with type safety
- Five visibility levels enforce who can call what
- MD5 indexing keeps wire format compact
- Callbacks handle request-response when fire-and-forget isn't enough

*The best networking code is the kind you forget is networking at all.*
