// pages/thermometer/thermometer.js
//获取应用实例
const app = getApp()

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    inputValue: "",
    dataList: [],
    bAbove365: false
  },
  onLoad: function () {
    const self = this;
    if (app.globalData.userInfo) {
      wx.hideLoading();
      self.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (self.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        wx.hideLoading();
        self.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          wx.hideLoading();
          app.globalData.userInfo = res.userInfo;
          self.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  //获取输入框的值
  getInputVal: function(e) {
    let val = e.detail.value;
    let bAbove365 = parseFloat(val) > 36.5? true:false;
    this.setData({
      inputValue: val,
      bAbove365: bAbove365
    });
  },
  //提交今日体温
  submit: function(e){
    const self = this;
    if (self.data.inputValue && self.data.inputValue !== "" && parseInt(self.data.inputValue) >= 35 && parseInt(self.data.inputValue) < 42){
      wx.showLoading({
        title: '正在提交~',
      });
      wx.request({
        url: app.globalData.webApiUri + 'json/set',
        data: {
          token: app.globalData.token,
          content: {
            "temNum": self.data.inputValue,
            "upTime": new Date()
          }
        },
        success: res => { wx.hideLoading();
        wx.showToast({
          title: '提交成功~',
        }) },
        fail: err => {
          wx.hideLoading(); 
          wx.showToast({
            title: '提交失败！请稍后再试~',
          }) }
      })
    } else if (parseInt(self.data.inputValue) < 35 || parseInt(self.data.inputValue) >= 42){
      wx.showModal({
        title: '提示',
        content: '您输入的体温已超出正常范围（35℃ <= X < 42℃）',
      })
    }else{
      wx.showModal({
        title: '提示',
        content: '您还没输入体温~',
      })
    }
  },
  //查询历史体温
  check: e => {
    wx.navigateTo({
      url: '../thermometer_record/thermometer_record',
    })
  },
  // 删除记录，临时
  del: function(e) {
    const self = this;
    let arr = self.data.dataList;
    for (let i = 0;i<arr.length;i++){
      console.log(arr[i].id);
      wx.request({
        url: app.globalData.webApiUri + 'json/delete',
        data: { id: arr[i].id},
        success: res => { console.log(res); },
        fail: err => { console.log(err); }
      })
    }
  },
  getUserInfo: function (e) {
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }
});