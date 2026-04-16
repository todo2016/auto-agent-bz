// auto-agent-bz/main.js
// 传奇霸主自动化脚本 - AutoJS版本
// 使用控件查找 + 点击回放方式
// Version: 1.0.2 (修复参数名冲突)

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
    // 检测间隔(ms)
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

  // 背包
  bag: {
    autoOrganize: true,
    autoSell: false,
    autoStorage: false,
  }
};

// ========== 全局状态 ==========
let STATE = {
  running: false,
  answering: false,
  inCombat: false,
  stats: {
    startTime: 0,
    kills: 0,
    picks: 0,
  }
};

// ========== 日志 ==========
const Log = {
  d(tag, msg) { if (CONFIG.logLevel === 'debug') console.log(`[${dateStr()}][${tag}] ${msg}`); },
  i(tag, msg) { console.log(`[${dateStr()}][${tag}] ${msg}`); },
  w(tag, msg) { console.warn(`[${dateStr()}][${tag}] ${msg}`); },
  e(tag, msg) { console.error(`[${dateStr()}][${tag}] ${msg}`); }
};

function dateStr() {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false });
}

// ========== UI控件查找 ==========
const UI = {
  /**
   * 等待并点击包含指定文字的控件
   * @param {string} str 控件文字(支持contains)
   * @param {number} timeout 超时时间
   * @returns {boolean} 是否成功
   */
  clickText(str, timeout = 5000) {
    try {
      let el = text(str).clickable(true).findOne(timeout);
      if (el) {
        el.click();
        Log.d('UI', `点击文本: ${str}`);
        return true;
      }
      // 尝试不完全匹配
      el = textContains(str).clickable(true).findOne(timeout);
      if (el) {
        el.click();
        Log.d('UI', `点击文本(含): ${str}`);
        return true;
      }
      Log.w('UI', `未找到控件: ${str}`);
      return false;
    } catch (e) {
      Log.e('UI', `点击文本失败: ${str}, ${e}`);
      return false;
    }
  },

  /**
   * 点击描述包含指定文字的控件
   */
  clickDesc(str, timeout = 5000) {
    try {
      let el = desc(str).clickable(true).findOne(timeout);
      if (el) {
        el.click();
        Log.d('UI', `点击描述: ${str}`);
        return true;
      }
      el = descContains(str).clickable(true).findOne(timeout);
      if (el) {
        el.click();
        Log.d('UI', `点击描述(含): ${str}`);
        return true;
      }
      Log.w('UI', `未找到描述: ${str}`);
      return false;
    } catch (e) {
      Log.e('UI', `点击描述失败: ${str}, ${e}`);
      return false;
    }
  },

  /**
   * 在指定区域点击
   */
  clickBounds(x1, y1, x2, y2) {
    let cx = Math.floor((x1 + x2) / 2);
    let cy = Math.floor((y1 + y2) / 2);
    click(cx, cy);
    Log.d('UI', `点击坐标: (${cx}, ${cy})`);
  },

  /**
   * 查找是否存在指定文字
   */
  existsText(str, timeout = 2000) {
    try {
      return text(str).exists(timeout) || textContains(str).exists(timeout);
    } catch (e) {
      return false;
    }
  },

  /**
   * 查找是否存在指定描述
   */
  existsDesc(str, timeout = 2000) {
    try {
      return desc(str).exists(timeout) || descContains(str).exists(timeout);
    } catch (e) {
      return false;
    }
  },

  /**
   * 关闭弹窗 - 查找关闭按钮
   */
  closeDialog() {
    // 尝试多种关闭方式
    if (this.clickText('×')) return true;
    if (this.clickText('关闭')) return true;
    if (this.clickText('X')) return true;
    if (this.clickDesc('关闭')) return true;
    // 尝试点击右上角
    let w = device.width;
    this.clickBounds(w - 80, 50, w - 30, 100);
    sleep(200);
    return false;
  },

  /**
   * 获取当前屏幕所有文本(调试用)
   */
  getAllText() {
    let texts = [];
    try {
      let els = text().clickable(false).find();
      els.forEach(function(el) {
        let t = el.text();
        let d = el.desc();
        if (t && t.length > 0) texts.push(t);
        if (d && d.length > 0) texts.push('[' + d + ']');
      });
    } catch (e) {}
    return texts.join(', ');
  }
};

// ========== 反挂机答题 ==========
const AntiAfk = {
  // 诗词库 (从油猴脚本移植)
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
   * 检测是否有答题框
   */
  checkDialog() {
    // 答题框特征文字
    if (UI.existsText('答题')) return true;
    if (UI.existsText('验证')) return true;
    if (UI.existsText('第') && UI.existsText('行')) return true;
    if (UI.existsText('等于') || UI.existsText('乘')) return true;
    return false;
  },

  /**
   * 获取题目中的数字
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

    // 尝试获取题目文字
    try {
      var qEl = textContains('第').findOne(3000);
      if (qEl) {
        question = qEl.text();
      }
    } catch (e) {
      Log.e('AntiAfk', '获取题目失败: ' + e);
      return;
    }

    Log.i('AntiAfk', '识别到题目: ' + question);

    var m;

    // 唐诗找字: 第X行第Y个字
    m = question.match(/第(.)行第(.)个字/);
    if (m) {
      var line = this.parseChineseNum(m[1]);
      var pos = this.parseChineseNum(m[2]);
      Log.i('AntiAfk', '诗词: 第' + line + '行第' + pos + '个字');
      // 简化处理，返回空让用户自己答
      answer = '';
    }

    // 乘法: A乘B等于几
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

    // 输入答案
    if (answer) {
      try {
        // 找输入框
        var input = className('EditText').findOne(2000);
        if (input) {
          input.setText(answer);
          sleep(300);
        }
        // 点击确定
        UI.clickText('确定');
        UI.clickText('确认');
        sleep(500);
      } catch (e) {
        Log.e('AntiAfk', '输入答案失败: ' + e);
      }
    } else {
      Log.w('AntiAfk', '无法解答，请手动答题');
      // 震动提示用户
      device.vibrate(500);
    }
  },

  /**
   * 执行反挂机检测
   */
  execute() {
    if (!CONFIG.antiAfk.enabled) return;
    if (STATE.answering) return;

    if (this.checkDialog()) {
      STATE.answering = true;
      Log.i('AntiAfk', '检测到答题框，开始答题');
      this.solve();
      STATE.answering = false;
    }
  }
};

// ========== 战斗模块 ==========
const Combat = {
  /**
   * 检测是否在战斗中
   */
  checkCombat() {
    // 检查是否有战斗相关UI
    if (UI.existsText('自动')) return true;
    if (UI.existsText('战斗中')) return true;
    if (UI.existsText('攻击')) return true;
    return false;
  },

  /**
   * 开启自动战斗
   */
  enableAutoFight() {
    // 查找并点击自动战斗按钮
    if (UI.clickText('自动')) {
      sleep(500);
      return true;
    }
    // 尝试点击开关按钮
    if (UI.clickText('开')) {
      sleep(300);
      return true;
    }
    return false;
  },

  /**
   * 检测是否有可拾取的物品
   */
  checkLoot() {
    // 拾取物品的特征
    if (UI.existsText('拾取')) return true;
    if (UI.existsText('金币')) return true;
    if (UI.existsText('获得')) return true;
    return false;
  },

  /**
   * 拾取物品
   */
  pickup() {
    UI.clickText('拾取');
    UI.clickText('一键拾取');
    sleep(200);
  },

  /**
   * 战斗主循环
   */
  loop() {
    while (STATE.running) {
      if (STATE.answering) {
        sleep(1000);
        continue;
      }

      // 检测答题
      AntiAfk.execute();

      // 检测拾取
      if (this.checkLoot()) {
        this.pickup();
      }

      // 确保自动战斗开启
      if (!this.checkCombat()) {
        this.enableAutoFight();
      }

      sleep(CONFIG.combat.checkInterval);
    }
  }
};

// ========== 日常任务 ==========
const Daily = {
  /**
   * 执行日常任务
   */
  execute() {
    if (!CONFIG.daily.enabled) return;

    Log.i('Daily', '执行日常任务');

    // 打开日常界面
    if (UI.clickText('日常')) {
      sleep(500);
    }

    // 领取奖励
    UI.clickText('领取');
    sleep(300);
    UI.clickText('确定');
    sleep(200);

    // 关闭弹窗
    UI.closeDialog();

    Log.i('Daily', '日常任务完成');
  }
};

// ========== 主控制 ==========
const Main = {
  /**
   * 初始化
   */
  init: function() {
    Log.i('Main', '传奇霸主自动化 v1.0.2 启动');
    Log.i('Main', '屏幕: ' + device.width + 'x' + device.height);

    // 请求截图权限
    if (!requestScreenCapture()) {
      Log.e('Main', '截图权限失败');
      toast('请授予截图权限');
      return false;
    }

    // 启用无障碍服务
    auto();
    Log.i('Main', '无障碍服务已启用');
    return true;
  },

  /**
   * 启动自动化
   */
  start: function() {
    if (STATE.running) {
      Log.w('Main', '已在运行');
      return;
    }

    if (!this.init()) return;

    STATE.running = true;
    STATE.stats.startTime = Date.now();

    Log.i('Main', '自动化已启动');

    // 启动战斗线程
    threads.start(function() {
      Combat.loop();
    });

    // 启动日常任务线程
    threads.start(function() {
      while (STATE.running) {
        Daily.execute();
        sleep(CONFIG.daily.interval);
      }
    });

    // 显示调试信息
    this.showDebug();
  },

  /**
   * 停止自动化
   */
  stop: function() {
    if (!STATE.running) return;

    STATE.running = false;
    var duration = Date.now() - STATE.stats.startTime;
    var mins = Math.floor(duration / 60000);

    Log.i('Main', '自动化已停止');
    Log.i('Main', '运行时长: ' + mins + '分钟');
    Log.i('Main', '击杀: ' + STATE.stats.kills + ', 拾取: ' + STATE.stats.picks);
  },

  /**
   * 显示当前屏幕文本(调试用)
   */
  showDebug: function() {
    threads.start(function() {
      while (STATE.running) {
        Log.d('Debug', '屏幕文本: ' + UI.getAllText().substring(0, 150));
        sleep(5000);
      }
    });
  }
};

// ========== 入口 ==========
// 自动启动
Main.start();

// 摇晃停止
events.observeKey();
events.onKeyDown('volume_down', function() {
  Log.i('Main', '检测到按键，停止脚本');
  Main.stop();
  exit();
});

// 保持运行
while (STATE.running) {
  sleep(1000);
}
