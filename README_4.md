# 🚦 Gridathon 2.0 — Urban Traffic Flow Prediction

> Hackathon project exploring **Graph Neural Networks, LLMs, and hybrid spatiotemporal models** for real-time urban traffic forecasting.

---

## Overview

Traffic congestion costs cities billions in lost productivity every year. This project tackles that problem head-on — building and iterating on ML models that predict traffic flow across a road network using historical sensor data, junction topology, and large language model reasoning.

Developed as part of **Gridathon 2.0**, a competitive ML challenge focused on smart city infrastructure.

---

## What Makes This Interesting

Most traffic prediction approaches treat roads as independent time-series. We went further — modelling the **road network as a graph**, where intersections are nodes and roads are edges, and letting the model learn how congestion propagates spatially and temporally across the city.

We also explored an unconventional angle: **using LLMs as zero-shot traffic reasoners**, then combining their outputs with graph-based models in a hybrid architecture.

---

## Approaches Explored

We ran **30+ experimental iterations** across several model families:

| Approach | Notebooks | Description |
|---|---|---|
| **Baseline** | `traffic_demand_prediction` | Feature-engineered tabular models |
| **Junction-aware** | `2_traffic_flow_pred_junc` | Per-intersection features + temporal context |
| **LLM-augmented** | `3_traffic_flow_pred_llm`, `4_traffic_flow_llm_junc` | LLM-generated traffic priors fused with learned features |
| **Global + Local** | `5_traffic_flow_junc+global` | Combined junction-level and network-level signals |
| **Graph Neural Network** | `6_traffic_flow_gnn` | GNN over the road network adjacency graph |
| **Hybrid Inverse LLM** | `7_traffic_flow_hybrid_inverse_llm` | LLM predictions used inversely as residual correctors |
| **Graph WaveNet** | `gwnet-v18` → `gwnet-v23` | Adaptive adjacency matrix + dilated temporal convolutions |
| **MDGRTN** | `mdgrtn-v11` → `mdgrtn-v32` | Multi-dimensional graph recurrent temporal network |

### Highlight: Graph WaveNet

Graph WaveNet learns an **adaptive, data-driven adjacency matrix** — meaning the model discovers hidden spatial dependencies between roads that aren't obvious from the map alone. Paired with dilated causal convolutions for temporal modelling, it is one of the strongest baselines in traffic forecasting literature.

### Highlight: LLM Integration

We prompted LLMs with structured traffic context (time of day, junction type, historical averages) to generate soft predictions, then used those as auxiliary features or residual signals in downstream models. This is a novel fusion direction that points toward how foundation models can augment traditional spatiotemporal forecasting.

---

## Tech Stack

- **Python**, **PyTorch**, **PyTorch Geometric**
- **Pandas**, **NumPy**, **Scikit-learn**
- Jupyter Notebooks for experimentation
- LLM API integration for hybrid models

---

## Results

> *(Fill in your final RMSE / MAE scores and leaderboard rank here)*  
> e.g. — Achieved **X.XX RMSE** on the test set, ranking **N / M** on the leaderboard.

---

## Key Takeaways

- Graph-structured models consistently outperform independent time-series approaches for road network forecasting.
- LLM-augmented models show promise as complementary signal sources, especially in low-data junction scenarios.
- Adaptive adjacency learning (Graph WaveNet) captures latent traffic dependencies that static road graphs miss.
- Iterative experimentation across 30+ notebook versions was essential — many improvements came from small architectural and preprocessing decisions.

---

## Repository Structure

```
Gridathon-2.0/
├── traffic_demand_prediction.ipynb     # Baseline
├── 2_traffic_flow_pred_junc.ipynb      # Junction-level features
├── 3_traffic_flow_pred_llm.ipynb       # LLM-augmented
├── 4_traffic_flow_llm_junc.ipynb       # LLM + junction fusion
├── 5_traffic_flow_junc+global.ipynb    # Multi-scale features
├── 6_traffic_flow_gnn.ipynb            # Graph Neural Network
├── 7_traffic_flow_hybrid_inverse_llm.ipynb  # Hybrid residual model
├── gwnet-v18 → gwnet-v23.ipynb         # Graph WaveNet iterations
└── mdgrtn-v11 → mdgrtn-v32.ipynb       # MDGRTN iterations
```

---

## Why This Project

Urban traffic prediction sits at the intersection of graph learning, time-series forecasting, and real-world impact — exactly the kind of problem where modern ML can make a measurable difference. This project reflects a genuine curiosity about **how different model families handle spatiotemporal dependency**, and a willingness to experiment broadly before converging on what works.
