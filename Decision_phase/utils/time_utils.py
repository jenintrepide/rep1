from datetime import datetime, timezone

def tca_seconds_from_impact_time(impact_time_str: str,
                                 reference_time: datetime = None) -> float:
    """
    Converts impact_time from prediction output into seconds-to-TCA.

    Parameters
    ----------
    impact_time_str : str
        ISO 8601 string, e.g. "2026-01-14T22:34:09.668246Z"

    reference_time : datetime, optional
        Decision time. If None, uses current UTC time.

    Returns
    -------
    float
        Seconds until TCA (>=0). If negative, TCA already passed.
    """

    # Parse ISO time (Z = UTC)
    tca_time = datetime.fromisoformat(
        impact_time_str.replace("Z", "+00:00")
    )

    if reference_time is None:
        reference_time = datetime.now(timezone.utc)

    dt = (tca_time - reference_time).total_seconds()
    return max(0.0, dt)
