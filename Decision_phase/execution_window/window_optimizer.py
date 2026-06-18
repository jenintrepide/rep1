from datetime import datetime, timedelta

MIN_LEAD_TIME_SEC = 600          # 10 min before execution
MAX_LOOKAHEAD_SEC = 6 * 3600     # search up to 6 hours before TCA
WINDOW_STEP_SEC = 120           # check every 2 minutes

def optimize_execution_windows(prediction, maneuvers, telemetry):
    """
    Step 10 – Execution Window Optimization

    Adds ONLY:
      maneuver["execution_window"] = {...}
    """

    tca_time = datetime.fromisoformat(
        prediction["impact_time"].replace("Z", "")
    )

    now = datetime.utcnow()

    # Build candidate time grid
    search_start = max(now + timedelta(seconds=MIN_LEAD_TIME_SEC),
                       tca_time - timedelta(seconds=MAX_LOOKAHEAD_SEC))

    search_end = tca_time - timedelta(seconds=MIN_LEAD_TIME_SEC)

    candidate_times = []
    t = search_start
    while t <= search_end:
        candidate_times.append(t)
        t += timedelta(seconds=WINDOW_STEP_SEC)

    # Evaluate each maneuver
    for m in maneuvers:

        valid_times = []

        for t_exec in candidate_times:
            if _check_all_constraints(t_exec, m, telemetry):
                valid_times.append(t_exec)

        # Attach results
        if valid_times:
            optimal_time = valid_times[0]
            lead_time = (tca_time - optimal_time).total_seconds()

            m["execution_window"] = {
                "optimal_times_utc": [t.isoformat() + "Z" for t in valid_times[:3]],
                "lead_time_sec": round(lead_time, 2),
                "window_available": True
            }
        else:
            m["execution_window"] = {
                "optimal_times_utc": [],
                "lead_time_sec": None,
                "window_available": False
            }

    return maneuvers


# CONSTRAINT CHECKS

def _check_all_constraints(exec_time, maneuver, telemetry):
    return (
        _ground_station_visible(exec_time, telemetry) and
        _comm_not_in_blackout(exec_time, telemetry) and
        _sunlight_ok(exec_time, telemetry) and
        _gnss_available(exec_time, telemetry) and
        _thermal_safe(exec_time, maneuver, telemetry)
    )


# 1. Ground station visibility
def _ground_station_visible(t, telemetry):
    """
    Uses telemetry-provided next visibility windows if available.
    """
    windows = telemetry.get("ground_station_windows", [])

    if not windows:
        # If unknown → assume visible (do not over-reject)
        return True

    for w in windows:
        start = datetime.fromisoformat(w["start"])
        end   = datetime.fromisoformat(w["end"])
        if start <= t <= end:
            return True
    return False


# 2. Communication blackout
def _comm_not_in_blackout(t, telemetry):
    blackouts = telemetry.get("comm_blackouts", [])

    for b in blackouts:
        start = datetime.fromisoformat(b["start"])
        end   = datetime.fromisoformat(b["end"])
        if start <= t <= end:
            return False
    return True

# 3. Eclipse / sunlight
def _sunlight_ok(t, telemetry):
    eclipse_windows = telemetry.get("eclipse_windows", [])

    for e in eclipse_windows:
        start = datetime.fromisoformat(e["start"])
        end   = datetime.fromisoformat(e["end"])
        if start <= t <= end:
            return False
    return True


# 4. GNSS availability
def _gnss_available(t, telemetry):
    outages = telemetry.get("gnss_outages", [])

    for o in outages:
        start = datetime.fromisoformat(o["start"])
        end   = datetime.fromisoformat(o["end"])
        if start <= t <= end:
            return False
    return True


# 5. Thermal safety
def _thermal_safe(t, maneuver, telemetry):
    """
    Conservative rule:
    If thermal margin is low, avoid maneuvers that
    change attitude or increase drag.
    """

    thermal_margin = telemetry.get("thermal_margin_c", 100)

    if thermal_margin < 5:
        if maneuver["maneuver"] in [
            "ATTITUDE_ONLY",
            "DRAG_MODULATION",
            "CROSS_TRACK_NORMAL",
            "CROSS_TRACK_ANTI_NORMAL"
        ]:
            return False

    return True