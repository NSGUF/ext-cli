var fs = require('fs');

const {getLeftTree} = require('./files_info.config');
const filesPath = getLeftTree(__dirname + '/src/source/');
const result = `window.ALL_INFO = ${JSON.stringify(filesPath)}`;

fs.writeFile('./dist/source/index.js',result,'utf8',function(err){
    //如果err=null，表示文件使用成功，否则，表示希尔文件失败
    if(err)
        console.log('写文件出错了，错误是：'+err);
    else
        console.log('ok');
});
