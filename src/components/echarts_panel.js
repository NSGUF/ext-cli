const echarts = require('echarts');
const weatherIcons = {
    'Sunny': '/images/test.gif',
};

Morik.Office.EchartsPanel = Ext.extend(Ext.Panel, {
    title: 'echarts示例',
    autoScroll: true,
    initComponent() {
        this.createItems()
        Morik.Office.EchartsPanel.superclass.initComponent.call(this);
    },

    createItems() {
        this.items = [
            {
                xtype: 'box',
                html: '<div id="chartExample1" style="width:800px;height:400px"></div>'
            },
            {
                xtype: 'box',
                html: '<div id="chartExample2" style="width:800px;height:400px"></div>'
            },
            {
                xtype: 'box',
                html: '<div id="chartExample3" style="width:800px;height:400px"></div>'
            },
            {
                xtype: 'box',
                html: '<div id="chartExample4" style="width:800px;height:400px"></div>'
            },
        ]
    },

    createChart1() {
        const chartExample = echarts.init(document.getElementById('chartExample1'));
        var data = [50, 100, 91, 34, 90, 30, 20];
        var markArr = [], temObj = null;
        data.forEach(function (v, i) {
            if (v > 50) {
                temObj = {
                    value: v,
                    xAxis: i,
                    yAxis: v,
                    itemStyle: {
                        color: '#FF0B00'
                    }
                }
            } else {
                temObj = {
                    value: v,
                    xAxis: i,
                    yAxis: v
                }
            }
            markArr.push(temObj)
        });
        option = {
            xAxis: {
                type: 'category',
                data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            },
            yAxis: {
                type: 'value'
            },
            series: [{
                data: data,
                type: 'line',
                smooth: true,
                markPoint: {
                    itemStyle: {
                        color: '#00CD68'
                    },
                    data: markArr
                },
            }]
        };

        chartExample.setOption(option);

    },
    createChart4() {
        const chartExample = echarts.init(document.getElementById('chartExample4'));
        var data = [50, 100, 91, 34, 90, 30, 20];
        var markArr = [], temObj = null;
        data.forEach(function (v, i) {
            if (v > 50) {
                temObj = {
                    value: v,
                    xAxis: i,
                    yAxis: v,
                    itemStyle: {
                        color: '#FF0B00'
                    }
                }
            } else {
                temObj = {
                    value: v,
                    xAxis: i,
                    yAxis: v
                }
            }
            markArr.push(temObj)
        });
        option = {
            xAxis: {
                type: 'category',
                data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            },
            yAxis: {
                type: 'value'
            },
            series: [{
                data: data,
                type: 'line',
                smooth: true,
                markPoint: {
                    itemStyle: {
                        color: '#00CD68'
                    },
                    data: markArr
                },
            }]
        };

        chartExample.setOption(option);

    },

    onLayout() {
        Morik.Office.EchartsPanel.superclass.onLayout.call(this);

        this.createChart1();
        this.createChart4();
    },
});

