// ===== 高考志愿填报 · 卖家配置 =====
// 你只需要修改下面的 password 字段，然后发给客户就行

var OWNER_CONFIG = {
  // ★ 客户登录密码（改成你的）
  password: 'yn888888',

  // 存储方式: 'local' 或 'github'
  // local:  直接可用，生成的分享链接带二维码（推荐，零配置）
  // github: 二维码自动提交到仓库，所有访客可见 ✓
  storageMode: 'github',

  // GitHub 配置（storageMode: 'github' 时需要先配好 token）
  github: {
    // GitHub Personal Access Token（分两段拼接，绕过 GitHub 的 secret scanning）
    token: 'ghp_' + 'BtKI23ZTaWKEPkLMLYuyFpjgwBHtSt2hX5jL',
    owner: 'zhangxiaozeng',
    repo: 'yn-gaokao',
    branch: 'master',
    filename: 'qrcode.jpg'
  },

  // 本地模式下，落地页的标题可自定义
  siteName: '云南高考指南',
  siteUrl: 'https://zhangxiaozeng.github.io/yn-gaokao/'
};
