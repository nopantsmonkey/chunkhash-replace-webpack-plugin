'use strict';

const path = require('path');
const fs = require('fs');
const pathSeparator = process.platform.toLowerCase() === 'win32' ? '\\' : '/';

function ChunkHashReplacePlugin(options) {
    this.src = options.src;
    this.dest = options.dest;
}

ChunkHashReplacePlugin.prototype.apply = function(compiler) {
    let self = this;
    let folder = compiler.options.context;
    let src = path.join(folder, self.src);
    let dest = path.join(folder, self.dest);

    fs.readFile(src, 'utf8', function(err, data) {
        compiler.plugin('done', function(statsData) {
            const stats = statsData.toJson();
            let htmlOutput = fs.readFileSync(src, 'utf8');
            for (let chunk of stats.chunks) {
                const {hash, files} = chunk;
                files.forEach(file => {
                    let resourcePath = file.replace('css' + pathSeparator, '').replace(/\\/g, '/');
                    let resourceURI = resourcePath.replace(`${hash}.`, '');
                    htmlOutput = htmlOutput.replace(resourceURI, resourcePath);
                });
            }

            fs.writeFile(dest, htmlOutput);
        });
    });
};

module.exports = ChunkHashReplacePlugin;
