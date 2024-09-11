import GLib from 'gi://GLib';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import * as Constants from './constants.js';
import {OpenRazerDeviceInfo} from './razer.js';
import {Indicator} from './indicator.js';


export default class RazerBatteryStatusExtension extends Extension {
    enable() {
        this._indicator = new Indicator(this.dir);
        this._indicator.refreshItem.connect('activate', () => {
            this._refresh();
        });
        this._datasource = new OpenRazerDeviceInfo(this.dir);
        Main.panel.addToStatusArea(this._uuid, this._indicator);
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
