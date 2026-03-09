/* Authored by iqbserve.de */

import { Logger } from 'core/logging.mjs';
import { BackendServerUrl } from 'core/tools.mjs';
import { WbProperties } from 'config/wbapp-properties.mjs';
import { WorkbenchInterface } from 'app/workbench.mjs';

/**
 * The module provides web service url name constants
 * like: [root]/[endpoint] e.g. "webapi/system/get-infos"
 * and two app specific methods foe calling services
 * - doGET, doPOST  
 */
const urlRoot = WbProperties.webServiceUrlRoot();

function get(endpoint) {
    return urlRoot + endpoint;
}

/**
 * Url name constants
 */
export const service_get_wbappconfiguration = get("/service/get-wbapp-configuration");

export const service_get_dbconnections = get("/service/get-db-connections");
export const service_save_dbconnections = get("/service/save-db-connections");
export const service_delete_dbconnections = get("/service/delete-db-connections");

export const service_upload_playground_content = get("/service/upload-playground-content");


/**
 * method to put authorization data to request header
 */
async function getAuthorizationHeader() {
    let header = {};
    try {
        let token = await WorkbenchInterface.getAuthorizationToken();
        if (token) {
            header = { Authorization: `Bearer ${token}` };
        }
    } catch (e) {
        //ok since authorization is optional
        Logger.warn(e);
    }
    return header;
}

/**
 */
export async function doGET(path, options = {}) {
    const url = BackendServerUrl(path);
    let resData = "";
    options = { parseJson: true, ...options };

    let authHeader = await getAuthorizationHeader();

    const response = await fetch(url, {
        method: "GET",
        accept: "application/json",
        headers: { "Content-Type": "application/json", ...authHeader },
        mode: "cors"
    });
    resData = await response.text();
    return options.parseJson ? JSON.parse(resData) : resData;
}

/**
 */
export async function doPOST(path, requestData = "{}", options = {}) {
    const url = BackendServerUrl(path);
    let resData = "";
    options = { parseJson: true, ...options };

    let authHeader = await getAuthorizationHeader();

    const response = await fetch(url, {
        method: "POST",
        accept: "application/json",
        headers: { "Content-Type": "application/json", ...authHeader },
        mode: "cors",
        body: requestData
    })

    resData = await response.text();
    return options.parseJson ? JSON.parse(resData) : resData;
}
