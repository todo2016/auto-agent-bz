// auto-agent-bz/main.js
// 传奇霸主 - 自动回收 v2.1
// 通过WebView注入调用游戏内部函数

'use strict';

// ========== 悬浮窗 ==========
let fw = null;
let logs = [];
const MAX_LOG = 5;

const Floaty = {
  create() {
    try {
      fw = floaty.window(
        <frame bg="#88000000" padding="3">
          <vertical>
            <text text="自动回收 v2.1" textColor="#FFD700" textSize="10" />
            <text id="status" text="等待开始..." textColor="#FFF" textSize="8" />
            <text id="l1" text="" textColor="#0F0" textSize="8" />
            <text id="l2" text="" textColor="#0F0" textSize="8" />
            <text id="l3" text="" textColor="#0F0" textSize="8" />
          </vertical>
        </frame>
      );
      fw.setPosition(5, 100);
      this.log("初始化完成");
    } catch (e) {
      toast("悬浮窗失败: " + e);
    }
  },

  log(msg) {
    if (!fw) return;
    msg = String(msg).substring(0, 35);
    logs.push(msg);
    if (logs.length > MAX_LOG) logs.shift();
    try {
      for (let i = 1; i <= MAX_LOG; i++) {
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

// ========== WebView注入器 ==========
const Inject = {
  webView: null,

  findWebView() {
    try {
      let context = context;
      let activity = context.getActivity();
      if (!activity) return null;

      let decorView = activity.getWindow().getDecorView();
      return this.searchWebView(decorView);
    } catch (e) {
      return null;
    }
  },

  searchWebView(view) {
    if (!view) return null;
    try {
      let clsName = view.class.getName();
      if (clsName.includes("WebView") || view instanceof android.webkit.WebView) {
        return view;
      }
      if (view instanceof android.view.ViewGroup) {
        for (let i = 0; i < view.getChildCount(); i++) {
          let result = this.searchWebView(view.getChildAt(i));
          if (result) return result;
        }
      }
    } catch (e) {}
    return null;
  },

  // 执行JS并获取结果
  async eval(js) {
    return new Promise((resolve) => {
      try {
        let wv = this.webView || this.findWebView();
        if (!wv) {
          resolve(null);
          return;
        }

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
          wv.evaluateJavascript(js, new android.webkit.ValueCallback({
            onReceiveValue: function(result) {
              resolve(result);
            }
          }));
        } else {
          wv.loadUrl("javascript:window._ret=" + js + ";");
          resolve(null);
        }
      } catch (e) {
        resolve(null);
      }
    });
  },

  // 执行JS不等待结果
  exec(js) {
    try {
      let wv = this.webView || this.findWebView();
      if (!wv) return;

      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
        wv.evaluateJavascript(js, null);
      } else {
        wv.loadUrl("javascript:" + js);
      }
    } catch (e) {}
  }
};

// ========== 回收功能 ==========
const Recycler = {
  // 打开回收界面
  async openRecycleUI() {
    Floaty.log("打开回收界面...");
    Inject.exec("uim.show(671);");
    await sleep(500);
    let hasUI = await Inject.eval("uim.getUI(671) ? true : false");
    Floaty.log("回收界面: " + (hasUI === "true" ? "已打开" : "未打开"));
    return hasUI === "true";
  },

  // 执行回收
  async doRecycle() {
    Floaty.log("执行回收...");
    Inject.exec("if(typeof RecyclePop !== 'undefined') { var rp = uim.getUI(671); if(rp && rp.doRecycle) rp.doRecycle(); }");
    await sleep(300);
    Floaty.log("回收完成");
  },

  // 分解物品
  // category: 2=类型分解, type: 5=元婴, 7=盾牌, 12=技能书, 13=灵石
  async decompose(category, type) {
    Floaty.log("分解类型" + type + "...");
    Inject.exec("net.DecomposeModel.ins().send1(" + category + ", " + type + ", 0)");
    await sleep(200);
  },

  // 自动分解+回收
  async autoRecycle() {
    Floaty.setStatus("回收中...");

    // 1. 打开回收界面
    let opened = await this.openRecycleUI();
    if (!opened) {
      Floaty.log("无法打开回收界面");
      return;
    }

    await sleep(500);

    // 2. 执行回收
    await this.doRecycle();

    await sleep(500);

    // 3. 分解各类型物品
    // 元婴
    await this.decompose(2, 5);
    // 盾牌
    await this.decompose(2, 7);
    // 技能书
    await this.decompose(2, 12);
    // 灵石
    await this.decompose(2, 13);

    // 4. 关闭回收界面
    Inject.exec("uim.close(671);");

    Floaty.setStatus("完成!");
    Floaty.log("自动回收全部完成");
  }
};

// ========== 主控 ==========
const Main = {
  running: false,

  init() {
    if (!requestScreenCapture()) {
      toast("需要截图权限!");
      return false;
    }
    try { auto(); } catch (e) {}
    return true;
  },

  start() {
    if (this.running) return;
    if (!this.init()) return;

    Floaty.create();
    this.running = true;

    Floaty.log("开始自动回收");
    Floaty.log("请确保已在游戏中");

    // 延迟执行确保游戏已加载
    setTimeout(() => {
      Recycler.autoRecycle().then(() => {
        Floaty.log("全部完成!");
        device.vibrate(500);
        setTimeout(() => {
          Floaty.close();
        }, 3000);
      });
    }, 1000);
  },

  stop() {
    this.running = false;
    Floaty.close();
  }
};

// ========== 入口 ==========
Main.start();

// 音量下键停止
events.observeKey();
events.onKeyDown("volume_down", function() {
  Main.stop();
  exit();
});
