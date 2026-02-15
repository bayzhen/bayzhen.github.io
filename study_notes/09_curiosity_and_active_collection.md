# 9. Curiosity and Active Data Collection

Intuition: Efficient exploration asks for real experience only where the current model is uncertain and task-relevant.

Intrinsic motivation methods convert novelty into reward. ICM uses forward-model feature prediction error. RND uses prediction error against a fixed random target embedding. Both improve sparse-reward exploration but can overvalue stochastic distractions.

The noisy-TV failure mode appears when aleatoric randomness yields persistent prediction error. The agent repeatedly visits unpredictable but useless states because intrinsic reward remains high. Ensemble disagreement helps separate reducible epistemic uncertainty from irreducible noise.

Equation lines:
\[
r_t^{\text{int}} \propto \|f_\theta(\phi(o_t),a_t)-\phi(o_{t+1})\|^2 \quad \text{(ICM style)}
\]
\[
r_t^{\text{int}} \propto \|g(o_t)-\hat g_\psi(o_t)\|^2 \quad \text{(RND style)}
\]

A practical active learning loop alternates four stages. Train the world model on current data. Search imagined trajectories for high epistemic uncertainty with potential value. Collect targeted real rollouts in those regions. Retrain and repeat.

Equation lines:
\[
\mathcal{A}(s,a)=u_{\text{epi}}(s,a)+\kappa \hat V(s)
\]

Imagination-first candidate selection reduces expensive environment interaction and focuses collection on model weaknesses rather than uniform map coverage.

Practical game AI insight: Treat curiosity as a temporary data-collection controller and anneal it once reward-bearing regions are sufficiently modeled.


