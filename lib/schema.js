// translate the given data into actual schema
// that the next function will understand

function Schema(obj) {
    // translate eveything in the factory
    this.factory(obj);
}

Schema.prototype.factory = function(obj) {
    this.tree = obj;
};

Schema.prototype.length = 0;

var schema = module.exports = exports = Schema;
