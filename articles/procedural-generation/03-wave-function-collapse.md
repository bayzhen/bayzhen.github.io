---
layout: article
title: "Wave Function Collapse"
description: "A quantum physics metaphor turned level design tool — how WFC generates coherent worlds from tiny example tiles"
lang: en
level: intermediate
tags: ["Procedural Generation", "Wave Function Collapse", "English Reading"]
series: procedural-generation
series_title: "Procedural Generation: English Reading"
title_suffix: "Procedural Generation: English Reading"
order: 3
prev:
  title: "Random with Rules"
  url: "02-random-with-rules.html"
next:
  title: "Dungeon Generation Algorithms"
  url: "04-dungeon-generation.html"
---

In 2016, a Russian programmer named Maxim Gumin posted a GitHub repo with a strange name: WaveFunctionCollapse. It contained a single algorithm that could look at a tiny 3x3 pixel pattern and generate an infinite, coherent world from it. The repo got 20,000 stars. Game developers paid attention.

## The Quantum Metaphor

The name comes from quantum physics. Think of Schrodinger's cat: before you open the box, the cat is both alive and dead at the same time. This state of multiple possibilities existing together is called superposition. The moment you observe the cat, the possibilities collapse into one definite state.

WFC applies this idea to grids. Imagine a 100x100 map where every cell starts in superposition — it could be grass, water, sand, or forest. Nothing is decided yet. Then the algorithm "observes" one cell, forcing it to become a specific tile. That observation ripples outward, eliminating impossible options from neighboring cells.

> **Word Notes**
> - *superposition* /ˌsuːpərpəˈzɪʃən/ — 叠加态。"In superposition, a quantum particle exists in multiple states simultaneously."
> - *coherent* /koʊˈhɪrənt/ — 连贯的，一致的。"The algorithm produces coherent landscapes, not random noise."

## How the Algorithm Works

The process has three steps, repeated until every cell is resolved.

**Step 1: Find the lowest-entropy cell.** Entropy here means "number of remaining possibilities." A cell that could be 8 different tiles has high entropy. A cell that could only be 2 tiles has low entropy. The algorithm always picks the most constrained cell first.

**Step 2: Collapse it.** Randomly choose one of the remaining options for that cell. This is the "observation" moment. The tile is now fixed.

**Step 3: Propagate constraints.** This is the critical part. Every tile has adjacency rules — grass can sit next to sand, but water cannot sit next to forest. When one cell collapses, its neighbors lose impossible options. Those neighbors then propagate further. A single collapse can cascade across dozens of cells.

Repeat until the grid is full. In practice, a 64x64 map resolves in under 50 milliseconds.

> **Word Notes**
> - *entropy* /ˈentrəpi/ — 熵，混乱度。"The algorithm picks the cell with the lowest entropy first."
> - *propagate* /ˈprɑːpəɡeɪt/ — 传播，扩散。"Constraints propagate outward from the collapsed cell."

## Learning Rules from Examples

Here is the clever part: you do not write adjacency rules by hand. You feed the algorithm a small example image — say, a 16x16 pixel art landscape. The algorithm scans every NxN patch, records which patterns appear next to which, and extracts the rules automatically. Give it a picture of a coastline, and it learns that sand transitions to water through a shallow strip. Give it a picture of a dungeon, and it learns that corridors connect to rooms through doorways.

This is called the "overlapping model." There is also a simpler "tile model" where you manually define a set of tiles and their allowed neighbors. Most game implementations use the tile model because it gives designers more control.

## Games That Use WFC

Bad North, a minimalist real-time tactics game, uses WFC to generate its island maps. Each island looks hand-crafted, with cliffs flowing naturally into beaches. Townscaper, by Oskar Stalberg, uses a modified WFC to turn mouse clicks into beautiful seaside villages. Caves of Qud, a sprawling roguelike, uses WFC for its overworld terrain generation.

The appeal is clear: WFC output looks designed. Unlike pure noise-based generation, WFC guarantees local consistency. Every tile fits its neighbors perfectly.

> **Word Notes**
> - *adjacency* /əˈdʒeɪsənsi/ — 邻接关系。"Adjacency rules define which tiles can sit next to each other."
> - *sprawling* /ˈsprɔːlɪŋ/ — 庞大蔓延的。"The sprawling open world took 200 hours to explore."

## When WFC Fails

WFC is not bulletproof. Sometimes constraint propagation paints the algorithm into a corner — a cell has zero remaining options. This is called a contradiction. The algorithm must either backtrack (undo recent collapses and try again) or restart entirely.

Backtracking is expensive. On a 128x128 grid with 50 tile types, contradictions can trigger hundreds of rollbacks. Some implementations set a retry limit: if the map fails after 10 attempts, fall back to a simpler generator. Others use heuristics to reduce contradiction rates, like weighted random selection that favors common tiles.

There is also a scalability issue. WFC works beautifully for small, bounded areas — a single room, an island, a village block. But generating a vast open world entirely with WFC is impractical. Most studios combine WFC with other techniques: use Perlin noise for the macro layout, then apply WFC locally to fill in details.

*The wave collapses, and from pure possibility, a world appears — tile by perfect tile.*
