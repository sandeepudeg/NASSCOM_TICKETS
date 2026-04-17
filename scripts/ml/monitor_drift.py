#!/usr/bin/env python3
"""
monitor_drift.py — CLI script for category distribution drift monitoring.

This script checks for category distribution drift over a rolling 24-hour window
and sends alerts via webhook if any category deviates by more than 20 percentage
points from the training distribution.

Usage:
    python monitor_drift.py [--window-hours 24] [--once]

Options:
    --window-hours: Rolling window size in hours (default: 24)
    --once: Run once and exit (default: run continuously every hour)

Requirements: 15.4
"""

import argparse
import asyncio
import sys
from datetime import datetime

from src.repositories.database import get_db
from src.services.drift_monitor import (
    DriftMonitor,
    load_training_distribution_from_mlflow,
)


async def monitor_drift_once(window_hours: int = 24):
    """Run drift monitoring once."""
    print(f"[{datetime.utcnow().isoformat()}] Starting drift monitoring check...")

    # Load training distribution from MLflow (or use default)
    training_dist = await load_training_distribution_from_mlflow()
    if training_dist:
        print("[INFO] Loaded training distribution from MLflow")
    else:
        print("[INFO] Using default training distribution")

    # Run drift check
    async for session in get_db():
        monitor = DriftMonitor(session)
        await monitor.monitor_and_alert(
            training_distribution=training_dist,
            window_hours=window_hours,
        )
        break  # Only need one session


async def monitor_drift_continuous(window_hours: int = 24, interval_hours: int = 1):
    """Run drift monitoring continuously at regular intervals."""
    print(
        f"[INFO] Starting continuous drift monitoring (interval: {interval_hours}h, window: {window_hours}h)"
    )

    while True:
        try:
            await monitor_drift_once(window_hours)
        except Exception as e:
            print(f"[ERROR] Drift monitoring failed: {e}", file=sys.stderr)

        # Wait for next interval
        print(f"[INFO] Next check in {interval_hours} hour(s)...")
        await asyncio.sleep(interval_hours * 3600)


def main():
    parser = argparse.ArgumentParser(
        description="Monitor category distribution drift in production."
    )
    parser.add_argument(
        "--window-hours",
        type=int,
        default=24,
        help="Rolling window size in hours (default: 24)",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run once and exit (default: run continuously every hour)",
    )
    parser.add_argument(
        "--interval-hours",
        type=int,
        default=1,
        help="Check interval in hours for continuous mode (default: 1)",
    )
    args = parser.parse_args()

    if args.once:
        asyncio.run(monitor_drift_once(args.window_hours))
    else:
        asyncio.run(monitor_drift_continuous(args.window_hours, args.interval_hours))


if __name__ == "__main__":
    main()
