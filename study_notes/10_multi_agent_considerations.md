# 10. Multi-Agent Considerations

Intuition: In multi-agent RL, the world model must absorb opponent adaptation, so transition dynamics are nonstationary from each agent's perspective.

If opponents learn, then transition probabilities drift over training. A single-agent model \(p(s_{t+1}\mid s_t,a_t^i)\) is incomplete because next state also depends on other agents' actions or latent intents.

Equation lines:
\[
p(s_{t+1}\mid s_t,a_t^i,a_t^{-i})
\]
\[
p(s_{t+1}\mid s_t,a_t^i,z_t^{-i})
\]

Opponent modeling can be integrated by conditioning dynamics on inferred opponent embeddings. This improves prediction and strategic anticipation but increases model complexity and sensitivity to policy drift.

Population-based training broadens opponent distribution and improves robustness, yet it also increases nonstationarity rate. Stabilization often needs recency-aware replay weighting, slower target updates, and periodic evaluation against fixed policy snapshots.

World models in self-play can overfit to transient metas if data refresh is not diverse. Maintaining archived opponent pools and conditioning on opponent fingerprints helps retain broad validity.

Practical game AI insight: Log opponent identity or policy-hash metadata in replay and feed it into world-model conditioning to reduce nonstationarity-induced prediction collapse.


