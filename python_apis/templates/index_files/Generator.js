app.directive('inputItem', function ($compile) {
    var linker = function (scope, element, attrs) {

        var elementStart = '<div class="form-group"><label>A' + scope.type + '</label>';
        var elementEnd = '{{model}}</div>';
        var elementMid = '';
        if (scope.type == 'text') {
            elementMid = '<input type="text" class="form-control" ng-model="model" />';
        }
        else if (scope.type == 'number') {
            elementMid = '<input type="number" class="form-control" ng-model="model" min="{{minVal}}" max="{{maxVal}}" />';
        }
        element.html(elementStart + elementMid + elementEnd);

        $compile(element.contents())(scope);

    };

    return {
        restrict: 'E',
        link: linker,
        scope: {
            type: '=',
            model: '=',

            required: '=',
            colsize: '=',

            helptext: '=',
            maxVal: '=',
            minVal: '=',
            regex: '=',

        }
    };
});

app.directive('dateInput', function () {
    return {
        restrict: 'A',
        scope: {
            ngModel: '='
        },
        link: function (scope) {
            if (scope.ngModel) scope.ngModel = new Date(scope.ngModel);
        }
    }
});


app.directive('pageItem', function ($compile) {
    var linker = function (scope, element, attrs) {
        console.log(scope);

        var elementStart = '<div class="container">';
        var elementEnd = '</div>';
        var elementMid = '';
        if (scope.type == 'text' || scope.type == 'number' || scope.type == 'password') {
            elementMid = '<input-item model="model" type="type"/>';
        }

        element.html(elementStart + elementMid + elementEnd);

        $compile(element.contents())(scope);


    };

    return {
        restrict: 'E',
        link: linker,
        scope: {
            type: '=',
            model: '=',

            required: '=',
            colsize: '=',

            helptext: '=',
            maxVal: '=',
            minVal: '=',
            regex: '=',

        }
    };
});

app.directive('dynamicModel', ['$compile', '$parse', function ($compile, $parse) {
    return {
        restrict: 'A',
        terminal: true,
        priority: 100000,
        link: function (scope, elem) {
            var name = $parse(elem.attr('dynamic-model'))(scope);
            elem.removeAttr('dynamic-model');
            elem.attr('ng-model', name);
            $compile(elem)(scope);
        }
    };
}]);

//app.directive('tooltip', function () {
//    return {
//        restrict: 'A',
//        link: function (scope, element, attrs) {
//            element.hover(function () {
//                // on mouseenter
//                element.tooltip('show');
//            }, function () {
//                // on mouseleave
//                element.tooltip('hide');
//            });
//        }
//    };
//});

function updateModelConditions(conditions, control, scope) {
    var nControlId = control.nControlId;
    for (var i = 0; i < conditions.length; i++) {
        if (conditions[i].text.indexOf('Control' + nControlId) > -1) {
            console.log('checked by ', control);

            var temp_val_txt = parseEvalText(scope.$root.uicomponents, conditions[i].text, scope).text;
            temp_val = eval(temp_val_txt);
            console.log('temp_val', temp_val);

            angular.element($('div[component-id="' + conditions[i].nComponentId + '"]')).scope().updateStatus(this);

        }
    }
}

app.directive('fieldElement', ['$compile', '$parse', '$http', 'apicallback','$timeout', '$sce', function ($compile, $parse, $http, apicallback, $timeout, $sce) {

    var linker = function (scope, element, attrs, formCtrl) {
        //console.log('FieldElement ', scope);
        scope.baseTemplate = '';
        scope.htmlData = '';
        scope.optionBind = function () {        console.log('optiobind Called');            try{
            for(var i =0;i<scope.control.lstCustomCode.length;i++)
            {
                if (scope.control.lstCustomCode[i].sCustomType == "OptionBind")
                {
                    var lst_details = JSON.parse(scope.control.lstCustomCode[i].sCustomCode);
                    var url = parseEvalText(scope.$root.uicomponents, lst_details.url, scope).text;//lst_details.url;                    //http://119.191.1.1/dta?param1={{Control1314}}'
                    var new_lstOptions = [];
                    apicallback.apiCall('GET', url, null, { lst_details: lst_details}, function (data, extra) {
                        console.log('lst_details : ', lst_details, ' __data :', data);
                        for (var j = 0; j < data.length; j++) {
                            new_lstOptions.push({ sOption: data[j][lst_details.sOption], sValue: data[j][lst_details.sValue] });
                        }
                        scope.control.lstOptions = new_lstOptions;
                     }, undefined,undefined, '');
                }
            }
           }
            catch (err) {
                console.log('ERR OPTIONBINd : ', err);
            } 
        }        if (scope.control.sType == 'dropdown') {
            scope.optionBind();
        }
        //console.log('ui_components', scope.uicomponents);
        scope.getHtmlTable = function (model) {
            console.log(model);
           
            var jsonObj = undefined;
            try
            {
                jsonObj = angular.fromJson(model);
            }
            catch(e)
            {
                console.log("ERR : ", e);
            }
            if (jsonObj == undefined || jsonObj == null || typeof (jsonObj) != "object") {
                console.log(typeof (model));
                return "";
            }
            var output = scope.getTable(jsonObj);
            console.log('output', output);
            return '<div class="bg-white table-responsive"><div class="tbldat">' + output.htmlTable + '</div><div class="txtdat">' + output.htmlSection + '</div></div>';
        }

        scope.getTable = function (base_var) {
            var htmlSection = '<table class="table table-striped table-sm jsontable-txtbox">';
            if (base_var == undefined || base_var == null)
                return "";
            var htmlTable = "<table class='table table-sm table-bordered table-striped'>";
            
            var head = "<thead><tr>";
            for (var key in base_var) {
                //console.log(key);
                //if (base_var[key] != null && base_var[key] != undefined) {
                    head += "<th>" + key + "</th>";
                //}
            }
            head += "</tr></thead>";

            var body = "<tbody><tr>";
            for (var key in base_var) {
                //console.log(key);
                var tmp_inner = '';
                if (base_var[key] != null && base_var[key] != undefined && typeof(base_var[key]) == "object")
                {
                    tmp_inner = scope.getTable(base_var[key]).htmlTable;
                }
                else
                {
                    if (base_var[key] != null && base_var[key] != undefined) {
                        tmp_inner = base_var[key];
                    }
                }
                body += "<td>" + tmp_inner + "</td>";
            }
            body += "</tr></tbody>";

            htmlTable += head + body + "</table>";

            for (var key in base_var) {
                var tmp_inner = '';
                if (base_var[key] != null && base_var[key] != undefined && typeof (base_var[key]) == "object") {
                    tmp_inner = scope.getTable(base_var[key]).htmlSection;
                }
                else {
                    if (base_var[key] != null && base_var[key] != undefined) {
                        tmp_inner = '<tr><th>' + key + '</th><td>' + base_var[key] + '</td></tr>';
                    }
                }
                // var tmp_inner = '<div><strong>' + key + ' : </strong> ' + base_var[key] + '</div>';
                htmlSection += tmp_inner;

            }

            htmlSection += "</table>";
            console.log(base_var, htmlTable + htmlSection);
            return { htmlTable: htmlTable, htmlSection: htmlSection };
        }

        scope.maxLength = function () {
            if (scope.control.sMaxValue != undefined && scope.control.sMaxValue != null && scope.control.sMaxValue != '' && scope.control.sMaxValue != 0) {
                return parseInt(scope.control.sMaxValue);
            }
            else {
                return undefined;
            }
        }

        scope.lstShowConditions = scope.$root.lstShowConditions;

        if (COMPANY_NAME == 'FEDFINA') {

            if (scope.control.nControlId == "2694") {
                scope.control.bDisabled = true;
            }

            if (scope.control.nControlId == "2848") {
                scope.control.xModel = EMPLOYEE_CODE;
            }
            
            if (scope.control.nControlId == "3212") {
                scope.control.xModel = EMPLOYEE_CODE;
            }
            
            if (scope.control.nControlId == "3195") {
                scope.control.xModel = LEAD_ID;
            }
        }
        else if (COMPANY_NAME == 'INFINITY') {
            if (scope.control.nControlId == '2850') {
                scope.control.xModel = EMPLOYEE_CODE;
            }
        }

        scope.getDate = function (dt) {
            return new Date(dt);
        }
        scope.openDate = function () {
            scope.control.isOpenDate = true;

        }
        scope.options = {
            showWeeks: false
        };

        scope.control.scope_ctrl = scope;

        if (scope.control.sType == 'date') {

            if (scope.control.sMaxValue != undefined && scope.control.sMaxValue != null && scope.control.sMaxValue != '') {
                scope.options['maxDate'] = scope.getDate(eval(scope.control.sMaxValue));

                scope.options['initDate'] = scope.getDate(eval(scope.control.sMaxValue));
            }

            if (scope.control.sMinValue != undefined && scope.control.sMinValue != null && scope.control.sMinValue != '') {
                scope.options['minDate'] = scope.getDate(eval(scope.control.sMinValue));
            }

            try {
                if (scope.control.xModel != null && scope.control.xModel != undefined && typeof (scope.control.xModel) == 'string' && scope.control.xModel != '') {
                    scope.control.xModel = new Date(scope.control.xModel); // recovert date to model
                }
            }
            catch (err) { }

        }

        if (scope.control.sType == 'hidden' || scope.control.sType == 'label') {
            //to handle data put
            scope.control.bValid = true;
            scope.control.bAllValid = true;

        }

        scope.control.errorList = [];
        //scope.uicomponents = $rootScope.uicomponents;
        scope.clickModel = function (el) {

            //for (var i = 0; i < scope.control.lstAPIDetails.length; i++) {
            //console.log('api', scope.control.lstAPIDetails[i]);
            if (!scope.control.processingAPI) {
                if (scope.control.lstAPIDetails.length > 0) {
                    console.log('API condi', scope.control.lstAPIDetails[0].sAPICondition);
                    scope.control.errorList = [];
                    scope.createAPIRequest(scope.control.lstAPIDetails[0], scope.control, 0, el);
                    

                }
            }
        }

        scope.checkAPICondition = function (condition, control, scope) {
            if (condition != null && condition != undefined && condition != "") {
                var temp_val_txt = parseEvalText(scope.$root.uicomponents, condition, scope).text;
                temp_val = eval(temp_val_txt);
                console.log('Check API Condition', temp_val_txt);
                return temp_val == true;
            }
            else
                return true;
        }


        scope.checkAllValidForAPI = function (lstAPI) {

            for (var a = 0; a < scope.$root.uicomponents.length; a++) {
                for (var j = 0; j < lstAPI.lstHeaders.length; j++) {
                    if (lstAPI.lstHeaders[j].Header_ControlId != undefined) {
                        ctrl = findControl(scope.$root.uicomponents[a], lstAPI.lstHeaders[j].Header_ControlId);
                        if (ctrl != undefined && !ctrl.bValid) {
                            console.log('Control Not Valid : ', ctrl, ' Header : ', lstAPI.lstHeaders[j]);
                            scope.control.errorList.push({ errormsg: 'Invalid ' + ctrl.sTitle });
                            scope.control.scope_ctrl.$apply();
                            return false;
                        }
                    }
                }

                for (var k = 0; k < lstAPI.lstBody.length; k++) {
                    if (lstAPI.lstBody[k] != undefined) {
                       // for (var a = 0; a < scope.$root.uicomponents.length; a++) {
                            if (lstAPI.lstBody[k].Body_ControlId != undefined) {
                                ctrl = findControl(scope.$root.uicomponents[a], lstAPI.lstBody[k].Body_ControlId);
                                if (ctrl != undefined && !ctrl.bValid) {
                                    console.log('Control Not Valid : ', ctrl, ' Body : ', lstAPI.lstBody[k]);
                                    scope.control.errorList.push({ errormsg: 'Invalid ' + ctrl.sTitle });
                                    scope.control.scope_ctrl.$apply();

                                    return false;
                                }
                            }
                        //}
                    }
                    //else return true;
                }
            }
            return true;
        }

        scope.changeModel = function (c, el, callBlurInternally) {
            //scope.getHtmlTable();
            updateModelConditions(scope.lstShowConditions, scope.control, scope);
         
            try {
                scope.setLocalValidate(scope.control);
             
            }
            catch (err) {
                console.log('ERR : ', err);
            }
            scope.executeNormalCustomCode();

            if (scope.control.sType == 'dropdown') {
                for (var i = 0; i < scope.control.lstCustomCode.length; i++) {
                    if (scope.control.lstCustomCode[i].sCustomType == "OptionBind") {
                        var lst_details = JSON.parse(scope.control.lstCustomCode[i].sCustomCode);
                        //trigger dependent dropdown optionbind if found dependet dropdown in list
                        if (lst_details.dependents != undefined && lst_details.dependents != null && lst_details.dependents.length > 0) {
                            for(var d = 0;d<lst_details.dependents.length;d++)
                            {
                                for (var j = 0; j < scope.$root.uicomponents.length; j++) {
                                    var ctrl = findControl(scope.$root.uicomponents[j], parseInt(lst_details.dependents[d]));                                    ctrl.scope_ctrl.optionBind();//refreshing dependent dropdown data 
                                }
                            }
                        }
                    }
                }
            }
            // if local validation done
            if (callBlurInternally) {
                scope.blurModel(c, el);
            }

        }

        

        scope.executeNormalCustomCode = function () {
            if (scope.control.bValid) {
                if (scope.control.lstCustomCode != null) {
                    for (var i = 0; i < scope.control.lstCustomCode.length; i++) {
                        if (scope.control.lstCustomCode[i].sCustomType == 'Normal') {
                                var show_eval_text = parseEvalText(scope.$root.uicomponents, scope.control.lstCustomCode[i].sCustomCode, scope).text;
                                console.log('Custom Code - Normal', scope.control.lstCustomCode[i].sCustomCode);
                            }
                        }
                    }
                }
        }

       

        scope.blurModel = function (c, el) {
            if (scope.control.bValid && (!scope.control.bAllValid || scope.control.sType == 'file')) {
                //for (var i = 0; i < scope.control.lstAPIDetails.length; i++) {
                //console.log('api', scope.control.lstAPIDetails[i]);
                if (scope.control.lstAPIDetails.length > 0) {
                    scope.createAPIRequest(scope.control.lstAPIDetails[0], scope.control, 0, el);
                }
                //}
            }
        }

        scope.getParameterValue = function (param) {
            return getParameterValue(window.location.href, param);
        }


        scope.compData = { pageid: scope.getParameterValue("pageid"), sViewId: scope.getParameterValue("sViewId") };

        scope.createAPIRequest = function (lstAPIDetails, control, arrayIndex, element) {
            //scope.setRequestInProcess(control.nControlId, true);
            //if (control.processingAPI) {
            //    return;
            //}
            control.processingAPI = true;
            scope.checkValidationForAPI = true;

            if (lstAPIDetails == undefined)
                return;


            if (!scope.checkAllValidForAPI(lstAPIDetails) || !scope.checkAPICondition(lstAPIDetails.sAPICondition, scope.control, scope)) {
                console.log('bAllValid false');

                if (++arrayIndex < control.lstAPIDetails.length) {
                    //scope.$timeout(function () {
                    setTimeout(function () {
                        scope.createAPIRequest(control.lstAPIDetails[arrayIndex], control, arrayIndex);
                    },200);
                    return;
                }
                else {
                    control.processingAPI = false;
                    control.scope_ctrl.$apply();
                    return
                };
            }

                    scope.APIRequest = {};
                    var lstHeaders = [];
                    var lstBody = [];
                    console.log('API', lstAPIDetails);
                    console.log('lstBody', lstAPIDetails.lstBody);
                    console.log('lstHeaders', lstAPIDetails.lstBody);
                    //for (var i = 0; i < lstAPIDetails.length; i++) {
                    var nAPIId = lstAPIDetails.nAPIId;
                   // var sAPIName = lstAPIDetails.sAPIName;
                    //var sMethodType = lstAPIDetails.sMethodType;
                    var API_ControlId = lstAPIDetails.API_ControlId;
                    var sAPIUrl = lstAPIDetails.sAPIUrl;

                    var API_nParentId = lstAPIDetails.API_nParentId;


                    // Header
                    for (var i = 0; i < lstAPIDetails.lstHeaders.length; i++) {
                        var tmp = angular.copy(lstAPIDetails.lstHeaders[i]);

                        for (var j = 0; j < scope.$root.uicomponents.length; j++) {
                            ctrl = findControl(scope.$root.uicomponents[j], tmp.Header_ControlId);
                            console.log('obj ctrl : ', ctrl);
                            if (ctrl != undefined) {
                                tmp.sHeaderValue = ctrl.xModel;
                            }
                        }
                        lstHeaders.push(tmp);
                    }

                    // body
                    for (var i = 0; i < lstAPIDetails.lstBody.length; i++) {
                        var tmp = angular.copy(lstAPIDetails.lstBody[i]);

                        for (var j = 0; j < scope.$root.uicomponents.length; j++) {
                            ctrl = findControl(scope.$root.uicomponents[j], tmp.Body_ControlId);
                            console.log('obj ctrl : ', ctrl);
                            if (ctrl != undefined) {
                                //if (tmp.sParameterName == 'lead_id') {
                                //    tmp.sParameterValue = scope.$root.lead_id; //scope.getParameterValue("leadid");
                                //}
                                //else {
                                    tmp.sParameterValue = ctrl.xModel;
                                //}
                                break;
                            }
                        }
                        lstBody.push(tmp);
                    }



                    var apiJson = {
                        nAPIId: nAPIId,
                        API_nParentId: API_nParentId,
                       // sMethodType, sMethodType,
                       // sAPIName: sAPIName,
                       sAPIUrl: sAPIUrl,
                        lstHeaders: lstHeaders,
                        lstBody: lstBody
                    };

                    scope.APIRequest = apiJson;
                    console.log('json', scope.APIRequest);


                    var url = '/ExternalAPI/APIConnector';
                    var body = scope.APIRequest;
                    var typed = 'data';
                    if (scope.APIRequest.sAPIUrl == 'pan') {
                        url = '/APITests/GetPan';
                        body = element.files;
                        typed = 'file';
                    }
                    else if (scope.APIRequest.sAPIUrl == 'aadhar') {
                        url = '/APITests/GetAadhar';
                        body = element.files;
                        typed = 'file';
                    }
                    else if (scope.APIRequest.sAPIUrl == 'voter') {
                        url = '/APITests/GetVoter';
                        body = element.files;
                        typed = 'file';
                    }
                    else if (scope.APIRequest.sAPIUrl == 'passport') {
                        url = '/APITests/GetPassport';
                        body = element.files;
                        typed = 'file';
                    }
                    else if (scope.APIRequest.sAPIUrl == 'ITR') {
                        url = '/APITests/GetITR';
                        body = element.files;
                        typed = 'file';
                    }
                    else if (scope.APIRequest.sAPIUrl == 'SaveFile') {
                        url = '/APITests/SaveFile';
                        body = element.files;
                        typed = 'file';
                    }



                    apicallback.apiCall('POST', url, body, { control: control, arrayIndex: arrayIndex }, function (data, extra) {
                        try
                        {
                            scope.responseObj = angular.fromJson(data.json);
                            console.log('scope.responseObj :: ', scope.responseObj);

                            for (var i = 0; i < lstAPIDetails.lstResponse.length; i++) {
                                ctrl = undefined;
                                for (var j = 0; j < scope.$root.uicomponents.length; j++) {
                                    if(ctrl == undefined)
                                        ctrl = findControl(scope.$root.uicomponents[j], lstAPIDetails.lstResponse[i].Response_ControlId);                                   
                                }
                                //console.log('obj ctrl : ', ctrl);
                                //{
                                try {
                                    var temp_val_txt = parseEvalText(scope.$root.uicomponents, lstAPIDetails.lstResponse[i].APIResponseKey, scope).text;
                                    var temp_val = eval(temp_val_txt);
                                    if (ctrl != undefined) {
                                        var apiType = lstAPIDetails.lstResponse[i].sAPItype;
                                        if (apiType == "Normal") {
                                            if (temp_val != undefined) {
                                                ctrl.xModel = temp_val;
                                            }
                                        }
                                        else {
                                            ctrl.bAllValid = temp_val == true;
                                        }
                                    }
                                }
                                catch (err) {
                                    console.log('ERR while processing api data: ', err);
                                }
                                //}
                            
                            }

                            console.log('next api count', extra.control.lstAPIDetails.length);
                            if (++extra.arrayIndex < extra.control.lstAPIDetails.length) {
                                setTimeout(function () {
                                    scope.createAPIRequest(extra.control.lstAPIDetails[extra.arrayIndex], extra.control, extra.arrayIndex);
                                }, 200);
                            }

                        }
                        catch (err) {
                            console.log(err);
                        }
                        control.processingAPI = false;
                        control.scope_ctrl.$apply();

                    }, function () {
                        //fail callback
                        control.processingAPI = false;
                        control.scope_ctrl.$apply();

                    }, typed);

                }

                scope.setRequestInProcess = function (controlId, val) {
                    var foundControl = false;
                    for (var i = 0; i < tmp_Ctrls.length; i++) {
                        if (tmp_Ctrls[i].nControlId == controlId) {
                            foundControl = true;
                            tmp_Ctrls[i].requestInProcess = val;
                        }
                    }

                    if (!foundControl) {
                        tmp_Ctrls.push({ nControlId: controlId, requestInProcess: val });
                    }
                }

                scope.hasAnyValidationResponse = function () {
                    var countValidation = 0;

                    for (var i = 0; i < scope.control.lstAPIDetails.length; i++) {
                        //console.log('lladv', scope.control.lstAPIDetails[i]);
                        if (scope.control.lstAPIDetails[i].lstResponse != undefined) {
                            for (var j = 0; j < scope.control.lstAPIDetails[i].lstResponse.length; j++) {
                                //console.log('aabb', scope.control.lstAPIDetails[i].lstResponse[j]);
                                if (scope.control.lstAPIDetails[i].lstResponse[j].sAPItype == "Validation") {
                                    countValidation++;
                                    break; //if found any stop looking for more
                                }
                            }
                        }
                    }
                    return countValidation > 0;
                }

                scope.setLocalValidate = function (c) {
                    c.bValid = (scope.getInfoMessage(c) ? false : true);//if message contains in infoMessage then it is invalid
                    if (!c.bValid)
                        c.bAllValid = false;

                    if (c.bValid) {
                        var countValidation = 0;
                        try {
                            for (var i = 0; i < scope.control.lstAPIDetails.length; i++) {
                                //console.log('lladv', scope.control.lstAPIDetails[i]);
                                if (scope.control.lstAPIDetails[i].lstResponse != undefined) {
                                    for (var j = 0; j < scope.control.lstAPIDetails[i].lstResponse.length; j++) {
                                        //console.log('aabb', scope.control.lstAPIDetails[i].lstResponse[j]);
                                        if (scope.control.lstAPIDetails[i].lstResponse[j].sAPItype == "Validation") {
                                            countValidation++;
                                            break; //if found any stop looking for more
                                        }
                                    }
                                }
                            }
                            if (countValidation == 0) {
                                c.bAllValid = true;
                            }
                        }
                        catch (e) { console.log("error while setting ballvalid", e) }

                    }
                }

                scope.getInfoMessage = function (c) {
                    //console.log(element, attrs, formCtrl);

                    var controlName = 'Control' + c.nControlId;
                    if (formCtrl[controlName] != undefined) {
                        var error = formCtrl[controlName].$error;

                        //if (errors == 0) {
                        //    return undefined;
                        //}
                        //else
                        if (error.required) {
                            return 'Please Enter Required Information';
                        }
                        else if (error.pattern) {
                            return 'Please Enter Proper Information';
                        }
                        else if (c.lstCustomCode != null) {
                            for (var i = 0; i < c.lstCustomCode.length; i++) {
                                if (c.lstCustomCode[i].sCustomType == 'Validation') {
                                    var show_eval_text = parseEvalText(scope.$root.uicomponents, c.lstCustomCode[i].sCustomCode, scope).text;
                                    if (!(eval(show_eval_text))) {
                                        console.log('error msg for custom code', c.lstCustomCode[i].sCustomMessage);
                                        return c.lstCustomCode[i].sCustomMessage;
                                    }
                                }
                            }
                        }
                        else {
                            return undefined;;
                        }
                    }
                    return undefined;
                }

                scope.getInfoElementClass = function (c) {
                    return scope.getInfoMessage(c) == undefined ? ' pending' : '';
                }

                scope.getTemplateDetails = function () {
                    //Get url, class for div for control type
                    scope.baseTemplate = baseurl + '/Scripts/Components/Templates/';

                    if (scope.control.xModel != undefined && scope.control.xModel != null && typeof (scope.control.xModel) == 'string') {

                        if (scope.control.sType == 'number') {
                            scope.control.xModel = parseFloat(scope.control.xModel);
                            updateModelConditions(scope.lstShowConditions, scope.control, scope);

                        }
                        else if (scope.control.sType == 'checkbox') {
                            scope.control.xModel = scope.control.xModel.toLowerCase() === 'true';
                            updateModelConditions(scope.lstShowConditions, scope.control, scope);

                        }

                    }


                    switch (scope.control.sType) {
                        case 'text':
                            return { url: scope.baseTemplate + 'text.html?v=' + base_version, class: 'form-group' }
                        case 'number':
                            return { url: scope.baseTemplate + 'number.html?v=' + base_version, class: 'form-group' }
                        case 'date':
                            return { url: scope.baseTemplate + 'date.html?v=' + base_version, class: 'form-group' }
                        case 'checkbox':
                            return { url: scope.baseTemplate + 'checkbox.html?v=' + base_version, class: '' }
                        case 'file':
                            return { url: scope.baseTemplate + 'file.html?v=' + base_version, class: 'form-group ' }
                        case 'dropdown':
                            return { url: scope.baseTemplate + 'dropdown.html?v=' + base_version, class: 'form-group ' }
                        case 'label':
                            return { url: scope.baseTemplate + 'label.html?v=' + base_version, class: 'form-group ' }
                        case 'hidden':
                            return { url: scope.baseTemplate + 'hidden.html?v=' + base_version, class: '' }
                        case 'textarea':
                            return { url: scope.baseTemplate + 'textarea.html?v=' + base_version, class: 'form-group' }
                        case 'button':
                            return { url: scope.baseTemplate + 'button.html?v=' + base_version, class: '' }
                        case 'horline':
                            return { url: scope.baseTemplate + 'horline.html?v=' + base_version, class: '' }
                        case 'radiogroup':
                            return { url: scope.baseTemplate + 'radiogroup.html?v=' + base_version, class: '' }
                        case 'link':
                            return { url: scope.baseTemplate + 'link.html?v=' + base_version, class: '' }
                        case 'jsontable':
                            return { url: scope.baseTemplate + 'jsontable.html?v=' + base_version, class: '' }
                        default:
                            return { 'url': scope.baseTemplate + 'blank.html', class: undefined };
                    }
                }

                var template = '<div class="{{getTemplateDetails().class}}" class="{{getTemplateDetailsComp().class}}" ng-include="getTemplateDetails().url" uicomponents="uicomponents"></div>';
                var e = $compile(template)(scope);

                element.replaceWith(e);


                //setTimeout(function () { $(element).tooltip() }, 1000);
                //$timeout(function () { ($element).popover() }, 1000);

                scope.timeUpdate = function () {
                    $timeout(function () {
                        
                        //else {
                        scope.setLocalValidate(scope.control);
                        scope.executeNormalCustomCode();
                        //}
                    }, 1000);
                }

               // if (scope.component.sShowCondition != null && scope.component.sShowCondition != undefined && scope.component.sShowCondition != '') {
                    scope.timeUpdate();
                //}

            };

            return {
                restrict: 'E',
                link: linker,
                require: '^form',
                replace: false,
                transclude: true,

                scope: {
                    control: '=',
                    index: '='
                },
                //template: '<div class="{{getTemplateDetails().class}}" class="{{getTemplateDetailsComp().class}}" ng-include="getTemplateDetails().url"></div>'
            };
        }]);

        var tmp = undefined;
        app.directive('componentElement', ['$compile', '$parse', '$timeout', function ($compile, $parse, $timeout) {
            var linker = function (scope, element, attrs, ctrl) {
                ////console.log('componentElement ', scope, ' index ', scope.index);
                
                scope.external = function (ct) {
                    console.log('aa exx');
                }
                scope.component.scope_comp = scope;
                scope.updateStatus = function (el) {

                    //$(element).hide(

                    console.log('scope.component.sShowCondition ', scope.component.sShowCondition);
                    if (scope.component.sShowCondition != undefined && scope.component.sShowCondition != null && scope.component.sShowCondition != '') {
                        var show_eval_text = parseEvalText(scope.$root.uicomponents, scope.component.sShowCondition, scope).text;
                        var show_eval = eval(show_eval_text);
                        console.log('updateStatus', show_eval);

                        tmp = $('[component-id="' + scope.component.nComponentId + '"]');
                        console.log(tmp);
                        if (show_eval) {
                            //tmp.fadeIn(120);
                            tmp.show(80);
                        }
                        else {
                            //tmp.fadeOut(120);
                            tmp.hide(80);
                        }
                    }
                }
                //scope.$viewChangeListeners.push(function () {
                //    scope.$eval(attrs.ngChange);
                //});
                scope.component.dummy = 'a';

                scope.getTemplateDetailsComp = function () {
                    //Get url, class for div for Component type
                    var baseTemplate = baseurl + '/Scripts/Components/Templates/';

                    switch (scope.component.sComponentType) {
                        case 'STORYBOX':
                            return { url: baseTemplate + 'storybox.html?v=2', class: scope.component.sComponentColClass }
                        case 'STORYTAB':
                            return { url: baseTemplate + 'storytab.html', class: scope.component.sComponentColClass + ' carousel-item ' + (scope.index == 0 ? 'active' : '') }
                        case 'ROWBOX':
                            return { url: baseTemplate + 'rowbox.html', class: scope.component.sComponentColClass }
                        case 'COLBOX':
                            return { url: baseTemplate + 'colbox.html', class: scope.component.sComponentColClass }
                        case 'FIELD':
                            return { url: baseTemplate + 'field.html', class: scope.component.sComponentColClass }
                        case 'SECTION':
                            return { url: baseTemplate + 'section.html', class: scope.component.sComponentColClass }
                        case 'COLLAPSE':
                            return { url: baseTemplate + 'collapse.html', class: '' }
                        case 'TITLEDIV':
                            return { url: baseTemplate + 'titlediv.html', class: '' }

                        default:
                            return { 'url': baseTemplate + 'blank.html', class: undefined };
                    }
                }

                //var template = '<div class="{{getTemplateDetailsComp().class}}" typex="{{component.sComponentType}}" ng-include="getTemplateDetailsComp().url"></div>';
                var template = '<div component-id="' + scope.component.nComponentId + '"  class="' + scope.getTemplateDetailsComp().class + '" typex="' + scope.component.sComponentType + '" ng-include="\'' + scope.getTemplateDetailsComp().url + '\'" uicomponents ="uicomponents"></div>';
                ////console.log(template, '  isparent ', scope.isparent == undefined);
                var e = $compile(template)(scope);

                if (scope.isparent == undefined)
                    element.replaceWith(e);
                else
                    element.html(e);

                scope.timeUpdate = function () {
                    $timeout(function () {
                        if ($('[component-id="' + scope.component.nComponentId + '"]').length == 0) {
                            scope.timeUpdate();
                        }
                        else {
                            scope.updateStatus();
                        }
                    }, 500);
                }

                if (scope.component.sShowCondition != null && scope.component.sShowCondition != undefined && scope.component.sShowCondition != '') {
                    scope.timeUpdate();
                }
                //$compile(element.contents())(scope);
            };

            return {
                restrict: 'A',
                link: linker,
                replace: false,
                transclude: true,

                scope: {
                    component: '=',
                    isparent: '=',
                    index: '=',
                    uicomponents: '='
                },
                //template: '<div class="{{getTemplateDetailsComp().class}}" typex="{{component.sComponentType}}" ng-include="getTemplateDetailsComp().url"></div>'
            };
        }]);

