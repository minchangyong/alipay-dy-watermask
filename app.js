App({
  onLaunch(options) {
    // 小程序初始化
    console.log('抖音去水印工具小程序初始化');
    
    // 检查更新
    this.checkUpdate();
    
    // 初始化数据
    this.initData();
  },
  
  onShow(options) {
    // 小程序显示
  },
  
  onHide() {
    // 小程序隐藏
  },
  
  onError(msg) {
    console.error('小程序出错:', msg);
  },
  
  // 检查更新
  checkUpdate() {
    if (my.canIUse('getUpdateManager')) {
      const updateManager = my.getUpdateManager();
      
      updateManager.onCheckForUpdate(function(res) {
        // 请求完新版本信息的回调
        console.log('检查到更新:', res.hasUpdate);
      });
      
      updateManager.onUpdateReady(function() {
        my.confirm({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: function(res) {
            if (res.confirm) {
              // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
              updateManager.applyUpdate();
            }
          }
        });
      });
      
      updateManager.onUpdateFailed(function() {
        // 新版本下载失败
        my.showToast({
          type: 'fail',
          content: '新版本下载失败'
        });
      });
    }
  },
  
  // 初始化数据
  initData() {
    // 从本地存储获取历史记录
    try {
      const history = my.getStorageSync({ key: 'videoHistory' });
      if (!history.data) {
        my.setStorageSync({
          key: 'videoHistory',
          data: []
        });
      }
    } catch (error) {
      console.error('初始化数据失败:', error);
      my.setStorageSync({
        key: 'videoHistory',
        data: []
      });
    }
  },
  
  // 全局数据
  globalData: {
    userInfo: null,
    apiBaseUrl: 'https://api.example.com', // 替换为实际API地址
    appVersion: '1.0.0'
  }
});
