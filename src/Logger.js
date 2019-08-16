/* eslint-disable no-console */
import {isNode} from './environment.js';
import Timer from './Timer.js';

const Logger = class {
    constructor(options) {
        this.options = {
            nameSeparator: '/',
            console: true,
            consoleErrorPrinter(e) {
                console.log(e);
            }
        };
        this.reset(options);
    }

    reset(options) {
        const result = this.getResults();
        this.options = { ...this.options, ...options };
        this._console = !!this.options.console;
        this._idSeed = 0;
        this._unexpected = false;
        this._totalCount = 0;
        this._passCount = 0;
        this._failCount = 0;
        this._scaffoldFailCount = 0;
        this._results = [];
        this._logs = {};
        return result;
    }

    updateOptions(options) {
        this.options = { ...this.options, ...options };
        this._console = !!this.options.console;
    }

    getResults() {
        return {
            unexpected: this._unexpected,
            totalCount: this._totalCount,
            passCount: this._passCount,
            failCount: this._failCount,
            scaffoldFailCount: this._scaffoldFailCount,
            results: this._results,
            logs: this._logs
        };
    }

    get totalCount() {
        return this._totalCount;
    }

    get passCount() {
        return this._passCount;
    }

    get failCount() {
        return this._failCount;
    }

    get scaffoldFailCount() {
        return this._scaffoldFailCount;
    }

    get unexpected() {
        return this._unexpected;
    }

    get results() {
        return this._results;
    }

    get logs() {
        return this._logs;
    }

    getLog(id) {
        return this._logs[id];
    }

    getName(context, node, testId) {
        return context.map(node => node.id).join(this.options.nameSeparator) +
            (node ? this.options.nameSeparator + node.id : '') +
            (testId ? this.options.nameSeparator + testId : '');
    }

    getNameById(loggerId) {
        return this._results[loggerId][0];
    }

    getScaffoldName(context, node) {
        const name = [];
        for (let i = 0, end = context.length; i < end; i++) {
            name.push(context[i].id);
            if (context[i] === node) break;
        }
        return name.join(this.options.nameSeparator);
    }

    startTest(context) {
        this._totalCount++;
        const id = ++(this._idSeed);
        this._results[id] = [this.getName(context), (new Date()).getTime(), new Timer()];
        return id;
    }

    passTest(id) {
        this._passCount++;
        const result = this._results[id];
        result[2] = result[2].time;
        if (this._console) {
            console.log(`PASS[${result[0]}]`);
        }
    }

    failTest(id, error) {
        this._failCount++;
        const result = this._results[id];
        result[2] = false;
        result[3] = [error.message, ...(error.stack.split('\n'))];
        if (this._console) {
            console.log(`FAIL[${result[0]}]`);
            this.options.consoleErrorPrinter(error);
        }
    }

    excludeTest(context) {
        if (this.options.logExcludes) {
            const name = this.getName(context);
            this.log('EXCLUDED', 0, [name]);
        }
    }

    failScaffold(context, node, phaseText, error) {
        this._scaffoldFailCount++;
        const scaffoldName = this.getScaffoldName(context, node);
        this.log('SCAFFOLD FAIL', 0, [`${scaffoldName}:${phaseText}`, error], true);
        if (this._console) {
            console.log(`SCAFFOLD FAIL[${scaffoldName}:${phaseText}]`);
            this.options.consoleErrorPrinter(error);
        }
    }

    logNote(note, noConsole) {
        this.log('note', 0, [note], true);
        if (this._console && !noConsole) {
            console.log(`NOTE: ${note}`);
        }
    }

    log(id, testId, entry, noConsole) {
        // if you want to say noConsole==true, then you _must_ provide a testId
        if (arguments.length === 2) {
            noConsole = entry;
            entry = testId;
            testId = 0;
            // noConsole is undefined
        }
        if (testId) {
            id = `${id}:${testId}`;
        }
        let errorObject = 0;
        if (Array.isArray(entry)) {
            const lastEntry = entry[entry.length - 1];
            if (lastEntry instanceof Error) {
                errorObject = entry.pop();
            } else if (entry.length === 1) {
                entry = entry[0];
            }
        } else if (entry instanceof Error) {
            errorObject = entry;
            entry = [];
        }
        if (errorObject) {
            entry.push(`${errorObject}`);
            !isNode && entry.push(errorObject.stack);
            !isNode && entry.push(errorObject);
        }
        if (/unexpected$/.test(id)) {
            this._unexpected = true;
        }
        if (/error/.test(id)) {
            this._failCount++;
        }
        (this._logs[id] || (this._logs[id] = [])).push(entry);
        if (this._console && !noConsole) {
            if (Array.isArray(entry)) {
                console.log(`LOG[${id}]`);
                entry.forEach(item => console.log(item));
                console.log('.');
            } else {
                console.log(`LOG[${id}]`, entry);
            }
        }
        return id;
    }
};

export default Logger;
