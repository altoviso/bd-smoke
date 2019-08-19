import {isNode, isBrowser} from './environment.js';
import getPromise from './getPromise.js';

export default function getLoadControlClass(log, onResourceLoadComplete, onLoadingComplete) {
    class LoadControl {
        constructor(resourceName, status, resolution, errorInfo) {
            const promise = getPromise();
            if (!status) {
                status = 'started';
            } else if (resolution !== undefined) {
                promise.resolve(resolution);
            }
            Object.defineProperties(this, {
                order: { value: ++LoadControl.counter },
                resourceName: { value: resourceName },
                loadedName: { value: resolution !== undefined ? resourceName : false, writable: true },
                status: { value: status, writable: true },
                promise: { value: promise },
                errorInfo: { value: errorInfo || false, writable: true },
            });

            // make sure we have a live loading promise so that check done can work...
            if (!LoadControl.loadingPromise || LoadControl.loadingPromise.resolved) {
                LoadControl.loadingError = undefined;
                LoadControl.loadingPromise = getPromise();
            }
            promise.then(LoadControl.checkDone);
        }

        get isRequested() {
            return !!this.loadedName;
        }

        resolve(resolution, errorInfo) {
            if (this.promise.resolved) {
                // eslint-disable-next-line no-console
                console.warn('unexpected');
                return;
            }
            this.status = resolution;
            if (resolution === false) {
                const logEntry = [this.resourceName, 'failed to load'];
                if (this.loadedName !== this.resourceName) {
                    logEntry.push(`(loaded as ${this.loadedName})`);
                }

                if (errorInfo) {
                    this.errorInfo = errorInfo;
                    logEntry.push(errorInfo);
                }
                log(...logEntry);
            } else if (resolution !== true) {
                this.loadedValue = resolution;
                this.status = true;
            }
            onResourceLoadComplete(this);
            this.promise.resolve(resolution);
        }

        static isLegalResourceName(name, type) {
            if (typeof name !== 'string') {
                log(`a resource name was given to load a ${type} resource that is not a string`);
                return false;
            }
            if (type === 'AMD' && /^\./.test(name)) {
                log(`illegal to AMD require a relative module name (${name})`);
                return false;
            }
            return true;
        }

        static getControl(resourceName, type) {
            // false if (resourceName, type) is illegal; otherwise the control record for resourceName
            if (!LoadControl.isLegalResourceName(resourceName, type)) {
                return false;
            }
            if (LoadControl.injections.has(resourceName)) {
                return LoadControl.injections.get(resourceName);
            } else {
                let control;
                if (type === 'CSS' && isNode) {
                    control = new LoadControl(resourceName, 'ignored', true, 'CSS resources are ignored when running on node');
                } else if (/.+\.es6\.js$/.test(resourceName) && isNode) {
                    // .js6 types indicate the resource may include import or export directives
                    // what about when node does support import/export ?
                    control = new LoadControl(resourceName, 'ignored', true, 'js6 resources are ignored when running on node');
                } else {
                    control = new LoadControl(resourceName);
                }
                LoadControl.injections.set(resourceName, control);
                return control;
            }
        }

        static checkDone() {
            let done = true;
            let error = false;
            // eslint-disable-next-line no-restricted-syntax
            for (const control of LoadControl.injections.values()) {
                if (!done || !control.promise.resolved) {
                    done = false;
                }
                error = error || control.status === false;
            }
            if (done) {
                onLoadingComplete();
                LoadControl.loadingError = error;
                LoadControl.loadingPromise.resolve(error);
            }
        }


        static load(resourceName, type, proc) {
            const control = LoadControl.getControl(resourceName, type);
            if (!control) {
                return false;
            }
            if (control.isRequested) {
                return control.promise.proxy;
            }
            let name = resourceName;
            if (/^\./.test(name)) {
                // if resourceName is relative, then it"s relative to the project directory
                // TODO: make this an option?
                name = LoadControl.injectRelativePrefix + name;
            }
            proc(control, name);
            return control.promise.proxy;
        }

        static browserInject(control, tag, props) {
            let node;
            const handler = e => {
                control.loadedName = node.src;
                if (e.type === 'load') {
                    // TODO: make sure this kind of failure is detected on node also
                    control.resolve(!LoadControl.windowErrors[node.src]);
                } else {
                    control.resolve(false, e);
                }
            };
            try {
                node = document.createElement(tag);
                node.addEventListener('load', handler, false);
                node.addEventListener('error', handler, false);
                Object.keys(props).forEach(p => (node[p] = props[p]));
                document.getElementsByTagName('script')[0].parentNode.appendChild(node);
            } catch (e) {
                control.resolve(false, e);
            }
        }

        static injectScript(resourceName, type) {
            return LoadControl.load(resourceName, 'script', (control, src) => {
                if (type === undefined) {
                    type = /\.es5\.js$/.test(src) ? '' : 'module';
                }
                LoadControl.browserInject(control, 'script', { src: control.loadedName = src, type: type || '' });
            });
        }

        static injectCss(resourceName) {
            return LoadControl.load(resourceName, 'CSS', (control, href) => {
                LoadControl.browserInject(control, 'link', {
                    href: control.loadedName = href,
                    type: 'text/css',
                    rel: 'stylesheet'
                });
            });
        }

        static loadNodeModule(moduleName) {
            return LoadControl.load(moduleName, 'node module', (control, fileName) => {
                try {
                    // eslint-disable-next-line global-require,import/no-dynamic-require
                    require((control.loadedName = fileName));
                    control.resolve(true);
                } catch (e) {
                    control.resolve(false, e);
                }
            });
        }

        static loadAmdModule(moduleName) {
            return LoadControl.load(moduleName, 'script', (control, module) => {
                try {
                    // eslint-disable-next-line global-require,import/no-dynamic-require
                    require([module], () => {
                        control.resolve(true);
                    });
                } catch (e) {
                    control.resolve(false, e);
                }
            });
        }
    }

    LoadControl.counter = 0;
    LoadControl.injections = new Map();
    LoadControl.loadingPromise = getPromise();
    LoadControl.loadingPromise.resolve(true);
    LoadControl.loadingError = false;
    LoadControl.injectRelativePrefix = '';
    LoadControl.windowErrors = {};

    if (isBrowser) {
        window.addEventListener('error', e => {
            if (e.filename) {
                LoadControl.windowErrors[e.filename] = true;
            }
        });
    }


    return LoadControl;
}
