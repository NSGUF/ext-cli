
let IntroductionPanel = Ext.extend(Ext.Panel, {
    title: '简介',
    autoScroll: true,

    initComponent() {
        this.createItems();
        IntroductionPanel.superclass.initComponent.call(this);
    },

    createItems() {
        this.items = [
            {
                xtype: 'box',
                html: '将源码自动生成文档'
            },
        ]
    }
});

export default IntroductionPanel;
