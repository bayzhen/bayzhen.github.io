---
layout: article
title: "Efficiency Without Lower Barriers"
description: "Why AI makes experts faster but doesn't replace the need for expertise"
level: intermediate
tags: ["Game Dev", "AI", "English", "Reading"]
series: game-dev-ai-era
series_title: "Game Dev in the AI Era: English Reading"
order: 3
prev:
  title: "Why Game Dev Resists Automation"
  url: "02-why-game-dev-resists.html"
next:
  title: "The Missing Layer"
  url: "04-missing-layer.html"
---

Here's a thought experiment. You know nothing about rendering. You ask an AI to write a custom shader for your game. It produces 200 lines of HLSL code. Now what?

## The Judgment Problem

You can't tell if the shader is correct by looking at it — you don't know HLSL. You run it, and the result looks wrong. But you can't describe *what* is wrong, because you don't have the vocabulary. Is it a lighting issue? A normal map problem? A coordinate space mismatch? Without domain knowledge, you can't even formulate the right question to ask the AI for a fix. You're stuck in a loop: the AI generates, you can't evaluate, so you can't iterate.

> **Word Notes**
> - *shader* /ˈʃeɪdər/ — 着色器，GPU上运行的图形渲染程序。"A custom shader controls how light interacts with surfaces."
> - *coordinate space* — 坐标空间。"A coordinate space mismatch can make objects render in the wrong position."
> - *iterate* /ˈɪtəreɪt/ — 迭代，反复改进。"Good development requires the ability to iterate quickly."

## AI Amplifies What You Already Have

This is the fundamental truth about AI in game development: it's a multiplier, not a replacement. If you deeply understand Unreal Engine's Gameplay Ability System, AI can help you write boilerplate faster, generate test cases, and draft documentation. You save hours because you can instantly spot mistakes in the output. But if you don't understand GAS at all, AI-generated code is a black box. You might ship it, and it might work — until it doesn't, and then you have no idea why.

> **Word Notes**
> - *boilerplate* /ˈbɔɪlərpleɪt/ — 样板代码，重复性的标准代码。"AI is great at generating boilerplate code."
> - *black box* — 黑箱，指内部运作不透明的系统。"Without domain knowledge, AI output is a black box."
> - *ship it* — 发布/上线（产品）。"We need to ship it by Friday."

## The Expert Gets Faster, The Novice Gets Lost

This creates an interesting paradox. AI doesn't democratize game development the way people expect. It doesn't let a beginner build a AAA game alone. Instead, it lets a senior developer who already knows what they're doing move at twice the speed. The barrier to entry stays the same — or arguably gets higher, because now you're expected to manage AI tools on top of everything else.

The people who benefit most from AI are those who can judge its output. And judgment comes from experience, not from prompts.

## Key Takeaways

- Without domain expertise, you can't evaluate or fix AI-generated code
- AI is a multiplier for existing skills, not a substitute for learning
- Senior developers gain the most from AI — beginners can get stuck in unproductive loops
- The barrier to entry in game development hasn't dropped; the speed limit has risen

*AI doesn't lower the mountain. It gives experienced climbers better gear.*
