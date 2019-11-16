const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    instructions: false,
    timeCount: 15,
    chooseMessageFiles: [],
    fileIDs: [],
    canUpload: true,
    fileFormat: ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "pdf", 'txt'],
    fileType: "",
    choosefileStorageCount: 0,
    userId: '',
    fileCountInfoUseId: "'"
  },
  //选择文件
  chooseMessageFile: function() {
    this.setData({
      fileType: ''
    })
    if (this.data.fileIDs.length == 0) {
      wx.chooseMessageFile({
        count: 3,
        type: "file",
        success: res => {
          console.log(res.tempFiles)

          // 判断文件格式是否正确
          for (var i = 0; i < res.tempFiles.length; i++) {
            var position = res.tempFiles[i].name.lastIndexOf('.');
            var suffix = res.tempFiles[i].name.substring(position + 1);
            if (this.data.fileFormat.indexOf(suffix) < 0) {
              console.log("文件格式")
              this.setData({
                canUpload: false,
                fileType: suffix
              })
              console.log(this.data.fileType)
              break;
            }
          }
          if (this.data.canUpload) {
            // 判断选择的文件大小加上已存储的文件大小是否小于等于最大总量
            db.collection("fileCountInfo").get().then(event => {
              var choosefileStorageCount = 0;
              for (var i = 0; i < res.tempFiles.length; i++) {
                choosefileStorageCount += res.tempFiles[i].size;
              }
              // 存储选择的文件大小M为单位
              this.setData({
                choosefileStorageCount: (choosefileStorageCount / 1024 / 1024),
                userId: event.data[0]._id
              })
              choosefileStorageCount = (choosefileStorageCount / 1024 / 1024) + event.data[0].currentStorageCount;
              if (choosefileStorageCount <= event.data[0].maxStorageCount) {
                wx.showToast({
                  title: '文件选择成功'
                })
                this.setData({
                  chooseMessageFiles: res.tempFiles,
                })
              } else {
                wx.showToast({
                  icon: 'none',
                  title: '存储量不足',
                })
                this.setData({
                  chooseMessageFiles: [],
                  fileIDs: []
                })
              }
            })
          } else {
            console.log("文件格式不正确")
            this.setData({
              canUpload: true,
              chooseMessageFiles: [],
              fileIDs: []
            })
          }

          // console.log(this.data.chooseMessageFiles)
          // wx.cloud.callFunction({
          //   name: 'uploadFiles',
          //   data: {
          //     fileCount: this.data.chooseMessageFiles.length,
          //     chooseMessageFiles: this.data.chooseMessageFiles
          //   }
          // }).then(res => {
          //   console.log(res)
          // }).catch(err => {
          //   console.log(err)
          // })
          // for (var i = 0; i < this.data.chooseMessageFiles.length; i++) {
          //   // 将图片上传到云存储空间
          //   // console.log("开始将图片上传到云存储空间")
          //   //可以使用云函数来操作更严谨
          //   wx.cloud.uploadFile({
          //     cloudPath: "diary/" + new Date().getTime() + this.data.chooseMessageFiles[i].name,
          //     filePath: this.data.chooseMessageFiles[i].path
          //   }).then(res => {
          //     var temp = [];
          //     temp.push(res.fileID);
          //     this.setData({
          //       fileIDs: this.data.fileIDs.concat(temp)
          //     })
          //     wx.hideLoading();
          //     this.setData({
          //       animition: true
          //     })
          //     setTimeout(res => {
          //       this.setData({
          //         uploadFileBtn: false,
          //       })
          //     }, 1000)
          //   }).catch(err => {
          //     wx.hideLoading();
          //     wx.showToast({
          //       icon: 'none',
          //       title: '确保文件已下载',
          //     })
          //   })
          // }
        }
      })
    } else {
      wx.showToast({
        icon: 'none',
        title: '请先上传文件',
      })
    }
  },
  // 上传到数据库
  toUploadFile: function() {
    // 判断是否选择了文件
    if (this.data.chooseMessageFiles.length == 0) {
      wx.showToast({
        icon: 'none',
        title: '请先选择文件',
      })
    } else {

      wx.showLoading({
        title: '上传中',
      })
      // 上传文件到云存储
      var promiseAll = [];
      for (var i = 0; i < this.data.chooseMessageFiles.length; i++) {
        let promise = new Promise((resolve, reject) => {
          wx.cloud.uploadFile({
            cloudPath: "diary/" + new Date().getTime() + this.data.chooseMessageFiles[i].name,
            filePath: this.data.chooseMessageFiles[i].path,
            success: res => {
              resolve(res)
            }
          })
        });
        promiseAll.push(promise);
      }

      // 并发请求
      Promise.all(promiseAll).then(res => {
        this.setData({
          fileIDs: res,
        })
        // 上传数据库
        var promiseAllAata = [];
        for (var i = 0; i < this.data.fileIDs.length; i++) {
          let promise = new Promise((reslove, reject) => {
            var time = this.getNewDate();
            db.collection("diary").add({
              data: {
                fileName: this.data.chooseMessageFiles[i].name,
                time: time,
                date: new Date(),
                fileID: this.data.fileIDs[i].fileID,
                size: this.data.chooseMessageFiles[i].size
              }
            }).then(res => {
              reslove(res)
            })
          });
          promiseAllAata.push(promise);
        }
        // 更新数据库存储量的信息
        let addSavefileCount = new Promise((resolve, reject) => {
          const _ = db.command;
          db.collection("fileCountInfo").doc(this.data.userId).update({
            data: {
              currentStorageCount: _.inc(this.data.choosefileStorageCount)
            },
            success: res => {
              resolve(res)
            }
          })
        })
        promiseAllAata.push(addSavefileCount);
        // 并发请求
        Promise.all(promiseAllAata).then(res => {
          wx.hideLoading();

          wx.showToast({
            title: '上传成功',
          })

          this.setData({
            chooseMessageFiles: [],
            fileIDs: []
          })
        }).catch(err => {
          wx.hideLoading();
          wx.showToast({
            icon: 'none',
            title: '请重新上传',
          })
        })
        // 上传数据库完毕
      }).catch(err => {
        wx.hideLoading();
        this.setData({})
      })
      // for (var i in this.data.chooseMessageFiles) {
      //   //获取发布文件的时间
      //   var time = this.getNewDate();
      //   db.collection("diary").add({
      //     data: {
      //       fileName: this.data.chooseMessageFiles[i].name,
      //       time: time,
      //       date: new Date(),
      //       fileID: this.data.fileIDs[i].fileID
      //     }
      //   }).then(res => {
      //     this.setData({
      //       chooseMessageFiles: [],
      //       fileIDs: [],
      //       uploadFileBtn: true,
      //     })
      //     wx.hideLoading();
      //     wx.showToast({
      //       title: '上传成功',
      //     })
      //   }).catch(err => {
      //     wx.hideLoading();
      //     wx.showToast({
      //       icon: 'none',
      //       title: '失败请下拉刷新',
      //     })
      //   })
      // }
    }
  },
  //获取特定格式的日期时间  "yyyy-MM-dd HH:MMM:SS"
  getNewDate: function() {
    var date = new Date();
    console.log(date);
    var transverse = "-";
    var Verticalpoint = ":";
    var month = date.getMonth() + 1; //获取月份
    var strDate = date.getDate(); //获取具体的日期           
    var strHour = date.getHours(); //获取...钟点
    var strMinute = date.getMinutes(); //获取分钟数
    var strSeconde = date.getSeconds(); //获取秒钟数
    //判断获取月份 、 具体的日期 、...钟点、分钟数、秒钟数 是否在1~9
    //如果是则在前面加“0”
    if (month >= 1 && month <= 9) {
      month = "0" + month;
    }
    console.log(month);
    if (strDate >= 1 && strDate <= 9) {
      strDate = "0" + strDate;
    }
    if (strHour >= 1 && strHour <= 9) {
      strHour = "0" + strHour
    }
    console.log(strHour);
    if (strMinute >= 1 && strMinute <= 9) {
      strMinute = "0" + strMinute;
    }

    if (strSeconde >= 1 && strSeconde <= 9) {
      strSeconde = "0" + strSeconde;
    }
    //时间日期字符串拼接
    var NewDate = date.getFullYear() + transverse + month + transverse + strDate + " " +
      strHour + Verticalpoint + strMinute + Verticalpoint + strSeconde;
    //返回拼接字符串
    return NewDate;
  },
  // 跳转到文件列表
  toViewAll: function() {
    wx.navigateTo({
      url: '../saveFileInfo/saveFileInfo?fileCountInfoUseId=' + this.data.fileCountInfoUseId,
      success: res => {
        console.log(res)
      }
    })
  },
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
      key: 'time2',
      success: res => {
        // console.log(res.data)
        this.setData({
          instructions: false
        })
      },
      fail: err => {
        wx.setStorage({
          key: "time2",
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
            }, 15000)
          }
        })

      }
    })

  },
  // 为每个用户添加一条记录文件总存储和已经存储的数量
  addSaveFileCount: function() {
    let dbtable = db.collection("fileCountInfo")
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
        })
      } else {
        this.setData({
          fileCountInfoUseId: res.data[0]._id
        })
      }
    }).catch(err => {
      console.log(err)
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // console.log("onLoad")
    this.expiringCteat();
    this.addSaveFileCount();
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
    // console.log("onShow")
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    // console.log("onHide")
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    // console.log("onUnload")
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    wx.hideLoading();
    this.setData({
      chooseMessageFiles: [],
      fileIDs: [],
    })
    setTimeout(res => {
      wx.stopPullDownRefresh();
    }, 1000)
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