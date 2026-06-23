/*
 * App.js -- Enyo 1.0 shell for the Wordle app.
 *
 * Enyo owns the webOS chrome (the root control / window integration); the
 * actual game is rendered with plain DOM by WordleUI. We render a single
 * container control, then in rendered() hand its DOM node to WordleUI.mount().
 *
 * This keeps us inside the webOS app lifecycle without being constrained by
 * Enyo 1.0's component system for the custom grid and keyboard.
 *
 * The one Enyo component we do host is the App Museum II update checker
 * (Helpers.Updater). Its visible footprint is a floating popup, so it does not
 * interfere with the plain-DOM board that WordleUI mounts into our node. On
 * launch we ask it to check the museum for a newer "Wordsel" and, if found, it
 * prompts the user to install via Preware.
 */

enyo.kind({
  name: "App",
  kind: enyo.Control,

  components: [
    { kind: "Helpers.Updater", name: "updater" }
  ],

  create: function () {
    this.inherited(arguments);
    // Match the museum app name exactly: "Wordsel".
    this.$.updater.CheckForUpdate("Wordsel");
  },

  rendered: function () {
    this.inherited(arguments);
    var node = this.hasNode();
    if (node && !this._mounted) {
      this._mounted = true;
      WordleUI.mount(node);
    }
  }
});
