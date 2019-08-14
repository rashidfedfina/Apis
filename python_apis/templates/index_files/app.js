var app = angular.module('Infinity', ['dndLists', 'ui.bootstrap', 'ngSanitize']);

app.config(function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist(['self', '**']);
});

app.service('apicallback', function($http) {
    this.apiCall = function(method, url, params_s, extra_params, successCallback, failCallback, params_s_key, override_base= undefined) {
        var request_obj = {};
         var baseurlc = baseurl;
            if (override_base != undefined)
                baseurlc = override_base;
                
        if (params_s_key == 'file') {
            var formdata = new FormData();
            for (var i = 0; i < params_s.length; i++) {
                formdata.append(params_s[0].name, params_s[0]);
            }
           
            request_obj = {
                method: 'POST',
                url: baseurlc + url,
                data: formdata,
                headers: {
                    'Content-Type': undefined
                }

            };
        }
        else {
            request_obj = {
                method: method, url: baseurlc + url, headers: { 'Content-Type': 'application/json; charset=utf-8' }
            };
            request_obj[(params_s_key == undefined ? 'params' : params_s_key)] = params_s;
        }
        console.log('REQUEST TO BE SENT : ', request_obj);

        $http(
            request_obj
        ).then(function mySuccess(response) {
            console.log('RESP ', response.data);
            //console.log('val_i : ', i);
            if (successCallback != undefined)
                successCallback(response.data, extra_params);
        }, function myError(response) {
            console.log('ERR ', response);

            //$scope.myWelcome = response.statusText;
            //console.log('val_i : ', i);
            if (failCallback != undefined)
                failCallback(response, extra_params);
        });
    }

    this.getPages = function(successCallback) {
        this.apiCall('GET', '/Home/GetPages', undefined, undefined, successCallback);
    }

    this.getElements = function(pageid, successCallback) {
        //GetElements
        this.apiCall('GET', '/Home/GetElements', { pageid: pageid }, undefined, successCallback);
    }

    this.GetComponents = function(pageid, sViewId, successCallback) {
        //GetElements
        this.apiCall('GET', '/Home/GetComponents', { pageid: pageid, predefined: false, sViewId: sViewId }, undefined, successCallback);
    }

    this.getLoadAPI = function(pageid, successCallback) {
        this.apiCall('GET', '/Home/GetLoadAPIs', { pageid: pageid }, undefined, successCallback);
    }

});




