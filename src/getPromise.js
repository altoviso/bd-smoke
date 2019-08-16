export default function getPromise(resolver, rejecter) {
    // provide a new Promise with addition capabilities...
    //   methods resolve and reject
    //   properties resolved, rejected, proxy, and promise

    let resolve = 0;
    let reject = 0;
    let queuedSettlementValue;
    let queuedSettlement = false; //  | "resolve" | "reject"
    const p = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
        if (queuedSettlement) {
            p[queuedSettlement](queuedSettlementValue);
        }
    });

    // the underlying promise
    p.promise = p;

    // resolve/reject the promise
    // add the read-only properties resolved/rejected accordingly
    p.resolve = value => {
        if (!resolve) {
            queuedSettlementValue = value;
            queuedSettlement = 'resolve';
            return;
        }
        value = resolver ? resolver(value) : value;
        Object.defineProperties(p, {
            resolved: { value: true, enumerable: true },
            rejected: { value: false, enumerable: true },
        });
        resolve(value);
    };
    p.reject = value => {
        if (!reject) {
            queuedSettlementValue = value;
            queuedSettlement = 'reject';
            return;
        }
        value = rejecter ? rejecter(value) : value;
        Object.defineProperties(p, {
            resolved: { value: false, enumerable: true },
            rejected: { value: true, enumerable: true },
        });
        reject(value);
    };

    // proxy hands out an interface to p that cannot resolve or reject p
    p.proxy = Object.seal({
        get resolved() {
            return !!p.resolved;
        },
        get rejected() {
            return !!p.rejected;
        },
        get promise() {
            return p;
        },
        then(onFulfilled, onRejected) {
            return p.then(onFulfilled, onRejected);
        },
        catch(onRejected) {
            return p.catch(onRejected);
        },
        finally(onFinally) {
            return p.finally(onFinally);
        }
    });
    return p;
}
