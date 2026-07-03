<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  CheckCircleOutlined,
  CloseOutlined,
  CloudUploadOutlined,
  EditOutlined,
  FileSearchOutlined,
  MessageOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UploadOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

type EmployeeKind = 'TMS' | '微信群';
type LoginType = '短信验证码' | '手机扫码' | '图形验证码' | '无验证';
type ConfigTab = 'employees' | 'wechatGroups' | 'dataset';

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

interface DatasetField {
  example: string;
  name: string;
  semantic: string;
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
  groupSearch: '',
  groupIds: [] as string[],
  kind: 'TMS' as EmployeeKind,
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
  {
    id: 'tms-yunzhi',
    kind: 'TMS',
    name: '云志合通 TMS 数据员工',
    description: '抓取砚山储配站煤炭运输 TMS 的在途运单和回单状态。',
    loginUrl: 'https://tms.yunzhi.demo/login',
    loginType: '图形验证码',
    skillVersion: 'v1.3',
    skillUpdated: '今天 08:40',
    skillFileName: 'yunzhi-tms-waybill.skill.md',
    skillContent: `# 云志合通 TMS 运单映射 Skill

目标：进入“运输管理 / 在途运单”页面，抓取今日在途运单明细。

页面导航：
1. 登录后进入【运输管理】。
2. 打开【运单查询】并筛选状态=在途。
3. 抓取运单号、车牌、承运商、起运地、目的地、预计到达时间。

语义映射：
- 运单编号 -> waybill_no
- 车牌号码 -> vehicle_plate
- 承运单位 -> carrier_name
- 起运工厂 -> origin_name
- 收货仓库 -> destination_name
- 运输状态 -> order_status`
  },
  {
    id: 'tms-qujing',
    kind: 'TMS',
    name: '曲靖捷运 TMS 数据员工',
    description: '同步曲靖城建砂石配送项目的调度任务、运单状态和签收结果。',
    loginUrl: 'https://tms.qujing-jieyun.demo/login',
    loginType: '短信验证码',
    skillVersion: 'v1.1',
    skillUpdated: '07-02 15:18',
    skillFileName: 'qujing-tms-waybill.skill.md',
    skillContent: `# 曲靖捷运 TMS 运单映射 Skill

目标：从“调度中心 / 执行中任务”抓取砂石配送运单。

页面导航：
1. 使用账号和短信验证码登录。
2. 进入【调度中心】。
3. 打开【执行中任务】，按更新时间倒序抓取。

语义映射：
- 任务单号 -> waybill_no
- 司机车辆 -> vehicle_plate
- 物流商 -> carrier_name
- 装货点 -> origin_name
- 卸货点 -> destination_name
- 最新定位 -> current_location`
  }
]);

const selectedEmployee = computed(() => dataEmployees.value.find((employee) => employee.id === selectedEmployeeId.value) ?? dataEmployees.value[0]);
const isEditingEmployee = computed(() => editingEmployeeId.value.length > 0);
const employeeFormTitle = computed(() => `${isEditingEmployee.value ? '编辑' : '增加'}数据员工（${employeeForm.kind}）`);
const employeeFormConfirmText = computed(() => (isEditingEmployee.value ? '保存' : '确认增加'));
const tmsEmployeeCount = computed(() => dataEmployees.value.filter((employee) => employee.kind === 'TMS').length);
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
  { id: 'employees', label: '数据员工配置', desc: 'TMS、微信群、Skill 与验证', icon: TeamOutlined },
  { id: 'wechatGroups', label: '微信群列表', desc: '底层可接入的运营微信群', icon: MessageOutlined },
  { id: 'dataset', label: '标准数据集', desc: '字段语义、映射口径与示例', icon: FileSearchOutlined }
];

const standardFields: DatasetField[] = [
  { name: 'source_type', semantic: '数据来源类型，用于区分 TMS 页面、微信群文字、微信群图片。', example: '微信群图片' },
  { name: 'source_group_name', semantic: '微信群数据来源的群名称，便于追踪识别入口。', example: '云南云志合通·磅单回传群' },
  { name: 'source_system', semantic: 'TMS 或其他系统来源名称。', example: '云志合通 TMS 数据员工' },
  { name: 'message_time', semantic: '微信群消息发送时间或系统数据抓取时间。', example: '2026-07-03 09:42' },
  { name: 'sender_name', semantic: '微信群消息发送人昵称，适用于费用、磅单、维修等协同场景。', example: '罗队长' },
  { name: 'waybill_no', semantic: 'TMS 运单唯一编号，用于跨系统识别同一票运输任务。', example: 'WB202607030018' },
  { name: 'vehicle_plate', semantic: '车辆车牌号，支持从文本、磅单图片和 TMS 字段识别。', example: '赣J03528D' },
  { name: 'driver_name', semantic: '司机姓名或微信群中被提及的车辆驾驶员。', example: '罗明' },
  { name: 'cargo_name', semantic: '货品、物料或运输品类名称。', example: '褐煤32' },
  { name: 'weigh_type', semantic: '磅单类型，区分装货磅单、到货磅单或异常复磅。', example: '装货磅单' },
  { name: 'net_weight', semantic: '磅单净重，保留数值和单位。', example: '32.94 吨' },
  { name: 'expense_type', semantic: '费用类型，如加油费、充电费、维修费、过路费、报销费。', example: '加油费' },
  { name: 'amount', semantic: '费用金额或账单金额。', example: '486.00' },
  { name: 'payee', semantic: '付款对象、商户、维修厂或油站名称。', example: '华银高速口加油站' },
  { name: 'raw_image_ref', semantic: '微信聊天图片、票据图片或磅单原图引用。', example: 'weighbridge.jpg' }
];

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

function resetEmployeeForm(kind: EmployeeKind = 'TMS') {
  editingEmployeeId.value = '';
  employeeForm.kind = kind;
  employeeForm.name = '';
  employeeForm.description = '';
  employeeForm.enterpriseId = kind === '微信群' ? tenantEnterprises[0]?.id ?? '' : '';
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
            <p>数据员工（微信群）和数据员工（TMS）统一展示，新增入口分开。</p>
          </div>
          <div class="ops-actions">
            <a-button @click="openCreateEmployeeModal('TMS')">
              <template #icon><PlusOutlined /></template>
              增加数据员工（TMS）
            </a-button>
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

        <template v-else>
          <section class="ops-panel dataset-panel">
            <div class="ops-panel-head">
              <div>
                <h2>标准数据集</h2>
                <p>数据员工（TMS）和数据员工（微信群）识别结果统一映射到这里，便于后续审核、报表和追溯。</p>
              </div>
              <a-tag color="default">{{ standardFields.length }} 个字段</a-tag>
            </div>
            <div class="dataset-table-wrap">
              <table class="ops-table dataset-table">
                <thead>
                  <tr>
                    <th>字段名称</th>
                    <th>字段语义</th>
                    <th>数据示例</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="field in standardFields" :key="field.name">
                    <td><code>{{ field.name }}</code></td>
                    <td><span>{{ field.semantic }}</span></td>
                    <td><strong>{{ field.example }}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>
      </section>
    </main>

    <a-modal v-model:open="isEmployeeModalOpen" :title="employeeFormTitle" width="720px" ok-text="保存" cancel-text="取消" @ok="confirmEmployee" @cancel="closeEmployeeModal">
      <div class="employee-form">
        <label>
          <span>数据员工名称</span>
          <a-input v-model:value="employeeForm.name" :placeholder="employeeForm.kind === '微信群' ? '例如：曲靖城建砂石配送项目·费用微信群数据员工' : '例如：某客户 TMS 数据员工'" />
        </label>
        <label>
          <span>描述</span>
          <a-textarea v-model:value="employeeForm.description" :auto-size="{ minRows: 2, maxRows: 4 }" placeholder="说明该数据员工负责的数据来源、识别范围和业务场景" />
        </label>

        <template v-if="employeeForm.kind === 'TMS'">
          <label>
            <span>登录地址</span>
            <a-input v-model:value="employeeForm.loginUrl" placeholder="请输入 TMS 登录或接入地址" />
          </label>
          <label>
            <span>登录方式</span>
            <a-select v-model:value="employeeForm.loginType">
              <a-select-option v-for="type in loginTypes" :key="type" :value="type">{{ type }}</a-select-option>
            </a-select>
          </label>
        </template>

        <div v-else class="wechat-employee-config">
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
  align-content: start;
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
</style>
