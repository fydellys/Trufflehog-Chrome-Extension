// this is the background code...

// runs as a Manifest V3 service worker; inject.js is loaded via content_scripts


var version = "1.0";

chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.get(['ranOnce'], function(ranOnce) {
        if (! ranOnce.ranOnce){
            chrome.storage.sync.set({"ranOnce": true});
            chrome.storage.sync.set({"originDenyList": ["https://www.google.com"]});
        }
    })
})


let specifics = {
    "Slack Token": "(xox[pboa]-[0-9]{12}-[0-9]{12}-[0-9]{12}-[a-z0-9]{32})",
    "RSA private key": "-----BEGIN RSA PRIVATE KEY-----",
    "SSH (DSA) private key": "-----BEGIN DSA PRIVATE KEY-----",
    "SSH (EC) private key": "-----BEGIN EC PRIVATE KEY-----",
    "PGP private key block": "-----BEGIN PGP PRIVATE KEY BLOCK-----",
    "Amazon MWS Auth Token": "amzn\\.mws\\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
    "AWS AppSync GraphQL Key": "da2-[a-z0-9]{26}",
    "Facebook Access Token": "EAACEdEose0cBA[0-9A-Za-z]+",
    "Facebook OAuth": "[fF][aA][cC][eE][bB][oO][oO][kK].{0,20}['|\"][0-9a-f]{32}['|\"]",
    "GitHub": "[gG][iI][tT][hH][uU][bB].{0,20}['|\"][0-9a-zA-Z]{35,40}['|\"]",
   // "Google API Key": "AIza[0-9A-Za-z\\-_]{35}",
   // "Google Cloud Platform API Key": "AIza[0-9A-Za-z\\-_]{35}",
   // "Google Cloud Platform OAuth": "[0-9]+-[0-9A-Za-z_]{32}\\.apps\\.googleusercontent\\.com",
   // "Google Drive API Key": "AIza[0-9A-Za-z\\-_]{35}",
   // "Google Drive OAuth": "[0-9]+-[0-9A-Za-z_]{32}\\.apps\\.googleusercontent\\.com",
    "Google (GCP) Service-account": "\"type\": \"service_account\"",
   // "Google Gmail API Key": "AIza[0-9A-Za-z\\-_]{35}",
   // "Google Gmail OAuth": "[0-9]+-[0-9A-Za-z_]{32}\\.apps\\.googleusercontent\\.com",
   // "Google OAuth Access Token": "ya29\\.[0-9A-Za-z\\-_]+",
   // "Google YouTube API Key": "AIza[0-9A-Za-z\\-_]{35}",
  //  "Google YouTube OAuth": "[0-9]+-[0-9A-Za-z_]{32}\\.apps\\.googleusercontent\\.com",
    "Heroku API Key": "[hH][eE][rR][oO][kK][uU].{0,20}[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}",
    "Json Web Token" : "eyJhbGciOiJ",
    "MailChimp API Key": "[0-9a-f]{32}-us[0-9]{1,2}",
    "Mailgun API Key": "key-[0-9a-zA-Z]{32}",
    "Password in URL": "[a-zA-Z]{3,10}://[^/\\s:@]{3,20}:[^/\\s:@]{3,20}@.{1,100}[\"'\\s]",
    "PayPal Braintree Access Token": "access_token\\$production\\$[0-9a-z]{16}\\$[0-9a-f]{32}",
    "Picatic API Key": "sk_live_[0-9a-z]{32}",
    "Slack Webhook": "https://hooks\\.slack\\.com/services/T[a-zA-Z0-9_]{8}/B[a-zA-Z0-9_]{8}/[a-zA-Z0-9_]{24}",
    "Stripe API Key": "sk_live_[0-9a-zA-Z]{24}",
    "Stripe Restricted API Key": "rk_live_[0-9a-zA-Z]{24}",
    "Square Access Token": "sq0atp-[0-9A-Za-z\\-_]{22}",
    "Square OAuth Secret": "sq0csp-[0-9A-Za-z\\-_]{43}",
    "Telegram Bot API Key": "[0-9]+:AA[0-9A-Za-z\\-_]{33}",
    "Twilio API Key": "SK[0-9a-fA-F]{32}",
    "Github Auth Creds": "https://[a-zA-Z0-9]{40}@github\\.com",
    "OpenSSH private key": "-----BEGIN OPENSSH PRIVATE KEY-----",
    "PKCS8 private key": "-----BEGIN (?:ENCRYPTED )?PRIVATE KEY-----",
    "GitHub Personal Access Token": "ghp_[0-9a-zA-Z]{36}",
    "GitHub Fine-grained Token": "github_pat_[0-9a-zA-Z_]{82}",
    "GitHub OAuth Token": "gho_[0-9a-zA-Z]{36}",
    "GitHub App Token": "(?:ghu|ghs)_[0-9a-zA-Z]{36}",
    "GitHub Refresh Token": "ghr_[0-9a-zA-Z]{36}",
    "GitLab Personal Access Token": "glpat-[0-9a-zA-Z\\-_]{20}",
    "Slack Token (new format)": "xox[baprse]-[0-9]{10,13}-[0-9a-zA-Z\\-]{20,}",
    "Slack App Token": "xapp-[0-9]-[A-Z0-9]+-[0-9]+-[a-f0-9]{64}",
    "OpenAI API Key": "sk-(?:proj|svcacct|admin)-[A-Za-z0-9_\\-]{40,}",
    "OpenAI API Key (legacy)": "sk-[A-Za-z0-9]{20}T3BlbkFJ[A-Za-z0-9]{20}",
    "Anthropic API Key": "sk-ant-(?:api03|admin01)-[A-Za-z0-9_\\-]{80,}",
    "Hugging Face Token": "hf_[a-zA-Z]{34}",
    "Google OAuth Client Secret": "GOCSPX-[A-Za-z0-9_\\-]{28}",
    "Firebase Cloud Messaging Key": "AAAA[A-Za-z0-9_\\-]{7}:APA91b[A-Za-z0-9_\\-]{134}",
    "Azure Storage Connection String": "DefaultEndpointsProtocol=https?;AccountName=[^;]+;AccountKey=[A-Za-z0-9+/=]{88}",
    "Alibaba Cloud Access Key ID": "LTAI[A-Za-z0-9]{20}",
    "DigitalOcean Token": "do[opr]_v1_[a-f0-9]{64}",
    "Databricks Token": "dapi[a-f0-9]{32}",
    "HashiCorp Vault Token": "hvs\\.[A-Za-z0-9_\\-]{90,}",
    "Terraform Cloud Token": "[a-zA-Z0-9]{14}\\.atlasv1\\.[a-zA-Z0-9_\\-=]{60,70}",
    "Pulumi Token": "pul-[a-f0-9]{40}",
    "Doppler Token": "dp\\.pt\\.[a-zA-Z0-9]{43}",
    "PlanetScale Token": "pscale_tkn_[A-Za-z0-9_\\-.]{32,64}",
    "SendGrid API Key": "SG\\.[A-Za-z0-9_\\-]{22}\\.[A-Za-z0-9_\\-]{43}",
    "Shopify Token": "shp(?:at|ss|ca|pa)_[a-fA-F0-9]{32}",
    "npm Token": "npm_[A-Za-z0-9]{36}",
    "PyPI Token": "pypi-AgEIcHlwaS5vcmc[A-Za-z0-9_\\-]{50,}",
    "Discord Webhook": "https://(?:ptb\\.|canary\\.)?discord(?:app)?\\.com/api/webhooks/[0-9]{17,20}/[A-Za-z0-9_\\-]{60,68}",
    "Discord Bot Token": "[MNO][A-Za-z0-9]{23,25}\\.[A-Za-z0-9_\\-]{6}\\.[A-Za-z0-9_\\-]{27,38}",
    "Twitter Bearer Token": "AAAAAAAAAAAAAAAAAAAAA[A-Za-z0-9%]{30,}",
    "Facebook Access Token (long-lived)": "EAA[MC][a-zA-Z0-9]{100,}",
    "Mapbox Secret Token": "sk\\.eyJ[A-Za-z0-9_\\-]+\\.[A-Za-z0-9_\\-]{22}",
    "Atlassian API Token": "ATATT3[A-Za-z0-9_\\-=]{186}",
    "Linear API Key": "lin_api_[a-zA-Z0-9]{40}",
    "Notion Integration Token": "ntn_[0-9]{11}[A-Za-z0-9]{35}",
    "Airtable Personal Access Token": "pat[A-Za-z0-9]{14}\\.[a-f0-9]{64}",
    "Postman API Key": "PMAK-[a-f0-9]{24}-[a-f0-9]{34}",
    "New Relic User API Key": "NRAK-[A-Z0-9]{27}",
    "Grafana Service Account Token": "glsa_[A-Za-z0-9]{32}_[A-Fa-f0-9]{8}",
    "Sentry Auth Token": "sntry[su]_[A-Za-z0-9+/=_]{50,}",
    "Mercado Pago Access Token": "APP_USR-[0-9]{16}-[0-9]{6}-[a-f0-9]{32}-[0-9]{6,12}",
    "Mercado Pago Test Access Token": "TEST-[0-9]{16}-[0-9]{6}-[a-f0-9]{32}-[0-9]{6,12}",
    "Asaas API Key": "\\$aact_[A-Za-z0-9_\\-=]{40,}",
    "Efi (Gerencianet) Client ID": "Client_Id_[a-f0-9]{40}",
    "Efi (Gerencianet) Client Secret": "Client_Secret_[a-f0-9]{40}",
    "Pagar.me API Key": "ak_(?:live|test)_[a-zA-Z0-9]{30}",
    "PagSeguro / PagBank Token": "[pP][aA][gG](?:[sS][eE][gG][uU][rR][oO]|[bB][aA][nN][kK]).{0,30}['\"][0-9A-Fa-f\\-]{32,100}['\"]",
    "Iugu API Token": "[iI][uU][gG][uU].{0,30}['\"][0-9A-Fa-f]{32,64}['\"]",
    "Cielo Merchant Key": "[mM][eE][rR][cC][hH][aA][nN][tT][_\\-]?[kK][eE][yY].{0,20}['\"][0-9A-Z]{40}['\"]",
    "PicPay Token": "[pP][iI][cC][pP][aA][yY].{0,30}['\"][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}['\"]",
    "Stripe Webhook Secret": "whsec_[a-zA-Z0-9]{32,}",
    "Paystack Secret Key": "sk_live_[a-f0-9]{40}",
    "Flutterwave Secret Key": "FLWSECK(?:_TEST)?-[a-f0-9]{32}-X",
    "Mollie API Key": "live_[A-Za-z0-9]{30}",
    "Plaid Access Token": "access-(?:sandbox|development|production)-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}",
   // "Twitter Access Token": "[tT][wW][iI][tT][tT][eE][rR].*[1-9][0-9]+-[0-9a-zA-Z]{40}",
   // "Twitter OAuth": "[tT][wW][iI][tT][tT][eE][rR].*['|\"][0-9a-zA-Z]{35,44}['|\"]"
}

let generics = {
    "Generic API Key": "[aA][pP][iI]_?[kK][eE][yY].{0,20}['|\"][0-9a-zA-Z]{32,45}['|\"]",
    "Generic Secret": "[sS][eE][cC][rR][eE][tT].{0,20}['|\"][0-9a-zA-Z]{32,45}['|\"]",
}

let aws = {
    "AWS API Key": "((?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16})",
}

let denyList = ["AIDAAAAAAAAAAAAAAAAA"]

var a = ""
var b = ""




var checkData = function(data, src, regexes, fromEncoded=false, parentUrl=undefined, parentOrigin=undefined){
    var findings = [];
    for (let key in regexes){
        let re = new RegExp(regexes[key])
        let match = re.exec(data);
        if (Array.isArray(match)){match = match.toString()}
        if (denyList.includes(match)){
            continue;
        }
        if (match){
            let finding = {};
            finding = {src: src, match:match, key:key, encoded:fromEncoded, parentUrl:parentUrl};
            a = data;
            b = re;
            findings.push(finding);

        }
    }
    if (findings){
        chrome.storage.sync.get(["leakedKeys"], function(result) {
            if (Array.isArray(result.leakedKeys) || ! result.leakedKeys){
                var keys = {};
            }else{
                var keys = result.leakedKeys;
            };
            for (let finding of findings){
                if(Array.isArray(keys[parentOrigin])){
                    var newFinding = true;
                    for (let key of keys[parentOrigin]){
                        if (key["src"] == finding["src"] && key["match"] == finding["match"] && key["key"] == finding["key"] && key["encoded"] == finding["encoded"] && key["parentUrl"] == finding["parentUrl"]){
                            newFinding = false;
                            break;
                        }
                    }
                    if(newFinding){
                        keys[parentOrigin].push(finding)
                        chrome.storage.sync.set({"leakedKeys": keys}, function(){
                            updateTabAndAlert(finding);
                        });
                    }
                }else{
                    keys[parentOrigin] = [finding];
                    chrome.storage.sync.set({"leakedKeys": keys}, function(){
                        updateTabAndAlert(finding);
                    })
                }
             }
        })
    }
    let decodedStrings = getDecodedb64(data);
    for (let encoded of decodedStrings){
        checkData(encoded[1], src, regexes, encoded[0], parentUrl, parentOrigin);
    }
}
var updateTabAndAlert = function(finding){
    var key = finding["key"];
    var src = finding["src"];
    var match = finding["match"];
    var fromEncoded = finding["encoded"];
    chrome.storage.sync.get(["alerts"], function(result) {
        console.log(result.alerts)
        if (result.alerts == undefined || result.alerts){
            if (fromEncoded){
                notify(key + ": " + match + " found in " + src + " decoded from " + fromEncoded.substring(0,9) + "...");
            }else{
                notify(key + ": " + match + " found in " + src);
            }
        }
    })
    updateTab();
}

// service workers have no alert(), so findings are surfaced as system notifications
var notify = function(message){
    chrome.notifications.create({
        type: "basic",
        iconUrl: "icon128.png",
        title: "Trufflehog",
        message: message,
        priority: 2
    });
}

var updateTab = function(){
     chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
        let tab = tabs[0];
        if (!tab || !tab.url){
            return;
        }
        let origin;
        try {
            origin = (new URL(tab.url)).origin;
        } catch(e) {
            return;
        }
        chrome.storage.sync.get(["leakedKeys"], function(result) {
            let originKeys = "";
            if (result.leakedKeys && Array.isArray(result.leakedKeys[origin])){
                originKeys = result.leakedKeys[origin].length.toString();
            }
            chrome.action.setBadgeText({text: originKeys});
            chrome.action.setBadgeBackgroundColor({color: '#ff0000'});
        })
    });
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
    updateTab();
});

var getStringsOfSet = function(word, char_set, threshold=20){
    let count = 0;
    let letters = "";
    let strings = [];
    if (! word){
        return []
    }
    for(let char of word){
        if (char_set.indexOf(char) > -1){
            letters += char;
            count += 1;
        } else{
            if ( count > threshold ){
                strings.push(letters);
            }
            letters = "";
            count = 0;
        }
    }
    if(count > threshold){
        strings.push(letters);
    }
    return strings
}

var getDecodedb64 = function(inputString){
    let b64CharSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let encodeds = getStringsOfSet(inputString, b64CharSet);
    let decodeds = [];
    for (let encoded of encodeds){
        try {
            let decoded = [encoded, atob(encoded)];
            decodeds.push(decoded);
        } catch(e) {
        }
    }
    return decodeds;
}

var checkIfOriginDenied = function(check_url, cb){
    let skip = false;
    chrome.storage.sync.get(["originDenyList"], function(result) {
        let originDenyList = result.originDenyList || [];
        for (let origin of originDenyList){
            if(origin && check_url.startsWith(origin)){
                skip = true;
            }
        }
        cb(skip);
    })
}
var checkForGitDir = function(data, url){
    if(data.startsWith("[core]")){
        notify(".git dir found in " + url + " feature to check this for secrets not supported");
    }

}
var js_url;
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    chrome.storage.sync.get(['generics'], function(useGenerics) {
        chrome.storage.sync.get(['specifics'], function(useSpecifics) {
            chrome.storage.sync.get(['aws'], function(useAws) {
                chrome.storage.sync.get(['checkEnv'], function(checkEnv) {
                    chrome.storage.sync.get(['checkGit'], function(checkGit) {
                        let regexes = {};
                        if(useGenerics["generics"] || useGenerics["generics"] == undefined){
                            regexes = {
                                ...regexes,
                                ...generics
                            }
                        }
                        if(useSpecifics["specifics"] || useSpecifics["specifics"] == undefined){
                            regexes = {
                                ...regexes,
                                ...specifics
                            }
                        }
                        if(useAws["aws"] || useAws["aws"] == undefined){
                            regexes = {
                                ...regexes,
                                ...aws
                            }
                        }
                        if (request.scriptUrl) {
                            let js_url = request.scriptUrl;
                            let parentUrl = request.parentUrl;
                            let parentOrigin = request.parentOrigin;
                            checkIfOriginDenied(js_url, function(skip){
                                if (!skip){
                                    fetch(js_url, {"credentials": 'include'})
                                        .then(response => response.text())
                                        .then(data => checkData(data, js_url, regexes, undefined, parentUrl, parentOrigin));
                                }

                            })

                        }else if(request.pageBody){
                            checkIfOriginDenied(request.origin, function(skip){
                                if (!skip){
                                    checkData(request.pageBody, request.origin, regexes, undefined, request.parentUrl, request.parentOrigin);
                                }
                            })
                        }else if(request.envFile){
                            if(checkEnv['checkEnv']){
                                fetch(request.envFile, {"credentials": 'include'})
                                    .then(response => response.text())
                                    .then(data => checkData(data, ".env file at " + request.envFile, regexes, undefined, request.parentUrl, request.parentOrigin));
                            }
                        }else if(request.openTabs){
                            for (let tab of request.openTabs){
                                if (!tab){
                                    continue;
                                }
                                chrome.tabs.create({url: tab, active: false});
                                console.log(tab)
                            }
                        }else if(request.gitDir){
                            if(checkGit['checkGit']){
                            fetch(request.gitDir, {"credentials": 'include'})
                                    .then(response => response.text())
                                    .then(data => checkForGitDir(data, request.gitDir));
                            }

                        }
                    });
                });
            });

        });
    });



});

