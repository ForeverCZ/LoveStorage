var that;
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    order: "desc",
    hidden: false,
    flag: true,
    fileDatas: [],
    lodingMore: false,
    lodingOverAll: false,
    totalCount: 0,
    skip: 0,
    orderFlag: true,
    fileCountInfoUseId: '',
    alreadyUseCount: 0,
    allCount: 0
    // color: ['one', 'two', 'three', 'four', 'five', 'six']
  },
  // 倒序顺序
  invertedOrder: function() {
    if (that.data.orderFlag == true) {
      that.setData({
        order: "asc",
        fileDatas: [],
        lodingMore: false,
        lodingOverAll: false,
        totalCount: 0,
        skip: 0,
        orderFlag: false
      })
      that.getData();
    } else {
      that.setData({
        order: "desc",
        fileDatas: [],
        lodingMore: false,
        lodingOverAll: false,
        totalCount: 0,
        skip: 0,
        orderFlag: true
      })
      that.getData();
    }
  },
  // 预览文件
  previewFile: function(event) {
    wx.showLoading({
      title: '正在打开',
    })
    // 获取第几个文件
    // console.log(event.target.dataset.id)

    var priviewFileId = that.data.fileDatas[event.target.dataset.id].fileID;

    // 从云端下载文件获取临时文件路径
    wx.cloud.downloadFile({
      fileID: priviewFileId
    }).then(res => {
      // get temp file path
      // console.log(res.tempFilePath)
      const filePath = res.tempFilePath
      wx.openDocument({
        filePath: filePath,
        success: res => {
          wx.hideLoading();
          // console.log('打开文档成功')
          that.setData({
            flag: false
          })
        },
        fail: err => {
          console.log(err)
          wx.hideLoading();
          wx.showToast({
            icon: 'none',
            title: '不支持该格式',
          })
        }
      })
    }).catch(error => {
      // handle error
      wx.hideLoading();
      wx.showToast({
        icon: 'none',
        title: '刷新后重试',
      })
      console.log(error)
    })

  },

  // 删除当前文件
  deleteFile: function(event) {
    wx.showLoading({
      title: '正在删除',
    })
    // console.log(event.target.dataset.id);
    var priviewFileId = that.data.fileDatas[event.target.dataset.id].fileID;
    var id = that.data.fileDatas[event.target.dataset.id]._id;


    // 开始删除数据库记录
    db.collection('diary').doc(id).remove({
      success: res => {
        const _ = db.command;
        // 要删除的文件大小
        var wantDelecteFileCount = that.data.fileDatas[event.target.dataset.id].size / 1024 / 1024;
        db.collection("fileCountInfo").doc(this.data.fileCountInfoUseId).update({
          data: {
            currentStorageCount: _.inc(-wantDelecteFileCount)
          },
          success: res => {
            wx.cloud.deleteFile({
              fileList: [priviewFileId]
            }).then(res => {
              // handle success
              // console.log(res)
              // 开始删除本地渲染层数据
              that.data.fileDatas.splice(id, 1);
              that.setData({
                fileDatas: that.data.fileDatas
              })
              wx.hideLoading();
              wx.showToast({
                title: '删除成功',
              })

              that.setData({
                hidden: false,
                fileDatas: [],
                lodingMore: false,
                lodingOverAll: false,
                totalCount: 0,
                skip: 0,
              })
              that.getData();
            }).catch(error => {
              wx.hideLoading();
              wx.showToast({
                icon: 'none',
                title: '删除失败下拉刷新',
              })
              // handle error
              // console.log(error)
            })
          }
        })
        // console.log(res)
        // 开始删除文件存储

      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({
          icon: 'none',
          title: '删除失下拉刷新',
        })
      }
    })
  },

  // 复制分享链接
  copyFileLink: function(event) {
    console.log(event)
    var priviewFileId = that.data.fileDatas[event.target.dataset.id].fileID;
    // 从云端获取文件的真实链接
    wx.cloud.getTempFileURL({
      fileList: [{
        fileID: priviewFileId
      }]
    }).then(res => {
      // get temp file URL
      console.log(res.fileList[0].tempFileURL)
      const filePath = res.fileList[0].tempFileURL
      wx.setClipboardData({
        data: filePath,
        success: res => {
          console.log(res)
          setTimeout(res => {
            wx.showModal({
              title: '请复制到浏览器中打开',
              content: '链接有效期1天，请合理使用！',
              showCancel: false,
              confirmText: "知道了",
              success: res => {
                console.log("点击了确定按钮")
              }
            })
          }, 500)
        }
      })
    }).catch(error => {
      // console.log(err);
    })
  },

  // 获取存储量
  getUsedCount: function() {
    let dbtable = db.collection("fileCountInfo");
    dbtable.get().then(res => {
      this.setData({
        alreadyUseCount: res.data[0].currentStorageCount.toFixed(2),
        allCount: res.data[0].maxStorageCount
      })
    }).catch(err => {
      console.log(res)
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    that = this;
    wx.showLoading({
      title: '数据马上来',
    })
    console.log("-------------" + options.fileCountInfoUseId)
    this.setData({
      fileCountInfoUseId: options.fileCountInfoUseId
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
    if (that.data.flag) {
      that.getData();
    }
  },

  //获取数据库的数据
  getData: function() {
    db.collection("diary").orderBy("date", that.data.order).skip(that.data.skip).limit(15)
      .get().then(res => {
        wx.hideLoading();
        wx.stopPullDownRefresh();
        // console.log(res.data)
        if (res.data.length == 0) {
          this.getUsedCount();
          that.setData({
            lodingMore: false,
            lodingOverAll: true,
          });
          return;
        }
        // 数组的拼接
        var temp = [];
        for (var i = 0; i < res.data.length; i++) {
          var tempFile = res.data[i];
          temp.push(tempFile);
        }
        var list = that.data.fileDatas.concat(temp);
        that.setData({
          fileDatas: list,
          flag: true,
          lodingMore: false,
        })
        this.getUsedCount();
      }).catch(err => {
        wx.hideLoading();
        wx.showToast({
          icon: 'none',
          title: '请下拉刷新',
        })
      })
    // 实现上拉加载增加数据
    // var temp = [];
    // // 获取后15条数据
    // if (that.data.fileDatas.length < that.data.totalCount && that.data.fileDatas.length >= 20) {
    //   db.collection("diary").orderBy("date", "desc")
    //     .skip(that.data.skip).get().then(res => {

    //       if (res.data.length > 0) {
    //         for (var i = 0; i < res.data.length; i++) {
    //           var tempFile = res.data[i];
    //           temp.push(tempFile);
    //         }
    //         // 排序 跳过首次获取的20条数据，在这里就不添加限制或取文件数量因为默认每次获取20条
    //         that.setData({
    //           skip: (that.data.skip + 20),
    //           fileDatas: that.data.fileDatas.concat(temp),
    //           lodingMore: true,
    //           lodingOverAll: false,
    //         })
    //       } else {
    //         that.setData({
    //           lodingMore: false,
    //           lodingOverAll: true,
    //         });
    //       }


    //     })
    // } else {
    //   that.setData({
    //     lodingMore: false,
    //     lodingOverAll: true,
    //   });
    // }
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    that.setData({
      flag: false
    })
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
    that.setData({
      order: "desc",
      hidden: false,
      flag: true,
      fileDatas: [],
      lodingMore: false,
      lodingOverAll: false,
      totalCount: 0,
      skip: 0,
      orderFlag: true
    })
    that.getData();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    that.setData({
      flag: true,
      lodingMore: true,
      lodingOverAll: false,
      skip: (that.data.skip + 15)
    })
    that.getData();


  },
  onPageScroll: function(event) {
    // console.log(event.scrollTop)
    if (event.scrollTop > 50) {
      that.setData({
        hidden: true,
      })
    } else {
      that.setData({
        hidden: false,
      })
    }
  },
  toTop: function() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    })
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})