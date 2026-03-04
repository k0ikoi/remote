/**
 * @fileoverview Gemini 地区可用性检测脚本
 * @supported Quantumult X, Surge, Loon, Shadowrocket
 */

const isQX = typeof $task !== "undefined";
const isSurge = typeof $httpClient !== "undefined";
const isLoon = typeof $loon !== "undefined";

const url = "https://gemini.google.com/app";
const headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Sec-Fetch-Mode": "navigate"
};

function checkGemini() {
    const request = { url: url, headers: headers };
    
    if (isQX) {
        $task.fetch(request).then(response => {
            analyzeResponse(response.statusCode, response.body);
        }, reason => {
            finish("网络请求失败 ❌", reason.error || "请求超时", "#FF3B30", "xmark.octagon");
        });
    } else if (isSurge || isLoon) {
        $httpClient.get(request, (error, response, body) => {
            if (error) {
                finish("网络请求失败 ❌", error, "#FF3B30", "xmark.octagon");
            } else {
                analyzeResponse(response.status || response.statusCode, body);
            }
        });
    } else {
        finish("运行环境不支持", "请使用 Quantumult X, Surge 或 Loon", "#FF3B30", "xmark.octagon");
    }
}

function analyzeResponse(status, body) {
    status = parseInt(status);
    
    if (status === 200) {
        // 检查返回的主体内容以确定是否被限制
        const bodyStr = body ? body.toLowerCase() : "";
        if (bodyStr.includes("not available in your country") || 
            bodyStr.includes("isn't available right now") || 
            bodyStr.includes("unsupported_country")) {
            finish("当前地区不支持 Gemini ❌", "该节点 IP 无法使用 Gemini", "#FF3B30", "exclamationmark.triangle");
        } else {
            finish("当前地区支持 Gemini ✅", "解锁成功", "#34C759", "checkmark.circle");
        }
    } else if (status === 302 || status === 301) {
        // 未授权地区的 IP 访问有时会被重定向到 FAQ 页面或错误页面
        finish("当前地区不支持 Gemini ❌", "检测到地区受限重定向", "#FF3B30", "exclamationmark.triangle");
    } else {
        finish("检测失败 ⚠️", `未知状态码 HTTP ${status}`, "#FF9500", "questionmark.circle");
    }
}

function finish(title, subtitle, color, icon) {
    const titleText = "Gemini 状态检测";
    
    if (isQX) {
        $done({
            title: titleText,
            content: title + "\n" + subtitle,
            "icon": icon,
            "icon-color": color
        });
    } else if (isSurge || isLoon) {
        $done({
            title: titleText,
            content: title + "\n" + subtitle,
            icon: icon,
            "icon-color": color
        });
    } else {
        console.log(`${titleText}\n${title}\n${subtitle}`);
        $done();
    }
}

// 启动检测
checkGemini();
