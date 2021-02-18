// copy from https://gitee.com/passerby-b/javascript
//兼容loon和qx,理论上支持surge
//获取Authorization重写配置:
//Qx:https://youhui.95516.com/newsign/api/coin_details url script-request-header https://gitee.com/passerby-b/javascript/raw/master/unipay.js
//Loon:http-request https://youhui.95516.com/newsign/api/coin_details script-path=https://gitee.com/passerby-b/javascript/raw/master/unipay.js, requires-body=true, timeout=10, tag=云闪付签到
//添加MITM hostname:youhui.95516.com
//经测试authorization有效期为3天,自行决定是否需要折腾
//云闪付app最好别升级,有可能导致签到失效

var Authorization = '';//手动获取authorization填写此处
var $tool = tool();
try {
	var img = "https://is5-ssl.mzstatic.com/image/thumb/Purple114/v4/53/bc/b5/53bcb52a-6c33-67cc-0c70-faf4ffbdb71e/AppIcon-0-0-1x_U007emarketing-0-0-0-6-0-0-85-220.png/230x0w.png";
	if (typeof $request != "undefined") {
		if ($request.url.indexOf("youhui.95516.com/newsign/api/coin_details") > -1) {
			console.log("云闪付获取Cookie")
			var Cookie = $request.headers["Authorization"];
			if (!!Cookie) {
				$tool.setkeyval(Cookie, "authorization");
				console.log("🍎Authorization:" + Cookie);
				$tool.notify("云闪付获取Cookie成功", Cookie, {img: img});
			}
		}
	} else {
		var url = 'https://youhui.95516.com/newsign/api/daily_sign_in';
		var method = 'POST';
		var headers = {
			'Connection': 'keep-alive',
			'Accept-Encoding': 'gzip, deflate, br',
			'Origin': 'https://youhui.95516.com',
			'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148/sa-sdk-ios  (com.unionpay.chsp) (cordova 4.5.4) (updebug 0) (version 810) (UnionPay/1.0 CloudPay) (clientVersion 140) (language zh_CN)',
			'Authorization': !!$tool.getkeyval("authorization") ? $tool.getkeyval("authorization") : Authorization,
			'Referer': 'https://youhui.95516.com/newsign/public/app/index.html',
			'Host': 'youhui.95516.com',
			'Accept-Language': 'zh-cn',
			'Accept': 'application/json, text/plain'
		};
		var body = '';

		var myRequest = {
			url: url,
			method: method,
			headers: headers,
			body: body
		};

		$tool.post(myRequest, function (e, r, d) {
			console.log(d);
			var obj = JSON.parse(d);
			if (!!obj.signedIn) {
				if (obj.signedIn == true) {
					var days = 0;
					for (var item in obj.days) {
						if (obj.days[item] == 1) days++;
					}
					$tool.notify("云闪付签到成功!", "首次签到时间:" + obj.startedAt.split('T')[0], "已签到:" + days + "天!", {img: img});
				} else {
					$tool.notify("云闪付签到失败!", d, d, {img: img});
				}
			} else {
				$tool.notify("云闪付签到失败!", d, d, {img: img});
			}
		})
	}
	$done();
} catch (e) {
	console.log("🍎erro" + e);
	$tool.notify("云闪付签到错误!", e, e, {img: img});
	$done();
}

function tool() {
	var isLoon = typeof $httpClient != "undefined";
	var isQuanX = typeof $task != "undefined";
	var obj = {
		notify: function (title, subtitle, message, option) {
			var option_obj = {};
			if (isQuanX) {
				if (!!option) {
					if (typeof option == "string") {
						option_obj["open-url"] = option
					}
					if (!!option.url) {
						option_obj["open-url"] = option.url
					}
					if (!!option.img) {
						option_obj["media-url"] = option.img
					}
					$notify(title, subtitle, message, option_obj)
				} else {
					$notify(title, subtitle, message)
				}
			}
			if (isLoon) {
				if (!!option) {
					if (typeof option == "string") {
						option_obj["openUrl"] = option
					}
					if (!!option.url) {
						option_obj["openUrl"] = option.url
					}
					if (!!option.img) {
						option_obj["mediaUrl"] = option.img
					}
					$notification.post(title, subtitle, message, option_obj)
				} else {
					$notification.post(title, subtitle, message)
				}
			}
		}, get: function (options, callback) {
			if (isQuanX) {
				if (typeof options == "string") {
					options = {url: options}
				}
				options["method"] = "GET";
				$task.fetch(options).then(function (response) {
					callback(null, adapterStatus(response), response.body)
				}, function (reason) {
					callback(reason.error, null, null)
				})
			}
			if (isLoon) {
				$httpClient.get(options, function (error, response, body) {
					callback(error, adapterStatus(response), body)
				})
			}
		}, post: function (options, callback) {
			if (isQuanX) {
				if (typeof options == "string") {
					options = {url: options}
				}
				options["method"] = "POST";
				$task.fetch(options).then(function (response) {
					callback(null, adapterStatus(response), response.body)
				}, function (reason) {
					callback(reason.error, null, null)
				})
			}
			if (isLoon) {
				$httpClient.post(options, function (error, response, body) {
					callback(error, adapterStatus(response), body)
				})
			}
		}, unicode: function (str) {
			return unescape(str.replace(/\\u/gi, "%u"))
		}, decodeurl: function (str) {
			return decodeURIComponent(str)
		}, json2str: function (obj) {
			return JSON.stringify(obj)
		}, str2json: function (str) {
			return JSON.parse(str)
		}, setkeyval: function (value, key) {
			if (isQuanX) {
				$prefs.setValueForKey(value, key)
			}
			if (isLoon) {
				$persistentStore.write(value, key)
			}
		}, getkeyval: function (key) {
			if (isQuanX) {
				return $prefs.valueForKey(key)
			}
			if (isLoon) {
				return $persistentStore.read(key)
			}
		}
	};

	function adapterStatus(response) {
		if (response) {
			if (response.status) {
				response["statusCode"] = response.status
			} else {
				if (response.statusCode) {
					response["status"] = response.statusCode
				}
			}
		}
		return response
	}

	return obj
};
