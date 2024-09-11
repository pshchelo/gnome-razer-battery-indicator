import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import * as Constants from './constants.js';


export const OpenRazerDeviceInfo = class OpenRazerDeviceController {
    constructor(ext_dir) {
        this._cancellable = null;
        this._ext_dir = ext_dir;
    }

    fetch(onSuccess) {
        this.cancel();
        
        const argv = [
            ["python3"].find(cmd => GLib.find_program_in_path(cmd)),
            this._ext_dir.get_child(Constants.PYTHON_SCRIPT_PATH).get_path(),
        ];

        if (!argv[0]) {
            log("ERROR: Python not found.");
            return;
        }
        if (Constants.DEBUG) {
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
