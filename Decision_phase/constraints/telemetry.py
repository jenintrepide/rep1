def telemetry_aware_filter(maneuvers, telemetry, constraints, conj):
    """
    Step 7 – Telemetry-Aware Constraint Filtering

    Adds:
      - can_be_executed : bool
      - reason_if_not_executable : str or None
    """

    for m in maneuvers:

        # Default state
        m["can_be_executed"] = True
        m["reason_if_not_executable"] = None

        # 1. FUEL AVAILABILITY
        dv = m.get("delta_v_mps", 0.0)
        fuel_needed = dv * 0.04   # kg per m/s (same as earlier model)
        m["fuel_cost_kg"] = fuel_needed

        if fuel_needed > telemetry.get("fuel_remaining_kg", 0):
            _fail(m, "FAILED_TELEMETRY_INSUFFICIENT_FUEL")
            continue

        # 2. THRUSTER CAPABILITY
        if dv > 0:
            if not telemetry.get("thrusters_available", False):
                _fail(m, "FAILED_TELEMETRY_NO_THRUSTERS")
                continue

            max_dv = telemetry.get("max_delta_v_per_burn_mps", 0.0)
            if dv > max_dv:
                _fail(m, "FAILED_TELEMETRY_THRUSTER_LIMIT")
                continue

        # 3. POWER LIMITS
        min_power = constraints.get("min_power_margin_w", 0)
        if telemetry.get("power_margin_w", 0) < min_power:
            _fail(m, "FAILED_TELEMETRY_POWER_MARGIN")
            continue

        # 4. THERMAL LIMITS
        min_thermal = constraints.get("min_thermal_margin_c", 0)
        if telemetry.get("thermal_margin_c", 0) < min_thermal:
            _fail(m, "FAILED_TELEMETRY_THERMAL_MARGIN")
            continue

        # 5. ATTITUDE CONSTRAINTS
        att_mode = telemetry.get("attitude_mode", "NOMINAL")

        if m["maneuver"] in [
            "ALONG_TRACK_PROGRADE", "ALONG_TRACK_RETROGRADE",
            "RADIAL_INWARD", "RADIAL_OUTWARD",
            "CROSS_TRACK_NORMAL", "CROSS_TRACK_ANTI_NORMAL"
        ]:
            if att_mode not in ["NOMINAL", "MANEUVER_READY"]:
                _fail(m, "FAILED_TELEMETRY_ATTITUDE_CONSTRAINT")
                continue

        if m["maneuver"] == "ATTITUDE_ONLY":
            if att_mode not in ["NOMINAL", "SUN_POINTING"]:
                _fail(m, "FAILED_TELEMETRY_ATTITUDE_CONSTRAINT")
                continue

        # 6. DRAG MODULATION FEASIBILITY
        if m["maneuver"] == "DRAG_MODULATION":

            # Must be in LEO
            if conj["metadata"]["regime"] != "LEO":
                _fail(m, "FAILED_TELEMETRY_NOT_IN_LEO")
                continue

            # Must be configurable
            if not telemetry.get("drag_modulation_capable", False):
                _fail(m, "FAILED_TELEMETRY_DRAG_NOT_CONFIGURABLE")
                continue

    return maneuvers


# INTERNAL HELPER
def _fail(maneuver, reason):
    maneuver["can_be_executed"] = False
    maneuver["reason_if_not_executable"] = reason
