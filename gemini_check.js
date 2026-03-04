/***
 * * 🤖 纯 Gemini 可用性检测脚本 (包含国旗显示与精准风控识别)
 * For Quantumult-X
 * * [task_local]
 * event-interaction https://raw.githubusercontent.com/你的路径/gemini_check.js, tag=Gemini查询, img-url=sparkles, enabled=true
 * ***/

const BASE_URL_GEMINI = 'https://gemini.google.com/app';
const URL_TRACE = 'https://cloudflare.com/cdn-cgi/trace';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

var opts1 = {
  policy: $environment.params,
  redirection: false // 必须关闭重定向，拦截 302 状态码
};

// 国旗字典
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

// 核心检测逻辑 (并发请求 Gemini 和 Cloudflare Trace 以提升速度)
function testGemini() {
  return new Promise((resolve) => {
    let optGemini = { url: BASE_URL_GEMINI, opts: opts1, timeout: 3500, headers: { 'User-Agent': UA } };
    let optTrace = { url: URL_TRACE, opts: opts1, timeout: 3500 };

    Promise.all([
      $task.fetch(optGemini).catch(e => ({ error: e })),
      $task.fetch(optTrace).catch(e => ({ error: e }))
    ]).then(([resGemini, resTrace]) => {
      
      // 1. 尝试获取国家代码并匹配国旗
      let region = "UN"; 
      let flag = "🏳️‍🌈"; // 默认未知旗帜
      if (!resTrace.error && resTrace.body) {
        let locMatch = resTrace.body.match(/loc=([A-Z]{2})/);
        if (locMatch) {
          region = locMatch[1];
          flag = flags.get(region) || region;
        }
      }

      // 2. 如果 Gemini 请求超时或失败
      if (resGemini.error) {
        result["Gemini"] = "<b>Gemini: </b>检测超时 🚦";
        resolve();
        return;
      }

      let status = resGemini.statusCode;
      let headers = resGemini.headers;
      let loc = headers['Location'] || headers['location'];
      let data = resGemini.body || "";
      let dataLower = data.toLowerCase();

      // 3. 拦截风控与异常流量
      if (dataLower.indexOf("unusual traffic") !== -1 || 
          data.indexOf("通常と異なるトラフィック") !== -1 || 
          data.indexOf("异常流量") !== -1 ||
          data.indexOf("異常なトラフィック") !== -1) {
        result["Gemini"] = `<b>Gemini: </b>异常流量被拦截 ➟ ⟦${flag}⟧ ⚠️`;
        resolve();
        return; 
      }

      // 4. 状态码分析
      if (status === 200) {
        if (dataLower.indexOf("isn't available") !== -1 || dataLower.indexOf("not supported") !== -1) {
          result["Gemini"] = `<b>Gemini: </b>未支持该地区 ➟ ⟦${flag}⟧ 🚫`;
        } else {
          result["Gemini"] = `<b>Gemini: </b>支持 ➟ ⟦${flag}⟧ 🎉`;
        }
      } 
      else if (status === 302 || status === 303 || status === 307) {
        if (loc && loc.indexOf('support.google.com') !== -1) {
          result["Gemini"] = `<b>Gemini: </b>未支持该地区 ➟ ⟦${flag}⟧ 🚫`;
        } 
        else if (loc && loc.indexOf('accounts.google.com') !== -1) {
          result["Gemini"] = `<b>Gemini: </b>支持 ➟ ⟦${flag}⟧ 🎉`;
        } 
        else {
          result["Gemini"] = `<b>Gemini: </b>支持 ➟ ⟦${flag}⟧ 🎉`;
        }
      } 
      else if (status === 403 || status === 429) {
        result["Gemini"] = `<b>Gemini: </b>IP 遭风控限制 ➟ ⟦${flag}⟧ ⚠️`;
      } 
      else {
        result["Gemini"] = `<b>Gemini: </b>检测异常 (${status}) ➟ ⟦${flag}⟧ ❗️`;
      }
      
      resolve();
    });
  });
}
