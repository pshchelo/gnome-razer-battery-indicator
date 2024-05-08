#!/usr/bin/env python3
import json
try:
    from openrazer import client
    dm = client.DeviceManager()
    output = [
        {
            "name": dev.name,
            "type": dev.type,
            "battery_level": dev.battery_level,
            "charging": dev.is_charging,
        }
        for dev in dm.devices if dev.has("battery")
    ]
except Exception as exc:
    output = {"error": str(exc)}
print(json.dumps(output))
