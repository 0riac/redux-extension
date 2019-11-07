##  Redux-Extension

A simple and customizable redux middleware for synchronizing store between browser extension elements(background, content, popup). 

## Why redux-extension?

* Quick and easy [start](#get-started)
* Ability to use ports, promises and listeners(see [syncMiddleware](#syncmiddlewareargs))
* Messaging between stores is done using [ports](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/Port), this is several times faster than using [runtime.sendMessage](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/sendMessage).
* Сustomize as you need: 

	* connect only those scripts that you need
	* define reaction on actions [onConnect](#onconnectaction) and [onDisconnect](#ondisconnectaction)

## Install

```
npm install --save redux-extionsion
```

## Get started

Use [syncMiddleware](#syncmiddlewareargs) to create a middleware to sync your scripts.

```javascript
import { syncMiddleware } from 'redux-extension';
const middleware = syncMiddleware();
```

Establish a [connection](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/connect) between synchronized scripts. You can use [connect](#connectname), [connectToTab](#connectToTabname) and [addListener](#addlisteneroptions) for this. Example synchronization between *background*, *content* and *popup* scripts:

background.js: 

```javascript
import { createStore, applyMiddleware } from 'redux';
import { syncMiddleware, addListener } from 'redux-extension';

const middleware = syncMiddleware(addListener());
const store = createStore(reducer, {}, applyMiddleware(middleware));
```

content.js:

```javascript
import { createStore, applyMiddleware } from 'redux';
import { syncMiddleware, addListener, connect } from 'redux-extension';

const middleware = syncMiddleware(connect('port_name'), addListener());
const store = createStore(reducer, {}, applyMiddleware(middleware));
```

popup.js:

```javascript
import { createStore, applyMiddleware } from 'redux';
import { syncMiddleware, connect, connectToTab } from 'redux-extension';

const middleware = syncMiddleware(connect('port_name'), connectToTab('port_name'));
const store = createStore(reducer, {}, applyMiddleware(middleware));
```


What you will get: when loading the page on which the extension is running, the content script will connect to the background script and after that all actions that will be dispatched on one of these scripts will be transferred to another script and dispatched. When popup is opened, the popup script will connect to the background and content scripts and the store popup script will receive actions that are dispatched by these scripts and will also send them its own actions.

## API

### Metods

#### syncMiddleware(...args)

It accepts arguments of various types:
* [Port](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/Port) which is connected to another script
* Promise that resolves with an object of type [Port](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/Port)
* Object for creating a connection listener(use [addListener](#addlisteneroptions))

Middleware modifies the ```dispatch``` method of your store by forwarding each action to connected ports. If you do not want to send any action, specify the ```notSync: true``` flag in your action.

Middleware subscribes each port to ```onMessage``` and ```onDisconnect``` events and does so only once. If any of these events have listeners, then it will not be connected to the store. With the ```onMessage``` event, the ```message``` will be dispatched as action but with the [```notSync```](#notsync) flag, this means that it will not be sent to other ports connected to this store. ```OnDisconnect``` event will dispatch an [```onDisconnectAction```](#ondisconnectaction) with the [```notSync```](#notsync) flag.

#### connect(name)

Accepts an argument of type String. Returns the port with the specified name. 

This function is an alias for ```browser.runtime.connect({ name })```.

#### connectToTab(name)

Accepts an argument of type String. Returns the promise that resolves with the port with the specified name.

The port is created to connect to the active tab. When called from the content script, an error is thrown ```Cannot call connectToTab function in content script```.

#### addListener([options])

Accepts an optional argument of type Object. Returns an object.

The function is used to register listeners for incoming connections inside middleware. ```OnMessage``` and ```onDisconnect``` listeners will be assigned to the connected port. When the connected port is ready, [```onConnectAction```](#onconnectaction) will be dispatched to all connected ports.

The options object is used to filter incoming connections and may contain the following fields:
* **tabsOnly** if ```true``` only connections from content scripts are logged. Example: ```addListener({ tabsOnly: true })```.
* **excludeTabs** if ```true``` сonnections from content scripts are not registered. Example ```addListener({ excludeTabs: true })```.
* **name** may be a string or an array of strings. When specifying this parameter, the port is connected if its name matches the one specified in the parameter. Example ```addListener({ tabsOnly: true, name: 'content-background' })``` or ```addListener({ name: ['content-background', 'popup-background'] })```.

#### dispatchOnConnect(dispatch, ...ports)

Takes dispatch as the first argument and any number of arguments of type [Port](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/Port) after. Dispatches [```onConnectAction```](#onconnectaction) for all ports passed to the function

### Actions

#### onConnectAction 

**If middleware processes incoming connections**, then when the new port is ready, ```onConnectAction``` with type ```@@ON_CONNECT``` and payload ```{ name, sender }``` will be dispatched to all ports connected to the store. **Name** is the port name and **sender** is a [port.sender](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/MessageSender) object.

You can handle these actions in your reducers in your own way to achieve the desired result.

#### onDisconnectAction

When a port passed to ```syncMiddleware``` or registered with ```addListener``` raises the ```onDisconnect``` event, ```onDisconnectAction``` is dispatched(for current store only). ```onDisconnecAction``` contains type ```@@ON_DISCONNECT``` and payload ```{ name, sender }```. **Name** is the port name and **sender** is a [port.sender](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/MessageSender) object.

#### notSync

Flag for actions which allows not to synchronize the action for which it is set to ```true```

## License

[MIT](LICENSE)
