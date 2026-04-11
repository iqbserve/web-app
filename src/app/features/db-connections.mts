/* Authored by iqbserve.de */

import { Logger } from 'core/logging.mjs';
import { WorkView } from 'core/view-classes.mjs';
import { UIBuilder, onClicked, onInput } from 'core/uibuilder.mjs';
import { WorkViewHtml } from 'core/view-templates.mjs';
import * as Webapi from 'app/core/webapi.mjs';
import * as Icons from 'core/icons.mjs';

import { WorkbenchInterface as WbApp } from 'app/workbench.mjs';

/**
 * A Database connection WorkView created in javascript using a builder.
 */
class DbConnectionsView extends WorkView {

	builder: UIBuilder;
	//ui element collections
	elem: { [key: string]: any; } = {};

	//the connection data objects
	connections;
	currentCon;
	//object that encapsulates the connection ui datalist
	//and the connections data for adding/removing items at once
	conList;

	constructor(id: string) {
		super(id, null);
		this.viewSource.setHtml(WorkViewHtml());
	}

	initialize() {
		super.initialize();
		this.setTitle("Database Connections");

		this.getConnections(() => {
			this.extendViewMenu();
			this.createUI();
			this.setVisible(true);
			this.isInitialized = true;
		})
	}

	/** START UI *****************************************************************/
	createUI() {
		this.builder = new UIBuilder()
			//the mirror collection variable
			.setElementCollection(this.elem)
			//define some style defaults
			.setCompPropDefaults((props) => {
				props.get("label").styleProps = { "width": "70px" };
				props.get("button").styleProps = { "width": "156px", "height": "26px" };
				props.get("textField").styleProps = { "width": "150px" };
			});
		//local shortcut to avoid this.
		let builder = this.builder;

		//get a ui comp object for the workarea for styling
		//and adding a title
		let compSet = builder.newUICompFor(this.viewWorkarea)
			.style({ "gap": "10px" })
			.add("h2", (title) => {
				title.style({ "font-weight": "normal", "user-select": "none" })
					.html("Define and edit database connection properties")
			}).getDomElem();

		this.createSelectionPanel(builder, compSet, null);
		this.createPropertiesPanel(builder, compSet, null);

		this.createSidePanel(builder);

		//get the connections datalist for adding and removing connections 
		this.conList = builder.getDataListFor("tfConnectionName")
		this.conList.data = this.connections;
	}

	/**
	 */
	createSelectionPanel(builder, target, comps) {
		builder.newUIComp()
			.style({ "margin-bottom": "10px" })
			.addLabelTextField(
				{ text: "Name:" }, { varid: "tfConnectionName", datalist: Object.getOwnPropertyNames(this.connections) }, (label, connectionName) => {
					connectionName.style({ placeholder: "connection name", width: "250px" });
					onInput(connectionName, (evt) => {
						this.switchCurrentConnection(evt.currentTarget.value);
					});
				})
			.addActionIcon({ varid: "icoErase", iconName: Icons.eraser(), title: "Clear current selection" }, (icon) => {
				icon.style({ "margin-left": "10px" });
				onClicked(icon, () => { this.clearViewData(); });
			})
			.addActionIcon({ varid: "icoSave", iconName: Icons.save(), title: "Save current connection" }, (icon) => {
				icon.style({ "margin-left": "20px" });
				onClicked(icon, () => { this.saveConnection(); });
			})
			.add("span", (separator) => {
				separator.style({ width: "20px", height: "20px", "margin-right": "20px", "border-right": "1px solid var(--border-gray)" })
			})
			.addActionIcon({ varid: "icoDelete", iconName: Icons.trash(), title: "Delete current connection" }, (icon) => {
				onClicked(icon, () => { this.deleteConnection(); });
			})
			.appendTo(target);
	}

	/**
	 */
	createPropertiesPanel(builder, target, comps) {
		let hgap = "20px";
		let propertiesCompSet;

		builder.newUIComp()
			.addFieldset({ title: "Properties" }, (fieldset) => {
				fieldset.style({ width: "700px", "row-gap": "10px" });
				propertiesCompSet = fieldset.getDomElem();
			});

		target.append(propertiesCompSet);

		builder.newUIComp()
			.addLabelTextField(
				{ text: "DB Url:" }, { varid: "tfDbUrl" }, (label, tfDbUrl) => {
					tfDbUrl.style({ width: "600px" })
						.attrib({ placeholder: "url like e.g. - jdbc:oracle:thin:@localhost:1521/XEPDB1", "data-bind": "url" })
				})
			.appendTo(propertiesCompSet);

		builder.newUIComp()
			.addLabelTextField(
				{ text: "User:" }, { varid: "tfUser" }, (label, tfUser) => {
					tfUser.attrib({ placeholder: "name", "data-bind": "user" })
				})
			.addTextField(
				{ varid: "tfOwner" }, (tfOwner) => {
					tfOwner.style({ "margin-left": hgap })
						.attrib({ placeholder: "optional owner", "data-bind": "owner" })
				})
			.appendTo(propertiesCompSet);

		builder.newUIComp()
			.style({ "align-items": "baseline" })
			.addLabelTextField(
				{ text: "Password:" }, { varid: "tfPwd" }, (label, tfPwd) => {
					tfPwd.attrib({ type: "password", placeholder: "********" })
				})
			.addButton(
				{ text: "Test", title: "Test connection", varid: "pbTest" }, (pbTest) => {
					pbTest.style({ "margin-left": hgap });
					onClicked(pbTest, () => { this.runTestDbConnection(); });
				})
			.addTextArea(
				{ varid: "tfTestResult", rows: "1", readOnly: true }, (tfTestResult) => {
					tfTestResult.style({ "overflow": "hidden", "margin-left": hgap, "text-align": "left", "align-self": "center", "min-width": "80px", "width": "80px" })
						.attrib({ placeholder: "<result>", title: "Test Result" })
				})
			.appendTo(propertiesCompSet);
	}

	/**
	 */
	createSidePanel(builder) {
		//creating a side panel content
		//using mainly plain html

		let makeLI = (iconClass, text) => {
			return `<li style='margin-block-end: 5px;'><span class="${iconClass}"></span> ${text}</li>`
		};
		let sidePanelComp = builder.newUIComp("blankComp")
			.style({ "padding": "20px" })
			.addFromHtml(
				`<span style="display: flex; align-items: center;">
					<i class="${Icons.infoc('class')}" style="font-size: 22px; color: var(--info-light-green);"></i>
    				<h3 style="margin-left: 20px; font-weight: normal; user-select: none;">DB Connections View</h3>
				</span>
				<p>A sample view to create and edit database connection information.</p>
				<p>Connections can be created and edited under a unique name.<br>After typing or selecting an existing name,<br>the connection data is loaded and displayed.</p>
				<ul>
					${makeLI(Icons.eraser("class"), 'clears the current selection and data')}
					${makeLI(Icons.save("class"), 'saves the current data')}
					${makeLI(Icons.trash("class"), 'deletes the current connection')}
				</ul >
				<span>Java Source Code: </span><a class="wkv-link-ctrl" href="https://github.com/iqbserve/JamnServer/blob/master/sample/org.isa.jps.SampleExtension/src/main/java/org/isa/jps/SampleExtension.java" target="iqbserve.code">SampleExtension.java<a>
				`
			);

		this.installSidePanel(sidePanelComp.getDomElem()).setWidth("350px");
		//show it opened
		this.toggleSidePanel();
	}
	/** END UI *****************************************************************/

	getConnections(cb) {
		if (this.connections) {
			cb(this.connections);
		} else {
			//load the data from server
			Webapi.doPOST(Webapi.service_get_dbconnections).then((response) => {
				//connections are sent as an array - create an object from it
				this.connections = {};
				response.connections.forEach((item) => this.connections[item.name] = item);
				cb(this.connections);
			});
		}
	}

	extendViewMenu() {
		this.viewHeader.menu((menu) => {
			menu.addItem("Clear View", (evt) => {
				this.clearViewData();
			}, { separator: "top" });
		});
	}

	switchCurrentConnection(key) {
		if (this.connections[key]) {
			this.currentCon = this.connections[key];
			this.writeDataToView();
		} else if (!this.currentCon) {
			this.currentCon = { name: key };
		} else if (this.connections[this.currentCon.name]) {
			let newCon = { ...this.currentCon };
			newCon.name = key;
			this.currentCon = newCon;
		} else {
			this.currentCon.name = key;
		}
	}

	clearViewData(excludes = []) {
		this.builder.forEachElement((name, ctrl) => {
			if (!excludes.includes(ctrl)) {
				UIBuilder.clearControl(ctrl);
			}
		});

		let key = this.elem.tfConnectionName.value.trim();
		if (key !== "" && this.connections[key]) {
			this.currentCon = this.connections[key];
		} else {
			this.currentCon = null;
		}

		this.showConnectionTestResult();
	}

	writeDataToView() {
		let excludes = [this.elem.tfConnectionName];

		if (this.currentCon) {
			this.builder.forEachBinding((name, ctrl) => {
				ctrl.value = this.currentCon[name];
				excludes.push(ctrl);
			});
			this.clearViewData(excludes);
		} else {
			this.clearViewData();
		}
	}

	readDataFromView() {
		if (this.currentCon) {
			this.builder.forEachBinding((name, ctrl) => {
				this.currentCon[name] = ctrl.value;
			});
		}
	}

	saveConnection() {
		if (this.currentCon) {
			this.readDataFromView();
			let request = JSON.stringify({ connections: [this.currentCon] });
			Webapi.doPOST(Webapi.service_save_dbconnections, request).then((response) => {
				if (response.status === "ok") {
					if (!this.connections[this.currentCon.name]) {
						this.conList.addDataItem(this.currentCon.name, this.currentCon);
					}
					Logger.info("Saved: ok");
				}
			});
		}
	}

	deleteConnection() {
		if (this.currentCon) {
			WbApp.confirm({
				message: `<b>Delete item</b><br>Do you want to delete connection <b>[${this.currentCon.name}]</b> ?`
			}, (val) => {
				if (val) {
					let request = JSON.stringify({ connections: [this.currentCon] });
					Webapi.doPOST(Webapi.service_delete_dbconnections, request).then((response) => {
						if (response.status === "ok") {
							this.conList.removeDataItem(this.currentCon.name);
							this.clearViewData();
							Logger.info("Deleted: ok");
						}
					});
				}
			});
		}
	}

	runTestDbConnection() {
		let userId = this.elem.tfUser.value.trim();
		let pwd = this.elem.tfPwd.value.trim();
		if (userId) {
			if (userId == pwd) {
				this.showConnectionTestResult(true);
			} else {
				this.showConnectionTestResult(false, "Connection refused - invalid credentials - demo password must be = user id");
			}
		} else {
			this.showConnectionTestResult();
		}
	}

	showConnectionTestResult(status: any = -1, text = "") {
		let ctrl = this.elem.tfTestResult;
		let okProps = { color: "green", resize: "none", width: "80px", height: ctrl.style["min-height"] };

		if (status === false) { // NOSONAR
			ctrl.value = "FAILURE - " + text + "\n\n" + new Error("Connection test failed").stack;
			UIBuilder.setStyleOf(ctrl, { color: "red", resize: "auto", width: "550px" });
		} else if (status === true) { // NOSONAR
			ctrl.value = "Success";
			UIBuilder.setStyleOf(ctrl, okProps);
		} else {
			ctrl.value = "";
			okProps.color = "";
			UIBuilder.setStyleOf(ctrl, okProps);
		}
	}

}

//export this view component as singleton instance
const viewInstance = new DbConnectionsView("dbConnectionsView");
export function getView() {
	return viewInstance;
}
