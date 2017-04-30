(function() {
  "use strict";

  angular
    .module("spa-demo.subjects")
    .factory("spa-demo.subjects.Thing", ThingFactory);

  ThingFactory.$inject = ["$resource","spa-demo.config.APP_CONFIG"];
  function ThingFactory($resource, APP_CONFIG) {
    var service = $resource(APP_CONFIG.server_url + "/api/things/:id",
        { id: '@id', tag_ids: '@tag_ids'},
        { update: {
          method:"PUT",
          params: {
            tag_ids: '@tag_ids'
          }
        },
        query: {
          method: 'GET',
          params: {
            tag_ids: '@tag_ids'
          },
          isArray: true
        }}
      );
    return service;
  }
})();
