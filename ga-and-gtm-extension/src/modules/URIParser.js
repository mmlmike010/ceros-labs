/*
  miuri.js - simple URI parser

  MIT licensed

  Copyright (C) 2014 Radoslaw Mejer, http://github.com/radmen
 */
define([], function() {
  var Miuri, base_uri, build_query, extend, is_array, is_headless, is_object, parse, parse_str, parts, regex,
    __hasProp = {}.hasOwnProperty;

  regex = /^(?:([A-Za-z-+\.]+):\/\/)?(?:(\w+)(?::(\w+))?@)?([^:\/]+)?(?::(\d+))?(\/[^?#]*)?(?:\?([^#]*))?(?:#(.+))?/;

  parts = ['protocol', 'username', 'password', 'host', 'port', 'path', 'query', 'fragment'];

  is_headless = typeof window !== "undefined" && window !== null ? false : true;

  parse = function(uri) {
    var key, matched, name, uri_parts, _i, _len;
    if (!regex.test(uri)) {
      throw 'Invalid uri';
    }
    matched = regex.exec(uri).slice(1);
    uri_parts = {};
    for (key = _i = 0, _len = parts.length; _i < _len; key = ++_i) {
      name = parts[key];
      uri_parts[name] = matched[key];
    }
    return uri_parts;
  };

  is_array = function(object) {
    return '[object Array]' === Object.prototype.toString.call(object);
  };

  is_object = function(object) {
    return '[object Object]' === Object.prototype.toString.call(object);
  };

  extend = function(extended, object) {
    var key, value;
    for (key in object) {
      if (!__hasProp.call(object, key)) continue;
      value = object[key];
      extended[key] = value;
    }
  };

  parse_str = function(query) {
    var data, key_regex, name, part, tmp, value, _i, _len, _ref, _ref1;
    key_regex = /\[([^\]]*)\]/;
    data = {};
    _ref = query.split('&');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      part = _ref[_i];
      _ref1 = part.split('='), name = _ref1[0], value = _ref1[1];
      tmp = key_regex.exec(name);
      value = decodeURIComponent(value);
      if (!tmp) {
        data[name] = value;
        continue;
      }
      if (tmp[1] && !is_object(data[name])) {
        data[name] = {};
      } else if (!is_array(data[name])) {
        data[name] = [];
      }
      if (tmp[1]) {
        data[name][tmp[1]] = value;
      } else {
        data[name].push(value);
      }
    }
    return data;
  };

  build_query = function(name, value, parts) {
    var item, key, _i, _len;
    if (parts == null) {
      parts = [];
    }
    if (!is_array(value) && !is_object(value)) {
      return "" + name + "=" + (encodeURIComponent(value));
    }
    if (is_array(value)) {
      for (_i = 0, _len = value.length; _i < _len; _i++) {
        item = value[_i];
        parts.push("" + name + "[]=" + (encodeURIComponent(item)));
      }
    }
    if (is_object(value)) {
      for (key in value) {
        if (!__hasProp.call(value, key)) continue;
        item = value[key];
        parts.push("" + name + "[" + key + "]=" + (encodeURIComponent(item)));
      }
    }
    return parts.join('&');
  };

  base_uri = '/';

  if ((typeof window !== "undefined" && window !== null) && window.location.host) {
    base_uri = window.location.href;
  }

  Miuri = (function() {
    function Miuri(uri) {
      this.uri = uri != null ? uri : base_uri;
      this.parts = parse(this.uri);
      this.parts.query = this.parts.query ? parse_str(this.parts.query) : {};
      if (!this.parts.path) {
        this.parts.path = '/';
      }
      return;
    }

    Miuri.prototype.retrieve = function(name, value) {
      if (value == null) {
        value = null;
      }
      if (value === null) {
        return this.parts[name];
      }
      this.parts[name] = value;
      return this;
    };

    Miuri.prototype.protocol = function(protocol) {
      return this.retrieve('protocol', protocol);
    };

    Miuri.prototype.username = function(username) {
      return this.retrieve('username', username);
    };

    Miuri.prototype.password = function(password) {
      return this.retrieve('password', password);
    };

    Miuri.prototype.host = function(host) {
      return this.retrieve('host', host);
    };

    Miuri.prototype.hostname = function(host) {
      return this.host(host);
    };

    Miuri.prototype.port = function(port) {
      return this.retrieve('port', port);
    };

    Miuri.prototype.path = function(path) {
      if (path && path[0] !== '/') {
        path = "/" + path;
      }
      return this.retrieve('path', path);
    };

    Miuri.prototype.query = function(prop, value) {
      if (prop && typeof prop === 'string') {
        if (!value) {
          return this.parts.query[prop];
        } else {
          this.parts.query[prop] = value;
          return this;
        }
      }
      if (is_object(prop)) {
        extend(this.parts.query, prop);
        return this;
      }
      return this.parts.query;
    };

    Miuri.prototype.fragment = function(fragment) {
      return this.retrieve('fragment', fragment);
    };

    Miuri.prototype.pathinfo = function() {
      var basename, dirname, extension, filename, path;
      path = this.path();
      basename = path.split('/').pop();
      dirname = path.replace(new RegExp("/?" + basename), '');
      extension = /\./.test(basename) ? basename.split('.').pop() : '';
      filename = basename.replace(new RegExp("\\." + extension + "$"), '');
      if (dirname === '') {
        dirname = '/';
      }
      return {
        path: path,
        basename: basename,
        dirname: dirname,
        extension: extension,
        filename: filename
      };
    };

    Miuri.prototype.toString = function() {
      var key, query_parts, uri, value, _ref;
      uri = '';
      if (this.parts.protocol && this.parts.host) {
        uri += "" + this.parts.protocol + "://";
        if (this.parts.username && this.parts.password) {
          uri += "" + this.parts.username + ":" + this.parts.password + "@";
        } else if (this.parts.username) {
          uri += "" + this.parts.username + "@";
        }
        uri += this.parts.host;
        if (this.parts.port) {
          uri += ":" + this.parts.port;
        }
      }
      uri += this.parts.path;
      query_parts = [];
      _ref = this.parts.query;
      for (key in _ref) {
        if (!__hasProp.call(_ref, key)) continue;
        value = _ref[key];
        query_parts.push(build_query(key, value));
      }
      if (query_parts.length > 0) {
        uri += "?" + (query_parts.join('&'));
      }
      if (this.parts.fragment) {
        uri += "#" + this.parts.fragment;
      }
      return uri;
    };

    return Miuri;

  })();

  return Miuri;
});