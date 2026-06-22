/*
 * game.js -- Pure Wordle game logic, ported to ES5 for legacy webOS.
 *
 * No framework or DOM dependencies: this file only needs words.js loaded first
 * (it reads the globals WORDS_ANSWERS and WORDS_ALLOWED). Everything here is
 * deterministic and unit-testable under plain node.
 *
 * The algorithms (daily-index epoch and the two-pass tile scoring) are ported
 * verbatim from the original Wordle bundle so that, with "match original
 * exactly" selected, each calendar day yields the same answer as classic Wordle.
 */

var WordleGame = (function () {
  "use strict";

  /* Original Wordle epoch: June 19 2021 (local midnight) == puzzle index 0. */
  var EPOCH = new Date(2021, 5, 19, 0, 0, 0, 0);
  var MS_PER_DAY = 86400000; /* 24 * 60 * 60 * 1000 */
  var WORD_LENGTH = 5;
  var MAX_GUESSES = 6;

  /* Number of whole days between two dates, comparing local midnights.
     Mirrors the bundle's Na(): round((midnight(b) - midnight(a)) / 86400000). */
  function daysBetween(a, b) {
    var am = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
    var bm = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
    return Math.round((bm - am) / MS_PER_DAY);
  }

  /* Zero-based puzzle index for a given date (0 == 2021-06-19 == "cigar"). */
  function dayIndex(date) {
    return daysBetween(EPOCH, date || new Date());
  }

  /* The solution word for a given date. Wraps with modulo once the ordered
     answer list is exhausted, matching the original's La[index % La.length]. */
  function solutionForDate(date) {
    var n = WORDS_ANSWERS.length;
    var i = dayIndex(date) % n;
    if (i < 0) { i += n; } /* guard against pre-epoch dates */
    return WORDS_ANSWERS[i];
  }

  /* A guess is valid if it is exactly five letters and appears in either the
     answer list or the extended allowed list. Uses an index map built once so
     we don't depend on Array.prototype.indexOf/includes semantics on old
     WebKit and avoid O(n) scans per keystroke. */
  var validSet = null;
  function buildValidSet() {
    validSet = {};
    var i;
    for (i = 0; i < WORDS_ANSWERS.length; i++) { validSet[WORDS_ANSWERS[i]] = true; }
    for (i = 0; i < WORDS_ALLOWED.length; i++) { validSet[WORDS_ALLOWED[i]] = true; }
  }
  function isValidWord(word) {
    if (!word || word.length !== WORD_LENGTH) { return false; }
    if (validSet === null) { buildValidSet(); }
    return validSet[word.toLowerCase()] === true;
  }

  /* Two-pass scoring, ported verbatim from the bundle. Pass 1 marks exact
     position matches "correct" and consumes those solution letters; pass 2
     marks remaining guess letters "present" only if an unconsumed solution
     letter matches, else "absent". This is what makes duplicate letters score
     correctly (e.g. guessing "geese" against "abide"). */
  function evaluateGuess(guess, solution) {
    var len = solution.length;
    var result = [];
    var guessUsed = [];
    var solUsed = [];
    var i, j;
    for (i = 0; i < len; i++) {
      result[i] = "absent";
      guessUsed[i] = false;
      solUsed[i] = false;
    }
    /* pass 1: correct */
    for (i = 0; i < len; i++) {
      if (guess.charAt(i) === solution.charAt(i)) {
        result[i] = "correct";
        guessUsed[i] = true;
        solUsed[i] = true;
      }
    }
    /* pass 2: present */
    for (i = 0; i < len; i++) {
      if (guessUsed[i]) { continue; }
      var c = guess.charAt(i);
      for (j = 0; j < len; j++) {
        if (!solUsed[j] && c === solution.charAt(j)) {
          result[i] = "present";
          solUsed[j] = true;
          break;
        }
      }
    }
    return result;
  }

  /* Aggregate the best-known state for each letter across all evaluated
     guesses, for coloring the on-screen keyboard. Priority matches the
     original: correct > present > absent > unknown. */
  var RANK = { unknown: 0, absent: 1, present: 2, correct: 3 };
  function aggregateKeyStates(guesses, evaluations) {
    var states = {};
    var g, i;
    for (g = 0; g < guesses.length; g++) {
      var guess = guesses[g];
      var evals = evaluations[g];
      if (!guess || !evals) { continue; }
      for (i = 0; i < guess.length; i++) {
        var letter = guess.charAt(i);
        var next = evals[i];
        var cur = states[letter] || "unknown";
        if (RANK[next] > RANK[cur]) { states[letter] = next; }
      }
    }
    return states;
  }

  function isWin(evaluation) {
    if (!evaluation) { return false; }
    for (var i = 0; i < evaluation.length; i++) {
      if (evaluation[i] !== "correct") { return false; }
    }
    return true;
  }

  return {
    WORD_LENGTH: WORD_LENGTH,
    MAX_GUESSES: MAX_GUESSES,
    dayIndex: dayIndex,
    solutionForDate: solutionForDate,
    isValidWord: isValidWord,
    evaluateGuess: evaluateGuess,
    aggregateKeyStates: aggregateKeyStates,
    isWin: isWin
  };
})();

/* Allow this file to be required under node for testing without affecting the
   browser global. (typeof module is "undefined" in the old WebKit.) */
if (typeof module !== "undefined" && module.exports) {
  module.exports = WordleGame;
}
