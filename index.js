'use strict';

import { Transform } from 'stream';
import path from 'path';
import Twig from 'twig';
import PluginError from 'plugin-error';

const PLUGIN_NAME = 'gulp5-twig';

function replaceExt(nPath, ext) {
    if (typeof nPath !== 'string' || nPath.length === 0) {
        return nPath;
    }

    const nFileName = `${path.basename(nPath, path.extname(nPath))}${ext}`;
    const nFilepath = path.join(path.dirname(nPath), nFileName);

    // Handle the case when the path starts with './'.
    if (nPath.startsWith(`.${path.sep}`) || nPath.startsWith('./')) {
        return `.${path.sep}${nFilepath}`;
    }

    return nFilepath;
}

export default function(options) {
    return new Transform({
        objectMode: true,
        async transform(file, encoding, callback) {
            if (file.isNull()) {
                return callback(null, file);
            }

            if (file.isStream()) {
                return callback(new PluginError(PLUGIN_NAME, 'Streaming not supported!'));
            }

            const {
                changeExt = true,
                extname = '.html',
                useFileContents = false,
                twigParameters = {},
                data: optionsData,
                cache,
                functions,
                filters,
                extend,
                errorLogToConsole = false, // The default value is set.
                onError,
            } = options || {};

            const data = file.data || optionsData || {};

            const keepExtension = changeExt === false || extname === true;

            const target = {
                path: keepExtension ? file.path : replaceExt(file.path, extname || ''),
                relative: keepExtension ? file.relative : replaceExt(file.relative, extname || ''),
            };

            try {
                const { twig } = Twig;

                if (cache !== true) {
                    Twig.cache(false);
                }

                if (functions) {
                    functions.forEach(func => {
                        Twig.extendFunction(func.name, func.func);
                    });
                }

                if (filters) {
                    filters.forEach(filter => {
                        Twig.extendFilter(filter.name, filter.func);
                    });
                }

                if (extend) {
                    Twig.extend(extend);
                }

                const template = twig({
                    ...twigParameters,
                    rethrow: true,
                    async: false,
                    path: file.path,
                    data: useFileContents ? file.contents.toString() : undefined,
                });

                file.contents = Buffer.from(
                    template.render({
                        ...data,
                        _target: target,
                        _file: file,
                    }),
                );

                file.path = target.path;
                callback(null, file);

            } catch (error) {
                if (errorLogToConsole) {
                    console.error(`${PLUGIN_NAME}: ${error.message}`);
                }

                if (typeof onError === 'function') {
                    onError(error);
                    return callback();
                }

                callback(new PluginError(PLUGIN_NAME, error));
            }
        },
    });
}
