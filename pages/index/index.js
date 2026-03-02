Page({
  data: {
    // 步骤状态
    step: 1,

    // 输入框状态
    videoUrl: '',
    isInputFocus: false,

    // 加载状态
    isLoading: false,

    // 结果展示
    showResult: false,
    showSuccessMessage: false,

    // 视频信息
    videoInfo: {
      author: '',
      title: '',
      time: '',
      like: '',
      videoUrl: '',
      cover: ''
    }
  },

  onLoad() {
    // 页面加载
    console.log('抖音去水印页面加载');
  },

  onShow() {
    // 页面显示
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
    this.setData({
      isInputFocus: false
    });
  },

  // 粘贴按钮点击事件
  onClear() {
    this.setData({
      step: 1,
      videoUrl: '',
      showResult: false
    });
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
  onParseTap() {
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
      showResult: false,
      showSuccessMessage: false,
      step: 2
    });

    // 平台映射配置
    const platformMap = {
      xiaohongshu: {
        url: 'https://api.317ak.cn/api/spjx/xhs',
        useRawInput: true
      },
      xhslink: {
        url: 'https://api.317ak.cn/api/spjx/xhs',
        useRawInput: true
      },
      kuaishou: {
        url: 'https://api.317ak.cn/api/spjx/ksjx'
      },
      b23: {
        url: 'https://api.317ak.cn/api/spjx/bljx' // 修复双斜杠问题
      },
      weibo: {
        url: 'https://api.317ak.cn/api/spjx/wbjx'
      },
      default: {
        url: 'https://api.317ak.cn/api/spjx/dyjx'
      }
    };

    // 匹配平台
    let platformKey = 'default';
    for (const key in platformMap) {
      if (input.includes(key)) {
        platformKey = key;
        break;
      }
    }

    const config = platformMap[platformKey];
    const postData = {
      url: config.useRawInput ? input : url,
      ckey: 'F5DHS00LB4Q0W3FA1SI4'
    };

    // 调用实际API
    my.request({
      url: config.url,
      method: 'GET',
      data: postData,
      success: (res) => {
        if (res.data && res.data.data) {
          const data = res.data.data;

          // 更新UI
          this.setData({
            isLoading: false,
            showResult: true,
            videoInfo: {
              author: data.author || '未知用户',
              title: data.title || '',
              like: data.like_count || '',
              time: data.time || data.create_time || '',
              videoUrl: data.video_url || '',
              coverUrl: data.cover || ''
            },
            step: 3
          });

          my.showToast({
            type: 'success',
            content: '解析成功'
          });
        } else {
          this.setData({
            isLoading: false,
            step: 1
          });

          my.showToast({
            type: 'fail',
            content: '解析失败'
          });
        }
      },
      fail: (err) => {
        console.error('API请求失败:', err);
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
        this.setData({
          showSuccessMessage: true
        });

        my.showToast({
          type: 'success',
          content: '链接已复制'
        });

        // 3秒后隐藏成功消息
        setTimeout(() => {
          this.setData({
            showSuccessMessage: false
          });
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
  }
});