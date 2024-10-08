# Razer battery charge indicator for GNOME shell

Shows a system tray icon with battery charge level
for Razer peripheral devices.

## Dependencies
Depends on `OpenRazer` daemon running and `python3-openrazer` installed.

## Installation

only manual for now:

### manual
- clone the repo
- symlink the repo folder to `~/.local/share/gnome-shell/extensions/razer-battery@pshchelo.github.com`
- log out and back in to GNOME session (on X11, restart with `Alt-F2, r` should also be enough)
- enable extension in extensions manager or via CLI

## Limitations
Started as 'scratch my itch', so tested only on my single setup.

Tested on GNOME 42, probably will work on GNOME 43 and 44,
and I expect it won't work on GNOME 45 due to some API changes,
will have to be adjusted later.

When there are several devices, the battery level for the device with least
battery will be shown in the icon, all the devices with names, battery level
and charging status are listed in the menu.

Battery charge level polling interval is hardcoded to 5 minutes.

See [TODO](#todo) below for list of possibly planned improvements :-). 

## Motivation
Could not find anything right away, so decided to write my own :-)
The `Polychromatic` openrazer client shows battery info only
in the controller app but not in the system tray applet.

## TODO

- port to GNOME 45+
- support customizations
  - polling interval
  - debug mode
  - icon style (symbolic, static, chroma)
- change icon based on percentage/charging status
- more complex icon based on device type (type + battery? only type?)
- properly react to device (dis|re)connects
  - openrazer does not seem to react too well,
    it remembers the device and returns battery level of 0 for disconnected devices it remembers
- publish to GNOME extensions web site

# Attributions

Heavily inspired by https://github.com/MichalW/gnome-bluetooth-battery-indicator

Icons by OpenRazer project (CC-BY-SA-4.0 2015-2017 Luke Horwell <code@horwell.me>)
