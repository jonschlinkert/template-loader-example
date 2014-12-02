
/**
 * Default stream loader
 */

var through = require('through2');
module.exports = through.obj(function loadStream (args) {
  var Loader = require('load-templates');
  var loader = new Loader();
  var stream = this;
  setTimeout(function () {
    stream.emit('data', loader.load.apply(loader, args));
  }, 200);
});