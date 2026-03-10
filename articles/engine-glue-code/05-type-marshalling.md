---
layout: article
title: "Type Marshalling Across the Boundary"
description: "How C++ types like Vector3 and Matrix4x3 cross the language boundary into Python"
level: intermediate
tags: ["Game Engine", "English", "Reading"]
series: engine-glue-code
series_title: "Engine Glue Code: English Reading"
order: 5
prev:
  title: "Engine Module Bindings"
  url: "04-engine-module-bindings.html"
next:
  title: "The Camera System: A Tree of Placers"
  url: "06-camera-system.html"
---

When Python says `entity.Transform` and gets back a `Matrix4x3`, something remarkable has happened. A 48-byte C++ struct — twelve floats packed tightly in memory — has been converted into a Python object that you can print, modify, and pass to other functions. This conversion is called **type marshalling**, and it is the trickiest part of any glue code system.

## Primitive Types Are Easy

Simple types need almost no work. A C++ `bool` becomes a Python `bool`. A `float` stays a `float`. An `int32` maps to Python's `int`. The binding layer handles these conversions automatically because both languages agree on what these types mean.

Strings are slightly more complex. C++ uses `std::string` or a custom `String` type with a specific encoding. Python 2 has `str` and `unicode` as separate types. The marshalling layer must decide which direction to convert and handle encoding mismatches gracefully.

> **Word Notes**
> - *marshalling* /ˈmɑːrʃəlɪŋ/ — 数据编排，在不同系统间转换数据格式。"Type marshalling ensures data survives the trip across language boundaries."
> - *encoding mismatch* — 编码不匹配。"An encoding mismatch between C++ and Python can corrupt Chinese characters."

## Math Types: The Heart of the Matter

Game engines live and breathe math types. `Vector3` holds three floats (x, y, z). `Vector4` holds four. `Color3` stores RGB values. `Matrix4x3` represents a transformation — position, rotation, and scale combined. `Guid` is a unique identifier.

These are all defined in `MType`, a dedicated module that wraps each C++ struct as a Python class. `Color3(r, g, b)` can be constructed from three floats. `Guid` can be created empty or from a string. Each type supports `clone()` for safe copying and `__repr__()` for readable printing.

> **Word Notes**
> - *struct* /strʌkt/ — 结构体，C/C++ 中的数据聚合类型。"A Vector3 struct contains just three float fields."
> - *clone* /kləʊn/ — 克隆，创建深拷贝。"Always clone math types if you need an independent copy."

## Collections Cross Too

The binding layer also handles collections. A C++ `std::vector<IComponent*>` becomes a Python `List[IComponent]`. When you access `entity.Primitives`, the engine builds a Python list of wrapped component objects on the fly. Modifying this list in Python pushes changes back to C++.

This is where performance matters. Building Python objects for every element in a large list is expensive. Well-designed glue code uses lazy evaluation or caching to avoid unnecessary conversions.

> **Word Notes**
> - *lazy evaluation* — 惰性求值，只在需要时才计算。"Lazy evaluation avoids converting hundreds of components when you only need one."
> - *on the fly* — 即时地，动态地。"The wrapper builds Python objects on the fly as you access them."

## Key Takeaways

- Primitive types (bool, float, int) marshal automatically between C++ and Python
- Math types (Vector3, Matrix4x3, Color3) are wrapped as constructable Python classes in `MType`
- Collections convert between `std::vector` and Python lists, with performance implications

*Data does not care what language it lives in — as long as someone translates faithfully.*
