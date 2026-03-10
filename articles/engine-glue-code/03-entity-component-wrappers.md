---
layout: article
title: "Entity-Component Wrappers"
description: "How C++ entities and components become Pythonic objects with properties and events"
level: intermediate
tags: ["Game Engine", "English", "Reading"]
series: engine-glue-code
series_title: "Engine Glue Code: English Reading"
order: 3
prev:
  title: "The Stub Pattern: .py Meets .pyi"
  url: "02-stub-pattern.html"
next:
  title: "Engine Module Bindings"
  url: "04-engine-module-bindings.html"
---

In C++, a game entity is a pointer juggling act — raw memory, manual reference counting, and verbose getter/setter pairs. In Python, the same entity feels like a natural object: `entity.IsVisible = True`. The glue layer makes this transformation possible.

## The Inheritance Chain

The engine organizes its C++ objects in a clean hierarchy. At the base sits `IObject`, which provides `IsValid()`, `GetName()`, and `BindEvent()`. One level up, `IComponent` adds a `Parent` property. Then `IEntity` extends `IObject` with dozens of properties — `Transform`, `Skeleton`, `IsVisible`, `RigidBodies` — and methods like `Attach()` and `Detach()`.

The Python stubs mirror this chain exactly. `PyIObject.py` defines `class IObject(object)`. `PyIComponent.py` defines `class IComponent(IObject)`. `PyIEntity.py` defines `class IEntity(IObject)`. A gameplay programmer who inherits from these classes gets the full engine API without touching C++.

> **Word Notes**
> - *hierarchy* /ˈhaɪərɑːrki/ — 层级结构。"The class hierarchy reflects real-world relationships between engine objects."
> - *verbose* /vɜːˈbəʊs/ — 冗长的。"C++ property access is often more verbose than Python's."

## Properties as Python Attributes

The most elegant part of the wrapper is how C++ properties become Python attributes. In C++, you might call `entity->GetTransform()` and `entity->SetTransform(mat)`. The Python stub uses `@property` decorators to expose these as `entity.Transform` — both readable and writable. The `.pyi` file even generates matching `@Transform.setter` definitions so your IDE knows the property is not read-only.

Entity properties cover a wide range: booleans like `IsMovable` and `IsCastDynamicShadow`, component references like `Skeleton` and `Ragdoll`, and math types like `TintColor1` (a `Color3`) and `LodThreshold` (a `Vector3`).

> **Word Notes**
> - *decorator* /ˈdekəreɪtər/ — 装饰器，Python 中用 `@` 语法标记的函数包装器。"The `@property` decorator turns a method into an attribute-like access."
> - *read-only* — 只读的。"Some properties are read-only because modifying them would break engine invariants."

## Events: Callbacks Across the Boundary

Entities also expose events. `ResourceUpdated` and `TransformChanged` are defined as methods in the stub, but their docstrings mark them as events. Gameplay code can subscribe to these through `BindEvent()`, passing a Python callback that the C++ engine will invoke when the event fires. This pattern lets scripts react to engine-level changes without polling.

## Key Takeaways

- The Python class hierarchy mirrors C++ exactly: `IObject → IComponent → IEntity`
- Properties use `@property` decorators for natural Pythonic access
- Events let Python callbacks respond to C++ engine changes in real time

*What looks like a simple Python object is actually a window into the engine's soul.*
