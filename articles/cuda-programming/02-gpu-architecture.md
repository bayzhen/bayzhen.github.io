---
layout: article
title: "Inside the GPU"
description: "How the GPU's parallel hardware differs from a CPU — and why that difference matters"
level: beginner
tags: ["CUDA", "GPU", "English", "Reading"]
series: cuda-programming
series_title: "CUDA Programming: English Reading"
order: 2
prev:
  title: "What Is CUDA?"
  url: "01-what-is-cuda.html"
next:
  title: "Thinking in Parallel"
  url: "03-cuda-programming-model.html"
---

Imagine two kitchens. One has a single master chef who can cook anything — soufflés, sauces, complex multi-step dishes. The other has a thousand line cooks, each capable of doing one simple task very fast. Which kitchen feeds more people per hour?

## Two Very Different Designs

A CPU is the master chef. Each core is sophisticated and powerful, capable of handling complex branching logic, large caches, and unpredictable workloads. A modern desktop CPU has 8 to 24 cores. Each one is fast and flexible.

A GPU is the thousand line cooks. A modern NVIDIA GPU contains thousands of small processors called CUDA cores. Each core is simpler than a CPU core — it can't do as many things, and it's slower when working alone. But when all of them work together on the same task, they produce enormous throughput.

> **Word Notes**
> - *sophisticated* /səˈfɪstɪkeɪtɪd/ — 复杂精密的，功能完善的。"A CPU core is sophisticated — it handles complex logic."
> - *throughput* /ˈθruːpʊt/ — 吞吐量，单位时间内处理的数据量。"GPUs achieve enormous throughput on parallel tasks."
> - *workload* /ˈwɜːkləʊd/ — 工作负荷，指系统需要处理的任务量。

## Memory: Speed vs. Capacity

CPUs and GPUs also handle memory differently. A CPU relies on a large, fast cache system to avoid waiting for data from RAM. Cache misses — moments when the CPU needs data that isn't in cache — slow everything down. CPU designers spend enormous chip area on cache to prevent this.

GPUs take the opposite approach. They have less cache per core but compensate with a technique called latency hiding. When one group of GPU threads is waiting for data, the GPU instantly switches to another group that is ready to compute. This context switching happens in a single clock cycle — something a CPU cannot do. The GPU hides its memory delays by always keeping other work queued up.

> **Word Notes**
> - *cache miss* — 缓存未命中，指所需数据不在高速缓存中，需要从慢速内存中读取。
> - *latency hiding* — 延迟隐藏，一种通过切换任务来掩盖内存访问延迟的技术。
> - *context switching* /ˈkɒntekst ˈswɪtʃɪŋ/ — 上下文切换，指处理器从一个任务切换到另一个任务。

## Why This Matters for Programming

Understanding the hardware helps you write better CUDA code. If your program does the same calculation on millions of numbers — matrix multiplication, image filtering, physics simulation — the GPU's thousands of cores will finish the job far faster than a CPU. But if your program is full of if-else branches and depends on the results of previous steps, the GPU's advantages disappear quickly.

Good CUDA programming means matching your algorithm to the hardware's strengths.

## Key Takeaways

- CPUs have a few powerful cores; GPUs have thousands of simpler ones
- GPUs achieve high throughput by running the same operation on many data points
- GPUs hide memory latency by switching between threads instantly
- The best CUDA code is regular, repetitive, and data-parallel

*Know your hardware. Your hardware knows how to be fast — your job is to let it.*
