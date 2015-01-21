var config = require( './config' )
  , Promise = require( 'bluebird' )
  , Twit = require( 'twit' )
  , Debug = require( './debug' )
  , debug = new Debug( 'FollowBot' );

var FollowBot = function FollowBot() {

  this.account = new Twit(config.twitter);

};


FollowBot.prototype = {

  followRandom: function followRandom( amount ) {
    amount = amount || 1;

    var bot = this;

    return bot.getFollowers().then(function(followers) {
      return followers.filter(function(follower) {
        if( config.hasOwnProperty( 'allowProtected' ) && config.allowProtected === false ) {
          return ( follower.following === false && follower.protected === false );
        }
        else {
          return follower.following === false;
        }
      });
    }).then(function(following) {
      return bot.getRandomAccounts( following, amount );
    }).then(function(randomAccounts) {
      //bot.follow(randomAccounts);

      // @TODO - Send email
      // @TODO - Store new ids in txt file. Used when sending a "Last week you followed ..." mail

      return randomAccounts;
    }).catch(Promise.reject);
  },

  getFollowers: function getFollowers() {
    debug.log( 'Get all followers' );

    var defer = Promise.pending()
      , fullStack = []
      , bot = this;

    function getBatch( cursor, cb ) {
      bot.account.get( 'followers/list', {
          count: 200
        , skip_status: true
        , cursor: cursor
      }, function( err, resp ) {
        if( err ) {
          defer.reject( err );
          return;
        }

        fullStack = fullStack.concat( resp.users || [] );

        if( resp.next_cursor ) {
          return getBatch( resp.next_cursor, cb );
        }
        
        cb();
      });
    }

    getBatch( -1, function done() {
      defer.resolve(fullStack);
    });

    return defer.promise;
  },

  getRandomAccounts: function getRandomAccounts( accounts, max ) {
    debug.log( 'Get ' + max + ' random account' );

    var randomAccounts = []
      , randomIds = []
      , randomNumber
      , randomAccount;

    if( accounts.length <= max ) {
      debug.warn( 'Account has not enough followers' );
      randomAccounts = accounts;
    }
    else {
      while( randomIds.length != max ) {
        randomNumber = Math.floor( Math.random() * accounts.length );
        randomAccount = accounts[( randomNumber )];

        if( randomIds.indexOf( randomAccount.id ) === -1 ) {
          debug.log( 'Add random account ' + randomAccount.name );
          randomAccounts.push( randomAccount );
          randomIds.push( randomAccount.id );
        }
      }
    }

    return randomAccounts;
  },

  follow: function follow( accounts ) {
    debug.log( 'Follow ' + accounts.length + ' accounts' );

    var bot = this;

    var followPromises = accounts.map(function followSingle(account) {
      var followDefer = Promise.pending();
      bot.account.post( 'friendships/create', {
          user_id: account.id
        , follow: true
      }, function( err, resp ) {
        if( err ) {
          followDefer.reject( err );
          return;
        }

        followDefer.resolve( resp );
      });

      return followDefer.promise;
    });

    return Promise.all(followPromises);
  }

};

module.exports = FollowBot;