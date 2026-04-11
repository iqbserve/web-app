/* Authored by iqbserve.de */

import { Logger } from 'core/logging.mjs';
import { WsoCommonMessage } from 'core/data-classes.mjs';
import { WorkbenchInterface as WbApp } from 'app/workbench.mjs';

/**
 * A simple WebSocket implementation for the workbench app.
 * 
 * The Data-IO uses WsoCommonMessage objects
 * that are serialized/deserialized to+from JSON.
 */
export class WebSocketConnection {

    #hostUrl: string;
    #socket: WebSocket;
    #listener: any;

    constructor(hostUrl: string, options = {}) {
        this.#hostUrl = hostUrl;
        this.#listener = { "any": [] };
    }

    isConnected() {
        return !(this.#socket == null || this.#socket.readyState == WebSocket.CLOSED);
    }

    connect() {
        if (this.isConnected()) {
            Logger.warn("Warning: WebSocket already connected");
        } else {
            this.#socket = new WebSocket(this.#hostUrl);

            // Event listener 
            this.#socket.onopen = (event: Event) => {
                Logger.info("WebSocket connection [opened]");
            };

            this.#socket.onmessage = (event: MessageEvent) => {
                this.#onMessage(event);
            };

            this.#socket.onclose = (event: CloseEvent) => {
                this.#socket = null;
                Logger.info("WebSocket connection [closed]");
            };

            this.#socket.onerror = (event: Event) => {
                this.#socket = null;
                Logger.error("WebSocket connection error");
                this.#onMessage(event);
            };
        }
        return this;
    }

    close() {
        if (this.isConnected()) {
            this.#socket.close();
            this.#socket = null;
        }
    }

    /**
     * Expects WsoCommonMessage objects
     */
    sendMessage(wsoMsg: WsoCommonMessage, sentCb: Function = null) {
        if (wsoMsg instanceof WsoCommonMessage) {
            if (this.isConnected()) {
                let msg = this.#createWsoMessageString(wsoMsg);
                this.#socket.send(msg);
                if (sentCb) { sentCb(); }
                return true;
            } else {
                Logger.warn("WebSocket NOT connected");
                WbApp.confirm({ message: "The Server Connection was closed.<br>Would you like to try a reconnect?" },
                    (value) => value ? this.connect() : null);
            }
        } else {
            throw new TypeError("WsoCommonMessage type expected");
        }
        return false;
    }

    addMessageListener(cb: (wsoMsg: WsoCommonMessage) => void, subject: string = "any") {
        if (Object.hasOwn(this.#listener, subject)) {
            if (!this.#listener[subject].includes(cb)) {
                this.#listener[subject].push(cb);
            }
        } else {
            this.#listener[subject] = [cb];
        }
    }

    /**
     * Expects WsoCommonMessage as JSON
     */
    #onMessage(event: MessageEvent | Event) {
        let subject = "any";
        let msg = "";
        let wsoMsg = new WsoCommonMessage("");

        if (event.type === "error") {
            wsoMsg.setStatusError("connection error");
        } else {
            msg = JSON.parse((event as MessageEvent).data);
            wsoMsg = Object.assign(wsoMsg, msg);
        }

        this.#listener[subject].forEach((cb: (wsoMsg: WsoCommonMessage) => void) => cb(wsoMsg));
    }

    #createWsoMessageString(wsoMsg: WsoCommonMessage) {
        let msg = wsoMsg.reference.length > 0 ? "<" + wsoMsg.reference + ">" : "";
        msg = msg + JSON.stringify(wsoMsg);
        return msg;
    }
}




