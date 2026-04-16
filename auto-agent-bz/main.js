// auto-agent-bz/main.js
// 传奇霸主自动化脚本 - AutoJS版本
// 使用控件查找 + 悬浮日志面板
// Version: 1.1.0

'use strict';

// ========== 配置区 ==========
const CONFIG = {
  // 运行模式: 0=元宝, 1=打玉, 2=大号
  mode: 1,

  // 日志级别
  logLevel: 'debug',

  // 战斗设置
  combat: {
    enabled: true,
    checkInterval: 1500,
  },

  // 反挂机
  antiAfk: {
    enabled: true,
    checkInterval: 2000,
  },

  // 日常任务
  daily: {
    enabled: true,
    interval: 60000,
  },

  // 悬浮窗设置
  floaty: {
    // 位置
    x: 10,
    y: 100,
    // 透明度
    alpha: 0.85,
    // 大小
    width: 300,
    height: 200,
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
const MAX_LOG_LINES = 8;

const FloatyUI = {
  /**
   * 创建悬浮窗
   */
  create() {
    // 创建悬浮窗口
    floatyWindow = floaty.window(
      <frame bg="#88000000" padding="5">
        <vertical>
          {/* 标题栏 */}
          <linear gravity="center" bg="#AA000000" padding="3">
            <text text="传奇霸主助手" textColor="#FFD700" textSize="13" />
            <text id="status" text=" ⏸ 已停止" textColor="#AAAAAA" textSize="11" />
          </linear>

          {/* 日志区域 */}
          <scroll id="logScroll" height="150">
            <vertical id="logContainer">
              <text id="log1" text="" textColor="#00FF00" textSize="10" line1="true" />
              <text id="log2" text="" textColor="#00FF00" textSize="10" line1="true" />
              <text id="log3" text="" textColor="#00FF00" textSize="10" line1="true" />
              <text id="log4" text="" textColor="#00FF00" textSize="10" line1="true" />
              <text id="log5" text="" textColor="#00FF00" textSize="10" line1="true" />
              <text id="log6" text="" textColor="#00FF00" textSize="10" line1="true" />
              <text id="log7" text="" textColor="#00FF00" textSize="10" line1="true" />
              <text id="log8" text="" textColor="#00FF00" textSize="10" line1="true" />
            </vertical>
          </scroll>

          {/* 统计信息 */}
          <linear gravity="center" bg="#AA333333" padding="2">
            <text id="stats" text="击杀: 0 | 拾取: 0" textColor="#FFFFFF" textSize="10" />
          </linear>

          {/* 控制按钮 */}
          <linear gravity="center" padding="3">
            <button id="btnStop" text="停止" textSize="11" h="30" w="70" />
            <button id="btnDebug" text="调试" textSize="11" h="30" w="50" />
          </linear>
        </vertical>
      </frame>
    );

    // 设置位置
    floatyWindow.setPosition(CONFIG.floaty.x, CONFIG.floaty.y);

    // 设置可拖拽
    floatyWindow.setTouchable(false);

    // 按钮事件
    floatyWindow.btnStop.click(() => {
      Main.stop();
    });

    floatyWindow.btnDebug.click(() => {
      UI.showCurrentScreenText();
    });

    this.log('悬浮窗已创建');
    return floatyWindow;
  },

  /**
   * 添加日志行
   */
  log(msg) {
    if (!floatyWindow) return;

    // 添加到数组
    logLines.push(msg);
    if (logLines.length > MAX_LOG_LINES) {
      logLines.shift();
    }

    // 更新显示
    for (let i = 0; i < MAX_LOG_LINES; i++) {
      let lineNum = i + 1;
      let textView = floatyWindow['log' + lineNum];
      if (textView && logLines[i]) {
        textView.setText(logLines[i]);
      }
    }

    // 滚动到底部
    try {
      floatyWindow.logScroll.scrollToBottom();
    } catch (e) {}
  },

  /**
   * 更新状态
   */
  updateStatus(status, color) {
    if (!floatyWindow) return;
    color = color || '#AAAAAA';
    floatyWindow.status.setText(' ' + status);
    floatyWindow.status.setTextColor(colors.parseColor(color));
  },

  /**
   * 更新统计
   */
  updateStats() {
    if (!floatyWindow) return;
    let s = '击杀: ' + STATE.stats.kills + ' | 拾取: ' + STATE.stats.picks;
    floatyWindow.stats.setText(s);
  },

  /**
   * 关闭
   */
  close() {
    if (floatyWindow) {
      floatyWindow.close();
      floatyWindow = null;
    }
  }
};

// ========== 日志 (同时输出到控制台和悬浮窗) ==========
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
    FloatyUI.log('[WARN][' + tag + '] ' + msg);
  },
  e(tag, msg) {
    console.error('[' + tag + '] ' + msg);
    FloatyUI.log('[ERR][' + tag + '] ' + msg);
  }
};

// ========== UI控件查找 ==========
const UI = {
  /**
   * 点击包含指定文字的控件
   */
  clickText(str, timeout) {
    try {
      timeout = timeout || 5000;
      let el = text(str).clickable(true).findOne(timeout);
      if (el) {
        el.click();
        Log.d('UI', '点击: ' + str);
        return true;
      }
      el = textContains(str).clickable(true).findOne(timeout);
      if (el) {
        el.click();
        Log.d('UI', '点击(含): ' + str);
        return true;
      }
      Log.w('UI', '未找到: ' + str);
      return false;
    } catch (e) {
      Log.e('UI', '点击失败: ' + str);
      return false;
    }
  },

  /**
   * 点击描述
   */
  clickDesc(str, timeout) {
    try {
      timeout = timeout || 5000;
      let el = desc(str).clickable(true).findOne(timeout);
      if (el) {
        el.click();
        return true;
      }
      el = descContains(str).clickable(true).findOne(timeout);
      if (el) {
        el.click();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  /**
   * 点击坐标区域中心
   */
  clickBounds(x1, y1, x2, y2) {
    let cx = Math.floor((x1 + x2) / 2);
    let cy = Math.floor((y1 + y2) / 2);
    click(cx, cy);
    Log.d('UI', '点击坐标: (' + cx + ', ' + cy + ')');
  },

  /**
   * 检测是否存在文字
   */
  existsText(str, timeout) {
    try {
      timeout = timeout || 2000;
      return text(str).exists(timeout) || textContains(str).exists(timeout);
    } catch (e) {
      return false;
    }
  },

  /**
   * 关闭弹窗
   */
  closeDialog() {
    this.clickText('×');
    this.clickText('关闭');
    this.clickText('X');
    this.clickDesc('关闭');
    let w = device.width;
    this.clickBounds(w - 80, 50, w - 30, 100);
  },

  /**
   * 获取屏幕所有文本(调试用)
   */
  getAllText() {
    let texts = [];
    try {
      let els = text().clickable(false).find();
      els.forEach(function(el) {
        let t = el.text();
        if (t && t.length > 0 && t.length < 50) {
          texts.push(t);
        }
      });
    } catch (e) {}
    return texts.slice(0, 20).join(' | ');
  },

  /**
   * 显示当前屏幕文本到日志
   */
  showCurrentScreenText() {
    let txt = this.getAllText();
    Log.i('Debug', '屏幕: ' + txt);
  }
};

// ========== 反挂机答题 ==========
const AntiAfk = {
  // 诗词库
  POETRY_DB: {
    '春眠不觉晓': '处处闻啼鸟',
    '夜来风雨声': '花落知多少',
    '床前明月光': '疑是地上霜',
    '举头望明月': '低头思故乡',
    '白日依山尽': '黄河入海流',
    '欲穷千里目': '更上一层楼',
    '红豆生南国': '春来发几枝',
    '愿君多采撷': '此物最相思',
    '锄禾日当午': '汗滴禾下土',
    '谁知盘中餐': '粒粒皆辛苦'
  },

  /**
   * 检测答题框
   */
  checkDialog() {
    if (UI.existsText('答题')) return true;
    if (UI.existsText('验证')) return true;
    if (UI.existsText('第') && UI.existsText('行')) return true;
    if (UI.existsText('等于') || UI.existsText('乘')) return true;
    return false;
  },

  /**
   * 解析中文数字
   */
  parseChineseNum(str) {
    var map = { '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10 };
    if (map[str] !== undefined) return map[str];
    if (str === '十') return 10;
    if (str.length === 2 && str[0] === '十') return 10 + (map[str[1]] || 0);
    return parseInt(str) || 0;
  },

  /**
   * 解答问题
   */
  solve() {
    var question = '';
    var answer = '';

    try {
      var qEl = textContains('第').findOne(3000);
      if (qEl) question = qEl.text();
    } catch (e) {
      Log.e('AntiAfk', '获取题目失败');
      return;
    }

    Log.i('AntiAfk', '题目: ' + question);

    var m;

    // 唐诗找字
    m = question.match(/第(.)行第(.)个字/);
    if (m) {
      Log.i('AntiAfk', '诗词题，需要手动回答');
      answer = '';
    }

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

  /**
   * 执行
   */
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
  /**
   * 检测战斗状态
   */
  checkCombat() {
    if (UI.existsText('自动')) return true;
    if (UI.existsText('战斗中')) return true;
    if (UI.existsText('攻击')) return true;
    return false;
  },

  /**
   * 开启自动战斗
   */
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

  /**
   * 检测拾取
   */
  checkLoot() {
    if (UI.existsText('拾取')) return true;
    if (UI.existsText('金币')) return true;
    if (UI.existsText('获得')) return true;
    return false;
  },

  /**
   * 拾取
   */
  pickup() {
    UI.clickText('拾取');
    UI.clickText('一键拾取');
    STATE.stats.picks++;
    FloatyUI.updateStats();
    sleep(200);
  },

  /**
   * 战斗循环
   */
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

    Log.i('Daily', '日常完成');
  }
};

// ========== 主控制 ==========
const Main = {
  init() {
    Log.i('Main', '传奇霸主助手 v1.1.0 启动');
    Log.i('Main', '屏幕: ' + device.width + 'x' + device.height);

    if (!requestScreenCapture()) {
      Log.e('Main', '需要截图权限!');
      toast('请授予截图权限');
      return false;
    }

    auto();
    return true;
  },

  start() {
    if (STATE.running) {
      Log.w('Main', '已在运行');
      return;
    }

    if (!this.init()) return;

    // 创建悬浮窗
    FloatyUI.create();

    STATE.running = true;
    STATE.stats.startTime = Date.now();

    FloatyUI.updateStatus('运行中', '#00FF00');

    // 启动线程
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

    // 震动提示
    device.vibrate(200);
  },

  stop() {
    if (!STATE.running) return;

    STATE.running = false;
    FloatyUI.updateStatus('已停止', '#FF6666');

    var duration = Date.now() - STATE.stats.startTime;
    var mins = Math.floor(duration / 60000);

    Log.i('Main', '已停止');
    Log.i('Main', '时长: ' + mins + '分钟');

    device.vibrate(300);

    // 延迟关闭悬浮窗
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
