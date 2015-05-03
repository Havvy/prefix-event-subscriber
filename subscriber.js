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

    function getEmitterAndPrefix (nameWithPrefix) {
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
                emitter: defaultEmitter
            };
        } else {
            return {
                prefix: prefix,
                emitter: emitters[prefix]
            };
        }
    }

    function stringDispatch (names, listener, method) {
        names.split(" ").forEach(function (name) {
            var data = getEmitterAndPrefix(name);
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

    return {
        addEmitter: function (prefix, emitter) {
            if (prefix === defaultPrefix) {
                if (defaultEmitter) {
                    throw new Error("Cannot add multiple default emitters.");
                }

                defaultEmitter = emitter;
            } else {
                if (hasSimilarPrefix(prefix)) {
                    throw new Error("Prefix would shadow or be shadowed by another prefix.");
                }

                emitters[prefix] = emitter;
            }
        },

        on : makeDispatcher("on"),
        off: makeDispatcher("off"),
        once : makeDispatcher("once")
    }
};

PrefixEventSubscriber.defaultPrefix = defaultPrefix;

module.exports = PrefixEventSubscriber;