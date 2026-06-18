import numpy as np

CARA = {"CREWED":1e-5,"UNCREWED":1e-4}

# MAIN API

def cara_risk_validation(prediction, maneuvers, spacecraft_type="LARGE"):
    """
    Step 13 – CARA Risk Validation

    
    - If non-compliant:
        can_be_executed = False
        reason_if_not_executable = "CARA_RISK_VALIDATION_FAILED"
    """

    pc_threshold = CARA.get(spacecraft_type, 1e-4)

    # Loop through maneuvers
    for m in maneuvers:

        # Collect best available Pc estimate-
        pc_vals = []

        # High-fidelity result
        if "hifi_effect" in m and m["hifi_effect"].get("collision_probability") is not None:
            pc_vals.append(m["hifi_effect"]["collision_probability"])

        # Monte Carlo result
        if "mc_assessment" in m and m["mc_assessment"].get("collision_probability_mc") is not None:
            pc_vals.append(m["mc_assessment"]["collision_probability_mc"])

        # Analytic fallback
        if "pc_est_after" in m:
            pc_vals.append(m["pc_est_after"])

        # If no Pc available → treat as unsafe
        if not pc_vals:
            _mark_failed(m)
            continue

        # Conservative: take MAX Pc
        residual_pc = max(pc_vals)

        # CARA threshold check
        if residual_pc > pc_threshold:
            _mark_failed(m, residual_pc, pc_threshold)
        else:
            # add compliance flag only
            m["cara_compliant"] = True

    return maneuvers


# SUPPORT

def _mark_failed(m, pc=None, threshold=None):
    """
    Adds failure flags.
    """

    # Preserve earlier flags if already non-executable
    m["can_be_executed"] = False
    m["reason_if_not_executable"] = "CARA_RISK_VALIDATION_FAILED"

    if pc is not None:
        m["cara_validation"] = {
            "residual_pc": float(pc),
            "threshold": float(threshold),
            "status": "FAILED"
        }
    else:
        m["cara_validation"] = {
            "residual_pc": None,
            "threshold": threshold,
            "status": "FAILED_NO_PC"
        }
