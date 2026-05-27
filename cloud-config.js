// ===== 二维码存储 =====
// 支持 GitHub API 和 localStorage 两种方式

var CloudStorage = (function() {
  var KEY = 'yn_gaokao_qr';
  var CITY_KEY = 'yn_gaokao_city_qr';

  // ===== 各地州二维码存储 =====
  // 数据结构: { main: '', cities: { kunming: '', qujing: '', ... } }

  // 同域动态加载 city-qr-data.js（微信兼容，不阻塞页面渲染）
  var _qrDataPromise = null;

  function _loadQRScript() {
    if (_qrDataPromise) return _qrDataPromise;
    _qrDataPromise = new Promise(function(resolve) {
      var s = document.createElement('script');
      s.src = 'city-qr-data.js?_t=' + Date.now();
      s.onload = function() { resolve(); };
      s.onerror = function() { resolve(); }; // 文件不存在也继续
      document.head.appendChild(s);
    });
    return _qrDataPromise;
  }

  // 读取各地州二维码数据
  async function readCityQRData() {
    // 0. 同域动态加载 city-qr-data.js（微信可靠，不阻塞页面）
    await _loadQRScript();
    if (window.__QR_DATA__) {
      var data = window.__QR_DATA__;
      // 同步到本地缓存以便下次快速读取
      try { localStorage.setItem(CITY_KEY, JSON.stringify(data)); } catch(e) {}
      window.__QR_DATA__ = null; // 用完释放
      return data;
    }
    // 1. 读本地缓存（保证数据立刻出现，不依赖网络）
    try {
      var raw = localStorage.getItem(CITY_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    // 2. 再尝试从 GitHub 拉取最新数据
    if (OWNER_CONFIG.storageMode === 'github') {
      var data = await readCityQRFromGitHub();
      if (data) {
        // 同步到本地缓存
        localStorage.setItem(CITY_KEY, JSON.stringify(data));
        return data;
      }
    }
    return null;
  }

  // 写入各地州二维码数据
  async function writeCityQRData(data) {
    if (!data) return { success: false, error: '无数据' };
    // 1. 先写本地（立即生效，不受网络影响）
    localStorage.setItem(CITY_KEY, JSON.stringify(data));
    // 2. 再同步 GitHub（后台自动，失败不影响本地使用）
    if (OWNER_CONFIG.storageMode === 'github') {
      var result = await writeCityQRToGitHub(data);
      if (!result.success) {
        console.warn('GitHub 同步失败:', result.error);
        // 本地已经保存成功，给用户提示但不算完全失败
        return { success: true, syncError: result.error };
      }
    }
    return { success: true };
  }

  // 带超时的 fetch 封装（微信中请求可能长时间挂起）
  async function fetchWithTimeout(url, ms) {
    ms = ms || 5000;
    var controller = new AbortController();
    var id = setTimeout(function() { controller.abort(); }, ms);
    try {
      var resp = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      return resp;
    } catch(e) {
      clearTimeout(id);
      throw e;
    }
  }

  // 从 GitHub 读取各地州二维码 JSON
  async function readCityQRFromGitHub() {
    var cfg = OWNER_CONFIG.github;
    if (!cfg.owner || !cfg.repo) return null;
    var ts = '_t=' + Date.now();
    // 1. GitHub Pages（和落地页同域名，微信中最可能成功）
    try {
      var pagesUrl = 'https://' + cfg.owner + '.github.io/' + cfg.repo + '/city-qr-data.json';
      var resp = await fetchWithTimeout(pagesUrl + '?' + ts);
      if (resp.ok) return await resp.json();
    } catch(e) { console.warn('[QR] GitHub Pages fetch failed:', e); }
    // 2. raw.githubusercontent.com（微信中常被拦截）
    try {
      var rawUrl = 'https://raw.githubusercontent.com/' + cfg.owner + '/' + cfg.repo + '/' + cfg.branch + '/city-qr-data.json';
      var resp = await fetchWithTimeout(rawUrl + '?' + ts);
      if (resp.ok) return await resp.json();
    } catch(e) { console.warn('[QR] raw.githubusercontent fetch failed:', e); }
    // 3. jsDelivr CDN（国内可访问，微信兼容性好，但有CDN缓存延迟）
    try {
      var cdnUrl = 'https://cdn.jsdelivr.net/gh/' + cfg.owner + '/' + cfg.repo + '@' + cfg.branch + '/city-qr-data.json';
      var resp = await fetchWithTimeout(cdnUrl + '?' + ts + Math.random());
      if (resp.ok) return await resp.json();
    } catch(e) { console.warn('[QR] jsDelivr CDN fetch failed:', e); }
    return null;
  }

  // 上传文件到 GitHub（通用函数）
  async function writeFileToGitHub(filename, content, message) {
    var cfg = OWNER_CONFIG.github;
    var token = cfg.token || localStorage.getItem('yn_gaokao_github_token') || '';
    if (!token) return { success: false, error: 'GitHub token 未配置' };

    var url = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + filename;
    var sha = '';
    try {
      var checkResp = await fetch(url, {
        headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (checkResp.ok) {
        var existing = await checkResp.json();
        sha = existing.sha;
      }
    } catch(e) {}

    var body = {
      message: message || '更新 ' + filename,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: cfg.branch
    };
    if (sha) body.sha = sha;

    try {
      var resp = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': 'token ' + token,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (resp.ok) return { success: true };
      var err = await resp.json();
      return { success: false, error: err.message || '上传失败' };
    } catch(e) {
      return { success: false, error: e.message || '网络错误' };
    }
  }

  // 上传各地州二维码数据（同时生成 .json 和 .js，确保微信可读）
  async function writeCityQRToGitHub(data) {
    var jsonOk = await writeFileToGitHub('city-qr-data.json', JSON.stringify(data), '更新各地州二维码配置');
    // 同时生成 .js 文件（微信中通过 script 标签同域加载，不需要 fetch）
    var jsContent = '// ===== 高考志愿填报 · 各地州/区县二维码数据 =====\n// 由管理后台上传时自动生成，勿手动修改\nwindow.__QR_DATA__ = ' + JSON.stringify(data) + ';\n';
    var jsOk = await writeFileToGitHub('city-qr-data.js', jsContent, '更新各地州二维码 JS 数据');
    return jsonOk.success ? { success: true, syncError: !jsOk.success ? jsOk.error : undefined } : jsonOk;
  }

  // 获取区县专属二维码（从counties子对象读取，没有则返回null）
  async function getCountyQR(cityId, countyName) {
    var data = await readCityQRData();
    if (data && data.counties) {
      var key = cityId + '_' + countyName;
      if (data.counties[key]) return data.counties[key];
    }
    return null;
  }

  // 保存区县专属二维码
  async function writeCountyQR(cityId, countyName, dataUrl) {
    var data = await readCityQRData() || { main1: '', main2: '', cities: {}, counties: {} };
    if (!data.counties) data.counties = {};
    var key = cityId + '_' + countyName;
    data.counties[key] = dataUrl;
    return writeCityQRData(data);
  }

  // 移除区县专属二维码
  async function removeCountyQR(cityId, countyName) {
    var data = await readCityQRData();
    if (!data || !data.counties) return { success: true };
    var key = cityId + '_' + countyName;
    delete data.counties[key];
    return writeCityQRData(data);
  }

  // 获取单个城市的二维码
  async function getCityQR(cityId) {
    var data = await readCityQRData();
    if (data) {
      if (data.cities && data.cities[cityId]) return data.cities[cityId];
      if (data.main1 || data.main) return data.main1 || data.main;
    }
    // 最后兜底：旧版存储（单独上传的主二维码）
    var mainQR = await read();
    return mainQR || '';
  }

  // ---- 从 GitHub 读取二维码 URL ----
  async function getQRPublicUrl() {
    var cfg = OWNER_CONFIG.github;
    if (OWNER_CONFIG.storageMode !== 'github' || !cfg.owner || !cfg.repo) return '';
    return 'https://raw.githubusercontent.com/' + cfg.owner + '/' + cfg.repo + '/' + cfg.branch + '/' + cfg.filename;
  }

  // ---- 从 GitHub 获取已存储的二维码（base64） ----
  async function readFromGitHub() {
    var cfg = OWNER_CONFIG.github;
    if (!cfg.token || !cfg.owner || !cfg.repo) return '';

    var url = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + cfg.filename;
    try {
      var resp = await fetch(url, {
        headers: { 'Authorization': 'token ' + cfg.token, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (!resp.ok) return '';
      var data = await resp.json();
      if (data.content) {
        // GitHub 返回的是 base64（含换行），需要合并
        return 'data:image/jpeg;base64,' + data.content.replace(/\n/g, '');
      }
      return '';
    } catch (e) {
      return '';
    }
  }

  // ---- 上传二维码到 GitHub ----
  async function writeToGitHub(base64Data) {
    var cfg = OWNER_CONFIG.github;
    var token = cfg.token || localStorage.getItem('yn_gaokao_github_token') || '';
    if (!token) {
      return { success: false, error: 'GitHub token 未配置' };
    }

    var url = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + cfg.filename;
    var exists = false, sha = '';

    // 先检查文件是否已存在
    try {
      var checkResp = await fetch(url, {
        headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (checkResp.ok) {
        var existing = await checkResp.json();
        sha = existing.sha;
        exists = true;
      }
    } catch (e) {}

    // 准备上传
    var body = {
      message: exists ? '更新客户二维码' : '上传客户二维码',
      content: base64Data,
      branch: cfg.branch
    };
    if (sha) body.sha = sha;

    try {
      var resp = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': 'token ' + token,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (resp.ok) {
        return { success: true };
      } else {
        var err = await resp.json();
        return { success: false, error: err.message || '上传失败' };
      }
    } catch (e) {
      return { success: false, error: e.message || '网络错误' };
    }
  }

  // ---- 公开读取接口 ----
  async function read() {
    if (OWNER_CONFIG.storageMode === 'github') {
      return readFromGitHub();
    }
    // localStorage 模式
    return localStorage.getItem(KEY) || '';
  }

  // ---- 公开写入接口（用于 owner.html） ----
  async function write(qrBase64) {
    if (OWNER_CONFIG.storageMode === 'github') {
      // 去掉 data:image/...;base64, 前缀
      var pure = qrBase64.replace(/^data:image\/\w+;base64,/, '');
      return writeToGitHub(pure);
    }
    // localStorage 模式
    localStorage.setItem(KEY, qrBase64);
    return { success: true, qrUrl: qrBase64 };
  }

  function getBackend() { return OWNER_CONFIG.storageMode; }

  function loadBackendConfig() {
    return { backend: OWNER_CONFIG.storageMode, github: OWNER_CONFIG.github };
  }

  function saveBackendConfig() {}

  async function testConnection() {
    if (OWNER_CONFIG.storageMode === 'github') {
      var cfg = OWNER_CONFIG.github;
      var token = cfg.token || localStorage.getItem('yn_gaokao_github_token') || '';
      if (!token) return { ok: false, msg: '请先配置 GitHub token' };
      var url = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo;
      try {
        var resp = await fetch(url, {
          headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json' }
        });
        if (resp.ok) return { ok: true, msg: 'GitHub 连接成功' };
        var err = await resp.json();
        return { ok: false, msg: err.message || '连接失败' };
      } catch (e) {
        return { ok: false, msg: e.message };
      }
    }
    return { ok: true, msg: '本地存储' };
  }

  return {
    read: read,
    write: write,
    getCityQR: getCityQR,
    getCountyQR: getCountyQR,
    writeCountyQR: writeCountyQR,
    removeCountyQR: removeCountyQR,
    readCityQRData: readCityQRData,
    writeCityQRData: writeCityQRData,
    getBackend: getBackend,
    getQRPublicUrl: getQRPublicUrl,
    saveBackendConfig: saveBackendConfig,
    loadBackendConfig: loadBackendConfig,
    testConnection: testConnection
  };
})();
