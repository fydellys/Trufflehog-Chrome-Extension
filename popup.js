let toggles = ["generics", "specifics", "aws", "checkEnv", "checkGit", "alerts"];

let toggleDefaults = {
    "generics": true,
    "specifics": true,
    "aws": true,
    "checkEnv": false,
    "checkGit": false,
    "alerts": true
}

let state = {
    origin: null,
    tab: null,
    leakedKeys: {},
    scope: "origin",
    query: ""
};

const $ = (id) => document.getElementById(id);

const ICONS = {
    file: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    external: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    page: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/></svg>',
    copy: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>'
};

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function toast(msg) {
    let el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 1600);
}

var getActiveTab = function(cb){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        cb(tabs[0]);
    });
}

// ---------- Tabs ----------
for (let tabBtn of document.querySelectorAll(".tab")) {
    tabBtn.addEventListener("click", function() {
        document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t === tabBtn));
        document.querySelectorAll(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + tabBtn.dataset.tab));
    });
}

// ---------- Toggles ----------
chrome.storage.sync.get(toggles, function(result) {
    for (let toggle of toggles) {
        let el = $(toggle);
        if (result[toggle] == undefined) {
            el.checked = toggleDefaults[toggle];
            chrome.storage.sync.set({[toggle]: toggleDefaults[toggle]});
        } else {
            el.checked = !!result[toggle];
        }
        el.addEventListener("change", function() {
            chrome.storage.sync.set({[toggle]: el.checked});
        });
    }
});

// ---------- Findings ----------

// Where the secret actually lives: script URL, .env URL, or the page itself
function fileUrlFor(finding, origin) {
    let src = String(finding.src || "");
    if (src.startsWith(".env file at ")) {
        return src.substring(".env file at ".length);
    }
    if (finding.parentUrl && (src === origin || !/^https?:\/\/[^/]+\/./.test(src))) {
        return finding.parentUrl;
    }
    return src;
}

function sameFinding(a, b) {
    return a.src == b.src && a.match == b.match && a.key == b.key && a.encoded == b.encoded && a.parentUrl == b.parentUrl;
}

function openViewer(finding, origin) {
    let params = new URLSearchParams({
        url: fileUrlFor(finding, origin),
        match: finding.match || "",
        key: finding.key || "",
        origin: origin || ""
    });
    if (finding.encoded) {
        params.set("encoded", finding.encoded);
    }
    chrome.tabs.create({url: chrome.runtime.getURL("viewer.html?" + params.toString())});
}

function collectFindings() {
    let entries = [];
    let keys = state.leakedKeys || {};
    let origins = state.scope === "origin" ? [state.origin] : Object.keys(keys);
    for (let origin of origins) {
        let list = keys[origin];
        if (!Array.isArray(list)) continue;
        for (let finding of list) {
            entries.push({origin, finding});
        }
    }
    let q = state.query.trim().toLowerCase();
    if (q) {
        entries = entries.filter(({origin, finding}) =>
            [finding.key, finding.match, finding.src, finding.parentUrl, origin].some(v => String(v || "").toLowerCase().includes(q))
        );
    }
    return entries;
}

function render() {
    let originCount = Array.isArray(state.leakedKeys[state.origin]) ? state.leakedKeys[state.origin].length : 0;
    let pill = $("countPill");
    pill.textContent = originCount;
    pill.classList.toggle("hot", originCount > 0);

    let entries = collectFindings();
    let list = $("findingList");
    list.innerHTML = "";

    $("emptyState").classList.toggle("hidden", entries.length > 0);
    $("emptySub").textContent = state.query
        ? "No findings match the filter."
        : (state.scope === "origin"
            ? "Browse the site — scripts and page HTML are scanned automatically."
            : "No findings saved for any site.");

    let lastOrigin = null;
    for (let {origin, finding} of entries) {
        if (state.scope === "all" && origin !== lastOrigin) {
            let label = document.createElement("div");
            label.className = "origin-label";
            label.textContent = origin;
            list.appendChild(label);
            lastOrigin = origin;
        }

        let fileUrl = fileUrlFor(finding, origin);
        let card = document.createElement("div");
        card.className = "finding";
        card.innerHTML =
            '<div class="finding-head">' +
                '<span class="finding-type" title="' + htmlEntities(finding.key) + '">' + htmlEntities(finding.key) + '</span>' +
                (finding.encoded ? '<span class="tag b64" title="Decoded from base64">base64</span>' : '') +
            '</div>' +
            '<div class="match" title="' + htmlEntities(finding.match) + '">' + htmlEntities(finding.match) + '</div>' +
            '<div class="src" title="' + htmlEntities(fileUrl) + '"><bdi>' + htmlEntities(fileUrl) + '</bdi></div>' +
            '<div class="actions">' +
                '<button class="btn primary-sm" data-act="view">' + ICONS.file + 'View in file</button>' +
                '<button class="icon-btn" data-act="raw" title="Open original file">' + ICONS.external + '</button>' +
                (finding.parentUrl && finding.parentUrl !== fileUrl ? '<button class="icon-btn" data-act="page" title="Open page where it was found">' + ICONS.page + '</button>' : '') +
                '<button class="icon-btn" data-act="copy" title="Copy value">' + ICONS.copy + '</button>' +
                '<span class="spacer"></span>' +
                '<button class="icon-btn del" data-act="delete" title="Remove finding">' + ICONS.trash + '</button>' +
            '</div>';

        card.addEventListener("click", function(e) {
            let btn = e.target.closest("[data-act]");
            if (!btn) return;
            switch (btn.dataset.act) {
                case "view":
                    openViewer(finding, origin);
                    break;
                case "raw":
                    chrome.tabs.create({url: fileUrl});
                    break;
                case "page":
                    chrome.tabs.create({url: finding.parentUrl});
                    break;
                case "copy":
                    navigator.clipboard.writeText(finding.match).then(() => toast("Copied!"));
                    break;
                case "delete":
                    deleteFinding(origin, finding);
                    break;
            }
        });
        list.appendChild(card);
    }
}

function updateBadge() {
    let list = state.leakedKeys[state.origin];
    let count = Array.isArray(list) ? list.length : 0;
    chrome.action.setBadgeText({text: count ? String(count) : ""});
}

function saveLeakedKeys(msg) {
    chrome.storage.local.set({"leakedKeys": state.leakedKeys}, function() {
        updateBadge();
        render();
        if (msg) toast(msg);
    });
}

function deleteFinding(origin, finding) {
    let list = state.leakedKeys[origin];
    if (!Array.isArray(list)) return;
    state.leakedKeys[origin] = list.filter(f => !sameFinding(f, finding));
    if (state.leakedKeys[origin].length === 0) {
        delete state.leakedKeys[origin];
    }
    saveLeakedKeys("Finding removed");
}

function loadFindings() {
    chrome.storage.local.get(["leakedKeys"], function(result) {
        let keys = result.leakedKeys;
        state.leakedKeys = (keys && !Array.isArray(keys)) ? keys : {};
        render();
    });
}

for (let btn of document.querySelectorAll("#scopeSwitch button")) {
    btn.addEventListener("click", function() {
        state.scope = btn.dataset.scope;
        document.querySelectorAll("#scopeSwitch button").forEach(b => b.classList.toggle("active", b === btn));
        render();
    });
}

$("search").addEventListener("input", function(e) {
    state.query = e.target.value;
    render();
});

chrome.storage.onChanged.addListener(function(changes, area) {
    if (area === "local" && changes.leakedKeys) {
        loadFindings();
    }
});

getActiveTab(function(tab) {
    state.tab = tab;
    try {
        state.origin = (new URL(tab.url)).origin;
    } catch (e) {
        state.origin = null;
    }
    let originEl = $("currentOrigin");
    originEl.textContent = state.origin && state.origin !== "null" ? state.origin : "Page has no origin";
    originEl.title = tab && tab.url ? tab.url : "";
    loadFindings();
});

// ---------- Tools ----------
function csvCell(value) {
    let s = value == undefined ? "" : String(value);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

var downloadCSV = function(){
    chrome.storage.local.get(["leakedKeys"], function(result) {
        let csvRows = [["origin", "src", "parentUrl", "type", "match", "encoded"]];
        for (let origin in result.leakedKeys){
            var findings = result.leakedKeys[origin];
            if (!Array.isArray(findings)){
                continue;
            }
            for (let finding of findings){
                csvRows.push([origin, finding["src"], finding["parentUrl"], finding["key"], finding["match"], finding["encoded"]])
            }
        }
        let csvContent = csvRows.map(row => row.map(csvCell).join(",")).join("\n");
        // Chrome blocks navigating to data: URLs, so download through a blob link instead
        let blob = new Blob([csvContent], {type: "text/csv;charset=utf-8"});
        let link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "trufflehog_findings.csv";
        link.click();
        setTimeout(function(){ URL.revokeObjectURL(link.href); }, 1000);
    })
}

$("downloadAllFindings").addEventListener("click", downloadCSV);

$("clearOriginFindings").addEventListener("click", function() {
    if (!state.origin) return;
    delete state.leakedKeys[state.origin];
    saveLeakedKeys("Findings for this site cleared");
});

$("clearAllFindings").addEventListener("click", function() {
    if (!confirm("Remove all findings for every site?")) return;
    state.leakedKeys = {};
    saveLeakedKeys("All findings cleared");
});

$("openTabs").addEventListener("click", function() {
    var tabList = $("tabList").value.split(/[,\n]/).map(item => item.trim()).filter(Boolean);
    if (!tabList.length) {
        toast("Enter at least one URL");
        return;
    }
    chrome.runtime.sendMessage({"openTabs": tabList});
    toast(tabList.length + " tab(s) opened");
});

// ---------- Deny list ----------
var denyListElement = $("denyList");

chrome.storage.sync.get(["originDenyList"], function(result) {
    denyListElement.value = (result.originDenyList || []).join(", ");
});

var saveDenyList = function(){
    var denyList = denyListElement.value.split(",").map(item => item.trim()).filter(Boolean);
    chrome.storage.sync.set({"originDenyList": denyList}, function() {
        let saved = $("denySaved");
        saved.classList.remove("hidden");
        clearTimeout(saveDenyList._t);
        saveDenyList._t = setTimeout(() => saved.classList.add("hidden"), 1200);
    });
};

denyListElement.addEventListener("input", saveDenyList);

$("denyCurrent").addEventListener("click", function() {
    if (!state.origin || state.origin === "null") return;
    let current = denyListElement.value.split(",").map(item => item.trim()).filter(Boolean);
    if (!current.includes(state.origin)) {
        current.push(state.origin);
    }
    denyListElement.value = current.join(", ");
    saveDenyList();
    toast("Site added to deny list");
});
