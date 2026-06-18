import time
import json
from typing import Any, Dict, List, Optional

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from detection import run_detection
from prediction import PredictionEngine
from Decision_phase.decision_engine import run_decision_phase


app = FastAPI(title="Collision Avoidance API")

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://127.0.0.1:5500", "http://localhost:5500", "http://127.0.0.1:5501", "http://localhost:5501"],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# INPUT MODELS
# ============================================================
class SatelliteInput(BaseModel):
    name: str
    perigee_km: float
    apogee_km: float
    inclination_deg: float


class PredictionJSONInput(BaseModel):
    status: str
    detections: int = 0
    prediction_results: List[Dict[str, Any]] = []
    runtime_sec: Optional[float] = None


# ============================================================
# USER CREDENTIALS
# ============================================================
USERNAME = "agrawalaryan426@gmail.com"
PASSWORD = "yU7T6Cdz8V9-mMd"


# ============================================================
# TELEMETRY
# ============================================================
telemetry = {
    "fuel_remaining_kg": 15.0,
    "max_single_burn_dv_mps": 0.5,
    "safe_emergency_dv_mps": 0.2,
    "min_safe_command_time_sec": 600,

    "thruster_max_dv_mps": 1.0,
    "power_available_w": 120.0,
    "thermal_margin_c": 15.0,

    "attitude_constraints_ok": True,
    "drag_modulation_capable": True,

    "ground_station_visibility": True,
    "in_eclipse": False,
    "gnss_available": True,
    "mission_type": "UNCREWED"
}


# ============================================================
# PREDICTION PIPELINE
# ============================================================
def run_prediction_pipeline(SAT_INPUT: dict):
    start_time = time.perf_counter()

    print("✅ STAGE 1: Detection started")
    detection_output = run_detection(
        SAT_INPUT=SAT_INPUT,
        USERNAME=USERNAME,
        PASSWORD=PASSWORD,
        telemetry=telemetry
    )
    print("✅ STAGE 1: Detection finished")

    if detection_output["status"] == "LOGIN_FAILED":
        return detection_output

    if detection_output["status"] == "CLEAR":
        return {
            "status": "CLEAR",
            "detections": 0,
            "prediction_results": [],
            "runtime_sec": round(time.perf_counter() - start_time, 2)
        }

    alerts = detection_output["alerts"]
    jd_start = detection_output["jd_start"]
    satellite_map = detection_output["satellite_map"]

    print(f"✅ STAGE 2: Prediction started on {len(alerts)} alerts")

    predictor = PredictionEngine(
        target_side_length_m=0.3,
        target_mass_kg=12.0
    )

    prediction_results = []

    for alert in alerts:
        res = predictor.predict_impact(
            alert_data=alert,
            target_sat=telemetry["target_sat_model"],
            debris_sat=satellite_map[alert["OTHER_ID"]],
            debris_metadata={},
            jd_start=jd_start
        )

        res.update({
            "TARGET": alert["TARGET"],
            "OTHER_ID": alert["OTHER_ID"],
            "OTHER_NAME": alert["OTHER_NAME"],
            "MIN_DISTANCE_KM": alert["MIN_DISTANCE_KM"],
            "TCA_SEC": alert["TCA_SEC"],
            "R_TARGET_ECI_KM": alert["R_TARGET_ECI_KM"],
            "V_TARGET_KM_S": alert["V_TARGET_KM_S"]
        })

        prediction_results.append(res)

    print("✅ STAGE 2: Prediction finished")

    return {
        "status": "SUCCESS",
        "detections": len(alerts),
        "prediction_results": prediction_results,
        "runtime_sec": round(time.perf_counter() - start_time, 2)
    }


# ============================================================
# API 1A: /predict_json  (for automatic flow)
# ============================================================
@app.post("/predict_json")
def predict_json(input_sat: SatelliteInput):
    print("✅ /predict_json HIT:", input_sat)
    SAT_INPUT = input_sat.dict()
    result = run_prediction_pipeline(SAT_INPUT)
    return JSONResponse(content=result)


# ============================================================
# API 1B: /predict_download  (optional: download current output)
# ============================================================
@app.post("/predict_download")
def predict_download(input_sat: SatelliteInput):
    print("✅ /predict_download HIT:", input_sat)
    SAT_INPUT = input_sat.dict()

    result = run_prediction_pipeline(SAT_INPUT)
    json_bytes = json.dumps(result, indent=2).encode("utf-8")

    return Response(
        content=json_bytes,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=prediction_output.json"}
    )


# ============================================================
# API 2: /decide_json  (automatic input from API-1 output)
# ============================================================
@app.post("/decide_json")
def decide_json(prediction_data: PredictionJSONInput):
    try:
        # if no threats
        if prediction_data.status != "SUCCESS" or len(prediction_data.prediction_results) == 0:
            return JSONResponse(content={
                "status": prediction_data.status,
                "message": "No threats / decision not required.",
                "decision_report": None
            })

        decision_output_path = "decision_output.json"

        decision_report = run_decision_phase(
            prediction_output=prediction_data.prediction_results,
            telemetry=telemetry,
            decision_output_path=decision_output_path
        )

        return JSONResponse(content={
            "status": "SUCCESS",
            "decision_report": decision_report,
            "output_file": decision_output_path
        })

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
