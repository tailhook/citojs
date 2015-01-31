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

    function isPromise(value) {
        return value.then !== undefined;
    }

    function norm(node, oldNode) {
        var type = typeof node;
        if (type === 'string') {
            node = {tag: '#', children: node};
        } else if (type === 'function') {
            node = node(oldNode);
            node = (node === undefined) ? oldNode : norm(node, oldNode);
        }
        return node;
    }

    function normIndex(children, i, oldChild) {
        var origChild = children[i], child;
        if (origChild && isPromise(origChild)) {
            child = {};
            var immediate = true;
            origChild.then(function (newChild) {
                if (immediate) {
                    child = norm(newChild, oldChild);
                } else if (children[i] === child) {
                    vdom.update(child, newChild);
                }
            });
            immediate = false;
        } else {
            child = norm(origChild, oldChild);
        }
        if (origChild !== child) {
            children[i] = child;
        }
        return child;
    }

    function normChildren(node, children, oldChildren) {
        var origChildren = children, tag;
        if (children) {
            // TODO move promise support into utility function
            if (isPromise(children)) {
                children = [];
                var immediate = true;
                origChildren.then(function (newChildren) {
                    if (immediate) {
                        children = normChildren(node, newChildren, oldChildren);
                    }
                    // TODO if the parent has been updated too, then this is misleading
                    else if (node.children === children) {
                        vdom.updateChildren(node, newChildren);
                    }
                });
                immediate = false;
            } else if (isFunction(children)) {
                children = children(oldChildren);
                if (children === undefined) {
                    children = oldChildren;
                }
            }
        }
        // TODO convert to array only after only child optimization
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
        if (domChild !== domRefChild) {
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
    }

    function insertAdjacentHTML(node, position, htmlContent) {
        if (node.insertAdjacentHTML) {
            node.insertAdjacentHTML(position, htmlContent);
        } else {
            var child;
            helperDiv.innerHTML = htmlContent;
            if (position === 'beforebegin') {
                var parentNode = node.parentNode;
                while (child = helperDiv.firstChild) { // jshint ignore:line
                    parentNode.insertBefore(child, node);
                }
            } else if (position === 'beforeend') {
                while (child = helperDiv.firstChild) { // jshint ignore:line
                    node.appendChild(child);
                }
            } else {
                throw new Error('Unsupported: ' + position);
            }
        }
    }

    function insertChild(domParent, domNode, nextChild, replace) {
        if (nextChild) {
            var domNextChild = nextChild.dom;
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

    function createNode(node, domParent, parentNs, hasDomSiblings, nextChild, replace) {
        var domNode, tag = node.tag, children = node.children;
        if (!tag) {
            createFragment(node, children, domParent, parentNs, hasDomSiblings, nextChild, replace);
        } else {
            // Element
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
                            var domNextChild = nextChild.dom,
                                domPrevChild = domNextChild.previousSibling;
                            insertAdjacentHTML(domNextChild, 'beforebegin', children);
                            domNode = domPrevChild ? domPrevChild.nextSibling : domParent.firstChild;
                        } else {
                            insertAdjacentHTML(domParent, 'beforeend', children);
                            domNode = domChildren[prevLength];
                        }
                        node.dom = domNode;
                        node.domLength = domChildren.length - prevLength;
                        if (replace && nextChild) {
                            removeChild(domParent, nextChild);
                        }
                        return;
                    } else {
                        // TODO find solution without dom placeholder
                        domNode = document.createTextNode('');
                    }
                    break;
                default:
                    var ns;
                    switch (tag) {
                        case 'svg': ns = 'http://www.w3.org/2000/svg'; break;
                        case 'math': ns = 'http://www.w3.org/1998/Math/MathML'; break;
                        default: ns = parentNs; break;
                    }
                    if (ns) {
                        node.ns = ns;
                        domNode = document.createElementNS(ns, tag);
                    } else {
                        domNode = document.createElement(tag);
                    }
                    node.dom = domNode;
                    children = normChildren(node, children);
                    createChildren(domNode, node, ns, children, 0, children.length, children.length > 1);
                    updateElement(domNode, null, null, node, tag, node.attrs, node.events);
                    if (domParent) {
                        insertChild(domParent, domNode, nextChild, replace);
                    }
                    return;
            }
            node.dom = domNode;
            if (domParent) {
                insertChild(domParent, domNode, nextChild, replace);
            }
        }
    }

    function createFragment(node, children, domParent, parentNs, hasDomSiblings, nextChild, replace) {
        children = normChildren(node, children);
        var domNode, domLength,
            childrenLength = children.length;
        if (parentNs) {
            node.ns = parentNs;
        }
        if (childrenLength === 0) {
            // TODO find solution without dom placeholder
            domNode = document.createTextNode('');
            insertChild(domParent, domNode, nextChild, replace);
        } else {
            hasDomSiblings = hasDomSiblings || childrenLength > 1;
            domLength = 0;
            for (var i = 0; i < childrenLength; i++) {
                var child = normIndex(children, i);
                createNode(child, domParent, parentNs, hasDomSiblings, nextChild, false);
                domLength += child.domLength || 1;
            }
            domNode = children[0].dom;
            if (replace) {
                removeChild(domParent, nextChild);
            }
        }
        node.dom = domNode;
        node.domLength = domLength;
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
                        var colonIndex = attrName.indexOf(':'), ns;
                        if (colonIndex !== -1) {
                            var prefix = attrName.substr(0, colonIndex);
                            switch (prefix) {
                                case 'xlink':
                                    ns = 'http://www.w3.org/1999/xlink';
                                    break;
                            }
                        }
                        if (ns) {
                            domElement.setAttributeNS(ns, attrName, attrValue);
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
                return attrName === 'value' || attrName === 'selectedIndex';
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
                // TODO bind element to event handler + tests
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

    function createChildren(domElement, element, parentNs, children, i, to, hasDomSiblings, nextChild) {
        if (i === 0 && to === 1 && !hasDomSiblings) {
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
            createNode(normIndex(children, i), domElement, parentNs, hasDomSiblings, nextChild);
        }
    }

    var range = supportsRange ? document.createRange() : null;

    function removeChildren(domElement, children, i, to) {
        if (i === 0 && to === 1 && children.length === 1) {
            var onlyChild = children[0];
            if (!onlyChild.dom) {
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

    function updateOnlyChild(domElement, oldChildren, oldEndIndex, children) {
        var child = children[0], oldChild = oldChildren[0],
            childText = getTextIfTextNode(child),
            update = (oldEndIndex !== 0),
            sameType = false;
        if (childText !== null) {
            if (!update) {
                var oldChildText = getTextIfTextNode(oldChild);
                sameType = (oldChildText !== null);
                update = (childText !== oldChildText);
            }
            if (update) {
                if (!sameType) {
                    destroyNodes(oldChildren);
                }
                setTextContent(domElement, childText);
            }
        } else if (child.tag === '<') {
            if (!update) {
                sameType = (oldChild.tag === '<');
                update = !sameType || (child.children !== oldChild.children);
            }
            if (update) {
                if (!sameType) {
                    destroyNodes(oldChildren);
                }
                domElement.innerHTML = child.children;
            }
        } else {
            update = false;
        }
        return update || sameType;
    }

    function updateChildren(domElement, element, ns, oldChildren, children, hasDomSiblings, outerNextChild) {
        children = normChildren(element, children, oldChildren);
        if (children === oldChildren) {
            return;
        }

        var oldEndIndex = oldChildren.length - 1,
            endIndex = children.length - 1;
        hasDomSiblings = hasDomSiblings || endIndex > 0;
        if (endIndex === 0 && !hasDomSiblings && updateOnlyChild(domElement, oldChildren, oldEndIndex, children)) {
            return;
        }

        if (oldEndIndex === 0) {
            var oldOnlyChild = normIndex(oldChildren, 0);
            if (!oldOnlyChild.dom) {
                oldOnlyChild.dom = domElement.firstChild;
                if (oldOnlyChild.tag === '<') {
                    oldOnlyChild.domLength = domElement.childNodes.length;
                }
            }
        }

        var oldStartIndex = 0, startIndex = 0,
            successful = true,
            nextChild;
        outer: while (successful && oldStartIndex <= oldEndIndex && startIndex <= endIndex) {
            successful = false;
            var oldStartChild, oldEndChild, startChild, endChild;

            oldStartChild = oldChildren[oldStartIndex];
            startChild = normIndex(children, startIndex, oldStartChild);
            while (oldStartChild.key === startChild.key) {
                nextChild = oldChildren[oldStartIndex + 1] || outerNextChild;
                updateNode(oldStartChild, startChild, domElement, ns, hasDomSiblings, nextChild);
                oldStartIndex++; startIndex++;
                if (oldStartIndex > oldEndIndex || startIndex > endIndex) {
                    break outer;
                }
                oldStartChild = oldChildren[oldStartIndex];
                startChild = normIndex(children, startIndex, oldStartChild);
                successful = true;
            }
            oldEndChild = oldChildren[oldEndIndex];
            endChild = normIndex(children, endIndex);
            while (oldEndChild.key === endChild.key) {
                nextChild = children[endIndex + 1] || outerNextChild;
                updateNode(oldEndChild, endChild, domElement, ns, hasDomSiblings, nextChild);
                oldEndIndex--; endIndex--;
                if (oldStartIndex > oldEndIndex || startIndex > endIndex) {
                    break outer;
                }
                oldEndChild = oldChildren[oldEndIndex];
                endChild = normIndex(children, endIndex);
                successful = true;
            }
            while (oldStartChild.key === endChild.key) {
                nextChild = children[endIndex + 1] || outerNextChild;
                updateNode(oldStartChild, endChild, domElement, ns, hasDomSiblings, nextChild);
                moveChild(domElement, endChild, nextChild);
                oldStartIndex++; endIndex--;
                if (oldStartIndex > oldEndIndex || startIndex > endIndex) {
                    break outer;
                }
                oldStartChild = oldChildren[oldStartIndex];
                endChild = normIndex(children, endIndex);
                successful = true;
            }
            while (oldEndChild.key === startChild.key) {
                nextChild = oldChildren[oldStartIndex] || outerNextChild;
                updateNode(oldEndChild, startChild, domElement, ns, nextChild);
                moveChild(domElement, startChild, nextChild);
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
            nextChild = normIndex(children, endIndex + 1) || outerNextChild;
            createChildren(domElement, element, ns, children, startIndex, endIndex + 1, hasDomSiblings, nextChild);
        } else if (startIndex > endIndex) {
            removeChildren(domElement, oldChildren, oldStartIndex, oldEndIndex + 1);
        } else {
            var i, oldChild,
                oldNextChild = oldChildren[oldEndIndex + 1],
                oldChildrenMap = {};
            for (i = oldEndIndex; i >= oldStartIndex; i--) {
                oldChild = oldChildren[i];
                oldChild.next = oldNextChild;
                oldChildrenMap[oldChild.key] = oldChild;
                oldNextChild = oldChild;
            }
            nextChild = normIndex(children, endIndex + 1) || outerNextChild;
            for (i = endIndex; i >= startIndex; i--) {
                var child = children[i],
                    key = child.key;
                oldChild = oldChildrenMap[key];
                if (oldChild) {
                    oldChildrenMap[key] = null;
                    oldNextChild = oldChild.next;
                    updateNode(oldChild, child, domElement, ns, hasDomSiblings, nextChild);
                    if ((oldNextChild && oldNextChild.key) !== (nextChild && nextChild.key)) {
                        moveChild(domElement, child, nextChild);
                    }
                } else {
                    createNode(child, domElement, ns, hasDomSiblings, nextChild);
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

    function updateNode(oldNode, node, domParent, parentNs, hasDomSiblings, nextChild) {
        if (node === oldNode) {
            return;
        }

        var domNode, tag = node.tag,
            oldChildren = oldNode.children, children = node.children;
        if (oldNode.tag !== tag) {
            createNode(node, domParent, parentNs, hasDomSiblings, oldNode, true);
        } else if (!tag) {
            updateFragment(oldNode, oldChildren, node, children, domParent, parentNs, hasDomSiblings, nextChild);
        } else {
            // Element
            domNode = oldNode.dom;
            switch (tag) {
                case '#':
                case '!':
                    if (oldChildren !== children) {
                        domNode.nodeValue = children;
                    }
                    node.dom = domNode;
                    break;
                case '<':
                    if (oldChildren !== children) {
                        createNode(node, domParent, ns, hasDomSiblings, oldNode, true);
                    } else {
                        node.dom = oldNode.dom;
                        node.domLength = oldNode.domLength;
                    }
                    break;
                default:
                    var ns = oldNode.ns;
                    if (ns) node.ns = ns;
                    node.dom = domNode;
                    updateChildren(domNode, node, ns, oldChildren, children, false);
                    updateElement(domNode, oldNode.attrs, oldNode.events, node, tag, node.attrs, node.events);
                    break;
            }
        }
    }

    function updateFragment(oldNode, oldChildren, node, children, domParent, parentNs, hasDomSiblings, nextChild) {
        children = normChildren(node, children, oldChildren);
        if (children === oldChildren) {
            return;
        }

        var domNode, domLength,
            oldChildrenLength = oldChildren.length,
            childrenLength = children.length;
        if (parentNs) {
            node.ns = parentNs;
        }
        hasDomSiblings = hasDomSiblings || childrenLength > 1;
        if (childrenLength === 0) {
            if (oldChildrenLength === 0) {
                domNode = oldNode.dom;
            } else {
                removeChildren(domParent, oldChildren, 0, oldChildren.length);
                // TODO find solution without dom placeholder
                domNode = document.createTextNode('');
                insertChild(domParent, domNode, nextChild);
            }
        } else if (oldChildrenLength === 0) {
            domParent.removeChild(oldNode.dom);
            createFragment(node, children, domParent, parentNs, hasDomSiblings, nextChild);
        } else {
            updateChildren(domParent, node, parentNs, oldChildren, children, hasDomSiblings, nextChild);
            if (childrenLength > 0) {
                domNode = children[0].dom;
                domLength = 0;
                // TODO should be done without extra loop/lazy
                for (var i = 0; i < childrenLength; i++) {
                    domLength += children[i].domLength || 1;
                }
            }
        }
        node.dom = domNode;
        node.domLength = domLength;
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

    function copyObjectProps(source, target) {
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
            // TODO should detect first whether the node has already been rendered
            updateNode(oldNode, node, oldNode.dom.parentNode);
            copyObjectProps(node, oldNode);
            return oldNode;
        },
        updateChildren: function (element, children) {
            var oldChildren = element.children;
            children = normChildren(element, children, oldChildren);
            updateChildren(element.dom, element, element.ns, oldChildren, children);
            element.children = children;
        },
        remove: function (node) {
            var domParent = node.dom.parentNode;
            removeChild(domParent, node);
        }
    };

})(cito, window);