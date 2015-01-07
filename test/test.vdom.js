/*
 * Copyright (c) 2015, Joel Richard
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

describe('cito.vdom', function () {

    // TODO separate data from code
    // TODO generate extensive test data automatically

    var domDefs = {
        'attrs div': [
            {
                name: 'none',
                node: {tag: 'div'},
                html: '<div></div>'
            },
            {
                name: 'null',
                node: {tag: 'div', attrs: null},
                html: '<div></div>'
            },
            {
                name: 'empty',
                node: {tag: 'div', attrs: {}},
                html: '<div></div>'
            },
            {
                name: 'id 1',
                node: {tag: 'div', attrs: {id: 'id1'}},
                html: '<div id="id1"></div>'
            },
            {
                name: 'id 2',
                node: {tag: 'div', attrs: {id: 'id2'}},
                html: '<div id="id2"></div>'
            },
            {
                name: 'id and class',
                node: {tag: 'div', attrs: {id: 'id1', 'class': 'class1'}},
                html: '<div id="id1" class="class1"></div>'
            }
        ],
        'attrs input': [
            {
                name: 'empty',
                node: {tag: 'input'},
                html: '<input>'
            },
            {
                name: 'required false',
                node: {tag: 'input', attrs: {required: false}},
                html: '<input>'
            },
            {
                name: 'required false',
                node: {tag: 'input', attrs: {required: true}},
                html: '<input required>'
            }
        ],
        'div': [
            {
                name: 'children none',
                node: {tag: 'div'},
                html: '<div></div>'
            },
            {
                name: 'children empty',
                node: {tag: 'div', children: []},
                html: '<div></div>'
            },
            {
                name: 'text',
                node: {tag: 'div', children: 'text'},
                html: '<div>text</div>'
            },
            {
                name: 'text array',
                node: {tag: 'div', children: ['text']},
                html: '<div>text</div>'
            },
            {
                name: 'two ul',
                node: {
                    tag: 'div', children: [
                        {tag: 'ul', children: [{tag: 'li', children: ['t0']}]},
                        {tag: 'ul', children: [{tag: 'li', children: ['t1']}, {tag: 'li', children: ['t2']}]}
                    ]
                },
                html: '<div><ul><li>t0</li></ul><ul><li>t1</li><li>t2</li></ul></div>'
            },
            {
                name: 'two ul reversed',
                node: {
                    tag: 'div', children: [
                        {tag: 'ul', children: [{tag: 'li', children: ['t1']}, {tag: 'li', children: ['t2']}]},
                        {tag: 'ul', children: [{tag: 'li', children: ['t0']}]}
                    ]
                },
                html: '<div><ul><li>t1</li><li>t2</li></ul><ul><li>t0</li></ul></div>'
            },
            {
                name: 'comment 1',
                node: {tag: 'div', children: {tag: '!', children: 'comment 1'}},
                html: '<div><!--comment 1--></div>'
            },
            {
                name: 'comment 2',
                node: {tag: 'div', children: {tag: '!', children: 'comment 2'}},
                html: '<div><!--comment 2--></div>'
            }
        ],
        'html': [
            {
                name: 'html empty',
                node: {
                    tag: 'div', children: {tag: '<', children: ''}
                },
                html: '<div></div>'
            },
            {
                name: 'html b',
                node: {
                    tag: 'div', children: {tag: '<', children: '<b>t0</b>'}
                },
                html: '<div><b>t0</b></div>'
            },
            {
                name: 'two html b',
                node: {
                    tag: 'div', children: {tag: '<', children: '<b>t0</b><b>t1</b>'}
                },
                html: '<div><b>t0</b><b>t1</b></div>'
            },
            {
                name: 'element b + html b',
                node: {
                    tag: 'div', children: [
                        {tag: 'b', children: 't0'},
                        {tag: '<', children: '<b>t1</b>'}
                    ]
                },
                html: '<div><b>t0</b><b>t1</b></div>'
            },
            {
                name: 'html b + element b',
                node: {
                    tag: 'div', children: [
                        {tag: '<', children: '<b>t0</b>'},
                        {tag: 'b', children: 't1'}
                    ]
                },
                html: '<div><b>t0</b><b>t1</b></div>'
            }
        ],
        'ul': [
            {
                name: 'empty',
                node: {
                    tag: 'ul',
                    children: []
                },
                html: '<ul></ul>'
            },
            {
                name: '2 li',
                node: {
                    tag: 'ul',
                    children: [
                        {tag: 'li', children: ['t0']},
                        {tag: 'li', children: ['t', '1']}
                    ]
                },
                html: '<ul><li>t0</li><li>t1</li></ul>'
            },
            {
                name: '3 li',
                node: {
                    tag: 'ul',
                    children: [
                        {tag: 'li', children: ['t', '0']},
                        {tag: 'li', children: ['t1']},
                        {tag: 'li', children: ['t2']}
                    ]
                },
                html: '<ul><li>t0</li><li>t1</li><li>t2</li></ul>'
            },
            {
                name: '5 li',
                node: {
                    tag: 'ul',
                    children: [
                        {tag: 'li', children: ['t0']},
                        {tag: 'li', children: ['t1']},
                        {tag: 'li', children: ['t2']},
                        {tag: 'li', children: ['t', '3']},
                        {tag: 'li', children: ['t', '4']}
                    ]
                },
                html: '<ul><li>t0</li><li>t1</li><li>t2</li><li>t3</li><li>t4</li></ul>'
            }
        ],
        'keyed ul': [
            {
                name: '0',
                node: {
                    tag: 'ul',
                    children: [{tag: 'li', key: 0, children: ['t0']}]
                },
                html: '<ul><li>t0</li></ul>'
            },
            {
                name: '1',
                node: {
                    tag: 'ul',
                    children: [{tag: 'li', key: 1, children: ['t1']}]
                },
                html: '<ul><li>t1</li></ul>'
            },
            {
                name: '2',
                node: {
                    tag: 'ul',
                    children: [{tag: 'li', key: 2, children: ['t2']}]
                },
                html: '<ul><li>t2</li></ul>'
            },
            {
                name: '9',
                node: {
                    tag: 'ul',
                    children: [{tag: 'li', key: 9, children: ['t9']}]
                },
                html: '<ul><li>t9</li></ul>'
            },
            {
                name: '0-1-2',
                node: {
                    tag: 'ul',
                    children: [
                        {tag: 'li', key: 0, children: ['t0']},
                        {tag: 'li', key: 1, children: ['t1']},
                        {tag: 'li', key: 2, children: ['t2']}
                    ]
                },
                html: '<ul><li>t0</li><li>t1</li><li>t2</li></ul>'
            },
            {
                name: '1-0-2',
                node: {
                    tag: 'ul',
                    children: [
                        {tag: 'li', key: 1, children: ['t1']},
                        {tag: 'li', key: 0, children: ['t0']},
                        {tag: 'li', key: 2, children: ['t2']}
                    ]
                },
                html: '<ul><li>t1</li><li>t0</li><li>t2</li></ul>'
            },
            {
                name: '0-2-1',
                node: {
                    tag: 'ul',
                    children: [
                        {tag: 'li', key: 0, children: ['t0']},
                        {tag: 'li', key: 2, children: ['t2']},
                        {tag: 'li', key: 1, children: ['t1']}
                    ]
                },
                html: '<ul><li>t0</li><li>t2</li><li>t1</li></ul>'
            },
            {
                name: '1-2',
                node: {
                    tag: 'ul',
                    children: [
                        {tag: 'li', key: 1, children: ['t1']},
                        {tag: 'li', key: 2, children: ['t2']}
                    ]
                },
                html: '<ul><li>t1</li><li>t2</li></ul>'
            },
            {
                name: '0-1',
                node: {
                    tag: 'ul',
                    children: [
                        {tag: 'li', key: 0, children: ['t0']},
                        {tag: 'li', key: 1, children: ['t1']}
                    ]
                },
                html: '<ul><li>t0</li><li>t1</li></ul>'
            },
            {
                name: '0-1-2-3-4',
                node: {
                    tag: 'ul',
                    children: [
                        {tag: 'li', key: 0, children: ['t0']},
                        {tag: 'li', key: 1, children: ['t1']},
                        {tag: 'li', key: 2, children: ['t2']},
                        {tag: 'li', key: 3, children: ['t3']},
                        {tag: 'li', key: 4, children: ['t4']}
                    ]
                },
                html: '<ul><li>t0</li><li>t1</li><li>t2</li><li>t3</li><li>t4</li></ul>'
            },
            {
                name: '4-3-2-1-0',
                node: {
                    tag: 'ul',
                    children: [
                        {tag: 'li', key: 4, children: ['t4']},
                        {tag: 'li', key: 3, children: ['t3']},
                        {tag: 'li', key: 2, children: ['t2']},
                        {tag: 'li', key: 1, children: ['t1']},
                        {tag: 'li', key: 0, children: ['t0']}
                    ]
                },
                html: '<ul><li>t4</li><li>t3</li><li>t2</li><li>t1</li><li>t0</li></ul>'
            },
            {
                name: '2-1-4-0-3',
                node: {
                    tag: 'ul',
                    children: [
                        {tag: 'li', key: 2, children: ['t2']},
                        {tag: 'li', key: 1, children: ['t1']},
                        {tag: 'li', key: 4, children: ['t4']},
                        {tag: 'li', key: 0, children: ['t0']},
                        {tag: 'li', key: 3, children: ['t3']}
                    ]
                },
                html: '<ul><li>t2</li><li>t1</li><li>t4</li><li>t0</li><li>t3</li></ul>'
            },
            {
                name: '4-1-2',
                node: {
                    tag: 'ul',
                    children: [
                        {tag: 'li', key: 4, children: ['t4']},
                        {tag: 'li', key: 1, children: ['t1']},
                        {tag: 'li', key: 2, children: ['t2']}
                    ]
                },
                html: '<ul><li>t4</li><li>t1</li><li>t2</li></ul>'
            }
        ],
        'style': [
            {
                name: 'none',
                node: {tag: 'div'},
                html: '<div></div>'
            },
            {
                name: 'null',
                node: {tag: 'div', attrs: {style: null}},
                html: '<div></div>'
            },
            {
                name: 'string empty',
                node: {tag: 'div', attrs: {style: ''}},
                html: '<div></div>'
            },
            {
                name: 'string color',
                node: {tag: 'div', attrs: {style: 'color: red;'}},
                html: '<div style="color: red;"></div>'
            },
            {
                name: 'string color and display',
                node: {tag: 'div', attrs: {style: 'color: red; display: inline;'}},
                html: '<div style="color: red; display: inline;"></div>'
            },
            {
                name: 'object empty',
                node: {tag: 'div', attrs: {style: {}}},
                html: '<div></div>'
            },
            {
                name: 'object color',
                node: {tag: 'div', attrs: {style: {color: 'red'}}},
                html: '<div style="color: red;"></div>'
            },
            {
                name: 'object color and display',
                node: {tag: 'div', attrs: {style: {color: 'red', display: 'inline'}}},
                html: '<div style="color: red; display: inline;"></div>'
            },
            {
                name: 'object color !important',
                node: {tag: 'div', attrs: {style: {color: 'red !important'}}},
                html: '<div style="color: red !important;"></div>'
            }
        ]
    };

    var ulTwoLi = {
        tag: 'ul',
        children: [
            {tag: 'li', children: 't0'},
            {tag: 'li', children: 't1'}
        ]
    };
    var twoLi = [
        {tag: 'li', children: 't0'},
        {tag: 'li', children: 't1'}
    ];
    var callbackOldNodes;
    var liFunc = function (oldNode) {
        callbackOldNodes && callbackOldNodes.push(oldNode);
        return {tag: 'li', children: 't'}
    };
    domDefs['callback'] = [
        {
            name: 'ul',
            node: function (oldNode) {
                callbackOldNodes && callbackOldNodes.push(oldNode);
                return _.cloneDeep(ulTwoLi);
            },
            html: '<ul><li>t0</li><li>t1</li></ul>',
            oldNodes: [ulTwoLi]
        },
        {
            name: 'ul children',
            node: {
                tag: 'ul',
                children: function (oldChildren) {
                    callbackOldNodes && callbackOldNodes.push(oldChildren);
                    return _.cloneDeep(twoLi);
                }
            },
            html: '<ul><li>t0</li><li>t1</li></ul>',
            oldNodes: [twoLi]
        },
        {
            name: 'ul li',
            node: {
                tag: 'ul',
                children: [liFunc, liFunc]
            },
            html: '<ul><li>t</li><li>t</li></ul>',
            oldNodes: [liFunc(), liFunc()]
        }
    ];

    var helperDiv = document.createElement('div');
    function supportsNamespace(tag) {
        helperDiv.innerHTML = '<' + tag + '>';
        var firstChild = helperDiv.firstChild;
        return firstChild ? firstChild.namespaceURI !== helperDiv.namespaceURI : false;
    }

    if (supportsNamespace('svg')) {
        var svgNamespaces = {
            'http://www.w3.org/2000/svg': ['svg', 'a', 'circle'],
            'http://www.w3.org/1999/xlink': ['xlink:href']
        };
        domDefs['svg'] = [
            {
                name: 'link',
                node: {
                    tag: 'svg',
                    attrs: {height: 20, width: 40},
                    children: {
                        tag: 'a',
                        attrs: {'xlink:href': 'http://link'},
                        children: {tag: 'text', attrs: {x: 0, y: 0}, children: 'link'}
                    }
                },
                html: '<svg height="20" width="40"><a xlink:href="http://link"><text x="0" y="0">link</text></a></svg>',
                namespaces: svgNamespaces
            },
            {
                name: 'circle',
                node: {
                    tag: 'svg',
                    attrs: {height: 40, width: 40},
                    children: {
                        tag: 'circle',
                        attrs: {cx: 20, cy: 20, r: 10, stroke: 'black', 'stroke-width': 1, fill: 'red'}
                    }
                },
                html: '<svg height="40" width="40"><circle cx="20" cy="20" r="10" stroke="black" stroke-width="1" fill="red"></circle></svg>',
                namespaces: svgNamespaces
            },
            {
                name: 'wrapped circle',
                node: {
                    tag: 'div',
                    children: {
                        tag: 'svg',
                        attrs: {height: 40, width: 40},
                        children: {
                            tag: 'circle',
                            attrs: {cx: 20, cy: 20, r: 10, stroke: 'black', 'stroke-width': 1, fill: 'red'}
                        }
                    }
                },
                html: '<div><svg height="40" width="40"><circle cx="20" cy="20" r="10" stroke="black" stroke-width="1" fill="red"></circle></svg></div>',
                namespaces: svgNamespaces
            }
        ];
    }
    if (supportsNamespace('math')) {
        var mathmlNamespaces = {
            'http://www.w3.org/1998/Math/MathML': ['math', 'mi', 'mo']
        };
        domDefs['mathml'] = [
            {
                name: 'a',
                node: {
                    tag: 'math',
                    children: {tag: 'mi', children: 'a'}
                },
                html: '<math><mi>a</mi></math>',
                namespaces: mathmlNamespaces
            },
            {
                name: 'a + b',
                node: {
                    tag: 'math',
                    children: [
                        {tag: 'mi', children: 'a'},
                        {tag: 'mo', children: '+'},
                        {tag: 'mi', children: 'b'}
                    ]
                },
                html: '<math><mi>a</mi><mo>+</mo><mi>b</mi></math>',
                namespaces: mathmlNamespaces
            },
            {
                name: 'a + c',
                node: {
                    tag: 'math',
                    children: [
                        {tag: 'mi', children: 'a'},
                        {tag: 'mo', children: '+'},
                        {tag: 'mi', children: 'c'}
                    ]
                },
                html: '<math><mi>a</mi><mo>+</mo><mi>c</mi></math>',
                namespaces: mathmlNamespaces
            }
        ];
    }

    describe('#create() DOM', function () {
        _.forEach(domDefs, function (defs, groupName) {
            describe(groupName, function () {
                _.forEach(defs, function (def) {
                    it(def.name, function () {
                        var node = cito.vdom.create(_.cloneDeep(def.node));
                        expect(node.dom).to.eqlDom(def.html);
                        verifyNamespaces(node.dom, def.namespaces);
                    });
                });
            });
        });
    });

    var inputPropDefs = [
        {
            name: 'input text',
            node1: {tag: 'input', attrs: {value: 'val1'}},
            node2: {tag: 'input', attrs: {value: 'val1'}},
            prop: 'value',
            value1: 'val1', value2: 'val1'
        },
        {
            name: 'input text change',
            node1: {tag: 'input', attrs: {value: 'val1'}},
            node2: {tag: 'input', attrs: {value: 'val2'}},
            prop: 'value',
            value1: 'val1', value2: 'val2'
        },
        {
            name: 'input text external change',
            node1: {tag: 'input', attrs: {value: 'val1'}},
            node2: {tag: 'input', attrs: {value: 'val2'}},
            prop: 'value',
            value1: 'val1', valueIn1: 'val in1', value2: 'val2'
        },
        {
            name: 'checkbox',
            node1: {tag: 'input', attrs: {type: 'checkbox', checked: false}},
            node2: {tag: 'input', attrs: {type: 'checkbox', checked: true}},
            prop: 'checked',
            value1: false, value2: true
        },
        {
            name: 'radio',
            node1: {tag: 'input', attrs: {type: 'radio', checked: true}},
            node2: {tag: 'input', attrs: {type: 'radio', checked: false}},
            prop: 'checked',
            value1: true, value2: false
        },
        {
            name: 'select change selected',
            node1: {tag: 'select', children: [{tag: 'option', attrs: {selected: true}, children: 'opt1'}, {tag: 'option', children: 'opt1'}]},
            node2: {tag: 'select', children: [{tag: 'option', children: 'opt1'}, {tag: 'option', attrs: {selected: true}, children: 'opt2'}]},
            prop: 'selectedIndex',
            value1: 0, value2: 1
        },
        {
            name: 'select change selectedIndex',
            node1: {tag: 'select', attrs: {selectedIndex: 0}, children: [{tag: 'option', children: 'opt1'}, {tag: 'option', children: 'opt1'}]},
            node2: {tag: 'select', attrs: {selectedIndex: 1}, children: [{tag: 'option', children: 'opt1'}, {tag: 'option', children: 'opt2'}]},
            prop: 'selectedIndex',
            value1: 0, value2: 1
        }
    ];

    var callbackEventDescs,
        customEventHandler;
    var nodeWithNestedEvents = {
        tag: 'div',
        events: {click: function (event) {
            callbackEventDescs.push('click outer');
            return customEventHandler && customEventHandler(event);
        }},
        children: {
            tag: 'div',
            events: {click: [
                function (event) {
                    callbackEventDescs.push('click inner 1');
                    return customEventHandler && customEventHandler(event);
                },
                function (event) {
                    callbackEventDescs.push('click inner 2');
                    return customEventHandler && customEventHandler(event);
                }
            ]}
        }
    };

    describe('#update()', function () {
        beforeEach(function () {
            callbackOldNodes = [];
        });
        afterEach(function () {
            callbackOldNodes = undefined;
        });

        describe('DOM', function () {
            _.forEach(domDefs, function (defs, groupName) {
                describe(groupName, function () {
                    forEachCombination(domDefs[groupName], function (def1, def2) {
                        it(def1.name + ' -> ' + def2.name, function () {
                            var node = cito.vdom.create(_.cloneDeep(def1.node));
                            node = cito.vdom.update(node, _.cloneDeep(def2.node));
                            expect(node.dom).to.eqlDom(def2.html);
                            verifyNamespaces(node.dom, def2.namespaces);
                        });
                    });
                });
            });
        });

        describe('DOM with callbacks', function () {
            _.forEach(domDefs['callback'], function (def) {
                it(def.name, function () {
                    var node = cito.vdom.create(_.cloneDeep(def.node));
                    callbackOldNodes = [];
                    cito.vdom.update(node, _.cloneDeep(def.node));
                    expect(comparableNodes(callbackOldNodes)).to.eql(def.oldNodes);
                });
            });
        });

        describe('input properties', function () {
            _.forEach(inputPropDefs, function (def) {
                it(def.name, function () {
                    var node = cito.vdom.create(_.cloneDeep(def.node1));
                    expect(node.dom[def.prop]).to.be(def.value1);
                    if (def.valueIn1) {
                        node.dom[def.prop] = def.valueIn1;
                        expect(node.dom[def.prop]).to.be(def.valueIn1);
                    }
                    cito.vdom.update(node, _.cloneDeep(def.node2));
                    expect(node.dom[def.prop]).to.be(def.value2);
                });
            });
        });

        describe('destroy', function () {
            var node;
            beforeEach(function () {
                node = cito.vdom.append(document.body, _.cloneDeep(nodeWithNestedEvents));
            });

            it('virtualNode properties', function () {
                expect(node.dom.virtualNode).to.be(node);
                expect(node.dom.firstChild.virtualNode).to.be(node.children);

                var domParent = node.dom, domChild = domParent.firstChild;
                cito.vdom.remove(node);

                expect(domParent.virtualNode).to.be(undefined);
                expect(domChild.virtualNode).to.be(undefined);
            });

            it('event handlers', function () {
                callbackEventDescs = [];
                dispatchEvent(node.dom.firstChild, createEvent('click'));
                expect(callbackEventDescs).to.have.length(3);

                var domChild = node.dom.firstChild;
                callbackEventDescs = [];
                cito.vdom.remove(node);

                dispatchEvent(domChild, createEvent('click'));
                expect(callbackEventDescs).to.have.length(0);
            });
        });
    });

    var callbackEventTypes;
    function testEventHandler(event) {
        callbackEventTypes.push(event.type);
    }
    function testExceptionEventHandler(event) {
        callbackEventTypes.push(event.type);
        throw new Error();
    }

    var eventDefs = [
        {
            name: 'none',
            node: {tag: 'div'},
            events: []
        },
        {
            name: 'null',
            node: {tag: 'div', events: null},
            events: []
        },
        {
            name: 'empty',
            node: {tag: 'div', events: {}},
            events: []
        },
        {
            name: 'click one',
            node: {tag: 'div', events: {click: testEventHandler}},
            events: ['click']
        },
        {
            name: 'click array two',
            node: {tag: 'div', events: {click: [testEventHandler, testEventHandler]}},
            events: ['click', 'click']
        },
        {
            name: 'click one + mouseover one',
            node: {tag: 'div', events: {click: testEventHandler, mouseover: testEventHandler}},
            events: ['click', 'mouseover']
        },
        {
            name: 'click exception + click exception',
            node: {tag: 'div', events: {click: [testExceptionEventHandler, testExceptionEventHandler]}},
            events: ['click', 'click']
        }
    ];

    describe('events', function () {
        describe('normalization', function () {
            var node, callbackEvent;
            beforeEach(function () {
                node = cito.vdom.append(document.body, {
                    tag: 'div',
                    events: {
                        click: function (event) {
                            callbackEvent = event;
                        }
                    }
                });
                dispatchEvent(node.dom, createEvent('click'));
            });
            afterEach(function () {
                cito.vdom.remove(node);
            });

            it('missing controls are added', function () {
                expect(callbackEvent).to.have.property('defaultPrevented', false);
                expect(callbackEvent.returnValue).not.to.be(false);
                expect(callbackEvent.preventDefault).to.be.a('function');
                expect(callbackEvent.stopPropagation).to.be.a('function');
                expect(callbackEvent.stopImmediatePropagation).to.be.a('function');
            });
        });

        describe('handlers', function () {
            var node;
            beforeEach(function () {
                callbackEventTypes = [];
            });
            afterEach(function () {
                callbackEventTypes = undefined;
                cito.vdom.remove(node);
            });

            forEachCombination(eventDefs, function (def1, def2) {
                it(def1.name + ' -> ' + def2.name, function () {
                    var allEvents = _.uniq(def1.events.concat(def2.events));
                    node = cito.vdom.append(document.body, _.cloneDeep(def1.node));
                    var createAndDispatchEvent = function (type) {
                        dispatchEvent(node.dom, createEvent(type));
                    };
                    _.forEach(allEvents, createAndDispatchEvent);
                    expect(callbackEventTypes.sort()).to.eql(def1.events.sort());

                    cito.vdom.update(node, _.cloneDeep(def2.node));
                    callbackEventTypes = [];
                    _.forEach(allEvents, createAndDispatchEvent);
                    expect(callbackEventTypes.sort()).to.eql(def2.events.sort());
                });
            });
        });

        describe('bubbling', function () {
            var node, callbackEvents;
            beforeEach(function () {
                callbackEventDescs = [];
                callbackEvents = [];
                node = cito.vdom.append(document.body, _.cloneDeep(nodeWithNestedEvents));
            });
            afterEach(function () {
                callbackEventDescs = undefined;
                callbackEvents = undefined;
                customEventHandler = undefined;
                cito.vdom.remove(node);
            });

            it('works', function () {
                dispatchEvent(node.dom.firstChild, createEvent('click'));
                expect(callbackEventDescs).to.eql(['click inner 1', 'click inner 2', 'click outer']);
            });

            it('stopPropagation() stops bubbling', function () {
                customEventHandler = function (event) {
                    event.stopPropagation();
                };
                dispatchEvent(node.dom.firstChild, createEvent('click'));
                expect(callbackEventDescs).to.eql(['click inner 1', 'click inner 2']);
            });

            it('stopImmediatePropagation() stops bubbling and other handlers', function () {
                customEventHandler = function (event) {
                    event.stopImmediatePropagation();
                };
                dispatchEvent(node.dom.firstChild, createEvent('click'));
                expect(callbackEventDescs).to.eql(['click inner 1']);
            });

            it('preventDefault() prevents default', function () {
                customEventHandler = function (event) {
                    callbackEvents.push(event);
                    event.preventDefault();
                };
                testPreventDefault();
            });

            it('return false prevents default', function () {
                customEventHandler = function (event) {
                    callbackEvents.push(event);
                    return false;
                };
                testPreventDefault();
            });

            function testPreventDefault() {
                dispatchEvent(node.dom.firstChild, createEvent('click'));
                expect(mapProp(callbackEvents, 'defaultPrevented')).to.eql([true, true, true]);
                expect(callbackEventDescs).to.have.length(3);
            }
        });
    });

    function forEachCombination(defs, callback) {
        _.forEach(defs, function (def1) {
            _.forEach(defs, function (def2) {
                callback(def1, def2);
            });
        });
    }

    function verifyNamespaces(node, namespaces, flat) {
        if (namespaces) {
            if (!flat) {
                var flatNamespaces = {};
                _.forEach(namespaces, function (tagsOrAttrs, namespace) {
                    _.forEach(tagsOrAttrs, function (tagOrAttr) {
                        flatNamespaces[tagOrAttr] = namespace;
                    });
                });
                namespaces = flatNamespaces;
            }
            var namespace = namespaces[node.tagName];
            if (namespace) {
                expect(node.namespaceURI).to.equal(namespace);
            }
            var attrs = node.attributes;
            for (var i = 0; i < attrs.length; i++) {
                var attr = attrs[i];
                namespace = namespaces[attr.name];
                if (namespace) {
                    var attrNamespace = attr.namespaceURI;
                    expect(attrNamespace).to.equal(namespace);
                }
            }
            _.forEach(node.children, function (child) {
                verifyNamespaces(child, namespaces, true);
            });
        }
    }

    function comparableNodes(nodes) {
        if (nodes) {
            if (_.isArray(nodes)) {
                _.forEach(nodes, comparableNodes);
            } else if (typeof nodes === 'object') {
                delete nodes.dom;
                comparableNodes(nodes.children);
            }
        }
        return nodes;
    }

    var supportsEventConstructor = true;
    try {
        new CustomEvent('custom');
    } catch (e) {
        supportsEventConstructor = false;
    }

    var helperEvent = createEvent('custom'), fixPreventDefault;
    if (helperEvent.preventDefault) {
        helperEvent.preventDefault();
        fixPreventDefault = !helperEvent.defaultPrevented;
    }

    function createEvent(type, detail) {
        var event;
        if (supportsEventConstructor) {
            event = new CustomEvent(type, {bubbles: true, cancelable: true, detail: detail});
        } else if (document.createEvent) {
            event = document.createEvent('CustomEvent');
            event.initCustomEvent(type, true, true, detail);
        } else {
            event = document.createEventObject();
            event.type = type;
            event.detail = detail;
        }
        if (fixPreventDefault) {
            event.preventDefault = function () {
                if (!this.defaultPrevented) {
                    Object.defineProperty(this, "defaultPrevented", {
                        get: function () {
                            return true;
                        }
                    });
                }
            };
        }
        return event;
    }

    function dispatchEvent(target, event) {
        if (target.dispatchEvent) {
            target.dispatchEvent(event);
        } else {
            target.fireEvent('on' + event.type, event);
        }
    }

    it('append and remove', function () {
        var domParent = document.createElement('div');
        var node = cito.vdom.append(domParent, {tag: 'div'});
        expect(domParent.childNodes.length).to.be(1);
        cito.vdom.remove(node);
        expect(domParent.childNodes.length).to.be(0);
    });

    var expectPrototype = expect().constructor.prototype;
    expectPrototype.eqlDom = function (obj) {
        var html1 = getHtml(this.obj), html2 = getHtml(obj);
        this.assert(
            comparableHtml(html1) === comparableHtml(html2)
            , function(){ return 'expected ' + html1 + ' to equal DOM ' + html2 }
            , function(){ return 'expected ' + html1 + ' to not equal DOM ' + html2 });
        return this;
    };

    function getHtml(value) {
        if (value && value.outerHTML) {
            return value.outerHTML;
        } else if (value && value.nodeType) {
            while (helperDiv.firstChild) {
                helperDiv.removeChild(helperDiv.firstChild);
            }
            helperDiv.appendChild(value.cloneNode(true));
            return helperDiv.innerHTML;
        } else {
            return '' + value;
        }
    }

    // TODO compare dom/vdom instead of string
    function comparableHtml(html) {
        html = html.toLowerCase();
        html = html.replace(/xmlns(:\w+)?=".*?"/g, '');
        html = html.replace(/style=""/g, '');
        html = html.replace(/=""/g, '');
        html = html.replace(/(<([\w-]+)[^/>]*)\/>/g, '$1></$2>');
        html = html.replace(/(<[\w-]+)(.*?)(>)/g, function (match, start, attrsStr, end) {
            var attrs = [];
            var attrMatch, attrRegEx = /[\w-]+(=(".*?")|[^ ]*)?/g;
            while (attrMatch = attrRegEx.exec(attrsStr)) {
                attrs.push(attrMatch[0]);
            }
            return start + attrs.sort().join(' ') + end;
        });
        html = html.replace(/(style=")(.*?)"/g, function (match, start, style, end) {
            return start + style.split(/;\s*/).sort().join(';') + '"';
        });
        html = html.replace(/[\s";]/g, '');
        return html;
    }

    function mapProp(array, prop) {
        return _.map(array, function (value) {
            return value[prop];
        });
    }

});