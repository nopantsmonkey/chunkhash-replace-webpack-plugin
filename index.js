'use strict';

const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const pathSeparator = process.platform.toLowerCase() === 'win32' ? '\\' : '/';

function ChunkHashReplacePlugin(options) {
    if (options instanceof Array) {
        this.list = options;
    } else {
        this.list = [{
            src: options.src,
            dest: options.dest
        }];
    }
}

ChunkHashReplacePlugin.prototype.apply = function(compiler) {
    let self = this;
    let folder = compiler.options.context;
    self.list.forEach(item => {
        let psrc = item.src;
        let pdest = item.dest;

        let src = path.join(folder, psrc);
        let dest = path.join(folder, pdest);

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

                mkdirp(path.dirname(dest), (err) => {
                    if(err) {
                        console.error(err);
                    }
                    fs.writeFile(dest, htmlOutput);
                });
            });
        });
    })
};

module.exports = ChunkHashReplacePlugin;
