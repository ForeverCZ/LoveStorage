##一、写项目的初衷
学习云开发也有段时日了，当时就想试试手，不知道做什么。有一次同学问我有没有前几天老师发的某个ppt，我说你怎么不去翻聊天记录呢？他说太麻烦，当时就想可以做个小型的文件存储小程序该多好，于是就下手了。往往需求决定产品这就没错了。哈哈哈下面继续介绍下小程序。

##二、项目介绍
爱存储是一个可以将手机相册里的照片（或拍照的照片）和微信聊天会话里的文件（比如Doc、docx、xls、xlsx、ppt等文件）上传到云开发的存储里，并可以进行分享的小程序。

##三、项目简介
爱存储小程序使用的是小程序的云开发，云开发自带免费的云存储、云数据库，开始时不需要涉及服务器的搭建及运维，也不需要进行域名注册与备案，只需要通过一些简单的API就能实现一个完整项目的业务逻辑，免费而且无需后端，开发成本非常低，因此这个小程序从创建到发布都是免费的，非常适合新手。

![](https://7374-start-p6hgq-1300055494.tcb.qcloud.la/diary/acc.jpg?sign=87c1c8fd2915b13d85681296a05fef7b&t=1575285044)

![](https://7374-start-p6hgq-1300055494.tcb.qcloud.la/diary/asw1.png?sign=8eb01e7ce54b504accc8c3b2a619528f&t=1575287603)

![](https://7374-start-p6hgq-1300055494.tcb.qcloud.la/diary/asw2.png?sign=3cd07d11986cbb1addf5a56c330a585a&t=1575287731)

![](https://7374-start-p6hgq-1300055494.tcb.qcloud.la/diary/asw3.png?sign=628ce7faa779493c7d8c20fe085acfef&t=1575287835)

![](https://7374-start-p6hgq-1300055494.tcb.qcloud.la/diary/asw4.png?sign=22287c0393631d5cb4ba5181ed8229b3&t=1575288061)


##四、项目准备
在云数据库中创建diary、fileCountInfo集合，权限都是仅创建者可读写，在云存储中创建一个diary文件夹。

##五、功能介绍与项目的目标
下面将会围绕以下几个比较核心的功能进行分析。

###首页弹窗倒计时
该弹窗在用户使用小程序期间只会弹出一次。弹窗弹出时可以自动取消弹窗在这里是通过倒计时来关闭的当然也可以点击按钮取消，具体效果请亲自使用下小程序，下方是判断及添加缓存部分代码。

 	//判断是否添加了缓存  
	wx.getStorage({
      key: 'time2',
      success: res => {
        this.setData({
          instructions: false
        })
      },
      fail: err => {
	//添加缓存
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
			//15秒后取消弹窗
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
###限制每个用户只有100M存储空间
在云开发数据库中创建一个fileCountInfo集合（权限设置为仅创建者可读写），为每个用户添加一条记录字段有currentStorage(当前存储容量)和maxStorageCount(最大存储容量)，这样就为以后的容量存储限制做了铺垫。下方是部分实现代码,逻辑还需要自己揣摩。

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
###限制支持文件类型doc、docx、xls、xlsx、ppt、pptx、pdf
在js里添加了一个数组变量fileFormat用来保存仅支持的文件类型，通过js代码判断用户选取的文件是否在这个数组里从而能否上传，当然判断用户是否能上传还有存储容量的限制，前面已经说了最大 100M，每次用户上传文件currentStorage字段都会增加用户上传的文件大小，具体实现看源代码上面都有注释。下方是部分代码用来实现是否是支持的文件类型。

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

###文件的上传及删除
文件上传包括上传之前的判断是否符合要求，前面有提到过。还会涉及到一些坑一会再说。
###其他小功能
文件预览、文件的分享，文件的排序及下方存储容量的显示逻辑比较简单这部分比较简单大家看下源代码就可以了。

##六、遇到的困难
遇到的困难也就是在文件上传和删除那一块，就是我刚才说一会要解决的问题。在上传文件会涉及到单个文件或多个文件同时上传，是每个文件上传成功都要提示下成功上传提示呢？还是所选文件全部上传完才提示呢？如果是前者肯定会对用户不友好所以我选择了后者，但怎么才能让它们全部上传完才弹出上传成功提示呢，我试了很多方法比如加个flag标志等等，但都不能很好地解决问题。我静下心来再仔细想想，想到了以前使用的promise正好适合这个场景，所以使用了promise解决了该问题，这里遇到的问题和删除文件类似就不一一描述，部分代码如下。

	 //创建一个promise数组
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
		//将所有的promise通过循环一个个放在数组里
        promiseAll.push(promise);
      }
        //并发执行
        Promise.all(promiseAllAata).then(res => {
          wx.hideLoading();

          wx.showToast({
            title: '上传成功',
          })

          this.setData({
            chooseMessageFiles: [],
            fileIDs: []
          })
        })

##七、总结
小程序较其他编程语言更容易上手，尤其使用了云开发自带免费的云存储、云数据库，让此项目更快的完成。相信通过学习此项目你已经可以开发自己的文件存储小程序了。