/***
 * * 🤖 纯 Gemini 可用性检测脚本 (极简精准版)
 * For Quantumult-X
 * * [task_local]
 * event-interaction https://raw.githubusercontent.com/你的路径/gemini_check.js, tag=Gemini查询, img-url=sparkles, enabled=true
 * ***/

const BASE_URL_GEMINI = 'https://gemini.google.com/app';
const URL_TRACE = 'https://cloudflare.com/cdn-cgi/trace';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 关闭自动重定向，用来精准捕获 302 状态码
var opts1 = {
  policy: $environment.params,
  redirection: false 
};

// 明确不支持 Gemini 的地区黑名单 (基于你的测试，必须用物理黑名单拦截)
const BLOCKED_REGIONS = ['CN', 'HK', 'MO', 'RU', 'KP', 'IR', 'SY', 'CU', 'BY'];

var flags = new Map([
  ["AC","🇦🇨"],["AE","🇦🇪"],["AF","🇦🇫"],["AI","🇦🇮"],["AL","🇦🇱"],["AM","🇦🇲"],["AQ","🇦🇶"],["AR","🇦🇷"],["AS","🇦🇸"],["AT","🇦🇹"],["AU","🇦🇺"],["AW","🇦🇼"],["AX","🇦🇽"],["AZ","🇦🇿"],["BA","🇧🇦"],["BB","🇧🇧"],["BD","🇧🇩"],["BE","🇧🇪"],["BF","🇧🇫"],["BG","🇧🇬"],["BH","🇧🇭"],["BI","🇧🇮"],["BJ","🇧🇯"],["BM","🇧🇲"],["BN","🇧🇳"],["BO","🇧🇴"],["BR","🇧🇷"],["BS","🇧🇸"],["BT","🇧🇹"],["BV","🇧🇻"],["BW","🇧🇼"],["BY","🇧🇾"],["BZ","🇧🇿"],["CA","🇨🇦"],["CF","🇨🇫"],["CH","🇨🇭"],["CK","🇨🇰"],["CL","🇨🇱"],["CM","🇨🇲"],["CN","🇨🇳"],["CO","🇨🇴"],["CP","🇨🇵"],["CR","🇨🇷"],["CU","🇨🇺"],["CV","🇨🇻"],["CW","🇨🇼"],["CX","🇨🇽"],["CY","🇨🇾"],["CZ","🇨🇿"],["DE","🇩🇪"],["DG","🇩🇬"],["DJ","🇩🇯"],["DK","🇩🇰"],["DM","🇩🇲"],["DO","🇩🇴"],["DZ","🇩🇿"],["EA","🇪🇦"],["EC","🇪🇨"],["EE","🇪🇪"],["EG","🇪🇬"],["EH","🇪🇭"],["ER","🇪🇷"],["ES","🇪🇸"],["ET","🇪🇹"],["EU","🇪🇺"],["FI","🇫🇮"],["FJ","🇫🇯"],["FK","🇫🇰"],["FM","🇫🇲"],["FO","🇫🇴"],["FR","🇫🇷"],["GA","🇬🇦"],["GB","🇬🇧"],["HK","🇭🇰"],["HU","🇭🇺"],["ID","🇮🇩"],["IE","🇮🇪"],["IL","🇮🇱"],["IM","🇮🇲"],["IN","🇮🇳"],["IS","🇮🇸"],["IT","🇮🇹"],["JP","🇯🇵"],["KR","🇰🇷"],["LU","🇱🇺"],["MO","🇲🇴"],["MX","🇲🇽"],["MY","🇲🇾"],["NL","🇳🇱"],["PH","🇵🇭"],["RO","🇷🇴"],["RS","🇷🇸"],["RU","🇷🇺"],["RW","🇷🇼"],["SA","🇸🇦"],["SB","🇸🇧"],["SC","🇸🇨"],["SD","🇸🇩"],["SE","🇸🇪"],["SG","🇸🇬"],["TH","🇹🇭"],["TN","🇹🇳"],["TO","🇹🇴"],["TR","🇹🇷"],["TV","🇹🇻"],["TW","🇨🇳"],["UK","🇬🇧"],["UM","🇺🇲"],["US","🇺🇸"],["UY","🇺🇾"],["UZ","🇺🇿"],["VA","🇻🇦"],["VE","🇻🇪"],["VG","🇻🇬"],["VI","🇻🇮"],["VN","🇻🇳"],["ZA","🇿🇦"]
]);

let result = {
  "title": '    🤖  Gemini 可用性查询',
  "Gemini": "<b>Gemini: </b>检测失败，请重试 ❗️"
};

const message = {
  action: "get_policy_state",
  content: $environment.params
};

;(async () => {
  await testGemini();
  
  $configuration.sendMessage(message).then(resolve => {
    let output = $environment.params;
    if (resolve.ret && resolve.ret[message.content]) {
      output = JSON.stringify(resolve.ret[message.content]).replace(/\"|\[|\]/g,"").replace(/\,/g," ➟ ");
    }
    
    let content = "--------------------------------------</br></br>" + result["Gemini"] + "</br></br>--------------------------------------</br><font color=#CD5C5C><b>节点</b> ➟ " + output + "</font>";
    content = `<p style="text-align: center; font-family: -apple-system; font-size: large; font-weight: thin">` + content + `</p>`;
    
    console.log(output + " - " + result["Gemini"]);
    $done({"title": result["title"], "htmlMessage": content});
    
  }, reject => {
    let fallbackContent = `<p style="text-align: center; font-family: -apple-system; font-size: large; font-weight: thin">----------------------</br></br>${result["Gemini"]}</br></br>----------------------</br>${$environment.params}</p>`;
    $done({"title": result["title"], "htmlMessage": fallbackContent});
  });  
})();

function testGemini() {
  return new Promise((resolve) => {
    let optGemini = { url: BASE_URL_GEMINI, opts: opts1, timeout: 3500, headers: { 'User-Agent': UA } };
    let optTrace = { url: URL_TRACE, opts: opts1, timeout: 3500 };

    Promise.all([
      $task.fetch(optGemini).catch(e => ({ error: e })),
      $task.fetch(optTrace).catch(e => ({ error: e }))
    ]).then(([resGemini, resTrace]) => {
      
      let region = "UN"; 
      let flag = "🏳️‍🌈"; 
      if (!resTrace.error && resTrace.body) {
        let locMatch = resTrace.body.match(/loc=([A-Z]{2})/);
        if (locMatch) {
          region = locMatch[1].toUpperCase();
          flag = flags.get(region) || region;
        }
      }

      if (resGemini.error) {
        result["Gemini"] = "<b>Gemini: </b>检测超时 🚦";
        resolve();
        return;
      }

      let status = resGemini.statusCode;
      let headers = resGemini.headers || {};
      let loc = (headers['Location'] || headers['location'] || "").toLowerCase();

      // 核心判断逻辑 (根据 curl 抓包结果制定)
      
      // 1. 抓捕 Google 的验证码重定向 (你的日本节点特征)
      if (status === 302 && loc.includes('sorry/index')) {
        result["Gemini"] = `<b>Gemini: </b>IP 遭风控限制 (需要验证码) ➟ ⟦${flag}⟧ ⚠️`;
      } 
      // 2. 如果没被送进验证码页面，判断国家黑名单 (你的香港节点特征)
      else if (BLOCKED_REGIONS.includes(region)) {
        result["Gemini"] = `<b>Gemini: </b>未支持该地区 ➟ ⟦${flag}⟧ 🚫`;
      } 
      // 3. 既没被风控，地区也在白名单，那就视为正常 (你的本地网络特征)
      else if (status === 200 || (status === 302 && loc.includes('accounts.google.com'))) {
        result["Gemini"] = `<b>Gemini: </b>支持 ➟ ⟦${flag}⟧ 🎉`;
      } 
      // 4. 其他未知异常
      else {
        result["Gemini"] = `<b>Gemini: </b>检测异常 (${status}) ➟ ⟦${flag}⟧ ❗️`;
      }
      
      resolve();
    });
  });
}
