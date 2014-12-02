/**
 * Default loader for loading templates.
 */

module.exports = function loadSync (args, options) {
  var Loader = require('load-templates');
  var loader = new Loader(options || {});
  return loader.load.apply(loader, args);
};