import numpy as np
from datetime import datetime

def build_observation(prediction, telemetry, maneuver=None):
    """
    Builds a PARTIAL OBSERVATION for DRQN (POMDP)
    """

    # Risk state
    pc   = prediction["risk_metrics"]["collision_probability"]
    miss = prediction["risk_metrics"]["miss_distance_km"]
    sev  = prediction["assessment"]["severity_score"]

    # Covariance awareness
    cov_diag = prediction["cdm_data"]["covariance_ric_diagonal"]
    cov_pos_unc = np.sqrt(sum(cov_diag[:3]))  # combined σ position

    # Time to TCA
    tca = datetime.fromisoformat(
        prediction["impact_time"].replace("Z", "")
    )
    now = datetime.utcnow()
    time_to_tca = max((tca - now).total_seconds(), 1.0)

    # Maneuver economics
    cost = maneuver.get("predicted_cost", 0) if maneuver else 0
    delta_v = maneuver.get("delta_v_mps", 0.0) if maneuver else 0.0
    feasible = 1.0 if (maneuver and maneuver.get("can_be_executed", True)) else 1.0


    # Telemetry (partial observability)
    fuel_margin   = telemetry.get("fuel_margin_kg", 0.0)
    power_margin  = telemetry.get("power_margin_w", 0.0)
    thermal_margin = telemetry.get("thermal_margin_c", 0.0)

    # Feasibility flag
    feasible = 1.0 if (maneuver and maneuver.get("can_be_executed", True)) else 0.0

    obs = np.array([
        pc,
        miss,
        sev,
        cov_pos_unc,
        time_to_tca / 3600.0,   # hours
        cost,
        delta_v,
        fuel_margin,
        power_margin,
        thermal_margin,
        feasible
    ], dtype=np.float32)

    return obs
