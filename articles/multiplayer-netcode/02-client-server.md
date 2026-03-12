---
layout: article
title: "Client-Server Architecture"
description: "Authoritative servers, dumb clients, and the trust problem — why the server must always have the final word"
lang: en
level: intermediate
tags: ["Multiplayer Netcode", "Client-Server", "English Reading"]
series: multiplayer-netcode
series_title: "Multiplayer Netcode: English Reading"
title_suffix: "Multiplayer Netcode: English Reading"
order: 2
prev:
  title: "The Latency Problem"
  url: "01-the-latency-problem.html"
next:
  title: "Client-Side Prediction"
  url: "03-client-prediction.html"
---

In 2012, a player in *DayZ* teleported every zombie on the map into a single building and crashed the server. He did this by sending forged packets directly to the game. The server trusted them. This single incident captures the core lesson of multiplayer architecture: never trust the client.

## Two Models: Peer-to-Peer vs Client-Server

Early multiplayer games used peer-to-peer (P2P) networking. Every player's machine talked to every other machine directly. This worked for small groups — two players in a fighting game, four in a racing game. But P2P has serious flaws. Each player must connect to every other player. With 8 players, that means 28 connections. With 64, it means 2,016. Bandwidth explodes.

Worse, in P2P, every machine has equal authority. If one player modifies their local game state, there is no referee to overrule them. Cheating becomes trivial.

Client-server solves both problems. One central machine — the server — runs the real simulation. Players connect only to that server. With 64 players, you need just 64 connections. And because the server owns the truth, cheaters cannot simply rewrite reality.

> **Word Notes**
> - *forged* /fɔːrdʒd/ — 伪造的。"The attacker sent forged packets to trick the server."
> - *overrule* /ˌoʊvərˈruːl/ — 否决，推翻。"The referee overruled the goal."

## The Authoritative Server

An authoritative server does not ask the client what happened. It tells the client what happened. The client sends inputs — "I pressed W" or "I clicked at position (340, 200)." The server receives those inputs, simulates the result, and sends back the new game state. If the client claims to be at coordinates (999, 999) but the server calculated (100, 50), the server wins.

This is the golden rule Valve popularized with the Source engine in 2004. Half-Life 2, Counter-Strike: Source, and later CS:GO all followed this model. The server runs the physics, resolves hit detection, and decides who lives and who dies. The client is just a window into the server's world.

## Thin Clients vs Thick Clients

Not all clients are equally "dumb." A thin client sends raw inputs and renders whatever the server returns. It is simple and cheat-resistant, but it feels sluggish — every action waits for a server round trip.

A thick client runs its own local simulation. It predicts movement, plays animations, and shows results immediately. The server still has final authority, but the client does not wait. Modern shooters use thick clients. They feel responsive even with 50ms of latency. The trade-off is complexity: the client must handle corrections when its prediction was wrong.

> **Word Notes**
> - *sluggish* /ˈslʌɡɪʃ/ — 迟缓的，反应慢的。"A thin client feels sluggish because every action waits for the server."
> - *authoritative* /əˈθɔːrɪteɪtɪv/ — 权威的，具有最终决定权的。"The authoritative server decides the true game state."

## Dedicated Servers vs Listen Servers

A dedicated server is a machine that only runs the game simulation. It does not render graphics or play sound. It just processes inputs and sends state. Competitive games like CS2 and Valorant use dedicated servers hosted in data centers.

A listen server is a player's own machine acting as both server and client. This saves cost but gives the hosting player an unfair advantage — zero latency. In a 64-tick game, that host has a full 15.6ms head start on every action. Most competitive games abandoned listen servers for this reason.

## The Tick Rate Debate

The server updates the game world in discrete steps called ticks. A 64-tick server simulates 64 frames per second. Each tick lasts 15.6 milliseconds. A 128-tick server halves that to 7.8 milliseconds.

CS:GO famously used 64-tick servers for its official matchmaking. Professional players complained for years. They argued that at 64 tick, fast flick shots could land between two server frames and never register. Valve finally moved CS2 to a new "sub-tick" system that timestamps inputs between ticks, effectively removing the fixed tick rate bottleneck. The debate proved that even milliseconds matter in competitive play.

> **Word Notes**
> - *discrete* /dɪˈskriːt/ — 离散的，不连续的。"The server updates the world in discrete steps, not continuously."
> - *bottleneck* /ˈbɑːtlnek/ — 瓶颈。"The 64-tick rate became a bottleneck for competitive play."

*In multiplayer games, the server is not just a host — it is the judge, the referee, and the only version of reality that counts.*
