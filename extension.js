const {GLib} = imports.gi;
// TODO: Gnome 45 works differently
// https://gjs.guide/extensions/upgrading/gnome-shell-45.html#esm
const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;

const Me = ExtensionUtils.getCurrentExtension();
const Constants = Me.imports.constants
const {OpenRazerDeviceInfo} = Me.imports.razer
const {Indicator} = Me.imports.indicator

const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;


class RazerBatteryStatusExtension {
    constructor(uuid) {
        this._uuid = uuid;
        ExtensionUtils.initTranslations(Me.metadata['gettext-domain']);
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
        if (Constants.DEBUG) {
            return Constants.DEBUG_INTERVAL;
        }
        return Constants.INTERVAL * 60;
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
