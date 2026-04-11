/* Authored by iqbserve.de */

/**
 * Some simple data classes.
 */

/**
 * A common websocket message.
 */
export class WsoCommonMessage {

	//header data
	reference = "";
	command = "";
	functionModule = "";
	argsSrc = "";
	status = "";
	error = "";
	//payload
	bodydata = "";
	attachments = {};

	constructor(reference: string) {
		this.reference = reference;
	}

	hasReference(id: string) {
		return this.reference === id;
	}

	hasStatusSuccess() {
		return "success" === this.status.toLowerCase();
	}

	hasStatusError() {
		return "error" === this.status.toLowerCase();
	}

	setStatusError(errorInfo: string) {
		this.status = "error";
		this.error = errorInfo;
	}

	addAttachment(key: string, value: any) {
		this.attachments[key] = value;
	}
};

/**
 * A common command definition.
 */
export class CommandDef {
	title = "";
	command = "";
	script = "";
	options = { args: false }

	constructor(title: string, command: string, script: string, opt = {}) {
		this.title = title;
		this.command = command;
		this.script = script;
		this.options = { ...this.options, ...opt };
	}
};

/**
 * View definition struct.
 */
export class ViewSource {
	#file = "";
	#html = null;
	#htmlLoadListener = (viewSrc: ViewSource) => { };

	constructor(file: string) {
		this.#file = file;
	}

	setHtmlLoadListener(cb: (viewSrc: ViewSource) => void) {
		this.#htmlLoadListener = cb;
	}

	isEmpty() {
		return this.#html == null;
	}

	setHtml(html: string) {
		this.#html = html;
		this.#htmlLoadListener(this);
	}

	getHtml() {
		return this.#html;
	}

	getFile() {
		return this.#file;
	}

};