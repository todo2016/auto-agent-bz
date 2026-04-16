// auto-agent-bz/config.js
// 配置文件 - 便于单独管理和修改

/**
 * 用户配置区
 * 修改这里的配置后保存即可生效
 */

const USER_CONFIG = {
  // ========== 基础设置 ==========

  // 运行模式: 0=元宝模式, 1=打玉模式, 2=大号模式
  mode: 1,

  // 日志级别: debug, info, warn, error
  logLevel: 'info',

  // 是否自动启动
  autoStart: false,

  // ========== 战斗设置 ==========

  combat: {
    // 是否启用自动战斗
    enabled: true,

    // 攻击范围 (格子数)
    attackRange: 6,

    // AoE拉怪切片数量
    sliceCount: 6,

    // 优先攻击的怪物名称关键字
    priorityKeywords: ['至尊', 'BOSS', '首领'],

    // 跳过攻击的怪物名称关键字
    skipKeywords: [],

    // 附近有这些玩家时不抢怪 (白名单)
    playerWhitelist: ['队友1', '队友2'],

    // 检测间隔 (毫秒)
    checkInterval: 1000
  },

  // ========== 地图设置 ==========

  map: {
    // 自动切换地图
    autoChange: true,

    // 切换地图间隔 (毫秒)
    changeInterval: 30000,

    // 是否使用随机石
    useRandomStone: true,

    // 是否使用小飞鞋
    useFeiXie: true,

    // 是否使用神殿卷轴
    useShenDian: true,

    // 传送历史记录上限
    deliverHistoryLimit: 10
  },

  // ========== 物品设置 ==========

  items: {
    // 自动拾取物品 (留空表示拾取所有)
    // 格式: [物品ID1, 物品ID2, ...]
    autoPickup: [],

    // 自动出售物品
    autoSell: [3000925, 3000926, 3000927],

    // 自动存仓物品
    autoStorage: [3000002, 3022812],

    // 自动使用的消耗品
    autoUse: [3000308, 3000309, 4617, 4619],

    // 垃圾物品 (直接丢弃)
    garbage: [3000858, 3000859, 3000860]
  },

  // ========== 反挂机设置 ==========

  antiAfk: {
    // 是否启用
    enabled: true,

    // 检测问题等待时间 (毫秒)
    waitTime: 30000,

    // 检测间隔 (毫秒)
    checkInterval: 2000
  },

  // ========== 日常任务设置 ==========

  daily: {
    // 是否启用
    enabled: true,

    // 自动领取VIP奖励
    vipReward: true,

    // 自动购买商店物品
    shopBuy: true,

    // 自动完成任务
    tasks: true,

    // 自动扫荡副本
    dungeon: true,

    // 执行间隔 (毫秒)
    interval: 60000
  },

  // ========== 背包设置 ==========

  bag: {
    // 自动整理背包
    autoOrganize: true,

    // 背包满时自动存仓
    autoStorageWhenFull: true,

    // 背包容量阈值 (低于此数量时提醒)
    warningThreshold: 5
  },

  // ========== 屏幕坐标设置 ==========
  // 注意: 这些是基于1080x1920屏幕的默认值
  // 需要根据实际屏幕分辨率调整

  screen: {
    // 屏幕宽度
    width: 1080,

    // 屏幕高度
    height: 1920,

    // 按钮位置 (格式: [x1, y1, x2, y2])
    buttons: {
      // 关闭按钮
      close: [1000, 100, 1050, 150],

      // 地图按钮
      map: [900, 800, 1050, 950],

      // 背包按钮
      bag: [50, 900, 200, 1050],

      // 商店按钮
      shop: [900, 100, 1050, 250],

      // 自动战斗按钮 (待确认)
      autoFight: [950, 50, 1050, 150],

      // 传送确认
      teleportConfirm: [500, 600, 600, 700],

      // 答题确认
      answerConfirm: [500, 500, 600, 600],

      // 拾取确认
      pickup: [400, 500, 500, 600],

      // ========== 以下从截图提取的坐标 ==========

      // 整理背包 (背包界面)
      organize: [870, 240, 950, 300],

      // 打造按钮 (底部导航)
      craft: [180, 880, 280, 960],

      // 升阶按钮 (底部导航)
      upgrade: [380, 880, 480, 960],

      // 熔炼按钮 (底部导航)
      smelt: [580, 880, 680, 960],

      // 兑换按钮 (底部导航)
      exchange: [780, 880, 880, 960],

      // 打星按钮 (强化界面左侧)
      hitStar: [30, 820, 100, 900],

      // 必定成功按钮 (强化界面右下)
      guaranteeSuccess: [820, 880, 920, 960],

      // 一键追踪按钮
      trace: [200, 170, 340, 220],

      // 强化按钮 (顶部)
      strengthen: [900, 70, 1000, 130]
    }
  }
};

/**
 * 导出配置
 */
module.exports = USER_CONFIG;
