(function() {
  "use strict";

  angular
    .module("spa-demo.subjects")
    .service("spa-demo.subjects.SelectedTags", SelectedTags);

  function SelectedTags() {
    var state = {selected_tags: []};
    return {
      get: function(){return state.selected_tags},
      set: function(tags){state.selected_tags = tags}
    }
  }
})();
