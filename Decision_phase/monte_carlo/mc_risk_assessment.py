import numpy as np
import math
from datetime import datetime


def run_post_maneuver_monte_carlo(
        prediction,
        maneuvers,
        target_sat=None,
        debris_sat=None,
        physics_engine=None,
        samples=2000
    ):
    """
    Step 12 – Post-Maneuver Monte Carlo Risk Assessment

    Adds:
      maneuver["mc_assessment"] = {...}
    """
    if target_sat is None or debris_sat is None or physics_engine is None:
        for m in maneuvers:
            m["post_maneuver_mc"] = {
                "status": "SKIPPED",
                "reason": "NO_PHYSICS_ENGINE",
                "samples": 0,
                "pc_mean": None,
                "pc_std": None
            }
        return maneuvers
    # Parse TCA
    tca_time = datetime.fromisoformat(
        prediction["impact_time"].replace("Z", "")
    )
    jd_tca = _datetime_to_jd(tca_time)

    # Loop through maneuvers
    for m in maneuvers:

        hifi = m.get("hifi_effect", {})
        if not hifi or hifi.get("model") == "FAILED":
            _attach_failed_mc(m, "NO_HIFI_STATE")
            continue

        # Nominal post-maneuver relative state at TCA
        r_rel_nom = np.array(hifi["relative_position_tca_km"])
        miss_nom  = np.linalg.norm(r_rel_nom)

        # Build covariance at TCA
        # Use trace from hifi and distribute isotropically
        cov_trace = hifi.get("covariance_trace", 1.0)
        sigma2 = cov_trace / 3.0
        P_pos = np.eye(3) * sigma2

        # Hard Body Radius
        debris_r = physics_engine._get_radius(
            {"RCS_SIZE": "UNKNOWN"}
        )
        hbr = (physics_engine.target_radius + debris_r) / 1000.0

        # Monte Carlo sampling
        misses = []
        hits = 0

        for _ in range(samples):

            # sample relative position error
            dr = np.random.multivariate_normal(
                mean=[0,0,0],
                cov=P_pos
            )

            r_rel = r_rel_nom + dr
            miss = np.linalg.norm(r_rel)
            misses.append(miss)

            if miss <= hbr:
                hits += 1

        misses = np.array(misses)

        pc_mc = hits / samples

        # Confidence interval (binomial 95% upper bound)
        # Wilson score approximation
        z = 1.96
        n = samples
        p = pc_mc

        denom = 1 + z*z/n
        centre = (p + z*z/(2*n)) / denom
        margin = z * math.sqrt((p*(1-p) + z*z/(4*n)) / n) / denom
        pc_upper = centre + margin

        # Attach results
        m["mc_assessment"] = {
            "samples": samples,
            "mean_miss_distance_km": float(np.mean(misses)),
            "std_miss_distance_km": float(np.std(misses)),
            "collision_probability_mc": float(pc_mc),
            "confidence_95_pc_upper": float(pc_upper),
            "model": "SGP4+STM+MC"
        }

    return maneuvers


# SUPPORT

def _attach_failed_mc(m, reason):
    m["mc_assessment"] = {
        "samples": None,
        "mean_miss_distance_km": None,
        "std_miss_distance_km": None,
        "collision_probability_mc": None,
        "confidence_95_pc_upper": None,
        "model": "FAILED",
        "failure_reason": reason
    }


def _datetime_to_jd(dt):
    a = (14 - dt.month) // 12
    y = dt.year + 4800 - a
    m = dt.month + 12*a - 3

    jdn = dt.day + ((153*m + 2)//5) + 365*y + y//4 - y//100 + y//400 - 32045
    jd = jdn + (dt.hour - 12)/24 + dt.minute/1440 + dt.second/86400
    return jd
