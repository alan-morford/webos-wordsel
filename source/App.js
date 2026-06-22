/*
 * App.js -- Enyo 1.0 shell for the Wordle app.
 *
 * Enyo owns the webOS chrome (the root control / window integration); the
 * actual game is rendered with plain DOM by WordleUI. We render a single
 * container control, then in rendered() hand its DOM node to WordleUI.mount().
 *
 * This keeps us inside the webOS app lifecycle without being constrained by
 * Enyo 1.0's component system for the custom grid and keyboard.
 */

enyo.kind({
  name: "App",
  kind: enyo.Control,

  rendered: function () {
    this.inherited(arguments);
    var node = this.hasNode();
    if (node && !this._mounted) {
      this._mounted = true;
      WordleUI.mount(node);
    }
  }
});
