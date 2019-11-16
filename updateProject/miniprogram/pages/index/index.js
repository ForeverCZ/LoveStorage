// miniprogram/pages/index/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    instructions: false,
    timeCount: 10
  },
  // 跳转到文件存储区
  toSaveFile: function() {
    wx.navigateTo({
      url: '../saveFile/saveFile',
    })
  },
  // 跳转到备忘录
  // toMemorandum: function() {
  //   wx.showToast({
  //     icon: 'none',
  //     title: '待开发',
  //   })
  //   // wx.navigateTo({
  //   //   url: '../memorandum/memorandum',
  //   // })
  // },

  //客服消息
  handleContact: function(event) {
    console.log(event)
  },

  // 取消说明
  instructionsBtn: function() {
    this.setData({
      instructions: false
    })
  },
  //添加判断缓存

  expiringCteat: function() {
    wx.getStorage({
      key: 'time1',
      success: res => {
        // console.log(res.data)
        this.setData({
          instructions: false
        })
      },
      fail: err => {
        wx.setStorage({
          key: "time1",
          data: new Date().getTime(),
          success: res => {
            this.setData({
              instructions: true
            })
            var interval = setInterval(event => {
              var timeCount = this.data.timeCount
              this.setData({
                timeCount: --timeCount
              })
            }, 1000)
            setTimeout(res => {
              this.setData({
                instructions: false
              })
              clearInterval(interval);
            }, 10000)
          }
        })

      }
    })

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.expiringCteat();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})