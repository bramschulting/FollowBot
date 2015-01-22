var FollowBot = require( '../followbot' )
  , Promise = require( 'Bluebird' );

describe( 'FollowBot', function() {

  var sandbox, bot;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();

    bot = new FollowBot({
      twitter: {
        consumer_key: 'KEY',
        consumer_secret: 'SECRET',
        access_token: 'TOKEN',
        access_token_secret: 'SECRET'
      },
      allowProtected: false
    });

    sandbox.stub( bot.account, 'get' );
    sandbox.stub( bot.account, 'post' );
    sandbox.stub( bot.__privates, 'shuffleArray' );
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
        expect( bot.account.get.getCall(0).args[0] ).to.equal( 'followers/ids' );
        expect( bot.account.get.getCall(0).args[1] ).to.eql({ count: 5000, stringify_ids: true, cursor: -1 });

        done();
      }).catch(done);
    });

    it( 'should send multiple requests', function(done) {
      bot.account.get.yields(false, { next_cursor_str: 42, ids: [] });
      bot.account.get.onCall(1).yields( false, { ids: [ '123' ] });

      bot.getFollowers().then(function() {
        expect( bot.account.get.callCount ).to.equal( 2 );

        expect( bot.account.get.getCall(1).args ).to.have.length( 3 );
        expect( bot.account.get.getCall(1).args[0] ).to.equal( 'followers/ids' );
        expect( bot.account.get.getCall(1).args[1] ).to.eql({ count: 5000, cursor: 42, stringify_ids: true });

        done();
      }).catch(done);
    });

    it( 'should resolve followers', function(done) {
      bot.account.get.yields(false, {
        ids: [ '111', '222' ]
      });

      bot.getFollowers().then(function(ids) {

        expect( ids ).to.be.an( 'array' );
        expect( ids ).to.have.length( 2 );
        expect( ids[0] ).to.equal( '111' );
        expect( ids[1] ).to.equal( '222' );

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

    var allIds, allAccounts;

    beforeEach(function() {

      allIds = ['111', '222', '333'];
      allAccounts = [{ id: 111 }, { id: 222 }, { id: 333 }];

    });

    it( 'should return all accounts if max is >=', function(done) {
      bot.account.get.yields( false, allAccounts );

      bot.getRandomAccounts( allIds, 40 ).then(function(randomAccounts) {

        expect( randomAccounts ).to.eql( allAccounts );

        done();
      }).catch(done);

    });

    it( 'should return random accounts', function(done) {
      bot.__privates.shuffleArray.returns([ allIds[2], allIds[0], allIds[1] ]);
      bot.account.get.yields( false, [ allAccounts[2], allAccounts[0], allAccounts[1] ] );

      bot.getRandomAccounts( allIds, 2 ).then(function(randomAccounts) {

        expect( randomAccounts ).to.have.length(2);
        expect( randomAccounts[0].id ).to.equal( 333 );
        expect( randomAccounts[1].id ).to.equal( 111 );

        done();
      }).catch(done);

    });

    it( 'should not pick following accounts', function(done) {
      var following = allAccounts[0];
      following.following = true;
      bot.__privates.shuffleArray.returns([ allIds[2], allIds[0], allIds[1] ]);
      bot.account.get.yields( false, [ allAccounts[2], following, allAccounts[1] ] );

      bot.getRandomAccounts( allIds, 2 ).then(function(randomAccounts) {

        expect( randomAccounts ).to.have.length(2);
        expect( randomAccounts[0].id ).to.equal( 333 );
        expect( randomAccounts[1].id ).to.equal( 222 );

        done();
      }).catch(done);
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

  describe( 'followRandom', function() {

    beforeEach(function() {
      sandbox.stub( bot, 'getFollowers' );
      sandbox.stub( bot, 'getRandomAccounts' );
      sandbox.stub( bot, 'follow' );
    });

    it( 'should reject > 50', function(done) {
      bot.followRandom( 51 ).catch(function(err) {
        expect( err ).to.eql( new Error( 'Because of api limitations, you can follow up to 50 random followers.' ) );
        done();
      }).catch(done);
    });

    it( 'should following random accounts', function(done) {
      var _randomIds = [ 111, 222, 333 ]
        , _randomAccounts = [ { id: 333 }, { id: 111 } ];
      bot.getFollowers.returns(Promise.resolve(_randomIds));
      bot.getRandomAccounts.returns(Promise.resolve(_randomAccounts));
      bot.follow.returns(Promise.resolve(_randomAccounts));

      bot.followRandom( 2 ).then(function(randomAccounts) {

        expect( bot.getFollowers.callCount ).to.equal( 1 );
        expect( bot.getFollowers.getCall(0).args ).to.have.length( 0 );

        expect( bot.getRandomAccounts.callCount ).to.equal( 1 );
        expect( bot.getRandomAccounts.getCall(0).args ).to.have.length( 2 );
        expect( bot.getRandomAccounts.getCall(0).args[0] ).to.equal( _randomIds );
        expect( bot.getRandomAccounts.getCall(0).args[1] ).to.equal( 2 );

        expect( bot.follow.callCount ).to.equal( 1 );
        expect( bot.follow.getCall(0).args ).to.have.length( 1 );
        expect( bot.follow.getCall(0).args[0] ).to.equal( _randomAccounts );

        expect( randomAccounts ).to.be.an( 'array' );
        expect( randomAccounts ).to.have.length( 2 );
        expect( randomAccounts ).to.eql( _randomAccounts );

        done();
      }).catch(done);
    });

  });

});