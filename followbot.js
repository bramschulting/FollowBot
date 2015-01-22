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

    if( amount > 50 ) {
      // Because of API limitations, it is only save to work with
      // up to 50 random followers. 
      return Promise.reject( 'Because of api limitations, you can follow up to 50 random followers.' );
    }

    var bot = this;

    return bot.getFollowers().then(function(ids) {
      return bot.getRandomAccounts(ids, amount);
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
      debug.log( 'Get batch' );

      bot.account.get( 'followers/ids', {
          count: 5000
        , stringify_ids: true
        , cursor: cursor
      }, function( err, resp ) {
        if( err ) {
          defer.reject( err );
          return;
        }

        fullStack = fullStack.concat( resp.ids || [] );

        if( resp.next_cursor_str || resp.next_cursor ) {
          return getBatch( resp.next_cursor_str || resp.next_cursor, cb );
        }
        
        cb();
      });
    }

    getBatch( -1, function done() {
      debug.log( 'Received full stack' );
      defer.resolve(fullStack);
    });

    return defer.promise;
  },

  convertIDs: function convertIDs( ids, ignoreOverflow ) {
    debug.log( 'Convert ' + ids.length + ' ids to user objects' );

    if( ids.length > 100 && !ignoreOverflow ) {
      return Promise.reject( 'Can only convert up to 100 ids at a time' );
    }

    var defer = Promise.pending()
      , bot = this;

    bot.account.get( 'users/lookup', {
      user_id: ids.slice( 0, 100 ).join( ',' )
    }, function( err, resp ) {
      if( err ) {
        defer.reject( err );
        return;
      }

      defer.resolve( resp || [] );
    });

    return defer.promise;
  },

  getRandomAccounts: function getRandomAccounts( ids, max ) {
    debug.log( 'Get ' + max + ' random account' );

    var defer = Promise.pending()
      , randomIds = [];

    // Get random IDs
    if( ids.length <= max ) {
      debug.warn( 'Account has not enough followers' );
      randomIds = ids;
    }
    else {
      // Shuffle the ids
      randomIds = privates.shuffleArray(ids).slice( 0, ( max * 2 ) );
    }

    // Convert them into user objects
    this.convertIDs(randomIds).then(function(accounts) {
      // Filter invalid picks
      var randomAccounts = [];

      for( var i = 0; i < accounts.length && randomAccounts.length != max; ++i ) {
        // @TODO - Protected
        if( accounts[i].following !== true ) {
          randomAccounts.push( accounts[i] );
        }
      }

      defer.resolve( randomAccounts );
    }).catch(defer.reject);

    return defer.promise;
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

var privates = {

  shuffleArray: function shuffleArray( array ) {
    var currentIndex = array.length
      , shuffled = array
      , temporaryValue
      , randomIndex;

    while( 0 !== currentIndex ) {
      randomIndex = Math.floor( Math.random() * currentIndex );
      currentIndex -= 1;

      temporaryValue = shuffled[currentIndex];
      shuffled[currentIndex] = shuffled[randomIndex];
      shuffled[randomIndex] = temporaryValue;
    }

    return shuffled;
  }

};

FollowBot.prototype.__privates = privates;

module.exports = FollowBot;