# 云南高考志愿填报 - 各地州家长群落地页

## 项目说明
覆盖云南16个地州的高考志愿填报获客落地页。家长选择地州 → 查看本地化内容 → 扫码加入家长群。

## 技术栈
- 纯静态 HTML + Tailwind CSS (CDN)
- FontAwesome 图标
- 零依赖，可直接部署

## 本地预览
直接用浏览器打开 `index.html` 即可。

## 部署到 Vercel

### 方式一：一键部署
1. 注册 [Vercel](https://vercel.com)（用 GitHub 登录）
2. 安装 Vercel CLI：`npm install -g vercel`
3. 在项目目录运行：`vercel`

### 方式二：GitHub + Vercel
1. 在 GitHub 创建新仓库
2. 推送代码：
   ```bash
   git init
   git add .
   git commit -m "init"
   git remote add origin https://github.com/你的用户名/yn-gaokao.git
   git push -u origin main
   ```
3. 在 Vercel 控制台导入该仓库

### 访问
部署后访问 `https://yn-gaokao.vercel.app`
URL 参数：`?city=kunming` 可直接跳转到对应地州页面

## 各地州 ID
| 地州 | ID |
|------|-----|
| 昆明市 | kunming |
| 曲靖市 | qujing |
| 大理州 | dali |
| 玉溪市 | yuxi |
| 红河州 | honghe |
| 楚雄州 | chuxiong |
| 昭通市 | zhaotong |
| 文山州 | wenshan |
| 保山市 | baoshan |
| 丽江市 | lijiang |
| 普洱市 | puer |
| 临沧市 | linxiang |
| 德宏州 | dehong |
| 怒江州 | nujiang |
| 迪庆州 | diqing |
| 西双版纳 | ynOthers |

## 扩展计划
- [ ] 每个地州独立 HTML 文件（SEO 更优）
- [ ] 表单提交到数据库
- [ ] 百度/头条信息流落地页适配
- [ ] 埋点统计
