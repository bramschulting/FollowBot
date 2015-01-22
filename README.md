# FollowBot
A Twitter bot that every week automatically follows some of your followers back

## Usage

Create a `config.js` file:

```
var FollowBot = require( 'FollowBot' );

var followBot = new FollowBot({

  twitter: {
    consumer_key: 'REQUIRED',
    consumer_secret: 'REQUIRED',
    access_token: 'REQUIRED',
    access_token_secret: 'REQUIRED'
  },
  
  // Optional: false if you don't want to follow protected accounts. Default: false
  allowProtected: false
});

followBot.followRandom(5);
```

You can get the Twitter keys and tokens by [creating a new Twitter app](https://apps.twitter.com/app/new).
