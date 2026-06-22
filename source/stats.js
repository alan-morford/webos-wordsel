/*
 * stats.js -- Win/loss statistics for Wordsel (ES5).
 *
 * Persisted separately from the daily game state (it spans every day). Tracks
 * games played, wins, current/max streak, and the distribution of winning
 * guess counts (1..6). Streak continuity is derived from the day index of the
 * last completed puzzle: a win the very next day extends the streak; a gap or
 * a loss resets it.
 *
 * Depends on globals: Storage (storage.js).
 */

var WordleStats = (function () {
  "use strict";

  var KEY = Storage.NS + "stats";

  function blank() {
    return {
      played: 0,
      won: 0,
      currentStreak: 0,
      maxStreak: 0,
      /* guess distribution: dist[0]..dist[5] = wins in 1..6 guesses */
      dist: [0, 0, 0, 0, 0, 0],
      lastDayIndex: null,   /* day index of the last completed puzzle */
      lastWasWin: false
    };
  }

  function load() {
    var s = Storage.get(KEY);
    if (!s || typeof s.played !== "number") { return blank(); }
    /* be defensive about a partially-written/old shape */
    if (!s.dist || s.dist.length !== 6) { s.dist = blank().dist; }
    return s;
  }

  function save(s) { Storage.set(KEY, s); }

  /* Record a finished game. numGuesses is 1..6 on a win, ignored on a loss.
     dayIndex guards against double-counting the same day (e.g. after the dev
     reset replays today's puzzle): a day already recorded is not re-counted. */
  function record(won, numGuesses, dayIndex) {
    var s = load();
    if (s.lastDayIndex === dayIndex) { return s; } /* already counted today */

    s.played += 1;
    if (won) {
      s.won += 1;
      if (numGuesses >= 1 && numGuesses <= 6) { s.dist[numGuesses - 1] += 1; }
      /* streak: extend only if the previous completion was the day before */
      if (s.lastDayIndex !== null && s.lastWasWin && dayIndex === s.lastDayIndex + 1) {
        s.currentStreak += 1;
      } else {
        s.currentStreak = 1;
      }
      if (s.currentStreak > s.maxStreak) { s.maxStreak = s.currentStreak; }
    } else {
      s.currentStreak = 0;
    }
    s.lastDayIndex = dayIndex;
    s.lastWasWin = !!won;
    save(s);
    return s;
  }

  function winPercent(s) {
    return s.played ? Math.round((s.won / s.played) * 100) : 0;
  }

  /* For dev/testing: wipe all stats. */
  function reset() { Storage.remove(KEY); }

  return {
    load: load,
    record: record,
    winPercent: winPercent,
    reset: reset
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = WordleStats;
}
