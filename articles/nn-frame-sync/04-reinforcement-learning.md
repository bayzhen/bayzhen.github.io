---
layout: article
title: "From Imitation to Reinforcement Learning"
description: "How PPO and self-play can push game AI beyond the limits of human imitation"
level: intermediate
tags: ["Game Dev", "English", "Reading"]
series: nn-frame-sync
series_title: "Neural Networks in Frame-Sync Games: English Reading"
order: 4
prev:
  title: "Behavior Cloning: Learning from Humans"
  url: "03-behavior-cloning.html"
next:
  title: "Deploying ML Models in Live Games"
  url: "05-deployment-tradeoffs.html"
---

Behavior cloning can teach an AI to play like a human, but it can never teach an AI to play better than one. To break through that ceiling, you need reinforcement learning — letting the AI learn from its own experience through trial and error. In competitive sports games, this usually means combining PPO with self-play.

## Why Not Jump Straight to RL?

In theory, you could train a football AI from scratch with reinforcement learning. In practice, this is painfully slow. The agent starts knowing nothing — it cannot even chase the ball. The reward signal (win or lose) is extremely sparse. The agent might play thousands of matches before accidentally scoring a goal and receiving its first positive reward.

This is why behavior cloning comes first. A BC-pretrained model already knows how to move, pass, and shoot. When you switch to RL training, the agent starts from a competent baseline rather than random chaos.

> **Word Notes**
> - *sparse* /spɑːrs/ — 稀疏的。"Sparse rewards make RL training slow and unstable."
> - *baseline* /ˈbeɪslaɪn/ — 基准线。"The BC model provides a strong baseline for further training."

## PPO + Self-Play: The Winning Formula

PPO (Proximal Policy Optimization) is the workhorse of modern game RL. It updates the policy conservatively — never changing too much in one step — which makes training stable. For a sports game, the training loop looks like this:

1. Two copies of the current AI play against each other
2. Collect the trajectories (states, actions, rewards) from both sides
3. Update the policy with PPO using win/loss as the reward
4. Repeat with the updated policy

Self-play solves the reward design problem elegantly. You do not need to handcraft dense rewards for "good positioning" or "smart passing." Winning is the only reward that matters, and the opponent automatically scales with the agent's skill level. As the AI improves, its opponent improves too, creating an endless curriculum.

> **Word Notes**
> - *workhorse* /ˈwɜːrkhɔːrs/ — 主力，中坚。"PostgreSQL is the workhorse of many tech companies."
> - *curriculum* /kəˈrɪkjələm/ — 课程体系。In RL, a sequence of progressively harder challenges.

## Scaling Considerations

For a small MLP with 92 input dimensions and 92 discrete actions, synchronous PPO with 32 parallel game environments on a single machine is sufficient. You do not need IMPALA or distributed actor-learner architectures. The game server already runs headlessly and supports acceleration, so each environment can simulate matches far faster than real time.

Only when the model grows significantly larger — say, adding attention layers to process all 22 players individually — would you need to consider distributed training. Start simple, measure the bottleneck, then scale.

> **Word Notes**
> - *headlessly* — 无头地（无图形界面）。"The server runs headlessly, skipping all rendering."
> - *bottleneck* /ˈbɑːtlnek/ — 瓶颈。"Profile first to find the real bottleneck."

## Key Takeaways

- BC pretraining gives RL a competent starting point, avoiding the "random agent" cold start
- Self-play provides a natural reward signal and automatically adjusts difficulty
- Synchronous PPO on one machine is enough for small game AI models — do not over-engineer

*The student begins by copying the teacher, then learns by playing against itself — and eventually surpasses them both.*
