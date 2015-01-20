Number.prototype.leadingZero = function leadingZero() {
  return ( this < 10 ? '0' + this : '' + this );
};

function Debug( module ) {
  this.module = module.charAt(0).toUpperCase() + module.slice(1);

  this.print = function print() {

    if( ( typeof ENV === 'undefined' ) || ENV !== 'test' ) {
      console.log.apply( console, arguments );
    }

  };
}

(function(Debug) {

  var getTime = function getTime() {
    var date = new Date();
    return '[\x1B[90m' + date.getHours().leadingZero() + ':' + date.getMinutes().leadingZero() + ':' + date.getSeconds().leadingZero() + '\x1B[39m]';
  };

  var getPrefix = function getPrefix( type, module ) {
    var codes = [
        32, '  Log  '
      , 33, 'Warning'
      , 31, ' Error '
    ];

    return getTime() + ' - [\x1B[' + codes[type] + 'm' + codes[type + 1] + '\x1B[39m] [' + module + ']';
  };

  Debug.prototype.log = function log() {
    this.print.apply( this, [getPrefix(0, this.module)].concat( [].slice.call( arguments ) ) );
  };

  Debug.prototype.warn = function warn() {
    this.print.apply( this, [getPrefix(2, this.module)].concat( [].slice.call( arguments ) ) );
  };

  Debug.prototype.error = function error() {
    this.print.apply( this, [getPrefix(4, this.module)].concat( [].slice.call( arguments ) ) );
  };

})(Debug);

module.exports = Debug;