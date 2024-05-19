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

Currently only first device with the 'battery' is displayed as a systray icon.

Battery charge level polling interval is hardcoded to once in 5 minutes.

See [TODO](#todo) below for list of possibly planned improvements :-). 

## Motivation
Could not find anything right away, so decided to write my own :-)
The `Polychromatic` openrazer client shows battery info only in the controller app
but not in the system tray applet.

## TODO

### alpha
- properly react to device (dis|re)connects
  - openrazer does not seem to react too well,
    it remembers the device and returns battery level of 0 for disconnected devices it remembers
- change icon based on percentage/charging status
- show device name and more info in the menu
- more complex icon based on device type (type + battery? only type?)
- add about dialog

### Beta (usable for others)
- support several devices at once
  - list devices and battery status in the menu
- support customizations
  - polling interval
  - choose which device battery status to show in the main icon?
    - show the least charged (and non-charging?) device?
- publish to GNOME extensions web site

# Attributions

Heavily inspired by https://github.com/MichalW/gnome-bluetooth-battery-indicator

Razer Icons by [Icons8](https://icons8.com/).
