// auto-agent-bz/main.js
// 传奇霸主 - 极简稳定版 v1.3.0
// 只保留核心功能，避免崩溃

'use strict';

// ========== 配置 ==========
const CONFIG = {
  mode: 1,
  combat: { enabled: true, checkInterval: 2000 },
  antiAfk: { enabled: true },
  daily: { enabled: true, interval: 30000 }
};

// ========== 状态 ==========
let STATE = { running: false, answering: false };

// ========== 悬浮窗 ==========
let fw = null;
let logs = [];

const Floaty = {
  create() {
    try {
      fw = floaty.window(
        <frame bg="#88000000" padding="3">
          <vertical>
            <text id="t" text="传奇助手 v1.3" textColor="#FFD700" textSize="10" />
            <text id="l1" text="" textColor="#0F0" textSize="8" />
            <text id="l2" text="" textColor="#0F0" textSize="8" />
            <text id="l3" text="" textColor="#0F0" textSize="8" />
            <text id="l4" text="" textColor="#0F0" textSize="8" />
          </vertical>
        </frame>
      );
      fw.setPosition(5, 100);
      this.log("悬浮窗创建成功");
    } catch (e) {
      toast("悬浮窗失败: " + e);
    }
  },

  log(msg) {
    if (!fw) return;
    msg = String(msg).substring(0, 25);
    logs.push(msg);
    if (logs.length > 4) logs.shift();
    try {
      fw.l1.setText(logs[0] || "");
      fw.l2.setText(logs[1] || "");
      fw.l3.setText(logs[2] || "");
      fw.l4.setText(logs[3] || "");
    } catch (e) {}
  },

  close() {
    if (fw) {
      try { fw.close(); } catch (e) {}
      fw = null;
    }
  }
};

// ========== 日志 ==========
const Log = {
  i(msg) {
    console.log(msg);
    Floaty.log(msg);
  }
};

// ========== UI工具 ==========
const UI = {
  // 安全点击文字
  clickText(str) {
    try {
      let el = text(str).clickable(true).findOne(2000);
      if (el) {
        el.click();
        Log.i("点击: " + str);
        return true;
      }
    } catch (e) {
      Log.i("未找到: " + str);
    }
    return false;
  },

  // 检测文字是否存在
  hasText(str) {
    try {
      return text(str).exists(1000);
    } catch (e) {
      return false;
    }
  },

  // 检测多个文字（任意一个存在即返回true）
  hasAny() {
    let arr = Array.from(arguments);
    for (let i = 0; i < arr.length; i++) {
      if (this.hasText(arr[i])) return true;
    }
    return false;
  }
};

// ========== 反挂机 ==========
const AntiAfk = {
  check() {
    if (!CONFIG.antiAfk.enabled || STATE.answering) return;

    if (UI.hasAny("答题", "验证", "第", "乘", "加")) {
      STATE.answering = true;
      Log.i("检测到答题!");
      this.solve();
      STATE.answering = false;
    }
  },

  solve() {
    try {
      // 尝试找输入框
      let input = className("EditText").findOne(1000);
      if (input) {
        // 简单检测数学运算
        let q = "";
        try {
          let qel = textContains("等").findOne(1000);
          if (qel) q = qel.text();
        } catch (e) {}

        let ans = "";
        let m = q.match(/(.)乘(.)等/);
        if (m) {
          let a = this.toNum(m[1]);
          let b = this.toNum(m[2]);
          ans = String(a * b);
          Log.i("乘法: " + ans);
        }
        m = q.match(/(.)加(.)等/);
        if (m) {
          let a = this.toNum(m[1]);
          let b = this.toNum(m[2]);
          ans = String(a + b);
          Log.i("加法: " + ans);
        }

        if (ans) {
          input.setText(ans);
          sleep(200);
        }
      }
      UI.clickText("确定");
      UI.clickText("确认");
    } catch (e) {
      Log.i("答题异常");
    }
  },

  toNum(s) {
    let m = {零:0,一:1,二:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9,十:10};
    if (m[s] !== undefined) return m[s];
    if (s === "十") return 10;
    return parseInt(s) || 0;
  }
};

// ========== 战斗 ==========
const Combat = {
  check() {
    return UI.hasAny("自动", "攻击", "战斗中");
  },

  enable() {
    if (UI.clickText("自动")) return true;
    if (UI.clickText("开")) return true;
    return false;
  },

  checkLoot() {
    return UI.hasAny("拾取", "金币", "获得");
  },

  pickup() {
    UI.clickText("拾取");
    UI.clickText("一键拾取");
    Log.i("拾取物品");
  }
};

// ========== 日常 ==========
const Daily = {
  exec() {
    if (!CONFIG.daily.enabled) return;
    Log.i("执行日常...");
    UI.clickText("日常");
    sleep(500);
    UI.clickText("领取");
    sleep(200);
    UI.clickText("确定");
    sleep(200);
    UI.clickText("×");
    UI.clickText("关闭");
    Log.i("日常完成");
  }
};

// ========== 主控 ==========
const Main = {
  start() {
    if (STATE.running) return;

    // 请求权限
    if (!requestScreenCapture()) {
      toast("需要截图权限!");
      return;
    }

    try { auto(); } catch (e) {}

    Floaty.create();
    STATE.running = true;

    Log.i("助手已启动!");
    device.vibrate(200);

    // 主循环
    threads.start(function() {
      let counter = 0;
      while (STATE.running) {
        try {
          AntiAfk.check();
          if (Combat.checkLoot()) Combat.pickup();
          if (!Combat.check()) Combat.enable();

          // 每30秒执行一次日常
          counter++;
          if (counter >= 15) {
            Daily.exec();
            counter = 0;
          }
        } catch (e) {
          Log.i("循环异常");
        }
        sleep(CONFIG.combat.checkInterval);
      }
    });
  },

  stop() {
    STATE.running = false;
    Log.i("已停止");
    device.vibrate(300);
    setTimeout(function() { Floaty.close(); }, 1000);
  }
};

// ========== 入口 ==========
Main.start();

// 音量下停止
events.observeKey();
events.onKeyDown("volume_down", function() {
  Main.stop();
  exit();
});

// 保持运行
while (STATE.running) {
  sleep(1000);
}
