from datetime import datetime, timedelta

# PARAMETER RESOLUTION

def get_emergency_parameters(telemetry):
    """
    All emergency thresholds come from mission policy / telemetry.
    No fixed constants.
    """
    return {
        "min_time_sec": telemetry.get(
            "min_safe_command_time_sec", 900
        ),
        "emergency_dv_mps": min(
            telemetry.get("safe_emergency_dv_mps", 0.2),
            telemetry.get("max_single_burn_dv_mps", 0.2)
        )
    }


def emergency_fallback_handler(prediction, maneuvers, telemetry):
    """
    Step 15 – Emergency Fallback

    Adds:
      decision["emergency_fallback"]
      maneuver["emergency_action"] (only for fallback maneuver)
    """

    params = get_emergency_parameters(telemetry)

    MIN_TIME_FOR_NOMINAL_ACTION_SEC = params["min_time_sec"]
    EMERGENCY_DV_MPS = params["emergency_dv_mps"]

    # 1. Check trigger conditions
    reason = _check_trigger_conditions(
        prediction,
        maneuvers,
        MIN_TIME_FOR_NOMINAL_ACTION_SEC
    )

    if not reason:
        # No emergency
        return maneuvers, {
            "emergency_fallback": {
                "triggered": False,
                "reason": None,
                "strategy": None
            }
        }

    # 2. Build emergency maneuver
    fallback = _build_emergency_maneuver(EMERGENCY_DV_MPS)

    # 3. Add fallback maneuver
    maneuvers.append(fallback)

    # 4. Decision-level flag
    decision_flag = {
        "emergency_fallback": {
            "triggered": True,
            "reason": reason,
            "strategy": "IMMEDIATE_RADIAL_OUT"
        }
    }

    return maneuvers, decision_flag


# TRIGGER LOGIC
def _check_trigger_conditions(prediction, maneuvers, min_time_sec):

    # A. Insufficient time to TCA
    tca = datetime.fromisoformat(
        prediction["impact_time"].replace("Z", "")
    )
    now = datetime.utcnow()
    time_to_tca = (tca - now).total_seconds()

    if time_to_tca < min_time_sec:
        return "INSUFFICIENT_TIME_TO_TCA"

    # B. No compliant maneuver
    compliant = [
        m for m in maneuvers
        if m.get("can_be_executed", True)
           and m.get("cara_compliant", False)
    ]

    if not compliant:
        return "NO_COMPLIANT_MANEUVER_AVAILABLE"

    return None


# EMERGENCY MANEUVER BUILDER
def _build_emergency_maneuver(emergency_dv):

    exec_time = datetime.utcnow() + timedelta(seconds=60)

    return {
        "maneuver": "RADIAL_OUT_EMERGENCY",
        # Physics
        "delta_v_mps": emergency_dv,

        # Execution-
        "execution_window": {
            "optimal_times_utc": [exec_time.isoformat() + "Z"],
            "lead_time_sec": 0,
            "window_available": True
        },

        # Flags
        "can_be_executed": True,
        "cara_compliant": False,

        # Emergency metadata
        "emergency_action": {
            "type": "RADIAL_OUT_EMERGENCY",
            "delta_v_mps": emergency_dv,
            "execution_time_utc": exec_time.isoformat() + "Z",
            "note": "AUTONOMOUS EMERGENCY FALLBACK"
        }
    }
