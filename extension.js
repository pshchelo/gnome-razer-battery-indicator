const GETTEXT_DOMAIN = "razer-battery-indicator";
const { GObject, Gio, GLib, St, Clutter } = imports.gi;
// TODO: Gnome 45 works differently
const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const _ = ExtensionUtils.gettext;

const PYTHON_SCRIPT_PATH = "razer-battery.py"
//const INTERVAL = 300

class OpenRazerDeviceInfo {
    constructor() {
        this._cancellable = null;
    }

    fetch(script, onSuccess) {
        this.cancel();
        
        const pythonExec = ["python3"].find(cmd => GLib.find_program_in_path(cmd));

        if (!pythonExec) {
            log("ERROR: Python not found.");
            return;
        }
        const argv = [pythonExec, script];
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
        if (!devices.length) {
            const box = this._getNoDevicesBox();
            this._container.add_child(box);
        } else if (devices.hasOwnProperty("error")) {
            const box = this._getErrorBox();
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
        return devices[0];
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
        this._refresh();
        //this._loop = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, this._runLoop.bind(this));
        //this._timeOut = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 10, () => {
        //    this._connectSignals();
        //}
    }
    //_connectSignals() {
    //    this._controller.connectObject("device-changed", () => this._refresh(), this);
    //}

    //_disconnectSignals() {
    //    this._controller.disconnectObject(this);
    //}

    //_runLoop() {
    //    this._refresh();

    //    const interval = this._getInterval();
    //    this._loop = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, interval, this._runLoop.bind(this));
    //}
    
    //_getInterval() {
    //    return INTERVAL;
    //}

    _getRefreshButton() {
        const refreshItem = new PopupMenu.PopupMenuItem(_('Refresh'));
        refreshItem.connect('activate', () => {
            this._refresh();
        });
        this._indicator._addMenuItem(refreshItem);
    }

    _refresh() {
        const pyLocation = ExtensionUtils.getCurrentExtension().dir.get_child(PYTHON_SCRIPT_PATH).get_path();
        this._datasource.fetch(pyLocation, this._setIndicator());
    }
    
    _setIndicator() {
        return (result) => {
            this._indicator.refresh(result);
        };
    }

    disable() {
        GLib.Source.remove(this._loop);
        //GLib.Source.remove(this._timeOut);
        this._datasource.cancel();
        //this._disconnectSignals();
        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new RazerBatteryStatusExtension(meta.uuid);
}
