/*
 * Copyright (c) 2015, Joel Richard
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

var cito = window.cito || {};
(function (cito, window, undefined) {
    'use strict';

    var document = window.document,
        noop = function () {},
        console = window.console || {warn: noop, error: noop};

    var helperDiv = document.createElement('div'),
        supportsTextContent = 'textContent' in document,
        supportsEventListener = 'addEventListener' in document,
        supportsRange = 'createRange' in document,
        supportsCssSetProperty = 'setProperty' in helperDiv.style;

    function isString(value) {
        return typeof value === 'string';
    }

    function isArray(value) {
        return value instanceof Array;
    }

    function isFunction(value) {
        return typeof value === 'function';
    }

    function norm(node, oldNode) {
        var type = typeof node;
        return (type === 'string') ? {tag: '#', children: node} : (type === 'function') ? norm(node(oldNode), oldNode) : node;
    }

    function normIndex(children, i, oldChild) {
        var origChild = children[i],
            child = norm(origChild, oldChild);
        if (origChild !== child) {
            children[i] = child;
        }
        return child;
    }

    function normChildren(node, children, oldChildren) {
        var origChildren = children, tag;
        if (isFunction(children)) {
            children = children(oldChildren);
        }
        if (!isArray(children)) {
            // Empty text and html nodes must be ignored
            children = (children && (children.children || ((tag = children.tag) !== '#' && tag !== '<'))) ? [children] : [];
        }
        if (origChildren !== children) {
            node.children = children;
        }
        return children;
    }

    function moveChild(domElement, child, nextChild) {
        var domChild = child.dom, domLength = child.domLength || 1,
            domNextChild,
            domRefChild = nextChild && nextChild.dom;
        while (domLength--) {
            domNextChild = (domLength > 0) ? domChild.nextSibling : null;
            if (domRefChild) {
                domElement.insertBefore(domChild, domRefChild);
            } else {
                domElement.appendChild(domChild);
            }
            domChild = domNextChild;
        }
    }

    function insertBeforeHTML(domParent, html, domNextChild) {
        if (domNextChild.nodeType === 1) {
            domNextChild.insertAdjacentHTML('beforebegin', html);
        } else {
            helperDiv.innerHTML = html;
            for (var domChild; domChild = helperDiv.firstChild;) { // jshint ignore:line
                domParent.insertBefore(domChild, domNextChild);
            }
        }
    }

    function createNode(node, domParent, parent, nextChild, replace) { // TODO parent namespace instead of parent?
        var domNode, domNextChild,
            tag = node.tag, children = node.children;
        switch (tag) {
            case '#':
                domNode = document.createTextNode(children);
                break;
            case '!':
                domNode = document.createComment(children);
                break;
            case '<':
                if (children) {
                    var domChildren = domParent.childNodes,
                        prevLength = domChildren.length;
                    if (nextChild) {
                        domNextChild = nextChild.dom;
                        var domPrevChild = domNextChild.previousSibling;
                        insertBeforeHTML(domParent, children, domNextChild);
                        node.dom = domPrevChild ? domPrevChild.nextSibling : domParent.firstChild;
                    } else {
                        domParent.insertAdjacentHTML('beforeend', children);
                        node.dom = domChildren[prevLength];
                    }
                    node.domLength = domChildren.length - prevLength;
                    if (replace && nextChild) {
                        removeChild(domParent, nextChild);
                    }
                    return;
                } else {
                    // TODO handle node without dom instead
                    domNode = document.createTextNode('');
                }
                break;
            default:
                var namespace;
                switch (tag) {
                    case 'svg': namespace = 'http://www.w3.org/2000/svg'; break;
                    case 'math': namespace = 'http://www.w3.org/1998/Math/MathML'; break;
                    default: namespace = parent && parent.ns; break;
                }
                if (namespace) {
                    node.ns = namespace;
                    domNode = document.createElementNS(namespace, tag);
                } else {
                    domNode = document.createElement(tag);
                }
                updateElement(domNode, null, null, node, tag, node.attrs, node.events);
                children = normChildren(node, children);
                createChildren(domNode, node, children, 0, children.length);
                break;
        }
        node.dom = domNode;
        if (domParent) {
            if (nextChild) {
                domNextChild = nextChild.dom;
                if (replace) {
                    var domLength = nextChild.domLength || 1;
                    if (domLength === 1) {
                        destroyNode(nextChild);
                        domParent.replaceChild(domNode, domNextChild);
                    } else {
                        domParent.insertBefore(domNode, domNextChild);
                        removeChild(domParent, nextChild);
                    }
                } else {
                    domParent.insertBefore(domNode, domNextChild);
                }
            } else {
                domParent.appendChild(domNode);
            }
        }
    }

    function updateElement(domElement, oldAttrs, oldEvents, element, tag, attrs, events) {
        // Attributes
        var attrName;
        if (attrs) {
            for (attrName in attrs) {
                var attrValue = attrs[attrName];
                if (attrName === 'style') {
                    var oldAttrValue = oldAttrs && oldAttrs[attrName];
                    if (oldAttrValue !== attrValue) {
                        updateStyle(domElement, oldAttrValue, attrs, attrValue);
                    }
                } else if (isInputProperty(tag, attrName)) {
                    if (domElement[attrName] !== attrValue) {
                        domElement[attrName] = attrValue;
                    }
                } else if (!oldAttrs || oldAttrs[attrName] !== attrValue) {
                    if (attrValue === false) {
                        domElement.removeAttribute(attrName);
                    } else {
                        if (attrValue === true) {
                            attrValue = '';
                        }
                        var colonIndex = attrName.indexOf(':'), namespace;
                        if (colonIndex !== -1) {
                            var prefix = attrName.substr(0, colonIndex);
                            switch (prefix) {
                                case 'xlink':
                                    namespace = 'http://www.w3.org/1999/xlink';
                                    break;
                            }
                        }
                        if (namespace) {
                            domElement.setAttributeNS(namespace, attrName, attrValue);
                        } else {
                            domElement.setAttribute(attrName, attrValue);
                        }
                    }
                }
            }
        }
        if (oldAttrs) {
            for (attrName in oldAttrs) {
                if (!attrs || attrs[attrName] === undefined) {
                    if (isInputProperty(tag, attrName)) {
                        domElement[attrName] = '';
                    } else {
                        domElement.removeAttribute(attrName);
                    }
                }
            }
        }

        // Events
        var eventType;
        if (events) {
            domElement.virtualNode = element;
            for (eventType in events) {
                if (!oldEvents || !oldEvents[eventType]) {
                    addEventHandler(domElement, eventType);
                }
            }
        }
        if (oldEvents) {
            for (eventType in oldEvents) {
                if (!events || !events[eventType]) {
                    removeEventHandler(domElement, eventType);
                }
            }
        }
    }

    function updateStyle(domElement, oldStyle, attrs, style) {
        var propName;
        if (!isString(style) && (!supportsCssSetProperty || !oldStyle || isString(oldStyle))) {
            var styleStr = '';
            if (style) {
                for (propName in style) {
                    styleStr += propName + ': ' + style[propName] + '; ';
                }
            }
            style = styleStr;
            if (!supportsCssSetProperty) {
                attrs.style = style;
            }
        }
        var domStyle = domElement.style;
        if (isString(style)) {
            domStyle.cssText = style;
        } else {
            if (style) {
                for (propName in style) {
                    // TODO should important properties even be supported?
                    var propValue = style[propName];
                    if (!oldStyle || oldStyle[propName] !== propValue) {
                        var importantIndex = propValue.indexOf('!important');
                        if (importantIndex !== -1) {
                            domStyle.setProperty(propName, propValue.substr(0, importantIndex), 'important');
                        } else {
                            if (oldStyle) {
                                var oldPropValue = oldStyle[propName];
                                if (oldPropValue && oldPropValue.indexOf('!important') !== -1) {
                                    domStyle.removeProperty(propName);
                                }
                            }
                            domStyle.setProperty(propName, propValue, '');
                        }
                    }
                }
            }
            if (oldStyle) {
                for (propName in oldStyle) {
                    if (!style || style[propName] === undefined) {
                        domStyle.removeProperty(propName);
                    }
                }
            }
        }
    }

    function isInputProperty(tag, attrName) {
        switch (tag) {
            case 'input':
                return attrName === 'value' || attrName === 'checked';
            case 'textarea':
                return attrName === 'value';
            case 'select':
                return attrName === 'selectedIndex';
            case 'option':
                return attrName === 'selected';
        }
    }

    function addEventHandler(domElement, type) {
        if (supportsEventListener) {
            domElement.addEventListener(type, eventHandler, false);
        } else {
            var onType = 'on' + type;
            if (onType in domElement) {
                domElement[onType] = eventHandler;
            } else {
                domElement.attachEvent(onType, eventHandler);
            }
        }
    }

    function removeEventHandler(domElement, type) {
        if (supportsEventListener) {
            domElement.removeEventListener(type, eventHandler, false);
        } else {
            var onType = 'on' + type;
            if (onType in domElement) {
                domElement[onType] = null;
            } else {
                domElement.detachEvent(onType, eventHandler);
            }
        }
    }

    function getTextIfTextNode(node) {
        return isString(node) ? node : (node.tag === '#') ? node.children : null;
    }

    function createChildren(domElement, element, children, i, to, nextChild) {
        if (i === 0 && to === 1 && children.length === 1) {
            var onlyChild = children[0],
                onlyChildText = getTextIfTextNode(onlyChild);
            if (onlyChildText !== null) {
                setTextContent(domElement, onlyChildText);
                return;
            } else if (onlyChild.tag === '<') {
                domElement.innerHTML = onlyChild.children;
                return;
            }
        }
        for (; i < to; i++) {
            createNode(normIndex(children, i), domElement, element, nextChild);
        }
    }

    var range = supportsRange ? document.createRange() : null;

    function removeChildren(domElement, children, i, to) {
        if (i === 0 && to === 1 && children.length === 1) {
            var onlyChild = children[0];
            if (getTextIfTextNode(onlyChild) !== null || onlyChild.tag === '<') {
                for (var domChild; domChild = domElement.firstChild;) { // jshint ignore:line
                    domElement.removeChild(domChild);
                }
                return;
            }
        }
        for (; i < to; i++) {
            removeChild(domElement, children[i]);
        }
        // TODO use range for better performance with many children
        // TODO use setStartBefore/setEndAfter for faster range delete
        /*
         } else if (hasRange && count === children.length) {
            for (i = from; i < to; i++) {
                destroyNode(children[i]);
            }
            range.selectNodeContents(domElement);
            range.deleteContents();
         */
    }

    function removeChild(domElement, child) {
        destroyNode(child);
        var domChild = child.dom, domLength = child.domLength || 1,
            domNextChild;
        while (domLength--) {
            domNextChild = (domLength > 0) ? domChild.nextSibling : null;
            domElement.removeChild(domChild);
            domChild = domNextChild;
        }
    }

    function setTextContent(domElement, text) {
        if (supportsTextContent) {
            domElement.textContent = text;
        } else {
            domElement.innerText = text;
        }
    }

    function updateChildren(domElement, element, oldChildren, children) {
        // Update only child optimization for text and html nodes
        var oldEndIndex = oldChildren.length - 1, endIndex = children.length - 1,
            oldOnlyChild;
        if (endIndex === 0) {
            var onlyChild = children[0],
                onlyChildText = getTextIfTextNode(onlyChild);
            oldOnlyChild = oldChildren[0];
            if (onlyChildText !== null) {
                if (oldEndIndex !== 0 || onlyChildText !== getTextIfTextNode(oldOnlyChild)) {
                    destroyNodes(oldChildren); // TODO avoid for same node type
                    setTextContent(domElement, onlyChildText);
                    return;
                }
            } else if (onlyChild.tag === '<') {
                if (oldEndIndex !== 0 || oldOnlyChild.tag !== '<' || oldOnlyChild.children !== onlyChild.children) {
                    destroyNodes(oldChildren); // TODO avoid for same node type
                    domElement.innerHTML = onlyChild.children;
                    return;
                }
            }
        }

        // Update multiple children
        if (oldEndIndex === 0) {
            oldOnlyChild = normIndex(oldChildren, 0);
            oldOnlyChild.dom = domElement.firstChild;
            if (oldOnlyChild.tag === '<') {
                oldOnlyChild.domLength = domElement.childNodes.length;
            }
        }

        var oldStartIndex = 0, startIndex = 0,
            successful = true;
        outer: while (successful && oldStartIndex <= oldEndIndex && startIndex <= endIndex) {
            successful = false;
            var oldStartChild, oldEndChild, startChild, endChild;

            oldStartChild = oldChildren[oldStartIndex];
            startChild = normIndex(children, startIndex, oldStartChild);
            while (oldStartChild.key === startChild.key) {
                updateNode(oldStartChild, startChild, domElement, element);
                oldStartIndex++; startIndex++;
                if (oldStartIndex > oldEndIndex || startIndex > endIndex) {
                    break outer;
                }
                oldStartChild = oldChildren[oldStartIndex];
                startChild = normIndex(children, startIndex, oldStartChild);
                successful = true;
            }
            oldEndChild = oldChildren[oldEndIndex];
            endChild = normIndex(children, endIndex, oldEndChild);
            while (oldEndChild.key === endChild.key) {
                updateNode(oldEndChild, endChild, domElement, element);
                oldEndIndex--; endIndex--;
                if (oldStartIndex > oldEndIndex || startIndex > endIndex) {
                    break outer;
                }
                oldEndChild = oldChildren[oldEndIndex];
                endChild = normIndex(children, endIndex);
                successful = true;
            }
            while (oldStartChild.key === endChild.key) {
                updateNode(oldStartChild, endChild, domElement, element);
                moveChild(domElement, endChild, children[endIndex + 1]);
                oldStartIndex++; endIndex--;
                if (oldStartIndex > oldEndIndex || startIndex > endIndex) {
                    break outer;
                }
                oldStartChild = oldChildren[oldStartIndex];
                endChild = normIndex(children, endIndex);
                successful = true;
            }
            while (oldEndChild.key === startChild.key) {
                updateNode(oldEndChild, startChild, domElement, element);
                moveChild(domElement, startChild, oldChildren[oldStartIndex]);
                oldEndIndex--; startIndex++;
                if (oldStartIndex > oldEndIndex || startIndex > endIndex) {
                    break outer;
                }
                oldEndChild = oldChildren[oldEndIndex];
                startChild = normIndex(children, startIndex);
                successful = true;
            }
        }

        if (oldStartIndex > oldEndIndex) {
            createChildren(domElement, element, children, startIndex, endIndex + 1, normIndex(children, endIndex + 1));
        } else if (startIndex > endIndex) {
            removeChildren(domElement, oldChildren, oldStartIndex, oldEndIndex + 1);
        } else {
            // TODO optimize: create map with shorter list
            var i, oldChild,
                oldNextChild = oldChildren[oldEndIndex + 1],
                oldChildrenMap = {};
            for (i = oldEndIndex; i >= oldStartIndex; i--) {
                oldChild = oldChildren[i];
                oldChild.next = oldNextChild;
                oldChildrenMap[oldChild.key] = oldChild;
                oldNextChild = oldChild;
            }
            var nextChild = normIndex(children, endIndex + 1);
            for (i = endIndex; i >= startIndex; i--) {
                var child = children[i],
                    key = child.key;
                oldChild = oldChildrenMap[key];
                if (oldChild) {
                    oldChildrenMap[key] = null;
                    oldNextChild = oldChild.next;
                    updateNode(oldChild, child, element);
                    if ((oldNextChild && oldNextChild.key) !== (nextChild && nextChild.key)) {
                        moveChild(domElement, child, nextChild);
                    }
                } else {
                    createNode(child, domElement, element, nextChild);
                }
                nextChild = child;
            }
            for (i = oldStartIndex; i <= oldEndIndex; i++) {
                oldChild = oldChildren[i];
                if (oldChildrenMap[oldChild.key] !== null) {
                    removeChild(domElement, oldChild);
                }
            }
        }
    }

    var stopImmediate = false;

    function eventHandler(event) {
        event = getFixedEvent(event, this); // jshint ignore:line
        var currentTarget = event.currentTarget,
            eventHandlers = currentTarget.virtualNode.events[event.type];
        if (isArray(eventHandlers)) {
            for (var i = 0, len = eventHandlers.length; i < len; i++) {
                callEventHandler(eventHandlers[i], currentTarget, event);
                if (stopImmediate) {
                    stopImmediate = false;
                    break;
                }
            }
        } else {
            callEventHandler(eventHandlers, currentTarget, event);
        }
    }

    // jshint ignore:start
    function preventDefault() {
        this.defaultPrevented = true;
        this.returnValue = false;
    }
    function stopPropagation() {
        this.cancelBubble = true;
    }
    function stopImmediatePropagation() {
        stopImmediate = true;
        this.stopPropagation();
    }
    // jshint ignore:end

    function getFixedEvent(event, thisArg) {
        if (!event) {
            event = window.event;
            if (!event.preventDefault) {
                event.preventDefault = preventDefault;
                event.stopPropagation = stopPropagation;
                event.defaultPrevented = (event.returnValue === false);
                event.target = event.srcElement;
            }
            event.currentTarget = thisArg.nodeType ? thisArg : event.target; // jshint ignore:line
            // TODO further event normalization
        }
        event.stopImmediatePropagation = stopImmediatePropagation;
        return event;
    }

    function callEventHandler(eventHandler, currentTarget, event) {
        try {
            if (eventHandler.call(currentTarget, event) === false) {
                event.preventDefault();
            }
        } catch (e) {
            console.error(e.stack || e);
        }
    }

    function updateNode(oldNode, node, domParent, parent) {
        var tag = node.tag;
        if (oldNode.tag !== tag) {
            createNode(node, domParent, parent, oldNode, true);
        } else {
            var domNode = oldNode.dom,
                oldChildren = oldNode.children,
                children = node.children;
            switch (tag) {
                case '#':
                case '!':
                    if (oldChildren !== children) {
                        domNode.nodeValue = children;
                    }
                    break;
                case '<':
                    if (oldChildren !== children) {
                        createNode(node, domParent, parent, oldNode, true);
                    } else {
                        node.dom = oldNode.dom;
                        node.domLength = oldNode.domLength;
                    }
                    return;
                default:
                    updateElement(domNode, oldNode.attrs, oldNode.events, node, tag, node.attrs, node.events);
                    updateChildren(domNode, node, oldChildren, normChildren(node, children, oldChildren));
                    break;
            }
            node.dom = domNode;
        }
    }

    function destroyNode(node) {
        if (!isString(node)) {
            var domNode = node.dom;
            if (domNode) {
                var events = node.events;
                if (events) {
                    for (var eventType in events) {
                        removeEventHandler(domNode, eventType);
                    }
                }
                if (domNode.virtualNode) {
                    domNode.virtualNode = undefined;
                }
            }
            // TODO call callback
            var children = node.children;
            if (!isString(children)) {
                destroyNodes(children);
            }
        }
    }

    function destroyNodes(nodes) {
        for (var i = 0, len = nodes.length; i < len; i++) {
            destroyNode(nodes[i]);
        }
    }

    function writeObject(source, target) {
        var key;
        for (key in source) {
            target[key] = source[key];
        }
        for (key in target) {
            if (source[key] === undefined) {
                target[key] = undefined;
            }
        }
    }

    var vdom = cito.vdom = {
        create: function (node) {
            node = norm(node);
            createNode(node);
            return node;
        },
        append: function (domParent, node) {
            node = vdom.create(node);
            domParent.appendChild(node.dom);
            return node;
        },
        update: function (oldNode, node) {
            node = norm(node, oldNode);
            updateNode(oldNode, node, oldNode.dom.parentNode);
            writeObject(node, oldNode);
            return oldNode;
        },
        remove: function (node) {
            var domParent = node.dom.parentNode;
            removeChild(domParent, node);
        }
    };

})(cito, window);