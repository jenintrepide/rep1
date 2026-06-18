# Satellite Collision Detection

This Python script performs a basic collision detection analysis between a user-defined satellite and the public satellite catalog from [Space-Track.org](https://www.space-track.org/). It identifies potential close approaches (conjunctions) within a specified time window by propagating orbits using the SGP4 model.

## Features

*   Fetches the latest satellite catalog from Space-Track.
*   Allows defining a custom target satellite using orbital elements (perigee, apogee, inclination).
*   Propagates satellite orbits using the SGP4 model via the `sgp4` library.
*   Identifies and reports potential conjunctions based on a minimum distance threshold.
*   Configurable parameters for the time window, time step, and distance threshold.

## Prerequisites

*   Python 3
*   A [Space-Track.org](https://www.space-track.org/) account

## Installation

1.  Install the required Python libraries:
    ```sh
    pip install requests numpy pandas sgp4
    ```

## Configuration

Before running the script, you must configure several parameters at the top of the [`detection.py`](detection.py) file.

1.  **Space-Track Credentials**
    Update the `USERNAME` and `PASSWORD` variables with your account details.
    ````python
    // filepath: detection.py
    // ...existing code...
    USERNAME = "your-space-track-email@example.com"
    PASSWORD = "your-space-track-password"
    // ...existing code...
    ````

2.  **User Satellite Input**
    Define your custom satellite's orbit by modifying the `SAT_INPUT` dictionary.
    ````python
    // filepath: detection.py
    // ...existing code...
    SAT_INPUT = {
        "name": "CUSTOM_OBJECT",
        "perigee_km": 716.3,
        "apogee_km": 728.4,
        "inclination_deg": 98.8,
    }
    // ...existing code...
    ````

3.  **Analysis Parameters**
    Adjust the detection parameters as needed.
    *   `TIME_WINDOW_HOURS`: The duration in hours to check for conjunctions.
    *   `TIME_STEP_SEC`: The interval in seconds between each orbit propagation step.
    *   `DIST_THRESHOLD_KM`: The maximum distance in kilometers to be considered a potential conjunction.
    *   `MAX_OBJECTS`: The maximum number of objects to fetch from the Space-Track catalog.
    ````python
    // filepath: detection.py
    // ...existing code...
    TIME_WINDOW_HOURS = 24
    TIME_STEP_SEC = 300
    DIST_THRESHOLD_KM = 20
    MAX_OBJECTS = 30000
    // ...existing code...
    ````

## Usage

Run the script from your terminal:

```sh
python detection.py
```

The script will log into Space-Track, fetch the satellite data, and then perform the collision check.

## Output

The script will print the status of its operations to the console. If any potential conjunctions are found that meet the distance threshold, they will be printed at the end of the execution.

**Example Output:**

```
🔐 Logging into Space-Track...
✅ Login successful
📡 Fetching satellite catalog...
🛰️ Loaded 26837 satellites
🔍 Searching for close approaches...

🚨 POTENTIAL CONJUNCTIONS:
{'TARGET': 'CUSTOM_OBJECT', 'OTHER': '25544', 'MIN_DISTANCE_KM': 15.341, 'TCA_SEC': 43200}
{'TARGET': 'CUSTOM_OBJECT', 'OTHER': '28654', 'MIN_DISTANCE_KM': 8.912, 'TCA_SEC': 75600}
```

If no close approaches are detected, the output will be:

```
No close approaches detected.
```
