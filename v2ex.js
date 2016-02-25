var EventProxy = require('eventproxy'),
  superagent = require('superagent'),
  cheerio = require('cheerio'),
  loginUrl = 'http://v2ex.com/signin',
  baseUrl = 'http://v2ex.com',
  dairyMissionUrl = 'http://v2ex.com/mission/daily',
  redeem = baseUrl + '/mission/daily/redeem?once=';
var ep = new EventProxy();

var formData = {
  'u': 'name@gmail.com',
  'p': '123455',
  'once': '61048',
  'next': '/mission/daily'
};
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

var ep = new EventProxy();

var cookie = null;

console.log('登录中...\n此过程你有被封IP的危险...');
superagent
  .get(loginUrl)
  .set(headers)
  .end(function(err, res) {
    $ = cheerio.load(res.text);
    var iptonce = $('input');
    formData.once = iptonce[3].attribs.value;
    var setPreCookie = res.headers['set-cookie'];
    cookie = setPreCookie[0] + ";" + setPreCookie[1];
    superagent
      .post(loginUrl)
      .set(headers)
      .set('Cookie', cookie)
      .type('form')
      .send(formData)
      .redirects(0)
      .end(function(err, result) {
        if (typeof(result) == 'undefined') {
          console.log("登录失败\n");
        } else {
          var setLoginCookie = result.headers['set-cookie'];
          if (typeof(setLoginCookie) == 'undefined') {
            console.log("登录失败\n");
          } else {
            cookie = setLoginCookie[0] + ";" + setLoginCookie[1] + ";" + cookie;
            ep.emit("cookie", cookie);
          }
        }
      });
  });


//访问首页判断是否成功，并获取相对应的cookie信息
ep.on("cookie", function(cookie) {
  console.log('测试是否登陆成功中...');
  superagent
    .get(baseUrl)
    .set(headers)
    .set('Cookie', cookie)
    .end(function(err, res) {

      var setTabCookie = res.headers['set-cookie'];
      var fulicookie = setTabCookie[0] + ";" + setTabCookie[1] + ";" + cookie;
      $ = cheerio.load(res.text);
      var name = $('.top')[1].children[0].data;
      console.log(name + "登录成功");
      var temp = res.text;
      var fuliurl = redeem + res.text.substr(res.text.indexOf('once') + 5, 5);
      ep.emit("fuliurl", fuliurl);
      ep.emit("fulicookie", fulicookie);
    });
})

//访问福利网址
ep.all("fuliurl", "fulicookie", function(fuliurl, fulicookie) {
  superagent
    .get(fuliurl)
    .set(headers2)
    .redirects(0)
    .set('Cookie', fulicookie)
    .end(function(err, res) {
      superagent
        .get(dairyMissionUrl)
        .set(headers2)
        .set('Cookie', cookie)
        .end(function(err, res) {
          $ = cheerio.load(res.text);
          console.log($('.message').text());
        })
    })
})