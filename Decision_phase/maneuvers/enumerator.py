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