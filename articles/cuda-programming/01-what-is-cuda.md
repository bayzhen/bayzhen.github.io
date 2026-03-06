---
layout: article
title: "What Is CUDA?"
description: "The origin story of GPU computing and why it changed the world of software"
level: beginner
tags: ["CUDA", "GPU", "English", "Reading"]
series: cuda-programming
series_title: "CUDA Programming: English Reading"
order: 1
next:
  title: "Inside the GPU"
  url: "02-gpu-architecture.html"
---

In 2006, NVIDIA released a technology that most people ignored — and quietly changed computing forever.

## From Graphics to General Computing

GPUs were originally built for one job: drawing pixels on a screen. They were very good at it. A graphics card in 2005 could process millions of triangles per second, running the same math on each one simultaneously. Engineers at NVIDIA noticed something interesting: this ability to run the same operation on thousands of data points at once could be useful far beyond games.

In 2006, NVIDIA released CUDA — Compute Unified Device Architecture. For the first time, programmers could write general-purpose code that ran directly on the GPU. You didn't have to think in terms of pixels or triangles anymore. You could solve physics simulations, financial models, or protein folding problems using the same brute-force parallelism that made games look beautiful.

> **Word Notes**
> - *simultaneously* /ˌsɪməlˈteɪniəsli/ — 同时地。"The GPU processes thousands of pixels simultaneously."
> - *brute-force* — 暴力（计算）方式，指用大量计算能力而非巧妙算法解决问题。"Brute-force parallelism means doing many things at once rather than doing one thing cleverly."
> - *parallelism* /ˈpærəlelɪzəm/ — 并行性，指同时执行多个任务的能力。

## Why It Matters

Before CUDA, if you wanted to speed up a computation, you bought a faster CPU. CPUs are powerful single-threaded processors — great at complex logic, but they have only a handful of cores. A high-end CPU in 2006 had four cores. A GPU from the same era had hundreds of smaller, simpler cores.

CUDA let developers tap into all of those cores at once. A task that took ten minutes on a CPU might finish in twenty seconds on a GPU. This wasn't a small improvement — it was a fundamental shift in what was computationally possible.

> **Word Notes**
> - *tap into* — 利用，开发（资源）。"CUDA lets developers tap into GPU power."
> - *fundamental* /ˌfʌndəˈmentl/ — 根本性的，基础性的。"This was a fundamental shift in computing."

## The Right Tool for the Right Job

CUDA didn't replace CPUs. A CPU is better at tasks that require complex decision-making, varied logic, or sequential steps. A GPU excels when you need to do the same simple operation millions of times. Modern programs often use both: the CPU handles the overall program flow, while the GPU handles the heavy numerical lifting.

This partnership — CPU as the coordinator, GPU as the workhorse — is the foundation of modern AI, scientific computing, and high-performance software.

## Key Takeaways

- CUDA was released in 2006 and enabled general-purpose programming on GPUs
- GPUs have hundreds of simple cores; CPUs have a few powerful ones
- CUDA is best for tasks that repeat the same operation on large amounts of data
- CPUs and GPUs work together — each handles what it does best

*The GPU was always fast. CUDA made it useful.*
