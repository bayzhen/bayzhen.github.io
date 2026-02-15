# 7. Uncertainty Quantification

Intuition: Uncertainty estimation decides where imagination is reliable and where the agent should return to real data collection.

Aleatoric uncertainty comes from inherent stochasticity or partial observability and cannot be removed by more data. Epistemic uncertainty comes from limited knowledge and decreases with targeted data collection. For safe model usage, epistemic uncertainty is the key control signal.

Ensemble disagreement is a practical estimator. Multiple independently trained models predict next state or reward, and dispersion is used as uncertainty proxy. Dropout-based sampling is cheaper but often less calibrated under nonstationary policy updates.

Equation lines:
\[
u_t=\mathrm{Var}_k\!\left[\hat r_t^{(k)}\right]
\]
\[
u_t=\frac{1}{K}\sum_k \|\hat s_{t+1}^{(k)}-\bar s_{t+1}\|^2
\]

Uncertainty can gate rollout depth by truncating imagination when \(u_t\) exceeds threshold. It can also reweight imagined losses so uncertain trajectories contribute less to updates.

Equation lines:
\[
H_t=\min\{h:\ u_{t+h}>\tau\}
\]
\[
w_t=\exp(-\gamma u_t),\qquad \mathcal{L}_{\text{imag}}=\sum_t w_t\ell_t
\]

A robust loop calibrates uncertainty against held-out fresh trajectories. If uncertainty no longer predicts real prediction error, retrain or diversify the estimator before trusting long-horizon imagination.

Practical game AI insight: Use uncertainty as an online scheduler for both rollout horizon and real-data budget allocation, not just as an exploration bonus.


