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

    /**
     * Destroys the store.
     */
    destroy : function(){
        if(!this.isDestroyed){
            if(this.storeId){
                Ext.StoreMgr.unregister(this);
            }
            this.clearData();
            this.data = null;
            Ext.destroy(this.proxy);
            this.reader = this.writer = null;
            this.purgeListeners();
            this.isDestroyed = true;
        }
    },

    /**
     * Add Records to the Store and fires the {@link #add} event.  To add Records
     * to the store from a remote source use <code>{@link #load}({add:true})</code>.
     * See also <code>{@link #recordType}</code> and <code>{@link #insert}</code>.
     * @param {Ext.data.Record[]} records An Array of Ext.data.Record objects
     * to add to the cache. See {@link #recordType}.
     */
    add : function(records) {
        var i, len, record, index;

        records = [].concat(records);
        if (records.length < 1) {
            return;
        }

        for (i = 0, len = records.length; i < len; i++) {
            record = records[i];

            record.join(this);

            if (record.dirty || record.phantom) {
                this.modified.push(record);
            }
        }

        index = this.data.length;
        this.data.addAll(records);

        if (this.snapshot) {
            this.snapshot.addAll(records);
        }

        this.fireEvent('add', this, records, index);
    },

    /**
     * (Local sort only) Inserts the passed Record into the Store at the index where it
     * should go based on the current sort information.
     * @param {Ext.data.Record} record
     */
    addSorted : function(record){
        var index = this.findInsertIndex(record);
        this.insert(index, record);
    },

    /**
     * @private
     * Update a record within the store with a new reference
     */
    doUpdate: function(rec){
        var id = rec.id;
        // unjoin the old record
        this.getById(id).join(null);

        this.data.replace(id, rec);
        if (this.snapshot) {
            this.snapshot.replace(id, rec);
        }
        rec.join(this);
        this.fireEvent('update', this, rec, Ext.data.Record.COMMIT);
    },

    /**
     * Remove Records from the Store and fires the {@link #remove} event.
     * @param {Ext.data.Record/Ext.data.Record[]} record The record object or array of records to remove from the cache.
     */
    remove : function(record){
        if(Ext.isArray(record)){
            Ext.each(record, function(r){
                this.remove(r);
            }, this);
            return;
        }
        var index = this.data.indexOf(record);
        if(index > -1){
            record.join(null);
            this.data.removeAt(index);
        }
        if(this.pruneModifiedRecords){
            this.modified.remove(record);
        }
        if(this.snapshot){
            this.snapshot.remove(record);
        }
        if(index > -1){
            this.fireEvent('remove', this, record, index);
        }
    },

    /**
     * Remove a Record from the Store at the specified index. Fires the {@link #remove} event.
     * @param {Number} index The index of the record to remove.
     */
    removeAt : function(index){
        this.remove(this.getAt(index));
    },

    /**
     * Remove all Records from the Store and fires the {@link #clear} event.
     * @param {Boolean} silent [false] Defaults to <tt>false</tt>.  Set <tt>true</tt> to not fire clear event.
     */
    removeAll : function(silent){
        var items = [];
        this.each(function(rec){
            items.push(rec);
        });
        this.clearData();
        if(this.snapshot){
            this.snapshot.clear();
        }
        if(this.pruneModifiedRecords){
            this.modified = [];
        }
        if (silent !== true) {  // <-- prevents write-actions when we just want to clear a store.
            this.fireEvent('clear', this, items);
        }
    },

    // private
    onClear: function(store, records){
        Ext.each(records, function(rec, index){
            this.destroyRecord(this, rec, index);
        }, this);
    },

    /**
     * Inserts Records into the Store at the given index and fires the {@link #add} event.
     * See also <code>{@link #add}</code> and <code>{@link #addSorted}</code>.
     * @param {Number} index The start index at which to insert the passed Records.
     * @param {Ext.data.Record[]} records An Array of Ext.data.Record objects to add to the cache.
     */
    insert : function(index, records) {
        var i, len, record;

        records = [].concat(records);
        for (i = 0, len = records.length; i < len; i++) {
            record = records[i];

            this.data.insert(index + i, record);
            record.join(this);

            if (record.dirty || record.phantom) {
                this.modified.push(record);
            }
        }

        if (this.snapshot) {
            this.snapshot.addAll(records);
        }

        this.fireEvent('add', this, records, index);
    },

    /**
     * Get the index within the cache of the passed Record.
     * @param {Ext.data.Record} record The Ext.data.Record object to find.
     * @return {Number} The index of the passed Record. Returns -1 if not found.
     */
    indexOf : function(record){
        return this.data.indexOf(record);
    },

    /**
     * Get the index within the cache of the Record with the passed id.
     * @param {String} id The id of the Record to find.
     * @return {Number} The index of the Record. Returns -1 if not found.
     */
    indexOfId : function(id){
        return this.data.indexOfKey(id);
    },

    /**
     * Get the Record with the specified id.
     * @param {String} id The id of the Record to find.
     * @return {Ext.data.Record} The Record with the passed id. Returns undefined if not found.
     */
    getById : function(id){
        return (this.snapshot || this.data).key(id);
    },

    /**
     * Get the Record at the specified index.
     * @param {Number} index The index of the Record to find.
     * @return {Ext.data.Record} The Record at the passed index. Returns undefined if not found.
     */
    getAt : function(index){
        return this.data.itemAt(index);
    },

    /**
     * Returns a range of Records between specified indices.
     * @param {Number} startIndex (optional) The starting index (defaults to 0)
     * @param {Number} endIndex (optional) The ending index (defaults to the last Record in the Store)
     * @return {Ext.data.Record[]} An array of Records
     */
    getRange : function(start, end){
        return this.data.getRange(start, end);
    },

    // private
    storeOptions : function(o){
        o = Ext.apply({}, o);
        delete o.callback;
        delete o.scope;
        this.lastOptions = o;
    },

    // private
    clearData: function(){
        this.data.each(function(rec) {
            rec.join(null);
        });
        this.data.clear();
    },

    /**
     * <p>Loads the Record cache from the configured <tt>{@link #proxy}</tt> using the configured <tt>{@link #reader}</tt>.</p>
     * <br><p>Notes:</p><div class="mdetail-params"><ul>
     * <li><b><u>Important</u></b>: loading is asynchronous! This call will return before the new data has been
     * loaded. To perform any post-processing where information from the load call is required, specify
     * the <tt>callback</tt> function to be called, or use a {@link Ext.util.Observable#listeners a 'load' event handler}.</li>
     * <li>If using {@link Ext.PagingToolbar remote paging}, the first load call must specify the <tt>start</tt> and <tt>limit</tt>
     * properties in the <code>options.params</code> property to establish the initial position within the
     * dataset, and the number of Records to cache on each read from the Proxy.</li>
     * <li>If using {@link #remoteSort remote sorting}, the configured <code>{@link #sortInfo}</code>
     * will be automatically included with the posted parameters according to the specified
     * <code>{@link #paramNames}</code>.</li>
     * </ul></div>
     * @param {Object} options An object containing properties which control loading options:<ul>
     * <li><b><tt>params</tt></b> :Object<div class="sub-desc"><p>An object containing properties to pass as HTTP
     * parameters to a remote data source. <b>Note</b>: <code>params</code> will override any
     * <code>{@link #baseParams}</code> of the same name.</p>
     * <p>Parameters are encoded as standard HTTP parameters using {@link Ext#urlEncode}.</p></div></li>
     * <li><b>callback</b> : Function<div class="sub-desc"><p>A function to be called after the Records
     * have been loaded. The callback is called after the load event is fired, and is passed the following arguments:<ul>
     * <li>r : Ext.data.Record[] An Array of Records loaded.</li>
     * <li>options : Options object from the load call.</li>
     * <li>success : Boolean success indicator.</li></ul></p></div></li>
     * <li><b>scope</b> : Object<div class="sub-desc"><p>Scope with which to call the callback (defaults
     * to the Store object)</p></div></li>
     * <li><b>add</b> : Boolean<div class="sub-desc"><p>Indicator to append loaded records rather than
     * replace the current cache.  <b>Note</b>: see note for <tt>{@link #loadData}</tt></p></div></li>
     * </ul>
     * @return {Boolean} If the <i>developer</i> provided <tt>{@link #beforeload}</tt> event handler returns
     * <tt>false</tt>, the load call will abort and will return <tt>false</tt>; otherwise will return <tt>true</tt>.
     */
    load : function(options) {
        options = Ext.apply({}, options);
        this.storeOptions(options);
        if(this.sortInfo && this.remoteSort){
            var pn = this.paramNames;
            options.params = Ext.apply({}, options.params);
            options.params[pn.sort] = this.sortInfo.field;
            options.params[pn.dir] = this.sortInfo.direction;
        }
        try {
            return this.execute('read', null, options); // <-- null represents rs.  No rs for load actions.
        } catch(e) {
            this.handleException(e);
            return false;
        }
    },

    /**
     * updateRecord  Should not be used directly.  This method will be called automatically if a Writer is set.
     * Listens to 'update' event.
     * @param {Object} store
     * @param {Object} record
     * @param {Object} action
     * @private
     */
    updateRecord : function(store, record, action) {
        if (action == Ext.data.Record.EDIT && this.autoSave === true && (!record.phantom || (record.phantom && record.isValid()))) {
            this.save();
        }
    },

    /**
     * @private
     * Should not be used directly.  Store#add will call this automatically if a Writer is set
     * @param {Object} store
     * @param {Object} records
     * @param {Object} index
     */
    createRecords : function(store, records, index) {
        var modified = this.modified,
            length   = records.length,
            record, i;

        for (i = 0; i < length; i++) {
            record = records[i];

            if (record.phantom && record.isValid()) {
                record.markDirty();  // <-- Mark new records dirty (Ed: why?)

                if (modified.indexOf(record) == -1) {
                    modified.push(record);
                }
            }
        }
        if (this.autoSave === true) {
            this.save();
        }
    },

    /**
     * Destroys a Record.  Should not be used directly.  It's called by Store#remove if a Writer is set.
     * @param {Store} store this
     * @param {Ext.data.Record} record
     * @param {Number} index
     * @private
     */
    destroyRecord : function(store, record, index) {
        if (this.modified.indexOf(record) != -1) {  // <-- handled already if @cfg pruneModifiedRecords == true
            this.modified.remove(record);
        }
        if (!record.phantom) {
            this.removed.push(record);

            // since the record has already been removed from the store but the server request has not yet been executed,
            // must keep track of the last known index this record existed.  If a server error occurs, the record can be
            // put back into the store.  @see Store#createCallback where the record is returned when response status === false
            record.lastIndex = index;

            if (this.autoSave === true) {
                this.save();
            }
        }
    },

    /**
     * This method should generally not be used directly.  This method is called internally
     * by {@link #load}, or if a Writer is set will be called automatically when {@link #add},
     * {@link #remove}, or {@link #update} events fire.
     * @param {String} action Action name ('read', 'create', 'update', or 'destroy')
     * @param {Record/Record[]} rs
     * @param {Object} options
     * @throws Error
     * @private
     */
    execute : function(action, rs, options, /* private */ batch) {
        // blow up if action not Ext.data.CREATE, READ, UPDATE, DESTROY
        if (!Ext.data.Api.isAction(action)) {
            throw new Ext.data.Api.Error('execute', action);
        }
        // make sure options has a fresh, new params hash
        options = Ext.applyIf(options||{}, {
            params: {}
        });
        if(batch !== undefined){
            this.addToBatch(batch);
        }
        // have to separate before-events since load has a different signature than create,destroy and save events since load does not
        // include the rs (record resultset) parameter.  Capture return values from the beforeaction into doRequest flag.
        var doRequest = true;

        if (action === 'read') {
            doRequest = this.fireEvent('beforeload', this, options);
            Ext.applyIf(options.params, this.baseParams);
        }
        else {
            // if Writer is configured as listful, force single-record rs to be [{}] instead of {}
            // TODO Move listful rendering into DataWriter where the @cfg is defined.  Should be easy now.
            if (this.writer.listful === true && this.restful !== true) {
                rs = (Ext.isArray(rs)) ? rs : [rs];
            }
            // if rs has just a single record, shift it off so that Writer writes data as '{}' rather than '[{}]'
            else if (Ext.isArray(rs) && rs.length == 1) {
                rs = rs.shift();
            }
            // Write the action to options.params
            if ((doRequest = this.fireEvent('beforewrite', this, action, rs, options)) !== false) {
                this.writer.apply(options.params, this.baseParams, action, rs);
            }
        }
        if (doRequest !== false) {
            // Send request to proxy.
            if (this.writer && this.proxy.url && !this.proxy.restful && !Ext.data.Api.hasUniqueUrl(this.proxy, action)) {
                options.params.xaction = action;    // <-- really old, probaby unecessary.
            }
            // Note:  Up until this point we've been dealing with 'action' as a key from Ext.data.Api.actions.
            // We'll flip it now and send the value into DataProxy#request, since it's the value which maps to
            // the user's configured DataProxy#api
            // TODO Refactor all Proxies to accept an instance of Ext.data.Request (not yet defined) instead of this looooooong list
            // of params.  This method is an artifact from Ext2.
            this.proxy.request(Ext.data.Api.actions[action], rs, options.params, this.reader, this.createCallback(action, rs, batch), this, options);
        }
        return doRequest;
    },

    /**
     * Saves all pending changes to the store.  If the commensurate Ext.data.Api.actions action is not configured, then
     * the configured <code>{@link #url}</code> will be used.
     * <pre>
     * change            url
     * ---------------   --------------------
     * removed records   Ext.data.Api.actions.destroy
     * phantom records   Ext.data.Api.actions.create
     * {@link #getModifiedRecords modified records}  Ext.data.Api.actions.update
     * </pre>
     * @TODO:  Create extensions of Error class and send associated Record with thrown exceptions.
     * e.g.:  Ext.data.DataReader.Error or Ext.data.Error or Ext.data.DataProxy.Error, etc.
     * @return {Number} batch Returns a number to uniquely identify the "batch" of saves occurring. -1 will be returned
     * if there are no items to save or the save was cancelled.
     */
    save : function() {
        if (!this.writer) {
            throw new Ext.data.Store.Error('writer-undefined');
        }

        var queue = [],
            len,
            trans,
            batch,
            data = {},
            i;
        // DESTROY:  First check for removed records.  Records in this.removed are guaranteed non-phantoms.  @see Store#remove
        if(this.removed.length){
            queue.push(['destroy', this.removed]);
        }

        // Check for modified records. Use a copy so Store#rejectChanges will work if server returns error.
        var rs = [].concat(this.getModifiedRecords());
        if(rs.length){
            // CREATE:  Next check for phantoms within rs.  splice-off and execute create.
            var phantoms = [];
            for(i = rs.length-1; i >= 0; i--){
                if(rs[i].phantom === true){
                    var rec = rs.splice(i, 1).shift();
                    if(rec.isValid()){
                        phantoms.push(rec);
                    }
                }else if(!rs[i].isValid()){ // <-- while we're here, splice-off any !isValid real records
                    rs.splice(i,1);
                }
            }
            // If we have valid phantoms, create them...
            if(phantoms.length){
                queue.push(['create', phantoms]);
            }

            // UPDATE:  And finally, if we're still here after splicing-off phantoms and !isValid real records, update the rest...
            if(rs.length){
                queue.push(['update', rs]);
            }
        }
        len = queue.length;
        if(len){
            batch = ++this.batchCounter;
            for(i = 0; i < len; ++i){
                trans = queue[i];
                data[trans[0]] = trans[1];
            }
            if(this.fireEvent('beforesave', this, data) !== false){
                for(i = 0; i < len; ++i){
                    trans = queue[i];
                    this.doTransaction(trans[0], trans[1], batch);
                }
                return batch;
            }
        }
        return -1;
    },

    // private.  Simply wraps call to Store#execute in try/catch.  Defers to Store#handleException on error.  Loops if batch: false
    doTransaction : function(action, rs, batch) {
        function transaction(records) {
            try{
                this.execute(action, records, undefined, batch);
            }catch (e){
                this.handleException(e);
            }
        }
        if(this.batch === false){
            for(var i = 0, len = rs.length; i < len; i++){
                transaction.call(this, rs[i]);
            }
        }else{
            transaction.call(this, rs);
        }
    },

    // private
    addToBatch : function(batch){
        var b = this.batches,
            key = this.batchKey + batch,
            o = b[key];

        if(!o){
            b[key] = o = {
                id: batch,
                count: 0,
                data: {}
            };
        }
        ++o.count;
    },

    removeFromBatch : function(batch, action, data){
        var b = this.batches,
            key = this.batchKey + batch,
            o = b[key],
            arr;


        if(o){
            arr = o.data[action] || [];
            o.data[action] = arr.concat(data);
            if(o.count === 1){
                data = o.data;
                delete b[key];
                this.fireEvent('save', this, batch, data);
            }else{
                --o.count;
            }
        }
    },

    // @private callback-handler for remote CRUD actions
    // Do not override -- override loadRecords, onCreateRecords, onDestroyRecords and onUpdateRecords instead.
    createCallback : function(action, rs, batch) {
        var actions = Ext.data.Api.actions;
        return (action == 'read') ? this.loadRecords : function(data, response, success) {
            // calls: onCreateRecords | onUpdateRecords | onDestroyRecords
            this['on' + Ext.util.Format.capitalize(action) + 'Records'](success, rs, [].concat(data));
            // If success === false here, exception will have been called in DataProxy
            if (success === true) {
                this.fireEvent('write', this, action, data, response, rs);
            }
            this.removeFromBatch(batch, action, data);
        };
    },

    // Clears records from modified array after an exception event.
    // NOTE:  records are left marked dirty.  Do we want to commit them even though they were not updated/realized?
    // TODO remove this method?
    clearModified : function(rs) {
        if (Ext.isArray(rs)) {
            for (var n=rs.length-1;n>=0;n--) {
                this.modified.splice(this.modified.indexOf(rs[n]), 1);
            }
        } else {
            this.modified.splice(this.modified.indexOf(rs), 1);
        }
    },

    // remap record ids in MixedCollection after records have been realized.  @see Store#onCreateRecords, @see DataReader#realize
    reMap : function(record) {
        if (Ext.isArray(record)) {
            for (var i = 0, len = record.length; i < len; i++) {
                this.reMap(record[i]);
            }
        } else {
            delete this.data.map[record._phid];
            this.data.map[record.id] = record;
            var index = this.data.keys.indexOf(record._phid);
            this.data.keys.splice(index, 1, record.id);
            delete record._phid;
        }
    },

    // @protected onCreateRecord proxy callback for create action
    onCreateRecords : function(success, rs, data) {
        if (success === true) {
            try {
                this.reader.realize(rs, data);
            }
            catch (e) {
                this.handleException(e);
                if (Ext.isArray(rs)) {
                    // Recurse to run back into the try {}.  DataReader#realize splices-off the rs until empty.
                    this.onCreateRecords(success, rs, data);
                }
            }
        }
    },

    // @protected, onUpdateRecords proxy callback for update action
    onUpdateRecords : function(success, rs, data) {
        if (success === true) {
            try {
                this.reader.update(rs, data);
            } catch (e) {
                this.handleException(e);
                if (Ext.isArray(rs)) {
                    // Recurse to run back into the try {}.  DataReader#update splices-off the rs until empty.
                    this.onUpdateRecords(success, rs, data);
                }
            }
        }
    },

    // @protected onDestroyRecords proxy callback for destroy action
    onDestroyRecords : function(success, rs, data) {
        // splice each rec out of this.removed
        rs = (rs instanceof Ext.data.Record) ? [rs] : [].concat(rs);
        for (var i=0,len=rs.length;i<len;i++) {
            this.removed.splice(this.removed.indexOf(rs[i]), 1);
        }
        if (success === false) {
            // put records back into store if remote destroy fails.
            // @TODO: Might want to let developer decide.
            for (i=rs.length-1;i>=0;i--) {
                this.insert(rs[i].lastIndex, rs[i]);    // <-- lastIndex set in Store#destroyRecord
            }
        }
    },

    // protected handleException.  Possibly temporary until Ext framework has an exception-handler.
    handleException : function(e) {
        // @see core/Error.js
        Ext.handleError(e);
    },

    /**
     * <p>Reloads the Record cache from the configured Proxy using the configured
     * {@link Ext.data.Reader Reader} and the options from the last load operation
     * performed.</p>
     * <p><b>Note</b>: see the Important note in {@link #load}.</p>
     * @param {Object} options <p>(optional) An <tt>Object</tt> containing
     * {@link #load loading options} which may override the {@link #lastOptions options}
     * used in the last {@link #load} operation. See {@link #load} for details
     * (defaults to <tt>null</tt>, in which case the {@link #lastOptions} are
     * used).</p>
     * <br><p>To add new params to the existing params:</p><pre><code>
lastOptions = myStore.lastOptions;
Ext.apply(lastOptions.params, {
    myNewParam: true
});
myStore.reload(lastOptions);
     * </code></pre>
     */
    reload : function(options){
        this.load(Ext.applyIf(options||{}, this.lastOptions));
    },

    // private
    // Called as a callback by the Reader during a load operation.
    loadRecords : function(o, options, success){
        var i, len;

        if (this.isDestroyed === true) {
            return;
        }
        if(!o || success === false){
            if(success !== false){
                this.fireEvent('load', this, [], options);
            }
            if(options.callback){
                options.callback.call(options.scope || this, [], options, false, o);
            }
            return;
        }
        var r = o.records, t = o.totalRecords || r.length;
        if(!options || options.add !== true){
            if(this.pruneModifiedRecords){
                this.modified = [];
            }
            for(i = 0, len = r.length; i < len; i++){
                r[i].join(this);
            }
            if(this.snapshot){
                this.data = this.snapshot;
                delete this.snapshot;
            }
            this.clearData();
            this.data.addAll(r);
            this.totalLength = t;
            this.applySort();
            this.fireEvent('datachanged', this);
        }else{
            var toAdd = [],
                rec,
                cnt = 0;
            for(i = 0, len = r.length; i < len; ++i){
                rec = r[i];
                if(this.indexOfId(rec.id) > -1){
                    this.doUpdate(rec);
                }else{
                    toAdd.push(rec);
                    ++cnt;
                }
            }
            this.totalLength = Math.max(t, this.data.length + cnt);
            this.add(toAdd);
        }
        this.fireEvent('load', this, r, options);
        if(options.callback){
            options.callback.call(options.scope || this, r, options, true);
        }
    },

    /**
     * Loads data from a passed data block and fires the {@link #load} event. A {@link Ext.data.Reader Reader}
     * which understands the format of the data must have been configured in the constructor.
     * @param {Object} data The data block from which to read the Records.  The format of the data expected
     * is dependent on the type of {@link Ext.data.Reader Reader} that is configured and should correspond to
     * that {@link Ext.data.Reader Reader}'s <tt>{@link Ext.data.Reader#readRecords}</tt> parameter.
     * @param {Boolean} append (Optional) <tt>true</tt> to append the new Records rather the default to replace
     * the existing cache.
     * <b>Note</b>: that Records in a Store are keyed by their {@link Ext.data.Record#id id}, so added Records
     * with ids which are already present in the Store will <i>replace</i> existing Records. Only Records with
     * new, unique ids will be added.
     */
    loadData : function(o, append){
        var r = this.reader.readRecords(o);
        this.loadRecords(r, {add: append}, true);
    },

    /**
     * Gets the number of cached records.
     * <p>If using paging, this may not be the total size of the dataset. If the data object
     * used by the Reader contains the dataset size, then the {@link #getTotalCount} function returns
     * the dataset size.  <b>Note</b>: see the Important note in {@link #load}.</p>
     * @return {Number} The number of Records in the Store's cache.
     */
    getCount : function(){
        return this.data.length || 0;
    },

    /**
     * Gets the total number of records in the dataset as returned by the server.
     * <p>If using paging, for this to be accurate, the data object used by the {@link #reader Reader}
     * must contain the dataset size. For remote data sources, the value for this property
     * (<tt>totalProperty</tt> for {@link Ext.data.JsonReader JsonReader},
     * <tt>totalRecords</tt> for {@link Ext.data.XmlReader XmlReader}) shall be returned by a query on the server.
     * <b>Note</b>: see the Important note in {@link #load}.</p>
     * @return {Number} The number of Records as specified in the data object passed to the Reader
     * by the Proxy.
     * <p><b>Note</b>: this value is not updated when changing the contents of the Store locally.</p>
     */
    getTotalCount : function(){
        return this.totalLength || 0;
    },

    /**
     * Returns an object describing the current sort state of this Store.
     * @return {Object} The sort state of the Store. An object with two properties:<ul>
     * <li><b>field : String</b><p class="sub-desc">The name of the field by which the Records are sorted.</p></li>
     * <li><b>direction : String</b><p class="sub-desc">The sort order, 'ASC' or 'DESC' (case-sensitive).</p></li>
     * </ul>
     * See <tt>{@link #sortInfo}</tt> for additional details.
     */
    getSortState : function(){
        return this.sortInfo;
    },

    /**
     * @private
     * Invokes sortData if we have sortInfo to sort on and are not sorting remotely
     */
    applySort : function(){
        if ((this.sortInfo || this.multiSortInfo) && !this.remoteSort) {
            this.sortData();
        }
    },

    /**
     * @private
     * Performs the actual sorting of data. This checks to see if we currently have a multi sort or not. It applies
     * each sorter field/direction pair in turn by building an OR'ed master sorting function and running it against
     * the full dataset
     */
    sortData : function() {
        var sortInfo  = this.hasMultiSort ? this.multiSortInfo : this.sortInfo,
            direction = sortInfo.direction || "ASC",
            sorters   = sortInfo.sorters,
            sortFns   = [];

        //if we just have a single sorter, pretend it's the first in an array
        if (!this.hasMultiSort) {
            sorters = [{direction: direction, field: sortInfo.field}];
        }

        //create a sorter function for each sorter field/direction combo
        for (var i=0, j = sorters.length; i < j; i++) {
            sortFns.push(this.createSortFunction(sorters[i].field, sorters[i].direction));
        }

        if (sortFns.length == 0) {
            return;
        }

        //the direction modifier is multiplied with the result of the sorting functions to provide overall sort direction
        //(as opposed to direction per field)
        var directionModifier = direction.toUpperCase() == "DESC" ? -1 : 1;

        //create a function which ORs each sorter together to enable multi-sort
        var fn = function(r1, r2) {
          var result = sortFns[0].call(this, r1, r2);

          //if we have more than one sorter, OR any additional sorter functions together
          if (sortFns.length > 1) {
              for (var i=1, j = sortFns.length; i < j; i++) {
                  result = result || sortFns[i].call(this, r1, r2);
              }
          }

          return directionModifier * result;
        };

        //sort the data
        this.data.sort(direction, fn);
        if (this.snapshot && this.snapshot != this.data) {
            this.snapshot.sort(direction, fn);
        }
    },

    /**
     * @private
     * Creates and returns a function which sorts an array by the given field and direction
     * @param {String} field The field to create the sorter for
     * @param {String} direction The direction to sort by (defaults to "ASC")
     * @return {Function} A function which sorts by the field/direction combination provided
     */
    createSortFunction: function(field, direction) {
        direction = direction || "ASC";
        var directionModifier = direction.toUpperCase() == "DESC" ? -1 : 1;

        var sortType = this.fields.get(field).sortType;

        //create a comparison function. Takes 2 records, returns 1 if record 1 is greater,
        //-1 if record 2 is greater or 0 if they are equal
        return function(r1, r2) {
            var v1 = sortType(r1.data[field]),
                v2 = sortType(r2.data[field]);

            return directionModifier * (v1 > v2 ? 1 : (v1 < v2 ? -1 : 0));
        };
    },

    /**
     * Sets the default sort column and order to be used by the next {@link #load} operation.
     * @param {String} fieldName The name of the field to sort by.
     * @param {String} dir (optional) The sort order, 'ASC' or 'DESC' (case-sensitive, defaults to <tt>'ASC'</tt>)
     */
    setDefaultSort : function(field, dir) {
        dir = dir ? dir.toUpperCase() : 'ASC';
        this.sortInfo = {field: field, direction: dir};
        this.sortToggle[field] = dir;
    },

    /**
     * Sort the Records.
     * If remote sorting is used, the sort is performed on the server, and the cache is reloaded. If local
     * sorting is used, the cache is sorted internally. See also {@link #remoteSort} and {@link #paramNames}.
     * This function accepts two call signatures - pass in a field name as the first argument to sort on a single
     * field, or pass in an array of sort configuration objects to sort by multiple fields.
     * Single sort example:
     * store.sort('name', 'ASC');
     * Multi sort example:
     * store.sort([
     *   {
     *     field    : 'name',
     *     direction: 'ASC'
     *   },
     *   {
     *     field    : 'salary',
     *     direction: 'DESC'
     *   }
     * ], 'ASC');
     * In this second form, the sort configs are applied in order, with later sorters sorting within earlier sorters' results.
     * For example, if two records with the same name are present they will also be sorted by salary if given the sort configs
     * above. Any number of sort configs can be added.
     * @param {String/Array} fieldName The name of the field to sort by, or an array of ordered sort configs
     * @param {String} dir (optional) The sort order, 'ASC' or 'DESC' (case-sensitive, defaults to <tt>'ASC'</tt>)
     */
    sort : function(fieldName, dir) {
        if (Ext.isArray(arguments[0])) {
            return this.multiSort.call(this, fieldName, dir);
        } else {
            return this.singleSort(fieldName, dir);
        }
    },

    /**
     * Sorts the store contents by a single field and direction. This is called internally by {@link sort} and would
     * not usually be called manually
     * @param {String} fieldName The name of the field to sort by.
     * @param {String} dir (optional) The sort order, 'ASC' or 'DESC' (case-sensitive, defaults to <tt>'ASC'</tt>)
     */
    singleSort: function(fieldName, dir) {
        var field = this.fields.get(fieldName);
        if (!field) {
            return false;
        }

        var name       = field.name,
            sortInfo   = this.sortInfo || null,
            sortToggle = this.sortToggle ? this.sortToggle[name] : null;

        if (!dir) {
            if (sortInfo && sortInfo.field == name) { // toggle sort dir
                dir = (this.sortToggle[name] || 'ASC').toggle('ASC', 'DESC');
            } else {
                dir = field.sortDir;
            }
        }

        this.sortToggle[name] = dir;
        this.sortInfo = {field: name, direction: dir};
        this.hasMultiSort = false;

        if (this.remoteSort) {
            if (!this.load(this.lastOptions)) {
                if (sortToggle) {
                    this.sortToggle[name] = sortToggle;
                }
                if (sortInfo) {
                    this.sortInfo = sortInfo;
                }
            }
        } else {
            this.applySort();
            this.fireEvent('datachanged', this);
        }
        return true;
    },

    /**
     * Sorts the contents of this store by multiple field/direction sorters. This is called internally by {@link sort}
     * and would not usually be called manually.
     * Multi sorting only currently applies to local datasets - multiple sort data is not currently sent to a proxy
     * if remoteSort is used.
     * @param {Array} sorters Array of sorter objects (field and direction)
     * @param {String} direction Overall direction to sort the ordered results by (defaults to "ASC")
     */
    multiSort: function(sorters, direction) {
        this.hasMultiSort = true;
        direction = direction || "ASC";

        //toggle sort direction
        if (this.multiSortInfo && direction == this.multiSortInfo.direction) {
            direction = direction.toggle("ASC", "DESC");
        }

        /**
         * Object containing overall sort direction and an ordered array of sorter configs used when sorting on multiple fields
         * @property multiSortInfo
         * @type Object
         */
        this.multiSortInfo = {
            sorters  : sorters,
            direction: direction
        };

        if (this.remoteSort) {
            this.singleSort(sorters[0].field, sorters[0].direction);

        } else {
            this.applySort();
            this.fireEvent('datachanged', this);
        }
    },

    /**
     * Calls the specified function for each of the {@link Ext.data.Record Records} in the cache.
     * @param {Function} fn The function to call. The {@link Ext.data.Record Record} is passed as the first parameter.
     * Returning <tt>false</tt> aborts and exits the iteration.
     * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the function is executed.
     * Defaults to the current {@link Ext.data.Record Record} in the iteration.
     */
    each : function(fn, scope){
        this.data.each(fn, scope);
    },

    /**
     * Gets all {@link Ext.data.Record records} modified since the last commit.  Modified records are
     * persisted across load operations (e.g., during paging). <b>Note</b>: deleted records are not
     * included.  See also <tt>{@link #pruneModifiedRecords}</tt> and
     * {@link Ext.data.Record}<tt>{@link Ext.data.Record#markDirty markDirty}.</tt>.
     * @return {Ext.data.Record[]} An array of {@link Ext.data.Record Records} containing outstanding
     * modifications.  To obtain modified fields within a modified record see
     *{@link Ext.data.Record}<tt>{@link Ext.data.Record#modified modified}.</tt>.
     */
    getModifiedRecords : function(){
        return this.modified;
    },

    /**
     * Sums the value of <tt>property</tt> for each {@link Ext.data.Record record} between <tt>start</tt>
     * and <tt>end</tt> and returns the result.
     * @param {String} property A field in each record
     * @param {Number} start (optional) The record index to start at (defaults to <tt>0</tt>)
     * @param {Number} end (optional) The last record index to include (defaults to length - 1)
     * @return {Number} The sum
     */
    sum : function(property, start, end){
        var rs = this.data.items, v = 0;
        start = start || 0;
        end = (end || end === 0) ? end : rs.length-1;

        for(var i = start; i <= end; i++){
            v += (rs[i].data[property] || 0);
        }
        return v;
    },

    /**
     * @private
     * Returns a filter function used to test a the given property's value. Defers most of the work to
     * Ext.util.MixedCollection's createValueMatcher function
     * @param {String} property The property to create the filter function for
     * @param {String/RegExp} value The string/regex to compare the property value to
     * @param {Boolean} anyMatch True if we don't care if the filter value is not the full value (defaults to false)
     * @param {Boolean} caseSensitive True to create a case-sensitive regex (defaults to false)
     * @param {Boolean} exactMatch True to force exact match (^ and $ characters added to the regex). Defaults to false. Ignored if anyMatch is true.
     */
    createFilterFn : function(property, value, anyMatch, caseSensitive, exactMatch){
        if(Ext.isEmpty(value, false)){
            return false;
        }
        value = this.data.createValueMatcher(value, anyMatch, caseSensitive, exactMatch);
        return function(r) {
            return value.test(r.data[property]);
        };
    },

    /**
     * @private
     * Given an array of filter functions (each with optional scope), constructs and returns a single function that returns
     * the result of all of the filters ANDed together
     * @param {Array} filters The array of filter objects (each object should contain an 'fn' and optional scope)
     * @return {Function} The multiple filter function
     */
    createMultipleFilterFn: function(filters) {
        return function(record) {
            var isMatch = true;

            for (var i=0, j = filters.length; i < j; i++) {
                var filter = filters[i],
                    fn     = filter.fn,
                    scope  = filter.scope;

                isMatch = isMatch && fn.call(scope, record);
            }

            return isMatch;
        };
    },

    /**
     * Filter the {@link Ext.data.Record records} by a specified property. Alternatively, pass an array of filter
     * options to filter by more than one property.
     * Single filter example:
     * store.filter('name', 'Ed', true, true); //finds all records containing the substring 'Ed'
     * Multiple filter example:
     * <pre><code>
     * store.filter([
     *   {
     *     property     : 'name',
     *     value        : 'Ed',
     *     anyMatch     : true, //optional, defaults to true
     *     caseSensitive: true  //optional, defaults to true
     *   },
     *
     *   //filter functions can also be passed
     *   {
     *     fn   : function(record) {
     *       return record.get('age') == 24
     *     },
     *     scope: this
     *   }
     * ]);
     * </code></pre>
     * @param {String|Array} field A field on your records, or an array containing multiple filter options
     * @param {String/RegExp} value Either a string that the field should begin with, or a RegExp to test
     * against the field.
     * @param {Boolean} anyMatch (optional) <tt>true</tt> to match any part not just the beginning
     * @param {Boolean} caseSensitive (optional) <tt>true</tt> for case sensitive comparison
     * @param {Boolean} exactMatch (optional) True to force exact match (^ and $ characters added to the regex). Defaults to false. Ignored if anyMatch is true.
     */
    filter : function(property, value, anyMatch, caseSensitive, exactMatch){
        var fn;
        //we can accept an array of filter objects, or a single filter object - normalize them here
        if (Ext.isObject(property)) {
            property = [property];
        }

        if (Ext.isArray(property)) {
            var filters = [];

            //normalize the filters passed into an array of filter functions
            for (var i=0, j = property.length; i < j; i++) {
                var filter = property[i],
                    func   = filter.fn,
                    scope  = filter.scope || this;

                //if we weren't given a filter function, construct one now
                if (!Ext.isFunction(func)) {
                    func = this.createFilterFn(filter.property, filter.value, filter.anyMatch, filter.caseSensitive, filter.exactMatch);
                }

                filters.push({fn: func, scope: scope});
            }

            fn = this.createMultipleFilterFn(filters);
        } else {
            //classic single property filter
            fn = this.createFilterFn(property, value, anyMatch, caseSensitive, exactMatch);
        }

        return fn ? this.filterBy(fn) : this.clearFilter();
    },

    /**
     * Filter by a function. The specified function will be called for each
     * Record in this Store. If the function returns <tt>true</tt> the Record is included,
     * otherwise it is filtered out.
     * @param {Function} fn The function to be called. It will be passed the following parameters:<ul>
     * <li><b>record</b> : Ext.data.Record<p class="sub-desc">The {@link Ext.data.Record record}
     * to test for filtering. Access field values using {@link Ext.data.Record#get}.</p></li>
     * <li><b>id</b> : Object<p class="sub-desc">The ID of the Record passed.</p></li>
     * </ul>
     * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the function is executed. Defaults to this Store.
     */
    filterBy : function(fn, scope){
        this.snapshot = this.snapshot || this.data;
        this.data = this.queryBy(fn, scope || this);
        this.fireEvent('datachanged', this);
    },

    /**
     * Revert to a view of the Record cache with no filtering applied.
     * @param {Boolean} suppressEvent If <tt>true</tt> the filter is cleared silently without firing the
     * {@link #datachanged} event.
     */
    clearFilter : function(suppressEvent){
        if(this.isFiltered()){
            this.data = this.snapshot;
            delete this.snapshot;
            if(suppressEvent !== true){
                this.fireEvent('datachanged', this);
            }
        }
    },

    /**
     * Returns true if this store is currently filtered
     * @return {Boolean}
     */
    isFiltered : function(){
        return !!this.snapshot && this.snapshot != this.data;
    },

    /**
     * Query the records by a specified property.
     * @param {String} field A field on your records
     * @param {String/RegExp} value Either a string that the field
     * should begin with, or a RegExp to test against the field.
     * @param {Boolean} anyMatch (optional) True to match any part not just the beginning
     * @param {Boolean} caseSensitive (optional) True for case sensitive comparison
     * @return {MixedCollection} Returns an Ext.util.MixedCollection of the matched records
     */
    query : function(property, value, anyMatch, caseSensitive){
        var fn = this.createFilterFn(property, value, anyMatch, caseSensitive);
        return fn ? this.queryBy(fn) : this.data.clone();
    },

    /**
     * Query the cached records in this Store using a filtering function. The specified function
     * will be called with each record in this Store. If the function returns <tt>true</tt> the record is
     * included in the results.
     * @param {Function} fn The function to be called. It will be passed the following parameters:<ul>
     * <li><b>record</b> : Ext.data.Record<p class="sub-desc">The {@link Ext.data.Record record}
     * to test for filtering. Access field values using {@link Ext.data.Record#get}.</p></li>
     * <li><b>id</b> : Object<p class="sub-desc">The ID of the Record passed.</p></li>
     * </ul>
     * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the function is executed. Defaults to this Store.
     * @return {MixedCollection} Returns an Ext.util.MixedCollection of the matched records
     **/
    queryBy : function(fn, scope){
        var data = this.snapshot || this.data;
        return data.filterBy(fn, scope||this);
    },

    /**
     * Finds the index of the first matching Record in this store by a specific field value.
     * @param {String} fieldName The name of the Record field to test.
     * @param {String/RegExp} value Either a string that the field value
     * should begin with, or a RegExp to test against the field.
     * @param {Number} startIndex (optional) The index to start searching at
     * @param {Boolean} anyMatch (optional) True to match any part of the string, not just the beginning
     * @param {Boolean} caseSensitive (optional) True for case sensitive comparison
     * @return {Number} The matched index or -1
     */
    find : function(property, value, start, anyMatch, caseSensitive){
        var fn = this.createFilterFn(property, value, anyMatch, caseSensitive);
        return fn ? this.data.findIndexBy(fn, null, start) : -1;
    },

    /**
     * Finds the index of the first matching Record in this store by a specific field value.
     * @param {String} fieldName The name of the Record field to test.
     * @param {Mixed} value The value to match the field against.
     * @param {Number} startIndex (optional) The index to start searching at
     * @return {Number} The matched index or -1
     */
    findExact: function(property, value, start){
        return this.data.findIndexBy(function(rec){
            return rec.get(property) === value;
        }, this, start);
    },

    /**
     * Find the index of the first matching Record in this Store by a function.
     * If the function returns <tt>true</tt> it is considered a match.
     * @param {Function} fn The function to be called. It will be passed the following parameters:<ul>
     * <li><b>record</b> : Ext.data.Record<p class="sub-desc">The {@link Ext.data.Record record}
     * to test for filtering. Access field values using {@link Ext.data.Record#get}.</p></li>
     * <li><b>id</b> : Object<p class="sub-desc">The ID of the Record passed.</p></li>
     * </ul>
     * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the function is executed. Defaults to this Store.
     * @param {Number} startIndex (optional) The index to start searching at
     * @return {Number} The matched index or -1
     */
    findBy : function(fn, scope, start){
        return this.data.findIndexBy(fn, scope, start);
    },

    /**
     * Collects unique values for a particular dataIndex from this store.
     * @param {String} dataIndex The property to collect
     * @param {Boolean} allowNull (optional) Pass true to allow null, undefined or empty string values
     * @param {Boolean} bypassFilter (optional) Pass true to collect from all records, even ones which are filtered
     * @return {Array} An array of the unique values
     **/
    collect : function(dataIndex, allowNull, bypassFilter){
        var d = (bypassFilter === true && this.snapshot) ?
                this.snapshot.items : this.data.items;
        var v, sv, r = [], l = {};
        for(var i = 0, len = d.length; i < len; i++){
            v = d[i].data[dataIndex];
            sv = String(v);
            if((allowNull || !Ext.isEmpty(v)) && !l[sv]){
                l[sv] = true;
                r[r.length] = v;
            }
        }
        return r;
    },

    // private
    afterEdit : function(record){
        if(this.modified.indexOf(record) == -1){
            this.modified.push(record);
        }
        this.fireEvent('update', this, record, Ext.data.Record.EDIT);
    },

    // private
    afterReject : function(record){
        this.modified.remove(record);
        this.fireEvent('update', this, record, Ext.data.Record.REJECT);
    },

    // private
    afterCommit : function(record){
        this.modified.remove(record);
        this.fireEvent('update', this, record, Ext.data.Record.COMMIT);
    },

    /**
     * Commit all Records with {@link #getModifiedRecords outstanding changes}. To handle updates for changes,
     * subscribe to the Store's {@link #update update event}, and perform updating when the third parameter is
     * Ext.data.Record.COMMIT.
     */
    commitChanges : function(){
        var modified = this.modified.slice(0),
            length   = modified.length,
            i;

        for (i = 0; i < length; i++){
            modified[i].commit();
        }

        this.modified = [];
        this.removed  = [];
    },

    /**
     * {@link Ext.data.Record#reject Reject} outstanding changes on all {@link #getModifiedRecords modified records}.
     */
    rejectChanges : function() {
        var modified = this.modified.slice(0),
            removed  = this.removed.slice(0).reverse(),
            mLength  = modified.length,
            rLength  = removed.length,
            i;

        for (i = 0; i < mLength; i++) {
            modified[i].reject();
        }

        for (i = 0; i < rLength; i++) {
            this.insert(removed[i].lastIndex || 0, removed[i]);
            removed[i].reject();
        }

        this.modified = [];
        this.removed  = [];
    },

    // private
    onMetaChange : function(meta){
        this.recordType = this.reader.recordType;
        this.fields = this.recordType.prototype.fields;
        delete this.snapshot;
        if(this.reader.meta.sortInfo){
            this.sortInfo = this.reader.meta.sortInfo;
        }else if(this.sortInfo  && !this.fields.get(this.sortInfo.field)){
            delete this.sortInfo;
        }
        if(this.writer){
            this.writer.meta = this.reader.meta;
        }
        this.modified = [];
        this.fireEvent('metachange', this, this.reader.meta);
    },

    // private
    findInsertIndex : function(record){
        this.suspendEvents();
        var data = this.data.clone();
        this.data.add(record);
        this.applySort();
        var index = this.data.indexOf(record);
        this.data = data;
        this.resumeEvents();
        return index;
    },

    /**
     * Set the value for a property name in this store's {@link #baseParams}.  Usage:</p><pre><code>
myStore.setBaseParam('foo', {bar:3});
</code></pre>
     * @param {String} name Name of the property to assign
     * @param {Mixed} value Value to assign the <tt>name</tt>d property
     **/
    setBaseParam : function (name, value){
        this.baseParams = this.baseParams || {};
        this.baseParams[name] = value;
    }
});
