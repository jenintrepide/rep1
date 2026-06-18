import torch
import torch.nn as nn
import torch.nn.functional as F

class DRQN(nn.Module):
    """
    Deep Recurrent Q Network
    Q(s, a) where s is partial observation
    """

    def __init__(self, input_dim, hidden_dim, action_dim):
        super().__init__()

        self.fc1 = nn.Linear(input_dim, 128)
        self.lstm = nn.LSTM(128, hidden_dim, batch_first=True)
        self.fc2 = nn.Linear(hidden_dim, action_dim)

    def forward(self, x, hidden):
        """
        x: (batch, seq_len, input_dim)
        hidden: (h0, c0)
        """
        x = F.relu(self.fc1(x))
        out, hidden = self.lstm(x, hidden)
        q = self.fc2(out)   # (batch, seq, action_dim)
        return q, hidden

    def init_hidden(self, batch_size=1):
        h0 = torch.zeros(1, batch_size, self.lstm.hidden_size)
        c0 = torch.zeros(1, batch_size, self.lstm.hidden_size)
        return (h0, c0)
