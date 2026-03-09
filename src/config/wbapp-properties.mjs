/* Authored by iqbserve.de */

/**
 * A simple properties class for global app values.
 * see also JPSWebAppConfigSupplier.java for backend support
 */
class Properties {

    #entries = {
        showIntro: true,
        autoStartFeature: "",
        logLevel: 0, //all

        webServiceUrlRoot: "/webapi",
        webSocketUrlRoot: "/wsoapi",
        webBackendServerUrl: null,

        vcUrls: {
            loader: "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/loader.js",
            config: "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs"
        },

        systemInfo: {
        },

        webAuthenticationEnabled: false,
        authenticationConfig: {
            module: '/assets/js/keycloak.js',
            serverUrl: 'http://localhost:9595',
            realm: 'jamn',
            clientId: 'jps-client',
            onLoad: 'check-sso', //'check-sso' 'login-required'
            checkLoginIframe: false, // Optional: Turn off iframe check if 3rd party cookie issues
            tokenRefreshInterval: 4 * 60 * 1000 // every 4 minutes
        }
    };

    get(key, defaultVal = null) {
        let value = this.#entries[key];
        if (value === true || value === false) { return value; }
        return this.#entries[key] || defaultVal;
    }

    apply(values) {
        this.#entries = { ...this.#entries, ...values };
    }

    applyGroup(name, values) {
        if (!this.#entries[name]) { this.#entries[name] = {} }
        this.#entries[name] = { ...this.#entries[name], ...values };
    }

    showIntro() {
        return this.get("showIntro", true);
    }
    autoStartFeature() {
        return this.get("autoStartFeature", "");
    }
    webServiceUrlRoot() {
        return this.get("webServiceUrlRoot", "/webapi");
    }
    webSocketUrlRoot() {
        return this.get("webSocketUrlRoot", "/wsoapi");
    }
    webBackendServerUrl(defaultVal = null) {
        return this.get("webBackendServerUrl", defaultVal);
    }

    isWebAuthenticationEnabled() {
        return this.get("webAuthenticationEnabled", false);
    }
}

export const WbProperties = new Properties();
