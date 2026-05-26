// ===== 二维码存储 =====
// 支持 GitHub API 和 localStorage 两种方式

var CloudStorage = (function() {
  var KEY = 'yn_gaokao_qr';
  var CITY_KEY = 'yn_gaokao_city_qr';

  // ===== 各地州二维码存储 =====
  // 数据结构: { main: '', cities: { kunming: '', qujing: '', ... } }

  // 读取各地州二维码数据
  async function readCityQRData() {
    // GitHub 模式：从仓库读取 JSON 文件
    if (OWNER_CONFIG.storageMode === 'github') {
      var data = await readCityQRFromGitHub();
      if (data) return data;
    }
    // 本地模式：从 localStorage 读取
    try {
      var raw = localStorage.getItem(CITY_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return null;
  }

  // 写入各地州二维码数据
  async function writeCityQRData(data) {
    if (!data) return { success: false, error: '无数据' };
    if (OWNER_CONFIG.storageMode === 'github') {
      return writeCityQRToGitHub(data);
    }
    // 本地模式：存 localStorage
    localStorage.setItem(CITY_KEY, JSON.stringify(data));
    return { success: true };
  }

  // 从 GitHub 读取各地州二维码 JSON
  async function readCityQRFromGitHub() {
    var cfg = OWNER_CONFIG.github;
    if (!cfg.owner || !cfg.repo) return null;
    var url = 'https://raw.githubusercontent.com/' + cfg.owner + '/' + cfg.repo + '/' + cfg.branch + '/city-qr-data.json';
    try {
      var resp = await fetch(url + '?_t=' + Date.now());
      if (!resp.ok) return null;
      return await resp.json();
    } catch(e) {
      return null;
    }
  }

  // 上传各地州二维码 JSON 到 GitHub
  async function writeCityQRToGitHub(data) {
    var cfg = OWNER_CONFIG.github;
    if (!cfg.token) return { success: false, error: 'GitHub token 未配置' };

    var url = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/contents/city-qr-data.json';
    var sha = '';
    try {
      var checkResp = await fetch(url, {
        headers: { 'Authorization': 'token ' + cfg.token, 'Accept': 'application/vnd.github.v3+json' }
      });
      if (checkResp.ok) {
        var existing = await checkResp.json();
        sha = existing.sha;
      }
    } catch(e) {}

    var body = {
      message: '更新各地州二维码配置',
      content: btoa(unescape(encodeURIComponent(JSON.stringify(data)))),
      branch: cfg.branch
    };
    if (sha) body.sha = sha;

    try {
      var resp = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': 'token ' + cfg.token,
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

  // 获取单个城市的二维码
  async function getCityQR(cityId) {
    var data = await readCityQRData();
    if (data) {
      if (data.cities && data.cities[cityId]) return data.cities[cityId];
      if (data.main) return data.main;
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
    if (!cfg.token || !cfg.owner || !cfg.repo) {
      return { success: false, error: '请先在 owner-config.js 中配置 GitHub token' };
    }

    var url = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + cfg.filename;
    var exists = false, sha = '';

    // 先检查文件是否已存在
    try {
      var checkResp = await fetch(url, {
        headers: { 'Authorization': 'token ' + cfg.token, 'Accept': 'application/vnd.github.v3+json' }
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
          'Authorization': 'token ' + cfg.token,
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
      if (!cfg.token) return { ok: false, msg: '请先配置 GitHub token' };
      var url = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo;
      try {
        var resp = await fetch(url, {
          headers: { 'Authorization': 'token ' + cfg.token, 'Accept': 'application/vnd.github.v3+json' }
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
    readCityQRData: readCityQRData,
    writeCityQRData: writeCityQRData,
    getBackend: getBackend,
    getQRPublicUrl: getQRPublicUrl,
    saveBackendConfig: saveBackendConfig,
    loadBackendConfig: loadBackendConfig,
    testConnection: testConnection
  };
})();
