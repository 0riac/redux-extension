export const onConnectAction = (payload, notSync) => {
    return {
        type: '@@ON_CONNECT',
        payload,
        notSync
    };
};

export const onDisconnectAction = (payload) => {
    return {
        type: '@@ON_DISCONNECT',
        payload,
        notSync: true
    };
};
