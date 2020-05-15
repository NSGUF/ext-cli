
/* 整体描述 */
Example = Ext.extend(Ext.util.Observable, {
    /* 属性描述 */
    writer : undefined,
    /* 属性描述 */
    remoteSort : false,


    constructor : function(config){

        this.addEvents (
            /* 事件描述 */
            'datachanged',
            /* 事件描述 */
            'metachange'
        );
    },

    /* 方法描述 */
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
        alert('test');
    }
});
