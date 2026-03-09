/* Authored by iqbserve.de */

/**
 */
export class NotificationHandler {

    constructor() {
        this.listeners = new Set();
    }

    subscribe(cb) {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    }

    unsubscribe(cb) {
        this.listeners.delete(cb);
    }

    publish(notification) {
        this.listeners.forEach(cb => cb(notification));
    }
}

/**
 */
export class Notification {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
}
