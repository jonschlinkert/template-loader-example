'use strict';

var path = require('path');
var util = require('util');
var arr = require('arr');
var slice = require('array-slice');
var async = require('async');

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
  this.defaultTemplates();
}

/**
 * Add some default template "types"
 */

Engine.prototype.defaultTemplates = function () {
  this.create('partial', 'partials', { promise: true });
  this.create('layout', 'layouts', { async: true });
  this.create('page', 'pages');
};


/**
 * Default loader for loading templates.
 */

Engine.prototype.loadSync = function loadSync () {
  var Loader = require('load-templates');
  var loader = new Loader(this.options);
  return loader.load.apply(loader, arguments);
};

/**
 * Default loader for loading templates.
 */

Engine.prototype.loadAsync = function loadAsync () {
  var Loader = require('load-templates');
  var loader = new Loader(this.options);
  var args = slice(arguments);
  var done = args.pop();
  setTimeout(function () {
    done(null, loader.load.apply(loader, args));
  }, 200);
};

/**
 * Default promise loader
 */

Engine.prototype.loadPromise = function loadPromise () {
  var Promise = require('bluebird');
  var deferred = Promise.pending();
  var Loader = require('load-templates');
  var loader = new Loader(this.options);
  var args = slice(arguments);
  setTimeout(function () {
    deferred.fulfill(loader.load.apply(loader, args));
  }, 200);
  return deferred.promise;
};

/**
 * Choose the loader for loading templates
 */

Engine.prototype.load = function load () {
  var fns = arr.filterType(arguments, 'function');
  if (fns.length > 0) {
    // use async loader
    return this.loadAsync.apply(this, arguments);
  }
  return this.loadSync.apply(this, arguments);
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
  var isAsync = options.async;
  var isPromise = options.promise;
  var fns = arr.filterType(arguments, 'function');
  var loader = isAsync ? this.loadAsync : this.loadSync;
  loader = isPromise ? this.loadPromise : loader;
  var done = function (err, templates) {
    if (err) throw err;
    return templates;
  };

  if (fns.length > 0) {
    loader = fns[0];
    done = fns[1] || done;
  }

  Engine.prototype[type] = function (key, value, locals, options) {
    return this[plural].apply(this, arguments);
  };

  Engine.prototype[plural] = function (key, value, locals, options) {
    return handleLoader(loader, plural, isAsync, isPromise, done).apply(this, arguments);
  };

  return this;
};

function handleLoader (loader, plural, isAsync, isPromise, done) {
  return function () {
    var self = this;
    var args = slice(arguments);
    var options = arr.last(args, 'object');
    var fns = arr.filterType(args, 'function');
    if (options.async) {
      isAsync = options.async;
      loader = this.loadAsync;
    }
    if (options.promise) {
      isPromise = options.promise;
      loader = this.loadPromise;
    }


    if (isAsync) {
      switch (fns.length) {
        case 0: throw new Error('Expeced a callback function.');
        case 1: done = fns[0]; break;
        case 2:
          loader = fns[0];
          done = fns[1];
      }
      loader = callbackify(loader, function (cb) {
        return function (err, template) {
          if (err) return cb(err);
          extend(self.cache[plural], template);
          cb(null, template);
        };
      });
      loader.apply(self, args);
      return self;
    }


    if (isPromise) {
      return loader.apply(self, args)
        .then(function (templates) {
          extend(self.cache[plural], templates);
        });
    }

    
    var templates = loader.apply(self, args);
    extend(self.cache[plural], templates);
    return self;
  };
}

function callbackify (fn, done) {
  return function () {
    var args = slice(arguments);
    var cb = args.pop();
    if (typeof cb !== 'function') {
      args.push(cb);
      cb = function () {};
    }
    args.push(done(cb));
    fn.apply(this, args);
  };
}

function extend(a, b) {
  for (var key in b) {
    if (b.hasOwnProperty(key)) {
      a[key] = b[key];
    }
  }
  return a;
}


var engine = new Engine();

var demoLoadSync = function () {
  var template = this;
  return template.loadSync.apply(template, arguments);
};

var demoLoadAsync = function () {
  var template = this;
  template.loadAsync.apply(template, arguments);
};

var demoLoadPromise = function () {
  var template = this;
  return template.loadPromise.apply(template, arguments);
};

/**
 * Load some seriously disorganized templates
 */

async.series(
  [
    // layouts are async
    function (next) { engine.layout('layouts/*.txt', 'flflflfl', {name: 'Brian Woodward'}, next); },
    function (next) { engine.layout('layouts/*.txt', {name: 'Brian Woodward'}, demoLoadAsync, next); },
    function (next) { engine.layout('test/fixtures/a.md', {a: 'b'}, next); },

    // pages are sync
    function (next) { engine.page('abc.md', 'This is content.', {name: 'Jon Schlinkert'}); next(); },
    function (next) { engine.page('foo1.md', 'This is content', {name: 'Jon Schlinkert'}); next(); },
    function (next) { engine.page(['test/fixtures/one/*.md'], {a: 'b'}, demoLoadSync); next(); },
    function (next) { engine.page({'bar1.md': {path: 'a/b/c.md', name: 'Jon Schlinkert'}}); next(); },
    function (next) { engine.page({'baz.md': {path: 'a/b/c.md', name: 'Jon Schlinkert'}}, {go: true}); next(); },
    function (next) { engine.page({'test/fixtures/a.txt': {path: 'a.md', a: 'b'}}); next(); },
    // load a couple pages with async
    function (next) { engine.page({path: 'test/fixtures/three/a.md', foo: 'b'}, {async: true}, demoLoadAsync, next); },
    function (next) { engine.pages('fixtures/two/*.md', {name: 'Brian Woodward'}, {async: true}, next); },
    function (next) { engine.pages('pages/a.md', 'This is content.', {name: 'Jon Schlinkert'}); next(); },
    // load a some pages with promises
    function (next) { engine.pages('test/fixtures/*.md', 'flflflfl', {name: 'Brian Woodward'}, {promise: true}).then(next); },
    function (next) { engine.pages('test/fixtures/a.md', {foo: 'bar'}, {promise: true}, demoLoadPromise).then(next); },
    function (next) { engine.pages('test/fixtures/three/*.md', {name: 'Brian Woodward'}, {promise: true}).then(next); },
    function (next) { engine.pages(['test/fixtures/a.txt'], {name: 'Brian Woodward'}); next(); },

    // partials are promises
    function (next) { engine.partial({'foo/bar.md': {content: 'this is content.', data: {a: 'a'}}}).then(next); },
    function (next) { engine.partial({path: 'one/two.md', content: 'this is content.', data: {b: 'b'}}, demoLoadPromise).then(next); }
  ],
  function (err) {
    if (err) console.log('err', err);
    console.log(util.inspect(engine, null, 10));
  });
