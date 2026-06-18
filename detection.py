# detection.py

import time
import numpy as np
import requests
from datetime import datetime
from sgp4.api import Satrec, WGS72, jday
from scipy.spatial import cKDTree

# ========================================================
# MAIN DETECTION FUNCTION
# ========================================================
def run_detection(
    SAT_INPUT,
    USERNAME,
    PASSWORD,
    telemetry,
    TIME_WINDOW_HOURS=24,
    TIME_STEP_SEC=60,
    DIST_THRESHOLD_KM=100,
    KD_SCREEN_RADIUS_KM=6000,
    SNAPSHOT_HOURS=(0, 6, 12, 18, 24),
    MAX_OBJECTS=36000
):
    start_time = time.perf_counter()

    # ========================================================
    # BUILD TARGET SATELLITE
    # ========================================================
    def create_satellite(perigee_km, apogee_km, inc_deg):
        mu = 398600.4418
        Re = 6378.137

        rp = perigee_km + Re
        ra = apogee_km + Re
        a = (rp + ra) / 2
        e = (ra - rp) / (ra + rp)
        n = np.sqrt(mu / a**3) * 60

        sat = Satrec()
        sat.sgp4init(
            WGS72, "i", 99999, 2451545.0,
            0.0, 0.0, 0.0,
            e, 0.0, np.radians(inc_deg),
            0.0, n, 0.0
        )
        return sat

    target_sat = create_satellite(
        SAT_INPUT["perigee_km"],
        SAT_INPUT["apogee_km"],
        SAT_INPUT["inclination_deg"]
    )

    telemetry["target_sat_model"] = target_sat

    # ========================================================
    # SPACE-TRACK LOGIN
    # ========================================================
    session = requests.Session()
    login = session.post(
        "https://www.space-track.org/ajaxauth/login",
        data={"identity": USERNAME, "password": PASSWORD}
    )

    if login.status_code != 200:
        return {"status": "LOGIN_FAILED"}

    # ========================================================
    # FETCH TLE CATALOG
    # ========================================================
    url = (
        "https://www.space-track.org/basicspacedata/query/"
        "class/gp/decay_date/null-val/orderby/NORAD_CAT_ID/format/json"
    )
    data = session.get(url).json()[:MAX_OBJECTS]

    satellites = []
    for s in data:
        sat = Satrec.twoline2rv(s["TLE_LINE1"], s["TLE_LINE2"])
        satellites.append({"id": s["NORAD_CAT_ID"],"name": s.get("OBJECT_NAME", "UNKNOWN"), "sat": sat})
    satellite_map = {
        s["id"]: s["sat"] for s in satellites
    }
    # ========================================================
    # TIME SETUP
    # ========================================================
    now = datetime.utcnow()
    jd0, _ = jday(
        now.year, now.month, now.day,
        now.hour, now.minute, now.second
    )

    # ========================================================
    # KD-TREE SCREENING
    # ========================================================
    candidate_ids = set()

    for h in SNAPSHOT_HOURS:
        jd = jd0 + (h * 3600) / 86400.0
        positions, refs = [], []

        for sat in satellites:
            e, r, _ = sat["sat"].sgp4(jd, 0.0)
            if e == 0:
                positions.append(r)
                refs.append(sat)

        if not positions:
            continue

        tree = cKDTree(np.array(positions))
        _, r_t, _ = target_sat.sgp4(jd, 0.0)

        idxs = tree.query_ball_point(r_t, r=KD_SCREEN_RADIUS_KM)
        for i in idxs:
            candidate_ids.add(refs[i]["id"])

    candidates = [s for s in satellites if s["id"] in candidate_ids]

    # ========================================================
    # FULL SWEEP DETECTION
    # ========================================================
    alerts = []

    for sat in candidates:
        min_dist = float("inf")
        best = None

        for t in range(0, TIME_WINDOW_HOURS * 3600, TIME_STEP_SEC):
            jd = jd0 + t / 86400.0

            e1, r1, v1 = target_sat.sgp4(jd, 0.0)
            e2, r2, v2 = sat["sat"].sgp4(jd, 0.0)
            if e1 or e2:
                continue

            r_rel = np.array(r2) - np.array(r1)
            dist = np.linalg.norm(r_rel)

            if dist < min_dist:
                min_dist = dist
                best = (t, r1, v1)

        if best and min_dist < DIST_THRESHOLD_KM:
            t, r_target, v_target = best
            alerts.append({
                "TARGET": SAT_INPUT["name"],

                "OTHER_ID": sat["id"],
                "OTHER_NAME": sat["name"],

                "MIN_DISTANCE_KM": round(min_dist, 3),
                "TCA_SEC": t,
                "R_TARGET_ECI_KM": list(r_target),
                "V_TARGET_KM_S": list(v_target)
            })


    elapsed = time.perf_counter() - start_time

    if not alerts:
        return {
            "status": "CLEAR",
            "runtime_sec": round(elapsed, 2),
            "jd_start": jd0,
            "satellite_map": satellite_map
        }

    return {
        "status": "ALERT",
        "count": len(alerts),
        "alerts": alerts,
        "runtime_sec": round(elapsed, 2),
        "jd_start": jd0,
        "satellite_map": satellite_map
    }
