const sinon = require("sinon");
const assert = require("better-assert");
const equal = require("deep-eql");
const inspect = require("util").inspect;
const format = require("util").format;
require('source-map-support').install();

const debug = false;
const logfn = debug ? console.log.bind(console) : function () {};

const Subscriber = require("./subscriber");
const EventEmitter = require("events").EventEmitter;

describe "Prefix Event Subscriber" {
    var subscriber, defaultEmitter, bangEmitter;

    beforeEach {
        subscriber = new Subscriber();
        defaultEmitter = new EventEmitter();
        bangEmitter = new EventEmitter();
    }

    describe "The Default Emitter" {
        beforeEach {
            subscriber.addSubscriber(Subscriber.defaultPrefix, defaultEmitter);
        }

        it "is a catch-all" {
            var spy = sinon.spy();
            subscriber.on("x", spy)
            defaultEmitter.emit("x");
            assert(spy.called);
        }

        it "is shadowed by every other emitter" {
            var spy = sinon.spy();
            subscriber.addSubscriber("!", bangEmitter);
            subscriber.on("!x", spy);
            defaultEmitter.emit("!x");
            assert(!spy.called);
            bangEmitter.emit("x");
            assert(spy.called);
        }

        it "is shadowed by every other emitter except when they don't match" {
            var spy = sinon.spy();
            subscriber.addSubscriber("!", bangEmitter);
            subscriber.on("x", spy);
            defaultEmitter.emit("x");
            assert(spy.called);
        }
    }

    describe "dispatching" {
        beforeEach {
            subscriber.addSubscriber(Subscriber.defaultPrefix, defaultEmitter);
            subscriber.addSubscriber("!", bangEmitter);
        }

        it "can take a string of event names" {
            var spy = sinon.spy();

            subscriber.on("!x x", spy);

            defaultEmitter.emit("x");
            assert(spy.calledOnce);
            bangEmitter.emit("x");
            assert(spy.calledTwice);
        }

        it "can take an object of event names to listener" {
            var defaultSpy = sinon.spy();
            var bangSpy = sinon.spy();

            subscriber.on({
                "x": defaultSpy,
                "!x": bangSpy
            });

            defaultEmitter.emit("x");
            assert(defaultSpy.calledOnce);
            assert(!bangSpy.called);

            bangEmitter.emit("x");
            assert(defaultSpy.calledOnce);
            assert(bangSpy.calledOnce);
        }
    }

    describe "Metadata flow" {
        var normalEmitter, metadataEmitter;
        var normalOnSpy, metadataOnSpy;

        beforeEach {
            metadataOnSpy = sinon.spy();
            metadataEmitter = {
                on: metadataOnSpy
            };

            normalOnSpy = sinon.spy();
            normalEmitter = {
                on: normalOnSpy
            };

            subscriber.addSubscriber(Subscriber.defaultPrefix, metadataEmitter, true);
            subscriber.addSubscriber("normal:", normalEmitter, false);
        }

        it "metadata is not passed to subscribers not asking for metadata" {
            const handler = function () {};
            subscriber.onWithMetadata("normal:x", handler, {exampleMetadata: true});
            logfn(inspect(normalOnSpy.getCall(0).args));
            assert(normalOnSpy.calledWithExactly("x", handler));
        }

        it "metadata is passed to subscribers asking for metadata" {
            const handler = function () {};
            const metadata = {exampleMetadata: true}
            subscriber.onWithMetadata("x", handler, metadata);
            assert(metadataOnSpy.calledWithExactly("x", handler, metadata));
        }

        it "metadata is passed through as appropriate with objects" {
            const metadataHandler = function () {};
            const normalHandler = function () {};
            const metadata = {exampleMetadata: true};

            subscriber.onWithMetadata({
                "x": metadataHandler,
                "normal:x": normalHandler
            }, metadata);

            assert(normalOnSpy.calledWithExactly("x", normalHandler));
            assert(metadataOnSpy.calledWithExactly("x", metadataHandler, metadata));
        }
    }
}