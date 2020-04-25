/**
 * 该文件用于获取所有界面的数据，包括左树和对应右侧的数据；
 */
const fs = require('fs');

/**
 * 删除注释中的*号和注释符号
 * @param str
 * @returns {string}
 */
const clearNotes = (str) => {
    str = str.replace(/\/\*/g, ''); // 替换/*
    str = str.replace(/\*\//g, ''); // 替换*/
    str = str.replace(/\*/g, ''); // 替换*
    str = str.replace(/\\n/g, '<br/>'); // 替换*
    str = str.replace(/\\r\\n/g, '<br/>'); // 替换*

    return str;
};

/**
 * 获取最上面的描述，如果去空格后一/*开头，则找对应的结尾，可能有多个描述，所以要循环
 */
const getNotes = function (data, isBottom) {
    let notes = '';
    data = data.trim();
    if (isBottom) {
        while (data.endsWith('*/')) {
            let start = data.lastIndexOf('/*');
            let temp =  data.slice(start).trim();
            temp = clearNotes(temp);
            notes += temp.trim() + '<br/>';
            data = data.slice(0, start).trim();
        }

    } else {
        while (data.startsWith('/*')) {
            const end = data.indexOf('*/');
            let temp =  data.slice(0, end + 2).trim();
            temp = clearNotes(temp);
            notes += temp.trim() + '<br/>';
            data = data.slice(end + 2).trim();
        }
    }

    return {
        notes,
        surplusData: data
    };
};

/**
 * 获取设置的类名
 */
const getClassName = function (data) {
    const end = data.indexOf('=');
    const className = data.slice(0, end).trim();
    data = data.slice(end + 1);

    return {
        className,
        surplusData: data
    }
};

/**
 * 获取父类
 */
const getFather = function (data) {
    let start = data.indexOf('Ext.extend');
    data = data.slice(start);
    start = data.indexOf('(');
    const end = data.indexOf(',');
    let father = data.slice(start + 1, end);
    data = data.slice(end + 1).trim();
    return {
        father,
        surplusData: data
    };
};

/**
 * 获取所有的配置项
 * @param data
 * @returns {{configs: Array}}
 */
const getConfigs = function (data) {
    const configs = [];
    let end = data.indexOf('function');
    data = data.replace('{', ''); // 删除第一个{
    data = data.slice(1, end);
    end = data.lastIndexOf(',');
    data = data.slice(0, end + 1);

    while (data) {
        let temp = getNotes(data);
        let description = temp.notes;
        data = temp.surplusData;

        end = data.indexOf(',');
        let param = data.slice(0, end).trim();
        let paramArr = param.split(':');
        let name = paramArr[0].trim();
        let defaultValue = paramArr[1].trim();
        configs.push({
            name,
            description,
            defaultValue
        });
        data = data.slice(end + 1).trim();
    }

    return {
        configs
    }
};

/**
 * 获取所有的方法
 *
 *         {
 *             name: 'url',
 *             params: [
 *                 ''
 *             ]
 *             description: ''
 *         }
 */
const getPublicMethods = function (data) {
    let publicMethods = [];
    let dataArr = data.split('function');


    for (let i = 0; i < dataArr.length - 1; i++) {
        let currentData = dataArr[i].trim();
        currentData = currentData.slice(0, currentData.length - 1).trim();
        let end = currentData.lastIndexOf(' ');
        let name = currentData.slice(end).trim();

        if (name === 'constructor') {
            continue;
        }

        let description = getNotes(currentData.slice(0, end), true).notes;
        let nextData = dataArr[i + 1].trim();
        let start = nextData.indexOf('(');
        end = nextData.indexOf(')');
        nextData = nextData.slice(start + 1, end);
        let params = nextData.split(',');
        params = params.map(item => {
            return item.trim()
        });

        publicMethods.push({
            name,
            description,
            params
        })
    }

    return {
        publicMethods
    }
};

/**
 * 获取所有的事件
 * @param data
 * @returns {{publicEvents: Array}}
 */
const getPublicEvents = function (data) {
    let publicEvents = [];
    let start, end;
    start = data.indexOf('this.addEvents');
    data = data.slice(start).trim();
    data = data.replace('this.addEvents', '').trim();
    data = data.slice(1); // 去除空格后的第一个是 (
    while (data) {
        let temp = getNotes(data);
        let description = temp.notes;
        data = temp.surplusData;

        end = data.indexOf(',');

        let last = data.indexOf(')');
        let isEnd = end === -1 || end > last;
        let param = data.slice(0, isEnd ? last : end).trim();

        let name = param.replace(/'/g, '');

        data = isEnd ? '' : data.slice(end + 1);
        publicEvents.push({
            name,
            description
        })
    }

    return {
        publicEvents
    }
};

/**
 * {
 *     className: '类名',
 *     fileName：'定义的文件',
 *     father：'继承自于',
 *     notes: '描述',
 *     configs: [
 *         {
 *             name: 'url',
 *             description: '',
 *             defaultValue: '',
 *         }
 *     ],
 *     publicMethods: [
 *         {
 *             name: 'url',
 *             params: [
 *                 ''
 *             ]
 *             description: ''
 *         }
 *     ],
 *     publicEvents: [
 *         {
 *             name: 'url',
 *             description: ''
 *         }
 *     ]
 * }
 * @param data
 * @returns {{notes: string, father, publicEvents, publicProperties}}
 */
const getDescriptions = function (data) {
    let className, father, notes, configs, publicMethods, publicEvents, temp, example;
    let startExample = data.indexOf(':EXAM');
    example = data.slice(startExample + 5);

    data = data.slice(0, startExample);
    temp = getNotes(data);
    notes = temp.notes;
    surplusData = temp.surplusData;

    temp = getClassName(surplusData);
    className = temp.className;
    surplusData = temp.surplusData;

    temp = getFather(surplusData);
    father = temp.father;
    surplusData = temp.surplusData;

    temp = getConfigs(surplusData);
    configs = temp.configs;

    temp = getPublicMethods(surplusData);
    publicMethods = temp.publicMethods;

    temp = getPublicEvents(data);
    publicEvents = temp.publicEvents;

    return {
        className,
        father,
        notes,
        configs,
        publicMethods,
        publicEvents,
        example
    };
};

const getLeftTree = function (currentPath) {
    const filesList = [];
    const files = fs.readdirSync(currentPath);
    files.forEach((fileName) => {
        const stat = fs.statSync(currentPath + fileName);
        if (stat.isDirectory()) {
            filesList.push({
                text: fileName,
                leaf: false,
                children: getLeftTree(currentPath + fileName + '/', filesList),
            });
        } else {
            const data = fs.readFileSync(currentPath + fileName);
            const descriptions = getDescriptions(data.toString());
            const obj = {
                text: fileName,
                fileName,
                leaf: true,
                descriptions,
            };
            filesList.push(obj);
        }
    });
    return filesList;
};

module.exports = {
    getLeftTree
};
