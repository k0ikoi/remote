/***
 * * 🤖 纯 Gemini 可用性检测脚本
 * For Quantumult-X
 * * [task_local]
 * event-interaction https://raw.githubusercontent.com/你的路径/gemini_check.js, tag=Gemini查询, img-url=sparkles, enabled=true
 * ***/

const BASE_URL_GEMINI = 'https://gemini.google.com/app';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

var opts1 = {
  policy: $environment.params,
  redirection: false // 必须关闭重定向，拦截 302 状态码
};

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

// 核心检测逻辑
function testGemini() {
  return new Promise((resolve, reject) => {
    let option = {
      url: BASE_URL_GEMINI,
      opts: opts1, 
      timeout: 3500,
      headers: {
        'User-Agent': UA
      }
    };

    $task.fetch(option).then(response => {
      let status = response.statusCode;
      let headers = response.headers;
      let loc = headers['Location'] || headers['location'];
      let data = response.body || "";

      if (status === 200) {
        if (data.toLowerCase().indexOf("isn't available") !== -1 || data.toLowerCase().indexOf("not supported") !== -1) {
          result["Gemini"] = "<b>Gemini: </b>未支持 🚫";
        } else {
          result["Gemini"] = "<b>Gemini: </b>支持 🎉";
        }
        resolve();
      } 
      else if (status === 302 || status === 303 || status === 307) {
        if (loc && loc.indexOf('support.google.com') !== -1) {
          result["Gemini"] = "<b>Gemini: </b>未支持 🚫";
        } 
        else if (loc && loc.indexOf('accounts.google.com') !== -1) {
          result["Gemini"] = "<b>Gemini: </b>支持 🎉";
        } 
        else {
          result["Gemini"] = "<b>Gemini: </b>支持 🎉";
        }
        resolve();
      } 
      else if (status === 403) {
        result["Gemini"] = "<b>Gemini: </b>未支持 🚫";
        resolve();
      } 
      else {
        result["Gemini"] = "<b>Gemini: </b>检测异常 (状态码: " + status + ") ❗️";
        resolve();
      }
    }, reason => {
      result["Gemini"] = "<b>Gemini: </b>检测超时 🚦";
      resolve();
    });
  });
}
