import torch
import torch.nn.functional as F
from Decision_phase.rl.drqn_model import DRQN
from Decision_phase.rl.replay_buffer import EpisodeBuffer

class DRQNTrainer:
    def __init__(self, input_dim, action_space, lr=1e-3):
        self.action_space = action_space
        self.action_index = {a:i for i,a in enumerate(action_space)}

        self.model = DRQN(input_dim, hidden_dim=64, action_dim=len(action_space))
        self.target = DRQN(input_dim, 64, len(action_space))
        self.target.load_state_dict(self.model.state_dict())

        self.optim = torch.optim.Adam(self.model.parameters(), lr=lr)
        self.buffer = EpisodeBuffer()

        self.gamma = 0.99

    # --------------------------------------
    def store_episode(self, episode):
        self.buffer.push(episode)

    # --------------------------------------
    def train_step(self, batch_size=4):
        if len(self.buffer) < batch_size:
            return

        batch = self.buffer.sample(batch_size)

        loss_total = 0

        for episode in batch:

            obs_seq = torch.tensor(
                [e[0] for e in episode],
                dtype=torch.float32
            ).unsqueeze(0)

            actions = [e[1] for e in episode]
            rewards = [e[2] for e in episode]

            hidden = self.model.init_hidden(1)
            q_seq, _ = self.model(obs_seq, hidden)

            q_taken = []
            for t, a in enumerate(actions):
                ai = self.action_index[a]
                q_taken.append(q_seq[0, t, ai])

            q_taken = torch.stack(q_taken)

            # targets
            targets = torch.tensor(rewards, dtype=torch.float32)

            loss = F.mse_loss(q_taken, targets)
            loss_total += loss

        self.optim.zero_grad()
        loss_total.backward()
        self.optim.step()
