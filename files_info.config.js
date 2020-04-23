/**
 * 该文件用于获取所有界面的数据，包括左树和对应右侧的数据；
 */
const fs = require('fs');

/**
 * 获取最上面的描述
 * @param data
 * @returns {{notes: string, surplusData: string | *}}
 */
const getNotes = function (data) {
    let notes = '';
    data = data.trim();
    while (data.startsWith('/*')) {
        const end = data.indexOf('*/');
        let temp =  data.slice(0, end + 2).trim();
        temp = temp.replace(/\/\*/g, ''); // 替换/*
        temp = temp.replace(/\*\//g, ''); // 替换*/
        temp = temp.replace(/\*/g, ''); // 替换*

        notes += temp.trim() + '\n';
        data = data.slice(end + 2).trim();
    }

    return {
        notes,
        surplusData: data
    };
};

/**
 * 获取设置的类名
 * @param data
 * @returns {{surplusData: T[] | SharedArrayBuffer | BigUint64Array | Uint8ClampedArray | Uint32Array | Blob | Int16Array | T[] | Float64Array | Float32Array | string | Uint16Array | ArrayBuffer | Int32Array | BigInt64Array | Uint8Array | Int8Array | T[], className: string}}
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

const getConfigs = function (data) {
    const configs = [];
    let start, end = data.indexOf('function');
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
 *     publicProperties: [
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
    let className, father, notes, configs, publicProperties, publicEvents, temp;

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
    surplusData = temp.surplusData;

    temp = getPublicEvents(data);
    publicEvents = temp.publicEvents;

    return {
        className,
        father,
        notes,
        configs,
        publicProperties,
        publicEvents,
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
