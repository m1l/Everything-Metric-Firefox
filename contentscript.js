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
            node.nodeValue = processTextBlock(node.nodeValue, convertTablespoon, convertTeaspoon, convertBracketed, degWithoutFahrenheit, includeImproperSymbols, matchIn, includeQuotes, isUK, useMM, useGiga, useKelvin, useBold, useBrackets, useRounding, useComma, useSpaces);
            break;
        default:
            break;
    }
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

    browser.runtime
        .sendMessage({ message: "Is metric enabled" })
        .then(function(response) {
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
        })
    ;
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
