// auto-agent-bz/modules/anti_afk.js
// 反挂机答题模块 - 包含诗词库和数学解答

/**
 * 中文数字映射
 */
const CHINESE_NUMBERS = {
  '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
  '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
  '十': 10, '百': 100, '千': 1000, '万': 10000
};

/**
 * 完整诗词库 - 常见唐诗
 * 格式: { '诗题': ['第1句', '第2句', '第3句', '第4句'] }
 */
const POETRY_DB = {
  '春晓': ['春眠不觉晓', '处处闻啼鸟', '夜来风雨声', '花落知多少'],
  '相思': ['红豆生南国', '春来发几枝', '愿君多采撷', '此物最相思'],
  '静夜思': ['床前明月光', '疑是地上霜', '举头望明月', '低头思故乡'],
  '悯农': ['锄禾日当午', '汗滴禾下土', '谁知盘中餐', '粒粒皆辛苦'],
  '登鹳雀楼': ['白日依山尽', '黄河入海流', '欲穷千里目', '更上一层楼'],
  '相思': ['红豆生南国', '春来发几枝', '愿君多采撷', '此物最相思'],
  '鹿柴': ['空山不见人', '但闻人语响', '返景入深林', '复照青苔上'],
  '鸟鸣涧': ['人闲桂花落', '夜静春山空', '月出惊山鸟', '时鸣春涧中'],
  '竹里馆': ['独坐幽篁里', '弹琴复长啸', '深林人不知', '明月来相照'],
  '山中': ['荆溪白石出', '天寒红叶稀', '山路元无雨', '空翠湿人衣'],
  '送别': ['山中相送罢', '日暮掩柴扉', '春草年年绿', '王孙归不归'],
  '相思': ['红豆生南国', '春来发几枝', '愿君多采撷', '此物最相思'],
  '杂诗': ['君自故乡来', '应知故乡事', '来日绮窗前', '寒梅著花未'],
  '终南山': ['太乙近天都', '连山到海隅', '白云回望合', '青霭入看无'],
  '观猎': ['风劲角弓鸣', '将军猎渭城', '草枯鹰眼疾', '雪尽马蹄轻'],
  '使至塞上': ['单车欲问边', '属国过居延', '征蓬出汉塞', '归雁入胡天'],
  '山居秋暝': ['空山新雨后', '天气晚来秋', '明月松间照', '清泉石上流'],
  '过故人庄': ['故人具鸡黍', '邀我至田家', '绿树村边合', '青山郭外斜'],
  '游子吟': ['慈母手中线', '游子身上衣', '临行密密缝', '意恐迟迟归'],
  '相思': ['红豆生南国', '春来发几枝', '愿君多采撷', '此物最相思']
};

/**
 * 预存的问题答案库 (从原脚本移植)
 * 格式: { '问题关键字': '答案' }
 */
const KNOWN_ANSWERS = {
  '唐詩中第二行第三個字': '不',
  '唐詩中第三行第四個字': '知',
  '唐詩中第一行第二個字': '眠',
  '唐詩中第四行第一個字': '花',
  '唐詩中第二行第一個字': '處',
  '唐詩中第三行第二個字': '聞',
  '唐詩中第一行第三個字': '曉',
  '唐詩中第四行第三個字': '多',
  '唐詩中第二行第四個字': '曉',
  '唐詩中第三行第一個字': '夜'
};

/**
 * AntiAfk答题器类
 */
class AntiAfkSolver {
  constructor() {
    this.logger = Logger || console;
  }

  /**
   * 解析中文数字
   * @param {string} str 中文数字字符串
   * @returns {number} 阿拉伯数字
   */
  parseChineseNumber(str) {
    if (!str || str.length === 0) return 0;

    str = str.trim();

    // 直接转换
    if (CHINESE_NUMBERS.hasOwnProperty(str)) {
      return CHINESE_NUMBERS[str];
    }

    // 处理十一、十二等
    if (str.length === 2 && str[0] === '十') {
      return 10 + (CHINESE_NUMBERS[str[1]] || 0);
    }

    // 处理十几 (如十三 = 13)
    if (str.length === 2 && str[1] === '十') {
      return (CHINESE_NUMBERS[str[0]] || 0) * 10 + 10;
    }

    // 处理几十几 (如二十三 = 23)
    if (str.length === 3 && str.includes('十')) {
      let parts = str.split('十');
      let tens = CHINESE_NUMBERS[parts[0]] || 0;
      let ones = CHINESE_NUMBERS[parts[1]] || 0;
      return tens * 10 + ones;
    }

    // 尝试直接解析
    let num = parseInt(str);
    return isNaN(num) ? 0 : num;
  }

  /**
   * 查找诗词中指定行指定位置的字
   * @param {string} poemTitle 诗题
   * @param {number} lineNum 行号 (1-4)
   * @param {number} charPos 字符位置 (1-7)
   * @returns {string} 找到的字
   */
  findPoetryChar(poemTitle, lineNum, charPos) {
    let poem = POETRY_DB[poemTitle];
    if (!poem) {
      // 遍历所有诗查找
      for (let title in POETRY_DB) {
        if (POETRY_DB.hasOwnProperty(title)) {
          let p = POETRY_DB[title];
          if (p[lineNum - 1]) {
            let ch = p[lineNum - 1][charPos - 1];
            if (ch) {
              return ch;
            }
          }
        }
      }
      return '';
    }

    if (lineNum < 1 || lineNum > poem.length) {
      return '';
    }

    let line = poem[lineNum - 1];
    if (charPos < 1 || charPos > line.length) {
      return '';
    }

    return line[charPos - 1];
  }

  /**
   * 解答乘法问题
   * @param {string} aStr 第一个数
   * @param {string} bStr 第二个数
   * @returns {number}
   */
  solveMultiply(aStr, bStr) {
    let a = this.parseChineseNumber(aStr);
    let b = this.parseChineseNumber(bStr);
    return a * b;
  }

  /**
   * 解答加法问题
   * @param {string} aStr 第一个数
   * @param {string} bStr 第二个数
   * @returns {number}
   */
  solveAdd(aStr, bStr) {
    let a = this.parseChineseNumber(aStr);
    let b = this.parseChineseNumber(bStr);
    return a + b;
  }

  /**
   * 解答减法问题 (X加几等于Y -> 求被加数)
   * @param {string} aStr 加数
   * @param {string} resultStr 结果
   * @returns {number}
   */
  solveMissingAddend(aStr, resultStr) {
    let a = this.parseChineseNumber(aStr);
    let result = this.parseChineseNumber(resultStr);
    return result - a;
  }

  /**
   * 解析问题并解答
   * @param {string} question 问题文字
   * @returns {string|number} 答案
   */
  solve(question) {
    if (!question) {
      this.logger.w('AntiAfk', '问题为空');
      return '';
    }

    // 统一繁体转简体
    question = question
      .replace(/詩/g, '诗')
      .replace(/個/g, '个')
      .replace(/於/g, '于')
      .replace(/來/g, '来');

    this.logger.d('AntiAfk', '解析问题: ' + question);

    // 检查预存答案库
    for (let key in KNOWN_ANSWERS) {
      if (question.includes(key)) {
        let answer = KNOWN_ANSWERS[key];
        this.logger.i('AntiAfk', '预存答案: ' + answer);
        return answer;
      }
    }

    // 唐诗找字: "唐诗中第X行第Y个字是什么"
    let poetryMatch = question.match(/唐诗中第(.?)行第(.?)个字/);
    if (poetryMatch) {
      let line = this.parseChineseNumber(poetryMatch[1]);
      let pos = this.parseChineseNumber(poetryMatch[2]);
      let answer = this.findPoetryChar(null, line, pos); // 遍历查找
      this.logger.i('AntiAfk', '诗词答案: ' + answer);
      return answer;
    }

    // 乘法: "A乘B等于几"
    let mulMatch = question.match(/(.?)乘(.?)等于/);
    if (mulMatch) {
      let answer = this.solveMultiply(mulMatch[1], mulMatch[2]);
      this.logger.i('AntiAfk', '乘法答案: ' + answer);
      return answer;
    }

    // 加法: "A加B等于？"
    let addMatch = question.match(/(.?)加(.?)等于/);
    if (addMatch) {
      let answer = this.solveAdd(addMatch[1], addMatch[2]);
      this.logger.i('AntiAfk', '加法答案: ' + answer);
      return answer;
    }

    // 找被加数: "A加几等于B"
    let missingMatch = question.match(/(.?)加几等于(.?)/);
    if (missingMatch) {
      let answer = this.solveMissingAddend(missingMatch[1], missingMatch[2]);
      this.logger.i('AntiAfk', '被加数答案: ' + answer);
      return answer;
    }

    this.logger.w('AntiAfk', '无法解答此问题');
    return '';
  }

  /**
   * 检查是否有答题框
   * @returns {boolean}
   */
  checkQuestionDialog() {
    // TODO: 实现实际的游戏UI检测
    // 可以通过找特定图片或文字来判断
    return Image ? Image.findText('第', [0, 0, device.width, device.height]) : false;
  }

  /**
   * 获取答题框内容
   * @returns {string}
   */
  getQuestionText() {
    // TODO: 使用OCR获取问题文字
    // 这里需要根据实际游戏UI来实现
    return '';
  }

  /**
   * 输入答案
   * @param {string|number} answer 答案
   */
  inputAnswer(answer) {
    // TODO: 实现自动输入答案
    // 通常需要:
    // 1. 点击输入框
    // 2. 输入文字
    // 3. 点击确认按钮
    this.logger.i('AntiAfk', '输入答案: ' + answer);
  }

  /**
   * 执行完整答题流程
   */
  execute() {
    if (!this.checkQuestionDialog()) {
      return false;
    }

    let question = this.getQuestionText();
    if (!question) {
      this.logger.e('AntiAfk', '无法获取问题');
      return false;
    }

    let answer = this.solve(question);
    if (answer !== '') {
      this.inputAnswer(answer);
      return true;
    }

    return false;
  }
}

// 导出
module.exports = AntiAfkSolver;
