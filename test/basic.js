var should = require('chai').should();
var expect = require('chai').expect;
var assert = require('chai').assert;
var _ = require('../');
require('./dgram/OrderBook')(_);
require('./dgram/HeartBeat')(_);

describe('#c-struct', function() {
  it('should correct work upack by types', function(done) {
    
    var hb = new Buffer('0e00843b8f6f00000080c000636df9221bd4da142d0100000000');
    var hbUnpacked = _.unpackSync('HeartBeat', hb);
    hbUnpacked['msgid'].should.equal(12336);
    hbUnpacked['source_id'].should.equal(12387);
    done();
  });

  it('should get Schema size', function(done) {

    var playerSchema = new _.Schema({
        id: _.type.uint16,
        name: _.type.uint8,
        exp: _.type.uint32,
        status: _.type.uint8,
        hash: _.type.uint64
    });

    // register
    _.register('Player', playerSchema);
    var sizePlayer = _.sizeOf('Player');
    sizePlayer.should.equal(16);

    var team = new _.Schema({'player1':'Player','player2':'Player', 'teamId': _.type.uint32});

    _.register('Team', team);
    var sizeTeam = _.sizeOf('Team');
    sizeTeam.should.equal(36);

    done();
  });

});
