// Author: Milos Paripovic

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
var convertTablespoon = false;
var convertTeaspoon = false;
var includeQuotes;
var isparsing = false;
var includeImproperSymbols;

const excludedTextNodesXPathSelectors = [
    '*[@contenteditable]',
    '*[@translate="no"]',
    '*[@role="textbox"]',
    '*[contains(concat(" ", @class, " "), " notranslate ")]',
    'code',
    'style',
    'script',
    'textarea',
];
const excludedTextNodesXPathString = excludedTextNodesXPathSelectors.map(selector => '//' + selector + '//text()').join('|');
const excludedTextNodesXPath = new XPathEvaluator().createExpression(excludedTextNodesXPathString);

function walk(root) {
    const xPathResult = excludedTextNodesXPath.evaluate(document);
    const excludedNodes = [];
    let node;
    while (node = xPathResult.iterateNext()) {
        excludedNodes.push(node);
    }

    const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (treeWalker.nextNode()) {
        const node = treeWalker.currentNode;
        if (excludedNodes.indexOf(node) != -1) {
            continue;
        }
        node.nodeValue = processTextBlock(node.nodeValue, convertTablespoon, convertTeaspoon, convertBracketed, degWithoutFahrenheit, includeImproperSymbols, matchIn, includeQuotes, isUK, useMM, useGiga, useKelvin, useBold, useBrackets, useRounding, useComma, useSpaces);
    }
}

function FlashMessage() {
    const div = document.getElementById("EverythingMetricExtension") || document.createElement('div');
    div.setAttribute("id", "EverythingMetricExtension");
    div.textContent = 'Converted to Metric!';
    div.classList.add('show');
    document.body.appendChild(div);
    setTimeout(function(){ div.classList.remove('show'); }, 1500);
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

            if (response.metricIsEnabled) {
                let isamazon = false;
                if (/\.amazon\./.test(window.location.toString())) {
                    isamazon = true;
                }
                if (/\.uk\//.test(window.location.toString())) {
                    isUK = true;
                }
                if (isamazon) {
                    if (document.getElementById("AmazonMetricHelper")) {
                        return;
                    }
                    const div = document.createElement('div');
                    div.setAttribute("id", "EverythingMetricExtension");
                    div.textContent = 'Converted to Metric!';
                    document.body.appendChild(div);
                }
                isparsing = true;
                walk(document.body);
                isparsing = false;
                if (useMO || isamazon) {
                    initMO(document.body);
                }
            }
        })
    ;
}, false);


browser.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.command == "parse_page_now" && !isParsing) {
        isparsing = true;
        walk(document.body);
        isparsing = false;
        FlashMessage();
    }
});

function initMO(root) {
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    const observer = new MutationObserver(function(mutations, observer) {
        for (const mutation of mutations) {
            for (const addedNode of mutation.addedNodes) {
                walk(addedNode);
            }
        }
    });
    observer.takeRecords();
    observer.observe(root, {
        characterData: false,
        childList: true,
        subtree: true
    });
}
