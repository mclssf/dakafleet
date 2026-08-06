<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  BookOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  FileSearchOutlined,
  MessageOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  UploadOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { correctionMemories, removeCorrectionMemory } from './dictMemory';

type EmployeeKind = 'TMS' | '微信群';
type LoginType = '短信验证码' | '手机扫码' | '图形验证码' | '无验证';
type ConfigTab = 'employees' | 'wechatGroups' | 'dictionary';

// 企业字典：开集字段走别名映射，闭集字段绑主数据做纠错，跨字段用联动规则
type DictTab = 'alias' | 'controlled' | 'rules';
type MatchMode = '精确' | '包含' | '正则';
type AliasSource = '手工录入' | '历史挖掘' | '用户修正';
// 维度可由运营自行扩展（磅单、报销等不同单据的字段），因此用字符串而非固定联合类型
type DictDimension = string;

interface DictAlias {
  text: string;
  mode: MatchMode;
  priority: number;
  source: AliasSource;
}

interface DictEntry {
  id: string;
  dimension: DictDimension;
  standard: string;
  code?: string;
  enterpriseId: string;
  projectId?: string;
  aliases: DictAlias[];
  hitCount: number;
  lastHitAt?: string;
  enabled: boolean;
}

// 历史数据挖掘出的疑似同义组，待运营确认合并
interface DictCandidate {
  id: string;
  dimension: DictDimension;
  similarity: number;
  values: Array<{ text: string; count: number }>;
}

// 受控值集：车牌/司机/客户绑定车辆档案，只做纠错不建别名
interface ControlledField {
  key: string;
  label: string;
  source: string;
  valueCount: number;
  desc: string;
}

// 线路白名单：装货地 + 卸货地 → 标准线路，用户可自行新增
interface RouteRule {
  id: string;
  enterpriseId: string;
  loadingPlace: string;
  unloadingPlace: string;
  route: string;
  enabled: boolean;
}

// R3 客户 → 允许货物；R4 货物 → 允许矿别。结构相同，都是「主体 + 允许值清单」
interface AllowRule {
  id: string;
  enterpriseId: string;
  subject: string;
  allowed: string[];
  enabled: boolean;
}

interface WechatGroup {
  id: string;
  enterpriseId: string;
  projectId: string;
  name: string;
  project: string;
  ownerName: string;
  ownerAvatar: string;
  avatarColor: string;
  memberCount: number;
  lastActiveAt: string;
  sampleTopic: string;
}

interface DataEmployee {
  id: string;
  kind: EmployeeKind;
  enterpriseId?: string;
  enterpriseCid?: string;
  projectId?: string;
  name: string;
  description: string;
  loginUrl?: string;
  loginType?: LoginType;
  groupIds?: string[];
  skillVersion: string;
  skillUpdated: string;
  skillFileName: string;
  skillContent: string;
}

interface ValidationResult {
  checkedAt: string;
  entity: Record<string, string>;
  fieldNames: string[];
  message: string;
  sourceImages?: string[];
  sourceText?: string;
  success: boolean;
}

interface TenantEnterprise {
  id: string;
  name: string;
  shortName: string;
}

interface TenantProject {
  id: string;
  enterpriseId: string;
  name: string;
}

const loginTypes: LoginType[] = ['无验证', '图形验证码', '短信验证码', '手机扫码'];
const activeTab = ref<ConfigTab>('employees');
const isEmployeeModalOpen = ref(false);
const isValidationModalOpen = ref(false);
const editingEmployeeId = ref('');
const selectedEmployeeId = ref('wechat-yunnan-coal');
const validatingEmployee = ref<DataEmployee | null>(null);
const validationResult = ref<ValidationResult | null>(null);
const validationForm = reactive({
  graphicCode: '',
  password: '',
  smsCode: '',
  username: ''
});
const employeeForm = reactive({
  description: '',
  enterpriseId: '',
  enterpriseCid: '',
  groupSearch: '',
  groupIds: [] as string[],
  kind: '微信群' as EmployeeKind,
  loginType: '无验证' as LoginType,
  loginUrl: '',
  name: '',
  projectId: '',
  skillContent: '',
  skillFileName: ''
});

const tenantEnterprises: TenantEnterprise[] = [
  { id: 'southwest-line', name: '西南干线物流有限公司', shortName: '西南干线物流' },
  { id: 'qujing-jieyun', name: '曲靖捷运供应链有限公司', shortName: '曲靖捷运' },
  { id: 'huayin-logistics', name: '广西华银物流运营有限公司', shortName: '华银物流' },
  { id: 'zhaotong-energy', name: '昭通能源运输有限公司', shortName: '昭通能源' },
  { id: 'hailuo-cement', name: '黔西南海螺水泥物流中心', shortName: '海螺水泥' },
  { id: 'dianzhong-material', name: '滇中新材料供应链有限公司', shortName: '滇中新材料' },
  { id: 'baise-mining', name: '百色矿业运输中心', shortName: '百色矿业' }
];

const tenantProjects: TenantProject[] = [
  { id: 'p-yunnan-coal', enterpriseId: 'southwest-line', name: '云南煤炭储配运输项目' },
  { id: 'p-qujing-sand', enterpriseId: 'qujing-jieyun', name: '曲靖城建砂石配送项目' },
  { id: 'p-huayin-alumina', enterpriseId: 'huayin-logistics', name: '广西华银氧化铝运输项目' },
  { id: 'p-zhaotong-coal', enterpriseId: 'zhaotong-energy', name: '昭通电煤干线运输项目' },
  { id: 'p-hailuo-clinker', enterpriseId: 'hailuo-cement', name: '黔西南水泥熟料配送项目' },
  { id: 'p-dianzhong-powder', enterpriseId: 'dianzhong-material', name: '滇中新能源矿粉转运项目' },
  { id: 'p-baise-bauxite', enterpriseId: 'baise-mining', name: '百色铝土矿短倒项目' }
];

const wechatGroups = ref<WechatGroup[]>([
  {
    id: 'wx-weigh-yunzhi',
    enterpriseId: 'southwest-line',
    projectId: 'p-yunnan-coal',
    name: '云南云志合通·磅单回传群',
    project: '砚山储配站煤炭运输',
    ownerName: '罗队长',
    ownerAvatar: '罗',
    avatarColor: '#0f766e',
    memberCount: 86,
    lastActiveAt: '09:42',
    sampleTopic: '装货磅单、到货磅单、吨位差复核'
  },
  {
    id: 'wx-weigh-yunzhi-review',
    enterpriseId: 'southwest-line',
    projectId: 'p-yunnan-coal',
    name: '云南煤炭储配项目·异常磅差复核群',
    project: '云南煤炭储配运输项目',
    ownerName: '高调度',
    ownerAvatar: '高',
    avatarColor: '#475569',
    memberCount: 42,
    lastActiveAt: '10:26',
    sampleTopic: '复磅说明、异常吨位、司机补传照片'
  },
  {
    id: 'wx-expense-qujing',
    enterpriseId: 'qujing-jieyun',
    projectId: 'p-qujing-sand',
    name: '曲靖城建砂石运输报销群',
    project: '曲靖城建砂石配送',
    ownerName: '曹财务',
    ownerAvatar: '曹',
    avatarColor: '#f77113',
    memberCount: 53,
    lastActiveAt: '10:18',
    sampleTopic: '司机报销、付款对象、票据照片'
  },
  {
    id: 'wx-fuel-qujing',
    enterpriseId: 'qujing-jieyun',
    projectId: 'p-qujing-sand',
    name: '曲靖城建砂石项目·加油小票群',
    project: '曲靖城建砂石配送项目',
    ownerName: '邓运营',
    ownerAvatar: '邓',
    avatarColor: '#b45309',
    memberCount: 47,
    lastActiveAt: '09:05',
    sampleTopic: '油费小票、车牌、升数、加油站'
  },
  {
    id: 'wx-fuel-huayin',
    enterpriseId: 'huayin-logistics',
    projectId: 'p-huayin-alumina',
    name: '广西华银铝业加油对账群',
    project: '广西华银氧化铝干线',
    ownerName: '覃经理',
    ownerAvatar: '覃',
    avatarColor: '#686ba6',
    memberCount: 71,
    lastActiveAt: '08:56',
    sampleTopic: '油站小票、升数、油费金额'
  },
  {
    id: 'wx-charge-zhaotong',
    enterpriseId: 'zhaotong-energy',
    projectId: 'p-zhaotong-coal',
    name: '昭通能源电煤充电补能群',
    project: '昭通能源电煤运输',
    ownerName: '马调度',
    ownerAvatar: '马',
    avatarColor: '#0b8794',
    memberCount: 64,
    lastActiveAt: '11:03',
    sampleTopic: '充电桩账单、补能度数、等待时长'
  },
  {
    id: 'wx-repair-hailuo',
    enterpriseId: 'hailuo-cement',
    projectId: 'p-hailuo-clinker',
    name: '黔西南海螺维修协同群',
    project: '海螺水泥熟料运输',
    ownerName: '韦修车',
    ownerAvatar: '韦',
    avatarColor: '#7c2d12',
    memberCount: 39,
    lastActiveAt: '昨天 18:21',
    sampleTopic: '维修项目、配件、工时、故障照片'
  },
  {
    id: 'wx-weigh-diff',
    enterpriseId: 'dianzhong-material',
    projectId: 'p-dianzhong-powder',
    name: '滇中新材料异常磅差复核群',
    project: '滇中新材料矿粉运输',
    ownerName: '沈运营',
    ownerAvatar: '沈',
    avatarColor: '#334155',
    memberCount: 45,
    lastActiveAt: '昨天 16:40',
    sampleTopic: '磅差、复磅说明、异常照片'
  },
  {
    id: 'wx-toll-baise',
    enterpriseId: 'baise-mining',
    projectId: 'p-baise-bauxite',
    name: '百色矿业司机过路费群',
    project: '百色矿业铝土矿运输',
    ownerName: '陆会计',
    ownerAvatar: '陆',
    avatarColor: '#a16207',
    memberCount: 58,
    lastActiveAt: '07:35',
    sampleTopic: '高速通行费、ETC截图、路线说明'
  }
]);

// ===== 企业字典 =====
// 维度可增删：内置磅单 / 报销常用维度，运营可为其它单据自行新增
const dictDimensions = ref<DictDimension[]>(['发货单位', '收货单位', '客户', '货物名称', '线路', '磅单员', '报销费用类型', '收款方']);

const dictEntries = ref<DictEntry[]>([
  {
    id: 'dict-1',
    dimension: '发货单位',
    standard: '云南省煤炭交易（储配）中心有限公司',
    code: 'CUST-001',
    enterpriseId: 'southwest-line',
    projectId: 'p-yunnan-coal',
    aliases: [
      { text: '云南煤炭交易中心', mode: '精确', priority: 1, source: '手工录入' },
      { text: '煤炭储配中心', mode: '精确', priority: 2, source: '历史挖掘' },
      { text: '云南省煤炭交易', mode: '包含', priority: 3, source: '手工录入' }
    ],
    hitCount: 12,
    lastHitAt: '2026-06-29',
    enabled: true
  },
  {
    id: 'dict-2',
    dimension: '货物名称',
    standard: '氧化铝',
    code: 'GOODS-003',
    enterpriseId: 'huayin-logistics',
    aliases: [
      { text: '散装氧化铝', mode: '精确', priority: 1, source: '历史挖掘' },
      { text: '氧化铝粉', mode: '精确', priority: 2, source: '手工录入' }
    ],
    hitCount: 9,
    lastHitAt: '2026-06-28',
    enabled: true
  },
  {
    id: 'dict-3',
    dimension: '收货单位',
    standard: '曲靖园区料场',
    enterpriseId: 'qujing-jieyun',
    projectId: 'p-qujing-sand',
    aliases: [{ text: '曲靖料场', mode: '精确', priority: 1, source: '历史挖掘' }],
    hitCount: 4,
    lastHitAt: '2026-06-27',
    enabled: true
  },
  {
    id: 'dict-4',
    dimension: '客户',
    standard: '云志合通科技（云南）有限公司',
    code: 'CARR-001',
    enterpriseId: 'southwest-line',
    aliases: [
      { text: '云志合通', mode: '包含', priority: 1, source: '手工录入' },
      { text: '云南云志合通', mode: '精确', priority: 2, source: '手工录入' }
    ],
    hitCount: 9,
    lastHitAt: '2026-06-29',
    enabled: true
  },
  {
    id: 'dict-5',
    dimension: '磅单员',
    standard: '伍敏通',
    enterpriseId: 'southwest-line',
    aliases: [
      { text: '伍敏', mode: '精确', priority: 1, source: '历史挖掘' },
      { text: '五敏通', mode: '精确', priority: 2, source: '历史挖掘' }
    ],
    hitCount: 4,
    lastHitAt: '2026-06-29',
    enabled: true
  },
  {
    id: 'dict-6',
    dimension: '报销费用类型',
    standard: '补电费',
    enterpriseId: 'huayin-logistics',
    aliases: [
      { text: '充电费', mode: '精确', priority: 1, source: '历史挖掘' },
      { text: '电费', mode: '精确', priority: 2, source: '历史挖掘' },
      { text: '补电', mode: '包含', priority: 3, source: '手工录入' }
    ],
    hitCount: 5,
    lastHitAt: '2026-06-29',
    enabled: true
  },
  {
    id: 'dict-7',
    dimension: '线路',
    standard: '砚山→靖西天桂',
    enterpriseId: 'southwest-line',
    projectId: 'p-yunnan-coal',
    aliases: [
      { text: '砚山-靖西', mode: '精确', priority: 1, source: '历史挖掘' },
      { text: '砚山一靖西', mode: '精确', priority: 2, source: '历史挖掘' }
    ],
    hitCount: 6,
    lastHitAt: '2026-06-28',
    enabled: true
  }
]);

const dictCandidates = ref<DictCandidate[]>([
  {
    id: 'cand-1',
    dimension: '发货单位',
    similarity: 92,
    values: [
      { text: '云南省煤炭交易（储配）中心有限公司', count: 2 },
      { text: '云南煤炭交易中心', count: 2 }
    ]
  },
  {
    id: 'cand-2',
    dimension: '磅单员',
    similarity: 88,
    values: [
      { text: '陈会计', count: 6 },
      { text: '陈会记', count: 1 }
    ]
  },
  {
    id: 'cand-3',
    dimension: '货物名称',
    similarity: 85,
    values: [
      { text: '砂石料', count: 4 },
      { text: '机制砂', count: 2 }
    ]
  }
]);

const controlledFields: ControlledField[] = [
  { key: 'vehiclePlate', label: '车牌号', source: '车辆档案 vehicles.plate', valueCount: 54, desc: '字符纠错表归一后回档案精确校验，不在档标疑点' },
  { key: 'driver', label: '驾驶员', source: '车辆档案 vehicles.driver', valueCount: 54, desc: '优先按车牌联动反查，识别文本仅做同音/形近确认' },
  { key: 'carrier', label: '客户', source: '车辆档案 vehicles.owner', valueCount: 3, desc: '按车牌联动反查；别名字典兜底（如「云志合通」简称）' },
  { key: 'shipper', label: '发货单位', source: '企业字典「发货单位」维度 + 项目线路映射', valueCount: 5, desc: '别名归一到标准值；同时作为线路匹配的发货端依据' },
  { key: 'receiver', label: '收货单位', source: '企业字典「收货单位」维度 + 项目线路映射', valueCount: 6, desc: '别名归一到标准值；同时作为线路匹配的收货端依据' },
  { key: 'maker', label: '磅单员', source: '企业字典「磅单员」维度（历史数据映射）', valueCount: 4, desc: '无内部人员表，按历史磅单聚合出常用制单人，错字走别名归一（如 陈会记→陈会计）' }
];

// 车牌 OCR 字符混淆对：全局一张表，双向纠错
const plateConfusionPairs = ref<Array<{ a: string; b: string }>>([
  { a: '0', b: 'O' },
  { a: '1', b: 'I' },
  { a: '8', b: 'B' },
  { a: '2', b: 'Z' },
  { a: '5', b: 'S' },
  { a: '6', b: 'G' },
  { a: '4', b: 'A' }
]);

const routeRules = ref<RouteRule[]>([
  { id: 'route-1', enterpriseId: 'southwest-line', loadingPlace: '云南省煤炭交易（储配）中心有限公司', unloadingPlace: '广西德保电厂', route: '砚山→德保电厂', enabled: true },
  { id: 'route-2', enterpriseId: 'southwest-line', loadingPlace: '云南砚山矿务', unloadingPlace: '靖西天桂铝业', route: '砚山→靖西天桂', enabled: true },
  { id: 'route-3', enterpriseId: 'huayin-logistics', loadingPlace: '广西华银铝业', unloadingPlace: '田东华银料场', route: '华银→田东', enabled: true },
  { id: 'route-4', enterpriseId: 'qujing-jieyun', loadingPlace: '富源采石场', unloadingPlace: '曲靖园区料场', route: '富源采石场→曲靖园区', enabled: true }
]);

// 联动规则可配置：启用开关 + 冲突动作
type RuleAction = '自动纠正并标疑点' | '仅标疑点';

const linkRules = ref([
  { id: 'R1', name: '车牌 → 驾驶员 / 客户 / 挂车', desc: '按车辆档案反查，识别结果与档案不符时按冲突动作处理', kind: '档案联动', enabled: true, action: '自动纠正并标疑点' as RuleAction },
  { id: 'R2', name: '装货地 + 卸货地 → 线路白名单', desc: '组合不在下方白名单内时按冲突动作处理；白名单支持运营自行新增映射', kind: '白名单', enabled: true, action: '仅标疑点' as RuleAction },
  { id: 'R3', name: '客户 → 允许货物', desc: '如华银铝业只应出现氧化铝类货物，越界按冲突动作处理', kind: '约束', enabled: false, action: '仅标疑点' as RuleAction },
  { id: 'R4', name: '货物 → 允许矿别', desc: '如褐煤32只应对应矿别 32-2，越界按冲突动作处理', kind: '约束', enabled: false, action: '仅标疑点' as RuleAction }
]);

// R3/R4 映射表：预置值取自真实磅单组合
const customerGoodsRules = ref<AllowRule[]>([
  { id: 'cg-1', enterpriseId: 'huayin-logistics', subject: '广西华银铝业', allowed: ['氧化铝', '散装氧化铝'], enabled: true },
  { id: 'cg-2', enterpriseId: 'huayin-logistics', subject: '田东华银料场', allowed: ['氧化铝'], enabled: true },
  { id: 'cg-3', enterpriseId: 'southwest-line', subject: '广西德保电厂', allowed: ['褐煤32'], enabled: true },
  { id: 'cg-4', enterpriseId: 'qujing-jieyun', subject: '曲靖园区料场', allowed: ['砂石料', '机制砂'], enabled: true }
]);

const goodsMineRules = ref<AllowRule[]>([
  { id: 'gm-1', enterpriseId: 'southwest-line', subject: '褐煤32', allowed: ['32-2'], enabled: true },
  { id: 'gm-2', enterpriseId: 'huayin-logistics', subject: '氧化铝', allowed: ['A-20', 'A-21', 'H-06', 'H-08'], enabled: true },
  { id: 'gm-3', enterpriseId: 'qujing-jieyun', subject: '砂石料', allowed: ['S-02'], enabled: true },
  { id: 'gm-4', enterpriseId: 'qujing-jieyun', subject: '机制砂', allowed: ['M-11'], enabled: true }
]);

const dataEmployees = ref<DataEmployee[]>([
  {
    id: 'wechat-yunnan-coal',
    kind: '微信群',
    enterpriseId: 'southwest-line',
    projectId: 'p-yunnan-coal',
    name: '云南煤炭储配运输项目·磅单微信群数据员工',
    description: '仅对西南干线物流有限公司可见，进入该项目磅单与磅差复核群，生成标准磅单字段。',
    groupIds: ['wx-weigh-yunzhi', 'wx-weigh-yunzhi-review'],
    skillVersion: 'v1.4',
    skillUpdated: '今天 09:50',
    skillFileName: 'wechat-weighbill-recognition.skill.md',
    skillContent: `# 微信群磅单识别 Skill

目标：进入运营人员指定的磅单微信群，读取最近消息中的文字和图片，提取可入账的磅单结构化字段。

识别范围：
1. 群名称包含“磅单”“磅差”“复核”的微信群。
2. 消息文字中出现车牌、司机、装货/到货、吨位、起止地时优先作为实体线索。
3. 图片优先识别磅单照片，读取毛重、皮重、净重、货物、发货单位、收货单位和磅单时间。

字段映射：
- 群名称 -> source_group_name
- 消息发送时间 -> message_time
- 车牌 -> vehicle_plate
- 司机姓名 -> driver_name
- 磅单类型 -> weigh_type
- 货物名称 -> cargo_name
- 净重 -> net_weight
- 装货地/到货地 -> origin_name / destination_name
- 原图引用 -> raw_image_ref`
  },
  {
    id: 'wechat-qujing-expense',
    kind: '微信群',
    enterpriseId: 'qujing-jieyun',
    projectId: 'p-qujing-sand',
    name: '曲靖城建砂石配送项目·费用微信群数据员工',
    description: '仅对曲靖捷运供应链有限公司可见，识别该项目报销群和加油小票群中的费用明细。',
    groupIds: ['wx-expense-qujing', 'wx-fuel-qujing'],
    skillVersion: 'v1.2',
    skillUpdated: '昨天 20:10',
    skillFileName: 'wechat-expense-recognition.skill.md',
    skillContent: `# 微信群费用识别 Skill

目标：从司机报销微信群中识别文字描述和票据图片，形成待财务审核的费用结构化数据。

识别范围：
1. 群名称包含“报销”“加油”“过路费”的微信群。
2. 文本中出现车牌、司机、金额、费用类型、收款人时直接抽取。
3. 图片中识别发票、小票、ETC截图和付款码截图，补齐金额、商户、发生时间。

字段映射：
- 群名称 -> source_group_name
- 发送人 -> sender_name
- 车牌 -> vehicle_plate
- 司机 -> driver_name
- 费用类型 -> expense_type
- 金额 -> amount
- 付款对象 -> payee
- 票据图片 -> voucher_image_ref
- 审核状态 -> audit_status`
  },
  {
    id: 'wechat-zhaotong-energy',
    kind: '微信群',
    enterpriseId: 'zhaotong-energy',
    projectId: 'p-zhaotong-coal',
    name: '昭通电煤干线运输项目·补能微信群数据员工',
    description: '仅对昭通能源运输有限公司可见，接入该项目充电补能群并识别补能账单和等待时长。',
    groupIds: ['wx-charge-zhaotong'],
    skillVersion: 'v1.0',
    skillUpdated: '07-02 17:33',
    skillFileName: 'wechat-energy-repair.skill.md',
    skillContent: `# 微信群补能维修识别 Skill

目标：从充电补能群和维修协同群中抽取新能源车补能费用、维修费用和异常事件。

识别范围：
1. 充电账单图片：识别充电站、度数、金额、开始/结束时间。
2. 维修照片和文字：识别维修项目、配件、工时、维修厂和车牌。
3. 若消息出现“抛锚”“待救援”“无法发车”，标记为高优先级事件。

字段映射：
- 群名称 -> source_group_name
- 车牌 -> vehicle_plate
- 费用类型 -> expense_type
- 项目明细 -> expense_item
- 金额 -> amount
- 事件等级 -> risk_level
- 图片引用 -> raw_image_ref`
  },
]);

const selectedEmployee = computed(() => dataEmployees.value.find((employee) => employee.id === selectedEmployeeId.value) ?? dataEmployees.value[0]);
const isEditingEmployee = computed(() => editingEmployeeId.value.length > 0);
const employeeFormTitle = computed(() => `${isEditingEmployee.value ? '编辑' : '增加'}数据员工（${employeeForm.kind}）`);
const employeeFormConfirmText = computed(() => (isEditingEmployee.value ? '保存' : '确认增加'));
const wechatEmployeeCount = computed(() => dataEmployees.value.filter((employee) => employee.kind === '微信群').length);
const linkedWechatGroupCount = computed(() => new Set(dataEmployees.value.flatMap((employee) => (employee.kind === '微信群' ? employee.groupIds ?? [] : []))).size);
const currentValidationLoginType = computed(() => validatingEmployee.value?.loginType ?? '无验证');
const formProjects = computed(() => tenantProjects.filter((project) => project.enterpriseId === employeeForm.enterpriseId));
const formSelectedGroups = computed(() => (employeeForm.groupIds ?? []).map(groupById).filter((group): group is WechatGroup => Boolean(group)));
const formGroupSearchResults = computed(() => {
  const keyword = employeeForm.groupSearch.trim();
  if (!keyword) return [];
  return wechatGroups.value
    .filter((group) => group.enterpriseId === employeeForm.enterpriseId)
    .filter((group) => !employeeForm.projectId || group.projectId === employeeForm.projectId)
    .filter((group) => !employeeForm.groupIds.includes(group.id))
    .filter((group) => [group.name, group.project, group.ownerName, group.sampleTopic].some((value) => value.includes(keyword)))
    .slice(0, 8);
});

const opsMenuItems: Array<{ desc: string; icon: unknown; id: ConfigTab; label: string }> = [
  { id: 'employees', label: '数据员工配置', desc: '微信群、Skill 与验证', icon: TeamOutlined },
  { id: 'wechatGroups', label: '微信群列表', desc: '底层可接入的运营微信群', icon: MessageOutlined },
  { id: 'dictionary', label: '企业字典', desc: '别名映射、受控值集与联动规则', icon: BookOutlined }
];

// ===== 企业字典交互状态 =====
const dictTab = ref<DictTab>('alias');
const dictEnterpriseFilter = ref('all');
const dictDimensionFilter = ref<'all' | DictDimension>('all');
const dictKeyword = ref('');
const isDictModalOpen = ref(false);
const editingDictId = ref('');
const isRouteModalOpen = ref(false);
// 修正记忆 / 挖掘候选改为独立弹窗入口，避免占用主表空间
const isMemoryDrawerOpen = ref(false);
const isCandidateDrawerOpen = ref(false);

const dictForm = reactive({
  dimension: '发货单位' as DictDimension,
  standard: '',
  code: '',
  enterpriseId: 'southwest-line',
  projectId: '',
  aliases: [] as DictAlias[]
});

const routeForm = reactive({
  enterpriseId: 'southwest-line',
  loadingPlace: '',
  unloadingPlace: '',
  route: ''
});

const filteredDictEntries = computed(() =>
  dictEntries.value.filter((entry) => {
    if (dictEnterpriseFilter.value !== 'all' && entry.enterpriseId !== dictEnterpriseFilter.value) return false;
    if (dictDimensionFilter.value !== 'all' && entry.dimension !== dictDimensionFilter.value) return false;
    const keyword = dictKeyword.value.trim();
    if (!keyword) return true;
    return entry.standard.includes(keyword) || entry.aliases.some((alias) => alias.text.includes(keyword));
  })
);

const dictStats = computed(() => ({
  entries: dictEntries.value.length,
  aliases: dictEntries.value.reduce((sum, entry) => sum + entry.aliases.length, 0),
  hits: dictEntries.value.reduce((sum, entry) => sum + entry.hitCount, 0),
  candidates: dictCandidates.value.length,
  memories: correctionMemories.value.length
}));

const dictFormProjects = computed(() => tenantProjects.filter((project) => project.enterpriseId === dictForm.enterpriseId));
const isEditingDict = computed(() => editingDictId.value.length > 0);

// 修正记忆分流：开集维度可转别名；车牌/驾驶员属受控字段，仅提示（应修档案或纠错表）
const aliasMemories = computed(() => correctionMemories.value.filter((item) => dictDimensions.value.includes(item.dimension)));
const controlledMemories = computed(() => correctionMemories.value.filter((item) => !dictDimensions.value.includes(item.dimension)));

// 维度管理：新增后可直接用于字典项；已被引用的维度不允许删除
const isDimensionModalOpen = ref(false);
const newDimensionName = ref('');

function dimensionUsage(dimension: DictDimension) {
  return dictEntries.value.filter((entry) => entry.dimension === dimension).length;
}

function addDimension() {
  const name = newDimensionName.value.trim();
  if (!name) {
    message.error('请填写维度名称');
    return;
  }
  if (dictDimensions.value.includes(name)) {
    message.error('该维度已存在');
    return;
  }
  dictDimensions.value.push(name);
  newDimensionName.value = '';
  message.success(`已新增维度「${name}」`);
}

function removeDimension(dimension: DictDimension) {
  const used = dimensionUsage(dimension);
  if (used) {
    message.error(`「${dimension}」下还有 ${used} 条字典项，请先处理后再删除`);
    return;
  }
  dictDimensions.value = dictDimensions.value.filter((item) => item !== dimension);
  if (dictDimensionFilter.value === dimension) dictDimensionFilter.value = 'all';
  message.success(`已删除维度「${dimension}」`);
}

const filteredRouteRules = computed(() =>
  routeRules.value.filter((rule) => dictEnterpriseFilter.value === 'all' || rule.enterpriseId === dictEnterpriseFilter.value)
);

function dictEnterpriseName(enterpriseId: string) {
  return tenantEnterprises.find((item) => item.id === enterpriseId)?.shortName ?? '-';
}

function dictProjectName(projectId?: string) {
  if (!projectId) return '全企业生效';
  return tenantProjects.find((item) => item.id === projectId)?.name ?? '-';
}

function matchModeColor(mode: MatchMode) {
  return mode === '精确' ? 'green' : mode === '包含' ? 'blue' : 'orange';
}

function openCreateDictModal() {
  editingDictId.value = '';
  dictForm.dimension = dictDimensionFilter.value === 'all' ? '装货客户' : dictDimensionFilter.value;
  dictForm.standard = '';
  dictForm.code = '';
  dictForm.enterpriseId = dictEnterpriseFilter.value === 'all' ? 'southwest-line' : dictEnterpriseFilter.value;
  dictForm.projectId = '';
  dictForm.aliases = [{ text: '', mode: '精确', priority: 1, source: '手工录入' }];
  isDictModalOpen.value = true;
}

function openEditDictModal(entry: DictEntry) {
  editingDictId.value = entry.id;
  dictForm.dimension = entry.dimension;
  dictForm.standard = entry.standard;
  dictForm.code = entry.code ?? '';
  dictForm.enterpriseId = entry.enterpriseId;
  dictForm.projectId = entry.projectId ?? '';
  dictForm.aliases = entry.aliases.map((alias) => ({ ...alias }));
  isDictModalOpen.value = true;
}

function closeDictModal() {
  isDictModalOpen.value = false;
  editingDictId.value = '';
}

function addDictAlias() {
  dictForm.aliases.push({ text: '', mode: '精确', priority: dictForm.aliases.length + 1, source: '手工录入' });
}

function removeDictAlias(index: number) {
  dictForm.aliases.splice(index, 1);
}

function confirmDictEntry() {
  const standard = dictForm.standard.trim();
  if (!standard) {
    message.error('请填写标准值');
    return;
  }
  const aliases = dictForm.aliases.map((alias) => ({ ...alias, text: alias.text.trim() })).filter((alias) => alias.text);
  if (!aliases.length) {
    message.error('请至少填写一条别名');
    return;
  }

  if (isEditingDict.value) {
    const target = dictEntries.value.find((entry) => entry.id === editingDictId.value);
    if (target) {
      target.dimension = dictForm.dimension;
      target.standard = standard;
      target.code = dictForm.code.trim() || undefined;
      target.enterpriseId = dictForm.enterpriseId;
      target.projectId = dictForm.projectId || undefined;
      target.aliases = aliases;
    }
    message.success(`字典项「${standard}」已保存`);
  } else {
    dictEntries.value.unshift({
      id: `dict-${dictEntries.value.length + 1}-${standard.slice(0, 4)}`,
      dimension: dictForm.dimension,
      standard,
      code: dictForm.code.trim() || undefined,
      enterpriseId: dictForm.enterpriseId,
      projectId: dictForm.projectId || undefined,
      aliases,
      hitCount: 0,
      enabled: true
    });
    message.success(`已新增字典项「${standard}」，${aliases.length} 条别名`);
  }
  closeDictModal();
}

function toggleDictEntry(entry: DictEntry) {
  entry.enabled = !entry.enabled;
  message.success(`「${entry.standard}」已${entry.enabled ? '启用' : '停用'}`);
}

// 挖掘候选：取出现次数最多的值作标准值，其余转为别名
function mergeCandidate(candidate: DictCandidate) {
  const sorted = [...candidate.values].sort((a, b) => b.count - a.count);
  const standard = sorted[0];
  const aliases: DictAlias[] = sorted.slice(1).map((item, index) => ({
    text: item.text,
    mode: '精确' as MatchMode,
    priority: index + 1,
    source: '历史挖掘' as AliasSource
  }));
  dictEntries.value.unshift({
    id: `dict-merged-${candidate.id}`,
    dimension: candidate.dimension,
    standard: standard.text,
    enterpriseId: dictEnterpriseFilter.value === 'all' ? 'southwest-line' : dictEnterpriseFilter.value,
    aliases,
    hitCount: 0,
    enabled: true
  });
  dictCandidates.value = dictCandidates.value.filter((item) => item.id !== candidate.id);
  message.success(`已合并为「${standard.text}」，新增 ${aliases.length} 条别名`);
}

function ignoreCandidate(candidate: DictCandidate) {
  dictCandidates.value = dictCandidates.value.filter((item) => item.id !== candidate.id);
  message.success('已忽略该候选组');
}

// 用户修正记忆 → 别名：已有同标准值的字典项则并入，否则新建
function adoptMemory(memory: (typeof correctionMemories.value)[number]) {
  const dimension = memory.dimension as DictDimension;
  const existing = dictEntries.value.find((entry) => entry.dimension === dimension && entry.standard === memory.to);
  if (existing) {
    if (existing.aliases.some((alias) => alias.text === memory.from)) {
      message.info('该别名已存在于字典中');
      removeCorrectionMemory(memory.id);
      return;
    }
    existing.aliases.push({
      text: memory.from,
      mode: '精确',
      priority: existing.aliases.length + 1,
      source: '用户修正'
    });
    message.success(`已并入「${memory.to}」，新增别名「${memory.from}」`);
  } else {
    dictEntries.value.unshift({
      id: `dict-mem-${memory.id}`,
      dimension,
      standard: memory.to,
      enterpriseId: dictEnterpriseFilter.value === 'all' ? 'southwest-line' : dictEnterpriseFilter.value,
      aliases: [{ text: memory.from, mode: '精确', priority: 1, source: '用户修正' }],
      hitCount: 0,
      enabled: true
    });
    message.success(`已按修正记忆新建字典项「${memory.to}」`);
  }
  removeCorrectionMemory(memory.id);
}

function discardMemory(memory: (typeof correctionMemories.value)[number]) {
  removeCorrectionMemory(memory.id);
  message.success('已忽略该条修正记忆');
}

function openRouteModal() {
  routeForm.enterpriseId = dictEnterpriseFilter.value === 'all' ? 'southwest-line' : dictEnterpriseFilter.value;
  routeForm.loadingPlace = '';
  routeForm.unloadingPlace = '';
  routeForm.route = '';
  isRouteModalOpen.value = true;
}

function confirmRouteRule() {
  const loading = routeForm.loadingPlace.trim();
  const unloading = routeForm.unloadingPlace.trim();
  const route = routeForm.route.trim();
  if (!loading || !unloading || !route) {
    message.error('装货地、卸货地、标准线路都需要填写');
    return;
  }
  routeRules.value.unshift({
    id: `route-${routeRules.value.length + 1}`,
    enterpriseId: routeForm.enterpriseId,
    loadingPlace: loading,
    unloadingPlace: unloading,
    route,
    enabled: true
  });
  isRouteModalOpen.value = false;
  message.success(`已新增线路映射「${route}」`);
}

function toggleRouteRule(rule: RouteRule) {
  rule.enabled = !rule.enabled;
  message.success(`线路「${rule.route}」已${rule.enabled ? '启用' : '停用'}`);
}

function toggleLinkRule(rule: (typeof linkRules.value)[number]) {
  rule.enabled = !rule.enabled;
  message.success(`规则 ${rule.id} 已${rule.enabled ? '启用' : '停用'}`);
}

function setLinkRuleAction(rule: (typeof linkRules.value)[number], action: RuleAction) {
  rule.action = action;
  message.success(`规则 ${rule.id} 冲突动作已改为「${action}」`);
}

// R3/R4 映射表：同一套增删/启停逻辑，按 kind 区分落到哪张表
const isAllowModalOpen = ref(false);
const allowModalKind = ref<'customerGoods' | 'goodsMine'>('customerGoods');
const allowForm = reactive({
  enterpriseId: 'southwest-line',
  subject: '',
  allowedText: ''
});

const allowRulesRef = computed(() => (allowModalKind.value === 'customerGoods' ? customerGoodsRules : goodsMineRules));

const filteredCustomerGoodsRules = computed(() =>
  customerGoodsRules.value.filter((rule) => dictEnterpriseFilter.value === 'all' || rule.enterpriseId === dictEnterpriseFilter.value)
);

const filteredGoodsMineRules = computed(() =>
  goodsMineRules.value.filter((rule) => dictEnterpriseFilter.value === 'all' || rule.enterpriseId === dictEnterpriseFilter.value)
);

function openAllowModal(kind: 'customerGoods' | 'goodsMine') {
  allowModalKind.value = kind;
  allowForm.enterpriseId = dictEnterpriseFilter.value === 'all' ? 'southwest-line' : dictEnterpriseFilter.value;
  allowForm.subject = '';
  allowForm.allowedText = '';
  isAllowModalOpen.value = true;
}

function confirmAllowRule() {
  const subject = allowForm.subject.trim();
  const allowed = allowForm.allowedText
    .split(/[、,，;；\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (!subject || !allowed.length) {
    message.error(allowModalKind.value === 'customerGoods' ? '请填写客户与允许货物' : '请填写货物与允许矿别');
    return;
  }
  const target = allowRulesRef.value;
  target.value.unshift({
    id: `${allowModalKind.value === 'customerGoods' ? 'cg' : 'gm'}-${target.value.length + 1}-${subject.slice(0, 4)}`,
    enterpriseId: allowForm.enterpriseId,
    subject,
    allowed,
    enabled: true
  });
  isAllowModalOpen.value = false;
  message.success(`已新增「${subject}」的允许清单（${allowed.length} 项）`);
}

function toggleAllowRule(rule: AllowRule) {
  rule.enabled = !rule.enabled;
  message.success(`「${rule.subject}」已${rule.enabled ? '启用' : '停用'}`);
}

function removeAllowRule(kind: 'customerGoods' | 'goodsMine', rule: AllowRule) {
  const target = kind === 'customerGoods' ? customerGoodsRules : goodsMineRules;
  target.value = target.value.filter((item) => item.id !== rule.id);
  message.success(`已删除「${rule.subject}」的允许清单`);
}

function removeRouteRule(rule: RouteRule) {
  routeRules.value = routeRules.value.filter((item) => item.id !== rule.id);
  message.success(`已删除线路映射「${rule.route}」`);
}

function addPlateConfusionPair() {
  plateConfusionPairs.value.push({ a: '', b: '' });
}

function removePlateConfusionPair(index: number) {
  plateConfusionPairs.value.splice(index, 1);
}


function groupById(groupId: string) {
  return wechatGroups.value.find((group) => group.id === groupId);
}

function enterpriseById(enterpriseId?: string) {
  return tenantEnterprises.find((enterprise) => enterprise.id === enterpriseId);
}

function projectById(projectId?: string) {
  return tenantProjects.find((project) => project.id === projectId);
}

function employeeEnterpriseName(employee: DataEmployee) {
  return enterpriseById(employee.enterpriseId)?.name ?? '-';
}

function employeeProjectName(employee: DataEmployee) {
  return projectById(employee.projectId)?.name ?? '-';
}

function employeeGroups(employee: DataEmployee) {
  return (employee.groupIds ?? []).map(groupById).filter((group): group is WechatGroup => Boolean(group));
}

function usedByEmployees(group: WechatGroup) {
  return dataEmployees.value.filter((employee) => employee.kind === '微信群' && (employee.groupIds ?? []).includes(group.id));
}

function selectEmployee(employee: DataEmployee) {
  selectedEmployeeId.value = employee.id;
}

function employeeKindClass(kind: EmployeeKind) {
  return kind === '微信群' ? 'wechat' : 'tms';
}

function loginTypeColor(loginType?: LoginType) {
  if (loginType === '短信验证码') return 'orange';
  if (loginType === '图形验证码') return 'blue';
  if (loginType === '手机扫码') return 'purple';
  return 'green';
}

function bumpVersion(version: string) {
  const versionNumber = Number(version.replace('v', ''));
  return Number.isFinite(versionNumber) ? `v${(versionNumber + 0.1).toFixed(1)}` : 'v1.0';
}

function defaultSkillForKind(kind: EmployeeKind) {
  if (kind === '微信群') {
    return `# 微信群数据识别 Skill

目标：进入运营人员指定的微信群，读取聊天记录中的文字和图片，抽取结构化字段。

识别步骤：
1. 按群名称和最近消息时间读取候选消息。
2. 合并同一司机/车牌在短时间内发送的文字和图片。
3. 根据业务关键词判断数据类型：磅单、报销、加油、充电、维修或过路费。
4. 输出字段名称、字段值、图片引用和识别置信度。

字段映射：
- 群名称 -> source_group_name
- 消息时间 -> message_time
- 车牌 -> vehicle_plate
- 司机 -> driver_name
- 数据类型 -> data_type`;
  }
  return `# TMS 数据获取映射 Skill

目标：登录目标 TMS，进入运营人员指定页面，抓取运单并映射为标准数据集。

页面导航：
1. 打开登录页并完成认证。
2. 进入运单或调度任务列表。
3. 筛选今日或在途数据并进入详情页补充字段。

字段映射：
- 运单号 -> waybill_no
- 车牌 -> vehicle_plate
- 司机 -> driver_name
- 起运地 -> origin_name
- 目的地 -> destination_name
- 状态 -> order_status`;
}

// 根据企业生成默认 CID（Demo：企业 id 派生，可手动覆盖）
function defaultEnterpriseCid(enterpriseId: string) {
  if (!enterpriseId) return '';
  const idx = tenantEnterprises.findIndex((e) => e.id === enterpriseId);
  return `CID-${String(idx + 1).padStart(4, '0')}`;
}

function resetEmployeeForm(kind: EmployeeKind = 'TMS') {
  editingEmployeeId.value = '';
  employeeForm.kind = kind;
  employeeForm.name = '';
  employeeForm.description = '';
  employeeForm.enterpriseId = kind === '微信群' ? tenantEnterprises[0]?.id ?? '' : '';
  employeeForm.enterpriseCid = kind === '微信群' ? defaultEnterpriseCid(employeeForm.enterpriseId) : '';
  employeeForm.projectId = kind === '微信群' ? tenantProjects.find((project) => project.enterpriseId === employeeForm.enterpriseId)?.id ?? '' : '';
  employeeForm.loginUrl = '';
  employeeForm.loginType = '无验证';
  employeeForm.groupIds = [];
  employeeForm.groupSearch = '';
  employeeForm.skillFileName = kind === '微信群' ? 'wechat-data-recognition.skill.md' : 'tms-waybill-mapping.skill.md';
  employeeForm.skillContent = defaultSkillForKind(kind);
}

function openCreateEmployeeModal(kind: EmployeeKind) {
  resetEmployeeForm(kind);
  isEmployeeModalOpen.value = true;
}

function openEditEmployeeModal(employee: DataEmployee) {
  selectEmployee(employee);
  editingEmployeeId.value = employee.id;
  employeeForm.kind = employee.kind;
  employeeForm.name = employee.name;
  employeeForm.description = employee.description;
  employeeForm.enterpriseId = employee.enterpriseId ?? '';
  employeeForm.enterpriseCid = employee.enterpriseCid ?? defaultEnterpriseCid(employee.enterpriseId ?? '');
  employeeForm.projectId = employee.projectId ?? '';
  employeeForm.loginUrl = employee.loginUrl ?? '';
  employeeForm.loginType = employee.loginType ?? '无验证';
  employeeForm.groupIds = [...(employee.groupIds ?? [])];
  employeeForm.groupSearch = '';
  employeeForm.skillFileName = employee.skillFileName;
  employeeForm.skillContent = employee.skillContent;
  isEmployeeModalOpen.value = true;
}

function closeEmployeeModal() {
  isEmployeeModalOpen.value = false;
  resetEmployeeForm(employeeForm.kind);
}

function toggleFormGroup(groupId: string) {
  const index = employeeForm.groupIds.indexOf(groupId);
  if (index >= 0) {
    employeeForm.groupIds.splice(index, 1);
    return;
  }
  employeeForm.groupIds.push(groupId);
}

function handleFormEnterpriseChange() {
  employeeForm.enterpriseCid = defaultEnterpriseCid(employeeForm.enterpriseId);
  employeeForm.projectId = tenantProjects.find((project) => project.enterpriseId === employeeForm.enterpriseId)?.id ?? '';
  employeeForm.groupIds = [];
  employeeForm.groupSearch = '';
}

function handleFormProjectChange() {
  employeeForm.groupIds = employeeForm.groupIds.filter((groupId) => groupById(groupId)?.projectId === employeeForm.projectId);
  employeeForm.groupSearch = '';
}

function addFormGroup(groupId: string) {
  if (!employeeForm.groupIds.includes(groupId)) {
    employeeForm.groupIds.push(groupId);
  }
  employeeForm.groupSearch = '';
}

function removeFormGroup(groupId: string) {
  employeeForm.groupIds = employeeForm.groupIds.filter((id) => id !== groupId);
}

async function uploadEmployeeSkill(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  employeeForm.skillContent = await file.text();
  employeeForm.skillFileName = file.name;
  input.value = '';
}

async function uploadSkill(employee: DataEmployee, event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const content = await file.text();
  dataEmployees.value = dataEmployees.value.map((item) =>
    item.id === employee.id
      ? {
          ...item,
          skillContent: content || item.skillContent,
          skillFileName: file.name,
          skillUpdated: '刚刚',
          skillVersion: bumpVersion(item.skillVersion)
        }
      : item
  );
  selectedEmployeeId.value = employee.id;
  input.value = '';
  message.success(`${employee.name} 的 skill 已更新`);
}

function confirmEmployee() {
  const name = employeeForm.name.trim();
  const description = employeeForm.description.trim();
  const skillContent = employeeForm.skillContent.trim();
  const skillFileName = employeeForm.skillFileName.trim() || `${employeeForm.kind === '微信群' ? 'wechat' : 'tms'}-${Date.now()}.skill.md`;

  if (!name) {
    message.warning('请输入数据员工名称');
    return;
  }
  if (!description) {
    message.warning('请输入数据员工描述');
    return;
  }
  if (employeeForm.kind === 'TMS' && !employeeForm.loginUrl.trim()) {
    message.warning('请输入 TMS 登录地址');
    return;
  }
  if (employeeForm.kind === '微信群' && !employeeForm.enterpriseId) {
    message.warning('请选择可见企业');
    return;
  }
  if (employeeForm.kind === '微信群' && !employeeForm.projectId) {
    message.warning('请选择企业项目');
    return;
  }
  if (employeeForm.kind === '微信群' && employeeForm.groupIds.length === 0) {
    message.warning('请通过搜索添加至少一个微信群');
    return;
  }
  if (!skillContent) {
    message.warning('请填写或上传 skill 内容');
    return;
  }

  if (isEditingEmployee.value) {
    const current = dataEmployees.value.find((employee) => employee.id === editingEmployeeId.value);
    if (!current) return;
    const isSkillChanged = current.skillFileName !== skillFileName || current.skillContent !== skillContent;
    dataEmployees.value = dataEmployees.value.map((employee) =>
      employee.id === editingEmployeeId.value
        ? {
            ...employee,
            description,
            enterpriseId: employeeForm.kind === '微信群' ? employeeForm.enterpriseId : undefined,
            enterpriseCid: employeeForm.kind === '微信群' ? employeeForm.enterpriseCid.trim() : undefined,
            groupIds: employeeForm.kind === '微信群' ? [...employeeForm.groupIds] : undefined,
            loginType: employeeForm.kind === 'TMS' ? employeeForm.loginType : undefined,
            loginUrl: employeeForm.kind === 'TMS' ? employeeForm.loginUrl.trim() : undefined,
            name,
            projectId: employeeForm.kind === '微信群' ? employeeForm.projectId : undefined,
            skillContent,
            skillFileName,
            skillUpdated: isSkillChanged ? '刚刚' : employee.skillUpdated,
            skillVersion: isSkillChanged ? bumpVersion(employee.skillVersion) : employee.skillVersion
          }
        : employee
    );
    selectedEmployeeId.value = current.id;
    isEmployeeModalOpen.value = false;
    message.success('数据员工已保存');
    return;
  }

  const employee: DataEmployee = {
    id: `${employeeForm.kind === '微信群' ? 'wechat' : 'tms'}-${Date.now()}`,
    kind: employeeForm.kind,
    name,
    description,
    enterpriseId: employeeForm.kind === '微信群' ? employeeForm.enterpriseId : undefined,
    enterpriseCid: employeeForm.kind === '微信群' ? employeeForm.enterpriseCid.trim() : undefined,
    groupIds: employeeForm.kind === '微信群' ? [...employeeForm.groupIds] : undefined,
    loginType: employeeForm.kind === 'TMS' ? employeeForm.loginType : undefined,
    loginUrl: employeeForm.kind === 'TMS' ? employeeForm.loginUrl.trim() : undefined,
    projectId: employeeForm.kind === '微信群' ? employeeForm.projectId : undefined,
    skillContent,
    skillFileName,
    skillUpdated: '刚刚',
    skillVersion: 'v1.0'
  };
  dataEmployees.value = [employee, ...dataEmployees.value];
  selectedEmployeeId.value = employee.id;
  isEmployeeModalOpen.value = false;
  message.success(`数据员工（${employee.kind}）已增加`);
}

function resetValidationForm() {
  validationForm.username = '';
  validationForm.password = '';
  validationForm.graphicCode = '';
  validationForm.smsCode = '';
  validationResult.value = null;
}

function openValidationModal(employee: DataEmployee) {
  selectEmployee(employee);
  validatingEmployee.value = employee;
  resetValidationForm();
  isValidationModalOpen.value = true;
}

function closeValidationModal() {
  isValidationModalOpen.value = false;
  validatingEmployee.value = null;
  resetValidationForm();
}

function sendSmsCode() {
  if (!validationForm.username.trim()) {
    message.warning('请先输入账号');
    return;
  }
  validationForm.smsCode = '246810';
  message.success('短信验证码已发送');
}

function buildTmsValidationEntity(employee: DataEmployee) {
  return {
    waybill_no: 'WB202607030018',
    source_system: employee.name,
    carrier_name: '安捷物流',
    vehicle_plate: '赣J03528D',
    driver_name: '罗明',
    route_name: '砚山储配站 → 广西德保电厂',
    origin_name: '砚山储配站',
    destination_name: '广西德保电厂',
    order_status: '在途',
    current_location: 'G80广昆高速百色段',
    gps_time: '2026-07-03 10:12:31'
  };
}

function buildWechatValidationResult(employee: DataEmployee): ValidationResult {
  const groups = employeeGroups(employee);
  const primaryGroup = groups[0] ?? wechatGroups.value[0];
  if (employee.id.includes('expense')) {
    const entity = {
      source_group_name: primaryGroup.name,
      message_time: '2026-07-03 10:18',
      sender_name: '刘启',
      vehicle_plate: '沪A20170A',
      driver_name: '王成',
      expense_type: '加油费',
      amount: '486.00',
      payee: '华银高速口加油站',
      voucher_image_ref: 'expense-1.png',
      confidence: '0.93'
    };
    return {
      checkedAt: '刚刚',
      entity,
      fieldNames: Object.keys(entity),
      message: `${employee.name} 已读取 ${groups.length} 个微信群，基于聊天文字和票据图片提取 1 条费用记录。`,
      sourceImages: ['/demo-assets/expense-1.png', '/demo-assets/expense-3.jpg'],
      sourceText: '王成 沪A20170A 今天华银高速口加油 486 元，小票见图，走广西华银项目。',
      success: true
    };
  }
  if (employee.id.includes('energy') || employee.id.includes('repair')) {
    const entity = {
      source_group_name: primaryGroup.name,
      message_time: '2026-07-03 11:03',
      vehicle_plate: '云C71329D',
      driver_name: '李勇康',
      expense_type: primaryGroup.name.includes('充电') ? '充电费' : '维修费',
      expense_item: primaryGroup.name.includes('充电') ? '服务区快充 168.4 度' : '右后轮补胎及气路检查',
      amount: primaryGroup.name.includes('充电') ? '218.60' : '360.00',
      risk_level: '低风险',
      raw_image_ref: 'expense-6.jpg',
      confidence: '0.91'
    };
    return {
      checkedAt: '刚刚',
      entity,
      fieldNames: Object.keys(entity),
      message: `${employee.name} 已从补能/维修群抽取费用明细，并保留现场图片引用。`,
      sourceImages: ['/demo-assets/expense-6.jpg'],
      sourceText: '云C71329D 昭通服务区补电完成，168.4度 218.6元，账单见图，等待时间 42 分钟。',
      success: true
    };
  }
  const entity = {
    source_group_name: primaryGroup.name,
    message_time: '2026-07-03 09:42',
    vehicle_plate: '赣J03528D',
    driver_name: '罗明',
    weigh_type: '装货磅单',
    cargo_name: '褐煤32',
    gross_weight: '49.86 吨',
    tare_weight: '16.92 吨',
    net_weight: '32.94 吨',
    origin_name: '砚山储配站',
    raw_image_ref: 'weighbridge.jpg',
    confidence: '0.94'
  };
  return {
    checkedAt: '刚刚',
    entity,
    fieldNames: Object.keys(entity),
    message: `${employee.name} 已从微信群聊天记录中合并文字和磅单图片，提取 1 条磅单结构化结果。`,
    sourceImages: ['/demo-assets/weighbridge.jpg'],
    sourceText: '罗明 赣J03528D 已在砚山储配站装车，褐煤32，磅单见图，净重 32.94 吨，发广西德保电厂。',
    success: true
  };
}

function validateEmployee() {
  if (!validatingEmployee.value) return;
  if (validatingEmployee.value.kind === '微信群') {
    validationResult.value = buildWechatValidationResult(validatingEmployee.value);
    message.success('微信群数据员工验证完成');
    return;
  }

  if (currentValidationLoginType.value !== '手机扫码') {
    if (!validationForm.username.trim()) {
      message.warning('请输入账号');
      return;
    }
    if (!validationForm.password.trim()) {
      message.warning('请输入密码');
      return;
    }
  }
  if (currentValidationLoginType.value === '图形验证码' && !validationForm.graphicCode.trim()) {
    message.warning('请输入图形验证码');
    return;
  }
  if (currentValidationLoginType.value === '短信验证码' && !validationForm.smsCode.trim()) {
    message.warning('请输入短信验证码');
    return;
  }

  const entity = buildTmsValidationEntity(validatingEmployee.value);
  validationResult.value = {
    checkedAt: '刚刚',
    entity,
    fieldNames: Object.keys(entity),
    message: `${validatingEmployee.value.name} 登录成功，已通过 skill 获取 1 条运单样例。`,
    success: true
  };
  message.success('TMS 数据员工验证完成');
}
</script>

<template>
  <div class="agentops-shell">
    <header class="agentops-header">
      <div class="agentops-brand">
        <div class="agentops-mark">OPS</div>
        <div>
          <strong>SaaS 运营后台</strong>
          <span>Multi-tenant Console</span>
        </div>
      </div>
      <div class="agentops-title">
        <span>运营侧独立页面</span>
        <h1>数据员工运营配置</h1>
      </div>
      <div class="agentops-header-status">
        <TeamOutlined />
        <span>微信群资源 / TMS 接入 / Skill 验证</span>
      </div>
    </header>

    <main class="agentops-layout">
      <aside class="agentops-sidebar">
        <div class="agentops-sidebar-head">
          <h2>运营菜单</h2>
          <p>配置数据来源、识别逻辑和标准字段。</p>
        </div>
        <nav class="agentops-nav">
          <button
            v-for="item in opsMenuItems"
            :key="item.id"
            type="button"
            :class="{ active: activeTab === item.id }"
            @click="activeTab = item.id"
          >
            <span class="agentops-nav-icon"><component :is="item.icon" /></span>
            <span>
              <strong>{{ item.label }}</strong>
              <em>{{ item.desc }}</em>
            </span>
          </button>
        </nav>
        <div class="agentops-sidebar-foot">
          当前运营页独立于用户侧工作台，仅面向内部配置人员。
        </div>
      </aside>

      <section class="agentops-page">
        <template v-if="activeTab === 'employees'">
    <section class="agentops-workspace">
      <div class="ops-panel employee-panel">
        <div class="ops-panel-head">
          <div>
            <h2>数据员工列表</h2>
            <p>数据员工（微信群）统一展示与新增。</p>
          </div>
          <div class="ops-actions">
            <a-button type="primary" @click="openCreateEmployeeModal('微信群')">
              <template #icon><MessageOutlined /></template>
              增加数据员工（微信群）
            </a-button>
          </div>
        </div>

        <div class="employee-table-wrap">
          <table class="ops-table employee-table">
            <thead>
              <tr>
                <th>数据员工</th>
                <th>类型 / 可见企业</th>
                <th>企业项目 / 接入范围</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="employee in dataEmployees"
                :key="employee.id"
                :class="{ selected: selectedEmployee.id === employee.id }"
                @click="selectEmployee(employee)"
              >
                <td>
                  <strong>{{ employee.name }}</strong>
                  <span>{{ employee.description }}</span>
                </td>
                <td>
                  <span class="employee-kind" :class="employeeKindClass(employee.kind)">数据员工（{{ employee.kind }}）</span>
                  <span v-if="employee.kind === '微信群'" class="tenant-visible">仅 {{ employeeEnterpriseName(employee) }} 可见</span>
                </td>
                <td>
                  <template v-if="employee.kind === '微信群'">
                    <div class="project-scope">
                      <strong>{{ employeeProjectName(employee) }}</strong>
                      <span>已接入 {{ employeeGroups(employee).length }} 个微信群</span>
                    </div>
                    <div class="group-chip-list">
                      <span v-for="group in employeeGroups(employee)" :key="group.id" class="group-chip">{{ group.name }}</span>
                    </div>
                  </template>
                  <template v-else>
                    <div class="tms-access">
                      <code>{{ employee.loginUrl }}</code>
                      <a-tag :color="loginTypeColor(employee.loginType)">{{ employee.loginType }}</a-tag>
                    </div>
                  </template>
                </td>
                <td>
                  <div class="table-actions">
                    <a-button size="small" @click.stop="openEditEmployeeModal(employee)">
                      <template #icon><EditOutlined /></template>
                      编辑
                    </a-button>
                    <a-button size="small" @click.stop="openValidationModal(employee)">
                      <template #icon><SafetyCertificateOutlined /></template>
                      验证
                    </a-button>
                    <label class="upload-button" @click.stop>
                      <UploadOutlined />
                      更新 skill
                      <input type="file" accept=".md,.txt,.yaml,.yml" @change.stop="uploadSkill(employee, $event)" />
                    </label>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <section class="ops-panel skill-panel">
        <div class="ops-panel-head compact">
          <div>
            <h2>数据映射 Skill</h2>
            <p>{{ selectedEmployee.name }}</p>
          </div>
          <a-tag color="default">{{ selectedEmployee.skillVersion }}</a-tag>
        </div>
        <div class="selected-employee-meta">
          <div>
            <span>数据员工类型</span>
            <strong>数据员工（{{ selectedEmployee.kind }}）</strong>
          </div>
          <div v-if="selectedEmployee.kind === '微信群'">
            <span>可见企业</span>
            <strong>{{ employeeEnterpriseName(selectedEmployee) }}</strong>
          </div>
          <div v-if="selectedEmployee.kind === '微信群'">
            <span>企业项目</span>
            <strong>{{ employeeProjectName(selectedEmployee) }}</strong>
          </div>
          <div>
            <span>{{ selectedEmployee.kind === '微信群' ? '接入微信群' : '接入地址' }}</span>
            <strong v-if="selectedEmployee.kind === '微信群'">{{ employeeGroups(selectedEmployee).length }} 个微信群</strong>
            <strong v-else>{{ selectedEmployee.loginUrl }}</strong>
          </div>
          <div>
            <span>Skill 文件</span>
            <strong>{{ selectedEmployee.skillFileName }}</strong>
          </div>
        </div>
        <pre class="skill-preview">{{ selectedEmployee.skillContent }}</pre>
      </section>
    </section>
        </template>

        <template v-else-if="activeTab === 'wechatGroups'">
          <section class="ops-panel groups-panel">
      <div class="ops-panel-head">
        <div>
          <h2>可接入微信群列表</h2>
          <p>展示底层当前提供给数据员工（微信群）接入识别的全部微信群。</p>
        </div>
        <a-tag color="blue">{{ wechatGroups.length }} 个微信群</a-tag>
      </div>

      <div class="groups-table-wrap">
        <table class="ops-table groups-table">
          <thead>
            <tr>
              <th>微信群名称</th>
              <th>群主昵称头像</th>
              <th>群人数</th>
              <th>识别主题</th>
              <th>已被下列数据员工（微信群）使用</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="group in wechatGroups" :key="group.id">
              <td>
                <strong>{{ group.name }}</strong>
                <span>{{ enterpriseById(group.enterpriseId)?.name }} · {{ group.project }} · 最近活跃 {{ group.lastActiveAt }}</span>
              </td>
              <td>
                <div class="owner-cell">
                  <a-avatar :style="{ backgroundColor: group.avatarColor }">{{ group.ownerAvatar }}</a-avatar>
                  <span>{{ group.ownerName }}</span>
                </div>
              </td>
              <td>
                <strong>{{ group.memberCount }} 人</strong>
              </td>
              <td>
                <span>{{ group.sampleTopic }}</span>
              </td>
              <td>
                <div class="usage-cell">
                  <span class="usage-label">已被下列数据员工（微信群）使用</span>
                  <div v-if="usedByEmployees(group).length" class="usage-list">
                    <a-tag v-for="employee in usedByEmployees(group)" :key="employee.id" color="green">{{ employee.name }}</a-tag>
                  </div>
                  <span v-else class="empty-usage">暂无数据员工使用</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
          </section>
        </template>

        <template v-else-if="activeTab === 'dictionary'">
          <section class="ops-panel dict-panel">
            <div class="ops-panel-head">
              <div>
                <h2>企业字典</h2>
                <p>把识别出的自由文本归一到标准值，提升磅单抓取准确率。精确别名命中后自动改写，包含 / 正则仅提示。</p>
              </div>
              <div class="ops-actions">
                <a-button v-if="dictTab === 'alias'" type="primary" @click="openCreateDictModal">
                  <template #icon><PlusOutlined /></template>
                  新增字典项
                </a-button>
              </div>
            </div>

            <div class="dict-body">
              <div class="dict-stat-row">
                <div><span>字典项</span><strong>{{ dictStats.entries }}</strong></div>
                <div><span>别名总数</span><strong>{{ dictStats.aliases }}</strong></div>
                <div><span>累计命中</span><strong>{{ dictStats.hits }}</strong></div>
                <button type="button" class="dict-stat-entry ok" @click="isMemoryDrawerOpen = true">
                  <span>用户修正记忆</span>
                  <strong>{{ dictStats.memories }}</strong>
                  <em>点击处理 ›</em>
                </button>
                <button type="button" class="dict-stat-entry warn" @click="isCandidateDrawerOpen = true">
                  <span>待确认候选</span>
                  <strong>{{ dictStats.candidates }}</strong>
                  <em>点击处理 ›</em>
                </button>
              </div>

              <div class="dict-tabs">
                <button type="button" :class="{ active: dictTab === 'alias' }" @click="dictTab = 'alias'">别名字典</button>
                <button type="button" :class="{ active: dictTab === 'controlled' }" @click="dictTab = 'controlled'">受控值集 / 纠错</button>
                <button type="button" :class="{ active: dictTab === 'rules' }" @click="dictTab = 'rules'">联动规则</button>
              </div>

              <div class="dict-filter-bar">
                <a-select v-model:value="dictEnterpriseFilter" class="dict-select">
                  <a-select-option value="all">全部企业</a-select-option>
                  <a-select-option v-for="item in tenantEnterprises" :key="item.id" :value="item.id">{{ item.shortName }}</a-select-option>
                </a-select>
                <a-select v-if="dictTab === 'alias'" v-model:value="dictDimensionFilter" class="dict-select">
                  <a-select-option value="all">全部维度</a-select-option>
                  <a-select-option v-for="dim in dictDimensions" :key="dim" :value="dim">{{ dim }}</a-select-option>
                </a-select>
                <a-input v-if="dictTab === 'alias'" v-model:value="dictKeyword" placeholder="搜索标准值或别名" allow-clear class="dict-search" />
                <a-button v-if="dictTab === 'alias'" @click="isDimensionModalOpen = true">
                  <template #icon><SettingOutlined /></template>
                  管理维度
                </a-button>
              </div>

              <!-- 别名字典 -->
              <template v-if="dictTab === 'alias'">
                <table class="ops-table dict-table dict-alias-table">
                  <thead>
                    <tr>
                      <th>维度</th>
                      <th>标准值 / 编码</th>
                      <th>别名（匹配方式）</th>
                      <th>归属</th>
                      <th>命中</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="entry in filteredDictEntries" :key="entry.id" :class="{ disabled: !entry.enabled }">
                      <td><a-tag color="purple">{{ entry.dimension }}</a-tag></td>
                      <td>
                        <strong>{{ entry.standard }}</strong>
                        <span v-if="entry.code">{{ entry.code }}</span>
                      </td>
                      <td>
                        <div class="dict-alias-cell">
                          <span v-for="alias in entry.aliases" :key="alias.text" class="dict-alias-chip">
                            <a-tag :color="matchModeColor(alias.mode)">{{ alias.mode }}</a-tag>
                            {{ alias.text }}
                          </span>
                        </div>
                      </td>
                      <td>
                        <strong>{{ dictEnterpriseName(entry.enterpriseId) }}</strong>
                        <span>{{ dictProjectName(entry.projectId) }}</span>
                      </td>
                      <td>
                        <strong>{{ entry.hitCount }}</strong>
                        <span>{{ entry.lastHitAt ?? '未命中' }}</span>
                      </td>
                      <td>
                        <div class="dict-row-actions">
                          <a-switch :checked="entry.enabled" size="small" @change="toggleDictEntry(entry)" />
                          <a-button size="small" @click="openEditDictModal(entry)">编辑</a-button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="!filteredDictEntries.length">
                      <td colspan="6" class="dict-empty">当前筛选条件下暂无字典项</td>
                    </tr>
                  </tbody>
                </table>
              </template>

              <!-- 受控值集 -->
              <template v-else-if="dictTab === 'controlled'">
                <p class="dict-note">
                  纠错字段分两类：车牌号 / 驾驶员 / 客户在系统里<b>已有权威档案</b>，识别结果先用字符纠错表归一，再回档案精确校验，不在档的标疑点，档案更新后自动跟随；发货单位 / 收货单位 / 磅单员<b>没有内部档案</b>，以历史数据映射为准，纠错依赖别名字典对应维度，发 / 收货单位还会作为项目线路匹配的两端依据。
                </p>
                <table class="ops-table dict-table">
                  <thead>
                    <tr>
                      <th>字段</th>
                      <th>权威来源</th>
                      <th>值数量</th>
                      <th>治理方式</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in controlledFields" :key="item.key">
                      <td><strong>{{ item.label }}</strong></td>
                      <td><span class="dict-mono">{{ item.source }}</span></td>
                      <td><strong>{{ item.valueCount }}</strong></td>
                      <td><span>{{ item.desc }}</span></td>
                    </tr>
                  </tbody>
                </table>

                <div class="dict-subsection">
                  <div class="dict-subsection-head">
                    <div>
                      <strong>车牌字符纠错表</strong>                      <span>全局共用一张，双向替换后回车辆档案校验，不需要逐台车维护别名</span>
                    </div>
                    <a-button size="small" @click="addPlateConfusionPair">
                      <template #icon><PlusOutlined /></template>
                      新增混淆对
                    </a-button>
                  </div>
                  <div class="plate-pair-grid">
                    <div v-for="(pair, index) in plateConfusionPairs" :key="index" class="plate-pair">
                      <a-input v-model:value="pair.a" size="small" maxlength="2" />
                      <em>↔</em>
                      <a-input v-model:value="pair.b" size="small" maxlength="2" />
                      <button type="button" class="plate-pair-remove" @click="removePlateConfusionPair(index)"><DeleteOutlined /></button>
                    </div>
                  </div>
                  <div class="dict-example">
                    示例：识别 <b>赣J0352BD</b> → 按 8↔B 纠错得 <b>赣J03528D</b> → 命中车辆档案 → 联动带出驾驶员「罗明」、客户「云志合通科技（云南）有限公司」
                  </div>
                </div>
              </template>

              <!-- 联动规则 -->
              <template v-else>
                <p class="dict-note">
                  单字段各自合法、但组合起来不可能的错误，只有跨字段规则能发现。每条规则可单独启停，并选择命中冲突时是「自动纠正并标疑点」还是「仅标疑点」。
                </p>
                <table class="ops-table dict-table dict-rule-table">
                  <thead>
                    <tr>
                      <th>规则</th>
                      <th>类型</th>
                      <th>冲突动作</th>
                      <th>启用</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="rule in linkRules" :key="rule.id" :class="{ disabled: !rule.enabled }">
                      <td>
                        <strong>{{ rule.id }} · {{ rule.name }}</strong>
                        <span>{{ rule.desc }}</span>
                      </td>
                      <td><a-tag color="blue">{{ rule.kind }}</a-tag></td>
                      <td>
                        <a-select
                          :value="rule.action"
                          size="small"
                          :disabled="!rule.enabled"
                          class="rule-action-select"
                          @update:value="setLinkRuleAction(rule, $event)"
                        >
                          <a-select-option value="自动纠正并标疑点">自动纠正并标疑点</a-select-option>
                          <a-select-option value="仅标疑点">仅标疑点</a-select-option>
                        </a-select>
                      </td>
                      <td>
                        <a-switch :checked="rule.enabled" size="small" @change="toggleLinkRule(rule)" />
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div class="dict-subsection" :class="{ 'rule-off': !linkRules[1].enabled }">
                  <div class="dict-subsection-head">
                    <div>
                      <strong>R2 线路白名单</strong>
                      <span>
                        装货地 + 卸货地 → 标准线路；组合不在表内则按 R2 冲突动作处理。
                        <b v-if="!linkRules[1].enabled" class="rule-off-hint">R2 当前未启用，白名单暂不生效</b>
                      </span>
                    </div>
                    <a-button size="small" type="primary" @click="openRouteModal">
                      <template #icon><PlusOutlined /></template>
                      新增线路映射
                    </a-button>
                  </div>
                  <table class="ops-table dict-table">
                    <thead>
                      <tr>
                        <th>装货地</th>
                        <th>卸货地</th>
                        <th>标准线路</th>
                        <th>归属企业</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="rule in filteredRouteRules" :key="rule.id" :class="{ disabled: !rule.enabled }">
                        <td><span>{{ rule.loadingPlace }}</span></td>
                        <td><span>{{ rule.unloadingPlace }}</span></td>
                        <td><strong>{{ rule.route }}</strong></td>
                        <td><span>{{ dictEnterpriseName(rule.enterpriseId) }}</span></td>
                        <td>
                          <div class="dict-row-actions">
                            <a-switch :checked="rule.enabled" size="small" @change="toggleRouteRule(rule)" />
                            <a-button size="small" danger @click="removeRouteRule(rule)">删除</a-button>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="!filteredRouteRules.length">
                        <td colspan="5" class="dict-empty">当前企业暂无线路映射，点击右上角新增</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="dict-subsection" :class="{ 'rule-off': !linkRules[2].enabled }">
                  <div class="dict-subsection-head">
                    <div>
                      <strong>R3 客户 → 允许货物</strong>
                      <span>
                        该客户只应出现清单内的货物；识别到清单外货物时按 R3 冲突动作处理。
                        <b v-if="!linkRules[2].enabled" class="rule-off-hint">R3 当前未启用，清单暂不生效</b>
                      </span>
                    </div>
                    <a-button size="small" type="primary" @click="openAllowModal('customerGoods')">
                      <template #icon><PlusOutlined /></template>
                      新增客户货物清单
                    </a-button>
                  </div>
                  <table class="ops-table dict-table">
                    <thead>
                      <tr>
                        <th>客户</th>
                        <th>允许货物</th>
                        <th>归属企业</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="rule in filteredCustomerGoodsRules" :key="rule.id" :class="{ disabled: !rule.enabled }">
                        <td><strong>{{ rule.subject }}</strong></td>
                        <td>
                          <div class="dict-alias-cell">
                            <a-tag v-for="item in rule.allowed" :key="item" color="cyan">{{ item }}</a-tag>
                          </div>
                        </td>
                        <td><span>{{ dictEnterpriseName(rule.enterpriseId) }}</span></td>
                        <td>
                          <div class="dict-row-actions">
                            <a-switch :checked="rule.enabled" size="small" @change="toggleAllowRule(rule)" />
                            <a-button size="small" danger @click="removeAllowRule('customerGoods', rule)">删除</a-button>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="!filteredCustomerGoodsRules.length">
                        <td colspan="4" class="dict-empty">当前企业暂无客户货物清单，点击右上角新增</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="dict-subsection" :class="{ 'rule-off': !linkRules[3].enabled }">
                  <div class="dict-subsection-head">
                    <div>
                      <strong>R4 货物 → 允许矿别</strong>
                      <span>
                        该货物只应对应清单内的矿别 / 规格；识别到清单外矿别时按 R4 冲突动作处理。
                        <b v-if="!linkRules[3].enabled" class="rule-off-hint">R4 当前未启用，清单暂不生效</b>
                      </span>
                    </div>
                    <a-button size="small" type="primary" @click="openAllowModal('goodsMine')">
                      <template #icon><PlusOutlined /></template>
                      新增货物矿别清单
                    </a-button>
                  </div>
                  <table class="ops-table dict-table">
                    <thead>
                      <tr>
                        <th>货物</th>
                        <th>允许矿别 / 规格</th>
                        <th>归属企业</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="rule in filteredGoodsMineRules" :key="rule.id" :class="{ disabled: !rule.enabled }">
                        <td><strong>{{ rule.subject }}</strong></td>
                        <td>
                          <div class="dict-alias-cell">
                            <a-tag v-for="item in rule.allowed" :key="item" color="geekblue">{{ item }}</a-tag>
                          </div>
                        </td>
                        <td><span>{{ dictEnterpriseName(rule.enterpriseId) }}</span></td>
                        <td>
                          <div class="dict-row-actions">
                            <a-switch :checked="rule.enabled" size="small" @change="toggleAllowRule(rule)" />
                            <a-button size="small" danger @click="removeAllowRule('goodsMine', rule)">删除</a-button>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="!filteredGoodsMineRules.length">
                        <td colspan="4" class="dict-empty">当前企业暂无货物矿别清单，点击右上角新增</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
            </div>
          </section>
        </template>
      </section>
    </main>

    <a-modal v-model:open="isEmployeeModalOpen" :title="employeeFormTitle" width="720px" ok-text="保存" cancel-text="取消" @ok="confirmEmployee" @cancel="closeEmployeeModal">
      <div class="employee-form">
        <label>
          <span>数据员工名称</span>
          <a-input v-model:value="employeeForm.name" placeholder="例如：曲靖城建砂石配送项目·费用微信群数据员工" />
        </label>
        <label>
          <span>描述</span>
          <a-textarea v-model:value="employeeForm.description" :auto-size="{ minRows: 2, maxRows: 4 }" placeholder="说明该数据员工负责的数据来源、识别范围和业务场景" />
        </label>

        <div class="wechat-employee-config">
          <label>
            <span>可见企业</span>
            <a-select
              v-model:value="employeeForm.enterpriseId"
              show-search
              option-filter-prop="label"
              placeholder="搜索并选择唯一可见企业"
              @change="handleFormEnterpriseChange"
            >
              <a-select-option v-for="enterprise in tenantEnterprises" :key="enterprise.id" :value="enterprise.id" :label="enterprise.name">
                {{ enterprise.name }}
              </a-select-option>
            </a-select>
          </label>

          <label>
            <span>企业 CID</span>
            <a-input v-model:value="employeeForm.enterpriseCid" placeholder="请输入企业 CID" />
          </label>

          <label>
            <span>企业项目</span>
            <a-select v-model:value="employeeForm.projectId" show-search option-filter-prop="label" placeholder="选择该企业下的项目" @change="handleFormProjectChange">
              <a-select-option v-for="project in formProjects" :key="project.id" :value="project.id" :label="project.name">
                {{ project.name }}
              </a-select-option>
            </a-select>
          </label>

          <div class="group-selector">
            <div class="group-selector-head">
              <span>已接入微信群</span>
              <em>仅展示已接入当前数据员工的微信群</em>
            </div>
            <div v-if="formSelectedGroups.length" class="selected-group-list">
              <div v-for="group in formSelectedGroups" :key="group.id" class="selected-group-item">
                <a-avatar :style="{ backgroundColor: group.avatarColor }" size="small">{{ group.ownerAvatar }}</a-avatar>
                <div>
                  <strong>{{ group.name }}</strong>
                  <span>{{ group.memberCount }} 人 · {{ group.sampleTopic }}</span>
                </div>
                <button type="button" @click="removeFormGroup(group.id)">移除</button>
              </div>
            </div>
            <div v-else class="empty-selected-groups">尚未接入微信群，请通过下方搜索添加。</div>

            <label class="group-search-box">
              <span>搜索未接入微信群并添加</span>
              <a-input v-model:value="employeeForm.groupSearch" placeholder="输入群名称、群主或识别主题关键词" />
            </label>

            <div v-if="employeeForm.groupSearch.trim()" class="group-search-results">
              <button v-for="group in formGroupSearchResults" :key="group.id" type="button" class="group-search-result" @click="addFormGroup(group.id)">
                <a-avatar :style="{ backgroundColor: group.avatarColor }" size="small">{{ group.ownerAvatar }}</a-avatar>
                <span>
                  <strong>{{ group.name }}</strong>
                  <em>{{ group.memberCount }} 人 · {{ group.sampleTopic }}</em>
                </span>
                <b>接入</b>
              </button>
              <div v-if="!formGroupSearchResults.length" class="empty-selected-groups">未找到匹配的未接入微信群。</div>
            </div>
          </div>
        </div>

        <div class="skill-editor">
          <div class="skill-editor-head">
            <span>Skill 内容</span>
            <label class="upload-button inline">
              <CloudUploadOutlined />
              上传 skill
              <input type="file" accept=".md,.txt,.yaml,.yml" @change="uploadEmployeeSkill" />
            </label>
          </div>
          <a-input v-model:value="employeeForm.skillFileName" placeholder="skill 文件名" />
          <a-textarea v-model:value="employeeForm.skillContent" :auto-size="{ minRows: 8, maxRows: 14 }" placeholder="用 skill 描述该数据员工的识别逻辑和字段映射" />
        </div>
      </div>
      <template #footer>
        <a-button @click="closeEmployeeModal">取消</a-button>
        <a-button type="primary" @click="confirmEmployee">{{ employeeFormConfirmText }}</a-button>
      </template>
    </a-modal>

    <a-modal
      v-model:open="isValidationModalOpen"
      :title="validatingEmployee ? `验证${validatingEmployee.name}` : '验证数据员工'"
      width="840px"
      ok-text="验证"
      cancel-text="关闭"
      @ok="validateEmployee"
      @cancel="closeValidationModal"
    >
      <div v-if="validatingEmployee" class="validation-layout">
        <div class="validation-input">
          <div class="validation-source">
            <FileSearchOutlined />
            <div>
              <strong>{{ validatingEmployee.name }}</strong>
              <span>数据员工（{{ validatingEmployee.kind }}）</span>
            </div>
          </div>

          <template v-if="validatingEmployee.kind === '微信群'">
            <div class="wechat-validation-source">
              <span>企业可见范围</span>
              <div class="validation-scope-line">
                <strong>{{ employeeEnterpriseName(validatingEmployee) }}</strong>
                <em>{{ employeeProjectName(validatingEmployee) }}</em>
              </div>
            </div>
            <div class="wechat-validation-source">
              <span>本次验证会读取下列微信群最近聊天记录</span>
              <div class="group-chip-list">
                <span v-for="group in employeeGroups(validatingEmployee)" :key="group.id" class="group-chip">{{ group.name }}</span>
              </div>
            </div>
            <div class="sample-chat">
              <span>模拟聊天记录（文字 + 图片）</span>
              <p>{{ buildWechatValidationResult(validatingEmployee).sourceText }}</p>
              <div class="sample-image-row">
                <img v-for="image in buildWechatValidationResult(validatingEmployee).sourceImages" :key="image" :src="image" alt="聊天图片样例" />
              </div>
            </div>
          </template>

          <template v-else>
            <label>
              <span>接入地址</span>
              <a-input :value="validatingEmployee.loginUrl" disabled />
            </label>
            <template v-if="currentValidationLoginType !== '手机扫码'">
              <label>
                <span>账号</span>
                <a-input v-model:value="validationForm.username" placeholder="请输入目标系统账号" />
              </label>
              <label>
                <span>密码</span>
                <a-input-password v-model:value="validationForm.password" placeholder="请输入目标系统密码" />
              </label>
            </template>
            <label v-if="currentValidationLoginType === '图形验证码'">
              <span>图形验证码</span>
              <div class="captcha-row">
                <b>A7K9</b>
                <a-input v-model:value="validationForm.graphicCode" placeholder="请输入图形验证码" />
              </div>
            </label>
            <label v-else-if="currentValidationLoginType === '短信验证码'">
              <span>短信验证码</span>
              <div class="captcha-row">
                <a-input v-model:value="validationForm.smsCode" placeholder="请输入短信验证码" />
                <a-button @click="sendSmsCode">获取验证码</a-button>
              </div>
            </label>
            <div v-else-if="currentValidationLoginType === '手机扫码'" class="scan-box">
              <div class="mock-qr">
                <i v-for="index in 25" :key="index" :class="{ dark: [1, 2, 4, 6, 8, 12, 14, 16, 18, 20, 22, 24, 25].includes(index) }"></i>
              </div>
              <span>请使用目标系统移动端扫码确认后点击验证。</span>
            </div>
          </template>
        </div>

        <div class="validation-result">
          <div class="validation-result-head">
            <h3>验证结果</h3>
            <span v-if="validationResult">{{ validationResult.checkedAt }}</span>
          </div>
          <template v-if="validationResult">
            <div class="result-status" :class="{ success: validationResult.success }">
              <CheckCircleOutlined v-if="validationResult.success" />
              <CloseOutlined v-else />
              <span>{{ validationResult.message }}</span>
            </div>
            <div class="field-name-list">
              <span v-for="fieldName in validationResult.fieldNames" :key="fieldName">{{ fieldName }}</span>
            </div>
            <div class="entity-table">
              <div v-for="(value, key) in validationResult.entity" :key="key">
                <span>{{ key }}</span>
                <strong>{{ value }}</strong>
              </div>
            </div>
          </template>
          <div v-else class="empty-result">
            <SafetyCertificateOutlined />
            <span>{{ validatingEmployee.kind === '微信群' ? '点击验证后，将根据微信聊天记录中的文字和图片输出结构化字段。' : '完成登录验证后，将展示一条 TMS 运单结构化样例。' }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <a-button @click="closeValidationModal">关闭</a-button>
        <a-button type="primary" @click="validateEmployee">验证</a-button>
      </template>
    </a-modal>

    <a-modal
      v-model:open="isDictModalOpen"
      :title="isEditingDict ? '编辑字典项' : '新增字典项'"
      width="760px"
      ok-text="保存"
      cancel-text="取消"
      @ok="confirmDictEntry"
      @cancel="closeDictModal"
    >
      <div class="dict-form">
        <div class="dict-form-grid">
          <label>
            <span>维度</span>
            <a-select v-model:value="dictForm.dimension">
              <a-select-option v-for="dim in dictDimensions" :key="dim" :value="dim">{{ dim }}</a-select-option>
            </a-select>
          </label>
          <label>
            <span>标准值<i>写回业务表的唯一值</i></span>
            <a-input v-model:value="dictForm.standard" placeholder="如 云南省煤炭交易（储配）中心有限公司" />
          </label>
          <label>
            <span>编码<i>可选</i></span>
            <a-input v-model:value="dictForm.code" placeholder="如 CUST-001" />
          </label>
          <label>
            <span>归属企业</span>
            <a-select v-model:value="dictForm.enterpriseId" @change="dictForm.projectId = ''">
              <a-select-option v-for="item in tenantEnterprises" :key="item.id" :value="item.id">{{ item.shortName }}</a-select-option>
            </a-select>
          </label>
          <label>
            <span>归属项目<i>留空 = 全企业生效</i></span>
            <a-select v-model:value="dictForm.projectId" allow-clear placeholder="全企业生效">
              <a-select-option v-for="item in dictFormProjects" :key="item.id" :value="item.id">{{ item.name }}</a-select-option>
            </a-select>
          </label>
        </div>

        <div class="dict-form-alias">
          <div class="dict-form-alias-head">
            <div>
              <strong>别名</strong>
              <span>精确命中后自动改写为标准值；包含 / 正则仅在审核页提示，需人工确认</span>
            </div>
            <a-button size="small" @click="addDictAlias">
              <template #icon><PlusOutlined /></template>
              添加别名
            </a-button>
          </div>
          <div v-for="(alias, index) in dictForm.aliases" :key="index" class="dict-alias-row">
            <a-input v-model:value="alias.text" placeholder="识别到的文本，如 云南煤炭交易中心" />
            <a-select v-model:value="alias.mode" class="dict-alias-mode">
              <a-select-option value="精确">精确</a-select-option>
              <a-select-option value="包含">包含</a-select-option>
              <a-select-option value="正则">正则</a-select-option>
            </a-select>
            <a-input-number v-model:value="alias.priority" :min="1" :max="99" placeholder="优先级" />
            <a-tag :color="alias.source === '历史挖掘' ? 'purple' : 'default'">{{ alias.source }}</a-tag>
            <button type="button" class="plate-pair-remove" @click="removeDictAlias(index)"><DeleteOutlined /></button>
          </div>
          <p v-if="!dictForm.aliases.length" class="dict-empty">还没有别名，点击右上角添加</p>
        </div>
      </div>
    </a-modal>

    <a-modal
      v-model:open="isRouteModalOpen"
      title="新增线路映射"
      width="560px"
      ok-text="保存"
      cancel-text="取消"
      @ok="confirmRouteRule"
    >
      <div class="dict-form">
        <p class="dict-note">装货地 + 卸货地组合命中后写入标准线路；未命中的组合会在磅单审核页标疑点。</p>
        <div class="dict-form-grid single">
          <label>
            <span>归属企业</span>
            <a-select v-model:value="routeForm.enterpriseId">
              <a-select-option v-for="item in tenantEnterprises" :key="item.id" :value="item.id">{{ item.shortName }}</a-select-option>
            </a-select>
          </label>
          <label>
            <span>装货地</span>
            <a-input v-model:value="routeForm.loadingPlace" placeholder="如 云南砚山矿务" />
          </label>
          <label>
            <span>卸货地</span>
            <a-input v-model:value="routeForm.unloadingPlace" placeholder="如 靖西天桂铝业" />
          </label>
          <label>
            <span>标准线路</span>
            <a-input v-model:value="routeForm.route" placeholder="如 砚山→靖西天桂" />
          </label>
        </div>
      </div>
    </a-modal>

    <a-modal
      v-model:open="isAllowModalOpen"
      :title="allowModalKind === 'customerGoods' ? '新增客户货物清单' : '新增货物矿别清单'"
      width="560px"
      ok-text="保存"
      cancel-text="取消"
      @ok="confirmAllowRule"
    >
      <div class="dict-form">
        <p class="dict-note">
          {{ allowModalKind === 'customerGoods'
            ? '该客户只应出现清单内的货物，识别到清单外货物时按 R3 冲突动作处理。'
            : '该货物只应对应清单内的矿别 / 规格，识别到清单外矿别时按 R4 冲突动作处理。' }}
        </p>
        <div class="dict-form-grid single">
          <label>
            <span>归属企业</span>
            <a-select v-model:value="allowForm.enterpriseId">
              <a-select-option v-for="item in tenantEnterprises" :key="item.id" :value="item.id">{{ item.shortName }}</a-select-option>
            </a-select>
          </label>
          <label>
            <span>{{ allowModalKind === 'customerGoods' ? '客户' : '货物' }}</span>
            <a-input
              v-model:value="allowForm.subject"
              :placeholder="allowModalKind === 'customerGoods' ? '如 广西华银铝业' : '如 褐煤32'"
            />
          </label>
          <label>
            <span>
              {{ allowModalKind === 'customerGoods' ? '允许货物' : '允许矿别 / 规格' }}
              <i>多个用顿号或逗号分隔</i>
            </span>
            <a-textarea
              v-model:value="allowForm.allowedText"
              :rows="3"
              :placeholder="allowModalKind === 'customerGoods' ? '如 氧化铝、散装氧化铝' : '如 A-20、A-21、H-06'"
            />
          </label>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:open="isDimensionModalOpen" title="管理字典维度" width="600px" :footer="null">
      <div class="dict-form">
        <p class="dict-note">
          维度不限于磅单字段。报销审核的费用类型、收款方等也可以建成维度，共用同一套别名归一能力。已被字典项引用的维度不能删除。
        </p>
        <div class="dimension-add-row">
          <a-input v-model:value="newDimensionName" placeholder="新维度名称，如 报销事项、付款账户" @keydown.enter="addDimension" />
          <a-button type="primary" @click="addDimension">
            <template #icon><PlusOutlined /></template>
            新增维度
          </a-button>
        </div>
        <div class="dimension-list">
          <div v-for="dim in dictDimensions" :key="dim" class="dimension-item">
            <strong>{{ dim }}</strong>
            <span>{{ dimensionUsage(dim) }} 条字典项</span>
            <button
              type="button"
              class="plate-pair-remove"
              :disabled="dimensionUsage(dim) > 0"
              :title="dimensionUsage(dim) > 0 ? '该维度下还有字典项，不能删除' : '删除维度'"
              @click="removeDimension(dim)"
            >
              <DeleteOutlined />
            </button>
          </div>
        </div>
      </div>
    </a-modal>

    <a-modal v-model:open="isMemoryDrawerOpen" title="用户修正记忆" width="720px" :footer="null">
      <div class="dict-drawer">
        <p class="dict-note">审核员在磅单审核页手工修正过的值。开集字段确认后转为正式别名；车牌 / 驾驶员等受控字段不建别名，反复修正说明档案或纠错表需要更新。</p>

        <div v-if="aliasMemories.length" class="dict-drawer-section">
          <strong>可转为别名（{{ aliasMemories.length }} 条）</strong>
          <div v-for="memory in aliasMemories" :key="memory.id" class="dict-candidate-row">
            <div class="dict-candidate-meta">
              <a-tag color="green">{{ memory.dimension }}</a-tag>
              <em>修正 {{ memory.count }} 次 · {{ memory.lastAt }}</em>
            </div>
            <div class="dict-memory-diff">
              <span class="from">{{ memory.from }}</span>
              <i>→</i>
              <span class="to">{{ memory.to }}</span>
              <em>{{ memory.source }}</em>
            </div>
            <div class="dict-candidate-actions">
              <a-button size="small" type="primary" @click="adoptMemory(memory)">转为别名</a-button>
              <a-button size="small" @click="discardMemory(memory)">忽略</a-button>
            </div>
          </div>
        </div>

        <div v-if="controlledMemories.length" class="dict-drawer-section">
          <strong>受控字段修正（{{ controlledMemories.length }} 条，请检查档案 / 纠错表）</strong>
          <div v-for="memory in controlledMemories" :key="memory.id" class="dict-candidate-row">
            <div class="dict-candidate-meta">
              <a-tag color="orange">{{ memory.dimension }}</a-tag>
              <em>修正 {{ memory.count }} 次 · {{ memory.lastAt }}</em>
            </div>
            <div class="dict-memory-diff">
              <span class="from">{{ memory.from }}</span>
              <i>→</i>
              <span class="to">{{ memory.to }}</span>
            </div>
            <div class="dict-candidate-actions">
              <a-button size="small" @click="discardMemory(memory)">已处理</a-button>
            </div>
          </div>
        </div>

        <p v-if="!aliasMemories.length && !controlledMemories.length" class="dict-empty">暂无修正记忆。审核页保存修改后会自动出现在这里。</p>
      </div>
    </a-modal>

    <a-modal v-model:open="isCandidateDrawerOpen" title="待确认候选" width="720px" :footer="null">
      <div class="dict-drawer">
        <p class="dict-note">系统扫描历史磅单，按相似度聚合出的疑似同义值。「合并」取出现次数最多的作标准值，其余转为别名。</p>
        <div v-for="candidate in dictCandidates" :key="candidate.id" class="dict-candidate-row">
          <div class="dict-candidate-meta">
            <a-tag color="purple">{{ candidate.dimension }}</a-tag>
            <em>相似度 {{ candidate.similarity }}%</em>
          </div>
          <div class="dict-candidate-values">
            <span v-for="value in candidate.values" :key="value.text">{{ value.text }}<i>{{ value.count }} 条</i></span>
          </div>
          <div class="dict-candidate-actions">
            <a-button size="small" type="primary" @click="mergeCandidate(candidate)">合并</a-button>
            <a-button size="small" @click="ignoreCandidate(candidate)">忽略</a-button>
          </div>
        </div>
        <p v-if="!dictCandidates.length" class="dict-empty">暂无待确认候选，历史数据已全部归一。</p>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
.agentops-shell {
  display: grid;
  grid-template-rows: 76px minmax(0, 1fr);
  min-height: 100vh;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(200, 185, 179, 0.18), rgba(252, 252, 252, 0.98)),
    #fcfcfc;
  color: #172033;
}

.agentops-header {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  padding: 0 22px;
  border-bottom: 1px solid #c8b9b3;
  background: rgba(255, 255, 255, 0.94);
}

.agentops-brand,
.agentops-header-status {
  display: flex;
  align-items: center;
  gap: 10px;
}

.agentops-mark {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: #0f172a;
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
}

.agentops-brand strong,
.agentops-brand span,
.agentops-title span,
.agentops-header-status span {
  display: block;
}

.agentops-brand strong {
  color: #0f172a;
  font-size: 15px;
  line-height: 21px;
}

.agentops-brand span,
.agentops-title span,
.agentops-header-status span {
  color: #64748b;
  font-size: 12px;
}

.agentops-title {
  min-width: 0;
}

.agentops-title h1 {
  margin: 2px 0 0;
  color: #0f172a;
  font-size: 22px;
  line-height: 30px;
  letter-spacing: 0;
}

.agentops-header-status {
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid #deded9;
  border-radius: 8px;
  background: #fbfbfa;
  color: #334155;
}

.agentops-header-status svg {
  color: #f77113;
}

.agentops-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 12px;
  height: calc(100vh - 76px);
  min-height: 0;
  overflow: hidden;
  padding: 14px;
}

.agentops-sidebar {
  display: flex;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #d6dee8;
  border-radius: 8px;
  background: #ffffff;
}

.agentops-sidebar-head {
  padding: 14px;
  border-bottom: 1px solid #e2e8f0;
  background: #fbfbfb;
}

.agentops-sidebar-head h2 {
  margin: 0;
  color: #0f172a;
  font-size: 15px;
  line-height: 22px;
}

.agentops-sidebar-head p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 18px;
}

.agentops-nav {
  display: grid;
  gap: 6px;
  padding: 10px;
}

.agentops-nav button {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 9px;
  align-items: flex-start;
  width: 100%;
  min-height: 58px;
  padding: 9px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: #334155;
  cursor: pointer;
  text-align: left;
}

.agentops-nav button:hover {
  background: #f8fafc;
}

.agentops-nav button.active {
  border-color: #f77113;
  background: #fff7ed;
  color: #0f172a;
}

.agentops-nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
}

.agentops-nav button.active .agentops-nav-icon {
  background: #0f172a;
  color: #ffffff;
}

.agentops-nav strong,
.agentops-nav em {
  display: block;
  min-width: 0;
}

.agentops-nav strong {
  font-size: 13px;
  line-height: 19px;
}

.agentops-nav em {
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;
  font-style: normal;
  line-height: 17px;
}

.agentops-sidebar-foot {
  margin-top: auto;
  padding: 12px 14px;
  border-top: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 12px;
  line-height: 18px;
  background: #fbfbfb;
}

.agentops-page {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  gap: 12px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding-right: 4px;
}

.ops-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.ops-summary-item,
.ops-panel {
  border: 1px solid #d6dee8;
  border-radius: 8px;
  background: #ffffff;
}

.ops-summary-item {
  min-height: 92px;
  padding: 13px 14px;
}

.ops-summary-item span,
.ops-summary-item em {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-style: normal;
}

.ops-summary-item strong {
  display: block;
  margin-top: 7px;
  color: #0f172a;
  font-size: 24px;
  line-height: 31px;
}

.ops-summary-item em {
  margin-top: 5px;
}

.agentops-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 14px;
  height: 100%;
  min-height: 0;
}

.ops-panel {
  min-width: 0;
  overflow: hidden;
}

.employee-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
}

.ops-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-height: 66px;
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
  background: #fbfbfb;
}

.ops-panel-head.compact {
  min-height: 58px;
}

.ops-panel-head h2,
.validation-result-head h3 {
  margin: 0;
  color: #0f172a;
  font-size: 15px;
  line-height: 22px;
}

.ops-panel-head p {
  margin: 3px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 18px;
}

.ops-actions,
.table-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.table-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.employee-table-wrap,
.groups-table-wrap,
.dataset-table-wrap {
  overflow: auto;
}

.employee-table-wrap {
  min-height: 0;
}

.ops-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

.employee-table {
  table-layout: fixed;
}

.ops-table th {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 11px 14px;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 12px;
  font-weight: 700;
}

.ops-table td {
  padding: 13px 14px;
  border-bottom: 1px solid #edf2f7;
  vertical-align: top;
}

.employee-table th:nth-child(1) {
  width: 30%;
}

.employee-table th:nth-child(2) {
  width: 22%;
}

.employee-table th:nth-child(3) {
  width: 32%;
}

.employee-table th:nth-child(4) {
  width: 16%;
}

.employee-table tbody tr {
  cursor: pointer;
}

.employee-table tbody tr:hover,
.employee-table tbody tr.selected {
  background: #fff7ed;
}

.ops-table td > strong,
.ops-table td > span {
  display: block;
}

.ops-table td > strong {
  color: #0f172a;
  line-height: 21px;
}

.ops-table td > span,
.skill-meta span,
.skill-meta em {
  color: #64748b;
  font-size: 12px;
  line-height: 18px;
}

.employee-table td:first-child > span {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.employee-table td:first-child > strong {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.employee-kind {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.employee-kind.wechat {
  color: #166534;
  background: #edf9f3;
}

.employee-kind.tms {
  color: #075985;
  background: #eff6ff;
}

.tenant-visible {
  display: block;
  max-width: 180px;
  margin-top: 6px;
  overflow: hidden;
  color: #64748b;
  font-size: 12px;
  line-height: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-scope {
  display: grid;
  gap: 4px;
  margin-bottom: 9px;
}

.project-scope strong,
.project-scope span {
  display: block;
}

.project-scope strong {
  color: #0f172a;
  font-size: 13px;
  line-height: 19px;
}

.project-scope span {
  color: #64748b;
  font-size: 12px;
  line-height: 17px;
}

.group-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.group-chip {
  display: inline-flex;
  max-width: 260px;
  min-height: 24px;
  align-items: center;
  padding: 3px 8px;
  overflow: hidden;
  border: 1px solid #dbe7df;
  border-radius: 999px;
  background: #f7fbf8;
  color: #166534;
  font-size: 12px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tms-access {
  display: grid;
  gap: 6px;
}

.tms-access code {
  max-width: 260px;
  overflow: hidden;
  color: #334155;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-meta {
  display: grid;
  gap: 4px;
  min-width: 128px;
}

.skill-meta strong {
  color: #0f172a;
}

.skill-meta span {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-meta em {
  font-style: normal;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  gap: 5px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #ffffff;
  color: #334155;
  cursor: pointer;
  font-size: 12px;
  line-height: 24px;
}

.upload-button:hover {
  color: #08090c;
  border-color: #08090c;
}

.upload-button input {
  display: none;
}

.upload-button.inline {
  min-height: 30px;
  padding: 0 10px;
}

.skill-panel {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  height: 100%;
  min-height: 0;
}

.selected-employee-meta {
  display: grid;
  gap: 9px;
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
}

.selected-employee-meta div {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.selected-employee-meta span {
  color: #64748b;
  font-size: 12px;
}

.selected-employee-meta strong {
  min-width: 0;
  overflow: hidden;
  color: #0f172a;
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-preview {
  min-height: 0;
  margin: 0;
  overflow: auto;
  padding: 16px 18px;
  background: #fbfbfa;
  color: #334155;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  line-height: 21px;
  white-space: pre-wrap;
}

.groups-table th:nth-child(1) {
  width: 27%;
}

.groups-panel,
.dataset-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  min-height: 0;
}

.groups-table th:nth-child(2) {
  width: 160px;
}

.groups-table th:nth-child(3) {
  width: 110px;
}

.groups-table th:nth-child(5) {
  width: 320px;
}

.dataset-panel {
  min-height: 520px;
}

.dataset-table th:nth-child(1) {
  width: 210px;
}

.dataset-table th:nth-child(3) {
  width: 280px;
}

.dataset-table code {
  color: #0f172a;
  font-size: 12px;
}

.dataset-table strong {
  color: #334155;
  font-size: 12px;
}

.owner-cell {
  display: flex;
  align-items: center;
  gap: 9px;
}

.owner-cell span {
  color: #334155;
  font-weight: 700;
}

.usage-cell {
  display: grid;
  gap: 6px;
}

.usage-label,
.empty-usage {
  color: #64748b;
  font-size: 12px;
}

.usage-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.employee-form {
  display: grid;
  gap: 13px;
}

.employee-form label,
.validation-input label {
  display: grid;
  gap: 6px;
}

.employee-form label > span,
.validation-input label > span,
.group-selector-head span,
.skill-editor-head span,
.wechat-validation-source > span,
.sample-chat > span {
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.group-selector {
  display: grid;
  gap: 8px;
}

.wechat-employee-config {
  display: grid;
  gap: 13px;
}

.group-selector-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.group-selector-head em {
  color: #94a3b8;
  font-size: 12px;
  font-style: normal;
}

.selected-group-list,
.group-search-results {
  display: grid;
  gap: 7px;
}

.selected-group-item,
.group-search-result {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  min-height: 46px;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fbfbfb;
}

.selected-group-item strong,
.selected-group-item span,
.group-search-result strong,
.group-search-result em {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-group-item strong,
.group-search-result strong {
  color: #0f172a;
  font-size: 12px;
  line-height: 18px;
}

.selected-group-item span,
.group-search-result em {
  color: #64748b;
  font-size: 12px;
  font-style: normal;
  line-height: 17px;
}

.selected-group-item button,
.group-search-result b {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 46px;
  height: 26px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #ffffff;
  color: #334155;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}

.selected-group-item button:hover,
.group-search-result:hover b {
  color: #08090c;
  border-color: #08090c;
}

.group-search-result {
  width: 100%;
  cursor: pointer;
  text-align: left;
}

.group-search-result:hover {
  border-color: #86efac;
  background: #f0fdf4;
}

.group-search-box {
  margin-top: 4px;
}

.empty-selected-groups {
  padding: 10px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 12px;
  line-height: 18px;
}

.group-selector-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  max-height: 210px;
  overflow: auto;
  padding-right: 4px;
}

.group-option {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fbfbfb;
  cursor: pointer;
}

.group-option.checked {
  border-color: #86efac;
  background: #f0fdf4;
}

.group-option input {
  margin: 0;
}

.group-option strong {
  min-width: 0;
  overflow: hidden;
  color: #0f172a;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-option em {
  color: #64748b;
  font-size: 12px;
  font-style: normal;
}

.skill-editor {
  display: grid;
  gap: 8px;
}

.skill-editor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.validation-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  gap: 12px;
}

.validation-input,
.validation-result {
  min-height: 430px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
}

.validation-input {
  display: grid;
  align-content: start;
  gap: 12px;
  padding: 12px;
}

.validation-source {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  background: #f8fafc;
}

.validation-source svg {
  color: #f77113;
  font-size: 20px;
}

.validation-source strong,
.validation-source span {
  display: block;
}

.validation-source span {
  color: #64748b;
  font-size: 12px;
}

.wechat-validation-source,
.sample-chat {
  display: grid;
  gap: 8px;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fbfbfb;
}

.validation-scope-line {
  display: grid;
  gap: 4px;
}

.validation-scope-line strong,
.validation-scope-line em {
  display: block;
}

.validation-scope-line strong {
  color: #0f172a;
  font-size: 13px;
}

.validation-scope-line em {
  color: #64748b;
  font-size: 12px;
  font-style: normal;
}

.sample-chat p {
  margin: 0;
  color: #334155;
  font-size: 13px;
  line-height: 20px;
}

.sample-image-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.sample-image-row img {
  width: 92px;
  height: 70px;
  flex: 0 0 auto;
  border-radius: 6px;
  object-fit: cover;
}

.captcha-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
}

.captcha-row b {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 76px;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #f8fafc;
  color: #0f172a;
  letter-spacing: 0;
}

.scan-box {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fbfbfb;
  color: #64748b;
  font-size: 12px;
}

.mock-qr {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(5, 1fr);
  gap: 3px;
  width: 112px;
  height: 112px;
  padding: 8px;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.12);
}

.mock-qr i {
  border-radius: 2px;
  background: #e2e8f0;
}

.mock-qr i.dark {
  background: #0f172a;
}

.validation-result {
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
}

.validation-result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 46px;
  padding: 11px 12px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.validation-result-head span {
  color: #64748b;
  font-size: 12px;
}

.result-status {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 12px;
  padding: 10px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
  line-height: 20px;
}

.result-status.success {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.field-name-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 12px 12px;
}

.field-name-list span {
  padding: 3px 7px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 11px;
}

.entity-table {
  margin: 0 12px 12px;
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.entity-table div {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  min-height: 34px;
  border-bottom: 1px solid #edf2f7;
}

.entity-table div:last-child {
  border-bottom: 0;
}

.entity-table span,
.entity-table strong {
  padding: 8px;
  font-size: 12px;
  line-height: 18px;
}

.entity-table span {
  overflow: hidden;
  background: #f8fafc;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entity-table strong {
  color: #0f172a;
  font-weight: 600;
}

.empty-result {
  display: grid;
  place-items: center;
  gap: 10px;
  min-height: 300px;
  padding: 24px;
  color: #94a3b8;
  text-align: center;
}

.empty-result svg {
  font-size: 30px;
}

@media (max-width: 1440px) {
  .ops-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* ===== 企业字典 ===== */
.dict-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  min-height: 0;
}

.dict-body {
  min-height: 0;
  overflow: auto;
  padding: 14px;
}

.dict-stat-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.dict-stat-row > div,
.dict-stat-entry {
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  background: #f8fafc;
}

.dict-stat-entry {
  position: relative;
  text-align: left;
  cursor: pointer;
  font: inherit;
  transition: box-shadow 0.15s;
}

.dict-stat-entry em {
  position: absolute;
  right: 12px;
  bottom: 10px;
  color: #94a3b8;
  font-size: 11px;
  font-style: normal;
}

.dict-stat-entry.ok {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.dict-stat-entry.ok:hover {
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.16);
}

.dict-stat-entry.warn {
  border-color: #fed7aa;
  background: #fff7ed;
}

.dict-stat-entry.warn:hover {
  box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.16);
}

.dict-stat-row span,
.dict-stat-entry span {
  display: block;
  color: #64748b;
  font-size: 12px;
}

.dict-stat-row strong,
.dict-stat-entry strong {
  display: block;
  margin-top: 3px;
  font-size: 18px;
  color: #0f172a;
}

.dict-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.dict-tabs button {
  padding: 7px 16px;
  border: 1px solid #d6dee8;
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  color: #475569;
}

.dict-tabs button.active {
  border-color: #0f172a;
  background: #0f172a;
  color: #ffffff;
}

.dict-filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.dict-select {
  min-width: 150px;
}

.dict-search {
  max-width: 260px;
}

.dict-drawer {
  max-height: 62vh;
  overflow: auto;
}

.dict-drawer-section {
  margin-bottom: 14px;
}

.dict-drawer-section > strong {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #0f172a;
}

.dict-drawer .dict-candidate-row {
  margin-top: 0;
  margin-bottom: 8px;
  border-color: #e2e8f0;
}

.dict-memory-diff {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.dict-memory-diff .from {
  padding: 3px 9px;
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #fef2f2;
  color: #b91c1c;
  text-decoration: line-through;
}

.dict-memory-diff .to {
  padding: 3px 9px;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  background: #f0fdf4;
  color: #166534;
  font-weight: 600;
}

.dict-memory-diff i {
  color: #94a3b8;
  font-style: normal;
}

.dict-memory-diff em {
  color: #94a3b8;
  font-size: 11px;
  font-style: normal;
}

.dict-candidate-row {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
  padding: 8px 10px;
  border: 1px solid #fde6c8;
  border-radius: 8px;
  background: #ffffff;
}

.dict-candidate-meta em {
  display: block;
  margin-top: 4px;
  color: #b45309;
  font-size: 12px;
  font-style: normal;
}

.dict-candidate-values {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dict-candidate-values span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 9px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f8fafc;
  font-size: 12px;
}

.dict-candidate-values i {
  color: #94a3b8;
  font-size: 11px;
  font-style: normal;
}

.dict-candidate-actions {
  display: flex;
  gap: 6px;
}

.dict-table td > span {
  display: block;
  color: #64748b;
  font-size: 12px;
}

.dict-table {
  border: 1px solid #e2e8f0;
}

/* 嵌套在小节里的表格不参与外层滚动吸顶 */
.dict-subsection .dict-table th {
  position: static;
}

.dict-table tr:last-child td {
  border-bottom: 0;
}

/* 停用行只淡化文本，开关/按钮保持清晰可点 */
.dict-table tr.disabled td > strong,
.dict-table tr.disabled td > span,
.dict-table tr.disabled .dict-alias-cell {
  opacity: 0.45;
}

/* 联动规则表：说明并入规则列，动作列固定宽 */
.dict-rule-table th:nth-child(3) {
  width: 190px;
}

.dict-rule-table th:nth-child(2),
.dict-rule-table th:last-child {
  width: 90px;
}

.rule-action-select {
  width: 170px;
}

.dict-subsection.rule-off {
  opacity: 0.55;
}

.rule-off-hint {
  margin-left: 6px;
  color: #d97706;
  font-weight: 600;
}

.dict-alias-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dict-alias-chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px 2px 2px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f8fafc;
  font-size: 12px;
}

.dict-row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dict-empty {
  padding: 18px;
  text-align: center;
  color: #94a3b8;
  font-size: 12px;
}

.dict-note {
  margin: 0 0 12px;
  padding: 9px 12px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1e40af;
  font-size: 12px;
  line-height: 1.6;
}

.dict-mono {
  font-family: 'SF Mono', Menlo, monospace;
  font-size: 12px;
}

.dict-subsection {
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  background: #ffffff;
}

.dict-subsection-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.dict-subsection-head strong {
  display: block;
  font-size: 13px;
}

/* 只作用于标题区的说明文字，避免命中旁边按钮内部的 span */
.dict-subsection-head > div > span {
  display: block;
  margin-top: 2px;
  color: #94a3b8;
  font-size: 12px;
}

.plate-pair-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.plate-pair {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.plate-pair :deep(.ant-input) {
  width: 40px;
  text-align: center;
}

.plate-pair em {
  color: #94a3b8;
  font-style: normal;
}

.plate-pair-remove {
  display: inline-flex;
  align-items: center;
  border: 0;
  background: transparent;
  color: #cbd5e1;
  cursor: pointer;
  padding: 2px;
}

.plate-pair-remove:hover {
  color: #dc2626;
}

.dict-example {
  margin-top: 12px;
  padding: 9px 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #475569;
  font-size: 12px;
  line-height: 1.7;
}

.dict-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.dict-form-grid.single {
  grid-template-columns: 1fr;
}

.dict-form-grid label span {
  display: block;
  margin-bottom: 5px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
}

.dict-form-grid label span i {
  margin-left: 6px;
  color: #94a3b8;
  font-weight: 400;
  font-style: normal;
}

.dict-form-grid label :deep(.ant-select),
.dict-form-grid label :deep(.ant-input) {
  width: 100%;
}

.dict-form-alias {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  background: #f8fafc;
}

.dict-form-alias-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.dict-form-alias-head strong {
  display: block;
  font-size: 13px;
}

.dict-form-alias-head > div > span {
  display: block;
  margin-top: 2px;
  color: #94a3b8;
  font-size: 12px;
}

.dimension-add-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 46vh;
  overflow: auto;
}

.dimension-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.dimension-item strong {
  font-size: 13px;
}

.dimension-item span {
  color: #94a3b8;
  font-size: 12px;
}

.plate-pair-remove:disabled {
  color: #e2e8f0;
  cursor: not-allowed;
}

.dict-alias-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 92px 90px auto auto;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

/* 列宽：仅别名字典主表，别名列吃掉剩余空间 */
.dict-alias-table th:nth-child(3) {
  width: 34%;
}

.dict-alias-table th:last-child {
  width: 132px;
}

@media (max-width: 1440px) {
  .dict-stat-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dict-candidate-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .dict-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
