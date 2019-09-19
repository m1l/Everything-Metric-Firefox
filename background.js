var metricIsEnabled = true;
var useComma;
var useMM;
var useRounding;
var useMO;
var useGiga;
var useSpaces;
var useKelvin;
var convertBracketed;
var enableOnStart;
var matchIn;

function updateIcon() {
    if (metricIsEnabled===true)
	{
		browser.browserAction.setIcon({
			path: {
                "16": "icons/everything-metric-16.png",
                "19": "icons/everything-metric-19.png",
                "32": "icons/everything-metric-32.png",
                "38": "icons/everything-metric-38.png",
                "48": "icons/everything-metric-48.png",
                "96": "icons/everything-metric-96.png",
			}
		});        
		browser.browserAction.setTitle({title: "Automatic Metric/SI conversion is ON"});            
	}
    else
	{
		browser.browserAction.setIcon({
			path: {
                "16": "icons/everything-metric-16-off.png",
                "19": "icons/everything-metric-19-off.png",
                "32": "icons/everything-metric-32-off.png",
                "38": "icons/everything-metric-38-off.png",
                "48": "icons/everything-metric-48-off.png",
                "96": "icons/everything-metric-96-off.png",
			}
		});
		browser.browserAction.setTitle({title: "Automatic Metric/SI conversion is OFF"});           
	}
}  



function toggleMetric() {
	if (metricIsEnabled===true) {
		metricIsEnabled=false;
	} else {
		metricIsEnabled=true;
	}
	updateIcon();    
    
    browser.storage.sync.set({
        enableOnStart: metricIsEnabled
	}, function() {		
	});
}




browser.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {   
        
        if (request.message==="Is metric enabled")
		{
			var response = {};
			response.metricIsEnabled = metricIsEnabled;
			response.useComma = useComma;
			response.useMM = useMM;
			response.useRounding = useRounding;
			response.useMO = useMO;
			response.useGiga = useGiga;
			response.useSpaces = useSpaces;
            response.useKelvin = useKelvin;
			response.useBold=useBold;
            response.useBrackets=useBrackets;
            response.useMetricOnly=useMetricOnly;
            response.convertBracketed=convertBracketed;
            response.enableOnStart=enableOnStart;
            response.matchIn=matchIn;
			sendResponse(response);
		}
        else { //request to reload
            restore_options();
            sendResponse("ok");
        }
    }
);

function restore_options() {
	browser.storage.sync.get({
		useComma:true,
		useMM:false,
		useRounding:true,
		isFirstRun:true,
		useMO:false,
		useGiga:false,
		useSpaces:true,
        useKelvin:false,
        useBold: false,
        useBrackets: true,
        useMetricOnly: false,
        convertBracketed: false,
        enableOnStart: true,
        matchIn: false
	}, function(items) {    
		useComma = items.useComma;
		useMM = items.useMM;
		useRounding = items.useRounding; 
		useMO = items.useMO;
		useGiga = items.useGiga;
		useSpaces = items.useSpaces;
        useKelvin = items.useKelvin;
        useBold= items.useBold;
        useBrackets= items.useBrackets;
        useMetricOnly= items.useBold;
        convertBracketed = items.convertBracketed;
        enableOnStart = items.enableOnStart;
        matchIn = items.matchIn;
		if (items.isFirstRun===true) 
		{
			console.log("firstrun");
			try {
				browser.storage.sync.set({ isFirstRun: false });
                var openingPage = browser.runtime.openOptionsPage();
				/*

                 var optionsUrl = browser.extension.getURL('options.html');

                    browser.tabs.query({url: optionsUrl}, function(tabs) {
                        if (tabs.length) {
                            browser.tabs.update(tabs[0].id, {active: true});
                        } else {
                            browser.tabs.create({url: optionsUrl});
                        }
                    });*/
			} catch(err) {}
		}
        
       
	}); 
}
restore_options();

browser.browserAction.onClicked.addListener(function(tab){
    toggleMetric();
    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
        browser.tabs.reload(tabs[0].id);
    });    
});

browser.commands.onCommand.addListener( function(command) {
    if(command === "parse_page_now"){
       browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
          browser.tabs.sendMessage(tabs[0].id, {command: "parse_page_now"}, function(response) {

          });
        });
     }
});
    