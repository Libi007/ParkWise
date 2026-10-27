import os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from dateutil import parser as date_parser


def get_facility_timezone():
    """Return the configured target timezone for parking facilities (default: Europe/Amsterdam)."""
    tz_str = os.getenv("PARKWISE_TIMEZONE", "Europe/Amsterdam")
    try:
        return ZoneInfo(tz_str)
    except Exception:
        return ZoneInfo("Europe/Amsterdam")


def parse_and_normalize_datetime(dt_input, target_tz=None):
    """
    Parse an input datetime string (ISO 8601 or similar) and normalize it to the target timezone.
    
    Behavior:
    - If input string includes timezone offset (e.g. +02:00 or Z):
      Parses offset-aware datetime and converts directly to target_tz.
    - If input string has NO timezone offset (naive datetime, e.g. 2026-10-20T10:30:00):
      Assumes local time in target_tz.
      
    Returns:
    - (local_dt, utc_dt, target_tz_name)
      local_dt: timezone-aware datetime in target_tz
      utc_dt: timezone-aware datetime in UTC
      target_tz_name: string name of target timezone
    """
    if target_tz is None:
        target_tz = get_facility_timezone()

    if isinstance(dt_input, datetime):
        parsed = dt_input
    elif isinstance(dt_input, str):
        try:
            parsed = date_parser.isoparse(dt_input)
        except Exception:
            parsed = date_parser.parse(dt_input)
    else:
        raise ValueError(f"Unsupported datetime input type: {type(dt_input)}")

    # Handle naive vs aware
    if parsed.tzinfo is None:
        # Naive datetime: assume it is expressed in facility local time
        local_dt = parsed.replace(tzinfo=target_tz)
    else:
        # Aware datetime: convert to facility local time
        local_dt = parsed.astimezone(target_tz)

    utc_dt = local_dt.astimezone(timezone.utc)
    return local_dt, utc_dt, str(target_tz)


def extract_features_from_datetime(local_dt, facility_label, reference_capacity):
    """
    Extract exact 7 model features from normalized local datetime and facility info.
    Features:
    1. facility_label: string (PF01 - PF11)
    2. reference_capacity: integer
    3. time_slot: (hour * 4) + (minute // 15), range 0 - 95
    4. day_of_week: Monday=0 to Sunday=6
    5. is_weekend: 1 if Saturday or Sunday else 0
    6. month: 1 - 12
    7. day_of_year: 1 - 366
    """
    hour = local_dt.hour
    minute = local_dt.minute
    time_slot = (hour * 4) + (minute // 15)
    day_of_week = local_dt.weekday()  # Monday is 0, Sunday is 6
    is_weekend = 1 if day_of_week in (5, 6) else 0
    month = local_dt.month
    day_of_year = local_dt.timetuple().tm_yday

    return {
        "facility_label": str(facility_label),
        "reference_capacity": int(reference_capacity),
        "time_slot": int(time_slot),
        "day_of_week": int(day_of_week),
        "is_weekend": int(is_weekend),
        "month": int(month),
        "day_of_year": int(day_of_year),
    }
