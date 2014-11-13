'use strict';

var path = require('path');
var util = require('util');
var arr = require('arr');

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
  this.create('partial', 'partials');
  this.create('layout', 'layouts');
  this.create('page', 'pages');
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
  // do async stuff
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

Engine.prototype.create = function (type, plural) {
  this.cache[plural] = this.cache[plural] || {};

  Engine.prototype[type] = function (key, value, locals, options) {
    return this[plural](key, value, locals, options);
  };

  Engine.prototype[plural] = function (key, value, locals, options) {
    var files = this.load(key, value, locals, options);
    extend(this.cache[plural], files);
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

engine.layout('layouts/*.txt', 'flflflfl', {name: 'Brian Woodward'});
engine.layout('layouts/*.txt', {name: 'Brian Woodward'});
engine.layout('test/fixtures/a.md', {a: 'b'});
engine.page('abc.md', 'This is content.', {name: 'Jon Schlinkert'});
engine.page('foo1.md', 'This is content', {name: 'Jon Schlinkert'});
engine.page(['test/fixtures/one/*.md'], {a: 'b'});
engine.page({'bar1.md': {path: 'a/b/c.md', name: 'Jon Schlinkert'}});
engine.page({'baz.md': {path: 'a/b/c.md', name: 'Jon Schlinkert'}}, {go: true});
engine.page({'test/fixtures/a.txt': {path: 'a.md', a: 'b'}});
engine.page({path: 'test/fixtures/three/a.md', foo: 'b'});
engine.pages('fixtures/two/*.md', {name: 'Brian Woodward'});
engine.pages('pages/a.md', 'This is content.', {name: 'Jon Schlinkert'});
engine.pages('test/fixtures/*.md', 'flflflfl', {name: 'Brian Woodward'});
engine.pages('test/fixtures/a.md', {foo: 'bar'});
engine.pages('test/fixtures/three/*.md', {name: 'Brian Woodward'});
engine.pages(['test/fixtures/a.txt'], {name: 'Brian Woodward'});
engine.partial({'foo/bar.md': {content: 'this is content.', data: {a: 'a'}}});
engine.partial({path: 'one/two.md', content: 'this is content.', data: {b: 'b'}});

console.log(util.inspect(engine, null, 10));
