import './components/left_menu';
import MainPanel from './components/main_panel';
import IntroductionPanel from './components/introduction_panel';
import './components/search_field';
import './static/css/main.styl';

Ext.onReady(function () {
    Ext.QuickTips.init();
    Ext.lib.Ajax.defaultPostHeader += ";charset=utf-8";

    // 1、创建head部分
    var head = new Ext.Panel({
        region: 'north',
        border: false,
        html: '<div class="main-header">源码文档</div>',
        height: 45
    });

    // 2、创建foot部分
    var foot = new Ext.Panel({
        region: 'south',
        html: '',
        height: 0
    });

    var t1 = new Ext.tree.TreePanel({
        border: false,
        rootVisible: false,
        root: new Ext.tree.AsyncTreeNode({
            expanded: true,
            children: JSON.parse(JSON.stringify(window.ALL_INFO))
        })
    });


    // 3、创建leftMenu部分
    var leftmenu = new Morik.Office.LeftMenu({
        trees: [t1]
    });

    // 4、创建主内容部分
    var mainTab = new MainPanel({
        autoScroll: true,
        region: 'center',
        deferredRender: false,
        activeTab: 0,
        resizeTabs: true,
        inTabWidth: 100,
        tabWidth: 90,
        enableTabScroll: true,
        items: [
            new IntroductionPanel()
        ]
    });

    // 5、建立leftmenu和mainTab两者之间的关系
    leftmenu.on("nodeClick", function (nodeAttr) {
        mainTab.loadTab(nodeAttr);
    });

    // 6、创建布局
    var viewport = new Ext.Viewport({
        layout: 'border',
        items: [head, foot, {
            region: 'west',
            split: true,
            width: 200,
            collapsible: true,
            margins: '3 0 3 3',
            cmargins: '3 3 3 3',
            xtype: 'panel',
            layoutConfig: {
                animate: true
            },
            defaults: {
                border: false
            },
            items: [
                {
                    xtype: 'container',
                    cls: 'search-textfield',
                    items: [
                        new Ext.ux.form.SearchField({
                            width: 180,
                            onTrigger2Click: function () {
                                var v = this.getRawValue();
                                let newData = [];

                                for (let i = 0; i < window.ALL_INFO.length; i++) {
                                    let current = window.ALL_INFO[i];
                                    if (JSON.stringify(current).indexOf(v) > -1) {
                                        newData.push(current)
                                    }
                                }
                                t1.setRootNode(
                                    new Ext.tree.AsyncTreeNode({
                                        expanded: true,
                                        children: []
                                    }))
                                ;
                            }
                        })
                    ]
                },
                leftmenu
            ]
        }, mainTab]
    });

});
