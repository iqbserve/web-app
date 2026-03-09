/* Authored by iqbserve.de */

import { Logger } from 'core/logging.mjs';
import { isUrlAvailable, BackendServerUrl, setDisplay, setVisibility, decodeRequestParameter } from 'core/tools.mjs';
import { SplitBarHandler } from 'core/view-classes.mjs';
import { DefaultCompProps, onClicked } from 'core/uibuilder.mjs';
import { WorkbenchViewManager } from 'core/view-manager.mjs';
import { WebSocketConnection } from 'core/websocket.mjs';
import { NotificationHandler, Notification } from 'core/notification.mjs';
import { WbProperties } from 'config/wbapp-properties.mjs';
import * as Webapi from 'core/webapi.mjs';
import * as Icons from 'core/icons.mjs';
import { registerUIWebComponents } from 'core/uicomponents.mjs';

registerUIWebComponents();

/**
 * The workbench module implements the entry point of the SPA Application.
 */

let appConfig = null;
let systemInfo = {};

let rootElement = null;

let titlebar = null;
let sidebar = null;
let statusline = null;

let viewManager = null;
let webSocket = null;
let authProvider = null;

let notificationHandler = new NotificationHandler();

/**
 * Application installation function
 */
export function installApp(rootId) {
	rootId = rootId || (WbStartUtility ? WbStartUtility.appRootId : "unknown");
	rootElement = document.getElementById(rootId);
	return {
		build: function () {
			document.addEventListener("DOMContentLoaded", startApp);
		}
	};
};

/**
 * The workbench public function interface
 */
export const WorkbenchInterface = {

	confirm: (text, cb) => {
		viewManager.promptConfirmation(text, cb);
	},

	sendWsoMessage: (wsoMsg, sentCb = null) => {
		return webSocket.sendMessage(wsoMsg, sentCb);
	},

	addWsoMessageListener: (cb) => {
		webSocket.addMessageListener(cb);
	},

	statusLineInfo: (info) => {
		statusline.setInfoText(info);
	},

	titleInfo: (info) => {
		titlebar.setTitleText(info);
	},

	subscribeForNotification: (cb) => {
		return notificationHandler.subscribe(cb);
	},

	unsubscribeNotification: (cb) => {
		notificationHandler.unsubscribe(cb);
	},

	publish: (notification) => {
		notificationHandler.publish(notification);
	},

	getAuthorizationToken: async () => {
		if (authProvider) {
			return await authProvider.getToken();
		}
		return null;
	}
};

/**
 */
export function processSystemLogin() {
	if (authProvider) {
		if (authProvider.isLoggedIn()) {
			WorkbenchInterface.confirm({
				message: "<b>Log Off</b><br>Do you want to Log Off from the Server System?"
			}, (value) => value ? authProvider.doLogOff() : null);
		} else {
			authProvider.doLogIn();
		}
	}
}

/**
 * this is called after document load but before getting visible
 */
function startApp() {

	let params = decodeRequestParameter(window.location.href);
	let configName = params.has("config") ? params.get("config") : "demo";

	initAuthentication((authenticated) => {
		Webapi.doGET(`${Webapi.service_get_wbappconfiguration}?name=${configName}`).then((config) => {
			applyConfig(config, authenticated);

			viewManager = new WorkbenchViewManager(document.getElementById("app-workarea"));

			initWebSocket();
			createUI();

			authProvider.notify();

			setVisibility(rootElement, true);
			sidebar.getItem(WbProperties.autoStartFeature())?.click();

			document.documentElement.style.cursor = "default";

			WbStartUtility?.close();
			Logger.info(`Workbench App started [${configName}]`);
		})
	});
}

/**
 */
function initAuthentication(processAppStart) {
	authProvider = new AuthenticationProvider(WbProperties.get("authenticationConfig"));
	WorkbenchInterface.subscribeForNotification((msg) => {
		if (msg.type === "authentication") {
			applyLoginState();
		}
	});

	if (WbProperties.isWebAuthenticationEnabled()) {
		import(authProvider.config.module)
			.then((module) => {
				authProvider.setupProviderModule(module);
				authProvider.connect(processAppStart);
			});
	} else {
		processAppStart(false);
	}
}

/**
 */
function applyConfig(config, authenticated = false) {
	appConfig = config;

	if (authenticated) {
		appConfig.properties.showIntro = false;
	}

	if (appConfig.properties) {
		WbProperties.apply(appConfig.properties);
	}
	if (appConfig.systemInfo) {
		WbProperties.applyGroup("systemInfo", appConfig.systemInfo);
		systemInfo = appConfig.systemInfo;
	}
}

/**
 */
function applyLoginState() {
	let workIcon = sidebar.getWorkPanelIcon("systemLogin");
	let sbarItem = sidebar.getItem("systemLogin");

	if (authProvider?.isAvailable()) {
		let authenticated = authProvider.isAuthenticated;
		let icon = workIcon;

		authProvider.getUserProfile((profile) => {
			let userName = profile?.username || 'unknown';
			if (authenticated) {
				workIcon.switch({ flag: authenticated });

				icon.style.color = "green";
				icon.title = `Log Off [ ${userName} ]`;
				if (sbarItem) {
					sbarItem.innerHTML = `Log Off`;
					sbarItem.title = `Log Off [ ${userName} ]`;
				}
			} else {
				workIcon.switch({ flag: authenticated });

				icon.style.color = "";
				icon.title = "Login";
				if (sbarItem) {
					sbarItem.innerHTML = "Login";
				}
			}
		});
	} else {
		let hint = WbProperties.get("noLoginHint", "Login NOT available");
		workIcon.classList.add("item-disabled");
		workIcon.title = hint;
		sbarItem.classList.add("item-disabled");
		sbarItem.title = hint;
	}
}

/**
 */
function initWebSocket() {
	webSocket = new WebSocketConnection(BackendServerUrl(WbProperties.webSocketUrlRoot()), {})
		.connect();
}

/**
 */
function createUI() {

	let wbDefaults = new DefaultCompProps();
	wbDefaults.get("actionIcon").clazzes = ["wkv-action-icon"];

	titlebar = document.getElementById("app-titlebar")
		.build({ viewManager: viewManager, defaultProps: wbDefaults });

	statusline = document.getElementById("app-statusline")
		.build({ systemInfo: systemInfo, defaultProps: wbDefaults });

	createSidebar();
	createIntroBox();

	WorkbenchInterface.titleInfo(`Tiny Demo - V.${systemInfo.version}`);
}

/**
 */
function createSidebar() {

	sidebar = document.getElementById("app-sidebar")
		.build({ viewManager: viewManager, appConfig: appConfig });

	new SplitBarHandler(document.getElementById("app-sidebar-splitter"))
		.setCompBefore(sidebar)
		.setCompAfter(document.getElementById("app-workarea"))
		.setBarrierActionBefore((splitter, val) => {
			//sidebar width < x - collaps it
			if (val < 100) {
				splitter.stop();
				sidebar.toggleCollapse();
				return true; //barrier hit
			}
			return false; //barrier NOT hit
		})
		.build();
}

/**
 */
function createIntroBox() {

	let intro = document.getElementById("app-intro-overlay");

	if (!WbProperties.showIntro()) {
		setDisplay(intro, false);
		return;
	};

	onClicked(intro, (evt) => {
		setDisplay(evt.currentTarget, false);
	});

	document.getElementById("app-intro-content").innerHTML = `
		<span style="padding: 20px;">
			<h1 style="color: var(--isa-title-grayblue)">Welcome to<br>Jamn Workbench</h1>
			<span style="font-size: 18px;">
				<p>an example of using the Jamn Java-SE Microservice<br>together with plain Html5 and JavaScript<br></p>
				<p style="margin-bottom: 5px;">to build lightweight 
					<a class="${Icons.github("class")}" style="color: var(--isa-title-blue);" title="Jamn All-In-One MicroService"
					target="GitHub_Repos" href="${systemInfo["readme.url"]}"><span style="margin-left: 5px;">All-in-One</span></a>
					<span>RIA/SPA Apps</span>
				</p>
				<a style="font-size: 10px; color: var(--isa-title-blue);" 
			    	href="${systemInfo["author.url"]}" title="${systemInfo.author}" target="iqbserve.de">${systemInfo.author}
				</a>
			</span>
		</span>

		<span>
			<img src="assets/intro.png" alt="Intro" style="width: 100%; height: 100%;">
		</span>
	`;
}

/**
 */
class AuthenticationProvider {
	module;
	instance = null;
	isAuthenticated = false;
	userProfile = null;
	timerId = "";

	config;

	constructor(config = {}) {
		this.config = { ...{ notifyingEnabled: true }, ...config };
	}

	setupProviderModule(module) {
		this.module = module;
	}

	setNotifyingEnabled(flag) {
		this.config.notifyingEnabled = flag;
	}

	notify() {
		if (this.config.notifyingEnabled) {
			let msg = new Notification("authentication", { authenticated: this.isAuthenticated });
			WorkbenchInterface.publish(msg);
		}
	}

	connect(cb) {
		if (this.instance == null) {
			isUrlAvailable(this.config.serverUrl, (available) => {
				if (available) {
					let provider = this.module.default;
					this.instance = new provider({
						url: this.config.serverUrl,
						realm: this.config.realm,
						clientId: this.config.clientId
					});

					this.instance.init({
						onLoad: this.config.onLoad,
						checkLoginIframe: this.config.checkLoginIframe
					}).then((authenticated) => {
						this.isAuthenticated = authenticated;
						if (this.config.tokenRefreshInterval) {
							this.createTokenRefreshTimer();
						}
						Logger.info(`AuthenticationProvider connected [${this.timerId}]`);
						cb(authenticated);
					});
				} else {
					this.isAuthenticated = false;
					Logger.warn(`Authentication Server NOT available [${this.config.serverUrl}]`);
					cb(false);
				}
			});
		}
	}

	createTokenRefreshTimer() {
		if (this.config.tokenRefreshInterval) {
			this.timerId = setInterval(() => {
				if (this.isLoggedIn()) {
					try {
						this.instance.updateToken(30);
					} catch (e) {
						Logger.error(e);
						this.deleteTokenRefreshTimer();
					}
				}
			}, this.config.tokenRefreshInterval);
		}
	}

	deleteTokenRefreshTimer() {
		clearInterval(this.timerId);
		this.timerId = "";
	}

	getUserProfile(cb) {
		if (this.isLoggedIn()) {
			if (this.userProfile) {
				cb(this.userProfile);
			} else {
				this.instance.loadUserProfile().then((profile) => {
					this.userProfile = profile;
					cb(this.userProfile);
				}).catch(() => {
					Logger.error("Failed to load user profile");
				});
			}
		} else {
			cb(null);
		}
	}

	async getToken() {
		let token = "";
		if (this.isLoggedIn()) {
			await this.instance.updateToken(30);
			token = this.instance.token;
		}
		return token;
	}

	async doLogIn() {
		if (this.instance && !this.isLoggedIn()) {
			this.isAuthenticated = this.instance.login();
		}
		this.notify();
	}

	doLogOff() {
		this.deleteTokenRefreshTimer();
		this.instance?.logout();
		this.isAuthenticated = false;
		this.notify();
	}

	isLoggedIn() {
		return this.isAuthenticated;
	}

	isAvailable() {
		return !!this.instance;
	}
}

