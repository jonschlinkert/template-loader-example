
/**
 * Default promise loader
 */

module.exports = function loadPromise (args, options) {
  var Promise = require('bluebird');
  var deferred = Promise.pending();
  var Loader = require('load-templates');
  var loader = new Loader(options);
  setTimeout(function () {
    deferred.fulfill(loader.load.apply(loader, args));
  }, 200);
  return deferred.promise;
};