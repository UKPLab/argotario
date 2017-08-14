(function (BaasBox) {

    function buildDeferred() {
        var dfd = new $.Deferred();
        var promise = {};
        promise.success = function(fn) {
            promise.then(function(data) {
                fn(data);
            });
            return promise;
        };
        promise.error = function(fn) {
            promise.then(null, function(error) {
                fn(error);
            });
            return promise;
        };

        dfd.promise(promise)
        return dfd;
    }


    modelMatch = function(model,scheme) {
        if (typeof model !== 'object' || !scheme) return false;

        var match = true;

        var schemeProperties = Object.getOwnPropertyNames(scheme);
        for(var idx in schemeProperties) {
            var property = schemeProperties[idx];
            if (typeof scheme[property]=='function' || typeof property=='function') continue;

            match = match && model.hasOwnProperty(property) && typeof model[property] == typeof scheme[property];
            if (typeof scheme[property]=='object')
                match = match && modelMatch(model[property],scheme[property]);

            if (!match) return false;
        }

        return match;
    }

    angular.extend(BaasBox, {

        callPlugin: function(httpMethod, pathWithPlugin, data) {
            var deferred = buildDeferred();
            var url = BaasBox.endPoint + '/plugin/'+pathWithPlugin;
            var req = $[httpMethod.toLowerCase()](url, data)
            .done(function (res) {
                deferred.resolve(res);
            })
            .fail(function (error) {
                deferred.reject(error)
            });
            return deferred.promise();
        },


        objectMatchesModelScheme: function(object, scheme) {
            return modelMatch(object,scheme);
        },

        requestAccessToken: function() {
            //TODO: is it required, now that we have unauthCache?
            var deferred = buildDeferred();
            var url = BaasBox.endPoint + '/login';
            var data={};
            data['u'+'s'+'e'+'r'+'n'+'a'+'m'+'e'] = 'anonymous';
            data['p'+'a'+'s'+'s'+'w'+'o'+'r'+'d'] = '.';
            data['app'+'code'] = BaasBox.appcode
            var loginRequest = $.post(url, data).done(function(res) {
            setCurrentUser({
                "token": res.data.token,
                "user": res.data.user.user,
                "customData": res.data.user.customData
              });
              deferred.resolve(getCurrentUser());
            })
            .fail(function(error) {
              deferred.reject(error);
              console.log(error);
            });
            return deferred.promise();
        }

    })
}(BaasBox));
