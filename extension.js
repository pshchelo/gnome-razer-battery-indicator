const GETTEXT_DOMAIN = "razer-battery-indicator";
const { GObject, Gio, GLib, St, Clutter } = imports.gi;
// TODO: Gnome 45 works differently
const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const _ = ExtensionUtils.gettext;

const PYTHON_SCRIPT_PATH = "razer-battery.py"
const INTERVAL = 5 // in minutes

const DEBUG = false
const DEBUG_INTERVAL = 30 // in seconds

class OpenRazerDeviceInfo {
    constructor() {
        this._cancellable = null;
    }

    fetch(onSuccess) {
        this.cancel();
        
        const argv = [
            ["python3"].find(cmd => GLib.find_program_in_path(cmd)),
            ExtensionUtils.getCurrentExtension().dir.get_child(PYTHON_SCRIPT_PATH).get_path()
        ];

        if (!argv[0]) {
            log("ERROR: Python not found.");
            return;
        }
        if (DEBUG) {
            argv.push("--fake")
        }
        
        try {
            const proc = new Gio.Subprocess({
                argv,
                flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            });

            this._cancellable = new Gio.Cancellable();
            proc.init(this._cancellable);

            proc.communicate_utf8_async(null, null, (proc, res) => {
                const [, stdout] = proc.communicate_utf8_finish(res);

                if (proc.get_successful() && stdout) {
                    log("[razer-battery-indicator] script output " + stdout);
                    onSuccess(JSON.parse(stdout));
                }
            });

            this._cancellable.connect(() => proc.force_exit());
        } catch (e) {
            log("ERROR: Script execution failed: " + e);
        }
    }

    cancel() {
        if (this._cancellable instanceof Gio.Cancellable) {
            this._cancellable.cancel();
            this._cancellable = null;
        }
    }
}

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _("Razer Battery Indicator"));
        this._container = new St.BoxLayout();
        this.add_child(this._container)
        this.menu.addMenuItem(new PopupMenu.PopupMenuItem(_("Razer Battery Status")))
    }

    _addMenuItem(item) {
        this.menu.addMenuItem(item);
    }

    refresh(devices) {
        this._container.remove_all_children();
        if (devices.hasOwnProperty("error") || !devices.hasOwnProperty("devices"))  {
            const box = this._getErrorBox();
            this._container.add_child(box);
        } else if (!devices.devices.length) {
            const box = this._getNoDevicesBox();
            this._container.add_child(box);
        } else {
            const box = this._getDeviceBox(devices);
            this._container.add_child(box);
        }
        // TODO: update menu as well
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

    _getDeviceBox(devices) {
        const box = new St.BoxLayout({ style_class: "panel-status-menu-box" });
        const device = this._chooseDevice(devices);
        const icon_name = this._getDeviceIcon(device);
        const icon = new St.Icon({
            icon_name: icon_name,
            style_class: "system-status-icon",
        });
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
        // TODO: choose proper icon based on charge level and charging status
        return "battery-symbolic";
    }
    
});

class RazerBatteryStatusExtension {
    constructor(uuid) {
        this._uuid = uuid;
        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        this._indicator = new Indicator();
        this._datasource = new OpenRazerDeviceInfo();
        Main.panel.addToStatusArea(this._uuid, this._indicator);
        this._getRefreshButton();
        this._loop = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, this._runLoop.bind(this));
    }

    _runLoop() {
        this._refresh();
        this._loop = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            this._getInterval(),
            this._runLoop.bind(this)
        );
    }
    
    _getInterval() {
        if (DEBUG) {
            return DEBUG_INTERVAL;
        }
        return INTERVAL * 60;
    }

    _getRefreshButton() {
        const refreshItem = new PopupMenu.PopupMenuItem(_('Refresh'));
        refreshItem.connect('activate', () => {
            this._refresh();
        });
        this._indicator._addMenuItem(refreshItem);
    }

    _refresh() {
        this._datasource.fetch(this._setIndicator());
    }
    
    _setIndicator() {
        return (result) => {
            this._indicator.refresh(result);
        };
    }

    disable() {
        GLib.Source.remove(this._loop);
        this._datasource.cancel();
        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new RazerBatteryStatusExtension(meta.uuid);
}
