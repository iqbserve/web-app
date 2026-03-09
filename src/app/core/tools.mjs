/* Authored by iqbserve.de */

import { Logger } from 'core/logging.mjs';
import { WbProperties } from 'config/wbapp-properties.mjs';

/**
 * Some helper functions and constants
 */

export const NL = "\n";

/**
 * Object to define functions
 * that get lazily resolved at the first call
 */
export class LazyFunction {
	#moduleName;
	#functionName;
	#functionArgs;
	#returnOnly = false;

	constructor(module, fncName, fncArgs = null) {
		this.#moduleName = module;
		this.#functionName = fncName;
		this.#functionArgs = fncArgs;
	}

	asFunction() {
		//do not call the function
		//just return it
		this.#returnOnly = true;
		return this;
	}

	invoke(cb) {
		import(this.#moduleName)
			.then((module) => {
				let retVal;
				if (this.#returnOnly) {
					retVal = module[this.#functionName]
				} else if (this.#functionArgs) {
					retVal = module[this.#functionName](this.#functionArgs);
				} else {
					retVal = module[this.#functionName]();
				}
				cb(retVal);
			});
	}
}

/**
 */
export function importJson(url, cb) {
	import(url, {
		with: { type: 'json' }
	}).then((module) => {
		cb(module.default);
	}).catch((e) => {
		Logger.error(e);
	});
}

/**
 */
export function isUrlAvailable(url, cb, timeout = 2000) {
	let controller = new AbortController();
	let id = setTimeout(() => controller.abort(), timeout);
	Logger.debug(`Looking for ... ${url}, ${id}`);

	fetch(url, {
		method: 'HEAD',
		mode: 'no-cors',
		signal: controller.signal
	}).then(() => {
		clearTimeout(id);
		Logger.debug(`isUrlAvailable: TRUE: ${id}`);
		cb(true);
	}).catch((e) => {
		clearTimeout(id);
		Logger.debug(`isUrlAvailable FALSE: ${id}`);
		cb(false);
	});
}

/**
 */
export function BackendServerUrl(...path) {
	let url = WbProperties.webBackendServerUrl(window.location.origin);

	let urlPath = path.join("/");
	if (urlPath.startsWith("/")) {
		url = url + urlPath;
	} else {
		url = url + "/" + urlPath;
	}
	return url;
}

/**
 */
export function OriginServerUrl(...path) {
	let url = window.location.origin;

	let urlPath = path.join("/");
	if (urlPath.startsWith("/")) {
		url = url + urlPath;
	} else {
		url = url + "/" + urlPath;
	}
	return url;
}

/**
 */
export function decodeRequestParameter(href) {
	const paramMap = new Map(new URL(href).searchParams.entries());
	return paramMap;
}

export function styleFloat(elem, prop) {
	return Number.parseFloat(window.getComputedStyle(elem)[prop]) || 0;
}

/**
 */
export function findChildOf(root, childId) {
	const selector = `#${CSS.escape(childId)}`;
	return root.querySelector(selector);
}

/**
 */
export function setVisibility(elem, flag) {
	elem.style["visibility"] = flag ? "visible" : "hidden";
	return elem;
}

/**
 */
export function setDisplay(elem, flag) {
	if (typeof flag == "boolean") {
		elem.style["display"] = flag ? "block" : "none";
	} else if (typeof flag == "string") {
		elem.style["display"] = flag;
	}
	return elem;
}

/**
 */
export function newSimpleId(prfx = "") {
	return prfx + Math.random().toString(16).slice(2);
}

/**
 */
export function mergeArrayInto(target, source, allowDuplicates = false) {
	target = target || [];
	source = source || [];
	//copy target
	target = [...target];
	source.forEach(value => {
		if (!target.includes(value) || allowDuplicates) {
			target.push(value);
		}
	});
	return target;
}

export function clearArray(array) {
	if (array) { array.length = 0; }
}

/**
 */
export const fileUtil = {

	/**
	 */
	saveToFileFapi: (fileName, text) => {
		window.showSaveFilePicker({
			suggestedName: fileName,
			types: [{
				description: "Text file",
				accept: { "text/plain": [".txt"] },
			}],
		}).then(async handler => {
			let file = await handler.createWritable();
			await file.write(text);
			await file.close();
		}).catch(err => Logger.error(err));
	},

	/**
	 */
	saveToFileClassic: (fileName, text) => {
		let blob = new Blob([text], { type: "text/plain" });
		let url = URL.createObjectURL(blob);

		let a = document.createElement("a");
		a.href = url;
		a.download = fileName;
		a.style.display = "none";
		a.click();
		URL.revokeObjectURL(url);
	},

	/**
	 */
	createFileInputElement: (fileTypes, cb) => {
		let fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.style.display = "none";
		fileInput.accept = fileTypes;
		fileInput.addEventListener("change", cb);
		return fileInput;
	},

	/**
	 * Check if the Modern File API is available
	 */
	isFSApiSupported() {
		return 'showOpenFilePicker' in window;
	}

}

/**
 */
export class FileDataReader {

	#fileTypes;
	#dataCb;
	#fsapi = false;

	#fileInput;

	constructor(fileTypes, dataCb, fsapi = false) {
		this.#fileTypes = fileTypes;
		this.#dataCb = dataCb;
		this.#fsapi = fsapi;
		if (!this.#fsapi) {
			this.#fileInput = document.createElement("input");
			this.#fileInput.type = "file";
			this.#fileInput.style.display = "none";
			this.#fileInput.accept = this.#fileTypes;
			this.#fileInput.addEventListener("change", (evt) => {
				let file = evt.target.files.length > 0 ? evt.target.files[0] : null;
				this.#getFileDataFrom(file);
			});
		}
	}

	#getFileDataFrom(file) {
		let dataFile = null;
		if (file) {
			dataFile = { name: file.name, date: new Date(file.lastModified).toLocaleTimeString(), data: null };
			file.text().then((textData) => {
				dataFile.data = textData;
				this.#fileInput.value = "";
				this.#dataCb(dataFile);
			});
		}
	}

	chooseFile() {
		if (this.#fsapi) {
			//for future use of fsapi
		} else {
			this.#fileInput.click();
		}
	}
}

/**
 */
export const typeUtil = {

	isString: (val) => {
		return (typeof val === 'string');
	},

	isObject: (val) => {
		return (val !== null && typeof val === 'object');
	},

	isDomElement: (val) => {
		return (val !== null && (val instanceof Element || val.nodeType !== undefined));
	},

	isArray: (val) => {
		return Array.isArray(val);
	},

	isFunction: (val) => {
		return (val !== null && (typeof val === 'function'));
	},

	isNumber: (val) => {
		return (val !== null && typeof val === 'number');
	},

	isBoolean: (val) => {
		return (val === true || val === false);
	},

	isBooleanString: (val) => {
		return (val === "true" || val === "false");
	},

	booleanFromString: (val) => {
		if (typeUtil.isBooleanString(val)) {
			return (val === "true");
		}
		return null;
	},

	stringFromBoolean: (val) => {
		if (typeUtil.isBoolean(val)) {
			return val ? "true" : "false";
		}
		return null;
	}

}

/**
 */
export function asDurationString(ms) {
	const hours = String(Math.floor(ms / 3600000)).padStart(2, '0');
	const minutes = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
	const seconds = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
	const milliseconds = String(ms % 1000).padStart(3, '0');

	return `${hours}:${minutes}:${seconds}:${milliseconds}`;
}


