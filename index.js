'use strict';

var defaultLoaders = require('./loaders');
var Engine = require('./engine');
var path = require('path');

function formatExt(ext) {
  return (ext[0] === '.')
    ? ext.slice(1)
    : ext;
}

var matchLoader = function matchLoader (pattern, options, thisArg) {
  if (Array.isArray(pattern)) {
    pattern = pattern[0];
  }
  var ext = formatExt(path.extname(pattern));
  return ext;
};
var options = { matchLoader: matchLoader };

var engine = new Engine();

// default loaders
engine.loader('default', defaultLoaders.sync);
engine.loader('default', { isAsync: true }, defaultLoaders.async);
engine.loader('default', { isPromise: true }, defaultLoaders.promise);
engine.loader('default', { isStream: true }, defaultLoaders.stream);

// use the default loader for `.md` files
engine.loader('.md', { isSync: true, isAsync: true, isPromise: true, isStream: true }, ['default']);

// demo loaders to use after the default loader
engine.loader('demoSync', function demoSync (template) {
  console.log('page template', template);
  return template;
});

engine.loader('demoAsync', { isAsync: true }, function demoAsync (template, options, next) {
  if (typeof options === 'function') {
    next = options;
    options = {};
  }
  console.log('layout template', template);
  next(null, template);
});

engine.loader('demoPromise', { isPromise: true }, function demoPromise (template) {
  console.log('partial template', template);
  var Promise = require('bluebird');
  var deferred = Promise.pending();
  setTimeout(function () {
    deferred.fulfill(template);
  }, 200);
  return deferred.promise;
});

var through = require('through2');
engine.loader('demoStream', { isStream: true }, through.obj(function demoStream (template) {
  console.log('include template', template);
  this.emit('data', template);
}));



console.log('engine', engine);
console.log();


/**
 * Load some seriously disorganized templates
 */

engine.page(engine.load(['abc.md', 'This is content.', {name: 'Jon Schlinkert'}], options, ['demoSync']));
console.log('pages', engine.cache.pages);
console.log();

engine.loadAsync(['test/fixtures/a.md', {a: 'b'}], options, ['demoAsync'], function (err, layouts) {
  engine.layouts(layouts);
  console.log('layouts', engine.cache.layouts);
  console.log();
});

engine.loadPromise(['foo/bar.md', {content: 'this is content.', data: {a: 'a'}}], options, ['demoPromise']).then(function (partials) {
  engine.partials(partials);
  console.log('partials', engine.cache.partials);
  console.log();
});

engine.loadStream(['one/two.md', {path: 'one/two.md', content: 'this is content.', data: {b: 'b'}}], options, ['demoStream'])
  .on('data', function (includes) {
    engine.includes(includes);
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
