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
	#moduleName = "";
	#functionName = "";
	#functionArgs = null;
	#returnOnly = false;

	constructor(module: string, fncName: string, fncArgs: any = null) {
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

	invoke(cb: (retVal: any) => void) {
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
export function importJson(url: string, cb: (data: any) => void) {
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
export function isUrlAvailable(url: string, cb: (available: boolean) => void, timeout = 2000) {
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
export function BackendServerUrl(...path: string[]) {
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
export function OriginServerUrl(...path: string[]) {
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
export function decodeRequestParameter(href: string) {
	const paramMap = new Map(new URL(href).searchParams.entries());
	return paramMap;
}

export function styleFloat(elem: Element, prop: string) {
	return Number.parseFloat(window.getComputedStyle(elem)[prop]) || 0;
}

/**
 */
export function findChildOf(root: Element, childId: string) {
	const selector = `#${CSS.escape(childId)}`;
	return root.querySelector(selector);
}

/**
 */
export function setVisibility(elem: HTMLElement, flag: boolean) {
	elem.style["visibility"] = flag ? "visible" : "hidden";
	return elem;
}

/**
 */
export function setDisplay(elem: HTMLElement, flag: boolean | string) {
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
export function mergeArrayInto(target: any[], source: any[], allowDuplicates = false) {
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

export function clearArray(array: any[]) {
	if (array) { array.length = 0; }
}

/**
 */
export const fileUtil = {

	/**
	 */
	saveToFileFapi: (fileName: string, text: string) => {
		(window as any).showSaveFilePicker({
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
	saveToFileClassic: (fileName: string, text: string) => {
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
	createFileInputElement: (fileTypes: string, cb: (evt: Event) => void) => {
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

	#fileTypes: string;
	#dataCb: (dataFile: any) => void;
	#fsapi = false;

	#fileInput: HTMLInputElement;

	constructor(fileTypes: string, dataCb: (dataFile: any) => void, fsapi = false) {
		this.#fileTypes = fileTypes;
		this.#dataCb = dataCb;
		this.#fsapi = fsapi;
		if (!this.#fsapi) {
			this.#fileInput = document.createElement("input");
			this.#fileInput.type = "file";
			this.#fileInput.style.display = "none";
			this.#fileInput.accept = this.#fileTypes;
			this.#fileInput.addEventListener("change", (evt) => {
				let input = evt.target as HTMLInputElement;
				let file = input.files.length > 0 ? input.files[0] : null;
				this.#getFileDataFrom(file);
			});
		}
	}

	#getFileDataFrom(file: File) {
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

	isString: (val: any) => {
		return (typeof val === 'string');
	},

	isObject: (val: any) => {
		return (val !== null && typeof val === 'object');
	},

	isDomElement: (val: any) => {
		return (val !== null && (val instanceof Element || val.nodeType !== undefined));
	},

	isArray: (val: any) => {
		return Array.isArray(val);
	},

	isFunction: (val: any) => {
		return (val !== null && (typeof val === 'function'));
	},

	isNumber: (val: any) => {
		return (val !== null && typeof val === 'number');
	},

	isBoolean: (val: any) => {
		return (val === true || val === false);
	},

	isBooleanString: (val: any) => {
		return (val === "true" || val === "false");
	},

	booleanFromString: (val: any) => {
		if (typeUtil.isBooleanString(val)) {
			return (val === "true");
		}
		return null;
	},

	stringFromBoolean: (val: any) => {
		if (typeUtil.isBoolean(val)) {
			return val ? "true" : "false";
		}
		return null;
	}

}

/**
 */
export function asDurationString(ms: number) {
	const hours = String(Math.floor(ms / 3600000)).padStart(2, '0');
	const minutes = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
	const seconds = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
	const milliseconds = String(ms % 1000).padStart(3, '0');

	return `${hours}:${minutes}:${seconds}:${milliseconds}`;
}


