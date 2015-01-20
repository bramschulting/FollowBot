var config = require( './config' )
  , FollowBot = require( './followbot' );


var followBot = new FollowBot();

followBot.followRandom(config.amount);