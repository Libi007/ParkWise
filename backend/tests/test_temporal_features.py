from datetime import datetime
from zoneinfo import ZoneInfo
from app.services.timezone_service import (
    parse_and_normalize_datetime,
    extract_features_from_datetime,
)


def test_parse_aware_datetime_with_offset():
    """Test offset-aware ISO string is normalized correctly to Europe/Amsterdam."""
    # 10:30 UTC = 12:30 in CEST (+02:00 summer time in July)
    iso_str = "2026-07-15T10:30:00Z"
    local_dt, utc_dt, tz_name = parse_and_normalize_datetime(iso_str)
    assert tz_name == "Europe/Amsterdam"
    assert local_dt.hour == 12
    assert local_dt.minute == 30
    assert utc_dt.hour == 10


def test_parse_naive_datetime():
    """Test naive ISO string is interpreted as local to Europe/Amsterdam."""
    iso_str = "2026-10-20T10:30:00"
    local_dt, utc_dt, tz_name = parse_and_normalize_datetime(iso_str)
    assert tz_name == "Europe/Amsterdam"
    assert local_dt.hour == 10
    assert local_dt.minute == 30


def test_feature_extraction_invariants():
    """Test temporal feature derivation math and data types."""
    tz = ZoneInfo("Europe/Amsterdam")
    # 2026-10-20 is a Tuesday (day_of_week=1, is_weekend=0)
    # Hour 14, Minute 45 -> time_slot = 14*4 + 45//15 = 56 + 3 = 59
    dt = datetime(2026, 10, 20, 14, 45, tzinfo=tz)

    feats = extract_features_from_datetime(
        local_dt=dt,
        facility_label="PF04",
        reference_capacity=112
    )

    assert feats["facility_label"] == "PF04"
    assert feats["reference_capacity"] == 112
    assert feats["time_slot"] == 59
    assert feats["day_of_week"] == 1  # Tuesday
    assert feats["is_weekend"] == 0
    assert feats["month"] == 10
    assert feats["day_of_year"] == dt.timetuple().tm_yday


def test_weekend_detection():
    """Test Saturday and Sunday detection."""
    tz = ZoneInfo("Europe/Amsterdam")
    # 2026-10-24 is Saturday (day_of_week=5)
    sat_dt = datetime(2026, 10, 24, 12, 0, tzinfo=tz)
    feats = extract_features_from_datetime(sat_dt, "PF01", 84)
    assert feats["day_of_week"] == 5
    assert feats["is_weekend"] == 1

    # 2026-10-25 is Sunday (day_of_week=6)
    sun_dt = datetime(2026, 10, 25, 12, 0, tzinfo=tz)
    feats = extract_features_from_datetime(sun_dt, "PF01", 84)
    assert feats["day_of_week"] == 6
    assert feats["is_weekend"] == 1
