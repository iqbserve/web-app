/* Authored by iqbserve.de */

/**
 */
export class NotificationHandler {

    #listeners = new Set<(msg: Notification) => void>();

    constructor() {
    }

    subscribe(cb: (msg: Notification) => void) {
        this.#listeners.add(cb);
        return () => this.#listeners.delete(cb);
    }

    unsubscribe(cb: (msg: Notification) => void) {
        this.#listeners.delete(cb);
    }

    publish(msg: Notification) {
        this.#listeners.forEach(cb => cb(msg));
    }
}

/**
 */
export class Notification {
    type: string;
    value: any;

    constructor(type: string, value: any) {
        this.type = type;
        this.value = value;
    }
}
