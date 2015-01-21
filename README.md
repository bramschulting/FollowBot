# FollowBot
A Twitter bot that every week automatically follows some of your followers back

## Setup

Create a `config.js` file:

```
module.exports = {

  twitter: {
    consumer_key: 'REQUIRED',
    consumer_secret: 'REQUIRED',
    access_token: 'REQUIRED',
    access_token_secret: 'REQUIRED'
  },

  // Optional: the amount of random followers you want to follow back. Default: 1
  amount: 10,
  // Optional: false if you don't want to follow protected accounts. Default: true
  allowProtected: false

};
```

You can get the Twitter keys and tokens by [creating a new Twitter app](https://apps.twitter.com/app/new).
