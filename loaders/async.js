
/**
 * Default loader for loading templates.
 */

module.exports = function loadAsync (args, options, cb) {
  var slice = require('array-slice');
  var Loader = require('load-templates');
  var loader = new Loader(options);
  slice(arguments).pop();
  setTimeout(function () {
    cb(null, loader.load.apply(loader, args));
  }, 200);
};