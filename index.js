'use strict';

const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const pathSeparator = process.platform.toLowerCase() === 'win32' ? '\\' : '/';

function ChunkHashReplacePlugin(options) {
    if (options instanceof Array) {
        this.list = options;
    } else if (fs.lstatSync(options.src).isDirectory()) {
        this.transformDirectory = true;
        this.src = options.src;
        this.dest = options.dest;
    } else {
        this.list = [{
            src: options.src,
            dest: options.dest
        }];
    }
}

ChunkHashReplacePlugin.prototype.apply = function(compiler) {
    let self = this;
    const folder = compiler.options.context;
    if (this.transformDirectory) {
        getAllFiles(self.src).forEach(item => {
            const src = item;
            let srcPart = src.split(pathSeparator);
            srcPart.shift();
            const destPart = srcPart.join(pathSeparator);
            const dest = path.resolve(self.dest, destPart);

            transform(src, dest, compiler);
        })
    } else {
        self.list.forEach(item => {
            const psrc = item.src;
            const pdest = item.dest;

            const src = path.join(folder, psrc);
            const dest = path.join(folder, pdest);

            transform(src, dest, compiler);
        })
    }
};

function transform(src, dest, compiler) {
    fs.readFile(src, 'utf8', function(err, data) {
        compiler.plugin('done', function(statsData) {
            const stats = statsData.toJson();
            let htmlOutput = fs.readFileSync(src, 'utf8');
            for (let chunk of stats.chunks) {
                const {hash, files} = chunk;
                files.forEach(file => {
                    const resourcePath = file.replace('css' + pathSeparator, '').replace(/\\/g, '/');
                    const resourceURI = resourcePath.replace(`${hash}.`, '');
                    const jsonRegExp = new RegExp("[:]\\s(\".*\")");

                    if (jsonRegExp.test(htmlOutput)) {
                        const jsonRepRegexp = new RegExp(`:+\\s?\"${resourceURI}\"`);
                        htmlOutput = htmlOutput.replace(jsonRepRegexp, `: "${resourcePath}"`);
                    } else {
                        htmlOutput = htmlOutput.replace(resourceURI, resourcePath);
                    }
                });
            }

            mkdirp.sync(path.dirname(dest));
            fs.writeFileSync(dest, htmlOutput);
        });
    });
}

function walkSync(dir, filelist = []) {
    fs.readdirSync(dir)
        .map(file => fs
            .statSync(path.join(dir, file))
            .isDirectory() ? walkSync(path.join(dir, file), filelist) : filelist.push(path.join(dir, file))[0]
        );
}

function getAllFiles(dir, ext = '*') {
    let fileList = [];
    walkSync(dir, fileList);
    return ext === '*' ? fileList : fileList.filter(file => path.extname(file) === ext);
}

module.exports = ChunkHashReplacePlugin;
