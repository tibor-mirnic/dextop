﻿Ext.define('Dextop.api.ApiController', {

    params: null,
    controllerType: null,

    constructor: function (config) {
        Ext.apply(this, config);
    },

    invokeRemoteMethod: function (callback, scope, method, args) {

        var handler = Dextop.remoting.Proxy.createHandler(callback, scope);

        if (handler.prepare)
            handler.prepare.call(handler.scope);

        if (handler.setMask)
            handler.setMask();

        DextopApi.invoke(this.controllerType, Ext.encode(this.params), method, this.encodeArguments(args), handler.callback, handler.scope);
    },

    encodeArguments: function (a) {
        /* Ext.encode([undefined, 1]) => '[1]' - wrong
		* Ext.encode([null, 1]) => '[null, 1]' - ok
		* If first argument in method call is undefined, second argument will fill it's place
		*/
        for (var i = 0; i < a.length; i++)
            if (!Ext.isDefined(a[i]))
                a[i] = null;
            else if (a[i] !== null)
                if (a[i].$className === "Ext.form.Basic")
                    a[i] = Ext.encode(a[i].getFieldValues());
                else if (typeof a[i] === 'object')
                    a[i] = Ext.encode(a[i]);
        return Ext.encode(a);
    },

    createStore: function (options) {
        return Ext.create('Ext.data.Store', Ext.apply({            
            model: this.getModel(),
            proxy: {
                type: 'api',
                api: this
            }
        }, options));
    },

    createTreeStore: function (options) {
        return Ext.create('Ext.data.TreeStore', Ext.apply({
            model: this.getModel(),
            proxy: {
                type: 'api',
                api: this,
                reader: {
                    type: 'json',
                    rootProperty: 'data'
                }
            }
        }, options));
    },

    getModel: function () {
        if (this.model)
            return this.model;

        throw 'Api controller ' + this.$className + ' does not have model defined and cannot be used as a data proxy.';
    },

    createGridColumns: function (options) {
        var model = this.getModel();
        return Dextop.data.GridColumnsFactory.create(this.replaceLast(model, '.model.', '.columns.'), options);
    },

    replaceLast: function (str, search, replacement) {
        var charpos = str.lastIndexOf(search);
        if (charpos < 0) return str;
        return str.substring(0, charpos) + replacement + str.substring(charpos + search.length);
    },

    getAjaxUrl: function (options) {
        var url = Dextop.api.prototype.ajaxUrlBase + '&_apiControllerType=' + this.controllerType;
        if (options)
            url += '&' + Ext.urlEncode(options);
        return url;
    },

    submitForm: function (callback, scope, method, form, args) {

        var handler = Dextop.remoting.Proxy.createHandler(callback, scope);

        if (handler.prepare)
            handler.prepare.call(handler.scope);

        if (handler.setMask)
            handler.setMask();

        var injectedForm = false;
        var formEl = form;
        var fieldValues = undefined;

        if (form && form.$className === "Ext.form.Basic") {
            var submitAction = Ext.create('Ext.form.action.Submit', {
                form: form
            });
            if (Ext.versions.extjs.version < "4.2.0")
                formEl = submitAction.buildForm();
            else
                formEl = submitAction.buildForm().formEl;
            fieldValues = form.getFieldValues();
            injectedForm = true;
        }

        DextopApi.submitForm(formEl, {
            callback: handler.callback,
            scope: handler.scope,
            params: {
                _apiControllerType: this.controllerType,
                _apiScope: Ext.encode(this.params),
                _apiMethod: method,
                _apiArguments: this.encodeArguments(args),
                _apiFieldValues: Ext.encode(fieldValues)
            }
        });

        if (injectedForm)
            Ext.removeNode(formEl);

    }

});