/*
 * Gemini Availability Check Script for Quantumult X
 * 检测当前节点是否支持 Google Gemini AI
 */

const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro?key=AIzaSyD-FakeKeyForCheck';

const opts = {
    url: url,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json'
    }
};

$task.fetch(opts).then(response => {
    // Gemini 在不受支持的地区通常返回 403 或 400 带有特定错误消息
    // 如果返回 400 且提示 API_KEY_INVALID，说明网络通畅且地区支持（只是 Key 错）
    // 如果返回 403，通常是 Location Not Supported
    
    if (response.statusCode === 400) {
        let data = JSON.parse(response.body);
        if (data.error && data.error.message.includes("API_KEY_INVALID")) {
            $done({
                title: "Gemini AI",
                content: "可用 (地区支持)",
                style: "good"
            });
        } else {
            $done({
                title: "Gemini AI",
                content: "异常 (状态码 400)",
                style: "alert"
            });
        }
    } else if (response.statusCode === 403) {
        $done({
            title: "Gemini AI",
            content: "不可用 (地区限制)",
            style: "error"
        });
    } else {
        $done({
            title: "Gemini AI",
            content: `检测失败 (Status: ${response.statusCode})`,
            style: "error"
        });
    }
}, reason => {
    $done({
        title: "Gemini AI",
        content: "网络连接超时",
        style: "error"
    });
});
