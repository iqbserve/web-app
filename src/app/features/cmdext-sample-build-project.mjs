/* Authored by iqbserve.de */

import { WorkbenchInterface as WbApp } from 'app/workbench.mjs';

/**
 * A Use case specific extension of the general command view.
 */
export function extendView(view) {
    let originRunMethod = view.runCommand.bind(view);
    //create a new run method - with a confirmation dialog
    view.runCommand = () => {
        WbApp.confirm({
            message: `<b>Start a full project build</b><br>Do you want to start the build process now?`
        }, (val) => {
            if (val) { originRunMethod() }
        });
    };
}