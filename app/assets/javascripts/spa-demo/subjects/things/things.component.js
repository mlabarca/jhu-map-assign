(function() {
  "use strict";

  angular
    .module("spa-demo.subjects")
    .component("sdThingEditor", {
      templateUrl: thingEditorTemplateUrl,
      controller: ThingEditorController,
      bindings: {
        authz: "<"
      },
      require: {
        thingsAuthz: "^sdThingsAuthz"
      }
    })
    .component("sdThingSelector", {
      templateUrl: thingSelectorTemplateUrl,
      controller: ThingSelectorController,
      bindings: {
        authz: "<"
      }
    })
    .component("sdThingTagSelector", {
      templateUrl: thingTagSelectorTemplateUrl,
      controller: ThingTagSelectorController,
      bindings: {
        authz: "<"
      }
    })
    ;


  thingEditorTemplateUrl.$inject = ["spa-demo.config.APP_CONFIG"];
  function thingEditorTemplateUrl(APP_CONFIG) {
    return APP_CONFIG.thing_editor_html;
  }
  thingSelectorTemplateUrl.$inject = ["spa-demo.config.APP_CONFIG"];
  function thingSelectorTemplateUrl(APP_CONFIG) {
    return APP_CONFIG.thing_selector_html;
  }
  thingTagSelectorTemplateUrl.$inject = ["spa-demo.config.APP_CONFIG"];
  function thingTagSelectorTemplateUrl(APP_CONFIG) {
    return APP_CONFIG.thing_tag_selector_html;
  }


  ThingEditorController.$inject = ["$scope","$q",
                                   "$state","$stateParams",
                                   "spa-demo.authz.Authz",
                                   "spa-demo.subjects.Thing",
                                   "spa-demo.subjects.ThingImage",
                                   "spa-demo.subjects.SelectedThing",
                                   "spa-demo.subjects.Tag"];
  function ThingEditorController($scope, $q, $state, $stateParams,
                                 Authz, Thing, ThingImage, SelectedThing, Tag) {
    var vm=this;
    vm.create = create;
    vm.clear  = clear;
    vm.update  = update;
    vm.remove  = remove;
    vm.haveDirtyLinks = haveDirtyLinks;
    vm.updateImageLinks = updateImageLinks;

    vm.$onInit = function() {
      //console.log("ThingEditorController",$scope);
      $scope.$watch(function(){ return Authz.getAuthorizedUserId(); },
                    function(){
                      if ($stateParams.id) {
                        reload($stateParams.id);
                      } else {
                        newResource();
                      }
                    });
    }

    return;
    //////////////
    function newResource() {
      vm.item = new Thing();
      vm.thingsAuthz.newItem(vm.item);
      return vm.item;
    }

    function reload(thingId) {
      var itemId = thingId ? thingId : vm.item.id;
      //console.log("re/loading thing", itemId);
      vm.images = ThingImage.query({thing_id:itemId});
      vm.item = Thing.get({id:itemId});
      vm.thingsAuthz.newItem(vm.item);
      vm.images.$promise.then(
        function(){
          angular.forEach(vm.images, function(ti){
            ti.originalPriority = ti.priority;
          });
        });

      vm.item.$promise.then(function(item){
        Tag.query({term: ''}).$promise.then(function(all_tags){
          vm.selected_tags = [];
          var current_tag_ids = item.tags.map(function(tag){return tag.id});
          vm.available_tags = all_tags.map(function(tag){
            var selected = current_tag_ids.indexOf(tag.id) != -1;
            return {id: tag.id, name: tag.name, selected: selected}
          });
          vm.selected_tags = item.tags.map(function(tag){
            return {id: tag.id, name: tag.name, selected: true}
          });
        });
      });
      SelectedThing.set(itemId);
      $q.all([vm.item.$promise,vm.images.$promise]).catch(handleError);
    }
    function haveDirtyLinks() {
      for (var i=0; vm.images && i<vm.images.length; i++) {
        var ti=vm.images[i];
        if (ti.toRemove || ti.originalPriority != ti.priority) {
          return true;
        }
      }
      return false;
    }

    function create() {
      vm.item.errors = null;
      vm.item.$save().then(
        function(){
          //console.log("thing created", vm.item);
          $state.go(".",{id:vm.item.id});
        },
        handleError);
    }

    function clear() {
      newResource();
      SelectedThing.set(null);
      $state.go(".",{id: null});
    }

    function update() {
      vm.item.errors = null;
      var tag_ids = vm.selected_tags.map(function(tag){return tag.id});
      var update=vm.item.$update({'tag_ids[]': tag_ids});
      updateImageLinks(update);
    }
    function updateImageLinks(promise) {
      //console.log("updating links to images");
      var promises = [];
      if (promise) { promises.push(promise); }
      angular.forEach(vm.images, function(ti){
        if (ti.toRemove) {
          promises.push(ti.$remove());
        } else if (ti.originalPriority != ti.priority) {
          promises.push(ti.$update());
        }
      });

      //console.log("waiting for promises", promises);
      $q.all(promises).then(
        function(response){
          //console.log("promise.all response", response);
          //update button will be disabled when not $dirty
          $scope.thingform.$setPristine();
          reload();
        },
        handleError);
    }

    function remove() {
      vm.item.$remove().then(
        function(){
          //console.log("thing.removed", vm.item);
          clear();
        },
        handleError);
    }

    function handleError(response) {
      console.log("error", response);
      if (response.data) {
        vm.item["errors"]=response.data.errors;
      }
      if (!vm.item.errors) {
        vm.item["errors"]={}
        vm.item["errors"]["full_messages"]=[response];
      }
      $scope.thingform.$setPristine();
    }
  }

  ThingSelectorController.$inject = ["$scope",
                                     "$stateParams",
                                     "spa-demo.authz.Authz",
                                     "spa-demo.subjects.Thing",
                                     "spa-demo.subjects.SelectedTags"];
  function ThingSelectorController($scope, $stateParams, Authz, Thing, SelectedTags) {
    var vm=this;
    vm.selected_tags = SelectedTags.get();

    var getTagIds = function(){return vm.selected_tags.map(function(tag){return tag.id})}

    vm.$onInit = function() {
      console.log("ThingSelectorController",$scope);
      $scope.$watch(function(){ return Authz.getAuthorizedUserId(); }, function(){
        if (!$stateParams.id) {
          vm.items = Thing.query({'tag_ids[]': getTagIds()});
        }
      });
      $scope.$watch(function(){ return vm.selected_tags.length }, function(){
        if (!$stateParams.id) {
          vm.items = Thing.query({'tag_ids[]': getTagIds()});
        }
      });
    }
    return;
    //////////////
  }

  ThingTagSelectorController.$inject = ["$scope",
                                        "$stateParams",
                                        "spa-demo.authz.Authz",
                                        "spa-demo.subjects.Thing",
                                        "spa-demo.subjects.Tag",
                                        "spa-demo.subjects.SelectedTags"];
  function ThingTagSelectorController($scope, $stateParams, Authz, Thing, Tag, SelectedTags) {
    var vm=this;
    vm.tags = SelectedTags.get();

    vm.loadTags = function(query) {
      return Tag.query({term: query}).$promise.then(function(results){
        return results.map(function(result){
          return {id: result.id, text: result.name}
        })
      });
    };

    vm.editing = !$stateParams.id;

    vm.onTagAdd = function(){
      SelectedTags.set(tags);
    }
    return;
  }

})();
