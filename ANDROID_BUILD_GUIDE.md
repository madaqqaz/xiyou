# 逆道西行 Android App 构建指南

## 一、项目状态

✅ Capacitor项目已创建完成
✅ Android平台已添加
✅ Web资源已同步到Android项目
⏳ 需要安装Android Studio构建APK

## 二、安装Android Studio（必需）

### 1. 下载Android Studio
- 官网：https://developer.android.com/studio
- 国内镜像：https://developer.android.google.cn/studio
- 下载最新版本（约1GB）

### 2. 安装Android Studio
- 运行安装程序，默认下一步即可
- 安装完成后首次启动，会自动下载Android SDK
- 等待SDK下载完成（约2-3GB，需要10-30分钟）

### 3. 配置环境变量（可选，命令行构建需要）
- 右键"此电脑" → 属性 → 高级系统设置 → 环境变量
- 新建系统变量：
  - 变量名：`ANDROID_HOME`
  - 变量值：`C:\Users\你的用户名\AppData\Local\Android\Sdk`
- 编辑Path变量，添加：
  - `%ANDROID_HOME%\platform-tools`
  - `%ANDROID_HOME%\cmdline-tools\latest\bin`

## 三、用Android Studio构建APK（推荐）

### 方法A：用Android Studio打开项目（最简单）

1. 启动Android Studio
2. 选择 "Open an existing project"
3. 选择目录：`D:\xiyou\demo\android`
4. 等待Gradle同步完成（第一次需要下载依赖，约5-10分钟）
5. 菜单栏选择：`Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
6. 等待构建完成
7. 构建成功后，点击弹窗中的 "locate" 找到APK文件
8. APK位置：`D:\xiyou\demo\android\app\build\outputs\apk\debug\app-debug.apk`

### 方法B：命令行构建（需要配置环境变量）

打开PowerShell，执行：

```powershell
cd D:\xiyou\demo\android
.\gradlew.bat assembleDebug
```

构建成功后，APK在：
`D:\xiyou\demo\android\app\build\outputs\apk\debug\app-debug.apk`

## 四、安装APK到手机

### 方法1：直接传输
1. 手机连接电脑（USB调试模式）
2. 把APK文件复制到手机
3. 在手机上点击APK文件安装
4. 允许"安装未知来源应用"

### 方法2：adb命令安装
```powershell
adb install D:\xiyou\demo\android\app\build\outputs\apk\debug\app-debug.apk
```

## 五、更新游戏内容后重新构建

每次修改游戏代码后，需要同步并重新构建：

```powershell
# 1. 同步Web资源到Android项目
cd D:\xiyou\demo
npx cap sync android

# 2. 重新构建APK
cd android
.\gradlew.bat assembleDebug
```

或者用Android Studio：
1. `Build` → `Clean Project`
2. `Build` → `Rebuild Project`

## 六、发布版APK（上架应用商店需要）

Debug版APK可以直接安装测试，但上架应用商店需要Release版：

1. 生成签名密钥（keystore）
2. 配置签名
3. 构建Release版APK

详细步骤参考：https://developer.android.com/studio/publish/app-signing

## 七、项目结构

```
D:\xiyou\demo\
├── www/                    # Web资源目录（Capacitor读取）
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── img/
├── android/                # Android原生项目
│   ├── app/
│   │   └── src/main/
│   │       ├── assets/public/  # 同步后的Web资源
│   │       ├── java/           # Java源码
│   │       └── res/            # 资源文件
│   ├── gradle/
│   ├── build.gradle
│   └── gradlew.bat
├── capacitor.config.json   # Capacitor配置
├── package.json            # npm配置
└── node_modules/           # npm依赖
```

## 八、常见问题

### Q1：Gradle同步失败？
A：检查网络连接，首次同步需要下载大量依赖。可以配置国内镜像：
在 `android/build.gradle` 中添加阿里云镜像。

### Q2：构建失败，提示SDK未找到？
A：在Android Studio中打开 `File` → `Project Structure` → `SDK Location`，确认SDK路径正确。

### Q3：APK安装后白屏？
A：检查 `www/index.html` 中的资源路径是否正确，确保所有JS/CSS文件都已同步。

### Q4：如何修改应用图标和名称？
A：
- 应用名称：修改 `android/app/src/main/res/values/strings.xml` 中的 `app_name`
- 应用图标：替换 `android/app/src/main/res/mipmap-*/ic_launcher.png`

## 九、下一步

1. ✅ 安装Android Studio
2. ✅ 用Android Studio打开 `D:\xiyou\demo\android`
3. ✅ 构建Debug版APK
4. ✅ 安装到手机测试
5. ⏳ 优化移动端适配
6. ⏳ 生成签名密钥，构建Release版
7. ⏳ 上架应用商店

---

**如有问题，请参考Capacitor官方文档：**
https://capacitorjs.com/docs/android
