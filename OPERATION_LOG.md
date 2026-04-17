# 传奇霸主自动化 - 操作日志

## 2026-04-17

### 环境配置
- Mac Mini + ADB 连接真机 (ZY22KXTS53)
- AutoJS6 v6.7.0 (Android 15)
- scrcpy 已安装用于投屏

### 项目结构
```
auto-agent-bz/
├── main.js          # 主脚本 (v1.3.0)
├── config.js        # 配置文件
├── modules/
│   └── anti_afk.js  # 反挂机模块
├── screenshots/     # 截图
└── OPERATION_LOG.md # 本日志
```

### 关键操作记录

#### 1. ADB 连接
```bash
adb devices  # ZY22KXTS53 device
```

#### 2. 脚本推送
```bash
adb push main.js /sdcard/脚本/main.js
```

#### 3. 运行脚本
```bash
adb shell am start -n org.autojs.autojs6/org.autojs.autojs.external.open.RunIntentActivity -d file:///sdcard/脚本/main.js
```

#### 4. 截图命令
```bash
adb exec-out screencap -p > screenshot.png
```

#### 5. 点击坐标 (基于 2400x1080 横屏)
- 背包按钮: (540, 950)
- 存仓按钮: (820, 2060)  # 可能需要调整
- 关闭: (100, 100)

#### 6. UI Dump
```bash
adb shell uiautomator dump /sdcard/ui.xml
# 注意: 游戏在 WebView 内，uiautomator 无法获取控件
```

### 遇到的问题

1. **权限问题**
   - Android 15 需要 FOREGROUND_SERVICE_MEDIA_PROJECTION 权限
   - 需要在手机上手动授权

2. **无障碍服务**
   - 需要在设置中开启 AutoJS 的无障碍权限

3. **悬浮窗乱码**
   - 已修复，日志内容限制长度和特殊字符

4. **WebView 内游戏**
   - uiautomator 无法读取游戏内控件
   - 需要用坐标点击

### 待解决
- [ ] 确定背包界面的"存仓"按钮正确坐标
- [ ] 测试完整的自动存仓流程
- [ ] 添加更多游戏界面的按钮坐标
