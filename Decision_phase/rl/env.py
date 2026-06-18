import copy
from Decision_phase.rl.reward import compute_reward
from Decision_phase.maneuvers.effect_model import maneuver_effect_model

class DecisionEnv:
    """
    RL environment for one conjunction decision
    """

    def __init__(self, prediction, telemetry, mission_type="UNCREWED"):
        self.prediction = prediction
        self.telemetry = telemetry
        self.mission_type = mission_type

        self.maneuvers = None
        self.reset()

    # ----------------------------------
    def reset(self):
        self.state = self.prediction
        self.done = False
        return self.state

    # ----------------------------------
    def set_maneuvers(self, maneuvers):
        self.maneuvers = maneuvers

    # ----------------------------------
    def step(self, maneuver_name):
        """
        Executes a maneuver and returns:
        next_state, reward, done
        """

        before = copy.deepcopy(self.state)

        # find maneuver
        m = next(x for x in self.maneuvers if x["maneuver"] == maneuver_name)

        # apply analytic effect model
        result = maneuver_effect_model(
            maneuver=m["maneuver"],
            conj=self.state,
            mission_type=self.mission_type
        )

        # build "after" state
        after = copy.deepcopy(self.state)
        after["risk_metrics"]["collision_probability"] = result["pc_est"]
        after["risk_metrics"]["miss_distance_km"] = result["required_miss_distance_km"]

        # compute reward
        reward = compute_reward(before, after, m)

        self.state = after
        self.done = True

        return after, reward, True
