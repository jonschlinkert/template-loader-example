'use strict';

var Loaders = require('loader-cache');
var slice = require('array-slice');
var typeOf = require('kind-of');
var async = require('async');
var path = require('path');
var util = require('util');
var arr = require('arr');

var defaultLoaders = require('./loaders');

function isType(type) {
  return function (val) {
    return typeOf(val) === type;
  };
}


/**
 * Example application using load-templates
 *
 * ```js
 * var Engine = require('engine');
 * var engine = new Engine();
 * ```
 *
 * @param {[type]} options
 */

function Engine(options) {
  this.options = options || {};
  this.cache = {};
  this.loaders = new Loaders();
  this.defaultTemplates();
}

/**
 * Add some default template "types"
 */

Engine.prototype.defaultTemplates = function () {
  this.create('partial', 'partials', { promise: true });
  this.create('include', 'includes', { stream: true });
  this.create('layout', 'layouts', { async: true });
  this.create('page', 'pages');
};

/**
 * Choose the loader for loading templates
 */

Engine.prototype.load = function load (plural, loaderType) {
  var load = this.loaders.load;
  switch (loaderType) {
    case 'async': load = this.loaders.loadAsync; break;
    case 'promise': load = this.loaders.loadPromise; break;
    case 'stream': load = this.loaders.loadStream; break;
  }
  var i = 0;
  return function () {
    var self = this;
    var args = slice(arguments);
    var idx = arr.firstIndex(args, isType('array'));
    var fns = [];
    if (idx !== -1) {
      fns = args[idx];
      args.splice(idx, 1);
    }
    var options = args.length > 1 ? arr.lastObject(args) || {} : {};
    options.matchLoader = function (pattern, options, thisArg) {
      var key = plural;
      if (fns.length > 0) {
        key = key + '_' + (++i);
        fns.forEach(function (fn) { thisArg._register(key + '_local', fn, loaderType); });
        thisArg._register(key, [plural, key + '_local'], loaderType);
      }
      return key;
    }

    var params = [];
    params.push(args);
    params.push(options);
    switch (loaderType) {
      case 'async':
        var cb = args.pop();
        params.push(function (err, template) {
          if (err) return cb(err);
          extend(self.cache[plural], template);
          cb(null, template);
        });
        return load.apply(self.loaders, params);
        break;

      case 'promise':
        return load.apply(self.loaders, params)
          .then(extend.bind(extend, self.cache[plural]));
        break;

      case 'stream':
        return load.apply(self.loaders, params)
          .on('data', extend.bind(extend, self.cache[plural]));
        break;

      default:
        extend(self.cache[plural], load.apply(self.loaders, params));
        return self;
        break;
    }
  };
};


/**
 * Create template "types"
 *
 * @param  {String} `type` The singular name of the type, e.g. `page`
 * @param  {String} `plural` The plural name of the type, e.g. `pages.
 * @return {String}
 */

Engine.prototype.create = function (type, plural, options) {
  this.cache[plural] = this.cache[plural] || {};
  options = options || {};
  var fns = arr.filterType(arguments, 'function');
  var loaderType = 'sync';

  if      (options.async)   loaderType = 'async';
  else if (options.promise) loaderType = 'promise';
  else if (options.stream)  loaderType = 'stream';
  else                      loaderType = 'sync';

  if (fns.length === 0) {
    fns.push(defaultLoaders[loaderType]);
  }

  fns.forEach(function (fn) { this.loaders._register(plural, fn, loaderType); }, this);
  var load = this.load(plural, loaderType);

  Engine.prototype[type] = function (key, value, locals, options) {
    return this[plural].apply(this, arguments);
  };

  Engine.prototype[plural] = function (key, value, locals, options) {
    return load.apply(this, arguments);
  };

  return this;
};

function extend(a, b) {
  for (var key in b) {
    if (b.hasOwnProperty(key)) {
      a[key] = b[key];
    }
  }
  return a;
}


var engine = new Engine();

console.log('engine', engine);
console.log();
/**
 * Load some seriously disorganized templates
 */

engine.page('abc.md', 'This is content.', {name: 'Jon Schlinkert'}, [function demoSync (template) {
  console.log('page template', template);
  return template;
}]);
console.log('pages', engine.cache.pages);
console.log();

engine.layout('test/fixtures/a.md', {a: 'b'}, [function demoAsync (template, options, next) {
  if (typeof options === 'function') {
    next = options;
    options = {};
  }
  console.log('layout template', template);
  next(null, template);
}], function (err, results) {
  console.log('layouts', engine.cache.layouts);
  console.log();
});

engine.partial({'foo/bar.md': {content: 'this is content.', data: {a: 'a'}}}, [function demoPromise (template) {
  console.log('partial template', template);
  var Promise = require('bluebird');
  var deferred = Promise.pending();
  setTimeout(function () {
    deferred.fulfill(template);
  }, 200);
  return deferred.promise;
}]).then(function (err, results) {
  console.log('partials', engine.cache.partials);
  console.log();
});

var through = require('through2');
engine.include({path: 'one/two.md', content: 'this is content.', data: {b: 'b'}}, [through.obj(function demoStream (template) {
  console.log('include template', template);
  this.emit('data', template);
})])
  .on('data', function () {
    console.log('includes', engine.cache.includes);
    console.log();
  });

// async.series(
//   [
//     // layouts are async
//     function (next) { engine.layout('layouts/*.txt', 'flflflfl', {name: 'Brian Woodward'}, next); },
//     function (next) { engine.layout('layouts/*.txt', {name: 'Brian Woodward'}, demoLoadAsync, next); },
//     function (next) { engine.layout('test/fixtures/a.md', {a: 'b'}, next); },

//     // pages are sync
//     function (next) { engine.page('abc.md', 'This is content.', {name: 'Jon Schlinkert'}); next(); },
//     function (next) { engine.page('foo1.md', 'This is content', {name: 'Jon Schlinkert'}); next(); },
//     function (next) { engine.page(['test/fixtures/one/*.md'], {a: 'b'}, demoLoadSync); next(); },
//     function (next) { engine.page({'bar1.md': {path: 'a/b/c.md', name: 'Jon Schlinkert'}}); next(); },
//     function (next) { engine.page({'baz.md': {path: 'a/b/c.md', name: 'Jon Schlinkert'}}, {go: true}); next(); },
//     function (next) { engine.page({'test/fixtures/a.txt': {path: 'a.md', a: 'b'}}); next(); },
//     // load a couple pages with async
//     function (next) { engine.page({path: 'test/fixtures/three/a.md', foo: 'b'}, {async: true}, demoLoadAsync, next); },
//     function (next) { engine.pages('fixtures/two/*.md', {name: 'Brian Woodward'}, {async: true}, next); },
//     function (next) { engine.pages('pages/a.md', 'This is content.', {name: 'Jon Schlinkert'}); next(); },
//     // load a some pages with promises
//     function (next) { engine.pages('test/fixtures/*.md', 'flflflfl', {name: 'Brian Woodward'}, {promise: true}).then(next); },
//     function (next) { engine.pages('test/fixtures/a.md', {foo: 'bar'}, {promise: true}, demoLoadPromise).then(next); },
//     function (next) { engine.pages('test/fixtures/three/*.md', {name: 'Brian Woodward'}, {promise: true}).then(next); },
//     function (next) { engine.pages(['test/fixtures/a.txt'], {name: 'Brian Woodward'}); next(); },

//     // partials are promises
//     function (next) { engine.partial({'foo/bar.md': {content: 'this is content.', data: {a: 'a'}}}).then(next); },
//     function (next) { engine.partial({path: 'one/two.md', content: 'this is content.', data: {b: 'b'}}, demoLoadPromise).then(next); }
//   ],
//   function (err) {
//     if (err) console.log('err', err);
//     console.log(util.inspect(engine, null, 10));
//   });
