# 3. The Dreamer Architecture: V1 to V3

Intuition: Dreamer trains a latent dynamics model and then learns actor and critic entirely inside imagined latent trajectories, turning model learning into efficient policy optimization.

The RSSM combines deterministic memory and stochastic uncertainty. The deterministic path \(h_t\) captures long temporal context through recurrence. The stochastic path \(z_t\) captures multimodal uncertainty and partially observed factors. The model state is \(s_t=(h_t,z_t)\).

Equation lines:
\[
h_t = \mathrm{GRU}(h_{t-1}, z_{t-1}, a_{t-1})
\]
\[
p_\theta(z_t\mid h_t) \quad \text{(prior)}, \qquad q_\phi(z_t\mid h_t,o_t) \quad \text{(posterior)}
\]
\[
s_t=(h_t,z_t)
\]

Posterior and prior are both required. The posterior uses real observations and gives accurate latent inference for training. The prior predicts without observations and is the only path available during imagination. If prior quality is poor, imagined rollouts drift and policy gradients become biased.

World-model training uses reconstruction, reward, continuation, and KL regularization. The ELBO structure keeps latent states predictive yet compact. KL balancing controls which side receives stronger gradient pressure, and free bits prevent premature KL collapse.

Equation lines:
\[
\mathcal{L}_{\text{wm}} =
\mathbb{E}_{q_\phi}\!\left[\sum_t \log p_\theta(o_t\mid s_t)+\log p_\theta(r_t\mid s_t)+\log p_\theta(c_t\mid s_t)\right]
-\sum_t \mathrm{KL}\!\left(q_\phi(z_t\mid h_t,o_t)\|p_\theta(z_t\mid h_t)\right)
\]
\[
\mathcal{L}_{\text{KL-bal}} = \alpha\,\mathrm{KL}(\mathrm{sg}[q]\|p)+(1-\alpha)\,\mathrm{KL}(q\|\mathrm{sg}[p])
\]
\[
\mathrm{KL}_{\text{used}} = \max(\lambda_{\text{free}}, \mathrm{KL})
\]

V1 used Gaussian latents. V2 and V3 moved to categorical latents, typically factorized with straight-through gradients. Categorical structure improved multimodal representation and often gave more stable control across diverse tasks.

Imagination starts from posterior states sampled from replay, then unrolls only the prior with policy actions. No real observation is used in these imagined segments.

Equation lines:
\[
s_{t+1}\sim p_\theta(s_{t+1}\mid s_t,a_t), \qquad a_t\sim \pi_\psi(a_t\mid s_t)
\]
\[
V_t^\lambda = \hat r_t + \hat c_t\left((1-\lambda)v_\xi(s_{t+1})+\lambda V_{t+1}^\lambda\right)
\]

The critic regresses toward \(\lambda\)-returns, and the actor maximizes imagined returns with entropy regularization and gradient flow through latent dynamics.

Equation lines:
\[
\mathcal{L}_{\text{critic}} = \mathbb{E}\left[(v_\xi(s_t)-\mathrm{sg}[V_t^\lambda])^2\right]
\]
\[
\mathcal{J}_{\text{actor}} = \mathbb{E}\left[\sum_t \mathrm{sg}[A_t]\log \pi_\psi(a_t\mid s_t)+\eta\,\mathcal{H}(\pi_\psi(\cdot\mid s_t))\right]
\]

V3 introduced robustness features that enabled fixed hyperparameters across domains. Symlog and symexp stabilized heavy-tailed targets. Two-hot encoding improved scalar target learning. Percentile normalization reduced sensitivity to reward scale. A 1 percent unimix prevented overconfident categorical probabilities. Adaptive gradient clipping controlled rare optimization spikes.

Equation lines:
\[
\mathrm{symlog}(x)=\mathrm{sign}(x)\log(1+|x|), \qquad
\mathrm{symexp}(y)=\mathrm{sign}(y)(e^{|y|}-1)
\]
\[
\tilde p=(1-\epsilon)p+\epsilon u,\quad \epsilon=0.01
\]

Practical game AI insight: In Dreamer pipelines, the largest stability gains usually come from world-model numerics and target transforms before any advanced actor objective tuning.


