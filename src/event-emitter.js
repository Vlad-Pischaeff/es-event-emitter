const MANY = 0;
const ONCE = 1;
const DONE = 2;

/* global WeakMap */
const privateMap = new WeakMap();

// For making private properties.
function internal(obj) {
  if (!privateMap.has(obj)) {
    privateMap.set(obj, {});
  }

  return privateMap.get(obj);
}

// Excluding callbacks from internal(_callbacks) for speed perfomance.
let _callbacks = {};

/** Class EventEmitter for event-driven architecture. */
export default class EventEmitter {
  /**
   * Constructor.
   *
   * @constructor
   * @param {number|null} maxListeners.
   * @param {object} localConsole.
   *
   * Set private initial parameters:
   *   _events, _callbacks, _maxListeners, _console.
   *
   * @return {this}
   */
  constructor(maxListeners = null, localConsole = console) {
    const self = internal(this);

    self._events = new Set();
    self._console = localConsole;
    self._maxListeners = maxListeners === null 
      ? null 
      : parseInt(maxListeners, 10);

    return this;
  }

  /**
   * Add callback to the event.
   *
   * @param {string} eventName.
   * @param {function} callback
   * @param {object|null} context - In than context will be called callback.
   * @param {number} weight - Using for sorting callbacks calls.
   * @param {number} count - Using for how many times callback calls.
   * 
   * @return {this}
   */
  _addCallback(eventName, callback, context, weight, count) {
    if (context) {
      callback = callback.bind(context);
    }
    
    this._getCallbacks(eventName)
      .push({
        callback,
        weight,
        count
      });

    // @todo instead of sorting insert to right place in Array.
    // @link http://rjzaworski.com/2013/03/composition-in-javascript

    // Sort the array of callbacks in
    // the order of their call by "weight".
    this._getCallbacks(eventName)
      .sort((a, b) => b.weight - a.weight);

    return this;
  }

  /**
   * Get all callback for the event.
   *
   * @param {string} eventName
   *
   * @return {object|undefined}
   */
  _getCallbacks(eventName) {
    return _callbacks[eventName];
  }

  /**
   * Get callback's index for the event.
   *
   * @param {string} eventName
   * @param {callback} callback
   *
   * @return {number|null}
   */
  _getCallbackIndex(eventName, callback) {
    return this._has(eventName) 
      ? this._getCallbacks(eventName)
          .findIndex(element => element.callback === callback) 
      : -1;
  }

  /**
   * Check if we achive maximum of listeners for the event.
   *
   * @param {string} eventName
   *
   * @return {bool}
   */
  _achieveMaxListener(eventName) {
    return (internal(this)._maxListeners !== null &&
      internal(this)._maxListeners <= this.listenersNumber(eventName));
  }

  /**
   * Check if callback is already exists for the event.
   *
   * @param {string} eventName
   * @param {function} callback
   * @param {object|null} context - In than context will be called callback.
   *
   * @return {bool}
   */
  _callbackIsExists(eventName, callback, context) {
    const callbackInd = this._getCallbackIndex(eventName, callback);
    const activeCallback = callbackInd !== -1 
      ? this._getCallbacks(eventName)[callbackInd] 
      : void 0;

    return (callbackInd !== -1 && activeCallback &&
      activeCallback.context === context);
  }

  /**
   * Check is the event was already added.
   *
   * @param {string} eventName
   *
   * @return {bool}
   */
  _has(eventName) {
    // return internal(this)._events.has(eventName);
    return _callbacks[eventName]
      ? true
      : false;
  }

  /**
   * Add the listener.
   *
   * @param {string} eventName
   * @param {function} callback
   * @param {object|null} context - In than context will be called callback.
   * @param {number} weight - Using for sorting callbacks calls.
   * @param {number} count - Using for how many times callback calls.
   *
   * @return {this}
   */
  on(eventName, callback, context = null, weight = 1, count = MANY) {
    /* eslint no-unused-vars: 0 */
    const self = internal(this);

    if (typeof callback !== 'function') {
      throw new TypeError(`${callback} is not a function`);
    }

    // If event wasn't added before - just add it
    // and define callbacks as an empty object.
    if (!this._has(eventName)) {
      self._events.add(eventName);
      _callbacks[eventName] = [];
    } else {
      // Check if we reached maximum number of listeners.
      if (this._achieveMaxListener(eventName)) {
        self._console.warn(`Max listeners (${self._maxListeners})` +
          ` for event "${eventName}" is reached!`);
      }

      // Check if the same callback has already added.
      if (this._callbackIsExists(...arguments)) {
        self._console.warn(`Event "${eventName}"` +
          ` already has the callback ${callback}.`);
      }
    }

    this._addCallback(eventName, callback, context, weight, count);

    return this;
  }

  /**
   * Add the listener which will be executed only once.
   *
   * @param {string} eventName
   * @param {function} callback
   * @param {object|null} context - In than context will be called callback.
   * @param {number} weight - Using for sorting callbacks calls.
   * @param {number} count - Using for how many times callback calls.
   *
   * @return {this}
   */
  once(eventName, callback, context = null, weight = 1, count = ONCE) {
    this.on(eventName, callback, context, weight, count);
  }

  /**
   * Remove an event at all or just remove selected callback from the event.
   *
   * @param {string} eventName
   * @param {function} callback
   *
   * @return {this}
   */
  off(eventName, callback = null) {
    const self = internal(this);
    let callbackInd;

    if (this._has(eventName)) {
      if (callback === null) {
        // Remove the event.
        self._events.delete(eventName);
        // Remove all listeners.
        _callbacks[eventName] = null;
      } else {
        callbackInd = this._getCallbackIndex(eventName, callback);

        if (callbackInd !== -1) {
          this._getCallbacks(eventName).splice(callbackInd, 1);
          // Remove all equal callbacks.
          this.off(...arguments);
        }
      }
    }

    return this;
  }

  /**
   * Trigger the event.
   *
   * @param {string} eventName
   * @param {...args} args - All arguments which should be passed into callbacks.
   *
   * @return {this}
   */
  emit(eventName, ...args) {
    if (this._has(eventName)) {
      this._getCallbacks(eventName)
        .forEach(element => {
          if (element.count !== DONE) {
            args.length < 5
              ? element.callback(args[0], args[1], args[2], args[3])
              : element.callback(...args);
            if (element.count === ONCE) element.count = DONE;
          }
        });
    }

    return this;
  }

  /**
   * Clear all events and callback links.
   *
   * @return {this}
   */
  clear() {
    internal(this)._events.clear();
    _callbacks = {};

    return this;
  }

  /**
   * Returns number of listeners for the event.
   *
   * @param {string} eventName
   *
   * @return {number|null} - Number of listeners for event
   *                         or null if event isn't exists.
   */
  listenersNumber(eventName) {
    return this._has(eventName) 
      ? _callbacks[eventName].length 
      : null;
  }
}
