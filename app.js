//app.js
App({
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || [];
    logs.unshift(Date.now());
    wx.setStorageSync('logs', logs);
    const self = this;
    //获取屏幕大小，用于画canvas
    wx.getSystemInfo({
      success: function (res) {
        self.globalData.screenWidth = res.windowWidth;
      }
    });
    wx.showLoading({
      title: '登陆中~'
    });
    // 登录
    wx.login({
      success: res => {
        const code = res.code;
        // 获取用户token，如果未注册，调用接口并获取token
        wx.request({
          url: self.globalData.webApiUri+"user/wxapp/login",
          data: {
            code: code
          },
          success: res=>{
            if(res.data.code===0){
              console.log("login:", res.data.data.token);
              //成功获取token
              self.globalData.token = res.data.data.token;
            }else{
              //注册
              self.globalData.token = self.getTokenByRegister(code);
            }
          }
        })
      }
    });
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  onShow: function(){
  },
  onLoad: function(){
    console.log('load');
  },
  //用户注册，并获取token
  getTokenByRegister: function (code) {
    const self = this;
    wx.request({
      url: self.globalData.webApiUri + "user/wxapp/register/simple",
      data: {
        code: code
      },
      success: res => {
        wx.request({
          url: self.globalData.webApiUri + "user/wxapp/login",
          success: ers => {
            return res.data.token;
          }
        })
      }
    })
  },
  globalData: {
    userInfo: null,
    token: "",
    screenWidth: 0,
    //接头地址
    webApiUri: "https://api.it120.cc/6irvingL/"
  }
});