import math

# CONFIGURATION
G0 = 9.80665   # m/s^2


def fuel_recovery_check(maneuvers, telemetry):
    """
    Step 14 – ΔV to Return to Nominal Flight Path

    Adds ONLY:
      maneuver["fuel_recovery"] = {...}

    If insufficient fuel:
      can_be_executed = False
      reason_if_not_executable = "INSUFFICIENT_FUEL_FOR_RECOVERY"
    """

    # Spacecraft propulsion parameters
    dry_mass = telemetry.get("dry_mass_kg", 50.0)
    fuel_remaining = telemetry.get("fuel_remaining_kg", 1.0)
    isp = telemetry.get("isp_s", 220.0)

    for m in maneuvers:

        dv_maneuver = m.get("delta_v_mps", 0.0)

        # 1. Recovery ΔV
        # Conservative: need 80% of applied ΔV to rejoin nominal orbit
        recovery_dv = 0.8 * dv_maneuver

        # 2. Total ΔV
        total_dv = dv_maneuver + recovery_dv

        # 3. Fuel required (Tsiolkovsky)
        m0 = dry_mass + fuel_remaining

        if total_dv <= 0:
            fuel_required = 0.0
        else:
            mf = m0 / math.exp(total_dv / (isp * G0))
            fuel_required = m0 - mf

        # 4. Fuel margin
        fuel_margin = fuel_remaining - fuel_required

        # 5. Attach results (ADD ONLY)
        m["fuel_recovery"] = {
            "recovery_delta_v_mps": round(recovery_dv, 4),
            "total_delta_v_mps": round(total_dv, 4),
            "fuel_required_kg": round(fuel_required, 6),
            "fuel_remaining_kg": round(fuel_remaining, 6),
            "fuel_margin_kg": round(fuel_margin, 6),
            "status": "PASS" if fuel_margin >= 0 else "FAIL"
        }

        # 6. Enforce constraint (do NOT remove maneuver)
        if fuel_margin < 0:
            m["can_be_executed"] = False
            m["reason_if_not_executable"] = "INSUFFICIENT_FUEL_FOR_RECOVERY"

    return maneuvers
