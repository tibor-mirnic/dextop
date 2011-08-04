Ext.ns('Dextop.data');

Ext.define('Dextop.data.Proxy', {

	extend: 'Ext.data.ServerProxy',

	mixins: {
		remotable: 'Dextop.remoting.Remotable'
	},

	requires: ['Ext.data.ServerProxy', 'Dextop.remoting.Remotable'],

	defaultWriterType: 'array',
	defaultReaderType: 'array',

	//callback options for remote method invocation
	remoteCallbackOptions: undefined,

	//auto revert changes rejected by the server
	autoRevert: undefined,

	constructor: function (config) {

		config = config || {};

		if (!config.reader || config.reader === 'array')
			config.reader = Ext.create('Ext.data.ArrayReader', {
				root: 'data'
			});

		if (config.remote) {
			this.initRemote(config.remote);
			delete config.remote;
		}

		this.callParent(arguments);

		this.mon(this, 'exception', function (proxy, response, operation, options) {
			if (this.autoRevert)
				this.revertFailedOperation(operation);
		}, this);
	},	

	// Method for reverting changes rejected by the server.
	// It's very useful when you want that failed data reappear in the grid/store.
	revertFailedOperation: function (operation) {
		var records = operation.getRecords();
		if (records.length == 0)
			return;
		var store = records[0].store;
		switch (operation.action) {
			case "create":
				store.remove(records);
				break;
			case "update":
				for (var i = 0; i < records.length; i++)
					records[i].reject();
				break;
			case "destroy":
				store.removed = [];
				store.loadRecords(records, { addRecords: true });
				break;
		}
	},



	applyEncoding: function (v) {
		return v;
	},

	doRequest: function (operation, callback, scope) {
		var args = [];

		switch (operation.action) {
			case 'read':
				var params = this.getParams({
					Params: operation.params
				}, operation);
				args.push(params);
				break;
			case 'create':
			case 'update':
			case 'destroy':
				if (!this.writer)
					throw 'Proxy writer is not configured.';
				var data = [];
				for (var i = 0; i < operation.records.length; i++)
					data[i] = this.writer.getRecordData(operation.records[i]);
				args.push(Ext.encode(data));
				break;
			default:
				throw 'Uknown action ' + operation.action + '.';
		}
		args.push(this.createCallback(operation, callback, scope));
		args.push(this);
		this[operation.action + 'Record'].apply(this, args);
	},

	createCallback: function (operation, callback, scope) {
		return Ext.apply({
			handler: function (r) {
				this.processResponse(r.success, operation, null, r, callback, scope)
			}
		}, this.remoteCallbackOptions);
	},

	extractResponseData: function (response) {
		response.result.data = Ext.decode(response.result.data);
		return response.result;
	},

	//private
	readRecord: function () {
		this.remote.Load.apply(this.remote, arguments);
	},

	//private
	createRecord: function () {
		this.remote.Create.apply(this.remote, arguments);
	},

	//private
	updateRecord: function () {
		this.remote.Update.apply(this.remote, arguments);
	},

	//private
	destroyRecord: function () {
		this.remote.Destroy.apply(this.remote, arguments);
	},

	onDestroy: function () {
		this.destroyRemote();
		this.callParent(arguments);
	}
})
