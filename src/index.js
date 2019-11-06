import {
    makeQuerablePromise,
    dispatchMessage,
    onDisconnect,
    applyOptions,
    sendAction,
    separateArgs
} from './_helpers';
import { onConnectAction } from './defaultActions';
import { browser } from './browserApi';

const connect = (name) => {
    return browser.runtime.connect({ name });
};

const connectToTab = async (name) => {
    if (!browser.tabs) throw new Error('Cannot call connectToTab function in content script');
    return new Promise((resolve) => {
        browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            resolve(browser.tabs.connect(tabs[ 0 ].id, { name }));
        });
    });
};

const addListener = (options = {}) => ({ ...options, addListener: true });

const dispatchOnConnect = (dispatch, ...ports) => {
    ports.forEach((port) => {
        dispatch(onConnectAction({ name: port.name, sender: port.sender }));
    });
};

const syncMiddleware = (...args) => {
    const [ ports, promises, addListeners ] = separateArgs(args);
    const wrappedPromises = promises.map((promise) => makeQuerablePromise(promise));

    return ({ getState, dispatch }) => {
        ports.forEach((port) => {
            dispatchMessage(port, dispatch);
            onDisconnect(dispatch, ports, port, port);
        });

        wrappedPromises.forEach((promise) => {
            promise.then((port) => {
                dispatchMessage(port, dispatch);
                onDisconnect(dispatch, wrappedPromises, promise, port);
                // dispatch(onConnectAction({ name: port.name, sender: port.sender }));
            });
        });

        addListeners.forEach((options) => {
            browser.runtime.onConnect.addListener((port) => {
                if (applyOptions(options, port)) {
                    dispatchMessage(port, dispatch);
                    onDisconnect(dispatch, ports, port, port);
                    ports.push(port);
                    dispatch(onConnectAction({ name: port.name, sender: port.sender }));
                }
            });
        });

        return next => action => {
            if (typeof action === 'object') {
                if (!action.notSync) {
                    ports.forEach((port) => sendAction(port, action));
                    wrappedPromises.forEach((promise) => {
                        if (promise.isResolved()) {
                            promise.then((port) => {
                                sendAction(port, action);
                            });
                        }
                    });
                }
            }

            return next(action);
        };
    };
};

export { addListener, dispatchOnConnect, syncMiddleware, connect, connectToTab };
