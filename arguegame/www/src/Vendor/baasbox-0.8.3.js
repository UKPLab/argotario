/*!
 * BaasBox SDK 0.8.4
 * https://github.com/baasbox/JS-SDK
 *
 * Released under the Apache license
 */

var BaasBox = (function() {

    var instance;
    var user;
    var endPoint;
    var COOKIE_KEY = "baasbox-cookie";

    // check if the user is using Zepto, otherwise the standard jQuery ajaxSetup function is executed
    if (window.Zepto) {
      $.ajaxSettings.global = true;
      $.ajaxSettings.beforeSend = function(r, settings) {
      if (BaasBox.getCurrentUser()) {
        r.setRequestHeader('X-BB-SESSION', BaasBox.getCurrentUser().token);
      }
        r.setRequestHeader('X-BAASBOX-APPCODE', BaasBox.appcode);
      };
    } else {
      $.ajaxSetup({
         global: true,
         beforeSend: function(r, settings) {
           if (BaasBox.getCurrentUser()) {
             r.setRequestHeader('X-BB-SESSION', BaasBox.getCurrentUser().token);
           }
           r.setRequestHeader('X-BAASBOX-APPCODE', BaasBox.appcode);
         }
      });
    }

    function createInstance() {
      var object = new Object("I am the BaasBox instance");
      return object;
    }

    function setCurrentUser(userObject) {
      if (userObject === null) {
        return;
      }
      this.user = userObject;
      // if the user is using Zepto, then local storage must be used (if supported by the current browser)
      if (window.Zepto && window.localStorage) {
        window.localStorage.setItem(COOKIE_KEY, JSON.stringify(this.user));
      } else {
        $.cookie(COOKIE_KEY, JSON.stringify(this.user));
      }
    }

    function getCurrentUser() {
      // if the user is using Zepto, then local storage must be used (if supported by the current browser)
      if (window.Zepto && window.localStorage) {
        if (localStorage.getItem(COOKIE_KEY)) {
          this.user = JSON.parse(localStorage.getItem(COOKIE_KEY));
        }
      } else {
        if ($.cookie(COOKIE_KEY)) {
          this.user = JSON.parse($.cookie(COOKIE_KEY));
        }
      }
      return this.user;
    }

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

    return {
      appcode: "",
      pagelength: 50,
      timeout: 20000,
      version: "0.9.0",
      // permission constants
      READ_PERMISSION: "read",
      DELETE_PERMISSION: "delete",
      UPDATE_PERMISSION: "update",
      ALL_PERMISSION: "all",

      // role constants, by default in the BaasBox back end
      ANONYMOUS_ROLE: "anonymous",
      REGISTERED_ROLE: "registered",
      ADMINISTRATOR_ROLE: "administrator",

      isEmpty: function(ob) {
          for (var i in ob) {
            return false;
          }
          return true;
      },

      getInstance: function() {
        if (!instance) {
          instance = createInstance();
        }
        return instance;
      },

      setEndPoint: function(endPointURL) {
        var regexp = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
        if (regexp.test(endPointURL)) {
          this.endPoint = endPointURL;
        } else {
          alert(endPointURL + " is not a valid URL");
        }
      },

      endPoint: function() {
          return this.endPoint;
      },

      login: function(user, pass) {
        var deferred = buildDeferred();
        var url = BaasBox.endPoint + '/login';
        var loginRequest = $.post(url, {
          username: user,
          password: pass,
          appcode: BaasBox.appcode
        })
        .done(function(res) {
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
      },

      logout: function(cb) {
        var deferred = buildDeferred();
        var u = getCurrentUser();
        if (u === null) {
          return deferred.reject({"data" : "ok", "message" : "User already logged out"})
        }
        var url = BaasBox.endPoint + '/logout';
        var req = $.post(url, {})
          .done(function (res) {
            if(window.Zepto && window.localStorage) {
              window.localStorage.removeItem(COOKIE_KEY);
            } else {
              $.cookie(COOKIE_KEY, null);
            }
            setCurrentUser(null);
            deferred.resolve({"data": "ok","message": "User logged out"})
          .fail(function (error) {
              deferred.reject(error)
           })
        });
        return deferred.promise();
      },

      signup: function(user, pass, acl) {
        var deferred = buildDeferred();
        var url = BaasBox.endPoint + '/user';
        var postData = {username: user, password: pass}
        if (acl !== undefined || !this.isEmpty(acl)) {
          var visibilityProperties = Object.getOwnPropertyNames(acl)
          for (prop in acl) {
            postData[prop] = acl[prop]
          }
        }
        var req = $.ajax({
          url: url,
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(postData)
        }).done(function (res) {
        setCurrentUser({
            "token": res.data.token,
            "user": res.data.user.user,
            "customData": res.data.user.customData
          });
            deferred.resolve(getCurrentUser());
          })
          .fail(function(error) {
            deferred.reject(error)
          })
        return deferred.promise();
      },

      getCurrentUser: function() {
          return getCurrentUser();
      },

      fetchCurrentUser: function () {
        return $.get(BaasBox.endPoint + '/me')
      },

      createCollection: function(collection) {
        return $.post(BaasBox.endPoint + '/admin/collection/' + collection)
      },

      deleteCollection: function(collection) {
        return $.ajax({
          url: BaasBox.endPoint + '/admin/collection/' + collection,
          method: 'DELETE'
        })
      },

      loadCollectionWithParams: function(collection, params) {
        var deferred = buildDeferred();
        var url = BaasBox.endPoint + '/document/' + collection;
        var req = $.ajax({
            url: url,
            method: 'GET',
            timeout: BaasBox.timeout,
            dataType: 'json',
            data: params
        })
          .done(function(res) {
            deferred.resolve(res['data']);
          })
          .fail(function(error) {
            deferred.reject(error);
          })
        return deferred.promise();
      },

      loadCollection: function(collection) {
        return BaasBox.loadCollectionWithParams(collection, {page: 0, recordsPerPage: BaasBox.pagelength});
      },

      loadObject: function (collection, objectId) {
        return $.get(BaasBox.endPoint + '/document/' + collection + '/' + objectId)
      },

      save: function(object, collection) {
        var deferred = buildDeferred();
        var method = 'POST';
        var url = BaasBox.endPoint + '/document/' + collection;
        if (object.id) {
          method = 'PUT';
          url = BaasBox.endPoint + '/document/' + collection + '/' + object.id;
        }
        json = JSON.stringify(object);
        var req = $.ajax({
          url: url,
          type: method,
          contentType: 'application/json',
          dataType: 'json',
          data: json
        })
          .done(function(res) {
            deferred.resolve(res['data']);
          })
          .fail(function(error) {
            deferred.reject(error);
          })
        return deferred.promise();
      },

      updateField: function(objectId, collection, fieldName, newValue) {
        var deferred = buildDeferred();
        url = BaasBox.endPoint + '/document/' + collection + '/' + objectId + '/.' + fieldName;
        var json = JSON.stringify({
            "data": newValue
        });
        var req = $.ajax({
          url: url,
          type: 'PUT',
          contentType: 'application/json',
          dataType: 'json',
          data: json
        })
          .done(function(res) {
            deferred.resolve(res['data']);
          })
          .fail(function(error) {
            deferred.reject(error);
          })
        return deferred.promise();
      },

      deleteObject: function(objectId, collection) {
        return $.ajax({
          url: BaasBox.endPoint + '/document/' + collection + '/' + objectId,
          method: 'DELETE'
        });
      },

      fetchObjectsCount: function (collection) {
        return $.get(BaasBox.endPoint + '/document/' + collection + '/count');
      },

      grantUserAccessToObject: function (collection, objectId, permission, username) {
        return $.ajax({
            url: BaasBox.endPoint + '/document/' + collection + '/' + objectId + '/' + permission + '/user/' + username,
            method: 'PUT'
        });
      },

      revokeUserAccessToObject: function (collection, objectId, permission, username) {
        return $.ajax({
            url: BaasBox.endPoint + '/document/' + collection + '/' + objectId + '/' + permission + '/user/' + username,
            method: 'DELETE'
        });
      },

      grantRoleAccessToObject: function (collection, objectId, permission, role) {
        return $.ajax({
            url: BaasBox.endPoint + '/document/' + collection + '/' + objectId + '/' + permission + '/role/' + role,
            method: 'PUT'
        });
      },

      revokeRoleAccessToObject: function (collection, objectId, permission, role) {
        return $.ajax({
            url: BaasBox.endPoint + '/document/' + collection + '/' + objectId + '/' + permission + '/role/' + role,
            method: 'DELETE'
        });
      },

      // only for json assets
      loadAssetData: function(assetName) {
        var deferred = buildDeferred();
        var url = BaasBox.endPoint + '/asset/' + assetName + '/data';
        var req = $.ajax({
          url: url,
          method: 'GET',
          contentType: 'application/json',
          dataType: 'json'
        })
          .done(function(res) {
            deferred.resolve(res['data']);
          })
          .fail(function(error) {
            deferred.reject(error);
          })
        return deferred.promise();
      },

      getImageURI: function(name, params) {
        var deferred = buildDeferred();
        var uri = BaasBox.endPoint + '/asset/' + name;
        var r;
        if (params === null || this.isEmpty(params)) {
          return deferred.resolve({"data": uri + "?X-BAASBOX-APPCODE=" + BaasBox.appcode})
        }
        for (var prop in params) {
          var a = [];
          a.push(prop);
          a.push(params[prop]);
          r = a.join('/');
        }
        uri = uri.concat('/');
        uri = uri.concat(r);
        p = {};
        p['X-BAASBOX-APPCODE'] = BaasBox.appcode;
        var req = $.get(uri, p)
          .done(function(res) {
            deferred.resolve({"data": this.url});
          })
          .fail(function(error) {
            (error);
          });
        return deferred.promise();
      },

      fetchUserProfile: function (username) {
        return $.get(BaasBox.endPoint + '/user/' + username)
      },

      fetchUsers: function (params) {
        return $.ajax({
            url: BaasBox.endPoint + '/users',
            method: 'GET',
            data: params
        });
      },

      updateUserProfile: function (params) {
        console.log('arr params look like dis', params)
        return $.ajax({
            url: BaasBox.endPoint + '/me',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(params)
        });
      },

      changePassword: function (oldPassword, newPassword) {
        return $.ajax({
            url: BaasBox.endPoint + '/me/password',
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({old: oldPassword, new: newPassword})
        });
      },

      resetPassword: function() {
        var user = getCurrentUser();
        return $.get(BaasBox.endPoint + '/user/' + user._id + '/password/reset');
      },

      followUser: function (username) {
        return $.post(BaasBox.endPoint + '/follow/' + username);
      },

      unfollowUser: function (username) {
        return $.ajax({
          url: BaasBox.endPoint + '/follow/' + username,
          method : 'DELETE'
        });
      },

      fetchFollowers: function (username) {
        return $.get(BaasBox.endPoint + '/followers/' + username);
      },

      fetchFollowing: function (username) {
        return $.get(BaasBox.endPoint + '/following/' + username);
      },

	    sendPushNotification: function(params) {
        return $.ajax({
          url: BaasBox.endPoint + '/push/message',
          method: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(params)
        })
      },

      uploadFile: function(formData) {
        return $.ajax({
          url: BaasBox.endPoint + '/file',
          type: 'POST',
          data:  formData,
          mimeType: "multipart/form-data",
          contentType: false,
          cache: false,
          processData:false
        })
      },

      fetchFile: function(fileId) {
        return $.get(BaasBox.endPoint + '/file/' + fileId + "?X-BB-SESSION=" + BaasBox.getCurrentUser().token)
      },

      deleteFile: function(fileId) {
        return $.ajax({
          url: BaasBox.endPoint + '/file/' + fileId,
          method : 'DELETE'
        });
      },

      fetchFileDetails: function(fileId) {
        return $.get(BaasBox.endPoint + '/file/details/' + fileId)
      },

      grantUserAccessToFile: function (fileId, permission, username) {
        return $.ajax({
            url: BaasBox.endPoint + '/file/' + fileId + '/' + permission + '/user/' + username,
            method: 'PUT'
        });
      },

      revokeUserAccessToFile: function (fileId, permission, username) {
        return $.ajax({
            url: BaasBox.endPoint + '/file/' + fileId + '/' + permission + '/user/' + username,
            method: 'DELETE'
        });
      },

      grantRoleAccessToFile: function (fileId, permission, rolename) {
        return $.ajax({
            url: BaasBox.endPoint + '/file/' + fileId + '/' + permission + '/role/' + rolename,
            method: 'PUT'
        });
      },

      revokeRoleAccessToFile: function (fileId, permission, rolename) {
        return $.ajax({
            url: BaasBox.endPoint + '/file/' + fileId + '/' + permission + '/role/' + rolename,
            method: 'DELETE'
        });
      },

    };
})();

/*!
 * jQuery Cookie Plugin v1.4.0
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2013 Klaus Hartl
 * Released under the MIT license
 */

(function(factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as anonymous module.
        define(['jquery'], factory);
    } else {
        // Browser globals.
        factory(jQuery);
    }
}(function($) {

    var pluses = /\+/g;

    function encode(s) {
        return config.raw ? s : encodeURIComponent(s);
    }

    function decode(s) {
        return config.raw ? s : decodeURIComponent(s);
    }

    function stringifyCookieValue(value) {
        return encode(config.json ? JSON.stringify(value) : String(value));
    }

    function parseCookieValue(s) {
        if (s.indexOf('"') === 0) {
            // This is a quoted cookie as according to RFC2068, unescape...
            s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }

        try {
            // Replace server-side written pluses with spaces.
            // If we can't decode the cookie, ignore it, it's unusable.
            // If we can't parse the cookie, ignore it, it's unusable.
            s = decodeURIComponent(s.replace(pluses, ' '));
            return config.json ? JSON.parse(s) : s;
        } catch (e) {}
    }

    function read(s, converter) {
        var value = config.raw ? s : parseCookieValue(s);
        return $.isFunction(converter) ? converter(value) : value;
    }

    var config = $.cookie = function(key, value, options) {

        // Write
        if (value !== undefined && !$.isFunction(value)) {
            options = $.extend({}, config.defaults, options);

            if (typeof options.expires === 'number') {
                var days = options.expires,
                    t = options.expires = new Date();
                t.setDate(t.getDate() + days);
            }

            return (document.cookie = [
                encode(key), '=', stringifyCookieValue(value),
                options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
                options.path ? '; path=' + options.path : '',
                options.domain ? '; domain=' + options.domain : '',
                options.secure ? '; secure' : ''
            ].join(''));
        }

        // Read

        var result = key ? undefined : {};

        // To prevent the for loop in the first place assign an empty array
        // in case there are no cookies at all. Also prevents odd result when
        // calling $.cookie().
        var cookies = document.cookie ? document.cookie.split('; ') : [];

        for (var i = 0, l = cookies.length; i < l; i++) {
            var parts = cookies[i].split('=');
            var name = decode(parts.shift());
            var cookie = parts.join('=');

            if (key && key === name) {
                // If second argument (value) is a function it's a converter...
                result = read(cookie, value);
                break;
            }

            // Prevent storing a cookie that we couldn't decode.
            if (!key && (cookie = read(cookie)) !== undefined) {
                result[name] = cookie;
            }
        }

        return result;
    };

    config.defaults = {};

    $.removeCookie = function(key, options) {
        if ($.cookie(key) === undefined) {
            return false;
        }

        // Must not alter options, thus extending a fresh object...
        $.cookie(key, '', $.extend({}, options, {
            expires: -1
        }));
        return !$.cookie(key);
    };

}));
