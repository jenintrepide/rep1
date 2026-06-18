# Cost weights (can be tuned later)
ALPHA = 1.0   # weight for maneuver ΔV
BETA  = 0.8   # weight for recovery cost
GAMMA = 0.5   # weight for operational impact


def evaluate_costs(maneuvers, telemetry):
    """
    Step 8 – Cost Function Evaluation

    Adds to each maneuver:
        - predicted_cost
        - cost_breakdown
    """

    for m in maneuvers:

        # If already infeasible → huge cost
        if not m.get("can_be_executed", True):
            m["predicted_cost"] = 1e9
            m["cost_breakdown"] = {
                "delta_v_cost": None,
                "recovery_cost": None,
                "operational_cost": None
            }
            continue

        # 1. ΔV COST  (Fuel usage)
        delta_v = m.get("delta_v_mps", 0.0)     # m/s
        delta_v_cost = delta_v                 # normalized: 1 cost unit per m/s

        # 2. RECOVERY COST
        # Heuristic: returning to nominal orbit costs
        # about 40–60% of the applied ΔV
        recovery_dv = 0.5 * delta_v
        recovery_cost = recovery_dv

        # 3. OPERATIONAL COST
        operational_cost = _compute_operational_cost(m, telemetry)

        # TOTAL COST
        total_cost = (
            ALPHA * delta_v_cost +
            BETA  * recovery_cost +
            GAMMA * operational_cost
        )

        m["predicted_cost"] = round(total_cost, 4)
        m["cost_breakdown"] = {
            "delta_v_cost": round(delta_v_cost, 4),
            "recovery_cost": round(recovery_cost, 4),
            "operational_cost": round(operational_cost, 4)
        }

    return maneuvers


# OPERATIONAL COST MODEL

def _compute_operational_cost(m, telemetry):
    """
    Models non-fuel penalties:
      - payload downtime
      - attitude disturbance
      - power / thermal stress
    """

    cost = 0.0
    man = m["maneuver"]

    # 1. Payload downtime
    # Maneuvers requiring attitude change disturb payload
    if man in [
        "ALONG_TRACK_PROGRADE", "ALONG_TRACK_RETROGRADE",
        "RADIAL_INWARD", "RADIAL_OUTWARD",
        "CROSS_TRACK_NORMAL", "CROSS_TRACK_ANTI_NORMAL"
    ]:
        cost += 2.0   # baseline downtime penalty

    # 2. Attitude disturbance
    if man == "ATTITUDE_ONLY":
        cost += 1.0   # smaller but still non-zero

    # 3. Thermal / power penalties
    power_margin = telemetry.get("power_margin_w", 0)
    thermal_margin = telemetry.get("thermal_margin_c", 0)

    if power_margin < 30:
        cost += 1.5

    if thermal_margin < 10:
        cost += 1.5

    # 4. Drag modulation penalties
    if man == "DRAG_MODULATION":
        # payload faces ram direction, comm & thermal stress
        cost += 3.0

    return cost
