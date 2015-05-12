const format = require("util").format;
const startsWith = function (string, prefix) {
    return string.indexOf(prefix) === 0;
};

const defaultPrefix = {};

const PrefixEventSubscriber = function () {
    // Invariant: For all pairs of keys, one key is not the beginning of the other.
    var emitters = {};

    var defaultEmitter;

    function hasSimilarPrefix (prefix) {
        return Object.keys(emitters).some(function (otherPrefix) {
            return startsWith(prefix, otherPrefix) || startsWith(otherPrefix, prefix);
        });
    }

    function getEmitterData (nameWithPrefix) {
        var prefix = Object.keys(emitters)
        .filter(function (prefix) {
            return startsWith(nameWithPrefix, prefix);
        })[0];

        if (!prefix) {
            if (!defaultEmitter) {
                throw new Error("Could not find an emitter for the event " + nameWithPrefix);
            }

            return {
                prefix: "",
                emitter: defaultEmitter.emitter,
                acceptsMetadata: defaultEmitter.acceptsMetadata
            };
        } else {
            return {
                prefix: prefix,
                emitter: emitters[prefix].emitter,
                acceptsMetadata: emitters[prefix].acceptsMetadata
            };
        }
    }

    function stringDispatch (names, listener, method) {
        names.split(" ").forEach(function (name) {
            var data = getEmitterData(name);
            var emitter = data.emitter;
            var prefix = data.prefix;

            emitter[method](name.slice(prefix.length), listener);
        });
    }

    function objectDispatch (object, method) {
        for (var names in object) {
            stringDispatch(names, object[names], method);
        }
    }

    function makeDispatcher (method) {
        return function () {
            switch (arguments.length) {
                case 1: objectDispatch(arguments[0], method); break;
                case 2: stringDispatch(arguments[0], arguments[1], method); break;
                default: throw new Error(format("PrefixEventSubscriber.%s takes one (object) or two (string, fn) arguments.", method));
            }
        }
    }

    function stringDispatchWithMetadata (names, listener, metadata, method) {
        names.split(" ").forEach(function (name) {
            var data = getEmitterData(name);
            var emitter = data.emitter;
            var prefix = data.prefix;
            var acceptsMetadata = data.acceptsMetadata;

            if (acceptsMetadata) {
                emitter[method](name.slice(prefix.length), listener, metadata);
            } else {
                emitter[method](name.slice(prefix.length), listener);
            }
        });
    }

    function objectDispatchWithMetadata (object, metdata, method) {
        for (var names in object) {
            stringDispatch(names, object[names], metadata, method);
        }
    }

    function makeDispatcherWithMetadata (method) {
        return function () {
            switch (arguments.length) {
                case 2: objectDispatchWithMetadata(arguments[0], arguments[1], method); break;
                case 3: stringDispatchWithMetadata(arguments[0], arguments[1], arguments[2], method); break;
                default: throw new Error(format("PrefixEventSubscriber.%sWithMetadata takes two (object, object) or three (string, fn, object) arguments.", method));
            }
        }
    }

    return {
        addEmitter: function (prefix, emitter, acceptsMetadata) {
            acceptsMetadata = acceptsMetadata || false;

            if (prefix === defaultPrefix) {
                if (defaultEmitter) {
                    throw new Error("Cannot add multiple default emitters.");
                }

                defaultEmitter = {
                    emitter: emitter,
                    acceptsMetadata: acceptsMetadata
                };
            } else {
                if (hasSimilarPrefix(prefix)) {
                    throw new Error("Prefix would shadow or be shadowed by another prefix.");
                }

                emitters[prefix] = {
                    emitter: emitter,
                    acceptsMetadata: acceptsMetadata
                };
            }
        },

        on : makeDispatcher("on"),
        off: makeDispatcher("off"),
        once : makeDispatcher("once"),

        onWithMetadata: makeDispatcherWithMetadata("on"),
        offWithMetadata: makeDispatcherWithMetadata("off"),
        onceWithMetadata: makeDispatcherWithMetadata("once")
    }
};

PrefixEventSubscriber.defaultPrefix = defaultPrefix;

module.exports = PrefixEventSubscriber;