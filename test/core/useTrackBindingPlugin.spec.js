/* eslint-disable no-empty */
import useTrackBindingPlugin, {
    TrackBindingPlugin
} from "../../src/core/useTrackBindingPlugin";
import {addChildToNode, removeChildFromNode} from "../nodeUtils";

describe("useTrackBindingPlugin", () => {
    let node;
    let listener;

    before(() => {
        node = document.createElement("div");
        document.body.appendChild(node);
    });

    after(() => {
        document.body.removeChild(node);
    });

    afterEach(() => {
        removeChildFromNode(node);
        if (listener) {
            listener.remove();
            listener = null;
        }
    });

    it("throws when callback is not a function", () => {
        expect(() => {
            listener = useTrackBindingPlugin({});
        }).to.throw("callback needs to be a function.");
    });

    it("throws when invalid element is passed", () => {
        expect(() => {
            listener = useTrackBindingPlugin({
                callback: () => {},
                rootElement: document.createDocumentFragment()
            });
        }).to.throw("rootElement needs to be a valid node element.");
    });

    it("does not listen twice", () => {
        addChildToNode(node, {
            tagName: "a",
            attrs: {
                href: "#",
                "data-metrics-event-name": "myEvent",
                "data-metrics-prop": "value"
            },
            content: "Link to Track"
        });

        const plugin = new TrackBindingPlugin();
        const spy = sinon.spy();
        plugin.listen(spy, node);
        listener = plugin.listen(spy, node);

        const linkNode = node.firstChild;
        linkNode.click();

        spy.should.have.callCount(1);
    });

    it("calls callback function with expected arguments when an element is clicked", done => {
        addChildToNode(node, {
            tagName: "a",
            attrs: {
                href: "#",
                "data-metrics-event-name": "myEvent",
                "data-metrics-prop": "value"
            },
            content: "Link to Track"
        });

        function callback(eventName, params) {
            expect(eventName).to.equal("myEvent");
            expect(params).to.eql({prop: "value"});
            done();
        }

        listener = useTrackBindingPlugin({
            callback,
            rootElement: node
        });

        const linkNode = node.firstChild;
        linkNode.click();
    });

    it("only tracks click under specified element tree", () => {
        addChildToNode(document.body, {
            tagName: "a",
            attrs: {
                id: "linkInDoc",
                href: "#",
                "data-metrics-event-name": "myEvent",
                "data-metrics-prop": "value"
            },
            content: "Link to Track"
        });

        const spy = sinon.spy();
        listener = useTrackBindingPlugin({
            callback: spy,
            rootElement: node
        });

        const linkNode = document.getElementById("linkInDoc");
        linkNode.click();

        expect(spy.calledOnce).to.be.false;

        document.body.removeChild(linkNode);
    });

    it("does not require 'rootElement'", done => {
        addChildToNode(node, {
            tagName: "a",
            attrs: {
                href: "#",
                "data-metrics-event-name": "myEvent",
                "data-metrics-prop": "value"
            },
            content: "Link to Track"
        });

        function callback(eventName, params) {
            expect(eventName).to.equal("myEvent");
            expect(params).to.eql({prop: "value"});
            done();
        }
        listener = useTrackBindingPlugin({
            callback
        });

        const linkNode = node.firstChild;
        linkNode.click();
    });

    it("allows custom tracking attribute prefix", done => {
        const attributePrefix = "metrics";

        addChildToNode(node, {
            tagName: "a",
            attrs: {
                href: "#",
                "metrics-event-name": "myEvent",
                "metrics-prop": "value"
            },
            content: "Link to Track"
        });

        function callback(eventName, params) {
            expect(eventName).to.equal("myEvent");
            expect(params).to.eql({prop: "value"});
            done();
        }

        listener = useTrackBindingPlugin({
            callback,
            rootElement: node,
            attributePrefix
        });

        const linkNode = node.firstChild;
        linkNode.click();
    });

    it("properly unlisten", () => {
        addChildToNode(node, {
            tagName: "a",
            attrs: {
                href: "#",
                "data-metrics-event-name": "myEvent",
                "data-metrics-prop": "value"
            },
            content: "Link to Track"
        });

        const spy = sinon.spy();
        listener = useTrackBindingPlugin({
            callback: spy,
            rootElement: node
        });

        listener.remove();
        listener = null;

        const linkNode = node.firstChild;
        linkNode.click();

        expect(spy.calledOnce).to.be.false;
    });

    it("does not call 'callback' when tracking attributes are not found", () => {
        addChildToNode(node, {
            tagName: "a",
            attrs: {
                href: "#"
            },
            content: "Link to Track"
        });

        const spy = sinon.spy();
        listener = useTrackBindingPlugin({
            callback: spy,
            rootElement: node
        });

        const linkNode = node.firstChild;
        linkNode.click();

        expect(spy.calledOnce).to.be.false;
    });

    it("does not call 'callback' without 'eventName'", () => {
        addChildToNode(node, {
            tagName: "a",
            attrs: {
                href: "#",
                "data-metrics-prop": "value"
            },
            content: "Link to Track"
        });

        const spy = sinon.spy();
        listener = useTrackBindingPlugin({
            callback: spy,
            rootElement: node
        });

        const linkNode = node.firstChild;
        linkNode.click();

        expect(spy.calledOnce).to.be.false;
    });

    it("calls 'callback' with empty 'params'", done => {
        addChildToNode(node, {
            tagName: "a",
            attrs: {
                href: "#",
                "data-metrics-event-name": "myEvent"
            },
            content: "Link to Track"
        });

        function callback(eventName, params) {
            expect(eventName).to.equal("myEvent");
            expect(params).to.eql({});
            done();
        }

        listener = useTrackBindingPlugin({
            callback,
            rootElement: node
        });

        const linkNode = node.firstChild;
        linkNode.click();
    });

    it("does not call 'callback' when event is not single left click", () => {
        addChildToNode(node, {
            tagName: "a",
            attrs: {
                href: "#",
                "data-metrics-event-name": "myEvent"
            },
            content: "Link to Track"
        });

        const spy = sinon.spy();

        listener = useTrackBindingPlugin({
            callback: spy,
            rootElement: node
        });

        const linkNode = node.firstChild;
        listener.target._handleClick(spy, {
            target: linkNode,
            button: 1
        });

        expect(spy.calledOnce).to.be.false;

        listener.target._handleClick(spy, {
            target: linkNode,
            button: 0,
            ctrlKey: true
        });

        expect(spy.calledOnce).to.be.false;
    });

    it("does not call 'callback' when no tracking data is found", () => {
        addChildToNode(node, {
            tagName: "a",
            attrs: {
                href: "#"
            },
            content: "Link to Track"
        });

        const spy = sinon.spy();

        listener = useTrackBindingPlugin({
            callback: spy,
            rootElement: node,
            traverseParent: true
        });

        const linkNode = node.firstChild;
        listener.target._handleClick(spy, {
            target: linkNode,
            button: 0
        });

        expect(spy.calledOnce).to.be.false;
    });

    it("merges pageDefaults data when '{prefix}-merge-pagedefaults' is set to 'true'", done => {
        addChildToNode(node, {
            tagName: "a",
            attrs: {
                href: "#",
                "data-metrics-event-name": "myEvent",
                "data-metrics-prop": "value",
                "data-metrics-merge-pagedefaults": "true"
            },
            content: "Link to Track"
        });

        function callback(eventName, params, merge) {
            expect(eventName).to.equal("myEvent");
            expect(params).to.eql({prop: "value"});
            expect(merge).to.be.true;
            done();
        }

        listener = useTrackBindingPlugin({
            callback,
            rootElement: node
        });

        const linkNode = node.firstChild;
        linkNode.click();
    });

    it("aggregates metrics data up to the root element", done => {
        const childNode = addChildToNode(node, {
            tagName: "div",
            attrs: {
                "data-metrics-prop": "value"
            }
        });

        addChildToNode(childNode, {
            tagName: "a",
            attrs: {
                href: "#",
                "data-metrics-event-name": "myEvent",
                "data-metrics-prop1": "value1"
            },
            content: "Link to Track"
        });

        function callback(eventName, params) {
            expect(eventName).to.equal("myEvent");
            expect(params).to.eql({
                prop: "value",
                prop1: "value1"
            });
            done();
        }

        listener = useTrackBindingPlugin({
            callback,
            rootElement: node,
            traverseParent: true
        });

        const linkNode = childNode.firstChild;
        linkNode.click();
    });

    it("overrides metrics data from parent to child", done => {
        const childNode = addChildToNode(node, {
            tagName: "div",
            attrs: {
                "data-metrics-event-name": "parentEvent",
                "data-metrics-prop": "value"
            }
        });

        addChildToNode(childNode, {
            tagName: "a",
            attrs: {
                href: "#",
                "data-metrics-event-name": "myEvent",
                "data-metrics-prop": "value-overriden",
                "data-metrics-prop1": "value1"
            },
            content: "Link to Track"
        });

        function callback(eventName, params) {
            expect(eventName).to.equal("myEvent");
            expect(params).to.eql({
                prop: "value-overriden",
                prop1: "value1"
            });
            done();
        }

        listener = useTrackBindingPlugin({
            callback,
            rootElement: node,
            traverseParent: true
        });

        const linkNode = childNode.firstChild;
        linkNode.click();
    });

    it("aggregates metrics data only when 'traverseParent' is set to true", done => {
        const childNode = addChildToNode(node, {
            tagName: "div",
            attrs: {
                "data-metrics-prop": "value"
            }
        });

        addChildToNode(childNode, {
            tagName: "a",
            attrs: {
                href: "#",
                "data-metrics-event-name": "myEvent",
                "data-metrics-prop1": "value1"
            },
            content: "Link to Track"
        });

        function callback(eventName, params) {
            expect(eventName).to.equal("myEvent");
            expect(params).to.eql({
                prop1: "value1"
            });
            done();
        }

        listener = useTrackBindingPlugin({
            callback,
            rootElement: node,
            traverseParent: false
        });

        const linkNode = childNode.firstChild;
        linkNode.click();
    });
});
