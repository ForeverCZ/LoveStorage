const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    fileCountInfoUseId: ''
  },
  // 跳转到我的文件列表
  onSaveFileClick: function() {
    wx.navigateTo({
      url: '../saveFileInfo/saveFileInfo?fileCountInfoUseId=' + this.data.fileCountInfoUseId,
      success: res => {
        console.log(res)
      }
    })
  },

  firstLadInfo: function() {
    let dbtable = db.collection("fileCountInfo");
    dbtable.get().then(res => {
      console.log(res)
      if (res.data.length == 0) {
        dbtable.add({
          data: {
            maxStorageCount: 100,
            currentStorageCount: 0
          }
        }).then(res => {
          this.setData({
            fileCountInfoUseId: res._id
          })
          console.log(res)
        }).catch(err => {
          console.log(err)
          wx.showToast({
            icon: 'none',
            title: '请重试',
          })
        })
      } else {
        this.setData({
          fileCountInfoUseId: res.data[0]._id
        })
      }
    }).catch(err => {
      console.log(err)
      wx.showToast({
        icon: 'none',
        title: '请重试',
      })
    })
  },
  // 邀请好友一起玩
  clickInvitivation: function() {
    console.log("邀请好友一起玩，没作用")
  },

  // 分到朋友圈
  toShareMoments: function(e) {
    wx.navigateTo({
      url: '../Posters/Posters',
      success: res => {
        console.log(res)
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.firstLadInfo();
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
    return {
      title: '自己的文件存储小程序',
      path: 'pages/saveFile/saveFile'
    }
  }
})