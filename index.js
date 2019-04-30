'use strict';

const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const slash = require('slash');

function ChunkHashReplacePlugin(options) {
	if (options instanceof Array) {
		this.list = options;
	} else if (fs.lstatSync(options.src).isDirectory()) {
		this.transformDirectory = true;
		this.src = options.src;
		this.dest = options.dest;
		this.stripContent = options.stripContent;
		this.replace = options.replace || [{pattern: null, replacement: null}]
	} else {
		this.list = [{
			src: options.src,
			dest: options.dest,
			stripContent: options.stripContent || '',
			replace: options.replace || [{pattern: null, replacement: null}]
		}];
	}
}

ChunkHashReplacePlugin.prototype.apply = function(compiler) {
	let self = this;
	self.moduleAssets = {};
	const folder = compiler.options.context;
	compiler.plugin("compilation", function (compilation) {
		compilation.plugin('module-asset', function (module, file) {
			self.moduleAssets[file] = path.join(
				path.dirname(file),
				path.basename(module.userRequest)
			);
		});
	});

	if (this.transformDirectory) {
		const stripContent = self.stripContent;
		getAllFiles(self.src).forEach(item => {
			const src = item;
			let srcPart = src.split('/');
			srcPart.shift();
			const destPart = srcPart.join('/');
			const dest = path.resolve(self.dest, destPart);
			transform.call(self, src, dest, stripContent, compiler);
		})
	} else {
		self.list.forEach(item => {
			const psrc = item.src;
			const pdest = item.dest;
			const stripContent = item.stripContent;

			const src = path.join(folder, psrc);
			const dest = path.join(folder, pdest);

			transform.call(self, src, dest, stripContent, compiler);
		})
	}
};

function transform(src, dest, stripContent, compiler) {
	let self = this;

	fs.readFile(src, 'utf8', function(err, data) {
		compiler.plugin('done', function(statsData) {
			const stats = statsData.toJson();
			let htmlOutput = fs.readFileSync(src, 'utf8');
			if (self.replace !== null) {
				self.replace.forEach(r => htmlOutput = htmlOutput.replace(r.pattern, r.replacement));
			}
			for (let chunk of stats.chunks) {
				let {hash, files, names, file} = chunk;
				files.forEach(file => {
					let nameIdx = names.indexOf(file);
					if (nameIdx === -1) {
						let name = names[0];
						let extension = path.extname(file)
						hash = file.replace(new RegExp(name + '\.(.*)' + extension), '$1');
					}

					const resourcePath = file.replace(stripContent, '').replace(/\\/g, '/');
					const resourceURI = resourcePath.replace(`${hash}.`, '');
					htmlOutput = replaceChunk(htmlOutput, resourceURI, resourcePath);
				});
			}

			let assestKV = Object.assign({}, stats.assets.reduce(function (memo, asset) {
				const name = self.moduleAssets[asset.name];
				if (name) memo[slash(name)] = slash(asset.name);
				return memo;
			}, {}));

			Object.keys(assestKV).forEach(resourceURI => {
				let resourcePath = assestKV[resourceURI];
				resourcePath = resourcePath.replace(stripContent, '');
				htmlOutput = replaceChunk(htmlOutput, resourceURI, resourcePath);
			});

			mkdirp.sync(path.dirname(dest));
			fs.writeFileSync(dest, htmlOutput);
		});
	});
}

function replaceChunk(htmlOutput, resourceURI, resourcePath) {
	const jsonRepRegexp = new RegExp(`:+\\s?\"${resourceURI}\"`);
	if(jsonRepRegexp.test(htmlOutput))
		htmlOutput = htmlOutput.replace(jsonRepRegexp, `: "${resourcePath}"`);
	else
		htmlOutput = htmlOutput.replace(resourceURI, resourcePath);
	return htmlOutput;
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
	return (ext === '*' ? fileList : fileList.filter(file => path.extname(file) === ext)).map(file => slash(file));
}

module.exports = ChunkHashReplacePlugin;
