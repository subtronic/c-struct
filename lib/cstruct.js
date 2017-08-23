/*globals module, Buffer*/
'use strict';
// Format | C Type         | JavaScript Type   | Size (octets) | Notes
// -------------------------------------------------------------------
//    A   | char[]         | Array             |     Length     |  (1)
//    x   | pad byte       | N/A               |        1       |
//    c   | char           | string (length 1) |        1       |  (2)
//    b   | signed char    | number            |        1       |  (3)
//    B   | unsigned char  | number            |        1       |  (3)
//    h   | signed short   | number            |        2       |  (3)
//    H   | unsigned short | number            |        2       |  (3)
//    i   | signed long    | number            |        4       |  (3)
//    I   | unsigned long  | number            |        4       |  (3)
//    l   | signed long    | number            |        4       |  (3)
//    L   | unsigned long  | number            |        4       |  (3)
//    s   | char[]         | string            |     Length     |  (2)
//    f   | float          | number            |        4       |  (4)
//    d   | double         | number            |        8       |  (5)

var Schema = require('./schema');
var DataTypes = require('./datatypes');
var cstruct = module.exports = {};
var ref = require('ref');
var bigInt = require("big-integer");

/**
 * Private
 */
var schemas = {};

/**
 * [register description]
 * @param  {[type]} name   [description]
 * @param  {[type]} schema [description]
 * @return {[type]}        [description]
 *
 * @api public
 */
cstruct.register = function(name, schema) {
    // cache schema
    schemas[name] = schema;

    return schemas[name];
};

/**
 * [retrieve description]
 * @param  {[type]} name   [description]
 *
 * @api public
 */
cstruct.retrieve = function(name) {
    // get schema
    return schemas[name].tree;
};

/**
 * [sizeOf description]
 * @param  {[type]} name   [description]
 *
 * @api public
 */
// @todo replace to scheme
cstruct.sizeOf = function(name) {
    if(schemas[name].length == 0){
        schemas[name].length = schemeSize(cstruct.retrieve(name));
    }
    return schemas[name].length;
};

// @todo replace to scheme
function schemeSize(scheme) {

    var arlen = 0;

    for (var el in scheme) {
        var s = scheme[el];
        if (typeof s === 'string') {
            if (s === 'uint8') {
                arlen += 1;
            }
            if (s === 'uint16') {
                arlen += 2;
            }
            if (s === 'uint32') {
                arlen += 4;
            }
            if (['uint64', 'dec64', 'time64'].indexOf(s) > -1) {
                arlen += 8;
            }

            if(typeof schemas[s] !== 'undefined'){
                arlen += cstruct.sizeOf(s);
            }

        } else if (Array.isArray(s)) {
            return NaN;
        } else {
            arlen += schemeSize(s);
        }
    }

    return arlen;
}

/**
 * [unpackSync description]
 * @param  {[type]} name    [description]
 * @param  {[type]} buffer  [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 *
 * @api public
 */
cstruct.unpackSync = function(name, buffer, options) {
    options = options || {};
    var schema = schemas[name].tree;

    function next(pointer, buf, scheme) {
        var res = {};
        for (var el in scheme) {

            var s = scheme[el];
            if (typeof s === 'string') {
                // string
                if(s in schemas){
                    Object.assign(res, next(pointer, buf, cstruct.retrieve(el)));
                } else {
                    // number
                    res[el] = unpacker[s + 'l'](pointer, buf);
                }
            } else if(s.hasOwnProperty('dynamic')) {
                res['levels'] = [];
                for(var i = 1; i <= res[s.dynamic]; i++){
                    res['levels'].push(next(pointer, buf, cstruct.retrieve(el)));
                }

            } else if (Array.isArray(s)) {
                res[el] = list(pointer, buf, s[0]);
            } else {
                res[el] = next(pointer, buf, s);
            }
        }

        return res;
    }

    function list(pointer, buf, scheme) {
        var len = buf.length;
        var arlen = 0;
        var res = [];

        for (var el in scheme) {
            var s = scheme[el];
            if (s === 'uint8') {
                arlen += 1;
            }
            if (s === 'uint16') {
                arlen += 2;
            }
            if (s === 'uint32') {
                arlen += 4;
            }
            if (['uint64','dec64','time64'].indexOf(s) > -1) {
                arlen += 8;
            }

            if(typeof schemas[s] != 'undefined'){
                arlen += cstruct.sizeOf(s);
            }
        }

        var m = pointer.offset + arlen;
        var count = 0;

        while (m < len) {
            m += arlen;
            count++;
        }

        while (count--) {
            res.push(next(pointer, buf, scheme));
        }

        return res;
    }
    var pointer = {'offset':0};
    return next(pointer, buffer, schema);
};

cstruct.getSeq = function (buffer) {
    return new bigInt(ref.readInt64LE(buffer, 4, true));
};

cstruct.getMsgid = function (buffer) {
    buffer.readUInt16LE(2, true);
};

/**
 * Expose
 *
 * @api public
 */
cstruct.Schema = Schema;
cstruct.type = DataTypes;

/**
 * Unpacker Routines
 *
 * @api private
 */
var unpacker = {};

unpacker.uint8l = function(pointer, buffer) {
    return buffer[pointer.offset++];
};

unpacker.uint16l = function(pointer, buffer) {
    pointer.offset +=2;
    return buffer.readUInt16LE(pointer.offset-2, true);
    var binary = buffer[pointer.offset++];
    binary |= buffer[pointer.offset++] << 8;
    binary >>>= 0;
    return binary;
};

unpacker.uint24l = function(pointer, buffer) {
    var binary = buffer[pointer.offset++];
    binary |= buffer[pointer.offset++] << 8;
    binary |= buffer[pointer.offset++] << 16;
    binary >>>= 0;
    return binary;
};

unpacker.uint32l = function(pointer, buffer) {
    pointer.offset +=4;
    return buffer.readUInt32LE(pointer.offset-4,true);
    var binary = buffer[pointer.offset++];
    binary |= buffer[pointer.offset++] << 8;
    binary |= buffer[pointer.offset++] << 16;
    binary |= buffer[pointer.offset++] << 24;
    binary >>>= 0;
    return binary;
};

unpacker.uint40l = function(pointer, buffer) {
    var binary = buffer[pointer.offset++];
    binary |= buffer[pointer.offset++] << 8;
    binary |= buffer[pointer.offset++] << 16;
    binary |= buffer[pointer.offset++] << 24;
    binary >>>= 0;
    binary += buffer[pointer.offset++] * 0x100000000;
    return binary;
};

unpacker.uint48l = function(pointer, buffer) {
    var binary = buffer[pointer.offset++];
    binary |= buffer[pointer.offset++] << 8;
    binary |= buffer[pointer.offset++] << 16;
    binary |= buffer[pointer.offset++] << 24;
    binary >>>= 0;
    binary += buffer[pointer.offset++] * 0x100000000;
    binary += buffer[pointer.offset++] * 0x10000000000;
    return binary;
};

unpacker.uint64l = function(pointer, buffer) {
    return ref.readInt64LE(buffer, 4, true);
};

unpacker.time64l = function (pointer, buffer) {
    // var binary = buffer[pointer.offset++];
    // binary |= buffer[pointer.offset++] << 8;
    // binary |= buffer[pointer.offset++] << 16;
    // binary |= buffer[pointer.offset++] << 24;
    // binary >>>= 0;
    // binary += buffer[pointer.offset++] * 0x100000000;
    // binary += buffer[pointer.offset++] * 0x10000000000;
    // binary += buffer[pointer.offset++] * 0x1000000000000;
    // binary += buffer[pointer.offset++] * 0x100000000000000;
    // binary = binary/100000000;
    return bigInt(ref.readInt64LE(buffer, 4, true)).divide(100000000);
};

unpacker.dec64l = function (pointer, buffer) {
    // @todo must test this
    var binary = buffer[pointer.offset++];
    binary |= buffer[pointer.offset++] << 8;
    binary |= buffer[pointer.offset++] << 16;
    binary |= buffer[pointer.offset++] << 24;
    binary >>>= 0;
    binary += buffer[pointer.offset++] * 0x100000000;
    binary += buffer[pointer.offset++] * 0x10000000000;
    binary += buffer[pointer.offset++] * 0x1000000000000;
    return binary * Math.pow(10, buffer[pointer.offset++]);
};
