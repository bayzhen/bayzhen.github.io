---
layout: article
title: "The Confidence Fallback: A Better Way"
description: "How a simple confidence check eliminates the need for integer quantization entirely"
level: intermediate
tags: ["Game Dev", "English", "Reading"]
series: nn-frame-sync
series_title: "Neural Networks in Frame-Sync Games: English Reading"
order: 6
prev:
  title: "Deploying ML Models in Live Games"
  url: "05-deployment-tradeoffs.html"
---

What if the entire integer quantization approach is solving the wrong problem? Floating-point differences across devices are real, but they are tiny — on the order of one ten-thousandth. They only cause trouble when two output values are so close that a tiny nudge flips the winner. So instead of rewriting the entire inference engine in integer math, why not simply detect those ambiguous moments and handle them differently?

## The Core Idea

After the neural network outputs action probabilities, check whether the top choice is clearly ahead of the runner-up:

```python
probs = model.forward(state)
top1, top2 = sorted(probs)[-2:]

if top1 - top2 > threshold:
    action = argmax(probs)      # confident — use the model
else:
    action = rule_fallback(state)  # ambiguous — use deterministic rules
```

When the model is confident, floating-point differences cannot change the argmax. When the model is uncertain, a simple rule-based fallback takes over — and rule-based logic is perfectly deterministic. Desync risk drops to nearly zero.

> **Word Notes**
> - *runner-up* /ˈrʌnər ʌp/ — 亚军，第二名。"The runner-up was only 0.001 points behind."
> - *ambiguous* /æmˈbɪɡjuəs/ — 模棱两可的。"Ambiguous requirements lead to buggy software."

## Setting the Threshold

The threshold must be larger than the maximum possible floating-point divergence across platforms. For a four-layer MLP using float32, the accumulated output difference is typically in the range of `1e-4` to `1e-3`. A threshold of `0.01` provides roughly a 10x safety margin.

But you do not need to guess. Run the same batch of inputs on a handful of devices covering major chip architectures — x86, ARM with NEON, and Apple Silicon. Record the maximum output difference. Multiply by 10 for safety. That is your threshold.

You only need three to five devices because floating-point behavior depends on chip architecture, not the specific phone model. All ARM NEON chips behave the same way. Testing a hundred phones would just confirm what three already told you.

> **Word Notes**
> - *divergence* /daɪˈvɜːrdʒəns/ — 分歧，偏差。"Monitor divergence between predicted and actual values."
> - *margin* /ˈmɑːrdʒɪn/ — 余量。"Always design with a safety margin."

## Train for Confidence

Here is where it gets elegant. You can train the model to be more decisive by adding an entropy penalty to the loss function:

```python
entropy = -(probs * log(probs)).sum()
loss = cross_entropy_loss + alpha * entropy
```

High entropy means the model is spreading probability evenly across actions — it is indecisive. Penalizing entropy pushes the model to commit to one action with high confidence. The hyperparameter `alpha` (typically 0.01 to 0.1) controls how aggressively you enforce this.

The beauty is that this aligns perfectly with game design goals. In a football game, a decisive AI that commits to a clear action looks and feels better than one that hesitates. The engineering requirement and the gameplay requirement point in the same direction.

> **Word Notes**
> - *entropy* /ˈentrəpi/ — 熵。In information theory, a measure of uncertainty or randomness in a distribution.
> - *indecisive* /ˌɪndɪˈsaɪsɪv/ — 犹豫不决的。"An indecisive AI looks broken to the player."

## What You Gain

Compare this approach to integer quantization:

| | Integer Quantization | Confidence Fallback |
|---|---|---|
| Inference engine | Custom, self-maintained | Standard ONNX Runtime |
| Model precision | ~3 decimal places | Full float32 |
| Mobile acceleration | Manual SIMD work | NNAPI / CoreML for free |
| Model iteration speed | Train → export → convert → deploy | Train → export → deploy |
| Model security | Weights in plaintext source code | Binary format, harder to read |
| Determinism guarantee | Absolute | Effectively absolute with threshold |

The integer approach trades away the entire modern ML ecosystem to achieve absolute determinism. The confidence fallback achieves the same practical result while keeping everything else.

## Key Takeaways

- Floating-point differences only matter when two outputs are nearly tied — detect and avoid those cases
- A confidence threshold of `0.01` with rule-based fallback eliminates desync risk in practice
- Entropy penalty during training makes the model naturally more decisive, reducing fallback frequency
- This approach preserves full access to ONNX Runtime, hardware acceleration, and standard tooling

*Do not rebuild the engine to fix a loose screw. Just tighten the screw.*
