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

function replaceAll(text) {
    text = replaceIkeaSurface(text, useMM, useRounding, useComma, useSpaces, useBold, useBrackets);
    if (includeQuotes)
        text = replaceFeetAndInchesSymbol(text, includeImproperSymbols, convertBracketed, isUK, useMM, useGiga, useRounding, useComma, useSpaces, useBold, useBrackets);
    text = replaceVolume(text, convertBracketed, useMM, useRounding, useComma, useSpaces, useBold, useBrackets);
    text = replaceSurfaceInInches(text, convertBracketed, useMM, useRounding, useComma, useSpaces, useBold, useBrackets);
    text = replaceSurfaceInFeet(text, convertBracketed, useMM, useRounding, useComma, useSpaces, useBold, useBrackets);
    text = replaceFeetAndInches(text, convertBracketed, useMM, useRounding, useComma, useSpaces, useBold, useBrackets);
    text = replacePoundsAndOunces(text, convertBracketed, useRounding, useComma, useSpaces, useBold, useBrackets);
    text = replaceOtherUnits(text, matchIn, convertBracketed, isUK, useMM, useGiga, useRounding, useComma, useSpaces, useBold, useBrackets);
    text = replaceMilesPerGallon(text, convertBracketed, useRounding, useComma, useSpaces, useBold, useBrackets);
    text = replaceFahrenheit(text, degWithoutFahrenheit, convertBracketed, useKelvin, useRounding, useComma, useSpaces, useBold, useBrackets);
    return text;
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
        textNode.nodeValue = replaceAll(text);
    }
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
    const len = conversions.length;
    for (let i = 0; i < len; i++) {
        if (conversions[i].regexUnit === undefined)
            continue;
        let matches;

        while ((matches = conversions[i].regexUnit.exec(text)) !== null) {
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
        conversions[2].regex = new RegExp('([\(]?[°º]?[ \u00A0]?' + intOrFloatNoFrac + unitfrac + '[\-− \u00A0]?([′])(?![′])' + unitSuffixft + ')', 'g');
    }

    if (convertTablespoon) conversions.push(unitsTablespoon);
    if (convertTeaspoon) conversions.push(unitsTeaspoon);

    if(degWithoutFahrenheit) {
        conversions[0].regex = new RegExp(skipempty + '((°|º|deg(rees)?)[ \u00A0]?(F(ahrenheits?)?)?|[\u2109])' + skipbrackets + regend, 'ig')
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
