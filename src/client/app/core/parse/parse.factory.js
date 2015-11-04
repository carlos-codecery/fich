(function() {
  'use strict';

  angular
  .module('app.core')
  .factory('parse', parse);

  parse.$inject = ['$q', 'Restangular'];

  /* @ngInject */
  function parse($q, Restangular) {

    var factory = {
      cloud     : cloud,
      endpoint  : endpoint,
      current   : current,
      user      : user
    };

    return factory;

    function cloud(cloudFunction){
      return Restangular.service('functions/'+cloudFunction);
    }

    function endpoint(className, id){
      return new ParseClass(className, id);
    }

    function current(){
      return Restangular.service('users/me');
    }

    function user(userId){
      var user = 'users';
      if(userId)
        user = 'users/'+userId;
      return Restangular.service(user);
    }

    function ParseClass(className, id){ 

      var className = className;
      var id = id;
      var endpoint = null;
      var classEndpoint = null;
      var restObject;

      initialize(className, id);

      function initialize(newClassName, newId){
        

        if(!newClassName){
          console.error('invalid className');
          return;
        }

        id = newId;
        className =  newClassName;
        endpoint = 'classes/'+className;
        classEndpoint = endpoint;

        if(newId){
          endpoint += '/'+id;
        }

        restObject = Restangular.service(endpoint);        
      }


      function getObject(){
        return restObject.one().get();
      }

      return {
        setId : function(id){
          return initialize(className, id);
        },
        delete: function(){
          return restObject.one().remove();
        },
        getAll: function(where, order, limit){
          var  params= {};
          if(where)
            params.where = where;
          if(order)
            params.order = order;
          if(limit)
            params.limit = limit;

          return restObject.getList(params);
        },
        getFirst : function(params){
          var deferred = $q.defer();

          this.getAll(params).then(function(items){
            if(items.length > 0)
              deferred.resolve(items[0]);
            else
              deferred.resolve(false);
          },function(error){
            deferred.reject(error);
          });

          return deferred.promise;
        },
        get: function(){
          return getObject();
        },
        post: function(params){
          return restObject.post(params);
        },
        put: function(params){
          return restObject.one().customPUT(params);
        },
        update: function(params){
          var object;
          var deferred = $q.defer();
          if(id){
            this.put(params).then(function(){
              return getObject();
            }).then(function(row){
              deferred.resolve(row)
            },function(error){
              deferred.reject(error);
            });
          }
          else{
            this.post(params).then(function(updated){
              initialize(className,updated.objectId);
              return getObject();
            }).then(function(row){
              deferred.resolve(row);
            },function(error){
              deferred.reject(error);
            });
          }

          return deferred.promise;
        }
      }
    }

  }
})();