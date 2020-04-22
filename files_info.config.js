/**
 * 该文件用于获取所有界面的数据，包括左树和对应右侧的数据；
 */
const fs = require('fs');
const getNotes = function (data) {
    const start = data.indexOf('/*');
    const end = data.indexOf('*/');

    return {
        notes: data.slice(start, end + 1).trim(),
    };
};

const getFather = function (data) {
    let start = data.indexOf('Ext.extend');
    data = data.slice(start);
    start = data.indexOf('(');
    const end = data.indexOf(',');
    data = data.slice(start + 1, end);
    return data.trim();
};

const getPublicProperties = function (data) {

};

const getPublicEvents = function (data) {

};
const getDescriptions = function (data) {
    const notes = getNotes(data);
    const father = getFather(data);
    const publicProperties = getPublicProperties(data);
    const publicEvents = getPublicEvents(data);

    return {
        notes,
        father,
        publicEvents,
        publicProperties,
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
