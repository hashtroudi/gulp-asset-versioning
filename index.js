"use strict";

var path = require('path');
var fs = require('fs');
var crypto = require('crypto');

var gutil = require('gulp-util');
var through = require('through2');

var PLUGIN_NAME = 'gulp-asset-rev';

var ASSET_REG = {
    "SCRIPT": /(<script[^>]+src=)['"]([^'"]+)["']/ig,
    "STYLESHEET": /(<link[^>]+href=)['"]([^'"]+)["']/ig,
    "IMAGE": /(<img[^>]+src=)['"]([^'"]+)["']/ig,
    "BACKGROUND": /(url\()(?!data:|about:)([^)]*)/ig
};

var createHash = function (file, len) {
    return crypto.createHash('md5').update(file).digest('hex').substr(0, len);
};

module.exports = function (options) {
    return through.obj(function (file, enc, cb) {
        options = options || {};

        var hashLen = 8;

        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
            return cb();
        }

        var content = file.contents.toString();

        var filePath = path.dirname(file.path);

        for (var type in ASSET_REG) {
            if (type === "BACKGROUND" && !/\.(css|scss|less)$/.test(file.path)) {

            } else {
                content = content.replace(ASSET_REG[type], function (str, tag, src) {
                    src = src.replace(/(^['"]|['"]$)/g, '');

                    if (!/\.[^\.]+$/.test(src)) {
                        return str;
                    }
                
                    // remote resource
                    if (/^https?:\/\//.test(src)) {
                        return str;
                    }

                    var assetPath = options.assetPath || path.join(filePath, src);

                    if (src.indexOf('/') == 0) {
                        if (src.indexOf('//') != 0){
                            if (options.resolvePath && typeof options.resolvePath === "function") {
                                assetPath = options.resolvePath(src);
                            } else {
                                assetPath = (options.rootPath || "") + src;
                            }   
                        }else{
                            return str;
                        }
                    }

                    assetPath = assetPath.replace(/(\?v=)\w{8}/, '');
                    src = src.replace(/(\?v=)\w{8}/, '');

                    if (fs.existsSync(assetPath)) {

                        var buf = fs.readFileSync(assetPath);

                        var md5 = createHash(buf, hashLen);
                                                
                            src=src+"?v="+md5; 
                        
                    } else {
                        return str;
                    }

                    return tag + '"' + src + '"';
                });
            }
        }

        file.contents = new Buffer(content);
        this.push(file);
        cb();
    });
};

