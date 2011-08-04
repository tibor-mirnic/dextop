Ext.ns('Showcase');

Ext.define('Showcase.demos.PagingGridWindow', {
    extend: 'Dextop.Window',
    width: 500,
    height: 300,

    title: 'Grid with paging and remote sorting',
    requires: 'Ext.grid.GridPanel',

    initComponent: function () {

        var store = this.remote.createStore('model', {
            pageSize: 10,
            autoLoad: false,
            remoteSort: true
        });

        var columns = this.remote.createGridColumns('model');

        var grid = Ext.create('Ext.grid.GridPanel', {
            store: store,
            columns: columns,
            bbar: new Ext.PagingToolbar({
                store: store,
                displayInfo: true,
                displayMsg: 'Displaying items {0} - {1} of {2}',
                emptyMsg: "No items to display"
            })
        });

        Ext.apply(this, {
            layout: 'fit',
            items: grid
        });

        store.loadPage(1);

        this.callParent(arguments);

    }
});
