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
        this.createItems()
        ContainerPanel.superclass.initComponent.call(this);
    },

    createItems() {
        this.textId = Ext.id('editor');
        this.items = [
            this.container = new Ext.Container({
                data: {
                    "className": "-",
                    "father": "-",
                    "notes": "-",
                    "configs": [{"name": "-", "description": "-", "defaultValue": "-"}],
                    "publicMethods": [{"name": "-", "description": "-", "params": ["-"]}],
                    "publicEvents": [{
                        "name": "",
                        "description": ""
                    }]
                },
                tpl: new Ext.Template(
                    '<div class="container-panel-title">类：{className}</div>' +
                    '<div class="container-panel-little-title">继承自于：{father}</div>' +
                    '<div class="container-panel-little-title">描述：</div>' +
                    '<div class="container-panel-notes">{notes}</div>' +
                    '<div class="container-panel-little-title">配置项：</div>' +
                    '<tpl for="configs">' +
                    '<div class="container-panel-config-name">{[values.name]}</div>' +
                    '<div class="container-panel-config-def">默认值：{defaultValue}</div>' +
                    '<div class="container-panel-notes">描述：{description}</div>' +
                    '</tpl>' +
                    '<div class="container-panel-little-title">公共方法：</div>' +
                    '<tpl for="publicMethods">' +
                    '<div class="container-panel-name">{name}</div>' +
                    '<div class="container-panel-config-def">参数：{:this.getParams(params)}</div>' +
                    '<div class="container-panel-notes">描述：{description}</div>' +
                    '</tpl>' +
                    '<div class="container-panel-little-title">事件：</div>' +
                    '<tpl for="publicEvents">' +
                    '<div class="container-panel-name">{name}</div>' +
                    '<div class="container-panel-notes">描述：{description}</div>' +
                    '</tpl>', {
                        getParams: function (params) {
                            return params.join('、');
                        }
                    }
                )
            }),
            {
                xtype: 'container',
                cls: 'container-panel-box',
                items: [
                    new Ext.Button({
                        text: '运行',
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
                    }), {
                        xtype: 'container',
                        layout: {
                            type: 'hbox',

                        },
                        items: [
                            {
                                xtype: 'box',
                                width: 500,
                                height: 500,
                                html: '<textarea class="form-control-editor" id="' + this.textId + '" name="code"></textarea>'
                            },
                            {
                                xtype: 'container',
                                items: [
                                    this.comResult = new Ext.Container()
                                ]
                            }
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
            this.codeMirrorEditor = CodeMirror.fromTextArea(myTextarea, {
                mode: 'javascript',//编辑器语言
                theme: 'monokai', //编辑器主题
                extraKeys: {"Ctrl": "autocomplete"},//ctrl可以弹出选择项
                lineNumbers: true//显示行号
            });


            this.codeMirrorEditor.setValue(this.exampleText);
        }
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
        this.exampleText = desc.example;
    },
});
export default ContainerPanel;
