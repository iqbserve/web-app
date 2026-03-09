/* Authored by iqbserve.de */

import { WbProperties } from 'config/wbapp-properties.mjs';

export const ALL = 0;

/**
 * Trivial entry point for logging
 */
class LoggingProvider {
	level = ALL;
	constructor(properties){
		this.level = properties?.logLevel||ALL;
	}
	consoleLog(msg){
		console.log(msg);
	}
	info(msg){
		console.log(msg);
	}
	warn(msg){
		console.warn(msg);
	}
	debug(msg){
		console.debug(msg);
	}
	error(msg){
		console.error(msg);
	}
}

export const Logger = new LoggingProvider(WbProperties);
