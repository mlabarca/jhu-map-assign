(function() {
  "use strict";

  angular
    .module("spa-demo.subjects")
    .service("spa-demo.subjects.SelectedThing", SelectedThing);

  function SelectedThing() {
    var state = {thing_id: null};
    return {
      get: function(){return state.thing_id},
      set: function(thing_id){state.thing_id = thing_id}
    }
  }
})();
