/*
 * storage.js -- Tiny persistence wrapper for legacy webOS (ES5).
 *
 * A small JSON key/value store. Tries HTML5 localStorage first (supported on
 * webOS WebKit) and falls back to document.cookie if localStorage is missing
 * or throws (private mode / quota).
 *
 * Generic API:   Storage.set(key, obj) / Storage.get(key) / Storage.remove(key)
 * Game helpers:  Storage.save(state) / Storage.load(dayIndex) / Storage.clear()
 *                (the in-progress game, keyed by puzzle day index)
 *
 * webOS WebKit ships JSON natively, so we rely on JSON.parse/stringify.
 */

var Storage = (function () {
  "use strict";

  var NS = "com.codepoet.wordsel:";
  var GAME_KEY = NS + "state";
  var COOKIE_DAYS = 3650;

  function hasLocalStorage() {
    try {
      var t = NS + "test";
      window.localStorage.setItem(t, "1");
      window.localStorage.removeItem(t);
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---- cookie fallback ---- */
  function setCookie(name, value) {
    var d = new Date();
    d.setTime(d.getTime() + COOKIE_DAYS * 86400000);
    document.cookie = name + "=" + encodeURIComponent(value) +
      "; expires=" + d.toUTCString() + "; path=/";
  }
  function getCookie(name) {
    var parts = document.cookie ? document.cookie.split(";") : [];
    var prefix = name + "=";
    for (var i = 0; i < parts.length; i++) {
      var c = parts[i];
      while (c.charAt(0) === " ") { c = c.substring(1); }
      if (c.indexOf(prefix) === 0) {
        return decodeURIComponent(c.substring(prefix.length));
      }
    }
    return null;
  }
  function expireCookie(name) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  }

  var useLS = hasLocalStorage();

  function writeRaw(key, value) {
    if (useLS) {
      try { window.localStorage.setItem(key, value); return; }
      catch (e) { /* fall through to cookie */ }
    }
    setCookie(key, value);
  }
  function readRaw(key) {
    if (useLS) {
      try {
        var v = window.localStorage.getItem(key);
        if (v !== null && v !== undefined) { return v; }
      } catch (e) { /* fall through */ }
    }
    return getCookie(key);
  }
  function removeRaw(key) {
    if (useLS) {
      try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
    }
    expireCookie(key);
  }

  /* ---- generic JSON store ---- */
  function set(key, obj) {
    try { writeRaw(key, JSON.stringify(obj)); }
    catch (e) { /* best-effort; never break gameplay */ }
  }
  function get(key) {
    var raw = readRaw(key);
    if (!raw) { return null; }
    try { return JSON.parse(raw); }
    catch (e) { return null; }
  }
  function remove(key) { removeRaw(key); }

  /* ---- game-state helpers (keyed by day index) ---- */
  function save(state) { set(GAME_KEY, state); }
  function load(dayIndex) {
    var state = get(GAME_KEY);
    if (state && state.dayIndex === dayIndex) { return state; }
    return null;
  }
  function clear() { remove(GAME_KEY); }

  return {
    NS: NS,
    set: set, get: get, remove: remove,
    save: save, load: load, clear: clear
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = Storage;
}
