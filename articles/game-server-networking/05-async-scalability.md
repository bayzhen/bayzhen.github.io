---
layout: article
title: "Async Model & Scalability: Coroutines, Sharding, and Load Balancing"
description: "How the server handles thousands of concurrent operations without threads — and scales horizontally with sharding"
lang: en
level: advanced
tags: ["Game Server", "Async", "Scalability"]
series: game-server-networking
series_title: "Game Server Networking: English Reading"
title_suffix: "Game Server Networking"
order: 5
prev:
  title: "Connection Lifecycle"
  url: "04-connection-lifecycle.html"
---

A game server juggles thousands of operations every second — RPCs arriving, database queries returning, timers firing. Threads would make this a nightmare. Coroutines make it manageable.

## Coroutines, Not Threads

This engine uses **cooperative multitasking**. Instead of OS threads competing for CPU time, coroutines voluntarily yield control when they're waiting for something:

```python
@coroutine
def load_player_data(self, player_id):
    data = yield db.query("SELECT * FROM players WHERE id=?", player_id)
    self.init_from_data(data)
    raise Return(True)
```

The `yield` pauses the coroutine until the database responds. Meanwhile, other coroutines run. No locks, no race conditions, no thread-safety headaches. The trade-off? One slow coroutine that forgets to yield blocks everything.

> **Word Notes**
> - *cooperative multitasking* — 协作式多任务。"Coroutines share CPU time by yielding voluntarily."
> - *race condition* — 竞态条件（多线程并发时的数据竞争问题）。"Coroutines eliminate race conditions by design."

## Two Flavors of Coroutine

The engine offers `@coroutine` for full async operations and `@coroutine_lite` for methods that *might* yield but usually don't. The lite version skips some setup overhead, making it faster for the common case.

Microservices get a third variant: `@rpc_coroutine`, which combines RPC decoration with coroutine support. One decorator gives you network visibility, type checking, *and* async execution:

```python
@rpc_coroutine(SERVICE_ONLY, Int(), Str())
def get_rank(self, player_id, season):
    result = yield self.db.query_rank(player_id, season)
    raise Return(result)
```

## Sharding: Horizontal Scale

When one instance of a microservice isn't enough, the engine shards it — running multiple instances of the same service, each responsible for a slice of the data.

The `MicroServiceStub` tracks how many shards each service type has. RPCs can target a specific shard by ID, or the stub can route automatically. Adding capacity means launching more shards and updating the stub's configuration.

> **Word Notes**
> - *shard* /ʃɑːrd/ — 分片。"Each shard handles a portion of the total data."
> - *horizontal scale* — 水平扩展（通过增加机器数量来提升能力）。"Sharding enables horizontal scale."

## Load Balancing

Not all servers are equally powerful. The engine's load balancer considers CPU count, CPU frequency, and available memory when routing new players:

```python
load_balancer.add_proxy(server_id, cpu_count, cpu_freq, memory)
best_server = load_balancer.available_proxies
```

The algorithm (called `TopHalfFreeRR`) filters out the bottom half of servers by load, then round-robins among the healthier ones. This prevents overloading weak machines while still utilizing the full cluster.

> **Word Notes**
> - *round-robin* — 轮询（依次分配请求到各服务器）。"Round-robin distributes requests evenly."
> - *utilize* /ˈjuːtɪlaɪz/ — 利用。"The balancer utilizes the full cluster without overloading any node."

## Serialization: cPickle

All data crossing the network — RPC arguments, cached state, global messages — is serialized with Python's `cPickle`. It's fast and native, but it locks the system to Python. A pragmatic choice: performance and simplicity over cross-language interoperability.

## Key Takeaways

- Coroutines provide concurrency without threads, locks, or race conditions
- Three coroutine variants optimize for different use cases
- Sharding scales microservices horizontally
- Load balancing accounts for hardware differences across servers
- cPickle serialization is fast but Python-only

*Scale isn't about one powerful machine. It's about a thousand ordinary ones working together.*
