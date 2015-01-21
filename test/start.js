var chai = require( 'chai' );

chai.config.includeStack = true;

global.should = chai.should();
global.expect = chai.expect;
global.sinon = require( 'sinon' );
global.ENV = 'test';