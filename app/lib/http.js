/* eslint-disable */

const axios = require("axios");

const http = (options) => {
  return axios(options).then((res = {}) => {
    const { data } = res;
    return data;
  });
};

module.exports = http;
