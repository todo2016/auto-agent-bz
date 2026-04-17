// auto-agent-bz/main.js
// 传奇霸主 - 简单点击版 v2.2
// 直接坐标点击，不需要WebView注入

'use strict';

// ========== 配置 ==========
const CONFIG = {
  // 屏幕分辨率
  screenWidth: 1080,
  screenHeight: 2400,

  // 按钮位置 (根据截图校准)
  buttons: {
    // 背包 (右下区域)
    bag: { x: 950, y: 2100 },

    // 回收 (背包界面内)
    recycle: { x: 200, y: 1400 },

    // 整理 (背包界面内)
    organize: { x: 800, y: 300 },

    // 存仓 (背包界面内)
    deposit: { x: 800, y: 1400 },

    // 出售/回收确认 (背包界面内)
    sellConfirm: { x: 540, y: 1200 },

    // 关闭
    close: { x: 100, y: 100 },
  }
};

// ========== 悬浮窗 ==========
let fw = null;
let logs = [];

const Floaty = {
  create() {
    try {
      fw = floaty.window(
        <frame bg="#88000000" padding="3">
          <vertical>
            <text text="自动回收 v2.2" textColor="#FFD700" textSize="10" />
            <text id="status" text="等待开始..." textColor="#FFF" textSize="8" />
            <text id="l1" text="" textColor="#0F0" textSize="8" />
            <text id="l2" text="" textColor="#0F0" textSize="8" />
            <text id="l3" text="" textColor="#0F0" textSize="8" />
            <text id="l4" text="" textColor="#0F0" textSize="8" />
          </vertical>
        </frame>
      );
      fw.setPosition(5, 100);
      this.log("初始化完成");
    } catch (e) {
      toast("悬浮窗失败");
    }
  },

  log(msg) {
    if (!fw) return;
    msg = String(msg).substring(0, 35);
    logs.push(msg);
    if (logs.length > 4) logs.shift();
    try {
      for (let i = 1; i <= 4; i++) {
        let tv = fw['l' + i];
        if (tv) tv.setText(logs[i - 1] || "");
      }
    } catch (e) {}
  },

  setStatus(s) {
    if (!fw) return;
    try { fw.status.setText(s); } catch (e) {}
  },

  close() {
    if (fw) {
      try { fw.close(); } catch (e) {}
      fw = null;
    }
  }
};

// ========== 点击工具 ==========
const Click = {
  tap(x, y) {
    let bx = Math.floor(x * device.width / CONFIG.screenWidth);
    let by = Math.floor(y * device.height / CONFIG.screenHeight);
    shell("input tap " + bx + " " + by, true);
    this.log("点击: (" + bx + "," + by + ")");
    sleep(300);
  },

  tapBtn(name) {
    let btn = CONFIG.buttons[name];
    if (btn) {
      this.tap(btn.x, btn.y);
      return true;
    }
    this.log("未找到按钮: " + name);
    return false;
  },

  log(msg) {
    Floaty.log(msg);
    console.log(msg);
  }
};

// ========== 回收流程 ==========
const Recycler = {
  async run() {
    Floaty.setStatus("执行中...");

    // 1. 打开背包
    this.log("步骤1: 打开背包");
    this.tapBtn("bag");
    await sleep(800);

    // 2. 点击回收按钮
    this.log("步骤2: 点击回收");
    this.tapBtn("recycle");
    await sleep(500);

    // 3. 点击整理（可能有确认）
    this.log("步骤3: 点击整理");
    this.tapBtn("organize");
    await sleep(300);
    this.tapBtn("sellConfirm");
    await sleep(300);

    // 4. 再点一次整理确认
    this.tapBtn("organize");
    await sleep(300);
    this.tapBtn("sellConfirm");
    await sleep(300);

    // 5. 关闭界面
    this.log("步骤4: 关闭");
    this.tapBtn("close");
    await sleep(500);

    Floaty.setStatus("完成!");
    this.log("回收完成!");
    device.vibrate(500);
  }
};

// ========== 主控 ==========
const Main = {
  init() {
    if (!requestScreenCapture()) {
      toast("需要截图权限!");
      return false;
    }
    try { auto(); } catch (e) {}
    return true;
  },

  start() {
    if (!this.init()) return;
    Floaty.create();
    this.log("开始自动回收");
    this.log("请确保在游戏主界面");

    setTimeout(() => {
      Recycler.run().then(() => {
        setTimeout(() => { Floaty.close(); }, 3000);
      });
    }, 1000);
  }
};

// ========== 入口 ==========
Main.start();

events.observeKey();
events.onKeyDown("volume_down", function() {
  Floaty.close();
  exit();
});
