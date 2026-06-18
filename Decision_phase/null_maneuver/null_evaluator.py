CARA = {"CREWED":1e-5,"UNCREWED":1e-4}

def null_maneuver_check(conj, mission_type="UNCREWED"):
    pc = conj["risk_metrics"]["collision_probability"]
    return pc <= CARA[mission_type]
