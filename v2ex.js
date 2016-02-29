var superagent = require('superagent'),
  cheerio = require('cheerio'),
  mail = require('./mail'),
  loginUrl = 'http://v2ex.com/signin',
  baseUrl = 'http://v2ex.com',
  dairyMissionUrl = 'http://v2ex.com/mission/daily',
  redeem = baseUrl + '/mission/daily/redeem?once='; 

var headers = {
  'Content-Type': 'application/x-www-form-urlencoded',
  Host: 'v2ex.com',
  Origin: 'http://v2ex.com',
  Referer: 'http://v2ex.com/signin',
  'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.122 Safari/537.36 SE 2.X MetaSr 1.0'
};

var headers2 = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Encoding': 'gzip,deflate,sdch',
  'Accept-Language': 'zh-CN,zh;q=0.8',
  'Proxy-Connection': 'keep-alive',
  'Host': 'v2ex.com',
  'Referer': 'http://v2ex.com/mission/daily',
  'Upgrade-Insecure-Requests': 1,
  'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.122 Safari/537.36 SE 2.X MetaSr 1.0'
};
 

function v2ex(account) {
  this.account = account;
  this.cookie = {
    value: null,
    expires: null
  };
  this.init();
}

v2ex.prototype = {

  init: function() {
    var that = this;
    that.getFuli(function(msg) {
      var mailText = "[" + that.account.u + "]" + msg + new Date();
      mail.sendMail(mailText, mailText, function(error, response) {
        if (error) {
          console.log(error + "邮件发送失败");
          return
        }
        console.log("成功");
      });
    });
  },

  // 验证登录，如果凭证没过期，无需重新验证
  _verify: function(cb) {
    Date.now() > this.cookie.expires ? this.login(cb) : cb(this.cookie);
  },

  //登录并获取cookie
  login: function(cb) {
    var that = this;
    console.log('登录中...\n此过程你有被封IP的危险...');
    superagent
      .get(loginUrl)
      .set(headers)
      .end(function(err, res) {
        $ = cheerio.load(res.text);
        var iptonce = $('input');
        that.account.once = iptonce[3].attribs.value;
        var setPreCookie = res.headers['set-cookie'];
        that.cookie.value = setPreCookie[0] + ";" + setPreCookie[1];
        superagent
          .post(loginUrl)
          .set(headers)
          .set('Cookie', that.cookie.value)
          .type('form')
          .send(that.account)
          .redirects(0)
          .end(function(err, result) {
            if (typeof(result) == 'undefined') {
              console.log("登录失败\n");
            } else {
              var setLoginCookie = result.headers['set-cookie'];
              if (typeof(setLoginCookie) == 'undefined') {
                console.log("登录失败\n");
              } else {
                that.cookie.value = setLoginCookie[0] + ";" + setLoginCookie[1] + ";" + that.cookie.value;
                cb(that.cookie);
              }
            }
          });
      })
  },

  //签到获取福利
  getFuli: function(cb) {
    var that = this;
    that._verify(function() {
      that.testLogin(function(fuliurl, cookie) {
        superagent
          .get(fuliurl)
          .set(headers2)
          .redirects(0)
          .set('Cookie', cookie.value)
          .end(function(err, res) {
            superagent
              .get(dairyMissionUrl)
              .set(headers2)
              .set('Cookie', cookie.value)
              .end(function(err, res) {
                $ = cheerio.load(res.text);
                var msg = $('.message').text();
                cb(msg);
              })
          })

      });
    });
  },

  //访问首页判断是否成功，并获取相对应的cookie信息 
  testLogin: function(cb) {
    var that = this;
    console.log('测试是否登陆成功中...');
    superagent
      .get(baseUrl)
      .set(headers)
      .set('Cookie', that.cookie.value)
      .end(function(err, res) {
        var setTabCookie = res.headers['set-cookie'];
        that.cookie.value = setTabCookie[0] + ";" + setTabCookie[1] + ";" + that.cookie.value;
        that.cookie.expires = setTabCookie.join().match(/expires=(.*);/)[0];
        $ = cheerio.load(res.text);
        var name = $('.top')[1].children[0].data;
        console.log(name + "登录成功");
        var temp = res.text;
        var fuliurl = redeem + res.text.substr(res.text.indexOf('once') + 5, 5);
        cb(fuliurl, that.cookie)
      });

  }
}

module.exports = function(account) {
  return new v2ex(account);
};