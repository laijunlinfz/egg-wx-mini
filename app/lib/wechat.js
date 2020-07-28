/* eslint-disable */
/**
 * 有效时间戳，该时间内用缓存access_token，不用重新请求
 * 数据结构
 * {
 *   appid: {
 *      token: '',
 *      ts: 0
 *   }
 * }
 */

const http = require("./http");

let ACCESS_TOKEN_CATCH = {};

const getCatchToken = (appid) => {
  const nowTs = Date.now();
  const { token = "", ts = 0 } = ACCESS_TOKEN_CATCH[appid] || {};
  if (token && ts && nowTs < ts) {
    return token;
  } else {
    return "";
  }
};

const setCatchToken = (appid, token, expires) => {
  const nowTs = Date.now();
  ACCESS_TOKEN_CATCH[appid] = { token, ts: nowTs + (expires - 30 * 60) * 1000 };
};

/*获取微信ACCESS_TOKEN appid: string */
const getWechatAccessToken = async (config) => {
  const { appid = "", secret = "" } = config;
  const catchToken = getCatchToken(appid);
  if (catchToken) {
    return { code: 0, data: catchToken };
  }
  // const { ctx } = this;
  if (!appid || !secret) {
    console.error("getWechatAccessToken: appid or secret is null");
    return "";
  }
  let url =
    "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=" +
    appid +
    "&secret=" +
    secret;
  // const result = await ctx.curl(url);
  const result = await http({ url, method: "get" });
  // 返回示例
  // {
  //   "access_token": "12_fbGiPb3QuOW9M6n-Abg0ik4My2NocTJZZiAIAEUU",
  //   "expires_in": 7200
  // }
  const { access_token = "", expires_in = 0 } = result;
  if (access_token && expires_in) {
    setCatchToken(appid, access_token, expires_in);
    return access_token;
  } else {
    return "";
  }
};

// 生成页面的二维码
const getWechatQRCode = async (config, sharePath) => {
  const tokenRes = await getWechatAccessToken(config);
  if (!tokenRes) {
    console.error("getWechatQRCode: wechatAccessToken is null");
    return null;
  }
  const url =
    "https://api.weixin.qq.com/wxa/getwxacode?access_token=" + tokenRes;

  const options = {
    url,
    method: "POST", // 必须指定 method
    contentType: "json", // 通过 contentType 告诉 HttpClient 以 JSON 格式发送
    data: { path: sharePath },
    // dataType: "Buffer", // 明确告诉 HttpClient 以 JSON 格式处理返回的响应 body
    responseType: "arraybuffer", // 明确告诉 HttpClient 以 JSON 格式处理返回的响应 body
  };
  // const result = await ctx.curl(url, options);
  const result = await http(options);
  // if (data) {
  //     const fileName = ctx.utils.md5('miniprogram_qrcode_' + sharePath);
  //     // const qiniuUploadRes = await this.service.upload.qiniuUploadBuff(data, fileName);
  //     const qiniuUploadRes = await this.ctx.utils.qiniuUploadBuff(data, fileName);
  //     if (qiniuUploadRes) {
  //         res = { code: 0, data: qiniuUploadRes };
  //     } else {
  //         res = { code: 3, data: null };
  //     }
  // } else {
  //     res = { code: 2, data: null };
  // }
  return result;
};

/**获取微信openid */
const getWchatOpenId = async (config, code) => {
  // const { ctx } = this;
  const { appid = "", secret = "" } = config;
  let url =
    "https://api.weixin.qq.com/sns/jscode2session?appid=" +
    appid +
    "&secret=" +
    secret +
    "&js_code=" +
    code +
    "&grant_type=authorization_code";
  let result = await http({ url, method: "get" });
  if (!result || !result.openid) {
    console.error("getWchatOpenId: openId is null ");
    return "";
  }
  return result;
};

module.exports = {
  getWechatQRCode, // 获取微信二维码
  getWechatAccessToken, // 获取微信AccessToken
  getWchatOpenId, // 获取微信OpenId
};
