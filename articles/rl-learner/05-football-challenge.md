---
layout: article
title: "Why Football AI Won't Learn (Yet)"
description: "The fundamental challenges of training 11v11 football agents and possible paths forward"
level: intermediate
tags: ["RL Learner", "English", "Reading"]
series: rl-learner
series_title: "RL Learner: English Reading"
order: 5
prev:
  title: "The Optimization Sprint: 7K to 1.2M SPS"
  url: "04-performance.html"
---

The simple chase-target environment converges in minutes. The football environment? After billions of steps, the agents still wander aimlessly. Why?

## The Curse of Sparse Rewards

A football goal is a rare event. An untrained agent must accidentally stumble into a sequence of actions — gain possession, advance the ball, aim, and shoot — before receiving any positive signal. With 12 possible actions per player per step and 500 steps per episode, the chance of randomly scoring is astronomically small. Dense reward shaping helps: small bonuses for possession, positioning, and ball advancement. But these shaped rewards can backfire. An agent might learn to hoard the ball in midfield to collect possession rewards, never attempting the risky pass that could lead to a goal.

> **Word Notes**
> - *aimlessly* /ˈeɪmləsli/ — 漫无目的地。Moving without any clear intention or strategy.
> - *astronomically* /ˌæstrəˈnɒmɪkli/ — 天文数字般地。An extremely small probability.
> - *backfire* /ˌbækˈfaɪə/ — 适得其反。A plan that produces the opposite of the intended result.

## Credit Assignment Across 11 Players

When a goal is scored, who deserves the credit? The striker who kicked the ball? The midfielder who made the through pass? The defenders who held position and enabled the counterattack? Under CTDE with shared weights, all 11 players receive the same team reward. The network must somehow learn that different roles require different behaviors, even though they share the same parameters. This credit assignment problem is hard enough for a single agent. For a team, it becomes exponentially more difficult.

> **Word Notes**
> - *counterattack* /ˈkaʊntərəˌtæk/ — 反击，快速回击。A rapid attack launched after regaining possession.
> - *exponentially* /ˌekspəˈnenʃəli/ — 指数级地。The difficulty grows much faster than the number of agents.

## The Exploration Trap

PPO explores by adding entropy to the policy — encouraging the agent to try different actions rather than committing to one too early. But in football, random exploration is almost always meaningless. A player randomly pressing "shoot" when the ball is 80 meters away learns nothing. Structured exploration — like curriculum learning, where agents first master simpler sub-tasks before combining them — is likely essential. But designing the right curriculum is itself a research problem.

## Possible Paths Forward

Several approaches could help. Curriculum learning would break football into stages: first learn to chase the ball, then learn passing, then learn positioning, then combine everything. Hierarchical reinforcement learning could add a high-level controller that chooses team strategies while low-level policies handle individual movement. Self-play, where both teams are RL agents, could create an arms race that drives emergent behavior. Population-based training could evolve hyperparameters alongside the policy.

> **Word Notes**
> - *emergent* /ɪˈmɜːdʒənt/ — 涌现的。Complex behavior arising from simple rules interacting.
> - *curriculum* /kəˈrɪkjələm/ — 课程体系。A structured sequence of progressively harder tasks.

## Key Takeaways

- Sparse goals and dense shaping create a fundamental tension in reward design
- Shared weights across 11 players make credit assignment extremely difficult
- Random exploration in a complex action space produces almost zero useful signal
- Curriculum learning, hierarchical RL, and self-play are the most promising directions

*The infrastructure works. The speed is there. What remains is the hardest part of AI: teaching machines what we cannot easily put into words.*
