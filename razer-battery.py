#!/usr/bin/env python3
import argparse
import json
import time
parser = argparse.ArgumentParser(prog="razer-battery")
parser.add_argument("--fake", action='store_true')
args = parser.parse_args()
output = {"devices": []}
if args.fake:
    output["devices"].append(
        {
            "name": "Fake Razer Device",
            "type": "mouse",
            "battery_level": 100 - int(time.localtime().tm_min * 100 / 60),
            "charging": False,
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
            # NOTE: for disconnected devices openrazer reportsbattery_level
            # battery_level of 0, which is not that helpful.
            # One attribute I have found (on my sample of 1 mouse :-/ )
            # is that the get_idle_time returns 0 for disconnected and
            # non-0 for connected device, so use that to filter devices out.
            for dev in dm.devices if (
                    dev.has("battery") and
                    dev.has("get_idle_time") and
                    dev.get_idle_time()
            )
        ]
        output["devices"].extend(devices)
    except Exception as exc:
        output["error"] = str(exc)
print(json.dumps(output))
