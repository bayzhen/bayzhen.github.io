---
layout: article
title: "Composition Over Inheritance: The Entity-Component System"
description: "How Python decorators and metaclasses build a flexible entity-component architecture"
level: intermediate
tags: ["Game Server", "English", "Reading"]
series: game-server-gameplay
series_title: "Game Server Gameplay Framework: English Reading"
order: 2
prev:
  title: "The Big Picture: Architecture of a Distributed Game Server"
  url: "01-big-picture.html"
next:
  title: "Sync Flags and Smart Properties: Automatic Network Replication"
  url: "03-property-system.html"
---

Imagine building a character that can fight, trade, chat, and ride a mount. With inheritance, you would need a class hierarchy so deep that changing one feature risks breaking three others. This framework takes a different path: composition.

## The Entity Base

Every game object inherits from a single `Entity` class. It provides an ID, registration in a global `EntityManager` singleton, timers, and an optional tick loop. That is all. The Entity itself knows nothing about combat, inventory, or movement.

The real behavior comes from components. A Python decorator called `@Components` lists the mixins an entity needs. A companion metaclass, `@ComponentHost`, weaves them together at class creation time. The result looks like a single class, but its features are assembled from independent modules.

> **Word Notes**
> - *mixin* /ˈmɪksɪn/ — 混入类，提供可复用功能的类。"Each mixin adds one responsibility."
> - *weave* /wiːv/ — 编织，交织。"The metaclass weaves components into the host."
> - *singleton* /ˈsɪŋɡltən/ — 单例，只有一个实例的对象。"The EntityManager is a singleton."

## Lifecycle Hooks

Each component can implement five lifecycle methods:

- `__init_component__()` — set up internal state
- `__post_component__()` — run after all components are initialized
- `__tick_component__(dtime)` — called every frame (if ticking is enabled)
- `__late_update_component__()` — runs after all ticks complete
- `__fini_component__()` — clean up on destruction

The framework calls these hooks automatically in a defined order. A buff component can initialize its timers in `__init_component__` and clean them up in `__fini_component__` without worrying about who else is attached to the same entity.

> **Word Notes**
> - *hook* /hʊk/ — 钩子，回调接口。"The lifecycle hooks fire at predictable moments."
> - *decouple* /diːˈkʌpl/ — 解耦，使分离。"Components decouple features from each other."

## Why Composition Wins

Adding a new feature — say, a pet system — means writing a new component file (`impPet.py`) and adding it to the `@Components` list. No base class changes. No diamond inheritance. No risk of breaking the buff system because you touched the movement code.

The framework imports all components dynamically with `avatar_members.importall()`, so even the component list can change without editing the entity class directly.

## Key Takeaways

- A thin `Entity` base provides ID, timers, and ticking — nothing more
- `@Components` decorator + `@ComponentHost` metaclass assemble behavior at class creation
- Five lifecycle hooks give each component predictable setup, update, and teardown moments
- New features are new files, not new branches in an inheritance tree

*The best class hierarchy is the one you never have to draw.*
