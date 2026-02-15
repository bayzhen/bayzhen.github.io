# 5. Planning and Policy Optimization in Learned Models

Intuition: A learned model supports multiple control modes, from online action-sequence planning to amortized policies trained in imagination.

Shooting methods optimize action sequences at decision time. CEM iteratively samples, selects elites, and refits a proposal distribution. MPPI computes weighted trajectory averages around a nominal sequence. These methods are robust and reactive but scale in compute with horizon and action dimension.

Equation lines:
\[
a_{t:t+H-1}^*=\arg\max_{a_{t:t+H-1}}
\mathbb{E}_{\hat M}\left[\sum_{k=0}^{H-1}\gamma^k \hat r_{t+k}\right]
\]

Backpropagation through dynamics treats planning as differentiable optimization through the world model. It can be efficient in continuous control but sensitive to model smoothness and local optima, especially with discrete or hybrid action spaces.

Dreamer-style actor-critic amortizes planning into policy parameters. Training cost is front-loaded in imagination, while inference is a single policy forward pass. This is ideal under strict runtime budgets.

MPC and amortized policy have complementary strengths. MPC adapts online and can partially correct model error via receding horizon updates. Amortized policies are fast and stable at inference but can encode model bias learned during training. Hybrid systems often execute an amortized policy and optionally apply short-horizon MPC corrections in safety-critical moments.

Equation lines:
\[
a_t = \pi_\psi(s_t) \quad \text{(amortized)}
\]
\[
a_t = \text{FirstAction}\!\left(\text{Plan}_{\hat M}(s_t)\right) \quad \text{(MPC)}
\]

Practical game AI insight: Use amortized latent policies for baseline control and reserve online planning budget for high-impact tactical decisions where local adaptation is worth the latency.


