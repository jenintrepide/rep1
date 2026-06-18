import numpy as np
import math
from datetime import datetime



def apply_high_fidelity_model(
        prediction,
        maneuvers,
        target_sat=None,
        debris_sat=None,
        physics_engine=None
    ):
    """
    Step 11 – High-Fidelity Maneuver Effect Modeling

    Adds ONLY:
      maneuver["hifi_effect"] = {...}

    Does NOT remove or modify any existing fields.
    """
    # FALLBACK MODE – no physics engine available
    if physics_engine is None or target_sat is None or debris_sat is None:
        for m in maneuvers:
            m["hifi_effect"] = {
                "execution_time_utc": None,
                "delta_v_applied_mps": None,
                "relative_position_tca_km": None,
                "miss_distance_km": None,
                "collision_probability": m.get("pc_est"),
                "covariance_trace": None,
                "model": "ANALYTIC_FALLBACK",
                "note": "High-fidelity physics engine not available"
            }
        return maneuvers

    # Parse TCA
    tca_time = datetime.fromisoformat(
        prediction["impact_time"].replace("Z", "")
    )

    # Loop through maneuvers
    for m in maneuvers:

        win = m.get("execution_window", {})
        if not win.get("window_available"):
            _attach_failed_hifi(m, "NO_EXECUTION_WINDOW")
            continue

        exec_time = datetime.fromisoformat(
            win["optimal_times_utc"][0].replace("Z", "")
        )

        # seconds from now to execution
        now = datetime.utcnow()
        dt_exec = (exec_time - now).total_seconds()
        dt_tca  = (tca_time - exec_time).total_seconds()

        if dt_exec < 0 or dt_tca <= 0:
            _attach_failed_hifi(m, "INVALID_EXECUTION_TIME")
            continue

        # 1. Propagate both objects to execution time
        jd_exec = _datetime_to_jd(exec_time)

        _, r_t, v_t = target_sat.sgp4(jd_exec, 0.0)
        _, r_d, v_d = debris_sat.sgp4(jd_exec, 0.0)

        r_t = np.array(r_t); v_t = np.array(v_t)
        r_d = np.array(r_d); v_d = np.array(v_d)

        # 2. Apply maneuver effect
        dv_vec = _build_delta_v_vector(m, v_t)

        v_t_post = v_t + dv_vec / 1000.0   # m/s → km/s

        # 3. Propagate to TCA
        jd_tca = _datetime_to_jd(tca_time)

        _, r_t2, v_t2 = target_sat.sgp4(jd_tca, 0.0)
        _, r_d2, v_d2 = debris_sat.sgp4(jd_tca, 0.0)

        r_t2 = np.array(r_t2); v_t2 = np.array(v_t2)
        r_d2 = np.array(r_d2); v_d2 = np.array(v_d2)

        # Inject post-maneuver velocity
        v_t2 = v_t2 + (v_t_post - v_t)

        # 4. Relative geometry at TCA
        r_rel = r_d2 - r_t2
        v_rel = v_d2 - v_t2

        miss_dist = np.linalg.norm(r_rel)

        # 5. Covariance propagation (STM)
        P0 = physics_engine._synthesize_initial_covariance(
            r_t, v_t, prediction["metadata"]["regime"]
        )

        Phi = physics_engine._compute_numerical_stm(
            target_sat,
            jd_exec,
            dt_tca
        )

        P_tca = Phi @ P0 @ Phi.T

        cov_trace = float(np.trace(P_tca[0:3,0:3]))

        # 6. Collision probability (B-plane)
        b = physics_engine._project_to_b_plane(r_rel, v_rel, P_tca)

        debris_r = physics_engine._get_radius(
            {"RCS_SIZE": "UNKNOWN"}
        )

        hbr = (physics_engine.target_radius + debris_r) / 1000.0

        pc = physics_engine._calculate_pc_alfano(
            b["miss_vec"], b["sigma"], hbr
        )

        # 7. Attach results (ADD ONLY)
        m["hifi_effect"] = {
            "execution_time_utc": exec_time.isoformat() + "Z",
            "delta_v_applied_mps": dv_vec.tolist(),
            "relative_position_tca_km": r_rel.tolist(),
            "miss_distance_km": float(miss_dist),
            "collision_probability": float(pc),
            "covariance_trace": cov_trace,
            "model": "SGP4+STM"
        }

    return maneuvers


# SUPPORT FUNCTIONS

def _attach_failed_hifi(m, reason):
    m["hifi_effect"] = {
        "execution_time_utc": None,
        "delta_v_applied_mps": None,
        "relative_position_tca_km": None,
        "miss_distance_km": None,
        "collision_probability": None,
        "covariance_trace": None,
        "model": "FAILED",
        "failure_reason": reason
    }


def _build_delta_v_vector(m, v_vec):
    """
    Builds ΔV vector in ECI based on maneuver primitive.
    """
    man = m["maneuver"]
    dv = m.get("delta_v_mps", 0.0)

    if dv == 0:
        return np.zeros(3)

    v_hat = v_vec / (np.linalg.norm(v_vec) + 1e-9)

    # build RIC frame
    r_dummy = np.array([1,0,0])
    c_hat = np.cross(r_dummy, v_hat)
    if np.linalg.norm(c_hat) < 1e-6:
        c_hat = np.array([0,1,0])
    c_hat = c_hat / np.linalg.norm(c_hat)
    r_hat = np.cross(v_hat, c_hat)

    if man == "ALONG_TRACK_PROGRADE":
        return dv * v_hat
    if man == "ALONG_TRACK_RETROGRADE":
        return -dv * v_hat
    if man == "RADIAL_OUTWARD":
        return dv * r_hat
    if man == "RADIAL_INWARD":
        return -dv * r_hat
    if man == "CROSS_TRACK_NORMAL":
        return dv * c_hat
    if man == "CROSS_TRACK_ANTI_NORMAL":
        return -dv * c_hat

    # attitude-only & drag modulation → no impulse
    return np.zeros(3)


def _datetime_to_jd(dt):
    """
    Converts datetime → Julian date
    """
    a = (14 - dt.month) // 12
    y = dt.year + 4800 - a
    m = dt.month + 12*a - 3

    jdn = dt.day + ((153*m + 2)//5) + 365*y + y//4 - y//100 + y//400 - 32045
    jd = jdn + (dt.hour - 12)/24 + dt.minute/1440 + dt.second/86400
    return jd
