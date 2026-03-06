---
layout: article
title: "Getting Started with CUDA"
description: "Your first steps toward writing real CUDA code — tools, resources, and a practical roadmap"
level: intermediate
tags: ["CUDA", "GPU", "English", "Reading"]
series: cuda-programming
series_title: "CUDA Programming: English Reading"
order: 5
prev:
  title: "CUDA and AI"
  url: "04-cuda-in-ai.html"
---

The hardest part of learning CUDA isn't the concepts — it's getting your first program to compile and run. Once you see "Hello from thread 0" print out, everything becomes real.

## What You Need

To write CUDA code, you need three things. First, an NVIDIA GPU — any modern NVIDIA card will work, including laptop GPUs from the GeForce RTX series. Second, the **CUDA Toolkit**, which NVIDIA provides for free. It includes the `nvcc` compiler, libraries, and debugging tools. Third, a basic understanding of C or C++, since CUDA is an extension of C++.

If you don't have a local GPU, cloud platforms like Google Colab give you free access to NVIDIA GPUs in your browser. This is the fastest way to get started without spending any money.

> **Word Notes**
> - *compile* /kəmˈpaɪl/ — 编译，将源代码转换为可执行程序的过程。"You compile CUDA code with the nvcc compiler."
> - *toolkit* /ˈtuːlkɪt/ — 工具包，一套配套使用的软件工具集合。
> - *extension* /ɪkˈstenʃn/ — 扩展，在现有语言基础上增加新功能。"CUDA is an extension of C++."

## Your First CUDA Program

A CUDA program has two parts: CPU code (called **host** code) and GPU code (called **device** code). The host launches kernels and manages memory. The device runs the actual parallel computation.

The key steps in any CUDA program are:
1. Allocate memory on the GPU with `cudaMalloc`
2. Copy data from CPU to GPU with `cudaMemcpy`
3. Launch your kernel with `<<<grid, block>>>` syntax
4. Copy results back from GPU to CPU
5. Free GPU memory with `cudaFree`

This pattern — allocate, copy, compute, copy back, free — appears in nearly every CUDA program you'll ever write. Master it, and you understand the structure of GPU programming.

> **Word Notes**
> - *allocate* /ˈæləkeɪt/ — 分配（内存），为程序预留一块内存空间。"cudaMalloc allocates memory on the GPU."
> - *syntax* /ˈsɪntæks/ — 语法，编程语言中规定的书写格式和规则。"The <<<grid, block>>> syntax is unique to CUDA."

## A Roadmap for Learning

After your first working program, a practical path forward looks like this. Start with **vector addition** — adding two arrays element by element. It's the simplest possible parallel problem. Then move to **matrix multiplication**, which is more complex but immediately useful. After that, explore **memory optimization**: using shared memory, avoiding bank conflicts, and coalescing memory accesses. These techniques can double or triple your program's performance without changing the algorithm.

The official NVIDIA documentation is excellent and freely available. The book *CUDA by Example* by Jason Sanders is approachable for beginners. And NVIDIA's own online courses offer structured learning with hands-on exercises.

> **Word Notes**
> - *coalescing* /ˌkəʊəˈlesɪŋ/ — 合并，在CUDA中指将多个线程的内存访问合并为一次高效的内存事务。"Coalescing memory accesses is critical for GPU performance."
> - *approachable* /əˈprəʊtʃəbl/ — 易于理解的，对初学者友好的。"The book is approachable for beginners."

## Key Takeaways

- You need an NVIDIA GPU, the CUDA Toolkit, and C/C++ basics to get started
- Google Colab provides free GPU access for learning without local hardware
- Every CUDA program follows the pattern: allocate → copy → compute → copy back → free
- Start with vector addition, then matrix multiplication, then memory optimization

*The first compile error is frustrating. The first correct output is addictive. Start today.*
