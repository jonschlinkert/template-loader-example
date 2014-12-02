'use strict';

var Loaders = require('loader-cache');
var load = require('./load');

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
  this._loadCount = 0;
  this.loaders = new Loaders();
  this.defaultTemplates();
}

/**
 * Add some default template "types"
 */

Engine.prototype.defaultTemplates = function () {
  this.create('partial', 'partials');
  this.create('include', 'includes');
  this.create('layout', 'layouts');
  this.create('page', 'pages');
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

  Engine.prototype[type] = function (template) {
    return this[plural].apply(this, arguments);
  };

  Engine.prototype[plural] = function (template) {
    extend(this.cache[plural], template);
    return this;
  };

  return this;
};

extend(Engine.prototype, load);

function extend(a, b) {
  for (var key in b) {
    if (b.hasOwnProperty(key)) {
      a[key] = b[key];
    }
  }
  return a;
}

module.exports = Engine;