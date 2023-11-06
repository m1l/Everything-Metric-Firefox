// Author: Milos Paripovic

var useMM;
var useRounding;
var useMO;
var useGiga;
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
const excludedNodes = new Set();

function updateExcludedNodes() {
    const xPathResult = excludedTextNodesXPath.evaluate(document);
    excludedNodes.clear();
    let node;
    while (node = xPathResult.iterateNext()) {
        excludedNodes.add(node);
    }
}

function processTextNode(node) {
    if (excludedNodes.has(node)) {
        return;
    }
    node.nodeValue = processTextBlock(node.nodeValue, convertTablespoon, convertTeaspoon, convertBracketed, degWithoutFahrenheit, includeImproperSymbols, matchIn, includeQuotes, isUK, useMM, useGiga, useKelvin, useBold, useBrackets, useRounding);
}

function walkTree(root) {
    const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (treeWalker.nextNode()) {
        processTextNode(treeWalker.currentNode);
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
            useMM = response.useMM;
            useRounding = response.useRounding;
            useMO = response.useMO;
            useGiga = response.useGiga;
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
                updateExcludedNodes();
                walkTree(document.body);
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
        updateExcludedNodes();
        walkTree(document.body);
        isparsing = false;
        FlashMessage();
    }
});

function initMO(root) {
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    const observer = new MutationObserver(function(mutations, observer) {
        updateExcludedNodes();
        for (const mutation of mutations) {
            for (const addedNode of mutation.addedNodes) {
                if (addedNode.nodeType == 3) { // text node
                    processTextNode(addedNode);
                } else {
                    walkTree(addedNode);
                }
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
