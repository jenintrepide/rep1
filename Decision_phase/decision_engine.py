import json
from datetime import datetime
from torch import conj
from prediction import PredictionEngine

# Imports from your modules

from Decision_phase.prioritization.priority_score import prioritize_conjunctions
from Decision_phase.null_maneuver.null_evaluator import null_maneuver_check
from Decision_phase.maneuvers.enumerator import enumerate_maneuvers
from Decision_phase.maneuvers.effect_model import maneuver_effect_model
from Decision_phase.constraints.telemetry import telemetry_aware_filter
from Decision_phase.cost.cost_function import evaluate_costs
from Decision_phase.rl.policy_layer import RLPolicyLayer
from Decision_phase.rl.state_builder import build_observation
from Decision_phase.execution_window.window_optimizer import optimize_execution_windows
from Decision_phase.high_fidelity.hifi_effect_model import apply_high_fidelity_model
from Decision_phase.monte_carlo.mc_risk_assessment import run_post_maneuver_monte_carlo
from Decision_phase.validation.cara_validator import cara_risk_validation
from Decision_phase.fuel.fuel_recovery_check import fuel_recovery_check
from Decision_phase.emergency.emergency_fallback import emergency_fallback_handler

rl_policy = None

constraints = {
    "min_power_margin_w": 20,
    "min_thermal_margin_c": 5
}


# MAIN ENTRY

def run_decision_phase(prediction_output, telemetry, decision_output_path):
    """
    End-to-end Decision Phase Orchestrator.
    """
    global rl_policy

    decision_report = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "results": []
    }

    # STEP 1 — PRIORITIZE CONJUNCTIONS
    
    while len(prediction_output) > 0 and isinstance(prediction_output[0], list):
        prediction_output = prediction_output[0]
    prioritized = prioritize_conjunctions(prediction_output)

    for conj in prioritized:
        regime = conj["metadata"]["regime"]
        target_name = conj.get("target_name") or conj.get("TARGET", "UNKNOWN_TARGET")
        other_id = conj.get("other_id") or conj.get("OTHER_ID")
        other_name = conj.get("other_name") or conj.get("OTHER_NAME", "UNKNOWN_DEBRIS")

        # STEP 2 — NULL MANEUVER EVALUATION
        mission_type = telemetry.get("mission_type", "UNCREWED")
        null_eval = null_maneuver_check(conj, mission_type)

        # STEP 3 — MANEUVER ENUMERATION
        maneuver_names = enumerate_maneuvers(regime)

        maneuvers = [{"maneuver": m} for m in maneuver_names]

        # STEP 4 — MANEUVER EFFECT MODELING (ANALYTIC)
        new_maneuvers = []
        for m in maneuvers:
            result = maneuver_effect_model(
                maneuver=m["maneuver"],
                conj=conj,
                mission_type=mission_type
            )
            new_maneuvers.append(result)

        maneuvers = new_maneuvers

        # STEP 5 — TELEMETRY-AWARE CONSTRAINT FILTERING
        maneuvers = telemetry_aware_filter(
            maneuvers=maneuvers,
            telemetry=telemetry,
            constraints=constraints,
            conj=conj
        )

        # STEP 6 — COST FUNCTION EVALUATION
        maneuvers = evaluate_costs(maneuvers, telemetry)

        # STEP 7 — RL POLICY LAYER (DRQN)
        # ---- initialize RL policy once ----
        if rl_policy is None:
            # infer input dimension from state builder
            sample_obs = build_observation(conj, telemetry, maneuvers[0])
            input_dim = len(sample_obs)

            rl_policy = RLPolicyLayer(input_dim=input_dim)

            # ---- load model ONLY ONCE ----
            action_space = [m["maneuver"] for m in maneuvers]
            rl_policy.load_model(
                action_space=action_space,
                weight_path=None   # later: "trained_drqn.pt"
            )

        # ---- rank maneuvers ----
        maneuvers = rl_policy.rank_maneuvers(conj, maneuvers, telemetry)


        # STEP 8 — EXECUTION WINDOW OPTIMIZATION
        maneuvers = optimize_execution_windows(conj, maneuvers, telemetry)

        # STEP 9 — HIGH-FIDELITY EFFECT MODELING
        target_sat = telemetry.get("target_sat_model")
        debris_sat = telemetry.get("debris_sat_model")
        physics_engine = PredictionEngine(
            target_side_length_m=0.3,
            target_mass_kg=12.0
        )


        maneuvers = apply_high_fidelity_model(
            prediction=conj,
            maneuvers=maneuvers,
            target_sat=target_sat,
            debris_sat=debris_sat,
            physics_engine=physics_engine
        )


        # STEP 10 — POST-MANEUVER MONTE CARLO RISK
        maneuvers = run_post_maneuver_monte_carlo(
            prediction=conj,
            maneuvers=maneuvers,
            target_sat=target_sat,
            debris_sat=debris_sat,
            physics_engine=physics_engine
        )

        # STEP 11 — CARA RISK VALIDATION
        maneuvers = cara_risk_validation(conj, maneuvers)

        # STEP 12 — ΔV TO RETURN TO NOMINAL
        maneuvers = fuel_recovery_check(maneuvers, telemetry)

        # STEP 13 — EMERGENCY FALLBACK
        maneuvers, emergency_status = emergency_fallback_handler(
            conj, maneuvers, telemetry
        )

        # FINAL PACKAGE
        decision_report["results"].append({
            "conjunction_id": f'{conj["target_name"]}_{conj["other_id"]}',
            "target_name": target_name,
            "debris_id": other_id,
            "debris_name": other_name,
            "null_maneuver_evaluation": null_eval,
            "maneuvers": maneuvers,
            "emergency_fallback": emergency_status["emergency_fallback"]
        })

    # WRITE OUTPUT
    with open(decision_output_path, "w") as f:
        json.dump(decision_report, f, indent=2)

    return decision_report
