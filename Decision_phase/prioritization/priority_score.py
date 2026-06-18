import math
from datetime import datetime, timezone
from Decision_phase.config.thresholds import W1, W2, W3, W4
from Decision_phase.utils.time_utils import tca_seconds_from_impact_time

EPS = 1e-12


def normalize(values):
    vmin, vmax = min(values), max(values)
    if abs(vmax - vmin) < EPS:
        return [0.5] * len(values)
    return [(v - vmin) / (vmax - vmin) for v in values]


def prioritize_conjunctions(conjunctions):
    pcs = []
    miss_dists = []
    severities = []
    tcas = []

    # --- extract raw metrics ---
    for c in conjunctions:
        pcs.append(math.log10(max(
            c["risk_metrics"]["collision_probability"], EPS
        )))
        miss_dists.append(1.0 / max(
            c["risk_metrics"]["miss_distance_km"], EPS
        ))
        severities.append(c["assessment"]["severity_score"])
        tca_sec = max(tca_seconds_from_impact_time(c["impact_time"]), EPS)
        tcas.append(1.0 / tca_sec)

    # --- normalize ---
    pcs_n = normalize(pcs)
    miss_n = normalize(miss_dists)
    sev_n = normalize(severities)
    tca_n = normalize(tcas)

    # --- compute priority ---
    for i, c in enumerate(conjunctions):
        c["priority_score"] = (
            W1 * pcs_n[i] +
            W2 * miss_n[i] +
            W3 * sev_n[i] +
            W4 * tca_n[i]
        )

    return sorted(conjunctions,
                  key=lambda x: x["priority_score"],
                  reverse=True)
