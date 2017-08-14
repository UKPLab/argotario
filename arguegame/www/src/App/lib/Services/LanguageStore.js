/** The LanguageStore is a service that provides access to the current language the front-end shows. */

angular.module('arg.services').provider('LanguageStore', function() {

    var languages = [
      {_id:"de", title: "Deutsch", flag: "de"},
      {_id:"en", title: "English", flag: "gb"}
    ];

    var _activeLanguage = {_id:"de", title: "Deutsch", flag: "de"};

    this.$get = function($http,$q,$rootScope,$translate) { return {

        languageWithId: function(params) {
            ensure(params,'id');

            return $q(function (resolve,reject) {
                numLang = languages.length;
                for(i=0; i<numLang; ++i){
                  if(languages[i]._id == params.id){
                    resolve(languages[i]);
                  }
                }
                reject({success: false, error: "language not found"});
            });
        },
        allLanguages: function(params) {
          return $q(function (resolve,reject) {
              resolve(languages);
          });
        },
        getTitles: function(params) {
            return $q(function (resolve,reject) {
                resolve(languages);
            });
        },
        activeLanguage: function() {
            return _activeLanguage;
        },
        updateActiveLanguage: function(id) {
            promise = this.languageWithId({'id' : id});
            return promise.then(function(lang){
                _activeLanguage.id = lang._id;
                _activeLanguage.title = lang.title;
                _activeLanguage.flag = lang.flag;
                $translate.use(id).then(function(id){
                  console.log('successfully changed language to ' + id);
                }, function(id){
                  console.log('changing language to ' + id + ' did not work...');
                });

                return _activeLanguage;
            });
        }
    }}
});
