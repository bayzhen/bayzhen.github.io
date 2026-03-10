---
layout: article
title: "Integer Quantization to the Rescue"
description: "How converting neural network weights to integers solves the cross-platform determinism problem"
level: intermediate
tags: ["Game Dev", "English", "Reading"]
series: nn-frame-sync
series_title: "Neural Networks in Frame-Sync Games: English Reading"
order: 2
prev:
  title: "The Determinism Problem"
  url: "01-determinism-problem.html"
next:
  title: "Behavior Cloning: Learning from Humans"
  url: "03-behavior-cloning.html"
---

If floating-point math cannot be trusted across devices, the solution is brutally simple: stop using floating-point math. Multiply every weight by 1024, round to the nearest integer, and do all inference with integer arithmetic. It sounds crude, but it works — and some production games ship exactly this approach.

## How It Works

During training, the neural network learns as usual with float32 weights and gradients. After training, an export script converts every parameter: multiply by a fixed scale factor (say 1024), round, and cast to integer. The entire model — weights, biases, batch normalization parameters — becomes a collection of integer matrices.

At runtime, forward propagation is just integer matrix multiplication followed by integer division to rescale. Activation functions like ReLU are trivial in integers. Sigmoid and tanh require fixed-point math libraries, but those are well-understood and deterministic.

> **Word Notes**
> - *crude* /kruːd/ — 粗糙的，简陋的。"The prototype was crude but functional."
> - *cast* /kæst/ — 类型转换。"Cast the float to int before storing."

## Why Not ONNX with INT8?

ONNX Runtime does support quantized INT8 models. But there is a subtle problem: you do not control the runtime's internal implementation. Does it use integer arithmetic for every intermediate step? Does it accumulate in int32 or secretly promote to float? Different backends (CPU, NNAPI, CoreML) may implement the same operator differently. For a frame-sync game, "probably deterministic" is not good enough.

By writing your own inference engine — even if it is only 100 lines of C++ with Eigen — you have complete control. You know exactly what math runs on every platform because you wrote it yourself.

> **Word Notes**
> - *promote* /prəˈmoʊt/ — （类型）提升。"The compiler may silently promote int16 to int32."
> - *subtle* /ˈsʌtl/ — 微妙的，不易察觉的。"The bug was subtle — it only appeared on ARM devices."

## The Trade-offs

This approach sacrifices precision. A scale factor of 1024 gives you roughly three decimal places of accuracy. For a small MLP deciding whether a player should pass or dribble, that is plenty. For a large vision model processing pixel data, it would be disastrous. The technique works precisely because game AI models are small — a four-layer MLP with a few hundred neurons is typical.

There is also a security concern: some implementations embed the integer weights directly as plaintext arrays in source code. Anyone who unpacks the game client can read the complete model architecture and every weight value. A binary serialization format would be more appropriate for production.

## Key Takeaways

- Integer arithmetic is deterministic across all platforms — no rounding surprises
- Custom inference engines give full control over computation, unlike third-party runtimes
- The precision loss is acceptable for small game AI models but limits model complexity

*Sometimes the most reliable engineering is also the most boring: just use integers.*
