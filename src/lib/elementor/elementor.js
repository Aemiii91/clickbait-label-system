;(function(global, factory) {
    typeof exports === "object" && typeof module != "undefined" ? module.exports = factory() :
    typeof define === "function" && define.amd ? define(factory) :
    global.elementor = factory()
})(this, (function() { "use strict";

function elementor(selector, parent) {
    return elementor.$get(selector, parent);
}

elementor.$get = function(selector, parent) {
    if (typeof selector == "string") {
        return _element((parent || document).querySelector(selector));
    }
    else if (isArray(selector)) {
        return elementor.$all(selector[0], parent);
    }
    else {
        return _element(selector);
    }
}

elementor.$all = function(selector, parent) {
    return (parent || document).querySelectorAll(selector);
}

elementor.$el = function (selector, attributes) {
    // Extract selector parts, and create element
    var tagName = extractRegEx(/^([a-z](?:[a-z0-9]|-)*)/i, selector),
        id = extractRegEx(/#((?:[^.\s])+)/, selector),
        className = extractRegEx(/\.((?:[^.#\s])+)/g, selector),
        el = document.createElement(tagName ? tagName : "div");

    // Apply id and className if applicable
    if (id !== undefined) el.id = id;
    if (className !== undefined) el.className = className;

    // Apply attributes
    Object.keys(attributes || {}).forEach(function(attrName) {
        if (attributes.hasOwnProperty(attrName)) {
            var attrValue = attributes[attrName];
            if (/^((?:inner|outer)(?:HTML|Text)|textContent|nodeValue|className|id)$/.test(attrName)) {
                // Apply directly
                el[attrName] = attrValue;
            }
            else if (attrName=="style" && typeof attrValue == "object") {
                // A style-object is given, apply to el.style
                Object.keys(attrValue).forEach(function(styleName) {
                    if (attrValue.hasOwnProperty(styleName)) {
                        var styleValue = attrValue[styleName];
                        el.style[styleName] = styleValue;
                    }
                });
            }
            else {
                el.setAttribute(attrName, attrValue);
            }
        }
    });

    return _element(el);
}


var elMethods = {
    $get: function(selector) {
        return elementor.$get(selector, this);
    },

    $all: function(selector) {
        return elementor.$all(selector, this);
    },

    $el: function(selector, attributes) {
        return this.appendChild(elementor.$el(selector, attributes));
    },

    appendTo: function(parent) {
        parent.appendChild(this);
        return this;
    },

    remove: function() {
        if (this.parentNode)
            this.parentNode.removeChild(this);
    },
    
    on: function(eventName, handler, useCapture) {
        return addEventListener.call(this, eventName, handler, useCapture);
    },
    
    off: function(eventName, handler, useCapture) {
        return removeEventListener.call(this, eventName, handler, useCapture);
    }
};

function _element(el) {
    if (typeof el != "object" || el === null || el === undefined) {
        el = new EmptyNode();
    }

    Object.keys(elMethods).forEach(function (key) {
        el[key] = elMethods[key];
    });
    
    return el;
}

function EmptyNode() {
    this.textContent = "";
    this.href = "";
    this.src = "";
    this.isNull = true;
}
EmptyNode.prototype.getAttribute = function() { return ""; };


var _listeners = new Map();

function addEventListener(eventName, handler, useCapture) {
    var listeners = _listeners.get(this) || {};

    this.addEventListener(eventName, handler, useCapture);

    if (listeners[eventName] === undefined)
        listeners[eventName] = [];

    listeners[eventName].push({handler: handler, useCapture: useCapture});
    _listeners.set(this, listeners);

    return this;
}

function removeEventListener(eventName, handler, useCapture) {
    var listeners = _listeners.get(this) || {};

    // If handler is specified, remove only this
    if (handler !== undefined) this.removeEventListener(eventName, handler, useCapture);
    
    if (listeners[eventName] !== undefined) {
        listeners[eventName] = listeners[eventName].filter(function(listener) {
            if (handler !== undefined) {
                return !(listener.handler === handler && listener.useCapture === useCapture);
            }
            else {
                this.removeEventListener(eventName, listener.handler, listener.useCapture);
                return false;
            }
        }.bind(this));
    }

    _listeners.set(this, listeners);

    return this;
}

function extractRegEx(regex, str) {
    var result = [],
        match;

    if (typeof str != "string") return;

    do {
        if (match = regex.exec(str))
            result.push(match[1]);
    }
    while (regex.global && match);
    
    return result.length ? result.join(" ") : undefined;
}

function isArray(obj) {
    if (typeof Array.isArray === 'undefined')
        return Object.prototype.toString.call(obj) === '[object Array]';
    else
        return Array.isArray(obj);
}

return elementor;

}));