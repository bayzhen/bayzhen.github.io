# 2. World Model Formulations

Intuition: World-model design is mostly about choosing what state is predicted, where uncertainty is represented, and which heads are needed for control-relevant learning.

Deterministic transitions use a single mapping \(s_{t+1}=f_\theta(s_t,a_t)\). They are stable and cheap but average out multimodal futures. Stochastic transitions model a distribution \(p_\theta(s_{t+1}\mid s_t,a_t)\), which handles ambiguity from hidden factors and partial observability.

Observation-space dynamics predict next observations directly. This is expensive and often over-focuses on pixels. Latent-space dynamics encode first, then predict in compact state space, improving optimization and rollout throughput while preserving control features.

Equation lines:
\[
p_\theta(o_{1:T}, r_{1:T}, c_{1:T}, s_{1:T}\mid a_{1:T-1})
= \prod_{t=1}^T p_\theta(s_t\mid s_{t-1},a_{t-1})\,p_\theta(o_t\mid s_t)\,p_\theta(r_t\mid s_t)\,p_\theta(c_t\mid s_t)
\]
\[
q_\phi(s_t\mid s_{t-1},a_{t-1},o_t)
\]

A practical world model usually has four prediction heads. The transition head drives imagined rollouts. The decoder head ensures latent sufficiency by reconstructing observations. The reward head supplies objective estimates in imagination. The continuation or discount head predicts episode persistence and supports variable-horizon return estimation.

Model quality is task-relative, not image-relative. A crisp decoder can still fail at control if latent reward structure is wrong. A blurry decoder can still produce strong policies if latent transitions and reward predictions remain calibrated along policy-relevant trajectories.

Practical game AI insight: Optimize latent transition and reward fidelity first, then tune decoder only as much as needed for representation quality and debugging visibility.


