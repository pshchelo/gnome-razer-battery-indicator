const { GObject, Gio, St, Clutter } = imports.gi;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const _ = ExtensionUtils.gettext;


var Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
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
                const box = this._getDeviceBox(this._chooseDevice(devices));
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

        _chooseDevice(devices) {
            // TODO: choose device with minimal battery level and not charging
            return devices.devices[0];
        }

        _getDeviceIcon(device) {
            // TODO: change icon based on battery level and charging status
            const iconFilePath = "icons/openrazer-static.svg"
            const iconPath = ExtensionUtils.getCurrentExtension().dir.get_child(iconFilePath).get_path()
            const gicon = Gio.icon_new_for_string(`${iconPath}`)
            const icon = new St.Icon({
                gicon: gicon,
                style_class: "system-status-icon",
            });
            return icon
        }
        
});

