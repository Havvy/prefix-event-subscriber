const sinon = require("sinon");
const assert = require("better-assert");
const equal = require("deep-eql");
const inspect = require("util").inspect;
const format = require("util").format;
require('source-map-support').install();

const debug = false;
const logfn = debug ? console.log.bind(console) : function () {};

const Subscriber = require("../subscriber");
const EventEmitter = require("events").EventEmitter;

describe "Prefix Event Subscriber" {
    var subscriber, defaultEmitter, bangEmitter;

    beforeEach {
        logfn(/* newline */);
        subscriber = new Subscriber();
        defaultEmitter = new EventEmitter();
        bangEmitter = new EventEmitter();
    }

    describe "The Default Emitter" {
        beforeEach {
            subscriber.addEmitter(Subscriber.defaultPrefix, defaultEmitter);
        }

        it "is a catch-all" {
            var spy = sinon.spy();
            subscriber.on("x", spy)
            defaultEmitter.emit("x");
            assert(spy.called);
        }

        it "is shadowed by every other emitter" {
            var spy = sinon.spy();
            subscriber.addEmitter("!", bangEmitter);
            subscriber.on("!x", spy);
            defaultEmitter.emit("!x");
            assert(!spy.called);
            bangEmitter.emit("x");
            assert(spy.called);
        }

        it "is shadowed by every other emitter except when they don't match" {
            var spy = sinon.spy();
            subscriber.addEmitter("!", bangEmitter);
            subscriber.on("x", spy);
            defaultEmitter.emit("x");
            assert(spy.called);
        }
    }

    describe "dispatching" {
        beforeEach {
            subscriber.addEmitter(Subscriber.defaultPrefix, defaultEmitter);
            subscriber.addEmitter("!", bangEmitter);
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
}