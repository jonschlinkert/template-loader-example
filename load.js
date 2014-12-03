'use strict';

var typeOf = require('kind-of');

function isType(type) {
  return function (val) {
    return typeOf(val) === type;
  };
}

function getTypes(options) {
  if (!options.isAsync && !options.isPromise && !options.isStream) {
    options.isSync = true;
  }
  var types = [];
  if (options.isSync) types.push('sync');
  if (options.isAsync) types.push('async');
  if (options.isPromise) types.push('promise');
  if (options.isStream) types.push('stream');
  return types;
}

module.exports.loader = function loader (key, options, fn) {
  if (typeOf(options) === 'function' || typeOf(options) === 'array') {
    fn = options;
    options = {};
  }
  this.loaders._register(key, fn, getTypes(options));
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
