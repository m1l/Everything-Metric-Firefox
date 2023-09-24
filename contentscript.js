//Author: Milos Paripovic

var useComma;
var useMM;
var useRounding;
var useMO;
var useGiga;
var useSpaces;
var useKelvin;
var degWithoutFahrenheit;
var isUK = false;
var lastquantity = 0;
var skips = 0;
var useBold;
var useBrackets;
var useMetricOnly;
var convertBracketed;
var matchIn;
var convertTablespoon=false;
var convertTeaspoon=false;
var includeQuotes;
var isparsing=false;
var includeImproperSymbols;

function walk(node) {
    if (hasEditableNode(node)) return;

    let child;
    let next;

    switch (node.nodeType) {
        case 1: // Element
        case 9: // Document
        case 11: // Document fragment
            child = node.firstChild;
            while (child) {
                next = child.nextSibling;
                if (/SCRIPT|STYLE|IMG|NOSCRIPT|TEXTAREA|CODE/ig.test(child.nodeName) === false) {
                    walk(child);
                }
                child = next;
            }
            break;
        case 3: // Text node
            procNode(node);
            break;
        default:
            break;
    }
}

var foundDegreeSymbol = false;
function procNode(textNode) {

    let text = textNode.nodeValue;

    if (text.startsWith('{') || text.length<1)
        return;

    //skipping added for quantity and unit in separate blocks - after the number is found, sometimes next node is just a bunch of whitespace, like in cooking.nytimes, so we try again on the next node

    if (lastquantity !== undefined && lastquantity !== 0 && skips < 2) {
        text = ParseUnitsOnly(text, foundDegreeSymbol);
        if (/^[a-zA-Z°º]+$/g.test(text)) {
            lastquantity = 0;
        }
        else {
            skips++;
            if (/[°º]/g.test(text))
                 foundDegreeSymbol=true;
            else
                foundDegreeSymbol=false;

        }
        //console.log(text);
    } else {
        lastquantity = 0;
        if (text.length < 50) {
            let quantity = StringToNumber(text);
            lastquantity = quantity;
            skips = 0;
        }
    }
   if ((lastquantity !== undefined && lastquantity !== 0 && skips <= 2) ||
        /[1-9¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g.test(text)) {
        text = replaceIkeaSurface(text);
        if (includeQuotes)
            text = replaceFeetAndInchesSymbol(text, includeImproperSymbols, convertBracketed, isUK, useMM, useGiga, useRounding, useComma, useSpaces, useBold, useBrackets);
        text = replaceVolume(text, convertBracketed, useMM, useRounding, useComma, useSpaces, useBold, useBrackets);
        text = replaceSurfaceInInches(text, convertBracketed, useMM, useRounding, useComma, useSpaces, useBold, useBrackets);
        text = replaceSurfaceInFeet(text, convertBracketed, useMM, useRounding, useComma, useSpaces, useBold, useBrackets);
        text = replaceFeetAndInches(text, convertBracketed, useMM, useRounding, useComma, useSpaces, useBold, useBrackets);
        text = replacePoundsAndOunces(text);
        text = replaceOtherUnits(text);
        text = replaceMilesPerGallon(text);
        text = replaceFahrenheit(text, degWithoutFahrenheit, convertBracketed, useKelvin, useRounding, useComma, useSpaces, useBold, useBrackets);
        textNode.nodeValue = text;
    }
}

function replaceMilesPerGallon(text) {

    let regex = new RegExp(regstart + intOrFloat + '[ \u00A0]?mpgs?' + unitSuffix + ')', 'ig');

    if (text.search(regex) !== -1) {
        let matches;

        while ((matches = regex.exec(text)) !== null) {
            try {
                //console.log(matches[0]);
                if (!shouldConvert(matches[0], convertBracketed)) continue;
                const fullMatch = matches[1];

                //for (var i=0; i<matches.length; i++)
                //console.log("matches " + i + " " + matches[i])

                var imp = matches[2];
                if (imp !== undefined) {
                    imp = imp.replace(',', '');
                }

                imp = parseFloat(imp);

                if (imp === 0 || isNaN(imp)) continue;
                var l = 235.214583 / imp; // 100 * 3.785411784 / 1.609344 * imp;
                var met = roundNicely(l, useRounding);
                met = formatNumber(met, useComma, useSpaces);

                const insertIndex = matches.index + convertedValueInsertionOffset(fullMatch);
                const metStr = formatConvertedValue(met, '\u00A0L\/100\u00A0km', useBold, useBrackets);
                text = insertAt(text, metStr, insertIndex);
            } catch (err) {
                //console.log(err.message);
            }
        }
    }
    return text;
}

function replaceOtherUnits(text) {

    const len = units.length;
    for (let i = 0; i < len; i++) {
        if (units[i].regex===undefined) continue;
        if (text.search(units[i].regex) !== -1) {
            let matches;

            while ((matches = units[i].regex.exec(text)) !== null) {
                try {
                    if (!shouldConvert(matches[0], convertBracketed)) continue;

                    if ((matches[2] !== undefined) && (/(?:^|\s)([-−]?\d*\.?\d+|\d{1,3}(?:,\d{3})*(?:\.\d+)?)(?!\S)/g.test(matches[2]) === false)) continue;

                    let subtract = 0;
                    if (i == 1) { //in
                        //if (/[a-z#$€£]/i.test(matches[1].substring(0,1)))
                        if (/^[a-z#$€£]/i.test(matches[0]))
                            continue;
                        if (/^in /i.test(matches[0])) //born in 1948 in ...
                            continue;
                        if (!matchIn && / in /i.test(matches[0])) //born in 1948 in ...
                            continue;
                        if (matches[8] !== undefined) {
                            if (hasNumber(matches[7])) continue; //for 1 in 2 somethings
                            if (matches[8] == ' a') continue;
                            if (matches[8] == ' an') continue;
                            if (matches[8] == ' the') continue;
                            if (matches[8] == ' my') continue;
                            if (matches[8] == ' his') continue;
                            if (matches[8] == '-') continue;
                            if (/ her/.test(matches[8])) continue;
                            if (/ their/.test(matches[8])) continue;
                            if (/ our/.test(matches[8])) continue;
                            if (/ your/.test(matches[8])) continue;
                            subtract = matches[8].length;
                        }
                    }
                    if (i == 2) { //ft
                        if (/[°º]/.test(matches[1])) continue;
                        if (/\d/ig.test(matches[5])) continue; //avoid 3' 5"
                    }
                    /*if (i== 1)
                    for (var it=0; it<matches.length; it++)
                     console.log("matches " + it + " " + matches[it]);
                     */
                    let suffix = '';

                    //if (/[\(\)]/.test(matches[0])) continue;

                    const fullMatch = matches[1];
                    var imp = matches[2];

                    if (matches[2] !== undefined) {
                        imp = imp.replace(',', '');

                        if (/[⁄]/.test(matches[2])) { //improvisation, but otherwise 1⁄2 with register 1 as in
                            matches[3] = matches[2];
                            imp = 0;
                        } else {
                            imp = parseFloat(imp);
                        }
                    }
                    //console.log("imp " + imp);
                    if (isNaN(imp))
                        imp = 0;

                    if (i == 1 && / in /i.test(matches[0]) && imp > 1000)
                            continue; //prevents 1960 in Germany

                    if (matches[3] === '/') continue; // 2,438/sqft
                    if (matches[3] !== undefined)
                        imp += evaluateFraction(matches[3]);
                    //console.log("imp " + imp);

                    if (imp === 0 || isNaN(imp)) continue;

                    if (/²/.test(matches[1]))
                        suffix = '²';
                    else if (/³/.test(matches[1]))
                        suffix = '³';
                    else if (((typeof(matches[5]) !== 'undefined') && matches[5].toLowerCase().indexOf('sq') !== -1))
                        suffix = '²';
                    else if (((typeof(matches[5]) !== 'undefined') && matches[5].toLowerCase().indexOf('cu') !== -1))
                        suffix = '³';


                    const metStr = convAndForm(imp, i, suffix, isUK, useMM, useGiga, useRounding, useComma, useSpaces, useBold, useBrackets);

                    let insertIndex = matches.index + convertedValueInsertionOffset(fullMatch);
                    insertIndex = insertIndex - subtract; //subtracts behind bracket
                    text = insertAt(text, metStr, insertIndex);

                } catch (err) {
                    //console.log(err.message);
                }
            }
        }
    }

    return text;
}

function replaceIkeaSurface(text) {//ikea US


    //let regex = new RegExp('((?<!\/)(([0-9]+(?!\/))[\-− \u00A0]([0-9]+[\/⁄][0-9\.]+)?) ?[x\*×] ?(([0-9]+(?!\/))?[\-− \u00A0]([0-9]+[\/⁄][0-9\.]+)?)? ?("|″|”|“|’’|\'\'|′′)([^a-z]|$))', 'ig');
    ////Firefox does not support negative lookbehind so this like is changed from Chrome version
    let regex = new RegExp('([\/]?(([0-9]+(?!\/))[\-− \u00A0]([0-9]+[\/⁄][0-9\.]+)?) ?[x|\*|×] ?(([0-9]+(?!\/))?[\-− \u00A0]([0-9]+[\/⁄][0-9\.]+)?)? ?("|″|”|“|’’|\'\'|′′)([^a-z]|$))', 'ig');
//new ((([\.0-9]+(?!\/)(\.[0-9]+)?)?[\-− \u00A0]([0-9]+[\/⁄][0-9\.]+)?)? ?("|″|”|“|’’|\'\'|′′)([^a-z]|$)))
    let matches;


    while ((matches = regex.exec(text)) !== null) {
        try {
/*
            for (var i=0; i<matches.length; i++)
                console.log("matches " + i + " " + matches[i])*/
            const fullMatch = matches[1];
            //if (isAlreadyConverted(text, convertBracketed)) continue;


            let inches1 = parseFloat(matches[3]);
            if (isNaN(inches1)) inches1 = 0;

            let frac1 = (matches[4]);
            frac1 = evaluateFraction(frac1);
            if (isNaN(frac1)) continue;

            let inches2 = parseFloat(matches[6]);
            if (isNaN(inches2)) inches2 = 0;

            let frac2 = (matches[7]);
            frac2 = evaluateFraction(frac2);
            if (isNaN(frac2)) continue;

            //console.log( inches1 + " " + frac1 + " " + inches2 + " " + frac2);

            inches1 = inches1+frac1;
            inches2 = inches2+frac2;

            let scale = 2.54;
            let unit = spc + "cm";
            if (useMM === true) {
                scale = 25.4;
                unit = spc + "mm"
            }

            let cm1 = formatNumber(roundNicely(inches1 * scale, useRounding), useComma, useSpaces);
            let cm2 = formatNumber(roundNicely(inches2 * scale, useRounding), useComma, useSpaces);


            const metStr = formatConvertedValue(cm1 + spc + "×" + spc + cm2, spc + unit, useBold, useBrackets);

            //text = text.replace(matches[0], metStr);
            text = replaceMaybeKeepLastChar(text, matches[0], metStr);
        } catch (err) {
            console.log(err.message);
        }
    }
    return text;


}

// 1 lb 2 oz
function replacePoundsAndOunces(text) {
    let regex = new RegExp('(([0-9]{0,3}).?(lbs?).?([0-9]+(\.[0-9]+)?).?oz)', 'g');
    if (text.search(regex) !== -1) {
        let matches;

        while ((matches = regex.exec(text)) !== null) {
            try {
                const original = matches[0];
                let lb = matches[2];
                lb = parseFloat(lb);
                let oz = matches[4];
                oz = parseFloat(oz);

                let total = 0;

                total = lb * 16 + oz;

                let kg = formatConvertedValue(roundNicely(total * 0.0283495, useRounding), spc + 'kg', useBold, useBrackets);
                //text = text.replace(matches[0], kg);
                text = replaceMaybeKeepLastChar(text, matches[0], kg);
            } catch (err) {
                // console.log(err.message);
            }
        }
    }
    return text;
}

function StringToNumber(text) {
    let regex = new RegExp('^(?![a-z])(?:[ \n\t]+)?([\.,0-9]+(?![\/⁄]))?(?:[-\− \u00A0])?([¼½¾⅐⅑⅒⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|[0-9]+[\/⁄][0-9]+)?(?:[ \n\t]+)?$', 'ig');
    //console.log("try"+text+"s");

    let matches;

    while ((matches = regex.exec(text)) !== null) {
        try {
            if (matches[1] === undefined && matches[2] === undefined)
                continue;
            let imp = matches[1]; //.replace(',','');
            //console.log("found:"+matches[1]);
            if (matches[1] !== undefined) {
                imp = imp.replace(',', '');

                if (/[⁄]/.test(matches[1])) { //improvisation, but otherwise 1⁄2 with register 1 as in
                    matches[2] = matches[1];
                    imp = 0;
                } else {
                    imp = parseFloat(imp);
                }
            }
            //console.log("imp " + imp);
            if (isNaN(imp))
                imp = 0;

            if (matches[2] !== undefined)
                imp += evaluateFraction(matches[2]);
            //console.log("imp2 " + imp);

            if (imp === 0 || isNaN(imp)) continue;
            return imp;
        } catch {
            //console.log(err.message);
        }
    }
}


function ParseUnitsOnly(text) {
    //console.log("now trying " + text);
    const len = units.length;
    for (let i = 0; i < len; i++) {
        if (units[i].regexUnit === undefined)
            continue;
        let matches;

        while ((matches = units[i].regexUnit.exec(text)) !== null) {
            try {

                const metStr = convAndForm(lastquantity, i, "", isUK, useMM, useGiga, useRounding, useComma, useSpaces, useBold, useBrackets);
                const fullMatch = matches[0];
                const insertIndex = matches.index + convertedValueInsertionOffset(fullMatch);

                text = insertAt(text, metStr, insertIndex);

            } catch (err) {
                //console.log(err.message);
            }
        }

    }

    if (foundDegreeSymbol) {
            if ( text.charAt(0)!=='F')
                return text;

            if (text.length>=3 && /^F\u200B\u3010|^F[\(][0-9]/.test(text))
                return text; //it has been already converted

                let met = fahrenheitToCelsius(lastquantity, useKelvin);

                var unit = '°C';
                if (useKelvin) {
                    met += 273.15;
                    unit = 'K';
                    met = roundNicely(met, useRounding);
                }

            met = formatNumber(met, useComma, useSpaces);
            const metStr = formatConvertedValue(met, unit, useBold, useBrackets);
            text = insertAt(text, metStr, 1);

        }
    return text;
}

function FlashMessage() {
    var div  = document.getElementById("EverythingMetricExtension");
    if (div===null)
        div = document.createElement('div');
    div.setAttribute("id", "EverythingMetricExtension");
    div.textContent = 'Converted to Metric!';

    document.body.appendChild(div);
    var x = document.getElementById("EverythingMetricExtension");
    x.className = "show";
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 1500);
}

function InitRegex(){
    if (!includeImproperSymbols) {
        //only for foot
        units[2].regex = new RegExp('([\(]?[°º]?[ \u00A0]?' + intOrFloatNoFrac + unitfrac + '[\-− \u00A0]?([′])(?![′])' + unitSuffixft + ')', 'g');
    }

    if (convertTablespoon) units.push(unitsTablespoon);
    if (convertTeaspoon) units.push(unitsTeaspoon);

    if(degWithoutFahrenheit) {
        units[0].regex = new RegExp(skipempty + '((°|º|deg(rees)?)[ \u00A0]?(F(ahrenheits?)?)?|[\u2109])' + skipbrackets + regend, 'ig')
    }
}


document.addEventListener('DOMContentLoaded', function() {

    if (/docs\.google\./.test(window.location.toString()) ||
        /drive\.google\./.test(window.location.toString()) ||
        /mail\.google\./.test(window.location.toString())) {
        console.log("Everything Metric extension is disabled on Google Docs and Mail to prevent unintentional edits");
        return;
    }
    if (/medium\.com/.test(window.location.toString()) &&
        /\/edit/.test(window.location.toString())) {
        console.log("Everything Metric extension is disabled on medium.com/.../edit");
        return;
    }

    browser.runtime.sendMessage({
            message: "Is metric enabled"
        },
        function(response) {
            metricIsEnabled = response.metricIsEnabled;
            useComma = response.useComma;
            useMM = response.useMM;
            useRounding = response.useRounding;
            useMO = response.useMO;
            useGiga = response.useGiga;
            useSpaces = response.useSpaces;
            useKelvin = response.useKelvin;
            degWithoutFahrenheit = response.degWithoutFahrenheit;
            useBold = response.useBold;
            useBrackets = response.useBrackets;
            useMetricOnly = response.useMetricOnly;
            convertBracketed = response.convertBracketed;
            matchIn = response.matchIn;
            convertTablespoon = response.convertTablespoon;
            convertTeaspoon = response.convertTeaspoon;
            includeQuotes = response.includeQuotes;
            includeImproperSymbols = response.includeImproperSymbols;
            InitRegex();
            setIncludeImproperSymbols(response.includeImproperSymbols);

            if (response.metricIsEnabled === true) {

                let isamazon = false;
                if (/\.amazon\./.test(window.location.toString())) isamazon = true;
                if (/\.uk\//.test(window.location.toString())) isUK = true;
                if (isamazon) {
                    var div = document.getElementById("AmazonMetricHelper");
                    if (div===null)
                        div = document.createElement('div');
                    else
                        return;
                    div.setAttribute("id", "EverythingMetricExtension");
                    div.textContent = 'Converted to Metric!';
                    document.body.appendChild(div);
                }
                isparsing=true;
                walk(document.body);
                isparsing=false;
                if (useMO === true || isamazon === true)
                    initMO(document.body);
            }
        }
    );
}, false);
/*
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.args === "parse_page_now") {
        alert('asdf');
        walk(document.body);
        FlashMessage();
    }
    sendResponse();
});

*/


browser.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

    if (request.command == "parse_page_now") {
        if (isparsing===true)
            return;
        isparsing=true;
        walk(document.body);
        isparsing=false;
        FlashMessage();
    }
});

function hasParentEditableNode(el) {
    if (hasEditableNode(el)) return true;
    while (el.parentNode) {
        el = el.parentNode;

        if (hasEditableNode(el))
            return true;
    }
    return false;
}

function hasEditableNode(el) {
    try {
        var namedNodeMap = el.attributes;

        for (var i = 0; i < namedNodeMap.length; i++) {
            var attr = namedNodeMap.item(i);
            if (attr.name === "contenteditable") {

                return true;
            } else if (attr.name === "class" && attr.value === "notranslate") {

                return true;
            } else if (attr.name === "translate" && attr.value === "no") {

                return true;
            } else if (attr.name === "role" && attr.value === "textbox") {

                return true;
            }
        }
    } catch (error) {}
    return false;
}

function initMO(root) {

    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    var observer = new MutationObserver(function(mutations, observer) {
        //fired when a mutation occurs
        //console.log(mutations);
        //var t0 = performance.now();
        for (var i = 0; i < mutations.length; i++) {
            for (var j = 0; j < mutations[i].addedNodes.length; j++) {
                //checkNode(mutations[i].addedNodes[j]);
                //console.log(mutations[i].addedNodes[j]);
                if (!hasParentEditableNode(mutations[i].addedNodes[j]))
                    walk(mutations[i].addedNodes[j]);

                //var t1 = performance.now();
                //nmut++;
                //console.log(nmut + " Call to mutations took " + (t1 - t0) + " milliseconds.")
            }
        }
    });
    var opts = {
        characterData: false,
        childList: true,
        subtree: true
    };
    var observe = function() {
        observer.takeRecords();
        observer.observe(root, opts);
    };
    observe();
}
