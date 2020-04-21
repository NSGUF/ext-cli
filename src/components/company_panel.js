Morik.Office.CompanyPanel = Ext.extend(Ext.grid.GridPanel, {
    defaultSortable: true,
    defaultWidth: 180,
    width: 660,
    height: 400,
    loadMask: {msg: '正在载入数据,请稍等...'},
    title: '公司列表',

    initComponent() {
        this.createItems();
        this.createStore();
        this.createBbar();
        this.createTbar();

        Morik.Office.CompanyPanel.superclass.initComponent.call(this);
    },

    createItems() {
        this.sm = new Ext.grid.CheckboxSelectionModel();
        this.columns = [this.sm, {
            header: '编号',
            dataIndex: 'comNum'
        }, {
            header: '名称',
            dataIndex: 'comName'
        }, {
            header: '公司地址',
            width: 300,
            dataIndex: 'comAddress'
        }]
    },

    createBbar() {
        this.bbar = new Ext.PagingToolbar({
            pageSize: 10,
            store: this.store,
            displayInfo: true,
            displayMsg: '共有 {2}，当前显示 {0} - {1}条',
            emptyMsg: "没有数据"
        });
    },

    createTbar() {
        this.tbar = new Ext.Toolbar({
            items: [
                {
                    text: '刷新',
                    iconCls: 'add',
                    handler: () => {
                        this.store.reload();
                    }
                },
                '-',
                {
                    text: '添加',
                    actionName: 'add'
                },
                {
                    text: '删除',
                    handler: (...arg) => {
                        console.log(arg);
                    }
                }
            ]
        })
    },

    createStore () {
        this.store = new Ext.data.JsonStore({
            autoLoad: true,
            url: '/api/company',
            root: 'rows',
            method: 'GET',
            restful: true,
            idProperty: 'comNum',
            fields: ['comNum', 'comName', 'comAddress']
        });
    }

});

