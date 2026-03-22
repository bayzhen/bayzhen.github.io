---
layout: article
title: "Kernel-Based Programming in Warp"
description: "How Warp's JIT compiler turns Python functions into GPU kernels — and what the programming model actually looks like in practice."
level: intermediate
tags: ["NVIDIA Warp", "English", "Reading"]
series: nvidia-warp
series_title: "NVIDIA Warp: English Reading"
order: 2
prev:
  title: "What Is NVIDIA Warp?"
  url: "01-introduction.html"
next:
  title: "Differentiable Simulation"
  url: "03-differentiable-simulation.html"
---

A single line of Python can hide a million GPU operations. In Warp, that is not an exaggeration — it is the design goal.

## What Is a Kernel?

In GPU computing, a *kernel* is a function that runs independently on thousands of GPU cores at the same time. Each core executes the same code but operates on a different piece of data. This is the foundation of all GPU speed.

In traditional CUDA, you write kernels in C++, annotate them with special keywords, and manage memory manually. Warp hides all of that. You decorate a Python function with `@wp.kernel`, and Warp handles the rest at compile time.

> **Word Notes**
> - *kernel* /ˈkɜːrnl/ — （GPU）内核函数。A function designed to run in parallel across many GPU threads simultaneously.
> - *annotate* /ˈænəteɪt/ — 用注解标记。"You annotate the function to tell the compiler how to treat it."
> - *decorate* — （编程）装饰、添加装饰器。"In Python, you decorate a function by placing `@something` above its definition."

## A Concrete Example

Here is a minimal Warp kernel that adds two arrays element by element:

```python
import warp as wp

@wp.kernel
def add_arrays(a: wp.array(dtype=float),
               b: wp.array(dtype=float),
               out: wp.array(dtype=float)):
    i = wp.tid()       # get this thread's index
    out[i] = a[i] + b[i]
```

When you launch this kernel with one million elements, Warp runs one million threads in parallel — each thread handles one index `i`. The `wp.tid()` call returns the current thread's unique ID, replacing the loop you would write in pure Python.

> **Word Notes**
> - *element by element* — 逐元素地。Processing each individual item in an array separately.
> - *thread* — （GPU）线程。The smallest unit of parallel execution on a GPU.
> - *launch* — 启动（内核）。"Launching a kernel means telling the GPU to start executing it."

## Type Annotations Matter

Warp requires explicit type annotations on all kernel arguments. This is not optional styling — the JIT compiler uses these types to generate correct, efficient CUDA code. Warp supports a rich set of types: scalars (`float`, `int`), vectors (`wp.vec3`, `wp.mat44`), and higher-level structures like `wp.Mesh` and `wp.HashGrid`.

This type strictness is a deliberate trade-off. You give up a little Python flexibility in exchange for predictable, high-performance code generation. For simulation workloads, that is almost always the right choice.

## CPU and GPU Targets

By default, Warp compiles kernels for the GPU. But you can also target the CPU:

```python
wp.launch(add_arrays, dim=N, inputs=[a, b, out], device="cpu")
```

This makes it easy to debug logic on the CPU before moving to the GPU, without rewriting any code. The same kernel runs on both targets.

## Key Takeaways

- A Warp kernel is a Python function decorated with `@wp.kernel` that runs in parallel on the GPU.
- `wp.tid()` gives each thread its own index — replacing explicit loops.
- Type annotations are required and drive efficient code generation.

*Write it once in Python, run it on a million GPU cores — that is the Warp bargain.*
