const {getLeftTree} = require('../files_info.config');

class GeneratorAllInfoPlugin {
    constructor(options) {
        this.pathSource = options.pathSource;
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync('GeneratorAllInfoPlugin', (compilation, cb) => {

            const filesPath = getLeftTree(this.pathSource);
            const result = `window.ALL_INFO = ${JSON.stringify(filesPath)}`;

            compilation.assets['/source/index.js'] = {
                source: function () {
                    return result;
                },
                size: function () {
                    return result.length;
                }
            }
            cb()
        })
    }
}

module.exports = GeneratorAllInfoPlugin;
