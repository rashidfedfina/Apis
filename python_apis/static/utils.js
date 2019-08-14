//to match return data from api, in expressions

var True = true;
var False = false;

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};


function getInputName(inputName) {
    
    //console.log(inputName, inputName.replaceAll('.', '_'));
    return inputName.replaceAll('{.}', '_');
}

function getParameterValue(url_string, param_key) {
    var url = new URL(url_string);
    var c = url.searchParams.get(param_key);
    //console.log(c);
    return c;
}


function findControl(component, nControlId) {
    if (component.lstControls != undefined) {
        for (var i = 0; i < component.lstControls.length; i++) {
            if (component.lstControls[i].nControlId == nControlId) {
                var comp = component.lstControls[i];
                return comp;//findControl(comp, nControlId);
            }
        }
    }

    if (component.lstComponents != undefined) {
        for (var i = 0; i < component.lstComponents.length; i++) {
            var temp = findControl(component.lstComponents[i], nControlId);
            if (temp != undefined)
                return temp;
        }
    }
}

function getAllControls(component,lstControls) {
    
    if (component.lstControls != undefined) {
        for (var i = 0; i < component.lstControls.length; i++) {
            if(component.lstControls[i].nControlId > 0)
                lstControls.push(component.lstControls[i]);
        }
    }

    if (component.lstComponents != undefined) {
        for (var i = 0; i < component.lstComponents.length; i++) {
            var temp = getAllControls(component.lstComponents[i], lstControls);
            if (temp != undefined)
                return temp;
        }
    }
}


function getControl(components, nControlId) {

    for (var j = 0; j < components.length; j++) {
        ctrl = findControl(components[j], nControlId);
        console.log('obj ctrl : ', ctrl);
        if (ctrl != undefined) {
            return ctrl;
        }
    }
}

function parseEvalText(components, evalText, scope) {
    var newText = evalText + '';

    var foundRet = findSelector(components, newText, scope);
    var i = 0;
    while (foundRet.found && i++ < 10) {
        foundRet = findSelector(components, foundRet.text, scope);
    }
    return foundRet;
}

function findSelector(components, text, scope) {
    foundSelector = false;
    var startends = [
                     { start: '#%', end: '%#', helptext: 'Get Value of Response with Provided Key' },
                     { start: '{{', end: '}}', helptext: 'Get Value of Control' },
                     { start: '{%', end: '%}', helptext: 'Set Value to Control' },
                     { start: '{|', end: '|}', helptext: 'Set Property of Control' },                   
                    ];

    for (var i = 0; i < startends.length; i++) {
        var cur_startend = startends[i];

        if (text.lastIndexOf(cur_startend.start) > -1) {
            if (!foundSelector)
                foundSelector = true;
            //if any item is found then return true, so for when we know when to pass text again

            var queryStr = text.substring(text.lastIndexOf(cur_startend.start), text.lastIndexOf(cur_startend.end) + cur_startend.start.length);
            var newQueryStr = queryStr + '';
            if (cur_startend.start == '#%') {
                //for scope response objects
                var baseQuery = newQueryStr.replace(cur_startend.start, '').replace(cur_startend.end, '');
                if (baseQuery.indexOf('.') > -1) {
                    newQueryStr = 'scope.responseObj' + (baseQuery.length == 0 ? '' : '.') + baseQuery;
                    // if does not have any data then get responseObj Directly
                }
                else {
                    newQueryStr = 'scope.responseObj' + (baseQuery.length == 0 ? '' : '["') + baseQuery + (baseQuery.length == 0 ? '' : '"]');
                    // only single object is mentioned, [] added to handle status-code like objects
                }
                
            }
            else if(cur_startend.start == "{{") {               
                if (newQueryStr.indexOf('Control') > -1) {
                    newQueryStr = newQueryStr.replace(cur_startend.start, '').replace(cur_startend.end, '').replace('Control', '');

                    var ctrl = getControl(components, newQueryStr);
                    if (ctrl != undefined) {
                        //if (cur_startend.start == "%{") {
                        //    newQueryStr = ctrl;
                        //}
                        //else {
                        newQueryStr = ctrl.xModel;
                        //return { found: false, text: newQueryStr };
                       
                        //}
                    }
                }
            }
            else if (cur_startend.start == "{%") {
                if (newQueryStr.indexOf('Control') > -1) {
                    var withControl = newQueryStr + '';
                    newQueryStr = newQueryStr.replace(cur_startend.start, '').replace(cur_startend.end, '').replace('Control', '');

                    var ctrl = getControl(components, newQueryStr);
                    if (ctrl != undefined) {
                        //if (cur_startend.start == "%{") {
                        //    newQueryStr = ctrl;
                        //}
                        //else {
                        var txt = text.replace(withControl + '=', '');
                        //try{
                        //    scp.$apply(function () {
                        //        ctrl.xModel = eval(txt);
                        //    });
                        //}
                        //catch (err) {
                       
                        //}
                        console.log('Setter : ', txt, ' Control : ', ctrl);

                        setTimeout(function () {
                            try {
                                ctrl.scope_ctrl.$apply(function () {
                                    ctrl.xModel = eval(txt);
                                });
                            }
                            catch (err) {
                                console.log('Err Setting xModel :: ', err);
                            }
                            ctrl.scope_ctrl.changeModel(ctrl, undefined, true);
                        }, 50);
                        //updateModelConditions(scope.lstShowConditions, ctrl, scope);

                        return {found: false, text : ''};

                       
                        //}
                    }
                }
            }

            else if (cur_startend.start == "{|") {
                if (newQueryStr.indexOf('Control') > -1) {
                    var withControl = newQueryStr + '';

                    newQueryStr = newQueryStr.replace(cur_startend.start, '').replace(cur_startend.end, '');

                    var propName = newQueryStr.substring(newQueryStr.indexOf('['), newQueryStr.indexOf(']') + 1);

                    newQueryStr = newQueryStr.replace(propName, '').replace('Control', '');

                    propName = propName.replace('[', '').replace(']', '');
                    var ctrl = getControl(components, newQueryStr);
                    if (ctrl != undefined) {
                        var txt = text.replace(withControl + '=', '');
                                               

                        setTimeout(function () {
                            try {
                                ctrl.scope_ctrl.$apply(function () {
                                    ctrl[propName] = eval(txt);
                                });
                            }
                            catch (err) {
                                console.log('Err Setting xModel :: ', err);
                            }
                            ctrl.scope_ctrl.changeModel(ctrl, undefined, true);
                        }, 50);
                        //updateModelConditions(scope.lstShowConditions, ctrl, scope);

                        return {found: false, text : ''};

                       
                        //}
                    }
                }
            }

            text = text.replace(queryStr, newQueryStr);
            console.log(queryStr);

            if(foundSelector)
                break;
        }
    }

    return { found : foundSelector , text : text};
}

//function getBodyList(lstControls,existingBodyLst) {
    
//    if (lstAPIDetails.lstBody != undefined) {
//        for (var i = 0; i < lstAPIDetails.lstBody.length; i++) {
//            if (lstAPIDetails.lstBody[i].lstBody != undefined) {

//            }
//            else if (lstAPIDetails.lstBody[i].nBodyId > 0)
//                existingBodyLst.push(lstAPIDetails.lstBody[i]);
//        }
//    }

//    if (lstControls.lstAPIDetails != undefined) {
//        for (var i = 0; i < lstControls.lstAPIDetails.length; i++) {
//            var temp = getBodyList(lstControls.lstAPIDetails[i], existingBodyLst);
//            if (temp != undefined)
//                return temp;
//        }
//    }
//}

//function getChildBodyList(lstControls, existingBodyLst) {

//    if (lstAPIDetails.lstBody != undefined) {
//        for (var i = 0; i < lstAPIDetails.lstBody.length; i++) {
//            if (lstAPIDetails.lstBody[i].lstBody != undefined) {

//            }
//            else if (lstAPIDetails.lstBody[i].nBodyId > 0)
//                existingBodyLst.push(lstAPIDetails.lstBody[i]);
//        }
//    }

//    if (lstControls.lstAPIDetails != undefined) {
//        for (var i = 0; i < lstControls.lstAPIDetails.length; i++) {
//            var temp = getBodyList(lstControls.lstAPIDetails[i], existingBodyLst);
//            if (temp != undefined)
//                return temp;
//        }
//    }
//}

function selectNextTab() {
    if ($('#crumbs ul li.active').next('li').length > 0) {
        $('#crumbs ul li.active').next('li').click();
    }
    else {
        $('#crumbs ul li:first').click(); 
    }
}