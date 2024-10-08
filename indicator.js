import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';


export const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {

        constructor(ext_dir) {
          super();
          this._ext_dir = ext_dir;
        }

        _init() {
            super._init(0.0, _("Razer Battery Indicator"));
            this._container = new St.BoxLayout();
            this.add_child(this._container);
            this._deviceList = new PopupMenu.PopupMenuSection("Razer Devices");
            this.menu.addMenuItem(this._deviceList)
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem())
            this.refreshItem = new PopupMenu.PopupMenuItem(_('Refresh'));
            this.menu.addMenuItem(this.refreshItem)
        }

        _updateDeviceList(devices) {
            this._deviceList.removeAll();
            if (devices.error)  {
                this._deviceList.addMenuItem(new PopupMenu.PopupMenuItem("ERROR!"));
            } else if (!devices.devices.length) {
                this._deviceList.addMenuItem(new PopupMenu.PopupMenuItem("No devices detected"));
            } else {
                for (const dev of devices.devices) {
                    // TODO: add dynamic icons
                    let menuText = dev.battery_level + "% " + dev.name;
                    if (dev.charging) {
                        menuText += " (charging)"
                    }
                    this._deviceList.addMenuItem(new PopupMenu.PopupMenuItem(menuText));
                }
            };
        }

        _updateIcon(devices) {
            this._container.remove_all_children();
            if (devices.error)  {
                const box = this._getErrorBox();
                this._container.add_child(box);
            } else if (!devices.devices.length) {
                const box = this._getNoDevicesBox();
                this._container.add_child(box);
            } else {
                const box = this._getDeviceBox(devices.devices[0]);
                this._container.add_child(box);
            }
        }

        refresh(devices) {
            this._updateIcon(devices)
            this._updateDeviceList(devices)
        }

        _getNoDevicesBox() {
            const box = new St.BoxLayout({ style_class: "panel-status-menu-box" });
            const icon = new St.Icon({
                icon_name: "battery-missing-symbolic",
                style_class: "system-status-icon",
            });
            box.add_child(icon);
            return box;
        }

        _getErrorBox() {
            const box = new St.BoxLayout({ style_class: "panel-status-menu-box" });
            const icon = new St.Icon({
                icon_name: "warning-symbolic",
                style_class: "system-status-icon",
            });
            box.add_child(icon);
            return box;
        }

        _getDeviceBox(device) {
            const box = new St.BoxLayout({ style_class: "panel-status-menu-box" });
            const icon = this._getDeviceIcon(device);
            const percent = new St.Label({
                y_align: Clutter.ActorAlign.CENTER
            });
            percent.text = device.battery_level + "%";
            box.add_child(icon);
            box.add_child(percent);
            return box;
        }

        _getDeviceIcon(device) {
            // TODO: change icon based on battery level and charging status
            const iconFilePath = "icons/openrazer-static.svg"
            const iconPath = this._ext_dir.get_child(iconFilePath).get_path()
            const gicon = Gio.icon_new_for_string(`${iconPath}`)
            const icon = new St.Icon({
                gicon: gicon,
                style_class: "system-status-icon",
            });
            return icon
        }
        
});
