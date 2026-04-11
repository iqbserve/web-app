/* Authored by iqbserve.de */

import { WbProperties } from 'config/wbapp-properties.mjs';

export const ALL: number = 0;

/**
 * Trivial entry point for logging
 */
class LoggingProvider {
	level = ALL;
	constructor(properties: { [key: string]: string | number | boolean }) {
		this.level = (properties?.logLevel || ALL) as number;
	}
	consoleLog(msg: any) {
		console.log(msg);
	}
	info(msg: any) {
		console.log(msg);
	}
	warn(msg: any) {
		console.warn(msg);
	}
	debug(msg: any) {
		console.debug(msg);
	}
	error(msg: any) {
		console.error(msg);
	}
}

export const Logger = new LoggingProvider(WbProperties.getLoggingProperties());
