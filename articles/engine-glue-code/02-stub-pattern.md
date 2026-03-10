---
layout: article
title: "The Stub Pattern: .py Meets .pyi"
description: "How documentation stubs and type hint files work together for IDE support"
level: intermediate
tags: ["Game Engine", "English", "Reading"]
series: engine-glue-code
series_title: "Engine Glue Code: English Reading"
order: 2
prev:
  title: "What Is Glue Code?"
  url: "01-what-is-glue-code.html"
next:
  title: "Entity-Component Wrappers"
  url: "03-entity-component-wrappers.html"
---

You open your IDE, type `entity.Transform`, and instantly see a tooltip: "Returns Matrix4x3." You did not read the C++ source code. You did not search a wiki. The information came from a pair of auto-generated files that most gameplay programmers never think about.

## Two Files, One Truth

In this engine, every C++ class produces two Python files. Take `PyIEntity` as an example. The `.py` file contains full method bodies with docstrings that describe the C++ signature. The `.pyi` file is a **type stub** — it holds only the method signatures with Python type annotations, no docstrings, no logic.

The `.py` file is for humans. It shows parameter names, return types, and sometimes usage examples right in the docstring. The `.pyi` file is for tools. IDEs like PyCharm and VS Code read `.pyi` files to power autocompletion, type checking, and refactoring.

> **Word Notes**
> - *type stub* — 类型存根文件，仅包含函数签名和类型注解。"Type stubs let your IDE understand libraries without running them."
> - *autocompletion* /ˌɔːtəʊkəmˈpliːʃən/ — 自动补全。"Good autocompletion saves hours of flipping through documentation."

## Anatomy of a Stub

A typical `.py` method looks like this: a function named `EnterArea` with a `pass` body and a docstring containing `:param IArea area:` and `:rtype: None`. The corresponding `.pyi` line is just `def EnterArea(self, area: IArea) -> None: ...`. Same information, different audience.

Properties follow the same split. In `.py`, a `@property` decorator with a docstring tells you the C++ type is `Matrix4x3`. In `.pyi`, you get both a getter and a setter with full type annotations, something the `.py` file often omits.

> **Word Notes**
> - *annotation* /ˌænəˈteɪʃən/ — 注解，类型标注。"Python 3 introduced function annotations for optional type hints."
> - *omit* /əˈmɪt/ — 省略。"The documentation omits edge cases for brevity."

## The Generator Behind the Scenes

Nobody writes these files by hand. A code generator parses the C++ headers, extracts class hierarchies, method signatures, and property types, then outputs matching `.py` and `.pyi` files. When the engine adds a new feature, the stubs are regenerated automatically. This keeps the Python layer perfectly in sync with C++.

## Key Takeaways

- `.py` stubs carry docstrings for human readers; `.pyi` stubs carry type hints for IDEs
- Together they provide documentation and tooling without running the actual engine
- A code generator keeps both files in sync with the C++ source

*Two files, one truth — and your IDE never has to guess.*
