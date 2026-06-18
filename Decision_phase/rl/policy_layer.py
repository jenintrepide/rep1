import torch
import numpy as np

from  Decision_phase.rl.drqn_model import DRQN
from  Decision_phase.rl.state_builder import build_observation


class RLPolicyLayer:
    """
    Step 9 – Reinforcement Learning Policy Layer
    Uses DRQN to rank maneuver candidates under uncertainty (POMDP)
    """

    def __init__(self, input_dim, hidden_dim=64):
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim

        self.model = None
        self.action_map = []   # index → maneuver name

    # Model loading (pretrained or initialized)
    def load_model(self, action_space, weight_path=None):
        """
        action_space = list of maneuver names (strings)
        """
        self.action_map = action_space
        self.model = DRQN(self.input_dim, self.hidden_dim, len(action_space))

        if weight_path:
            self.model.load_state_dict(torch.load(weight_path))
        self.model.eval()

    # Main API
    def rank_maneuvers(self, prediction, maneuvers, telemetry):
        """
        Adds ONLY:
          - rl_score
          - rl_rank
        """

        if self.model is None:
            raise RuntimeError("RL model not loaded")

        # Build observation sequence (POMDP history = 1 step)
        # single state observation
        obs = build_observation(prediction, telemetry)

        # repeat for each maneuver (sequence form)
        obs_list = [obs for _ in maneuvers]

        obs_seq = torch.tensor(obs_list, dtype=torch.float32)
        obs_seq = obs_seq.unsqueeze(0)   # (1, seq_len, input_dim)

        # Run DRQN
        hidden = self.model.init_hidden(batch_size=1)

        with torch.no_grad():
            q_values, _ = self.model(obs_seq, hidden)
            # take last timestep
            q_last = q_values[0, -1].cpu().numpy()

        # Map Q-values to maneuvers
        score_map = {}
        for i, name in enumerate(self.action_map):
            score_map[name] = float(q_last[i])

        # ADD scores to maneuvers (additive only!)
        for m in maneuvers:
            name = m["maneuver"]
            m["rl_score"] = score_map.get(name, -1e6)

        # Rank (higher Q = better)
        ranked = sorted(maneuvers, key=lambda x: x["rl_score"], reverse=True)

        for i, m in enumerate(ranked, start=1):
            m["rl_rank"] = i   # additive only

        return ranked
