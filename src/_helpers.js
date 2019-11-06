import { onDisconnectAction } from './defaultActions';

export function makeQuerablePromise(promise) {
    // Don't create a wrapper for promises that can already be queried.
    if (promise.isResolved) return promise;

    let isResolved = false;
    let isRejected = false;

    // Observe the promise, saving the fulfillment in a closure scope.
    let result = promise.then(
        (v) => {
            isResolved = true;
            return v;
        },
        (e) => {
            isRejected = true;
            throw e;
        });
    result.isFulfilled = () => isResolved || isRejected;
    result.isResolved = () => isResolved;
    result.isRejected = () => isRejected;

    return result;
}

export const dispatchMessage = (port, dispatch) => {
    if (!port.onMessage.hasListeners()) {
        port.onMessage.addListener((message) => {
            dispatch({ ...message, notSync: true });
        });
    }
};

export const remove = (array, value) => {
    const i = array.indexOf(value);
    // array[ i ] = undefined;
    return ~i ? array.splice(i, 1) : array;
};

export const onDisconnect = (dispatch, array, value, port) => {
    if (!port.onDisconnect.hasListeners()) {
        port.onDisconnect.addListener((port) => {
            remove(array, value);
            dispatch(onDisconnectAction({ name: port.name, sender: port.sender }));
        });
    }
};

export const sendAction = (port, action) => {
    if (port) {
        port.postMessage(action);
    } else {
        console.warn('Attempt to send a message to a closed port');
    }
};

export const separateArgs = (args = []) => {
    const ports = [], promises = [], addListeners = [];

    args.forEach((item) => {
        if (item instanceof Promise) {
            promises.push(item);
        } else {
            if (typeof item === 'object' && item.addListener) addListeners.push(item);
            else ports.push(item);
        }
    });

    return [ ports, promises, addListeners ];
};

export const applyOptions = ({ tabsOnly, extensionId, name, excludeTabs }, port) => {
    if (!port) {
        console.warn('Unable to register invalid port');
        return false;
    }
    if (tabsOnly && !port.sender.tab) return false;
    if (extensionId && extensionId !== port.sender.id) return false;
    if (name) {
        if (name instanceof Array && name.includes(port.name)) return false;
        else {
            if (name !== port.name) return false;
        }
    }
    if (excludeTabs && port.sender.tab) return false;

    return true;
};
