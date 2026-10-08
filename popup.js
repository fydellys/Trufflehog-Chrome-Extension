
let toggles = ["generics", "specifics", "aws", "checkEnv", "checkGit", "alerts"];

let toggleDefaults = {
    "generics": true,
    "specifics": true,
    "aws": true,
    "checkEnv": false,
    "checkGit": false,
    "alerts":true
}

for (let toggle of toggles){
    chrome.storage.sync.get([toggle], function(result) {
        if (result[toggle] == undefined){
            document.getElementById(toggle).checked = toggleDefaults[toggle];
            var setObj = {}
            setObj[toggle] = toggleDefaults[toggle];
            chrome.storage.sync.set(setObj);
        }else if (result[toggle] == true) {
           document.getElementById(toggle).checked = true;
        }

    });
    document.getElementById(toggle).addEventListener('click', function(){
        var toggleChecked = document.getElementById(toggle).checked;
        var value = false;
        if (toggleChecked){
            value = true;
        }
        var setObj = {}
        setObj[toggle] = value;
        chrome.storage.sync.set(setObj);

    });

}


var getActiveTab = function(cb){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        cb(tabs[0]);
    });
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
var acc = document.getElementsByClassName("accordion");
var i;

for (i = 0; i < acc.length; i++) {
  acc[i].addEventListener("click", function() {
    /* Toggle between adding and removing the "active" class,
    to highlight the button that controls the panel */
    this.classList.toggle("active");

    /* Toggle between hiding and showing the active panel */
    var panel = this.nextElementSibling;
    if (panel.style.display === "block") {
      panel.style.display = "none";
    } else {
      panel.style.display = "block";
      var el = document.getElementById("denyList");
      chrome.storage.sync.get(["originDenyList"], function(result) {
        el.value = (result.originDenyList || []).join(",");
        el.focus();
      })
      getActiveTab(function(tab) {

        var origin = (new URL(tab.url)).origin;
        chrome.storage.sync.get(["leakedKeys"], function(result) {
            var keys = (result.leakedKeys || {})[origin];
            let keyInfo = "";
            let htmlList = "";
            if(!Array.isArray(keys)){keys = []}
            for (let key of keys){
                keyInfo = key["key"] + ": " + key["match"] + " found in " + key["src"];
                if (key["encoded"]){
                     keyInfo += " decoded from " + key["encoded"].substring(0,9) + "..."
                }
                keyInfo = htmlEntities(keyInfo);
                htmlList += "<li>" + keyInfo + "</li>\n"
            }
            document.getElementById("findingList").innerHTML = htmlList;
        })
      })

    }
  });
}

var downloadCSV = function(){
    chrome.storage.sync.get(["leakedKeys"], function(result) {
        let csvRows = [];
        for (let origin in result.leakedKeys){
            var findings = result.leakedKeys[origin];
            if (!Array.isArray(findings)){
                continue;
            }
            for (let finding of findings){
                csvRows.push([origin, finding["src"], finding["parentUrl"], finding["key"], finding["match"], finding["encoded"]])
            }
        }
        let csvContent = csvRows.map(e => e.join(",")).join("\n");
        // Chrome blocks navigating to data: URLs, so download through a blob link instead
        let blob = new Blob([csvContent], {type: "text/csv;charset=utf-8"});
        let link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "trufflehog_findings.csv";
        link.click();
        setTimeout(function(){ URL.revokeObjectURL(link.href); }, 1000);
    })
}

document.getElementById("downloadAllFindings").addEventListener("click", function() {
    downloadCSV();
})
document.getElementById("clearOriginFindings").addEventListener("click", function() {
    chrome.storage.sync.get(["leakedKeys"], function(result) {
        getActiveTab(function(tab) {
            var origin = (new URL(tab.url)).origin;
            var leakedKeys = result.leakedKeys || {};
            leakedKeys[origin] = [];
            chrome.storage.sync.set({"leakedKeys": leakedKeys});
            chrome.action.setBadgeText({text: ''});
            document.getElementById("findingList").innerHTML = "";
        })
    })
})
document.getElementById("clearAllFindings").addEventListener("click", function() {
    chrome.storage.sync.set({"leakedKeys": {}});
    chrome.action.setBadgeText({text: ''});
    document.getElementById("findingList").innerHTML = "";
})
document.getElementById("openTabs").addEventListener("click", function() {
    var rawTabList = document.getElementById("tabList").value;
    var tabList = rawTabList.split(",").map(function(item) {
        return item.trim();
    })
    for (let tab of tabList){
        console.log(tab)
    }
    chrome.runtime.sendMessage({"openTabs": tabList});
})


var denyListElement = document.getElementById("denyList");
var changeEvent = function(){
    var rawDenyList = denyListElement.value;
    var denyList = rawDenyList.split(",").map(function(item) {
        return item.trim();
    })
    chrome.storage.sync.set({"originDenyList": denyList});
};

denyListElement.addEventListener('keyup', changeEvent);
denyListElement.addEventListener('paste', changeEvent);
