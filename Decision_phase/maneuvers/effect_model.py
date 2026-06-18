import math
from Decision_phase.utils.time_utils import tca_seconds_from_impact_time

CARA = {"CREWED":1e-5,"UNCREWED":1e-4}
MU_EARTH = 398600.4418        # km^3/s^2
RHO_LEO = 1e-12              # kg/m^3 (representative)
CD = 2.2
EPS = 1e-15


# CORE ENTRY FUNCTION

def maneuver_effect_model(maneuver: str,
                          conj: dict,
                          mission_type="UNCREWED"):
    """
    Computes first-order physical effect of each maneuver primitive.
    """

    Pc0 = max(conj["risk_metrics"]["collision_probability"], EPS)
    d0 = conj["risk_metrics"]["miss_distance_km"]        # km
    tca_sec = tca_seconds_from_impact_time(conj["impact_time"])
    if tca_sec < 1.0:
        tca_sec = 1.0

    # Target Pc after maneuver
    Pc_target = CARA[mission_type]

    # 1. REQUIRED MISS DISTANCE
    # Pc ~ exp(-d^2 / 2σ^2)  →  d_req ≈ d0 * sqrt( ln(Pc0/Pct) )
    if Pc0 <= Pc_target:
        d_required = d0
    else:
        ratio = math.log(Pc0 / Pc_target)
        d_required = d0 * math.sqrt(max(1.0, ratio))

    delta_d = max(0.0, d_required - d0)   # km

    # Orbital data
    r = conj["R_TARGET_ECI_KM"]
    v = conj["V_TARGET_KM_S"]
    a = _estimate_semi_major_axis(r, v)   # km
    if abs(a) < 1e-6:
        a = 1e-6
    V = _norm(v)                          # km/s

    result = {
        "maneuver": maneuver,
        "required_miss_distance_km": d_required,
        "delta_miss_distance_km": delta_d,
        "pc_est": Pc_target
    }

    # ALONG-TRACK
    if maneuver in ["ALONG_TRACK_PROGRADE", "ALONG_TRACK_RETROGRADE"]:
        # ΔV ≈ (2/3) * V / (a Δt) * Δs
        dt = tca_sec
        delta_v = (2/3) * (V / (a * dt)) * (delta_d * 1000)  # m/s

        result["delta_v_mps"] = abs(delta_v)
        result["effect"] = "ORBITAL_PHASE_SHIFT"

    # RADIAL
    elif maneuver in ["RADIAL_INWARD", "RADIAL_OUTWARD"]:
        # ΔV ≈ μ / (2 a^2 V) * Δr
        delta_v = (MU_EARTH / (2 * a**2 * V)) * delta_d  # km/s
        result["delta_v_mps"] = abs(delta_v * 1000)
        result["effect"] = "SEMI_MAJOR_AXIS_CHANGE"

    # CROSS-TRACK
    elif maneuver in ["CROSS_TRACK_NORMAL", "CROSS_TRACK_ANTI_NORMAL"]:
        # ΔV ≈ Δh / Δt
        delta_h = delta_d * 1000   # m
        delta_v = delta_h / tca_sec
        result["delta_v_mps"] = abs(delta_v)
        result["effect"] = "PLANE_CHANGE"

    # ATTITUDE ONLY
    elif maneuver == "ATTITUDE_ONLY":
        hbr_before = _get_hbr(conj)
        hbr_after = hbr_before * math.sqrt(Pc_target / Pc0)

        result["hbr_before_m"] = hbr_before
        result["hbr_after_m"] = hbr_after
        result["hbr_reduction_percent"] = \
            100 * (1 - hbr_after / hbr_before)

        result["delta_v_mps"] = 0.0
        result["effect"] = "HBR_REDUCTION"

    # DRAG MODULATION (LEO ONLY)
    elif maneuver == "DRAG_MODULATION":
        mass = conj.get("target_mass_kg", 10)
        A0 = conj.get("area_m2", 1.0)

        # Required along-track displacement
        s = delta_d * 1000   # m

        # s ≈ 1/2 aD t^2  →  aD = 2s/t^2
        aD_req = 2 * s / (tca_sec**2)

        # aD = 0.5 ρ Cd (A/m) V^2
        Vms = V * 1000
        A_req = (2 * aD_req * mass) / (RHO_LEO * CD * Vms**2)

        result["effective_area_before_m2"] = A0
        result["effective_area_after_m2"] = A_req
        result["delta_v_mps"] = 0.0
        result["effect"] = "DRAG_INDUCED_PHASE_SHIFT"

    else:
        raise ValueError("Unknown maneuver type")

    return result


# HELPERS

def _norm(v):
    return math.sqrt(sum(x*x for x in v))


def _estimate_semi_major_axis(r, v):
    R = _norm(r)
    V = _norm(v)
    mu = MU_EARTH
    return 1 / (2/R - V*V/mu)


def _get_hbr(conj):
    # from prediction phase
    return conj["risk_metrics"].get("hbr_m", 0.65)
