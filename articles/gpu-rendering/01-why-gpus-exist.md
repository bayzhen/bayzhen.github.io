---
layout: article
title: "Why GPUs Exist"
description: "The parallel processing revolution that changed computing forever"
level: beginner
tags: ["GPU", "Rendering", "English", "Reading"]
series: gpu-rendering
series_title: "GPU Rendering: English Reading"
order: 1
next:
  title: "The Rendering Pipeline"
  url: "02-the-rendering-pipeline.html"
---

Your CPU is fast. It can juggle complex logic, branch predictions, and operating system tasks all at once. So why do we need a separate chip just to draw pictures? The answer lies in a simple math problem.

## The Pixel Problem

A 1920x1080 screen has over two million pixels. At sixty frames per second, that means updating over 120 million pixels every second. Each pixel needs color calculations — lighting, shadows, transparency. A CPU processes instructions one at a time, or at best across a handful of cores. Even the fastest CPU cannot keep up with this workload.

> **Word Notes**
> - *juggle* /ˈdʒʌɡl/ — 同时应付多项任务。"The CPU can juggle complex logic and OS tasks at once."
> - *a handful of* — 少数的，几个。"A CPU has at best a handful of cores."

## Parallelism to the Rescue

GPUs solve this with a radically different design. Instead of a few powerful cores, a modern GPU packs thousands of smaller cores. Each core is simpler than a CPU core — it cannot handle complex branching well. But it can perform the same calculation on different data simultaneously. This is called parallelism, and it is exactly what rendering needs.

Think of it this way: a CPU is like one brilliant chef cooking a complex meal. A GPU is like a thousand cooks, each making one simple dish at the same time. When your task is "make two million simple dishes per frame," the thousand cooks win every time.

> **Word Notes**
> - *parallelism* /ˈpærəlelɪzəm/ — 并行性。"GPUs rely on parallelism — thousands of cores working at the same time."
> - *radically* /ˈrædɪkli/ — 根本性地，彻底地。"GPUs use a radically different design from CPUs."

## A Brief History

The first GPUs appeared in the late 1990s. NVIDIA's GeForce 256, released in 1999, was marketed as the world's first GPU. It could handle transform and lighting calculations that previously burdened the CPU. This freed the CPU to focus on game logic, physics, and AI. Over the next two decades, GPUs evolved from fixed-function hardware into fully programmable processors — a shift that would change not just gaming, but scientific computing, machine learning, and beyond.

> **Word Notes**
> - *burdened* /ˈbɜːrdnd/ — 使负担。"Lighting calculations previously burdened the CPU."
> - *fixed-function* — 固定功能的（不可编程的硬件）。"Early GPUs were fixed-function — they could only do what they were wired to do."

## Key Takeaways

- Screens require billions of pixel calculations per second — too many for CPUs alone
- GPUs use thousands of simple cores running in parallel
- The shift from fixed-function to programmable GPUs opened doors far beyond gaming

*Two million pixels, sixty times a second. That's the job. Let's see how the GPU actually does it.*
