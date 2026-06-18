import math
import numpy as np
from datetime import datetime, timezone

# ============================================================
# CONSTANTS
# ============================================================

MU_EARTH = 398600.4418  # km^3/s^2

# ============================================================
# DERIVED QUANTITIES
# ============================================================

def compute_seconds_to_tca(conj):
    tca = datetime.fromisoformat(
        conj["impact_time"].replace("Z", "+00:00")
    )
    now = datetime.now(timezone.utc)
    return max((tca - now).total_seconds(), 0.0)


def compute_velocity_mag(conj):
    v_vec = np.array(conj["V_TARGET_KM_S"])
    return float(np.linalg.norm(v_vec))


def compute_semi_major_axis(conj):
    r_vec = np.array(conj["R_TARGET_ECI_KM"])
    v_vec = np.array(conj["V_TARGET_KM_S"])

    r = np.linalg.norm(r_vec)
    v = np.linalg.norm(v_vec)

    return 1.0 / (2.0 / r - v**2 / MU_EARTH)
# ============================================================
# NORMALIZATION UTILITIES
# ============================================================

def _zscore(values):
    values = np.array(values, dtype=float)
    mean = values.mean()
    std = values.std() + 1e-12
    return (values - mean) / std


def normalize_conjunction_features(conjunctions):
    """
    Computes and attaches normalized priority features
    to each conjunction as conj['_norm'].
    """

    log_pc = []
    inv_dmiss = []
    severity = []
    inv_tca = []

    for conj in conjunctions:
        log_pc.append(
            math.log10(conj["risk_metrics"]["collision_probability"] + 1e-20)
        )
        inv_dmiss.append(
            1.0 / max(conj["risk_metrics"]["miss_distance_km"], 1e-6)
        )
        severity.append(
            conj["assessment"]["severity_score"]
        )
        inv_tca.append(
            1.0 / max(compute_seconds_to_tca(conj), 1.0)
        )

    log_pc_n = _zscore(log_pc)
    inv_dmiss_n = _zscore(inv_dmiss)
    severity_n = _zscore(severity)
    inv_tca_n = _zscore(inv_tca)

    for i, conj in enumerate(conjunctions):
        conj["_norm"] = {
            "log_pc": log_pc_n[i],
            "inv_dmiss": inv_dmiss_n[i],
            "severity": severity_n[i],
            "inv_tca": inv_tca_n[i],
        }

# ============================================================
# PRIORITIZATION
# ============================================================

def compute_priority(conj, weights):
    """
    Priority = weighted sum of normalized features
    """

    if "_norm" not in conj:
        raise RuntimeError(
            "Normalized features missing. "
            "Call normalize_conjunction_features() first."
        )

    n = conj["_norm"]
    w1, w2, w3, w4 = weights

    return (
        w1 * n["log_pc"] +
        w2 * n["inv_dmiss"] +
        w3 * n["severity"] +
        w4 * n["inv_tca"]
    )


def prioritize_conjunctions(conjunctions, weights):
    """
    Normalizes features and ranks conjunctions
    by descending priority score.
    """

    normalize_conjunction_features(conjunctions)

    for conj in conjunctions:
        conj["priority_score"] = compute_priority(conj, weights)

    return sorted(
        conjunctions,
        key=lambda x: x["priority_score"],
        reverse=True
    )

# ============================================================
# MANEUVER ENUMERATION
# ============================================================

def enumerate_maneuvers(regime):
    maneuvers = [
        "ALONG_TRACK_PROGRADE",
        "ALONG_TRACK_RETROGRADE",
        "RADIAL_INWARD",
        "RADIAL_OUTWARD",
        "CROSS_TRACK_NORMAL",
        "CROSS_TRACK_ANTI_NORMAL",
        "ATTITUDE_ONLY"
    ]
    if regime == "LEO":
        maneuvers.append("DRAG_MODULATION")
    return maneuvers

# ============================================================
# MANEUVER EFFECT MODELS
# ============================================================

def along_track_effect(dv, a, v, dt):
    return 1.5 * (dv / v) * a * dt


def radial_effect(dv, a):
    v = math.sqrt(MU_EARTH / a)
    return (2 * a**2 / MU_EARTH) * v * dv


def cross_track_effect(dv, dt):
    return dv * dt


def attitude_only_effect(hbr, reduction=0.2):
    return hbr * reduction


def drag_modulation_effect(rho, cd, area, mass, v, dt):
    accel = 0.5 * rho * cd * area / mass * v**2
    return accel * dt

# ============================================================
# MANEUVER EVALUATION
# ============================================================

def evaluate_maneuver(maneuver, ctx):
    if maneuver.startswith("ALONG_TRACK"):
        return along_track_effect(ctx["delta_v"], ctx["a"], ctx["v"], ctx["delta_t"])
    if maneuver.startswith("RADIAL"):
        return radial_effect(ctx["delta_v"], ctx["a"])
    if maneuver.startswith("CROSS_TRACK"):
        return cross_track_effect(ctx["delta_v"], ctx["delta_t"])
    if maneuver == "ATTITUDE_ONLY":
        return attitude_only_effect(ctx["hbr"])
    if maneuver == "DRAG_MODULATION":
        return drag_modulation_effect(
            ctx["rho"], ctx["cd"], ctx["area"],
            ctx["mass"], ctx["v"], ctx["delta_t"]
        )
    return 0.0

def build_decision_context(conj, spacecraft_cfg):
    delta_t = compute_seconds_to_tca(conj)
    v = compute_velocity_mag(conj)
    a = compute_semi_major_axis(conj)

    return {
        # derived physics
        "delta_t": delta_t,
        "v": v,
        "a": a,

        # spacecraft / policy
        "delta_v": spacecraft_cfg["delta_v"],
        "mass": spacecraft_cfg["mass"],
        "area": spacecraft_cfg["area"],
        "cd": spacecraft_cfg["cd"],
        "hbr": spacecraft_cfg["hbr"],

        # environment
        "rho": spacecraft_cfg["rho_leo"]
               if conj["metadata"]["regime"] == "LEO" else 0.0
    }
