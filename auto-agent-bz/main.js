// auto-agent-bz/main.js
// 传奇霸主自动化脚本 - AutoJS版本
// Version: 1.1.1 (修复setTouchable兼容性)

'use strict';

// ========== 配置区 ==========
const CONFIG = {
  mode: 1,
  logLevel: 'debug',
  combat: {
    enabled: true,
    checkInterval: 1500,
  },
  antiAfk: {
    enabled: true,
    checkInterval: 2000,
  },
  daily: {
    enabled: true,
    interval: 60000,
  }
};

// ========== 全局状态 ==========
let STATE = {
  running: false,
  answering: false,
  stats: {
    startTime: 0,
    kills: 0,
    picks: 0,
  }
};

// ========== 悬浮日志窗口 ==========
let floatyWindow = null;
let logLines = [];
const MAX_LOG_LINES = 6;

const FloatyUI = {
  create() {
    try {
      // 创建悬浮窗口 - 使用setTouchableEnabled控制是否可拖拽
      floatyWindow = floaty.window(
        <frame bg="#88000000" padding="5">
          <vertical>
            <linear gravity="center" bg="#AA000000" padding="3">
              <text text="传奇霸主" textColor="#FFD700" textSize="12" />
              <text id="status" text=" 已停止" textColor="#AAAAAA" textSize="10" />
            </linear>
            <scroll id="logScroll" height="120">
              <vertical id="logContainer">
                <text id="log1" text="" textColor="#00FF00" textSize="9" />
                <text id="log2" text="" textColor="#00FF00" textSize="9" />
                <text id="log3" text="" textColor="#00FF00" textSize="9" />
                <text id="log4" text="" textColor="#00FF00" textSize="9" />
                <text id="log5" text="" textColor="#00FF00" textSize="9" />
                <text id="log6" text="" textColor="#00FF00" textSize="9" />
              </vertical>
            </scroll>
            <linear gravity="center" bg="#AA333333" padding="2">
              <text id="stats" text="击杀: 0 | 拾取: 0" textColor="#FFFFFF" textSize="9" />
            </linear>
            <linear gravity="center" padding="2">
              <button id="btnStop" text="停止" textSize="10" h="25" w="60" />
              <button id="btnDebug" text="屏幕" textSize="10" h="25" w="50" />
            </linear>
          </vertical>
        </frame>
      );

      // 设置位置
      floatyWindow.setPosition(10, 100);

      // 设置窗口不可点击（这样可以拖动）
      try {
        floatyWindow.setTouchableEnabled(false);
      } catch (e) {
        // 有些版本没有这个方法，忽略
      }

      // 按钮事件
      floatyWindow.btnStop.click(function() {
        Main.stop();
      });

      floatyWindow.btnDebug.click(function() {
        UI.showCurrentScreenText();
      });

      this.log('悬浮窗已创建');
    } catch (e) {
      console.error('创建悬浮窗失败: ' + e);
      floatyWindow = null;
    }
  },

  log(msg) {
    if (!floatyWindow) return;
    logLines.push(msg);
    if (logLines.length > MAX_LOG_LINES) logLines.shift();
    for (let i = 1; i <= MAX_LOG_LINES; i++) {
      try {
        let tv = floatyWindow['log' + i];
        if (tv && logLines[i - 1]) tv.setText(logLines[i - 1]);
      } catch (e) {}
    }
  },

  updateStatus(status, color) {
    if (!floatyWindow) return;
    color = color || '#AAAAAA';
    floatyWindow.status.setText(' ' + status);
    try {
      floatyWindow.status.setTextColor(colors.parseColor(color));
    } catch (e) {}
  },

  updateStats() {
    if (!floatyWindow) return;
    let s = '击杀: ' + STATE.stats.kills + ' | 拾取: ' + STATE.stats.picks;
    try {
      floatyWindow.stats.setText(s);
    } catch (e) {}
  },

  close() {
    if (floatyWindow) {
      try {
        floatyWindow.close();
      } catch (e) {}
      floatyWindow = null;
    }
  }
};

// ========== 日志 ==========
const Log = {
  d(tag, msg) {
    if (CONFIG.logLevel === 'debug') {
      console.log('[' + tag + '] ' + msg);
      FloatyUI.log('[' + tag + '] ' + msg);
    }
  },
  i(tag, msg) {
    console.log('[' + tag + '] ' + msg);
    FloatyUI.log('[' + tag + '] ' + msg);
  },
  w(tag, msg) {
    console.warn('[' + tag + '] ' + msg);
    FloatyUI.log('[W]' + msg);
  },
  e(tag, msg) {
    console.error('[' + tag + '] ' + msg);
    FloatyUI.log('[E]' + msg);
  }
};

// ========== UI控件查找 ==========
const UI = {
  clickText(str, timeout) {
    try {
      timeout = timeout || 5000;
      let el = text(str).clickable(true).findOne(timeout);
      if (el) {
        el.click();
        this.d('点击: ' + str);
        return true;
      }
      el = textContains(str).clickable(true).findOne(timeout);
      if (el) {
        el.click();
        this.d('点击: ' + str);
        return true;
      }
      this.w('未找到: ' + str);
      return false;
    } catch (e) {
      this.e('点击失败: ' + str);
      return false;
    }
  },

  clickBounds(x1, y1, x2, y2) {
    let cx = Math.floor((x1 + x2) / 2);
    let cy = Math.floor((y1 + y2) / 2);
    click(cx, cy);
    this.d('坐标: (' + cx + ',' + cy + ')');
  },

  existsText(str, timeout) {
    try {
      timeout = timeout || 2000;
      return text(str).exists(timeout) || textContains(str).exists(timeout);
    } catch (e) {
      return false;
    }
  },

  closeDialog() {
    this.clickText('×');
    this.clickText('关闭');
    this.clickText('X');
    let w = device.width;
    this.clickBounds(w - 80, 50, w - 30, 100);
  },

  d(tag, msg) { Log.d(tag, msg); },
  w(tag, msg) { Log.w(tag, msg); },
  e(tag, msg) { Log.e(tag, msg); },

  getAllText() {
    let texts = [];
    try {
      let els = text().clickable(false).find();
      els.forEach(function(el) {
        let t = el.text();
        if (t && t.length > 0 && t.length < 50) texts.push(t);
      });
    } catch (e) {}
    return texts.slice(0, 15).join(' | ');
  },

  showCurrentScreenText() {
    let txt = this.getAllText();
    Log.i('屏幕', txt);
  }
};

// ========== 反挂机答题 ==========
const AntiAfk = {
  checkDialog() {
    if (this.existsText('答题')) return true;
    if (this.existsText('验证')) return true;
    if (this.existsText('第') && this.existsText('行')) return true;
    if (this.existsText('等于') || this.existsText('乘')) return true;
    return false;
  },

  existsText(str, timeout) {
    try {
      timeout = timeout || 2000;
      return text(str).exists(timeout) || textContains(str).exists(timeout);
    } catch (e) {
      return false;
    }
  },

  parseChineseNum(str) {
    var map = { '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10 };
    if (map[str] !== undefined) return map[str];
    if (str === '十') return 10;
    if (str.length === 2 && str[0] === '十') return 10 + (map[str[1]] || 0);
    return parseInt(str) || 0;
  },

  solve() {
    var question = '';
    var answer = '';
    var self = this;

    try {
      var qEl = textContains('第').findOne(3000);
      if (qEl) question = qEl.text();
    } catch (e) {
      Log.e('AntiAfk', '获取题目失败');
      return;
    }

    Log.i('AntiAfk', '题目: ' + question);

    var m;

    // 乘法
    m = question.match(/(.)乘(.)等/);
    if (m) {
      var a = this.parseChineseNum(m[1]);
      var b = this.parseChineseNum(m[2]);
      answer = (a * b).toString();
      Log.i('AntiAfk', '乘法: ' + a + 'x' + b + '=' + answer);
    }

    // 加法
    m = question.match(/(.)加(.)等/);
    if (m) {
      var a2 = this.parseChineseNum(m[1]);
      var b2 = this.parseChineseNum(m[2]);
      answer = (a2 + b2).toString();
      Log.i('AntiAfk', '加法: ' + a2 + '+' + b2 + '=' + answer);
    }

    if (answer) {
      try {
        var input = className('EditText').findOne(2000);
        if (input) {
          input.setText(answer);
          sleep(300);
        }
        UI.clickText('确定');
        UI.clickText('确认');
      } catch (e) {
        Log.e('AntiAfk', '输入失败');
      }
    } else {
      Log.w('AntiAfk', '请手动答题!');
      device.vibrate(500);
    }
  },

  execute() {
    if (!CONFIG.antiAfk.enabled) return;
    if (STATE.answering) return;
    if (this.checkDialog()) {
      STATE.answering = true;
      Log.i('AntiAfk', '检测到答题!');
      this.solve();
      STATE.answering = false;
    }
  }
};

// ========== 战斗模块 ==========
const Combat = {
  checkCombat() {
    if (UI.existsText('自动')) return true;
    if (UI.existsText('战斗中')) return true;
    if (UI.existsText('攻击')) return true;
    return false;
  },

  enableAutoFight() {
    if (UI.clickText('自动')) {
      sleep(500);
      return true;
    }
    if (UI.clickText('开')) {
      sleep(300);
      return true;
    }
    return false;
  },

  checkLoot() {
    if (UI.existsText('拾取')) return true;
    if (UI.existsText('金币')) return true;
    if (UI.existsText('获得')) return true;
    return false;
  },

  pickup() {
    UI.clickText('拾取');
    UI.clickText('一键拾取');
    STATE.stats.picks++;
    FloatyUI.updateStats();
    sleep(200);
  },

  loop() {
    while (STATE.running) {
      if (STATE.answering) {
        sleep(1000);
        continue;
      }
      AntiAfk.execute();
      if (this.checkLoot()) {
        this.pickup();
      }
      if (!this.checkCombat()) {
        this.enableAutoFight();
      }
      sleep(CONFIG.combat.checkInterval);
    }
  }
};

// ========== 日常任务 ==========
const Daily = {
  execute() {
    if (!CONFIG.daily.enabled) return;
    Log.i('Daily', '执行日常...');
    if (UI.clickText('日常')) {
      sleep(500);
    }
    UI.clickText('领取');
    sleep(300);
    UI.clickText('确定');
    sleep(200);
    UI.closeDialog();
    Log.i('Daily', '完成');
  }
};

// ========== 主控制 ==========
const Main = {
  init() {
    Log.i('Main', '传奇霸主助手 v1.1.1 启动');
    Log.i('Main', '屏幕: ' + device.width + 'x' + device.height);

    if (!requestScreenCapture()) {
      Log.e('Main', '需要截图权限!');
      toast('请授予截图权限');
      return false;
    }

    // 启用无障碍服务
    try {
      auto();
      Log.i('Main', '无障碍服务已启用');
    } catch (e) {
      Log.e('Main', '无障碍服务失败: ' + e);
    }

    return true;
  },

  start() {
    if (STATE.running) {
      Log.w('Main', '已在运行');
      return;
    }

    if (!this.init()) return;

    // 创建悬浮窗（不阻塞）
    FloatyUI.create();

    STATE.running = true;
    STATE.stats.startTime = Date.now();
    FloatyUI.updateStatus('运行中', '#00FF00');

    threads.start(function() {
      Combat.loop();
    });

    threads.start(function() {
      while (STATE.running) {
        Daily.execute();
        sleep(CONFIG.daily.interval);
      }
    });

    Log.i('Main', '已启动!');
    device.vibrate(200);
  },

  stop() {
    if (!STATE.running) return;
    STATE.running = false;
    FloatyUI.updateStatus('已停止', '#FF6666');
    var duration = Date.now() - STATE.stats.startTime;
    var mins = Math.floor(duration / 60000);
    Log.i('Main', '已停止, 时长: ' + mins + '分钟');
    device.vibrate(300);
    setTimeout(function() {
      FloatyUI.close();
    }, 2000);
  }
};

// ========== 入口 ==========
Main.start();

// 音量下键停止
events.observeKey();
events.onKeyDown('volume_down', function() {
  Main.stop();
  exit();
});

// 保持运行
while (STATE.running) {
  sleep(1000);
}
