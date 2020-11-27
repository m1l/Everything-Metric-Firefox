function save_options() {

	var useComma = document.getElementById('useComma').checked;
	var useMM = document.getElementById('useMM').checked;
	var useRounding = document.getElementById('useRounding').checked;
	var useMO = document.getElementById('useMO').checked;
	var useGiga = document.getElementById('useGiga').checked;
	var useSpaces = document.getElementById('useSpaces').checked;
	var useKelvin = document.getElementById('useKelvin').checked;
	var degWithoutFahrenheit = document.getElementById('degWithoutFahrenheit').checked;
	var useBold = document.getElementById('useBold').checked;
	var useBrackets = document.getElementById('useBrackets').checked;
	var useMetricOnly = document.getElementById('useMetricOnly').checked;
    var convertBracketed = document.getElementById('convertBracketed').checked;
    var matchIn = document.getElementById('matchIn').checked;
    var includeQuotes = document.getElementById('includeQuotes').checked;
    var convertTablespoon = document.getElementById('convertTablespoon').checked;
    var convertTeaspoon = document.getElementById('convertTeaspoon').checked;
    var includeImproperSymbols = document.getElementById('includeImproperSymbols').checked;
    
	browser.storage.sync.set({
		useComma: useComma,
		useMM: useMM,
		useRounding: useRounding,
		isFirstRun: false,
		useMO: useMO,
		useGiga: useGiga,
		useSpaces: useSpaces,
		useKelvin: useKelvin,
		degWithoutFahrenheit: degWithoutFahrenheit,
		useBold: useBold,
		useBrackets: useBrackets,
		useMetricOnly: useMetricOnly,
        convertBracketed: convertBracketed,
        matchIn: matchIn,
        convertTablespoon: convertTablespoon,
        convertTeaspoon: convertTeaspoon,
        includeQuotes: includeQuotes,
        includeImproperSymbols: includeImproperSymbols
	}, function() {
		// Update status to let user know options were saved.
		var status = document.getElementById('status');
		status.textContent = 'Saved. Refresh individual pages to see changes.';
        
		browser.runtime.sendMessage(
			"reload settings",
			function(response) {

			}
		);
		/*setTimeout(function() {
		    status.textContent = '';
		    window.close();
		  }, 3000);*/
	});

}


function restore_options() {
	try {
		browser.storage.sync.get({
			useComma: true,
			useMM: false,
			useRounding: true,
			isFirstRun: false,
			useMO: false,
			useGiga: false,
			useSpaces: true,
			useKelvin: false,
			degWithoutFahrenheit: false,
			useBold: false,
			useBrackets: true,
			useMetricOnly: false,
            convertBracketed: true,
            matchIn: false,
            convertTablespoon: false,
            convertTeaspoon: false,
            includeQuotes: true,
            includeImproperSymbols: true
		}, function(items) {
			document.getElementById('useComma').checked = items.useComma;
			document.getElementById('useMM').checked = items.useMM;
			document.getElementById('useRounding').checked = items.useRounding;
			document.getElementById('useMO').checked = items.useMO;
			document.getElementById('useGiga').checked = items.useGiga;
			document.getElementById('useSpaces').checked = items.useSpaces;
			document.getElementById('useKelvin').checked = items.useKelvin;
			document.getElementById('degWithoutFahrenheit').checked = items.degWithoutFahrenheit;
			document.getElementById('useBold').checked = items.useBold;
			document.getElementById('useBrackets').checked = items.useBrackets;
			document.getElementById('useMetricOnly').checked = items.useMetricOnly;
            document.getElementById('convertBracketed').checked = items.convertBracketed;
            document.getElementById('matchIn').checked = items.matchIn;
            document.getElementById('convertTablespoon').checked = items.convertTablespoon;
            document.getElementById('convertTeaspoon').checked = items.convertTeaspoon;
            document.getElementById('includeQuotes').checked = items.includeQuotes;
            document.getElementById('includeImproperSymbols').checked = items.includeImproperSymbols;
		});
	} catch (err) {
		console.log(err.message);
	}	
}
restore_options();
document.addEventListener("DOMContentLoaded", restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('useComma').addEventListener('click', save_options);
document.getElementById('useMM').addEventListener('click', save_options);
document.getElementById('useRounding').addEventListener('click', save_options);
document.getElementById('useGiga').addEventListener('click', save_options);
document.getElementById('useSpaces').addEventListener('click', save_options);
document.getElementById('useKelvin').addEventListener('click', save_options);
document.getElementById('degWithoutFahrenheit').addEventListener('click', save_options);
document.getElementById('useBold').addEventListener('click', save_options);
document.getElementById('useBrackets').addEventListener('click', save_options);
document.getElementById('useMetricOnly').addEventListener('click', save_options);
document.getElementById('convertBracketed').addEventListener('click', save_options);
document.getElementById('matchIn').addEventListener('click', save_options);
document.getElementById('convertTablespoon').addEventListener('click', save_options);
document.getElementById('convertTeaspoon').addEventListener('click', save_options);
document.getElementById('includeQuotes').addEventListener('click', save_options);
document.getElementById('includeImproperSymbols').addEventListener('click', save_options);
var _selector = document.querySelector('input');
_selector.addEventListener('change', function(event) {
	save_options();
});