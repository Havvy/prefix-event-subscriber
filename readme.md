![Travis Status](https://img.shields.io/travis/Havvy/prefix-event-subscriber.svg) ![NPM Downloads](https://img.shields.io/npm/dm/prefix-event-subscriber.svg) ![Version](https://img.shields.io/npm/v/prefix-event-subscriber.svg) ![ISC Licensed](https://img.shields.io/npm/l/prefix-event-subscriber.svg) ![Github Issue Count](https://img.shields.io/github/issues/Havvy/prefix-event-subscriber.svg) ![Github Stars](https://img.shields.io/github/stars/Havvy/prefix-event-subscriber.svg)

## Installation

`npm install prefix-event-subscriber --save`

## Introduction

Yes, yet another variant of the event emitter!

But this one doesn't actually emit events. It instead bundles together different "event subscribers" into a shared event subscriber such that each event emitter has its own prefix.

But what is an "event subscriber" you ask? Well, it's like an "event emitter" but we only care about the "on", "once", and "off" methods<sup>1</sup>. All event emitters are event subscribers by default, but not all event subscribers are event emitters (because they don't have the "emit" method).

## Basic Example

So, what does this look like in practice? Well, let's say we have two components "foo" and "bar" that have event emitters, and we want to expose the ability to subscribe to these events to our users.

```javascript
const Foo = require("foo");
const Bar = require("bar");
const Subscriber = require("prefix-event-subscriber");

const foo = Foo();
const bar = Bar();

const foobar = Subscriber();

foobar.addSubscriber(foo.emitter, "foo:");
foobar.addSubscriber(bar.emitter, "bar:");

foobar.on("foo:spam", function () {
    console.log("foo emitter emitted 'spam' event.");
});

foobar.once("bar:eggs", function () {
    console.log("bar emitter emitted first 'eggs' event."); 
});

foo.emitter.emit("spam");
// console prints "foo emitter emitted 'spam' event."

foo.emitter.emit("eggs");
// console doesn't print anything

bar.emitter.emit("eggs");
// console prints "bar emitter emitted first 'eggs' event."

bar.emitter.emit("eggs");
// console doesn't print anything

subscriber.emit("foo:spam");
// Error: subscriber object has no method "emit"
```

You can also use symbols for prefixes (such as "@" and "!" and "$") or really any string. The examples here just use "name:" because it's easier to read, and most emitters don't use colons in their event names.

## on(event, handler) and on({event: handler, ...})

This subscriber's methods are overloaded. You can either pass in the event and the handler in their own properties just like Node's default event emitter or you can pass in an object where the keys are the events and the values are the handlers. This is useful when you have a lot of events to subscribe to; which given that this bundles multiple event subscribers together, you probably need to.

```javascript
subscriber.on({
    "foo:fizz": function () { .... },
    "bar:buzz": function () { .... }
});
```

## Default Subscriber

You probably don't need this, but it exists if you do. I, Havvy, needed it to maintain backwards compatibility in [Tennu](https://tennu.github.io/).

The default subscriber is the subscriber that is used if none of the other subscribers match. It is unset by default, and can be set by using the "defaultPrefix" property on the module.

If a program tries to subscribe to a non-subscriber while there is no default, an error will be thrown.

If a program tries to add two (or more) default emitters, an error will be thrown.

```javascript
var Foo = require("foo");
var Bar = require("bar");
const Subscriber = require("prefix-event-subscriber");

var foo = Foo();
var bar = Bar();

const foobar = Subscriber();

foobar.addSubscriber("foo", foo.emitter);

foobar.on("bar:spam", function () { .... });
// Error: Could not find a subscriber for the event bar:spam

foobar.addSubscriber(Subscriber.defaultPrefix, bar);

foobar.on("eggs", function () {
    console.log("bar emitter emitted 'eggs' event.")
});

bar.emitter.emit("eggs");
// console prints "bar emitter emitted 'eggs' event."
```

Obviously, if an event matches one of the prefixes of another subscriber, it cannot be listened to with this subscriber.

If you use the default subscriber, take care to make sure none of your subscriber prefixes are the prefix of any events for the default subscriber.

## Metadata

There's functionality to have metadata saved for each added handler.

The subscriber methods ("on", "once", "off") also have variants that have "WithMetadata" appened to them (e.g. "onWithMetadata").

I (Havvy) know, that's not enough to figure out what's going on. I cannot remember how it all works and don't want to go figure it out. Much like the default subscriber, you probably don't need it.

## Rationale

In [Tennu](https://tennu.github.io/), I, Havvy, originally had two event emitters. One for IRC messages and one for user commands. I wrote a "BiSubscriber" that checked if the first character was a "!" or not and used that to determine whether it was for the messages or the commands. All was good, except it was very specific. And the BiSubscriber was created explicitly during the Tennu constructor after the messages and commands were created. Overall, it was turning into procedural gloop with a hard to track dependency system.

Later, I realized that the action plugin could have an event emitter for posting that it had done something successfully such as joining a channel with all the necessary channel join events sent to it. At first I exposed that only as an export on the plugin and anybody who wanted it could require the action plugin, but that goes against my philosophy of making everything available to plugins either as methods on the client or as an instance hook. But I didn't expect much use of it, so I didn't care. I filed a bug about it, and went on.

Later I realized I could add it to the subscriber with a prefix of "action:" since IRC events don't have colons and "!" doesn't collide with "a". I originally started with "multi-event-subscriber", but since prefixes were the center of the action, I renamed it. Because IRC events didn't have a prefix in BiSubscriber, and I wanted the replacement to be transparent, I had to add in the defaultPrefix functionality.But hey, I threw away BiSubscriber and wrote a "subscriber" plugin to expose the "handlers" instance hook that was originally on the Tennu constructor also (see also: procedural gloop) plus a new "subscribe" instance hook. Moving all of this out of the Tennu Subscriber actually made it a lot more manageable to understand.

Almost immediately after, I also wanted to know the source of event handlers that threw errors. That's where the metadata came from. Since then, I've forgotten how the metadata system works, and I wrote this at 4AM in the night, so I didn't want to go look into how it works.

Also, while writing these docs, I noticed I called it `addEmitter` instead of `addSubscriber`, so I added `addSubscriber` since that's what it should be, but `addEmitter` also works as a (deprecated) alias.

## Footnotes

1. Actually, you only really need whichever of the subscriber you want to support. Just make the others throw errors saying not implemented. They only get called if users of the subscriber try to call them. Tennu actually did this for some of its event subscribers because it had a requirement of only one handler per event, so "once" doesn't make sense and "off" was postponed because of laziness.