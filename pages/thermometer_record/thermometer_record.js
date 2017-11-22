// pages/thermometer/thermometer.js
const wxCharts = require("../../utils/wxcharts-min.js");
var lineChart = null;
//获取应用实例
const app = getApp();

Page({
  data: {
    tabList: [{ id: 0, name: "时" }, { id: 1, name: "日" }, { id: 2, name: "周" }, { id: 3, name: "月"  }],
    activeTabIndex: 0,
    dataList: []
  },
  onLoad: function () {
    const self = this;
    wx.request({
      url: app.globalData.webApiUri + 'json/list',
      data: {
        token: app.globalData.token
      },
      success: res => {
        console.log("历史体温记录",res.data.data);
        if (res.data.code === 0 && res.data.data.length>0){
          self.setData({
            dataList: res.data.data.sort((a, b) => new Date(a.jsonData.upTime) - new Date(b.jsonData.upTime))
          });
          //初始化图表，按 时 统计
          self.renderPage(0);
        }
      },
      fail: err => { console.log(err); }
    });
  },
  //渲染图表 (传入一个类型 flag=0:时   flag=1:日   flag=2:周（当天往前7天）  flag=3:月（当天往前30天）)
  renderPage: function (flag) {
    console.log("类型：", flag);
    const self = this;
    let dataArr = self.data.dataList;
    let dataObj = { 
      categories:[],
      series: []
    };
    switch(flag) {
      case 0:
        let now_hour = (new Date()).getHours();
        dataArr = dataArr.filter(item => new Date(item.jsonData.upTime).toLocaleDateString() === (new Date()).toLocaleDateString() && new Date(item.jsonData.upTime).getHours() === (new Date()).getHours() );
        for (let i = 0; i <= 59; i++) {
          dataObj.categories.push(i);
          let temNum = null;
          dataArr.forEach(item => {
            if (new Date(item.jsonData.upTime).getMinutes() === i){
              temNum = item.jsonData.temNum;
            }
          });
          dataObj.series.push(temNum);
        }
        break;
      case 1:
        let now_day = new Date().toLocaleDateString();
        dataArr = dataArr.filter(item => new Date(item.jsonData.upTime).toLocaleDateString() === now_day);
        for (let i = 0; i <= 23; i++) {
          dataObj.categories.push(i);
          let temNum = 0;  //记录 小时体温和
          let count = 0;  //记录小时内有多少条记录
          dataArr.forEach(item => {
            if (new Date(item.jsonData.upTime).getHours() === i) {
              temNum += parseFloat(item.jsonData.temNum);
              count++;
            }
          });
          temNum = temNum == 0 ? null : (temNum / count).toFixed(1);
          dataObj.series.push(temNum);
        }
        break;
      case 2:
        let today = new Date();
        let nowDay = today.getDate();
        let now_weekday = today.getDay();
        dataArr = dataArr.filter(item => (nowDay - new Date(item.jsonData.upTime).getDate()) < 7 );
        for (let i = 0; i < 7; i++) {
          let n = 6-i;
          now_weekday = now_weekday + 1 > 7 ? 1 : now_weekday + 1;
          dataObj.categories.push(self.num2weekday(now_weekday));
          let temNum = 0;  //记录 日体温和
          let count = 0;  //记录日内有多少条记录
          let d = new Date(today);
          d.setDate(d.getDate() - n);
          dataArr.forEach(item => {
            if (d.toLocaleDateString() === new Date(item.jsonData.upTime).toLocaleDateString()) {
              temNum += parseFloat(item.jsonData.temNum);
              count++;
            }
          });
          temNum = temNum == 0 ? null : (temNum / count).toFixed(1);
          dataObj.series.push(temNum);
        }
        break;
      case 3:
        let today1 = new Date();
        let now_month = today1.getMonth();
        let days = new Date(today1.getFullYear(), today1.getMonth() + 1, 0).getDate();
        dataArr = dataArr.filter(item => now_month - new Date(item.jsonData.upTime).getMonth() < 30);
        dataObj.categories = self.getDaysByToday();
        for(let i = 0; i<30;i++){
          let n = 29 - i;
          let temNum = 0;  //记录日体温和（）
          let count = 0;  //记录日内有多少条记录
          let d = new Date(today1);
          d.setDate(d.getDate() - n);
          dataArr.forEach(item => {
            if (d.toLocaleDateString() === new Date(item.jsonData.upTime).toLocaleDateString()) {
              temNum += parseFloat(item.jsonData.temNum);
              count++;
            }
          });
          temNum = temNum == 0 ? null : (temNum / count).toFixed(1);
          dataObj.series.push(temNum);
        }
        break;
    }
    self.renderCanvas(dataObj);
  },
  tabtap: function(e){
    let self = this;
    let flag = parseInt(e.target.dataset.index);
    self.setData({ activeTabIndex: flag});
    self.renderPage(flag);
  },
  touchHandler: function (e) {
    lineChart.showToolTip(e, {
      background: '#7cb5ec',
      format: function (item, category) {
        return category + ': ' + item.data +"℃"
      }
    });
  }, 
  //数字转换为周几  1=周一  2=周二...
  num2weekday: num => {
    let weekday = "";
    switch(num){
      case 1:
        weekday = "周一";
        break;
      case 2:
        weekday = "周二";
        break;
      case 3:
        weekday = "周三";
        break;
      case 4:
        weekday = "周四";
        break;
      case 5:
        weekday = "周五";
        break;
      case 6:
        weekday = "周六";
        break;
      case 7:
        weekday = "周日";
        break;
    }
    return weekday;
  },
  //月显示时，x轴的集合。输入当天时间，返回当天往前30天的数组
  getDaysByToday: () => {
    let dayArr = [];
    let today = new Date();
    today.setDate(today.getDate()-29);
    let preMonthDaysCount = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
    let pre30dayNum = today.getDate();
    for (let i = 0; i< 30; i++){
      pre30dayNum = pre30dayNum > preMonthDaysCount ? 1 : pre30dayNum;
      dayArr.push(pre30dayNum);
      pre30dayNum++;
    }
    return dayArr;
  },
  //绘制canvas，折线图
  renderCanvas: data => {
    console.log("canvas", data);
    lineChart = new wxCharts({
      canvasId: 'lineCanvas',
      type: 'line',
      dataLabel: false,
      categories: data.categories,
      series: [{
        name: '体温 (℃)',
        data: data.series
      }],
      yAxis: {
        title: '体温 (℃)',
        format: function (val) {
          return val.toFixed(1);
        },
        min: 34,
        max: 42
      },
      width: app.globalData.screenWidth * 0.9,
      height: 200
    });
  }
});