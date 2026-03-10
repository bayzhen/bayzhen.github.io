---
layout: article
title: "Engine Module Bindings"
description: "How system-level functions like rendering, physics, and file I/O are exposed to scripts"
level: intermediate
tags: ["Game Engine", "English", "Reading"]
series: engine-glue-code
series_title: "Engine Glue Code: English Reading"
order: 4
prev:
  title: "Entity-Component Wrappers"
  url: "03-entity-component-wrappers.html"
next:
  title: "Type Marshalling Across the Boundary"
  url: "05-type-marshalling.html"
---

Not everything in a game engine is an object you can hold. Frame rate limits, file systems, memory snapshots, window titles — these are system-level concerns that belong to the engine itself. In this engine, they live in **module bindings**: Python files that wrap C++ free functions rather than classes.

## The M-Prefix Convention

The engine names its module stubs with an `M` prefix. `MEngine` handles core engine functions. `MRender` controls rendering. `MPhysics` manages the physics simulation. `MResource` deals with asset loading. There are over twenty such modules, each exposing a slice of the engine's capabilities.

Take `MEngine` as an example. It contains functions like `SetFrameLimit(fps)`, `SetWindowTitle(title)`, `AddCallback(delay, callback)`, and `FileExist(filepath)`. Some are straightforward wrappers — the Python function simply forwards its arguments to the C++ side. Others include usage examples right in the docstring, showing gameplay programmers exactly how to call them.

> **Word Notes**
> - *free function* — 自由函数，不属于任何类的独立函数。"Module bindings wrap C++ free functions, not class methods."
> - *forward* /ˈfɔːwəd/ — 转发。"The Python wrapper forwards the call to the underlying C++ implementation."

## Callbacks: Bridging Control Flow

The most interesting module functions are the callback registrations. `SetExceptionCallback` lets Python handle its own script errors. `SetEnterInactiveCallback` and `SetLeaveInactiveCallback` notify scripts when the app moves to the background or returns. `SetGameCloseCallback` fires when the player quits.

These functions accept a Python callable and store it on the C++ side. When the engine event occurs, C++ calls back into Python. This inversion of control is fundamental — it means Python scripts do not need to poll for state changes. The engine tells them what happened and when.

> **Word Notes**
> - *inversion of control* — 控制反转，框架调用你的代码而不是你调用框架。"Callback registration is a classic example of inversion of control."
> - *poll* /pəʊl/ — 轮询，反复检查状态。"Polling wastes CPU cycles; callbacks are more efficient."

## Module-Level Properties

`MEngine` also exposes read-only properties: `Version` (the engine build string), `Args` (command-line arguments passed to the Python layer), and `AppName` (the executable name). These use `@property` at the module level — an unusual pattern that reflects how the code generator treats engine singletons.

## Key Takeaways

- Module bindings (M-prefix) expose engine systems as Python functions, not classes
- Callback registration lets the engine push events to Python scripts
- Module-level properties provide read-only access to engine state

*Classes model things. Modules model systems. Together they cover the entire engine.*
