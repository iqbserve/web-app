/* Authored by iqbserve.de */

import { Logger } from 'core/logging.mjs';
import { WorkView } from 'core/view-classes.mjs';
import { CommandDef } from 'core/data-classes.mjs';
import { LazyFunction, typeUtil } from 'core/tools.mjs';

/**
 * The module provides the user functionalities of the app
 */
let WbFeatures = {
    systemLogin: new LazyFunction("app/workbench.mjs", "processSystemLogin").asFunction(),

    systemInfos: new LazyFunction("features/system-infos.mjs", "getView"),

    cmdSampleShellCall: new LazyFunction("features/command.mjs", "getView",
        ["cmdSampleShellCallView", new CommandDef("Sample: [ js shell command ]", "runjs", "/sample/shell-call.mjs", { args: true })]
    ),
    cmdSampleBuildProject: new LazyFunction("features/command.mjs", "getView",
        ["cmdSampleBuildProjectView", new CommandDef("Sample: [ js build script ]", "runjs", "/sample/build-project.mjs"),
            new LazyFunction("features/cmdext-sample-build-project.mjs", "extendView").asFunction()
        ]
    ),
    cmdSampleExtension: new LazyFunction("features/command.mjs", "getView",
        ["cmdSampleExtensionView", new CommandDef("Sample: [ java extension command ]", "runext", "sample.Command", { args: true })]
    ),

    toolsDBConnections: new LazyFunction('features/db-connections.mjs', "getView"),
    toolsJSPlayground: new LazyFunction('features/playground.mjs', "getView")
}

/**
 */
export function callFeature(name, viewManager) {
    if (WbFeatures[name]) {
        let feature = WbFeatures[name];
        if (feature instanceof LazyFunction) {
            feature.invoke((result) => {
                if (result instanceof WorkView) {
                    viewManager.openView(result);
                } else if (typeUtil.isFunction(result)) {
                    result();
                }
            });
        } else if (typeUtil.isFunction(feature)) {
            feature();
        }
    } else {
        Logger.warn(`Call to unknown feature [${name}]`)
    }
}

/**
 */
export function addFeature(name, feature) {
    if (WbFeatures[name]) {
        throw new Error(`Feature [${name}] already exists`);
    } else {
        WbFeatures[name] = feature;
    }
}
