// data_compliance.js — 《逆道西行》合规信息配置
// 上线前必填：版号 / 运营主体 / 客服邮箱
// 修改本文件后，递增 index.html 中 data_compliance.js 的 ?v= 版本号

NDX.COMPLIANCE = {
  // —— 版号信息（取得版号后填写）——
  // 示例：{ number: 'ISBN 978-7-XXXX-XXXX-X', publisher: 'XX出版社', approveDate: '2026-XX-XX' }
  banhao: {
    number: '',           // 版号 / ISBN
    publisher: '',        // 出版单位
    approveDate: '',      // 审批日期
    note: '版号申请中，取得后将在此展示'  // 未取得时的提示
  },

  // —— 运营主体（公司/个人主体名称）——
  operator: {
    name: '',             // 主体名称（公司全称或个人姓名）
    type: '',             // 主体类型（有限责任公司 / 个体工商户 / 个人）
    address: '',          // 联系地址（可选）
    note: '运营主体信息待补充'
  },

  // —— 客服反馈 ——
  support: {
    email: '',            // 客服邮箱
    responseTime: '15个工作日',  // 答复时限
    note: '客服邮箱待补充'
  },

  // —— 适龄提示 ——
  ageRating: {
    age: 16,              // 适龄年龄
    desc: '本游戏含黑暗、暴力及宗教思辨内容，建议年满 16 周岁游玩'
  },

  // —— 隐私政策 / 用户协议更新日期 ——
  policyDate: '2026-09-01',
  termsDate: '2026-09-01',

  // —— 辅助函数：是否已填写完整 ——
  isComplete() {
    return !!(this.banhao.number && this.operator.name && this.support.email);
  },

  // —— 辅助函数：获取待填项列表 ——
  pendingItems() {
    const items = [];
    if (!this.banhao.number) items.push('版号信息');
    if (!this.operator.name) items.push('运营主体');
    if (!this.support.email) items.push('客服邮箱');
    return items;
  }
};
