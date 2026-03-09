/* Authored by iqbserve.de */

import { WorkView, StandardDialog } from 'core/view-classes.mjs';

/**
 * <pre>
 * A simple manager for showing views in the app working area.
 * </pre>
 */
export class WorkbenchViewManager {

	#workarea;
	#registeredViews;

	#standardDlg;

	constructor(workareaElem) {
		this.#workarea = workareaElem;
		this.#registeredViews = {};

		this.#standardDlg = new StandardDialog(document.getElementsByTagName("main")[0]);
	}

	openView(view) {
		if (view instanceof WorkView) {
			this.#resolveViewRegistration(view, (viewEntry) => {
				this.#openViewImpl(viewEntry);
			});
		} else {
			throw new TypeError("WorkView type expected");
		}
	}

	closeView(view) {
		let viewEntry = view;
		if (viewEntry instanceof WorkView) {
			viewEntry = this.#registeredViews[view.id];
		}
		// view is expected to do an internal closing itself 
		// and return true if it was closeabel and did close
		if (viewEntry.view.close()) {
			// then the viewmanager does the visual close
			this.#setViewCartVisible(viewEntry.cart, false);
		}
	}

	#resolveViewRegistration(view, cb) {
		let viewEntry = this.#registeredViews[view.id];
		if (viewEntry) {
			cb(viewEntry);
		} else {
			viewEntry = { view: view, cart: null };
			this.#registeredViews[view.id] = viewEntry;
			if (Object.hasOwn(view, "viewManager") && !view.viewManager) {
				view.viewManager = this;
			}

			view.getViewElement((element) => {
				let viewCart = this.#createViewCartridge(view.id, element);
				this.#workarea.prepend(viewCart);
				cb(viewEntry);
			});
		}
	}

	#openViewImpl(viewEntry) {
		this.#closeAllCloseableViews();
		viewEntry.view.open();
		this.moveView(viewEntry.view, 1);
		this.#setViewCartVisible(viewEntry.cart, true);
		this.#scrollToTop();
	}

	//the container dom element used by the view manager
	#createViewCartridge(viewId, viewElement) {
		let viewCart = document.createElement("div");
		viewCart.id = "view.cartridge." + viewId;
		viewCart.style = "visibility: visible; display: block;"
		viewCart.appendChild(viewElement);

		this.#registeredViews[viewId].cart = viewCart;
		return viewCart;
	}

	#setViewCartVisible(viewCart, flag) {
		if (flag) {
			viewCart.style["display"] = "block";
			viewCart.style["visibility"] = "visible";
		} else if (this.#workarea.children.length > 0) {
			viewCart.style["display"] = "none";
		}
	}

	#closeAllCloseableViews() {
		for (let key in this.#registeredViews) {
			let viewEntry = this.#registeredViews[key];
			if (viewEntry.cart) {
				this.closeView(viewEntry);
			}
		}
	}

	#getVisibleChildren() {
		let children = [];
		for (let child of this.#workarea.children) {
			if (child.style.display == "block") {
				children.push(child);
			}
		}
		return children;
	}

	#scrollToTop() {
		this.#workarea.scrollTop = 0;
	}

	stepViewsDown() {
		let children = this.#getVisibleChildren();
		if (children.length > 1) {
			this.#workarea.insertBefore(children.at(-1), children[0]);
			this.#scrollToTop();
		}
	}

	stepViewsUp() {
		let children = this.#getVisibleChildren();
		if (children.length > 1) {
			this.#workarea.insertBefore(children[0], null);
			this.#scrollToTop();
		}
	}

	moveView(view, position) {
		let elemCount = this.#workarea.children.length;
		let viewCart = this.#registeredViews[view.id].cart;
		let pos = -1;

		if (Number.isNaN(Number.parseInt(position))) {
			let idx = 0;
			if (position === "up") {
				idx = Array.prototype.indexOf.call(this.#workarea.children, viewCart) - 1;
			} else if (position === "down") {
				idx = Array.prototype.indexOf.call(this.#workarea.children, viewCart) + 1;
			} else {
				return;
			}
			//always add 1
			//cause position is expected to be a human counter 1...n 
			//NOT array idx 0...n
			position = (idx + 1).toString();
		}

		pos = Number.parseInt(position);
		pos = pos <= 0 ? 1 : pos;

		if (elemCount > 1) {
			if (pos >= elemCount) {
				viewCart.remove();
				this.#workarea.appendChild(viewCart);
			} else if (pos - 1 >= 0) {
				viewCart.remove();
				this.#workarea.insertBefore(viewCart, this.#workarea.children[pos - 1]);
			}
		}
	}

	promptUserInput(text, value, cb) {
		this.#standardDlg.openInput(text, value, cb);
	}

	promptConfirmation(text, cb) {
		this.#standardDlg.openConfirmation(text, cb);
	}
}

