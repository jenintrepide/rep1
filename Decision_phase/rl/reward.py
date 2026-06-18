def compute_reward(before, after, maneuver):
    """
    before, after : dicts with risk metrics
    maneuver : maneuver dict after evaluation
    """

    # Safety improvement
    pc_before = before["risk_metrics"]["collision_probability"]
    pc_after  = after["risk_metrics"]["collision_probability"]

    miss_before = before["risk_metrics"]["miss_distance_km"]
    miss_after  = after["risk_metrics"]["miss_distance_km"]

    safety_gain = (pc_before - pc_after) * 1e8     # scale Pc
    geometry_gain = (miss_after - miss_before) * 5

    # Cost penalties
    fuel_penalty = maneuver.get("fuel_cost_kg", 0) * 10
    op_penalty   = maneuver.get("predicted_cost", 0) * 0.5

    # Feasibility
    feas = maneuver.get("can_be_executed", True)
    feas_penalty = 0 if feas else 200

    # Catastrophic fail
    collision = pc_after > 1e-3
    crash_penalty = 1000 if collision else 0

    reward = (
        safety_gain +
        geometry_gain -
        fuel_penalty -
        op_penalty -
        feas_penalty -
        crash_penalty
    )

    return float(reward)
