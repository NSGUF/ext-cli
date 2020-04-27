import * as CodeMirror from 'codemirror/lib/codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/monokai.css'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/keymap/sublime.js'

import './container_panel.styl';

let ContainerPanel = Ext.extend(Ext.Panel, {
    title: '整理中',
    autoScroll: true,
    cls: 'container-panel',

    initComponent() {
        this.createItems();
        ContainerPanel.superclass.initComponent.call(this);
    },

    createItems() {
        this.textId = Ext.id('editor');
        this.items = [
            this.container = new Ext.BoxComponent({
                data: {
                    "className": "-",
                    "father": "-",
                    "notes": "-"
                },
                tpl: new Ext.Template(
                    '<div class="container-panel-title">类：{className}</div>' +
                    '<div class="container-panel-little-title">继承自于：{father}</div>' +
                    '<div class="container-panel-notes">{notes}</div>', {
                        getParams: function (params) {
                            debugger;
                            return params.join('、');
                        }
                    }
                )
            }),
            {
                xtype: 'box',
                html: '<div class="container-panel-little-title">配置项：</div>'
            },
            this.configs = new Ext.BoxComponent({
                cls: 'container-panel-info-box'
            }),
            {
                xtype: 'box',
                html: '<div class="container-panel-little-title">公共方法：</div>'
            },
            this.publicMethods = new Ext.BoxComponent({
                cls: 'container-panel-info-box'
            }),
            {
                xtype: 'box',
                html: '<div class="container-panel-little-title">事件：</div>'
            },
            this.publicEvents = new Ext.BoxComponent({
                cls: 'container-panel-info-box'
            }),
            {
                xtype: 'container',
                layout: {
                    type: 'hbox',
                    algin: 'stretch'
                },
                items: [
                    {
                        xtype: 'container',
                        flex: 1,
                        cls: 'container-panel-box',
                        items: [{
                            xtype: 'container',
                            cls: 'source-title',
                            layout: {
                                type: 'hbox',
                                algin: 'stretch'
                            },
                            items:  [
                                {
                                    xtype: 'box',
                                    cls: 'source-title-name',
                                    html: '源代码如下：'
                                }, new Ext.Button({
                                    text: '点击运行',
                                    cls: 'run-btn',
                                    margins: '0 0 0 16',
                                    handler: () => {
                                        let text = this.codeMirrorEditor.getValue();

                                        try {
                                            let textCom = eval(text);
                                            if (textCom) {
                                                this.comResult.removeAll();
                                                this.comResult.add(textCom);
                                                this.comResult.doLayout();
                                            }
                                        } catch (e) {
                                            debugger;
                                        }
                                    },
                                    scope: this
                                })
                            ]
                        }, {
                            xtype: 'box',
                            layout: {
                                type: 'hbox',
                                algin: 'stretch'
                            },
                            html: '<textarea class="form-control-editor" id="' + this.textId + '" name="code"></textarea>'
                        }]
                    },
                    {
                        xtype: 'container',
                        flex: 1,
                        cls: 'container-panel-box',
                        items: [
                            {
                                xtype: 'box',
                                html: '运行结果',
                                cls: 'source-title'
                            },
                            this.comResult = new Ext.Container()
                        ]
                    }
                ]
            }
        ]
    },

    onLayout() {
        ContainerPanel.superclass.onLayout.call(this);
        let myTextarea = document.getElementById(this.textId);
        if (myTextarea && !this.codeMirrorEditor) {
            this.codeMirrorEditor = this.codeMirrorEditor || CodeMirror.fromTextArea(myTextarea, {
                mode: 'javascript',//编辑器语言
                theme: 'monokai', //编辑器主题
                extraKeys: {"Ctrl": "autocomplete"},//ctrl可以弹出选择项
                lineNumbers: true//显示行号
            });
        }
    },

    updateConfig (desc) {
        let html = '';
        for(let i = 0; i < desc.configs.length; i++) {
            let value = desc.configs[i];
            html += `<div class="">配置名：<span class="config-name">${value.name}</span></div>
                <div class="container-panel-config-def">默认值：${value.defaultValue}</div>
                <div class="container-panel-notes">${value.description || '-'}</div>`;
        }
        this.configs.update(html);
    },

    updatePublicMethods (desc) {
        let html = '';
        for(let i = 0; i < desc.publicMethods.length; i++) {
            let value = desc.publicMethods[i];
            html += `<div class="">方法名：<span class="config-name">${value.name}</span></div>
                <div class="container-panel-config-def">参数：${value.params.join('、') || '-'}</div>
                <div class="container-panel-notes">${value.description || '-'}</div>`;
        }
        this.publicMethods.update(html);
    },

    updatePublicEvents (desc) {
        let html = '';
        for(let i = 0; i < desc.publicEvents.length; i++) {
            let value = desc.publicEvents[i];
            html += `<div class="">事件名：<span class="config-name">${value.name}</span></div>
                <div class="container-panel-notes">${value.description || '-'}</div>`;
        }
        this.publicEvents.update(html);
    },

    updateInfo (desc) {
        this.codeMirrorEditor.setValue(desc.example || '');
        this.updateConfig(desc);
        this.updatePublicMethods(desc);
        this.updatePublicEvents(desc);
    },

    /**
     * 更新界面数据
     * @param desc
     */
    setJsonValue(desc) {
        if (this.container.rendered) {
            this.container.update(desc);
        } else {
            this.container.data = desc;
        }
    },
});
export default ContainerPanel;
