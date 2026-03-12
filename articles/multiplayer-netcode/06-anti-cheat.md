---
layout: article
title: "Cheating and Anti-Cheat"
description: "Wallhacks, aimbots, and the arms race — why protecting multiplayer games is an unsolvable problem"
lang: en
level: intermediate
tags: ["Multiplayer Netcode", "Anti-Cheat", "Security", "English Reading"]
series: multiplayer-netcode
series_title: "Multiplayer Netcode: English Reading"
title_suffix: "Multiplayer Netcode: English Reading"
order: 6
prev:
  title: "State Synchronization"
  url: "05-state-sync.html"
---

In January 2023, a professional Valorant player was banned mid-tournament. His aim-assist software had been running undetected for months. Thirty thousand viewers watched his career end in real time. Cheating in online games is not a niche hobby. It is a billion-dollar industry, and fighting it is an endless war.

## Common Cheat Types

Cheats fall into three broad categories. Wallhacks read the game's memory to find enemy positions, then draw them through walls. The data is already on your machine — the cheat simply reveals it. Aimbots intercept your mouse input and snap your crosshair onto enemy heads. A good aimbot fires within 50 milliseconds, faster than any human reaction. Speed hacks manipulate the client's local clock, making a player move at twice the normal speed. All three exploit a fundamental truth: the client cannot be trusted.

> **Word Notes**
> - *intercept* /ˌɪntərˈsept/ — 拦截，截取。"A proxy can intercept network traffic between two servers."
> - *snap* /snæp/ — 快速对准，吸附。"The UI element snaps to the nearest grid line."

## The Authoritative Server Defense

An authoritative server validates every action before applying it. If a player claims to move 200 meters in one frame, the server rejects the request. This prevents speed hacks and teleportation cheats entirely. But it cannot stop everything. Wallhacks only read data — they send nothing suspicious to the server. Aimbots produce inputs that look like a skilled human player. The server sees valid mouse movements arriving at valid coordinates. Nothing appears wrong.

To fight wallhacks, some games use interest management. The server only sends data about enemies the player could actually see. If an enemy is behind three walls, the client never receives their position. Counter-Strike 2 uses this approach. It reduces wallhack effectiveness by about 80%, but edge cases remain near corners and thin cover.

> **Word Notes**
> - *suspicious* /səˈspɪʃəs/ — 可疑的。"The firewall flagged several suspicious login attempts."
> - *edge case* — 边界情况，极端情形。"The algorithm fails on edge cases with empty input."

## Client-Side Anti-Cheat

Modern anti-cheat systems run deep inside your operating system. Easy Anti-Cheat (EAC), BattlEye, and Riot's Vanguard all operate at the kernel level. They scan running processes, detect memory modifications, and block known cheat software before it loads. Vanguard starts when your computer boots — not when you launch the game. This gives it maximum visibility, but also maximum access.

Kernel-level anti-cheat can read every file, monitor every process, and log every driver on your machine. Critics call it spyware. In 2020, security researchers found that a kernel anti-cheat driver contained an exploitable vulnerability. An attacker could use the anti-cheat itself to gain full system control. The privacy debate remains heated: players want fair matches, but many refuse to install software that has deeper access than most viruses.

## Server-Side Detection

A quieter approach uses statistics. The server tracks each player's accuracy, reaction time, headshot ratio, and movement patterns over thousands of rounds. A human player hits headshots 12% of the time. A subtle aimbot might push that to 35%. Over 500 rounds, the difference becomes statistically unmistakable.

Movement validation adds another layer. The server checks if a player's path obeys physics. Did they accelerate beyond the maximum speed for 3 consecutive frames? Did they change direction with zero deceleration? These micro-violations are invisible to spectators but clear to an algorithm.

> **Word Notes**
> - *vulnerability* /ˌvʌlnərəˈbɪləti/ — 漏洞，脆弱性。"The team patched a critical vulnerability in the authentication module."
> - *consecutive* /kənˈsekjətɪv/ — 连续的。"The server crashed three consecutive times during peak hours."

## The Arms Race

Every anti-cheat update triggers a counter-update from cheat developers. Kernel-level detection is bypassed using custom hardware devices that inject inputs through USB. Statistical detection is defeated by "humanization" algorithms that add random delays and intentional misses. New cheats exploit machine learning to aim like a human — imperfect enough to pass statistical tests, but accurate enough to win.

Game companies hire former cheat developers. Cheat developers reverse-engineer anti-cheat patches within days. Riot Games reports banning over 90,000 Valorant accounts per month, yet new cheaters appear continuously. The war has no finish line.

*The only truly cheat-proof game is one where the client knows nothing, sees nothing, and decides nothing — but nobody wants to play that game.*
