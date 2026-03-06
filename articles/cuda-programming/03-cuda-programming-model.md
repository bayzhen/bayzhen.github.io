---
layout: article
title: "Thinking in Parallel"
description: "Threads, blocks, and grids — the core concepts that make CUDA code work"
level: intermediate
tags: ["CUDA", "GPU", "English", "Reading"]
series: cuda-programming
series_title: "CUDA Programming: English Reading"
order: 3
prev:
  title: "Inside the GPU"
  url: "02-gpu-architecture.html"
next:
  title: "CUDA and AI"
  url: "04-cuda-in-ai.html"
---

If you've ever written a `for` loop that processes a large array, you already understand the problem CUDA solves. The question is: instead of going one element at a time, can we process all of them at once?

## The Kernel: Code for the GPU

In CUDA, a function that runs on the GPU is called a **kernel**. You write it in a C-like language, and when you "launch" it, the GPU runs that same function on thousands of data points simultaneously. Each instance of the function is called a **thread**.

Think of the kernel as a recipe, and each thread as one cook following that recipe — but each cook works on a different ingredient. A thousand threads means a thousand cooks, all running the same recipe in parallel, each starting from their own piece of data.

> **Word Notes**
> - *kernel* /ˈkɜːnl/ — 在CUDA中指在GPU上执行的函数（与操作系统内核是不同概念）。"A CUDA kernel is a function that runs on thousands of GPU threads."
> - *launch* — 在CUDA语境中指启动（内核函数在GPU上执行）。"You launch a kernel from CPU code."
> - *instance* /ˈɪnstəns/ — 实例，某个函数或对象的一个具体执行副本。

## Threads, Blocks, and Grids

CUDA organizes threads into a three-level hierarchy. At the bottom are **threads** — individual execution units. Threads are grouped into **blocks**. Blocks are grouped into a **grid**.

Why the grouping? Threads within the same block can share a small, fast memory called **shared memory** and can synchronize with each other. Threads in different blocks cannot communicate directly. This design reflects the physical layout of the GPU: each block runs on one streaming multiprocessor (SM), and the GPU has many SMs working independently.

When you launch a kernel, you specify the grid size (how many blocks) and the block size (how many threads per block). A typical launch might use 256 threads per block and thousands of blocks — putting hundreds of thousands of threads to work at once.

> **Word Notes**
> - *hierarchy* /ˈhaɪərɑːki/ — 层级结构，按级别组织的体系。"CUDA uses a three-level hierarchy: thread, block, grid."
> - *synchronize* /ˈsɪŋkrənaɪz/ — 同步，让多个执行单元在某个点等待彼此。"Threads in a block can synchronize at a barrier."
> - *streaming multiprocessor* — 流式多处理器，GPU的基本计算单元，包含多个CUDA核心。

## The Thread Index

Every thread knows its own position. CUDA provides built-in variables like `threadIdx.x`, `blockIdx.x`, and `blockDim.x` that each thread uses to figure out which piece of data it should process. A thread's global index is typically calculated as:

```
int i = blockIdx.x * blockDim.x + threadIdx.x;
```

This one line maps each thread to a unique element in an array. With a million threads, you process a million elements in parallel — in the same time it takes one thread to process one.

## Key Takeaways

- A CUDA kernel is a GPU function that many threads run simultaneously
- Threads are organized into blocks, and blocks into a grid
- Threads in the same block can share memory and synchronize
- Each thread uses its index to identify which data it should work on

*The loop that once ran a million iterations can become a million threads — each doing one iteration at the same time.*
