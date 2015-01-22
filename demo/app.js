var config = require( './config' )
  , FollowBot = require( '../followbot' );

var followBot = new FollowBot({
  twitter: {
    consumer_key: config.twitter.consumer_key,
    consumer_secret: config.twitter.consumer_secret,
    access_token: config.twitter.access_token,
    access_token_secret: config.twitter.access_token_secret
  },
  allowProtected: config.allowProtected
});

followBot.followRandom(1).then(function(randomAccounts) { 
  console.log( 'Successfully followed the following accounts:' );
  randomAccounts.forEach(function(randomAccount) {
    console.log( '- ' + randomAccount.name );
  });
});