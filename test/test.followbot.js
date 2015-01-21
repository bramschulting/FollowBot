var FollowBot = require( '../followbot' )
  , Promise = require( 'Bluebird' );

describe( 'FollowBot', function() {

  var sandbox, bot;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();

    bot = new FollowBot();

    sandbox.stub( bot.account, 'get' );
    sandbox.stub( bot.account, 'post' );
    sandbox.stub( Math, 'floor' );
  });

  afterEach(function() {
    sandbox.restore();
  });

  it( 'should have a Twit instance', function() {
    expect( bot ).to.contain.key( 'account' );
    expect( bot.account ).to.be.an( 'object' );
  });

  describe( 'getFollowers', function() {

    it( 'should get followers from Twit instance', function(done) {
      bot.account.get.yields(true);

      bot.getFollowers().catch(function() {
        expect( bot.account.get.callCount ).to.equal( 1 );

        expect( bot.account.get.getCall(0).args ).to.have.length( 3 );
        expect( bot.account.get.getCall(0).args[0] ).to.equal( 'followers/list' );
        expect( bot.account.get.getCall(0).args[1] ).to.eql({ count: 200, skip_status: true, cursor: -1 });

        done();
      }).catch(done);
    });

    it( 'should send multiple requests ', function(done) {
      bot.account.get.yields(false, { next_cursor: 42, users: [] });
      bot.account.get.onCall(1).yields( false, { users: [ 'user 2' ] });

      bot.getFollowers().then(function() {
        expect( bot.account.get.callCount ).to.equal( 2 );

        expect( bot.account.get.getCall(1).args ).to.have.length( 3 );
        expect( bot.account.get.getCall(1).args[0] ).to.equal( 'followers/list' );
        expect( bot.account.get.getCall(1).args[1] ).to.eql({ count: 200, skip_status: true, cursor: 42 });

        done();
      }).catch(done);
    });

    it( 'should resolve followers', function(done) {
      bot.account.get.yields(false, {
        users: [ 'user 1', 'user 2' ]
      });

      bot.getFollowers().then(function(followers) {

        expect( followers ).to.be.an( 'array' );
        expect( followers ).to.have.length( 2 );
        expect( followers[0] ).to.equal( 'user 1' );
        expect( followers[1] ).to.equal( 'user 2' );

        done();
      }).catch(done);
    });

    it( 'should always resolve an array', function(done) {
      bot.account.get.yields(false, { foo: 'bar' });

      bot.getFollowers().then(function(followers) {

        expect( followers ).to.be.an( 'array' );
        expect( followers ).to.have.length( 0 );

        done();
      }).catch(done);
    });

  });

  describe( 'getRandomAccounts', function() {

    var allAccounts;

    beforeEach(function() {

      allAccounts = [{
        id: 1
      }, {
        id: 2
      }, {
        id: 3
      }];

    });

    it( 'should return all accounts if max is >=', function() {

      var randomAccounts = bot.getRandomAccounts( allAccounts, 40 );
      expect( randomAccounts ).to.eql( allAccounts );

    });

    it( 'should return random accounts', function() {
      Math.floor.onCall(0).returns(2);
      Math.floor.onCall(1).returns(0);

      var randomAccounts = bot.getRandomAccounts( allAccounts, 2 );

      expect( randomAccounts ).to.have.length(2);
      expect( randomAccounts[0].id ).to.equal( 3 );
      expect( randomAccounts[1].id ).to.equal( 1 );

    });

    it( 'should not pick the same account twice', function() {
      Math.floor.onCall(0).returns(2);
      Math.floor.onCall(1).returns(2);
      Math.floor.onCall(2).returns(0);

      var randomAccounts = bot.getRandomAccounts( allAccounts, 2 );

      expect( randomAccounts ).to.have.length(2);
      expect( randomAccounts[0].id ).to.equal( 3 );
      expect( randomAccounts[1].id ).to.equal( 1 );
    });

  });

  describe( 'follow', function() {

    var allAccounts;

    beforeEach(function() {

      allAccounts = [{
        id: 1
      }, {
        id: 2
      }, {
        id: 3
      }];

    });

    it( 'should follow all accounts', function(done) {
      bot.account.post.yields( false, {} );

      bot.follow(allAccounts).then(function() {
        
        expect( bot.account.post.callCount ).to.equal( 3 );

        done();
      }).catch(done);

    });

  });

});