---
layout: article
title: "Client-Side Prediction"
description: "Move now, verify later — how games feel responsive despite round-trip delays of 100+ milliseconds"
lang: en
level: intermediate
tags: ["Multiplayer Netcode", "Prediction", "English Reading"]
series: multiplayer-netcode
series_title: "Multiplayer Netcode: English Reading"
title_suffix: "Multiplayer Netcode: English Reading"
order: 3
prev:
  title: "Client-Server Architecture"
  url: "02-client-server.html"
next:
  title: "Rollback Netcode"
  url: "04-rollback-netcode.html"
---

You press the W key. Nothing happens. You wait. Two hundred milliseconds later, your character finally moves forward. It feels like playing underwater. Early online shooters worked exactly this way. Every input had to travel to the server, get processed, and travel back before anything appeared on screen. Players hated it.

## The Problem: Round-Trip Delay

A packet from Shanghai to a US West server takes about 80ms one way. The round trip is 160ms. Add server processing time and you get 200ms of input lag. Human perception notices delays above 100ms. At 200ms, movement feels sluggish. Aiming becomes painful. The game is technically functional but emotionally unplayable.

The naive solution is simple: send input to the server, wait for the response, then render. This guarantees correctness. Every frame you see is server-approved. But correctness without responsiveness drives players away.

> **Word Notes**
> - *sluggish* /ˈslʌɡɪʃ/ --- 迟缓的，反应慢的。"The UI felt sluggish on older devices."
> - *render* /ˈrendər/ --- 渲染。"The engine renders 60 frames per second."

## The Insight: Predict Locally, Verify Later

In 1996, John Carmack released QuakeWorld, a patch for Quake's multiplayer mode. It introduced a revolutionary idea: the client does not wait. When you press W, the client immediately simulates your movement using the same physics code as the server. Your character moves on screen right away. Meanwhile, the input is sent to the server in the background.

The server runs its own simulation and sends back authoritative state updates. Most of the time, the client's prediction matches the server's result. The player sees zero delay. The game feels like a single-player experience, even though the real authority lives on the server.

## Input Buffering and Reconciliation

What happens when the server disagrees with the client's prediction? This is where reconciliation comes in.

The client keeps a buffer of recent inputs, each tagged with a sequence number. When the server confirms state for sequence number 42, the client discards inputs 1 through 42. But inputs 43 through 50 have already been predicted locally. The client takes the server's confirmed state at 42, then re-simulates inputs 43 through 50 on top of it. This entire process happens in one frame. The player rarely notices.

This technique is called server reconciliation. It corrects the client without visible jumps, as long as the prediction was close to the server's result.

> **Word Notes**
> - *reconciliation* /ˌrekənsɪliˈeɪʃən/ --- 调和，对账。"Data reconciliation ensures both systems agree."
> - *authoritative* /əˈθɔːrɪteɪtɪv/ --- 权威的。"The server holds the authoritative game state."

## Entity Interpolation

Client prediction works well for the local player. But what about other players? You cannot predict their inputs. Instead, the client uses entity interpolation. It buffers the last two or three state snapshots from the server and smoothly interpolates between them. Remote players always render slightly in the past — typically one snapshot interval behind, around 50 to 100ms.

This creates a tradeoff. Your own character feels instant. Other characters look smooth but are slightly behind reality. For most games, this is an acceptable compromise.

## The Rubber-Band Effect

Sometimes prediction fails badly. Imagine you run forward for 500ms, but the server detects a wall collision that your client missed. The server says you are still at the old position. The client snaps your character backward. This sudden correction is called rubber-banding.

Rubber-banding is the visible cost of incorrect prediction. Common causes include packet loss, high latency spikes, and client-server simulation mismatches. Game developers reduce it by ensuring both sides run identical physics code, limiting prediction windows, and smoothing corrections over several frames instead of snapping instantly.

> **Word Notes**
> - *interpolation* /ɪnˌtɜːrpəˈleɪʃən/ --- 插值。"Linear interpolation creates smooth transitions between keyframes."
> - *compromise* /ˈkɑːmprəmaɪz/ --- 折中，妥协。"Every network architecture involves some compromise."

*The trick is simple: lie to the player for 200 milliseconds, then quietly fix the lie before anyone notices.*
