'use strict';

var path = require('path');
var util = require('util');
var arr = require('arr');
var slice = require('array-slice');

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
  this.create('partial', 'partials', { async: true });
  this.create('layout', 'layouts', { async: true });
  this.create('page', 'pages', { async: true });
};

/**
 * Default loader for loading templates.
 */

Engine.prototype.loadSync = function () {
  var Loader = require('load-templates');
  var loader = new Loader(this.options);
  return loader.load.apply(loader, arguments);
};

/**
 * Default loader for loading templates.
 */

Engine.prototype.loadAsync = function () {
  var Loader = require('load-templates');
  var loader = new Loader(this.options);
  var fns = arr.filterType(arguments, 'function');
  if (fns.length > 0) {
    var done = fns[0];
    var args = slice(arguments);
    args.pop();
    setTimeout(function () {
      done(null, loader.load.apply(loader, args));
    }, 200);
  } else {
    throw new Error('Async loading requires a callback function.');
  }
};

/**
 * Choose the loader for loading templates
 */

Engine.prototype.load = function () {
  var fns = arr.filterType(arguments, 'function');
  if (fns.length > 0) {
    // use async loader

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
  var async = options.async;
  var fns = arr.filterType(arguments, 'function');
  var loader = async ? this.loadAsync : this.loadSync;

  if (fns.length > 0) {
    loader = fns[0];
    // a `done` callback would be fns[1];
  }

  Engine.prototype[type] = function (key, value, locals, options) {
    return this[plural].apply(this, arguments);
  };

  Engine.prototype[plural] = function (key, value, locals, options) {
    var self = this;
    var args = slice(arguments);
    if (async) {
      var cb = args.pop();
      if (typeof cb !== 'function') {
        throw new Error('Async loading requires a callback function.');
      }
      args.push(function (err, template) {
        if (err) return cb(err);
        extend(self.cache[plural], template);
        cb(null, template);
      });
      loader.apply(this, args)
      return this;
    }
    extend(this.cache[plural], loader.apply(this, args));
    return this;
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

/**
 * Load some seriously disorganized templates
 */

function doneLoading (err) {
  if (err) console.log('err', err);
}

engine.layout('layouts/*.txt', 'flflflfl', {name: 'Brian Woodward'}, doneLoading);
engine.layout('layouts/*.txt', {name: 'Brian Woodward'}, doneLoading);
engine.layout('test/fixtures/a.md', {a: 'b'}, doneLoading);
engine.page('abc.md', 'This is content.', {name: 'Jon Schlinkert'}, doneLoading);
engine.page('foo1.md', 'This is content', {name: 'Jon Schlinkert'}, doneLoading);
engine.page(['test/fixtures/one/*.md'], {a: 'b'}, doneLoading);
engine.page({'bar1.md': {path: 'a/b/c.md', name: 'Jon Schlinkert'}}, doneLoading);
engine.page({'baz.md': {path: 'a/b/c.md', name: 'Jon Schlinkert'}}, {go: true}, doneLoading);
engine.page({'test/fixtures/a.txt': {path: 'a.md', a: 'b'}}, doneLoading);
engine.page({path: 'test/fixtures/three/a.md', foo: 'b'}, doneLoading);
engine.pages('fixtures/two/*.md', {name: 'Brian Woodward'}, doneLoading);
engine.pages('pages/a.md', 'This is content.', {name: 'Jon Schlinkert'}, doneLoading);
engine.pages('test/fixtures/*.md', 'flflflfl', {name: 'Brian Woodward'}, doneLoading);
engine.pages('test/fixtures/a.md', {foo: 'bar'}, doneLoading);
engine.pages('test/fixtures/three/*.md', {name: 'Brian Woodward'}, doneLoading);
engine.pages(['test/fixtures/a.txt'], {name: 'Brian Woodward'}, doneLoading);
engine.partial({'foo/bar.md': {content: 'this is content.', data: {a: 'a'}}}, doneLoading);
engine.partial({path: 'one/two.md', content: 'this is content.', data: {b: 'b'}}, doneLoading);

setTimeout(function () {
  console.log(util.inspect(engine, null, 10));
}, 5000);
console.log(util.inspect(engine, null, 10));
