'use strict';

var typeOf = require('kind-of');

function isType(type) {
  return function (val) {
    return typeOf(val) === type;
  };
}

// function matchLoader(loaders, type) {
//   var self = this;
//   return function (pattern, options, thisArg) {
//     if (typeOf(pattern) === 'array') pattern = pattern[0];
//     if (loaders && loaders.length > 0) {
//       var key = thisArg.matchLoader(pattern);
//       if (thisArg.cache[type][key]) {
//         loaders.unshift(key);
//       }
//       key += ' - ' + (++self._loadCount);
//       thisArg._register(key, loaders, type);
//       return key;
//     }
//     return thisArg.matchLoader(pattern);
//   };
// }

module.exports.loader = function loader (key, options, fn) {
  if (typeOf(options) === 'function' || typeOf(options) === 'array') {
    fn = options;
    options = {};
  }
  if (options.isAsync) this.loaders.registerAsync(key, fn);
  if (options.isPromise) this.loaders.registerPromise(key, fn);
  if (options.isStream) this.loaders.registerStream(key, fn);
  if (!options.isAsync && !options.isPromise && !options.isStream) this.loaders.register(key, fn);
};

/**
 * Choose the loader for loading templates
 */

module.exports.load = function load () {
  return this.loaders.load.apply(this.loaders, arguments);
};

module.exports.loadAsync = function() {
  return this.loaders.loadAsync.apply(this.loaders, arguments);
};

module.exports.loadPromise = function() {
  return this.loaders.loadPromise.apply(this.loaders, arguments);
};

module.exports.loadStream = function() {
  return this.loaders.loadStream.apply(this.loaders, arguments);
};
