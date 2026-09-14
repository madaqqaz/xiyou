# 逆道西行 PWA 部署与使用指南

## 一、PWA 是什么？

PWA（Progressive Web App，渐进式Web应用）是一种让网页应用具有原生App体验的技术：

- ✅ **添加到主屏幕**：手机桌面出现游戏图标，点击全屏打开
- ✅ **离线可用**：首次加载后，断网也能玩（Service Worker缓存）
- ✅ **自动更新**：服务器更新后，用户下次打开自动获取最新版
- ✅ **零成本**：不需要打包APK，不需要应用商店审核
- ✅ **跨平台**：Android和iOS都支持

---

## 二、已完成的PWA配置

### 2.1 文件清单

| 文件 | 说明 | 状态 |
|---|---|---|
| `manifest.json` | PWA应用清单（名称、图标、显示模式等） | ✅ 已创建 |
| `sw.js` | Service Worker（离线缓存、自动更新） | ✅ 已创建 |
| `index.html` | 已添加PWA meta标签和Service Worker注册 | ✅ 已修改 |
| `img/pwa/icon-192.png` | 应用图标 192x192 | ✅ 已生成 |
| `img/pwa/icon-512.png` | 应用图标 512x512 | ✅ 已生成 |
| `img/pwa/icon-1024.png` | 应用图标 1024x1024 | ✅ 已生成 |
| `generate_pwa_icons.ps1` | 图标重新生成脚本 | ✅ 已创建 |

### 2.2 PWA 配置详情

**应用信息**：
- 名称：逆道西行
- 描述：黑暗西游 · 单局Roguelike肉鸽构筑
- 显示模式：全屏（fullscreen）
- 屏幕方向：横屏（landscape）
- 主题色：#1a1a1a（深黑色）
- 背景色：#1a1a1a（深黑色）

**缓存策略**：
- HTML文件：网络优先（保证最新），失败用缓存
- CSS/JS/图片：缓存优先，后台更新（Stale-While-Revalidate）
- 预缓存核心文件：index.html、style.css、核心JS、图标

**自动更新**：
- Service Worker检测到新版本时自动下载
- 新版本安装完成后，下次打开自动生效
- 每小时自动检查更新

---

## 三、部署到HTTPS服务器

### ⚠️ 重要：PWA必须在HTTPS环境下才能工作

Service Worker和PWA功能要求HTTPS协议（localhost除外）。本地测试可以用http://localhost，但部署到服务器必须用HTTPS。

### 方案一：GitHub Pages（免费，推荐）

1. **注册GitHub账号**：https://github.com
2. **创建仓库**：
   - 仓库名：`nidao-xiyou`（或其他名字）
   - 选择Public（公开）
   - 勾选"Add a README file"
3. **上传游戏文件**：
   - 把demo目录下的所有文件上传到仓库（index.html、css、js、img、manifest.json、sw.js等）
   - 注意：不要上传node_modules、android、www等目录
4. **开启GitHub Pages**：
   - 仓库 → Settings → Pages
   - Source选择"Deploy from a branch"
   - Branch选择"main"，文件夹选择"/(root)"
   - 点击Save
5. **获取访问地址**：
   - 等待1-2分钟，Pages部署完成
   - 访问地址：`https://你的用户名.github.io/nidao-xiyou/`
6. **测试PWA**：
   - 手机浏览器打开上述地址
   - 点击菜单 → "添加到主屏幕"
   - 桌面出现游戏图标，点击全屏打开

### 方案二：Vercel（免费，速度快）

1. **注册Vercel账号**：https://vercel.com（可以用GitHub账号登录）
2. **导入项目**：
   - 点击"Add New..." → "Project"
   - 导入你的GitHub仓库
3. **配置部署**：
   - Framework Preset：Other
   - Build Command：留空
   - Output Directory：留空（或填`.`）
4. **点击Deploy**：
   - 等待部署完成（约1分钟）
   - 自动分配HTTPS域名：`https://nidao-xiyou.vercel.app`
5. **自定义域名**（可选）：
   - 在Vercel项目设置中添加自己的域名

### 方案三：Netlify（免费，简单）

1. **注册Netlify账号**：https://www.netlify.com
2. **拖拽部署**：
   - 把demo文件夹直接拖到Netlify首页的部署区域
   - 自动部署，分配HTTPS域名
3. **或者连接GitHub**：
   - 导入GitHub仓库，自动部署

### 方案四：自己的服务器

如果你有自己的服务器或云主机：

1. **配置HTTPS**：
   - 用Let's Encrypt免费SSL证书
   - 或用云服务商的免费SSL证书
2. **上传文件**：
   - 把游戏文件上传到网站根目录
3. **配置Web服务器**：
   - Nginx/Apache配置正确的MIME类型
   - 确保manifest.json和sw.js可以正常访问

---

## 四、手机端使用方法

### Android（Chrome/Edge浏览器）

1. 用Chrome或Edge打开游戏网址
2. 等待页面加载完成
3. 点击浏览器菜单（右上角三个点）
4. 选择"添加到主屏幕"或"安装应用"
5. 确认安装
6. 手机桌面出现"逆道西行"图标
7. 点击图标，全屏打开游戏

**自动安装提示**：
- 部分浏览器会在页面加载后自动弹出"添加到主屏幕"提示
- 点击"添加"即可

### iOS（Safari浏览器）

1. 用Safari打开游戏网址
2. 等待页面加载完成
3. 点击底部的分享按钮（方框+向上箭头）
4. 向下滑动，选择"添加到主屏幕"
5. 点击"添加"
6. 手机桌面出现"逆道西行"图标
7. 点击图标，全屏打开游戏

**注意**：
- iOS只支持Safari浏览器添加到主屏幕
- iOS的PWA支持有限，离线缓存功能可能不完整

---

## 五、更新游戏内容

PWA最大的优势就是**更新简单**：

### 更新流程

1. **修改游戏代码**（在本地修改index.html、css、js等）
2. **上传到服务器**（GitHub提交/Vercel自动部署/手动上传）
3. **用户打开游戏**：
   - Service Worker在后台检测到新版本
   - 自动下载新文件
   - 下次打开游戏时自动生效

### 用户端更新提示

- 新版本下载完成后，控制台会显示"新版本已安装，刷新页面即可生效"
- 可以在游戏中添加更新提示UI（以后扩展）
- 用户也可以手动刷新页面获取最新版

### 强制刷新

如果用户遇到缓存问题，可以：
- Android：Chrome菜单 → 设置 → 隐私 → 清除浏览数据
- iOS：设置 → Safari → 清除历史记录与网站数据
- 或者在游戏地址后加参数：`https://网址.com/?v=新版本号`

---

## 六、本地测试PWA

### 本地HTTP服务器

PWA在localhost下可以正常工作（不需要HTTPS）：

```powershell
# 方法1：Python
cd D:\xiyou\demo
python -m http.server 8080
# 访问 http://localhost:8080

# 方法2：Node.js（http-server）
npx http-server -p 8080
# 访问 http://localhost:8080
```

### 测试Service Worker

1. Chrome浏览器打开 http://localhost:8080
2. 按F12打开开发者工具
3. 切换到Application标签
4. 左侧选择Service Workers
5. 确认sw.js已注册并激活
6. 选择Cache Storage，查看缓存的文件

### 测试离线功能

1. 在开发者工具 → Network标签
2. 勾选"Offline"（离线模式）
3. 刷新页面
4. 页面应该能正常加载（从缓存读取）

---

## 七、常见问题

### Q1：添加到主屏幕后，打开还是浏览器界面？

**A**：检查manifest.json中的`display`字段是否为`"fullscreen"`或`"standalone"`。如果正确，应该是全屏无浏览器UI。

### Q2：离线后无法打开游戏？

**A**：
1. 确认首次加载时网络正常（Service Worker需要先缓存文件）
2. 检查开发者工具 → Application → Cache Storage，确认文件已缓存
3. iOS的离线支持有限，建议用Android测试

### Q3：更新后用户还是旧版本？

**A**：
1. Service Worker的更新检测可能需要一些时间
2. 用户可以手动刷新页面
3. 可以在sw.js中调整更新策略（目前是每小时检查一次）

### Q4：图标显示不正确？

**A**：
1. 检查`img/pwa/`目录下是否有icon-192.png和icon-512.png
2. 检查manifest.json中的图标路径是否正确
3. 清除浏览器缓存后重新添加到主屏幕

### Q5：iOS上PWA功能不正常？

**A**：iOS对PWA的支持有限：
- 只支持Safari浏览器
- 离线缓存功能不完整
- 推送通知不支持
- 建议主要面向Android用户

### Q6：可以推送通知吗？

**A**：可以，但需要额外配置：
- 需要后端服务器发送推送
- 需要用户授权通知权限
- iOS不支持Web Push
- 以后可以扩展这个功能

---

## 八、下一步优化（可选）

### 8.1 添加更新提示UI

在游戏中添加一个"发现新版本，点击更新"的提示条，让用户知道有更新。

### 8.2 添加启动画面

配置PWA启动画面（splash screen），让游戏启动时显示自定义画面。

### 8.3 优化缓存策略

根据游戏文件大小和更新频率，调整预缓存列表和缓存策略。

### 8.4 添加推送通知

配置Web Push，在游戏有更新或活动时推送通知给用户。

### 8.5 配置应用 shortcuts

在manifest.json中添加更多快捷方式（如"继续游戏"、"查看成就"等）。

---

## 九、文件结构

```
D:\xiyou\demo\
├── index.html              # 已添加PWA meta标签和SW注册
├── manifest.json           # PWA应用清单
├── sw.js                   # Service Worker（离线缓存+自动更新）
├── generate_pwa_icons.ps1  # 图标生成脚本
├── PWA_DEPLOY_GUIDE.md     # 本文档
├── css/
├── js/
└── img/
    └── pwa/
        ├── icon-192.png    # 应用图标 192x192
        ├── icon-512.png    # 应用图标 512x512
        └── icon-1024.png   # 应用图标 1024x1024
```

---

## 十、快速开始

1. **部署到GitHub Pages**（参考第三章方案一）
2. **手机浏览器打开游戏网址**
3. **添加到主屏幕**
4. **点击桌面图标，全屏玩游戏**
5. **以后更新只需上传代码，用户自动获取最新版**

---

**如有问题，请参考：**
- PWA官方文档：https://developer.mozilla.org/zh-CN/docs/Web/Progressive_web_apps
- Service Worker文档：https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API
