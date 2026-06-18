# 🚀 Satellite Collision Avoidance System (Detection → Prediction → Decision)

This project implements a **Satellite Collision Avoidance System** with a full pipeline:

1. ✅ **Detection Phase** – detects conjunction candidates (nearby debris objects)
2. ✅ **Prediction Phase** – estimates collision probability and risk
3. ✅ **Decision Phase** – recommends safe and cost-effective avoidance maneuvers

A **FastAPI backend** exposes the pipeline via APIs, and a **React + Vite frontend dashboard** visualizes results.

---

## 📌 System Architecture (3 Phases)

## ✅ Phase 1: Detection Phase
**Goal:** Identify potential close-approach (conjunction) candidates between a satellite and debris.

### 🔧 Detection Architecture (Brief)
- Collect debris/satellite objects (usually via TLE catalog)
- Propagate orbits to a chosen timestamp using **SGP4**
- Perform fast screening using **KD-Tree**
- Return debris candidates within a selected threshold radius (`KD_SCREEN_RADIUS_KM`)

### 🛠 Tech Used
- **Python**
- **SGP4** for orbit propagation
- **NumPy** for vector/matrix operations
- **SciPy (cKDTree)** for efficient nearest-neighbor search
- **requests** (optional) to fetch external catalog/TLE data

✅ **Output:** Conjunction candidate list → passed to Prediction Phase

---

## ✅ Phase 2: Prediction Phase
**Goal:** Estimate collision probability and risk metrics for detected conjunctions.

### 🔧 Prediction Architecture (Brief)
- Relative position and velocity estimation
- Closest approach approximation
- Covariance / uncertainty modeling
- Monte Carlo simulation to estimate collision probability and risk score
- Produces probability and conjunction-level stats

### 🛠 Tech Used
- **Python**
- **NumPy**
- Monte-Carlo based risk estimation (custom prediction engine)

✅ **Output File:** `prediction_output.json`

---

## ✅ Phase 3: Decision Phase
**Goal:** Choose the best maneuver (or null maneuver) to minimize risk while respecting mission constraints.

### 🔧 Decision Architecture (Brief)
Decision phase uses a modular pipeline:

1. **Prioritization**
   - Scores conjunctions to decide which to resolve first  
2. **Null Maneuver Evaluation**
   - Checks whether doing nothing is safe enough  
3. **Maneuver Enumeration**
   - Generates candidate maneuvers such as radial / along-track / cross-track actions  
4. **Effect Modeling**
   - Estimates the expected improvement in miss distance & reduction in risk  
5. **Constraint Filtering**
   - Removes maneuvers that violate telemetry or mission constraints  
6. **Cost Evaluation**
   - Cost-based selection to choose best maneuver  
7. **RL Policy Layer (Decision Support)**
   - Reinforcement learning layer can guide maneuver selection  
8. **Execution Window Optimization**
   - Finds best time window for execution  

### 🛠 Tech Used
- **Python**
- Modular decision pipeline implementation
- Reinforcement learning (policy based decision support)
- High fidelity estimation module (optional for better accuracy)

✅ **Output File:** `decision_output.json`

---

## 🌐 Backend (FastAPI)

### ✅ Backend Responsibilities
- Runs Detection → Prediction → Decision pipeline
- Provides API endpoints for frontend usage
- Generates JSON outputs for analysis/debugging

### 🛠 Backend Tech Used
- **FastAPI** (REST backend)
- **Uvicorn** (server)
- **Pydantic** (request/response validation)
- **CORS middleware** (frontend communication)

Backend entrypoint:
- `main.py`

---

## 💻 Frontend Dashboard

Frontend is inside:
- `frontend_dashboard/`

### ✅ Frontend Responsibilities
- Display detection candidates
- Show prediction probability/risk
- Visualize decision output and maneuver recommendation

### 🛠 Frontend Tech Used
- **React**
- **Vite**
- **Tailwind CSS**
- API integration via fetch/axios-style calls

---

## 📂 Output Files

### ✅ 1) `prediction_output.json`
Generated after Prediction Phase.  
Contains:
- debris/object conjunction details
- probability of collision
- miss distance / relative state estimates
- risk metrics

### ✅ 2) `decision_output.json`
Generated after Decision Phase.  
Contains:
- null maneuver result
- candidate maneuvers list
- ranked final maneuver recommendation
- expected risk reduction and execution window details

---

## ▶️ How to Run This Project (Complete Steps)

### ✅ Step 1: Download / Extract the Project
If you have the project as a `.zip`, extract it first and open the folder in terminal.

---

### ✅ Step 2: Create a Python Virtual Environment
```bash
python -m venv venv
```
Activate it:

Windows

venv\Scripts\activate


Linux / Mac

source venv/bin/activate

### ✅ Step 3: Install Backend Dependencies
```bash
pip install fastapi uvicorn numpy scipy sgp4 requests pydantic
```
#### ✅ Step 4: Run the Backend (FastAPI)

Make sure you are inside the project root directory, then run:
```bash
uvicorn main:app --reload
```

Backend will start at:

http://127.0.0.1:8000

(Optional) API Docs:

http://127.0.0.1:8000/docs

### ✅ Step 5: Run the Frontend Dashboard

Open a new terminal, then:
```bash
cd frontend_dashboard
npm install
npm run dev
```

Frontend will start at:

http://localhost:5173

### ✅ Step 6: Generate Outputs (Prediction + Decision)

Once backend is running, run the pipeline using the provided API endpoints or project execution flow.

The system will generate:

prediction_output.json

decision_output.json

These files contain the results for:
✅ collision probability prediction
✅ maneuver decision recommendation

### ✅ Step 7: Stop the Servers

To stop backend or frontend, press:

Ctrl + C


If you want, I can also add a **Troubleshooting section** (like node not installed / uvicorn error / module missing) ✅

