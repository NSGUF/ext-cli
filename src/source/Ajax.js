/* 1 */
/*2 */
Ext.data.Store = Ext.extend(Ext.util.Observable, {
    /* 1 */
    /*2 */
    writer : undefined,
    /* 1 */
    /*2 */
    remoteSort : false,


    constructor : function(config){
        if(this.reader){ // reader passed
            if(!this.recordType){
                this.recordType = this.reader.recordType;
            }
            if(this.reader.onMetaChange){
                this.reader.onMetaChange = this.reader.onMetaChange.createSequence(this.onMetaChange, this);
            }
            if (this.writer) { // writer passed
                if (this.writer instanceof(Ext.data.DataWriter) === false) {    // <-- config-object instead of instance.
                    this.writer = this.buildWriter(this.writer);
                }
                this.writer.meta = this.reader.meta;
                this.pruneModifiedRecords = true;
            }
        }

        /**
         * The {@link Ext.data.Record Record} constructor as supplied to (or created by) the
         * {@link Ext.data.DataReader Reader}. Read-only.
         * <p>If the Reader was constructed by passing in an Array of {@link Ext.data.Field} definition objects,
         * instead of a Record constructor, it will implicitly create a Record constructor from that Array (see
         * {@link Ext.data.Record}.{@link Ext.data.Record#create create} for additional details).</p>
         * <p>This property may be used to create new Records of the type held in this Store, for example:</p><pre><code>
         // create the data store
         var store = new Ext.data.ArrayStore({
        autoDestroy: true,
        fields: [
           {name: 'company'},
           {name: 'price', type: 'float'},
           {name: 'change', type: 'float'},
           {name: 'pctChange', type: 'float'},
           {name: 'lastChange', type: 'date', dateFormat: 'n/j h:ia'}
        ]
    });
         store.loadData(myData);

         // create the Grid
         var grid = new Ext.grid.EditorGridPanel({
        store: store,
        colModel: new Ext.grid.ColumnModel({
            columns: [
                {id:'company', header: 'Company', width: 160, dataIndex: 'company'},
                {header: 'Price', renderer: 'usMoney', dataIndex: 'price'},
                {header: 'Change', renderer: change, dataIndex: 'change'},
                {header: '% Change', renderer: pctChange, dataIndex: 'pctChange'},
                {header: 'Last Updated', width: 85,
                    renderer: Ext.util.Format.dateRenderer('m/d/Y'),
                    dataIndex: 'lastChange'}
            ],
            defaults: {
                sortable: true,
                width: 75
            }
        }),
        autoExpandColumn: 'company', // match the id specified in the column model
        height:350,
        width:600,
        title:'Array Grid',
        tbar: [{
            text: 'Add Record',
            handler : function(){
                var defaultData = {
                    change: 0,
                    company: 'New Company',
                    lastChange: (new Date()).clearTime(),
                    pctChange: 0,
                    price: 10
                };
                var recId = 3; // provide unique id
                var p = new store.recordType(defaultData, recId); // create new record
                grid.stopEditing();
                store.{@link #insert}(0, p); // insert a new record into the store (also see {@link #add})
                grid.startEditing(0, 0);
            }
        }]
    });
         * </code></pre>
         * @property recordType
         * @type Function
         */

        if(this.recordType){
            /**
             * A {@link Ext.util.MixedCollection MixedCollection} containing the defined {@link Ext.data.Field Field}s
             * for the {@link Ext.data.Record Records} stored in this Store. Read-only.
             * @property fields
             * @type Ext.util.MixedCollection
             */
            this.fields = this.recordType.prototype.fields;
        }
        this.modified = [];

        this.add ();
        this.addEvents (
            /**
             * @event datachanged
             * Fires when the data cache has changed in a bulk manner (e.g., it has been sorted, filtered, etc.) and a
             * widget that is using this Store as a Record cache should refresh its view.
             * @param {Store} this
             */
            'datachanged',
            /**
             * @event metachange
             * Fires when this store's reader provides new metadata (fields). This is currently only supported for JsonReaders.
             * @param {Store} this
             * @param {Object} meta The JSON metadata
             */
            'metachange'
        );

        if(this.proxy){
            // TODO remove deprecated loadexception with ext-3.0.1
            this.relayEvents(this.proxy,  ['loadexception', 'exception']);
        }
        // With a writer set for the Store, we want to listen to add/remove events to remotely create/destroy records.
        if (this.writer) {
            this.on({
                scope: this,
                add: this.createRecords,
                remove: this.destroyRecord,
                update: this.updateRecord,
                clear: this.onClear
            });
        }

        this.sortToggle = {};
        if(this.sortField){
            this.setDefaultSort(this.sortField, this.sortDir);
        }else if(this.sortInfo){
            this.setDefaultSort(this.sortInfo.field, this.sortInfo.direction);
        }

        Ext.data.Store.superclass.constructor.call(this);

        if(this.id){
            this.storeId = this.id;
            delete this.id;
        }
        if(this.storeId){
            Ext.StoreMgr.register(this);
        }
        if(this.inlineData){
            this.loadData(this.inlineData);
            delete this.inlineData;
        }else if(this.autoLoad){
            this.load.defer(10, this, [
                typeof this.autoLoad == 'object' ?
                    this.autoLoad : undefined]);
        }
        // used internally to uniquely identify a batch
        this.batchCounter = 0;
        this.batches = {};
    },

    /**
     * builds a DataWriter instance when Store constructor is provided with a writer config-object instead of an instace.
     * @param {Object} config Writer configuration
     * @return {Ext.data.DataWriter}
     * @private
     */
    buildWriter : function(config) {
        var klass = undefined,
            type = (config.format || 'json').toLowerCase();
        switch (type) {
            case 'json':
                klass = Ext.data.JsonWriter;
                break;
            case 'xml':
                klass = Ext.data.XmlWriter;
                break;
            default:
                klass = Ext.data.JsonWriter;
        }
        return new klass(config);
    },
});

// 这句不能删 表示下面都是例子的意思
// :EXAM
new Ext.Button({
    text: 'test',
    handler: () => {
        console.log('test');
    }
});
