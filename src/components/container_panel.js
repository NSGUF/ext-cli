import * as CodeMirror from 'codemirror/lib/codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/monokai.css'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/keymap/sublime.js'

Morik.Office.ContainerPanel = Ext.extend(Ext.Panel, {
    title: '整理中',
    autoScroll: true,
    cls: 'container-panel',

    initComponent() {
        this.createItems()
        Morik.Office.ContainerPanel.superclass.initComponent.call(this);
    },

    createItems() {
        this.textId = Ext.id('editor');
        this.items = [
            {
                xtype: 'box',
                cls: 'container-panel-box',
                html: '常用属性'
            },
            {
                xtype: 'box',
                cls: 'container-panel-box',
                html: '常用方法'
            },
            {
                xtype: 'box',
                cls: 'container-panel-box',
                html: '常用事件'
            },
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
        Morik.Office.ContainerPanel.superclass.onLayout.call(this);
        let myTextarea = document.getElementById(this.textId);
        if (myTextarea && !this.codeMirrorEditor) {
            this.codeMirrorEditor = CodeMirror.fromTextArea(myTextarea, {
                mode:'javascript',//编辑器语言
                theme:'monokai', //编辑器主题
                extraKeys: {"Ctrl": "autocomplete"},//ctrl可以弹出选择项
                lineNumbers: true//显示行号
            });

        }
    },

    /**
     * 更新界面数据
     * @param desc
     */
    setJsonValue (desc) {
        desc;
    },
});

