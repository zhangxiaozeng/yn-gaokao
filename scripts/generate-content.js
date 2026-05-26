/**
 * 云南高考小红书内容生成器
 * 每天自动生成3-5条本地化内容
 *
 * 两种模式：
 *   template - 模板模式（无需API，用预置模板随机组合）
 *   ai       - AI模式（调用DeepSeek API，质量更高）
 *
 * 用法：
 *   node scripts/generate-content.js              # 默认template模式
 *   DEEPSEEK_KEY=sk-xxx node scripts/generate-content.js  # AI模式
 */

// ========== 云南16地州数据 ==========
const CITIES = [
  { id: 'kunming', name: '昆明市', short: '昆明', badge: '省会', students: '6.2万', schools: '48所' },
  { id: 'qujing', name: '曲靖市', short: '曲靖', badge: '教育强市', students: '5.8万', schools: '42所' },
  { id: 'dali', name: '大理州', short: '大理', badge: '旅游名城', students: '2.8万', schools: '30所' },
  { id: 'yuxi', name: '玉溪市', short: '玉溪', badge: '宜居之城', students: '2.2万', schools: '28所' },
  { id: 'honghe', name: '红河州', short: '红河', badge: '人口大州', students: '3.5万', schools: '35所' },
  { id: 'chuxiong', name: '楚雄州', short: '楚雄', badge: '滇中明珠', students: '1.8万', schools: '25所' },
  { id: 'zhaotong', name: '昭通市', short: '昭通', badge: '人口大市', students: '4.5万', schools: '38所' },
  { id: 'wenshan', name: '文山州', short: '文山', badge: '三七之乡', students: '2.6万', schools: '30所' },
  { id: 'baoshan', name: '保山市', short: '保山', badge: '滇西重镇', students: '1.6万', schools: '22所' },
  { id: 'lijiang', name: '丽江市', short: '丽江', badge: '旅游胜地', students: '1.2万', schools: '18所' },
  { id: 'puer', name: '普洱市', short: '普洱', badge: '茶城', students: '1.4万', schools: '20所' },
  { id: 'linxiang', name: '临沧市', short: '临沧', badge: '恒春之都', students: '1.3万', schools: '19所' },
  { id: 'dehong', name: '德宏州', short: '德宏', badge: '孔雀之乡', students: '1.0万', schools: '16所' },
  { id: 'nujiang', name: '怒江州', short: '怒江', badge: '峡谷秘境', students: '0.5万', schools: '10所' },
  { id: 'diqing', name: '迪庆州', short: '迪庆', badge: '高原明珠', students: '0.3万', schools: '8所' },
  { id: 'ynOthers', name: '西双版纳', short: '版纳', badge: '热带雨林', students: '0.7万', schools: '15所' },
];

// ========== 内容模板 ==========
const CONTENT_TYPES = [
  {
    id: 'score',
    titles: [
      '{city}考生{city2}分能上什么学校？2025云南高考志愿参考',
      '{city}家长必看：今年{city2}分在{city}能排多少名？',
      '{city}高考{city2}分能报哪些大学？数据来了',
      '别浪费分数！{city}考生{city2}分这样填志愿',
      '{city}高中老师都在转：{city2}分段的考生注意了',
    ],
    body: `在{city}，每年都有不少考生因为志愿没填好，白白浪费了几十分。

{city2}分这个区间，其实可选的学校不少，关键是梯度要拉开。

冲一冲（建议3-5个）：
选择往年录取线略高于{city2}分的学校，碰碰运气。重点关注省外院校，有时候会出现大小年。

稳一稳（建议5-8个）：
选择往年录取线在{city2}±5分之内的学校，这是你最可能被录取的区间。结合城市、专业综合考量。

保一保（建议3-5个）：
选择往年录取线低于{city2}分10-15分的学校，确保有学上。云南本地的地州院校是不错的保底选择。

{city}家长如果想了解更详细的院校推荐，可以加我进{city}家长交流群，群里会分享更多数据。`,
    hashtags: ['#云南高考', '#高考志愿', '#{city}高考', '#2025高考', '#志愿填报'],
  },
  {
    id: 'tips',
    titles: [
      '{city}家长注意！高考志愿填报最容易犯的3个错误',
      '{city}考生千万别踩这些坑！志愿填报避雷指南',
      '{city}家长：这3个志愿填报误区，害了多少云南考生',
      '{city}高考志愿填报，90%家长都会犯的错',
      '{city}家长群都在传：填志愿别做这3件事',
    ],
    body: `在{city}做高考咨询这些年，看到太多考生在志愿填报上踩坑，分享3个最常见的：

❌ 只看学校名气，不看专业实力
很多家长觉得"985/211就好"，结果孩子进了名校的冷门专业，毕业即失业。选学校一定要结合专业来看。

❌ 不填保底志愿
{city}每年都有考生因为全部填了"冲一冲"的学校，结果滑档到征集志愿甚至复读。保底志愿一定要填！

❌ 不研究招生章程
每个学校的录取规则不同，有的按分数优先，有的按专业级差。不看章程就填，很容易被退档。

如果你也是{city}家长，想了解更多填报技巧，可以加我进{city}家长交流群，群里会定期分享干货。`,
    hashtags: ['#云南高考', '#避雷指南', '#{city}家长', '#志愿填报', '#高考经验'],
  },
  {
    id: 'policy',
    titles: [
      '2025云南高考新变化！{city}家长一定要知道',
      '{city}高考政策有调整？2025年这些变化影响很大',
      '{city}家长注意！今年高考这些政策改了',
      '云南高考最新政策解读，{city}考生家长必看',
      '{city}家长快看：2025云南高考政策变化汇总',
    ],
    body: `2025年云南高考政策有几个重要变化，{city}的家长一定要了解：

📌 批次调整
今年部分批次继续优化合并，梯度志愿数量增加。这意味着填报策略需要相应调整，冲稳保的分配比例要变。

📌 专项计划扩大
面向{city}等地的专项计划名额持续增加。符合条件的考生一定要抓住这个机会，这是低分上好学校的重要途径。

📌 综合素质评价
部分高校在录取时开始参考综合素质评价档案，除了分数，高中阶段的竞赛、实践经历也越来越重要。

这些政策变化每个地州的影响不同，在{city}家长群里我们会针对性地解读。

想进{city}家长群的，评论区扣"1"或直接私信我。`,
    hashtags: ['#云南高考', '#高考政策', '#{city}高考', '#2025高考', '#政策解读'],
  },
  {
    id: 'schools',
    titles: [
      '{city}考生看过来：云南这些大学性价比超高',
      '{city}考生{city2}分在云南能上什么大学？',
      '{city}家长收藏！云南省内高校录取分数段一览',
      '{city}考生必看：最值得读的云南本土大学',
      '{city}高考{city2}分，留云南还是去省外？',
    ],
    body: `很多{city}家长问：孩子{city2}分，在云南能上什么大学？

根据往年数据，我给大家整理了几所性价比高的院校：

🏫 云南大学（昆明）
{city}考生参考分数：一本线以上30-60分
"双一流"建设高校，民族学、生态学、软件工程是优势专业。

🏫 昆明理工大学（昆明）
{city}考生参考分数：一本线以上10-40分
工科实力在西南地区名列前茅，冶金、材料、建筑等专业就业率很高。

🏫 云南师范大学（昆明）
{city}考生参考分数：一本线±20分
师范类毕业生的就业稳定性好，特别是{city}本地中小学招聘时很认。

🏫 大理大学（大理）
{city}考生参考分数：二本线以上30-60分
医学类专业是特色，而且在大理读书的生活成本相对较低。

当然，每个分数段的选择策略不一样。在{city}家长群里，我们会对每个考生的情况做针对性分析。

想进群交流的，私信我备注"{city}家长"。`,
    hashtags: ['#云南高考', '#大学推荐', '#{city}高考', '#高考志愿', '#云南大学'],
  },
  {
    id: 'anxiety',
    titles: [
      '{city}家长：高考倒计时，你比孩子还焦虑？',
      '{city}家长的真实写照：分数还没出来，头发先白了',
      '作为一个{city}家长，我为什么从3月就开始研究志愿填报',
      '{city}妈妈群炸了：高考志愿到底怎么填？',
      '{city}家长别慌！志愿填报有方法，一步一步来',
    ],
    body: `前几天有个{city}家长找我聊天，说孩子模考{city2}分，她整晚整晚睡不着。

其实每年这个时候，{city}的家长群里都是这样的氛围。大家的焦虑，我特别理解。

但我想说：焦虑解决不了问题，行动才能。

现在我建了{city}家长交流群，把大家聚在一起：

✅ 群内会分享志愿填报干货和政策解读
✅ 家长之间可以交流经验和信息
✅ 有问题随时问，大家一起讨论
✅ 后续还有线下讲座和一对一指导

你不是一个人在战斗。

想进{city}家长群的，评论区告诉我你是{city}哪里的，我拉你进对应的群。`,
    hashtags: ['#云南高考', '#家长焦虑', '#{city}高考', '#高考加油', '#家长群'],
  },
];

// ========== CTA模板 ==========
const CTAS = [
  '想进{city}家长交流群的，评论区扣1，或者直接私信我拉你进群。',
  '我是做云南高考志愿填报的，建了{city}家长群，想进群的私信我。',
  '有{city}的家长吗？我建了{city}家长交流群，想进的说一声。',
  '{city}家长群已经建好了，有需要的家长私信我进群。',
  '如果你也是{city}家长，欢迎进群交流，群里会定期分享高考志愿干货。',
];

// ========== 功能介绍提示 ==========
const FEATURE_TIPS = [
  '加微信后可免费领取《云南高考志愿填报指南》电子版',
  '群内可获取最新云南高考政策解读',
  '后续会邀请专家在群里做志愿填报讲座',
  '群里可以查各院校往年在云南的录取分数线',
];

// ========== 工具函数 ==========
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMulti(arr, n = 1) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function today() {
  const d = new Date();
  // 北京时间
  const bj = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return bj.toISOString().split('T')[0];
}

// 根据日期选择地州（轮换）
function getCitiesForToday(count = 3) {
  const now = new Date();
  const bj = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const dayOfYear = Math.floor((bj - new Date(bj.getFullYear(), 0, 0)) / 86400000);
  // 根据地州数+日期偏移，确保每天不同
  const startIdx = dayOfYear % CITIES.length;
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(CITIES[(startIdx + i * 5) % CITIES.length]);
  }
  return result;
}

function generateScore() {
  // 生成400-650之间的分数，步长5
  const scores = [420, 450, 480, 500, 520, 540, 560, 580, 600, 620];
  return pick(scores);
}

// ========== 模板模式生成内容 ==========
function generateTemplatePost(city) {
  const type = pick(CONTENT_TYPES);
  const score = generateScore();
  const title = pick(type.titles)
    .replace(/\{city\}/g, city.short)
    .replace(/\{city2\}/g, String(score));

  const body = type.body
    .replace(/\{city\}/g, city.short)
    .replace(/\{city2\}/g, String(score));

  const hashtags = type.hashtags.map(h => h.replace(/\{city\}/g, city.short)).join(' ');

  const cta = pick(CTAS).replace(/\{city\}/g, city.short);
  const feature = pick(FEATURE_TIPS);

  return [
    `## ${title}`,
    '',
    body,
    '',
    '---',
    '',
    cta,
    '',
    `💡 ${feature}`,
    '',
    hashtags,
    '',
  ].join('\n');
}

// ========== AI模式 ==========
async function generateAIPost(city) {
  const apiKey = process.env.DEEPSEEK_KEY;
  if (!apiKey) {
    throw new Error('需要设置 DEEPSEEK_KEY 环境变量');
  }

  const score = generateScore();
  const prompt = `你是一个云南高考志愿填报专家。请为小红书写一篇笔记。

要求：
- 目标读者：${city.name}的高考考生家长
- 内容类型：${pick(['分数段分析', '填报技巧', '政策解读', '院校推荐', '家长交流'])}
- 字数300-500字
- 语言口语化，像是一个真实的云南人在分享经验
- 不要用"亲爱的""大家好"这种假大空的问候
- 开头要吸引人（提问或痛点），正文给干货，结尾引导加群

格式：
标题：xxx

正文内容...

[引导语：想进${city.short}家长群的私信我]

标签：#云南高考 #${city.short}高考 #高考志愿 #2025高考`;

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一个云南高考志愿填报专家，擅长写小红书爆款笔记。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    throw new Error(`API错误: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('API返回内容为空');

  return `---\n${content}\n`;
}

// ========== 主逻辑 ==========
async function main() {
  const mode = process.env.DEEPSEEK_KEY ? 'ai' : 'template';
  const date = today();
  const cities = getCitiesForToday(3);

  console.log(`📅 生成日期: ${date}`);
  console.log(`📝 模式: ${mode}`);
  console.log(`📍 今日地州: ${cities.map(c => c.short).join(', ')}`);

  const posts = [];

  for (const city of cities) {
    console.log(`  生成 ${city.short} 的内容...`);
    try {
      let post;
      if (mode === 'ai') {
        post = await generateAIPost(city);
      } else {
        post = generateTemplatePost(city);
      }
      posts.push(post);
      console.log(`  ✅ ${city.short} 完成`);
    } catch (err) {
      console.error(`  ❌ ${city.short} 失败:`, err.message);
      // fallback to template
      console.log(`  切换到模板模式生成 ${city.short} 的内容...`);
      posts.push(generateTemplatePost(city));
    }
  }

  // 生成文案前的说明
  const content = [
    `# 📱 小红书待发内容 · ${date}`,
    '',
    `> ⏰ 生成时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
    `> 📝 模式: ${mode === 'ai' ? 'AI生成' : '模板生成'}`,
    '',
    '---',
    '',
    posts.join('\n\n---\n\n'),
    '',
    '---',
    '',
    '💡 **使用说明**',
    '1. 每条内容复制后直接发小红书即可',
    '2. 建议搭配一张配图（手机截图/数据表格/实拍照片）',
    '3. 发的时候加上对应地州的定位标签',
    '4. 发了之后记得在评论区引导私信',
    '',
  ].join('\n');

  // 写入文件
  const fs = require('fs');
  const path = require('path');
  const outputDir = path.join(__dirname, '..', 'content');

  // 确保目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `今日待发内容_${date}.md`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, content, 'utf-8');

  console.log(`\n✅ 已保存: content/${filename}`);
  console.log(`📊 共 ${posts.length} 条内容`);

  // 同时生成一份 latest.md 方便引用
  const latestPath = path.join(outputDir, 'latest.md');
  fs.writeFileSync(latestPath, content, 'utf-8');

  return filename;
}

// 运行
main().catch(err => {
  console.error('❌ 生成失败:', err);
  process.exit(1);
});
