import ContainerPanel from './container_panel';

const MainPanel = Ext.extend(Ext.TabPanel, {

    loadTab: function (node) {
        var n = this.getComponent(node.id);
        if (n) {
            this.setActiveTab(n);
        } else {
            var opt = {
                'id': node.id,
                'title': node.text,
                closable: true
            };
            var pn = new ContainerPanel(opt);
            n = this.add(pn);
            n.setJsonValue(node.descriptions);

            n.show().doLayout();
            n.updateInfo(node.descriptions);
        }
    }
});

export default MainPanel;
