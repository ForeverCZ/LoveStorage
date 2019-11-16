var that;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    postUrlImg: '',
    show: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    wx.showLoading({
      title: '正在生成',
    })
    that = this;
    // 请求背景图片
    let poster1 = new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: '../../images/posterImageBg.png',
        success: res => {
          resolve(res)
        }
      })
    })


    // 请求小程序吗
    let poster2 = new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: '../../images/acc.jpg',
        success: res => {
          resolve(res)
        }
      })
    })


    Promise.all([poster1, poster2]).then(res => {
      console.log(res)

      // 定义背景图片绘制高度宽度
      var width = 240;
      var height = 350;

      //获取下载的临时路径
      var bgPath = res[0].path;
      var programPath = res[1].path;

      // 创建 canvas 的绘图上下文 CanvasContext 对象

      const ctx = wx.createCanvasContext("shareImg");


      // 画图片
      ctx.beginPath();
      ctx.drawImage("../../" + bgPath, 0, 0, width, height);
      ctx.save();
      ctx.beginPath();
      ctx.arc(120, 130, 50, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage("../../" + programPath, 70, 80, 100, 100);
      ctx.restore();
      ctx.setTextAlign("center");
      ctx.setFillStyle("white");
      ctx.setFontSize(15);
      ctx.fillText("爱存储", width / 2, 220);
      ctx.setFontSize(13);
      ctx.setFillStyle("rgb(253,252,251)");
      ctx.fillText("自己的文件储存小程序", width / 2, 270);

      // 生成海报图片
      ctx.draw(false, setTimeout(res => {
        that.showimg();
      }, 1000));

      wx.hideLoading();
      that.setData({
        show: false
      })

    })
  },

  // 生成海报图片
  showimg: function() {
    console.log("生成海报图片")
    wx.canvasToTempFilePath({
      canvasId: 'shareImg',
      success: res => {
        console.log(res.tempFilePath)
        that.setData({
          postUrlImg: res.tempFilePath,
        })
      },
      fail: err => {
        console.log(err)
      }

    })
  },
  // 分享海报
  shareFriendBtn: function() {
    wx.saveImageToPhotosAlbum({
      filePath: that.data.postUrlImg,
      success: res => {
        wx.showModal({
          title: '海报保存成功',
          content: '快去分享给小伙伴吧',
          showCancel: false,
          confirmText: "知道了"
        })
      }
    })
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