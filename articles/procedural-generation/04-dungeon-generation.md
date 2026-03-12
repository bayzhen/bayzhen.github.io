---
layout: article
title: "Dungeon Generation Algorithms"
description: "BSP trees, drunkard's walk, and cellular automata — the classic algorithms behind roguelike dungeon layouts"
lang: en
level: intermediate
tags: ["Procedural Generation", "Dungeon Generation", "English Reading"]
series: procedural-generation
series_title: "Procedural Generation: English Reading"
title_suffix: "Procedural Generation: English Reading"
order: 4
prev:
  title: "Wave Function Collapse"
  url: "03-wave-function-collapse.html"
next:
  title: "Procedural Storytelling"
  url: "05-procedural-storytelling.html"
---

In 1980, a game called Rogue gave players a new dungeon every time they died. No two runs were the same. The trick was simple: let the computer build the map.

## Splitting Rooms with BSP Trees

Binary Space Partitioning, or BSP, is one of the oldest dungeon generation methods. The algorithm starts with a single rectangle — the entire map. It splits that rectangle in half, either horizontally or vertically. Then it splits each half again. This recursive process continues 4 to 6 times, creating a tree of nested regions.

Once the splitting stops, the algorithm places a room inside each leaf node. Rooms are smaller than their regions, so gaps remain between them. Finally, the algorithm connects sibling rooms with corridors by walking up the tree.

BSP dungeons look structured and orderly. That is why the original Rogue used a variant of this approach. Nethack, released in 1987, extended it with special rooms like shops and temples.

> **Word Notes**
> - *recursive* /rɪˈkɜːsɪv/ — 递归的，反复应用自身的。"The recursive function calls itself until it reaches the base case."
> - *sibling* /ˈsɪblɪŋ/ — 兄弟姐妹（此处指同一父节点下的子节点）。"The two sibling nodes share the same parent."

## The Drunkard's Walk

Not all dungeons need straight walls. The drunkard's walk — also called a random walk — produces organic, cave-like spaces. The algorithm places an agent on a solid grid. The agent picks a random direction and carves out one tile. Then it picks another direction at random. It repeats this thousands of times.

The result is a winding, irregular cavern. Designers control the output by setting a target: stop when 40% of tiles are open, for example. Dead Cells uses a variation of random walks to generate its interconnected levels. The caves feel natural because no planning was involved — just wandering.

> **Word Notes**
> - *carve* /kɑːv/ — 雕刻，挖出。"The river carved a deep valley through the mountains."
> - *winding* /ˈwaɪndɪŋ/ — 蜿蜒的，曲折的。"A winding path led through the forest."

## Cellular Automata for Caverns

Cellular automata take a different approach. Start with a grid where each cell is randomly set to wall or floor — typically 45% walls. Then apply a simple rule: if a cell has 5 or more wall neighbors out of 8, it becomes a wall. Otherwise, it becomes floor. Run this rule 4 to 5 times across the entire grid.

The result is stunning. Rough noise transforms into smooth, natural-looking caverns with rounded edges. The process resembles erosion in nature. Diablo used cellular automata to generate parts of its underground levels, creating the dark, sprawling caves beneath Tristram.

## Connecting the Pieces

Rooms and caves are useless without corridors. The simplest method is the L-shaped corridor: draw a horizontal line from one room's center, then a vertical line to the other room's center. Two straight segments, one turn.

For smarter paths, developers use A* pathfinding. A* finds the shortest route between two rooms while avoiding obstacles. The algorithm assigns a cost to each tile — open tiles are cheap, walls are expensive to dig through. This produces corridors that feel intentional rather than random.

Enter the Gungeon combines BSP-like room placement with hand-designed room templates. The generator picks rooms from a library and connects them with short corridors, blending procedural structure with authored content.

> **Word Notes**
> - *sprawling* /ˈsprɔːlɪŋ/ — 蔓延的，不规则扩展的。"The sprawling city covered hundreds of square kilometers."
> - *intentional* /ɪnˈtenʃənəl/ — 有意的，刻意的。"The design choice was intentional, not accidental."
> - *authored* /ˈɔːθəd/ — 人工创作的（与程序生成相对）。"The level mixed authored content with procedural elements."

## Choosing the Right Algorithm

Each method has a personality. BSP trees create structured, room-based layouts — perfect for traditional roguelikes. The drunkard's walk produces messy, organic caves — ideal for wilderness areas. Cellular automata generate smooth, natural caverns — great for underground environments. Most modern games combine two or three methods in a single map.

The original Rogue proved something important in 1980. Players do not need hand-crafted perfection. They need surprise. A good dungeon generator delivers exactly that — a new world behind every door.

*The best dungeons are not designed. They are grown, one algorithm at a time.*
