#!/usr/bin/env python3
import argparse
import json
import time
parser = argparse.ArgumentParser(prog="razer-battery")
parser.add_argument("--fake", action='store_true')
args = parser.parse_args()
output = {"devices": [], "error": None}
if args.fake:
    output["devices"].append(
        {
            "name": "Fake Razer Mouse",
            "type": "mouse",
            "battery_level": 100 - int(time.localtime().tm_min * 100 / 60),
            "charging": False,
        }
    )
    output["devices"].append(
        {
            "name": "Fake Razer Keyboard",
            "type": "keyboard",
            "battery_level": int(time.localtime().tm_min * 100 / 60),
            "charging": True,
        }
    )
else:
    try:
        from openrazer import client
        dm = client.DeviceManager()
        devices = [
            {
                "name": dev.name,
                "type": dev.type,
                "battery_level": dev.battery_level,
                "charging": dev.is_charging,
            }
            for dev in dm.devices if dev.has("battery")
        ]
        output["devices"].extend(devices)
    except Exception as exc:
        output["error"] = str(exc)
print(json.dumps(output))
