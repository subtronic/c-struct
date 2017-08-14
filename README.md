c-struct [![Build Status](https://travis-ci.org/subtronic/c-struct.svg?branch=master)](https://travis-ci.org/subtronic/c-struct)
========

[![NPM](https://nodei.co/npm/c-struct.png?downloads=true)](https://nodei.co/npm/c-struct/)

A fast binary data packing &amp; unpacking library for node.js designed for multiplayer games.

What can it do?
---------------

* 8, 16, 32 and 64 bit unsigned integers.
* Dec8 and time8 specified format
* Schema based unpacking.
* Unpack from buffer to object.

More
----
* Zero production dependencies.

Installation
------------

    npm install c-struct --save

> Execute `$ node examples/` to see the examples.

Usage
-----

#### Unpacking ####

    var _ = require('c-struct');

    var playerSchema = new _.Schema({
      id: _.type.uint16,
      exp: _.type.uint32,
      status: _.type.uint8,
      skills: [{
        id: _.type.uint8
      }],
      position: {
        x: _.type.uint16,
        y: _.type.uint16
      },
      hash: _.type.uint48
    });

    // register to cache
    _.register('Player', playerSchema);

    // unpack data from buffer
API
---

Currently only unsigned values in little endian are supported

    _.type.uint8    // unsigned char
    _.type.uint16   // unsigned short
    _.type.uint24
    _.type.uint32   // unsigned long
    _.type.uint40
    _.type.uint48

Configurations
----

> There is currently no configs.

