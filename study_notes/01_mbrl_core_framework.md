# 1. MBRL Core Framework

Intuition: Model-based RL learns a predictive world surrogate so policy improvement can reuse data through imagination instead of paying full simulator cost for every gradient step.

The Dyna loop alternates between real interaction, model fitting, and policy learning. Real transitions ground the agent in reality. Model rollouts expand coverage beyond collected trajectories. Policy updates consume both data streams, with real data acting as anchor and imagined data acting as accelerator.

A clean decomposition is model-learning versus policy-learning. Model-learning minimizes predictive error under replay distribution. Policy-learning maximizes expected return under the policy-induced state distribution. These distributions are different, which is why model bias appears under policy improvement.

Equation lines:
\[
\hat{p}_\theta(s_{t+1}, r_t, c_t \mid s_t, a_t)
\]
\[
\pi^* = \arg\max_\pi \mathbb{E}_{\tau \sim (\pi, M)}\left[\sum_t \gamma^t r_t\right]
\]
\[
\tau_{\text{train}} \sim \alpha\,\mathcal{D}_{\text{real}} + (1-\alpha)\,\mathcal{D}_{\text{model}}
\]

Use a learned model when real simulation is expensive, slow, unsafe, or unavailable at scale. Use a real simulator directly when it is cheap and exact enough, because simulator rollouts have no learned-model bias. In practice, most strong systems are hybrid: real data for correction, model data for speed.

The core tradeoff is sample efficiency versus bias. Model-free methods usually have lower model bias but poor data efficiency. MBRL improves data efficiency by reusing dynamics structure, but long imagination horizons can amplify errors and produce unrealistic high-value artifacts.

Practical game AI insight: Deploy a Dyna-style cadence with conservative imagination horizon at first, then increase model usage only when validation error and policy realism metrics are stable.


