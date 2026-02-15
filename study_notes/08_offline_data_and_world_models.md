# 8. Offline Data and World Models

Intuition: Offline world-model training turns replay archives into a reusable dynamics prior, but downstream policy optimization must stay conservative under distribution shift.

The world model is trained self-supervised on logged trajectories without interaction. This enables large-scale pretraining and broad coverage of dynamics patterns before task-specific optimization.

The main challenge is policy-induced distribution shift. A new policy can move into state-action regions absent from logs, where model predictions are unreliable. Conservative rollouts and pessimistic value shaping reduce over-optimistic behavior in those regions.

Equation lines:
\[
\hat Q_{\text{pess}}(s,a)=\hat Q(s,a)-\beta u(s,a)
\]
\[
\pi_{\text{new}} \approx \arg\max_\pi \mathbb{E}_{\hat M}[R] \ \text{subject to behavior proximity constraints}
\]

There is a structural parallel to foundation-model pipelines. First gather diverse data. Then train a general predictive model. Then adapt to downstream control objectives. This enables transfer across tasks and reduces repeated simulator cost.

Structured replay is usually superior to raw video for control because it includes actions, rewards, terminations, and state metadata. Raw video can still pretrain perception and dynamics priors, but action causality must be inferred and is inherently ambiguous.

Practical game AI insight: Design replay logging as a long-term asset with consistent action semantics and event tags, because data quality determines how far offline world-model pretraining can scale.


