const app = getApp();

Page({
  data: {
    // 步骤状态
    step: 1,
    
    // 输入框状态
    videoUrl: '',
    isInputFocus: false,
    
    // 加载状态
    isLoading: false,
    loadingProgress: 0,
    loadingTimer: null,
    
    // 结果展示
    showResult: false,
    showSuccessMessage: false,
    resultAnimation: {},
    toastAnimation: {},
    
    // 视频信息
    videoInfo: {
      name: '',
      title: '',
      time: '',
      like: '',
      videoUrl: '',
      coverUrl: ''
    }
  },

  onLoad() {
    console.log('去水印解析工具页面加载');
  },

  onShow() {
    // 页面显示
  },

  onHide() {
    // 页面隐藏时清理定时器
    if (this.data.loadingTimer) {
      clearInterval(this.data.loadingTimer);
    }
  },

  onUnload() {
    // 页面卸载时清理定时器
    if (this.data.loadingTimer) {
      clearInterval(this.data.loadingTimer);
    }
  },

  // 设置步骤
  setStep(e) {
    const step = parseInt(e.currentTarget.dataset.step);
    if (step >= 1 && step <= 3) {
      this.setData({ step });
    }
  },

  // 输入框输入事件
  onUrlInput(e) {
    this.setData({
      videoUrl: e.detail.value
    });
  },

  // 输入框聚焦事件
  onInputFocus() {
    this.setData({
      isInputFocus: true
    });
  },

  // 输入框失焦事件
  onInputBlur() {
    setTimeout(() => {
      this.setData({
        isInputFocus: false
      });
    }, 200);
  },

  // 清空输入
  onClear() {
    this.setData({
      videoUrl: '',
      showResult: false,
      step: 1
    });
  },

  // 粘贴功能
  onPaste() {
    my.getClipboard({
      success: (res) => {
        if (res.text) {
          this.setData({
            videoUrl: res.text
          })
          my.hideToast()
        } else {
          my.showToast({
            type: 'fail',
            content: '剪贴板为空'
          });
        }
      },
      fail: () => {
        my.showToast({
          type: 'fail',
          content: '粘贴失败，请手动输入'
        });
      }
    });
  },

  // 模拟加载进度
  simulateLoadingProgress() {
    let progress = 0;
    
    this.data.loadingTimer = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 2;
      if (progress > 100) progress = 100;
      
      this.setData({
        loadingProgress: progress
      });
      
      if (progress >= 100) {
        clearInterval(this.data.loadingTimer);
      }
    }, 300);
  },

  /**
   * 优化后的链接提取方法
   * @param {string} str - 输入字符串
   * @returns {string|null} 提取到的第一个 HTTPS 链接
   */
  extractLink(str) {
    if (!str || typeof str !== 'string') return null;
    const match = str.match(/https?:\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/[-\w._~!$&'()*+,;=:@%]*)*/);
    return match ? match[0] : null;
  },

  // 解析按钮点击事件
  onParseTap(e) {
    const { dataset: { index = 0 } = {}} = e.currentTarget
    const input = this.data.videoUrl;
    const url = this.extractLink(input);

    if (!url) {
      my.showToast({
        type: 'fail',
        content: '请输入有效视频链接'
      });
      return;
    }

    // 显示加载状态
    this.setData({
      isLoading: true,
      loadingProgress: 0,
      showResult: false,
      showSuccessMessage: false,
      step: 2
    });

    // 开始模拟加载进度
    this.simulateLoadingProgress();
    const { apiBaseUrl, parseApiPath, apiKey } = app.globalData;
    const postData = {
      key: apiKey,
      url
    };

    // 调用实际API
    my.request({
      url: `${apiBaseUrl}${parseApiPath}`,
      method: 'GET',
      data: postData,
      success: (res) => {
        // 清除加载定时器
        if (this.data.loadingTimer) {
          clearInterval(this.data.loadingTimer);
        }
        
        this.setData({
          loadingProgress: 100
        });

        const response = res.data || {};
        const code = Number(response.code);

        if (response && (code === 0 || code === 200)) {
          const data = response.data || response.result || {};
          
          // 播放结果入场动画
          const animation = my.createAnimation({
            duration: 500,
            timingFunction: 'ease-out'
          });
          
          animation.opacity(1).translateY(0).step();

          // 安全访问字段，替代可选链
          const name =
            (data && data.auther) ||
            (data && data.author && data.author.name) ||
            (data && data.author) ||
            '未知用户';

          const title = (data && data.title) || '';

          const like =
            (data && data.like) ||
            (data && data.extra && data.extra.statistics && data.extra.statistics.digg_count) ||
            '';

          const timeValue =
            (data && data.time) ||
            (data && data.publish_time) ||
            (data && data.create_time) ||
            (data && data.extra && data.extra.create_time * 1000);

          const time = typeof timeValue === 'string'
            ? timeValue
            : timeValue
              ? new Date(timeValue < 10000000000 ? timeValue * 1000 : timeValue).toLocaleString()
              : '';

          const videoUrl = (data && data.url) || '';
          const coverUrl = (data && data.cover) || '';
          const quality = (data && data.quality) || '1080P';

          // 更新UI
          this.setData({
            isLoading: false,
            showResult: true,
            videoInfo: {
              ...data,
              name,
              title,
              like,
              time,
              videoUrl,
              coverUrl,
              quality
            },
            step: 3,
            resultAnimation: animation.export()
          }, () => {
            if (index === 0) {
              this.onDownloadTap()
            } else {
              my.pageScrollTo({
                selector: '.result-card',
                complete: res => {
                  console.log(res)
                }
              })
            }
          })
        } else {
          this.setData({
            isLoading: false,
            step: 1
          });

          my.showToast({
            type: 'fail',
            content: response.msg || response.message || '解析失败'
          });
        }
      },
      fail: (err) => {
        console.error('API请求失败:', err);
        
        // 清除加载定时器
        if (this.data.loadingTimer) {
          clearInterval(this.data.loadingTimer);
        }
        
        this.setData({
          isLoading: false,
          step: 1
        });

        my.showToast({
          type: 'fail',
          content: '网络请求失败'
        });
      }
    });
  },

  // 下载按钮点击事件
  onDownloadTap() {
    const videoUrl = this.data.videoInfo.videoUrl;

    if (!videoUrl) {
      my.showToast({
        type: 'fail',
        content: '视频链接无效'
      });
      return;
    }

    my.showLoading({
      content: '准备下载...'
    });

    my.saveVideoToPhotosAlbum({
      filePath: this.data.videoInfo.videoUrl,
      success: () => {
        my.showToast({
          type: 'success',
          content: '视频已保存到相册'
        });
      },
      fail: (err) => {
        console.error('保存失败:', err);
        my.showToast({
          type: 'fail',
          content: '保存失败: ' + (err.errMsg || JSON.stringify(err))
        });
      },
      complete: () => {
        my.hideLoading()
      }
    });
  },

  // 复制按钮点击事件
  onCopyTap() {
    const videoUrl = this.data.videoInfo.videoUrl;

    if (!videoUrl) {
      my.showToast({
        type: 'fail',
        content: '视频链接无效'
      });
      return;
    }

    my.setClipboard({
      text: videoUrl,
      success: () => {
        // 显示成功提示动画
        const animation = my.createAnimation({
          duration: 300,
          timingFunction: 'ease'
        });
        
        animation.opacity(1).translateY(0).step();
        
        this.setData({
          showSuccessMessage: true,
          toastAnimation: animation.export()
        });

        my.showToast({
          type: 'success',
          content: '链接已复制'
        });

        // 3秒后隐藏成功消息
        setTimeout(() => {
          const hideAnimation = my.createAnimation({
            duration: 300,
            timingFunction: 'ease'
          });
          
          hideAnimation.opacity(0).translateY(100).step();
          
          this.setData({
            toastAnimation: hideAnimation.export()
          });
          
          setTimeout(() => {
            this.setData({
              showSuccessMessage: false
            });
          }, 300);
        }, 3000);
      },
      fail: (err) => {
        my.showToast({
          type: 'fail',
          content: '复制失败'
        });
      }
    });
  },

  // 复制全部信息
  copyAllInfo() {
    const videoInfo = this.data.videoInfo;
    const infoText = `视频信息：
作者：${videoInfo.name}
标题：${videoInfo.title}
点赞数：${videoInfo.like}
发布时间：${videoInfo.time}
视频链接：${videoInfo.videoUrl}`;
    
    my.setClipboard({
      text: infoText,
      success: () => {
        my.showToast({
          type: 'success',
          content: '视频信息已复制'
        });
      },
      fail: () => {
        my.showToast({
          type: 'fail',
          content: '复制失败'
        });
      }
    });
  },

  // 联系客服
  contactService() {
    my.openOtherApp({
      url: 'mqq://im/chat?chat_type=wpa&version=1&src_type=web&uin=8662054'
    });
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '去水印工具 - 一键去除视频水印',
      path: '/pages/index/index',
      desc: '免费去除视频水印，高清无水印下载'
    };
  },
  goAbout() {
    my.showToast({
      content: '一个正在学习中的前端攻城狮',
      type: 'none'
    })
  },
  goPrivacy() {
    my.openPrivacyContract({
      appId: '2021006131624167',
      complete: res => {
        console.log(res)
      }
    })
  }
});
