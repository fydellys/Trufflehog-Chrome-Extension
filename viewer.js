// Opens the file a finding came from, highlights the secret and scrolls to it

const params = new URLSearchParams(location.search);
const fileUrl = params.get("url") || "";
const match = params.get("match") || "";
const encoded = params.get("encoded") || "";
const keyName = params.get("key") || "Finding";

const $ = (id) => document.getElementById(id);

let marks = [];
let current = -1;

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showNotice(msg) {
    let el = $("notice");
    el.textContent = msg;
    el.classList.remove("hidden");
}

function findAll(text, term) {
    let ranges = [];
    if (!term) return ranges;
    let i = text.indexOf(term);
    while (i !== -1) {
        ranges.push([i, i + term.length]);
        i = text.indexOf(term, i + term.length);
    }
    return ranges;
}

// Candidate strings to look for in the raw file, best first.
// Base64 findings only exist encoded in the file; regexes with a capture
// group were stored as "full,group" so the first half is tried too.
function searchTerms() {
    let terms = [];
    if (encoded) terms.push(encoded);
    if (match) {
        terms.push(match);
        let comma = match.indexOf(",");
        if (comma > 0) terms.push(match.substring(0, comma));
    }
    return terms;
}

function render(text) {
    let ranges = [];
    for (let term of searchTerms()) {
        ranges = findAll(text, term);
        if (ranges.length) break;
    }

    let lines = text.split("\n");
    let html = [];
    let offset = 0;
    let r = 0;
    for (let li = 0; li < lines.length; li++) {
        let line = lines[li];
        let start = offset;
        let end = offset + line.length;
        let parts = [];
        let pos = start;
        let hit = false;

        while (r < ranges.length && ranges[r][0] < end) {
            let [ms, me] = ranges[r];
            let s = Math.max(ms, start);
            let e = Math.min(me, end);
            if (s > pos) parts.push(htmlEntities(text.substring(pos, s)));
            if (e > s) {
                parts.push('<mark data-i="' + r + '">' + htmlEntities(text.substring(s, e)) + '</mark>');
                hit = true;
            }
            pos = Math.max(pos, e);
            if (me <= end) {
                r++;
            } else {
                break; // match continues on next line
            }
        }
        if (pos < end) parts.push(htmlEntities(text.substring(pos, end)));

        html.push('<div class="ln' + (hit ? ' hit' : '') + '"><span class="n">' + (li + 1) + '</span><span class="c">' + (parts.join("") || " ") + '</span></div>');
        offset = end + 1;
    }

    $("code").innerHTML = html.join("");
    marks = Array.from(document.querySelectorAll("mark"));

    if (!marks.length) {
        showNotice("The value was not found in the current file contents. It may have changed, or the finding came from the page's rendered DOM.");
    }
    updateCounter();
    if (marks.length) goTo(0);
}

function updateCounter() {
    let total = new Set(marks.map(m => m.dataset.i)).size;
    let idx = current >= 0 && marks[current] ? Number(marks[current].dataset.i) + 1 : 0;
    $("counter").textContent = idx + " / " + total;
    $("prev").disabled = $("next").disabled = total < 2;
}

function goTo(i) {
    if (!marks.length) return;
    let groups = Array.from(new Set(marks.map(m => m.dataset.i)));
    i = (i + groups.length) % groups.length;
    marks.forEach(m => m.classList.toggle("active", m.dataset.i === groups[i]));
    current = marks.findIndex(m => m.dataset.i === groups[i]);
    marks[current].scrollIntoView({block: "center", inline: "center"});
    updateCounter();
}

function currentGroup() {
    if (current < 0) return 0;
    let groups = Array.from(new Set(marks.map(m => m.dataset.i)));
    return groups.indexOf(marks[current].dataset.i);
}

$("next").addEventListener("click", () => goTo(currentGroup() + 1));
$("prev").addEventListener("click", () => goTo(currentGroup() - 1));
document.addEventListener("keydown", function(e) {
    if (e.key === "Enter" || e.key === "F3") {
        e.preventDefault();
        goTo(currentGroup() + (e.shiftKey ? -1 : 1));
    }
});

$("wrap").addEventListener("change", function(e) {
    $("code").classList.toggle("wrap", e.target.checked);
    if (marks[current]) marks[current].scrollIntoView({block: "center", inline: "center"});
});

$("copy").addEventListener("click", function() {
    navigator.clipboard.writeText(match).then(() => {
        let btn = $("copy");
        btn.textContent = "Copied ✓";
        setTimeout(() => btn.textContent = "Copy value", 1200);
    });
});

$("openRaw").addEventListener("click", () => window.open(fileUrl, "_blank"));

// ---------- Init ----------
document.title = keyName + " — Trufflehog";
$("type").textContent = keyName;
$("url").textContent = fileUrl;
$("url").href = fileUrl;
$("url").title = fileUrl;
$("matchValue").textContent = match;
if (encoded) $("b64Tag").classList.remove("hidden");

if (!/^https?:\/\//i.test(fileUrl)) {
    $("code").innerHTML = "";
    showNotice("Invalid file URL.");
} else {
    fetch(fileUrl, {credentials: "include"})
        .then(response => {
            if (!response.ok) showNotice("Server responded " + response.status + " " + response.statusText + ".");
            return response.text();
        })
        .then(render)
        .catch(err => {
            $("code").innerHTML = "";
            showNotice("Could not load file: " + err.message);
        });
}
