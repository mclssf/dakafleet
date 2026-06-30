<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  AuditOutlined,
  BarChartOutlined,
  CarOutlined,
  CheckOutlined,
  CloseOutlined,
  DashboardOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  LeftOutlined,
  MessageOutlined,
  ProjectOutlined,
  RightOutlined,
  RobotOutlined,
  RotateRightOutlined,
  SearchOutlined,
  TableOutlined,
  WalletOutlined,
  WarningOutlined,
  ZoomInOutlined,
  ZoomOutOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import {
  expenseImages,
  initialAgentMessages,
  projects,
  quickPrompts,
  reimbursements,
  vehicles,
  weighBills
} from './data';
import type { AgentMessage, AuditStatus, Expense, FieldBox, PageKey, WeighBill } from './types';

const activePage = ref<PageKey>('agent');
const selectedProjectId = ref(projects[0].id);
const selectedVehicleId = ref(vehicles[0].id);
const agentInput = ref('');
const agentMessages = ref<AgentMessage[]>([...initialAgentMessages]);
const weighRows = ref<WeighBill[]>(weighBills.map((item) => ({ ...item, anomalies: [...item.anomalies] })));
const expenseRows = ref<Expense[]>(reimbursements.map((item) => ({ ...item, anomalies: [...item.anomalies], images: [...item.images] })));
const bulkExpenseRows = ref<Expense[]>(buildBulkExpenseRows());
const reviewWeighIndex = ref(Math.max(0, weighBills.findIndex((item) => item.auditStatus === '待审核')));
const reviewExpenseIndex = ref(Math.max(0, reimbursements.findIndex((item) => item.auditStatus === '待审核')));
const activeFieldKey = ref('');
const activeExpenseFieldKey = ref('');
const weighZoom = ref(1);
const weighRotation = ref(0);
const expenseZoom = ref(1);
const expenseRotation = ref(0);
const expenseImageIndex = ref(0);
const weighKeyword = ref('');
const expenseStatusFilter = ref<string>('全部');
const expenseKeyword = ref('');
const projectMenuExpanded = ref(true);
const todayDate = '2026-06-30';

const weighDefaults = {
  taxableUnitPrice: 61,
  cargoInsurance: 15,
  driverSalary: 600,
  taxRate: 0.07
};

const pageTitle: Record<PageKey, string> = {
  agent: '智能体工作台',
  weighAudit: '磅单审核',
  weighList: '磅单列表',
  expenseAudit: '报销审核',
  expenseList: '报销列表 / 付款明细',
  dashboard: '公司总车队看板',
  vehicleDetail: '车辆账目明细',
  projects: '项目 / 车队管理'
};

const companyNavItems: Array<{ key: PageKey; label: string; icon: unknown }> = [
  { key: 'dashboard', label: '总车队看板', icon: DashboardOutlined },
  { key: 'projects', label: '项目车队', icon: ProjectOutlined }
];

const projectNavItems: Array<{ key: PageKey; label: string; icon: unknown }> = [
  { key: 'agent', label: '智能体工作台', icon: MessageOutlined },
  { key: 'weighAudit', label: '磅单审核', icon: AuditOutlined },
  { key: 'weighList', label: '磅单列表', icon: TableOutlined },
  { key: 'expenseAudit', label: '报销审核', icon: FileSearchOutlined },
  { key: 'expenseList', label: '付款明细', icon: WalletOutlined },
  { key: 'vehicleDetail', label: '车辆账目明细', icon: CarOutlined }
];

const currentProject = computed(() => projects.find((project) => project.id === selectedProjectId.value) ?? projects[0]);
const scopedWeighRows = computed(() => weighRows.value.filter((item) => item.projectId === selectedProjectId.value));
const scopedExpenseRows = computed(() => expenseRows.value.filter((item) => item.projectId === selectedProjectId.value));
const allApprovedExpenseRows = computed(() => [...expenseRows.value.filter((item) => item.auditStatus === '已通过'), ...bulkExpenseRows.value]);
const approvedExpenseRows = computed(() => [
  ...scopedExpenseRows.value.filter((item) => item.auditStatus === '已通过'),
  ...bulkExpenseRows.value.filter((item) => item.projectId === selectedProjectId.value)
]);
const currentWeigh = computed(() => weighRows.value[reviewWeighIndex.value] ?? weighRows.value[0]);
const currentExpense = computed(() => expenseRows.value[reviewExpenseIndex.value] ?? expenseRows.value[0]);

const totalStats = computed(() => {
  const revenue = pairedWeighRows.value.reduce((sum, item) => sum + item.taxableOutput, 0);
  const transportCost = pairedWeighRows.value.reduce((sum, item) => sum + item.cargoInsurance + item.driverSalary + item.taxPoint, 0);
  const expenseCost = allApprovedExpenseRows.value.reduce((sum, item) => sum + item.amount, 0);
  return {
    vehicles: vehicles.length,
    running: vehicles.filter((item) => item.status === '运营中').length,
    revenue,
    cost: transportCost + expenseCost,
    profit: revenue - transportCost - expenseCost,
    pendingWeigh: weighRows.value.filter((item) => item.auditStatus === '待审核').length,
    pendingExpense: expenseRows.value.filter((item) => item.auditStatus === '待审核').length,
    issues: weighRows.value.filter((item) => item.anomalies.length).length + expenseRows.value.filter((item) => item.anomalies.length).length
  };
});

const projectStats = computed(() => {
  const projectBills = pairedWeighRows.value.filter((item) => item.projectId === selectedProjectId.value);
  const projectExpenses = allApprovedExpenseRows.value.filter((item) => item.projectId === selectedProjectId.value);
  const revenue = projectBills.reduce((sum, item) => sum + item.taxableOutput, 0);
  const transportCost = projectBills.reduce((sum, item) => sum + item.cargoInsurance + item.driverSalary + item.taxPoint, 0);
  const expenseCost = projectExpenses.reduce((sum, item) => sum + item.amount, 0);
  return {
    pendingWeigh: scopedWeighRows.value.filter((item) => item.auditStatus === '待审核').length,
    pendingExpense: scopedExpenseRows.value.filter((item) => item.auditStatus === '待审核').length,
    revenue,
    cost: transportCost + expenseCost,
    profit: revenue - transportCost - expenseCost,
    issues: scopedWeighRows.value.filter((item) => item.anomalies.length).length + scopedExpenseRows.value.filter((item) => item.anomalies.length).length,
    recent: [...scopedWeighRows.value.slice(0, 4), ...scopedExpenseRows.value.slice(0, 3)]
      .sort((a, b) => ('date' in b ? b.date : b.submittedAt).localeCompare('date' in a ? a.date : a.submittedAt))
      .slice(0, 5)
  };
});

const vehicleFinance = computed(() =>
  vehicles.map((vehicle) => {
    const bills = pairedWeighRows.value.filter((item) => item.vehiclePlate === vehicle.plate);
    const rawBills = weighRows.value.filter((item) => item.vehiclePlate === vehicle.plate);
    const expenses = allApprovedExpenseRows.value.filter((item) => item.vehiclePlate === vehicle.plate);
    const revenue = bills.reduce((sum, item) => sum + item.taxableOutput, 0);
    const cost = bills.reduce((sum, item) => sum + item.cargoInsurance + item.driverSalary + item.taxPoint, 0) + expenses.reduce((sum, item) => sum + item.amount, 0);
    const issues = rawBills.filter((item) => item.anomalies.length).length + expenses.filter((item) => item.anomalies.length).length;
    return { ...vehicle, trips: bills.length, netWeight: bills.reduce((sum, item) => sum + item.unloadingTonnage, 0), revenue, cost, profit: revenue - cost, issues };
  })
);

const currentVehicleFinance = computed(() => vehicleFinance.value.find((item) => item.id === selectedVehicleId.value) ?? vehicleFinance.value[0]);
const currentVehicleBills = computed(() => pairedWeighRows.value.filter((item) => item.vehiclePlate === currentVehicleFinance.value.plate));
const currentVehicleRawBills = computed(() => weighRows.value.filter((item) => item.vehiclePlate === currentVehicleFinance.value.plate));
const currentVehicleExpenses = computed(() => allApprovedExpenseRows.value.filter((item) => item.vehiclePlate === currentVehicleFinance.value.plate));
const currentVehicleTimeline = computed(() =>
  [
    ...currentVehicleBills.value.slice(0, 8).map((bill) => ({
      time: `${bill.unloadingDate} 18:00`,
      type: '磅单入账',
      detail: `${bill.loadingPlace} → ${bill.unloadingPlace} / ${bill.goods}`,
      amount: money(bill.taxableOutput),
      tone: bill.profit >= 0 ? 'green' : 'red'
    })),
    ...currentVehicleExpenses.value.slice(0, 8).map((expense) => ({
      time: expense.submittedAt,
      type: '费用入账',
      detail: `${expense.type} / ${expense.item}`,
      amount: money(expense.amount),
      tone: expense.payStatus === '已付款' ? 'blue' : 'orange'
    }))
  ]
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 10)
);

interface PairedWeighRecord {
  id: string;
  projectId: string;
  loadingDate: string;
  unloadingDate: string;
  orderNo: string;
  customer: string;
  vehiclePlate: string;
  arrivalVehiclePlate: string;
  driver: string;
  goods: string;
  loadingPlace: string;
  loadingTonnage: number;
  unloadingPlace: string;
  unloadingTonnage: number;
  taxableUnitPrice: number;
  cargoInsurance: number;
  taxRate: number;
  driverSalary: number;
  taxableOutput: number;
  taxPoint: number;
  profit: number;
  receivedFreight: number;
  collectionDate: string;
  period: string;
  sourceBillId: string;
}

function buildBulkExpenseRows(): Expense[] {
  const expenseTypes = [
    { type: '油费', items: ['服务区柴油', '城区油站加油', '夜间补油'], base: 420 },
    { type: '过路费', items: ['高速通行费', '省道收费站', '园区入口通行'], base: 138 },
    { type: '维修费', items: ['补胎', '气路检查', '电控系统排查'], base: 280 },
    { type: '停车费', items: ['园区临停', '排队停车', '夜间停车'], base: 28 },
    { type: '补电费', items: ['服务区补电', '龙临补电', '中转站补电'], base: 64 },
    { type: '餐费', items: ['等待卸货餐费', '夜间餐补', '临停餐费'], base: 45 },
    { type: '住宿费', items: ['临停住宿', '排队住宿', '晚点住宿'], base: 116 },
    { type: '加水费', items: ['水箱加水', '货箱清洗加水', '三次加水'], base: 18 }
  ];
  const statuses: Expense['payStatus'][] = ['未付款', '已付款', '已付款', '部分付款', '未付款', '已付款'];

  return projects.flatMap((project, projectIndex) => {
    const projectVehicles = vehicles.filter((vehicle) => vehicle.projectId === project.id);
    return Array.from({ length: 96 }, (_, index) => {
      const vehicle = projectVehicles[index % projectVehicles.length];
      const category = expenseTypes[(index + projectIndex) % expenseTypes.length];
      const amount = category.base + ((index * 17 + projectIndex * 29) % 190);
      const day = (index + projectIndex) % 16 === 0 ? '30' : String(1 + ((index + projectIndex * 3) % 28)).padStart(2, '0');
      const hour = String(8 + (index % 13)).padStart(2, '0');
      const minute = String((index * 7) % 60).padStart(2, '0');

      return {
        id: `LEDGER-${project.id}-${String(index + 1).padStart(3, '0')}`,
        projectId: project.id,
        driver: vehicle.driver,
        vehiclePlate: vehicle.plate,
        type: category.type,
        item: category.items[index % category.items.length],
        amount,
        occurredDate: `2026-06-${day}`,
        submittedAt: `2026-06-${day} ${hour}:${minute}`,
        images: [expenseImages[index % expenseImages.length]],
        payee: `${category.items[index % category.items.length]}供应商`,
        payStatus: statuses[index % statuses.length],
        auditStatus: '已通过',
        anomalies: [],
        confidence: 0.92,
        message: `${vehicle.driver} 提报 ${category.items[index % category.items.length]} ${amount} 元，已通过财务审核。`,
        fieldBoxes: []
      };
    });
  });
}

function buildBulkPairedWeighRows(): PairedWeighRecord[] {
  const routeMap: Record<string, { customer: string; goods: string[]; loading: string[]; unloading: string[]; base: number }> = {
    p1: {
      customer: '云南省煤炭交易（储配）中心有限公司',
      goods: ['褐煤32', '散装氧化铝', '氧化铝'],
      loading: ['砚山储配站', '广西华银装车点', '砚山矿区'],
      unloading: ['广西德保电厂', '靖西天桂库', '云南砚山库'],
      base: 42.4
    },
    p2: {
      customer: '曲靖城建物资有限公司',
      goods: ['砂石料', '机制砂', '碎石'],
      loading: ['富源采石场', '曲靖料场', '宣威北站'],
      unloading: ['曲靖园区', '宣威搅拌站', '富源中转场'],
      base: 39.2
    },
    p3: {
      customer: '广西华银铝业有限公司',
      goods: ['氧化铝', '铝土矿', '熟料'],
      loading: ['华银厂区', '田东料场', '砚山库'],
      unloading: ['田东华银料场', '靖西中转库', '砚山入库点'],
      base: 41.6
    }
  };

  return projects.flatMap((project, projectIndex) => {
    const projectVehicles = vehicles.filter((vehicle) => vehicle.projectId === project.id);
    const route = routeMap[project.id];
    const sourceBillId = weighRows.value.find((item) => item.projectId === project.id)?.id ?? weighRows.value[0].id;

    return Array.from({ length: 96 }, (_, index) => {
      const vehicle = projectVehicles[index % projectVehicles.length];
      const day = String(1 + ((index * 2 + projectIndex) % 28)).padStart(2, '0');
      const loadingDate = `2026-06-${day}`;
      const unloadDay = String(Math.min(29, Number(day) + (index % 3 === 0 ? 1 : 0))).padStart(2, '0');
      const unloadingDate = `2026-06-${unloadDay}`;
      const loadingTonnage = Number((route.base + (index % 7) * 0.46 + (index % 3) * 0.12).toFixed(2));
      const unloadingTonnage = Number((loadingTonnage - (index % 5) * 0.04).toFixed(2));
      const taxableOutput = unloadingTonnage * weighDefaults.taxableUnitPrice;
      const taxPoint = taxableOutput * weighDefaults.taxRate;
      const profit = taxableOutput - weighDefaults.cargoInsurance - weighDefaults.driverSalary - taxPoint;

      return {
        id: `MOCK-${project.id}-${index + 1}`,
        projectId: project.id,
        loadingDate,
        unloadingDate,
        orderNo: `WCKT2606${projectIndex + 1}${String(index + 1).padStart(4, '0')}`,
        customer: route.customer,
        vehiclePlate: vehicle.plate,
        arrivalVehiclePlate: vehicle.plate,
        driver: vehicle.driver,
        goods: route.goods[index % route.goods.length],
        loadingPlace: route.loading[index % route.loading.length],
        loadingTonnage,
        unloadingPlace: route.unloading[(index + 1) % route.unloading.length],
        unloadingTonnage,
        taxableUnitPrice: weighDefaults.taxableUnitPrice,
        cargoInsurance: weighDefaults.cargoInsurance,
        taxRate: weighDefaults.taxRate,
        driverSalary: weighDefaults.driverSalary,
        taxableOutput,
        taxPoint,
        profit,
        receivedFreight: taxableOutput,
        collectionDate: unloadingDate,
        period: '2026年06月',
        sourceBillId
      };
    });
  });
}

const pairedWeighRows = computed<PairedWeighRecord[]>(() => {
  const reviewedRows = weighRows.value.filter((item) => item.auditStatus !== '待审核' && item.auditStatus !== '已驳回' && item.type !== '未识别');
  const departures = reviewedRows.filter((item) => item.type === '出发磅单');
  const arrivals = reviewedRows.filter((item) => item.type === '到货磅单');
  const usedArrivalIds = new Set<string>();

  const imageDerivedRows = departures
    .map((departure) => {
      const arrival = arrivals
        .filter((item) => !usedArrivalIds.has(item.id))
        .filter((item) => item.projectId === departure.projectId && item.vehiclePlate === departure.vehiclePlate && item.goods === departure.goods)
        .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];

      if (!arrival) return null;
      usedArrivalIds.add(arrival.id);

      const taxableOutput = arrival.net * weighDefaults.taxableUnitPrice;
      const taxPoint = taxableOutput * weighDefaults.taxRate;
      const profit = taxableOutput - weighDefaults.cargoInsurance - weighDefaults.driverSalary - taxPoint;
      const routeParts = departure.remark.includes('-') ? departure.remark.split('-') : [];

      return {
        id: `${departure.id}-${arrival.id}`,
        projectId: departure.projectId,
        loadingDate: departure.date,
        unloadingDate: arrival.date,
        orderNo: departure.id.replace('WB', 'WCKT'),
        customer: departure.shipper,
        vehiclePlate: departure.vehiclePlate,
        arrivalVehiclePlate: arrival.vehiclePlate,
        driver: departure.driver,
        goods: departure.goods,
        loadingPlace: routeParts[0] || departure.shipper,
        loadingTonnage: departure.net,
        unloadingPlace: routeParts[1] || arrival.receiver,
        unloadingTonnage: arrival.net,
        taxableUnitPrice: weighDefaults.taxableUnitPrice,
        cargoInsurance: weighDefaults.cargoInsurance,
        taxRate: weighDefaults.taxRate,
        driverSalary: weighDefaults.driverSalary,
        taxableOutput,
        taxPoint,
        profit,
        receivedFreight: taxableOutput,
        collectionDate: arrival.date,
        period: `${arrival.date.slice(0, 7)}`
          .replace('-', '年')
          .concat('月'),
        sourceBillId: departure.id
      };
    })
    .filter((item): item is PairedWeighRecord => Boolean(item));

  return [...imageDerivedRows, ...buildBulkPairedWeighRows()];
});

const filteredPairedWeighRows = computed(() =>
  pairedWeighRows.value.filter((item) => {
    const keyword = weighKeyword.value.trim();
    const keywordMatched =
      !keyword ||
      [item.vehiclePlate, item.driver, item.goods, item.customer, item.loadingPlace, item.unloadingPlace, item.orderNo].some((value) => value.includes(keyword));
    return item.projectId === selectedProjectId.value && keywordMatched;
  })
);

const filteredExpenseRows = computed(() =>
  approvedExpenseRows.value.filter((item) => {
    const keyword = expenseKeyword.value.trim();
    const keywordMatched =
      !keyword ||
      [item.vehiclePlate, item.driver, item.type, item.item, item.payStatus].some((value) => value.includes(keyword));
    return (expenseStatusFilter.value === '全部' || item.payStatus === expenseStatusFilter.value) && keywordMatched;
  })
);

const weighListSummary = computed(() => ({
  trips: filteredPairedWeighRows.value.length,
  loadingNet: filteredPairedWeighRows.value.reduce((sum, item) => sum + item.loadingTonnage, 0),
  unloadingNet: filteredPairedWeighRows.value.reduce((sum, item) => sum + item.unloadingTonnage, 0),
  taxableOutput: filteredPairedWeighRows.value.reduce((sum, item) => sum + item.taxableOutput, 0),
  profit: filteredPairedWeighRows.value.reduce((sum, item) => sum + item.profit, 0)
}));

const expenseListSummary = computed(() => ({
  amount: filteredExpenseRows.value.reduce((sum, item) => sum + item.amount, 0),
  paid: filteredExpenseRows.value.filter((item) => item.payStatus === '已付款').reduce((sum, item) => sum + item.amount, 0),
  unpaid: filteredExpenseRows.value.filter((item) => item.payStatus !== '已付款').reduce((sum, item) => sum + item.amount, 0),
  todayExpenseCount: filteredExpenseRows.value.filter((item) => item.submittedAt.startsWith(todayDate)).length,
  todayPaidCount: filteredExpenseRows.value.filter((item) => item.submittedAt.startsWith(todayDate) && item.payStatus === '已付款').length
}));

const vehicleRank = computed(() => [...vehicleFinance.value].sort((a, b) => b.profit - a.profit));
const selectedProjectVehicles = computed(() => vehicles.filter((item) => item.projectId === selectedProjectId.value));
const maxVehicleProfit = computed(() => Math.max(1, ...vehicleRank.value.map((item) => Math.abs(item.profit))));

const expenseTypeSummary = computed(() => {
  const map = new Map<string, number>();
  filteredExpenseRows.value.forEach((item) => map.set(item.type, (map.get(item.type) ?? 0) + item.amount));
  return [...map.entries()].map(([type, amount]) => ({ type, amount }));
});

const expenseDriverSummary = computed(() => {
  const map = new Map<string, number>();
  filteredExpenseRows.value.forEach((item) => map.set(item.driver, (map.get(item.driver) ?? 0) + item.amount));
  return [...map.entries()]
    .map(([driver, amount]) => ({ driver, amount }))
    .sort((a, b) => b.amount - a.amount);
});

const dailyProfitTrend = computed(() => {
  const days = ['06-23', '06-24', '06-25', '06-26', '06-27', '06-28', '06-29'];
  return days.map((day) => {
    const date = `2026-${day}`;
    const revenue = weighRows.value.filter((item) => item.date === date).reduce((sum, item) => sum + item.freight, 0);
    const billCost = weighRows.value.filter((item) => item.date === date).reduce((sum, item) => sum + item.cost, 0);
    const expenseCost = expenseRows.value.filter((item) => item.occurredDate === date).reduce((sum, item) => sum + item.amount, 0);
    return { day, profit: revenue - billCost - expenseCost };
  });
});

const maxDailyProfit = computed(() => Math.max(1, ...dailyProfitTrend.value.map((item) => Math.abs(item.profit))));

const projectProfitComparison = computed(() =>
  projects.map((project) => {
    const bills = pairedWeighRows.value.filter((item) => item.projectId === project.id);
    const expenses = allApprovedExpenseRows.value.filter((item) => item.projectId === project.id);
    const revenue = bills.reduce((sum, item) => sum + item.taxableOutput, 0);
    const cost = bills.reduce((sum, item) => sum + item.cargoInsurance + item.driverSalary + item.taxPoint, 0) + expenses.reduce((sum, item) => sum + item.amount, 0);
    return { name: project.name, profit: revenue - cost };
  })
);

const weighColumns = [
  { title: '装货日期', dataIndex: 'loadingDate', sorter: (a: PairedWeighRecord, b: PairedWeighRecord) => a.loadingDate.localeCompare(b.loadingDate), width: 112 },
  { title: '卸货日期', dataIndex: 'unloadingDate', sorter: (a: PairedWeighRecord, b: PairedWeighRecord) => a.unloadingDate.localeCompare(b.unloadingDate), width: 112 },
  { title: '单号', dataIndex: 'orderNo', width: 152 },
  { title: '客户', dataIndex: 'customer', width: 240 },
  { title: '车牌', dataIndex: 'vehiclePlate', width: 118 },
  { title: '司机', dataIndex: 'driver', width: 86 },
  { title: '装货名称', dataIndex: 'goods', width: 118 },
  { title: '装货地点', dataIndex: 'loadingPlace', width: 128 },
  { title: '装货吨位', dataIndex: 'loadingTonnage', sorter: (a: PairedWeighRecord, b: PairedWeighRecord) => a.loadingTonnage - b.loadingTonnage, width: 106 },
  { title: '卸货地点', dataIndex: 'unloadingPlace', width: 128 },
  { title: '卸货吨位', dataIndex: 'unloadingTonnage', sorter: (a: PairedWeighRecord, b: PairedWeighRecord) => a.unloadingTonnage - b.unloadingTonnage, width: 106 },
  { title: '含税产值', dataIndex: 'taxableOutput', sorter: (a: PairedWeighRecord, b: PairedWeighRecord) => a.taxableOutput - b.taxableOutput, width: 112 },
  { title: '税点', dataIndex: 'taxPoint', sorter: (a: PairedWeighRecord, b: PairedWeighRecord) => a.taxPoint - b.taxPoint, width: 96 },
  { title: '利润', dataIndex: 'profit', sorter: (a: PairedWeighRecord, b: PairedWeighRecord) => a.profit - b.profit, width: 104 },
  { title: '操作', dataIndex: 'action', fixed: 'right', width: 82 }
];

const expenseColumns = [
  { title: '发生日期', dataIndex: 'occurredDate', width: 112 },
  { title: '车号', dataIndex: 'vehiclePlate', width: 116 },
  { title: '司机', dataIndex: 'driver', width: 82 },
  { title: '费用类型', dataIndex: 'type', width: 96 },
  { title: '事项', dataIndex: 'item' },
  { title: '金额', dataIndex: 'amount', sorter: (a: Expense, b: Expense) => a.amount - b.amount, width: 90 },
  { title: '付款对象', dataIndex: 'payee', width: 180 },
  { title: '支付状态', dataIndex: 'payStatus', width: 100 },
  { title: '提报时间', dataIndex: 'submittedAt', width: 148 },
  { title: '操作', dataIndex: 'action', fixed: 'right', width: 108 }
];

const vehicleColumns = [
  { title: '车牌', dataIndex: 'plate', width: 120 },
  { title: '司机', dataIndex: 'driver', width: 86 },
  { title: '项目', dataIndex: 'projectId' },
  { title: '趟数', dataIndex: 'trips', width: 74 },
  { title: '收入', dataIndex: 'revenue', width: 100 },
  { title: '成本', dataIndex: 'cost', width: 100 },
  { title: '利润', dataIndex: 'profit', width: 100 },
  { title: '异常', dataIndex: 'issues', width: 76 },
  { title: '操作', dataIndex: 'action', width: 88 }
];

const vehicleBillColumns = [
  { title: '装货日期', dataIndex: 'loadingDate', width: 112 },
  { title: '卸货日期', dataIndex: 'unloadingDate', width: 112 },
  { title: '单号', dataIndex: 'orderNo', width: 150 },
  { title: '货物', dataIndex: 'goods', width: 110 },
  { title: '装货地点', dataIndex: 'loadingPlace', width: 128 },
  { title: '卸货地点', dataIndex: 'unloadingPlace', width: 128 },
  { title: '卸货吨位', dataIndex: 'unloadingTonnage', width: 104 },
  { title: '含税产值', dataIndex: 'taxableOutput', width: 110 },
  { title: '利润', dataIndex: 'profit', width: 104 },
  { title: '操作', dataIndex: 'action', width: 80 }
];

const vehicleExpenseColumns = [
  { title: '发生日期', dataIndex: 'occurredDate', width: 112 },
  { title: '费用类型', dataIndex: 'type', width: 96 },
  { title: '事项', dataIndex: 'item', width: 150 },
  { title: '金额', dataIndex: 'amount', width: 90 },
  { title: '付款对象', dataIndex: 'payee', width: 160 },
  { title: '支付状态', dataIndex: 'payStatus', width: 96 },
  { title: '提报时间', dataIndex: 'submittedAt', width: 146 }
];

const weighFields = computed(() => {
  const item = currentWeigh.value;
  return [
    field('type', '单据类型', item.type),
    field('receiver', '收货单位', item.receiver),
    field('shipper', '发货单位', item.shipper),
    field('goods', '货物名称', item.goods),
    field('mineType', '矿别', item.mineType),
    field('gross', '毛重', item.gross),
    field('tare', '皮重', item.tare),
    field('net', '净重', item.net),
    field('carrier', '承运单位', item.carrier),
    field('vehiclePlate', '车号', item.vehiclePlate),
    field('driver', '驾驶员', item.driver),
    field('remark', '备注', item.remark),
    field('maker', '制单人', item.maker),
    field('dateTime', '磅单时间', `${item.date} ${item.time}`)
  ];
});

const expenseFields = computed(() => {
  const item = currentExpense.value;
  return [
    field('driver', '司机', item.driver),
    field('vehiclePlate', '车号', item.vehiclePlate),
    field('type', '报销类型', item.type),
    field('item', '报销事项', item.item),
    field('amount', '金额', item.amount),
    field('occurredDate', '发生日期', item.occurredDate),
    field('submittedAt', '提报时间', item.submittedAt),
    field('payee', '付款对象', item.payee),
    field('payStatus', '支付状态', item.payStatus)
  ];
});

const activeWeighBox = computed(() => currentWeigh.value.fieldBoxes.find((box) => box.key === activeFieldKey.value));
const activeExpenseBox = computed(() => currentExpense.value.fieldBoxes.find((box) => box.key === activeExpenseFieldKey.value));

function field(key: string, label: string, value: string | number) {
  return { key, label, value };
}

function money(value: number) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(value);
}

function ton(value: number) {
  return `${value.toFixed(2)} 吨`;
}

function projectName(projectId: string) {
  return projects.find((project) => project.id === projectId)?.name ?? '-';
}

function projectPendingWeigh(projectId: string) {
  return weighRows.value.filter((item) => item.projectId === projectId && item.auditStatus === '待审核').length;
}

function projectPendingExpense(projectId: string) {
  return expenseRows.value.filter((item) => item.projectId === projectId && item.auditStatus === '待审核').length;
}

function projectPendingTotal(projectId: string) {
  return projectPendingWeigh(projectId) + projectPendingExpense(projectId);
}

function projectVehicleCount(projectId: string) {
  return vehicles.filter((vehicle) => vehicle.projectId === projectId).length;
}

function projectProfitValue(projectId: string) {
  const projectVehicles = vehicleFinance.value.filter((vehicle) => vehicle.projectId === projectId);
  return projectVehicles.reduce((sum, vehicle) => sum + vehicle.profit, 0);
}

function statusColor(status: AuditStatus | string) {
  const map: Record<string, string> = {
    待审核: 'orange',
    已通过: 'green',
    已驳回: 'red',
    有疑点: 'volcano',
    未付款: 'orange',
    已付款: 'green',
    部分付款: 'blue',
    正常: 'green',
    关注: 'orange',
    异常: 'red'
  };
  return map[status] ?? 'default';
}

function boxStyle(box?: FieldBox) {
  if (!box) return {};
  return {
    left: `${box.x}%`,
    top: `${box.y}%`,
    width: `${box.w}%`,
    height: `${box.h}%`
  };
}

function selectProject(projectId: string) {
  selectedProjectId.value = projectId;
  const firstVehicle = vehicles.find((item) => item.projectId === projectId);
  if (firstVehicle) selectedVehicleId.value = firstVehicle.id;
  projectMenuExpanded.value = false;
  window.setTimeout(() => {
    projectMenuExpanded.value = true;
  }, 45);
}

function navigate(page: PageKey) {
  activePage.value = page;
}

function goWeighAudit(record?: WeighBill) {
  if (record) {
    reviewWeighIndex.value = Math.max(0, weighRows.value.findIndex((item) => item.id === record.id));
  }
  activePage.value = 'weighAudit';
}

function openPairedWeigh(record: PairedWeighRecord) {
  const sourceBill = weighRows.value.find((item) => item.id === record.sourceBillId);
  goWeighAudit(sourceBill);
}

function goExpenseAudit(record?: Expense) {
  if (record) {
    reviewExpenseIndex.value = Math.max(0, expenseRows.value.findIndex((item) => item.id === record.id));
    expenseImageIndex.value = 0;
  }
  activePage.value = 'expenseAudit';
}

function goVehicle(vehicleId: string) {
  selectedVehicleId.value = vehicleId;
  const vehicle = vehicles.find((item) => item.id === vehicleId);
  if (vehicle) selectedProjectId.value = vehicle.projectId;
  activePage.value = 'vehicleDetail';
}

function updateWeighValue(key: string, value: string) {
  const record = currentWeigh.value as unknown as Record<string, string | number>;
  if (['gross', 'tare', 'net', 'freight', 'cost'].includes(key)) {
    record[key] = Number(value) || 0;
    return;
  }
  if (key === 'dateTime') {
    const [date, time] = value.split(' ');
    record.date = date || currentWeigh.value.date;
    record.time = time || currentWeigh.value.time;
    return;
  }
  record[key] = value;
}

function onWeighInput(key: string, value: unknown) {
  updateWeighValue(key, String(value));
}

function updateExpenseValue(key: string, value: string) {
  const record = currentExpense.value as unknown as Record<string, string | number>;
  if (key === 'amount') {
    record[key] = Number(value) || 0;
    return;
  }
  record[key] = value;
}

function onExpenseInput(key: string, value: unknown) {
  updateExpenseValue(key, String(value));
}

function previousWeigh() {
  reviewWeighIndex.value = reviewWeighIndex.value <= 0 ? weighRows.value.length - 1 : reviewWeighIndex.value - 1;
  activeFieldKey.value = '';
}

function nextWeigh() {
  reviewWeighIndex.value = (reviewWeighIndex.value + 1) % weighRows.value.length;
  activeFieldKey.value = '';
}

function previousExpense() {
  reviewExpenseIndex.value = reviewExpenseIndex.value <= 0 ? expenseRows.value.length - 1 : reviewExpenseIndex.value - 1;
  expenseImageIndex.value = 0;
  activeExpenseFieldKey.value = '';
}

function nextExpense() {
  reviewExpenseIndex.value = (reviewExpenseIndex.value + 1) % expenseRows.value.length;
  expenseImageIndex.value = 0;
  activeExpenseFieldKey.value = '';
}

function markWeigh(status: AuditStatus) {
  currentWeigh.value.auditStatus = status;
  message.success(`磅单 ${currentWeigh.value.id} 已标记为${status}`);
  if (status === '已通过') nextWeigh();
}

function markExpense(status: AuditStatus) {
  currentExpense.value.auditStatus = status;
  message.success(`报销 ${currentExpense.value.id} 已标记为${status}`);
  if (status === '已通过') nextExpense();
}

function saveWeigh() {
  currentWeigh.value.anomalies = currentWeigh.value.anomalies.filter(Boolean);
  message.success('磅单修改已保存');
}

function markExpensePaid(record: Expense) {
  record.payStatus = '已付款';
  message.success(`${record.driver} ${record.type} ${money(record.amount)} 已标记为已付`);
}

function saveExpense() {
  currentExpense.value.anomalies = currentExpense.value.anomalies.filter(Boolean);
  message.success('报销修改已保存');
}

function sendAgent(text?: string) {
  const content = (text ?? agentInput.value).trim();
  if (!content) return;
  agentMessages.value.push({ role: 'user', content });
  agentInput.value = '';
  const reply = buildAgentReply(content);
  agentMessages.value.push(reply);
}

function buildAgentReply(content: string): AgentMessage {
  if (content.includes('今日') && content.includes('待审核') && content.includes('磅单')) {
    activePage.value = 'weighAudit';
    const pending = scopedWeighRows.value.filter((item) => item.auditStatus === '待审核');
    if (pending[0]) reviewWeighIndex.value = weighRows.value.findIndex((item) => item.id === pending[0].id);
    return {
      role: 'agent',
      content: `已切换到磅单审核。当前项目有 ${pending.length} 张待审核磅单，其中 ${pending.filter((item) => item.anomalies.length).length} 张带异常提示。`,
      skills: ['磅单识别队列', '异常校验'],
      resultCards: [
        { label: '待审核磅单', value: `${pending.length} 张`, tone: 'orange' },
        { label: '有疑点', value: `${pending.filter((item) => item.anomalies.length).length} 张`, tone: 'red' }
      ]
    };
  }
  if (content.includes('赣J03528')) {
    const vehicle = vehicleFinance.value.find((item) => item.plate.includes('赣J03528'));
    if (vehicle) goVehicle(vehicle.id);
    return {
      role: 'agent',
      content: `已打开赣J03528D车辆账目。该车本月收入 ${money(vehicle?.revenue ?? 0)}，成本 ${money(vehicle?.cost ?? 0)}，毛利 ${money(vehicle?.profit ?? 0)}。最近一趟磅单已匹配出发和到货，净重差 0.06 吨，未触发重量异常。`,
      skills: ['车辆利润计算', '磅单配对', '报销归集'],
      resultCards: [
        { label: '收入', value: money(vehicle?.revenue ?? 0), tone: 'blue' },
        { label: '成本', value: money(vehicle?.cost ?? 0), tone: 'orange' },
        { label: '毛利', value: money(vehicle?.profit ?? 0), tone: (vehicle?.profit ?? 0) >= 0 ? 'green' : 'red' }
      ]
    };
  }
  if (content.includes('每辆车利润') || content.includes('利润最高')) {
    activePage.value = 'dashboard';
    const best = vehicleRank.value[0];
    const worst = vehicleRank.value[vehicleRank.value.length - 1];
    return {
      role: 'agent',
      content: `已切换到总车队看板。本月利润最高车辆是 ${best.plate}，毛利 ${money(best.profit)}；需要关注 ${worst.plate}，当前毛利 ${money(worst.profit)}。`,
      skills: ['利润排名', '费用归因'],
      resultCards: [
        { label: '利润最高', value: `${best.plate} ${money(best.profit)}`, tone: 'green' },
        { label: '负利润风险', value: `${worst.plate} ${money(worst.profit)}`, tone: 'red' }
      ]
    };
  }
  if (content.includes('罗明') && content.includes('报销')) {
    activePage.value = 'expenseList';
    expenseKeyword.value = '罗明';
    const rows = expenseRows.value.filter((item) => item.driver === '罗明');
    return {
      role: 'agent',
      content: `已筛选司机罗明本月报销，共 ${rows.length} 笔，合计 ${money(rows.reduce((sum, item) => sum + item.amount, 0))}。其中 ${rows.filter((item) => item.auditStatus === '待审核').length} 笔待审核。`,
      skills: ['付款明细检索', '司机费用汇总']
    };
  }
  if (content.includes('待审核报销')) {
    activePage.value = 'expenseAudit';
    const pending = scopedExpenseRows.value.filter((item) => item.auditStatus === '待审核');
    if (pending[0]) reviewExpenseIndex.value = expenseRows.value.findIndex((item) => item.id === pending[0].id);
    return {
      role: 'agent',
      content: `已进入报销审核队列。当前项目有 ${pending.length} 笔待审核报销，支持连续审核和字段定位高亮。`,
      skills: ['报销识别队列', '凭证金额校验']
    };
  }
  if (content.includes('导出磅单')) {
    activePage.value = 'weighList';
    return {
      role: 'agent',
      content: '已生成磅单汇总表预览，字段与历史 Excel 磅单 sheet 对齐。Demo 中导出动作已模拟完成。',
      skills: ['Excel字段映射', '汇总导出'],
      resultCards: [{ label: '可导出记录', value: `${filteredPairedWeighRows.value.length} 条`, tone: 'blue' }]
    };
  }
  if (content.includes('导出付款')) {
    activePage.value = 'expenseList';
    return {
      role: 'agent',
      content: '已生成付款明细表预览，包含付款日期、费用类型、车牌、内容、金额、付款对象和支付状态。',
      skills: ['付款明细导出', '财务科目归集'],
      resultCards: [{ label: '可导出费用', value: `${filteredExpenseRows.value.length} 笔`, tone: 'blue' }]
    };
  }
  if (content.includes('对账摘要')) {
    activePage.value = 'dashboard';
    return {
      role: 'agent',
      content: `本周对账摘要：总运费 ${money(totalStats.value.revenue)}，总成本 ${money(totalStats.value.cost)}，毛利 ${money(totalStats.value.profit)}；需优先处理 ${totalStats.value.pendingWeigh} 张待审磅单和 ${totalStats.value.pendingExpense} 笔待审报销。`,
      skills: ['周报生成', '异常聚合']
    };
  }
  return {
    role: 'agent',
    content: '我已理解你的查询。可以继续指定车辆、司机、日期、项目或费用类型，我会联动到对应列表、审核队列或车辆账目页。',
    skills: ['自然语言理解', '页面联动']
  };
}

function nextExpenseImage() {
  expenseImageIndex.value = (expenseImageIndex.value + 1) % currentExpense.value.images.length;
}
</script>

<template>
  <a-config-provider
    :theme="{
      token: {
        colorPrimary: '#08090C',
        colorInfo: '#686BA6',
        colorSuccess: '#52585C',
        colorWarning: '#FB892A',
        colorError: '#F77113',
        borderRadius: 6,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
      }
    }"
  >
    <div class="app-shell" :class="{ 'no-right': activePage === 'weighList' || activePage === 'vehicleDetail' }">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark"><RobotOutlined /></div>
          <div>
            <strong>车队智能账务</strong>
            <span>Agent Demo</span>
          </div>
        </div>

        <div class="side-section company-section">
          <div class="side-title">公司视角</div>
          <button
            v-for="item in companyNavItems"
            :key="item.key"
            class="nav-item"
            :class="{ active: activePage === item.key }"
            @click="navigate(item.key)"
          >
            <component :is="item.icon" />
            <span>{{ item.label }}</span>
          </button>
        </div>

        <div class="side-section">
          <div class="side-title">项目 / 车队</div>
          <button
            v-for="project in projects"
            :key="project.id"
            class="project-card"
            :class="{ active: project.id === selectedProjectId }"
            @click="selectProject(project.id)"
          >
            <div class="project-card-head">
              <strong>{{ project.name }}</strong>
              <a-badge :count="projectPendingTotal(project.id)" :number-style="{ backgroundColor: '#F77113' }" />
            </div>
            <span>{{ project.route }}</span>
            <div class="project-card-metrics">
              <span>{{ projectVehicleCount(project.id) }} 车</span>
              <span :class="{ danger: projectProfitValue(project.id) < 0 }">{{ money(projectProfitValue(project.id)) }}</span>
            </div>
          </button>
        </div>

        <div class="side-section nav-section project-menu-drawer" :class="{ expanded: projectMenuExpanded }">
          <div class="side-title">当前项目操作</div>
          <div class="drawer-inner">
            <button v-for="item in projectNavItems" :key="item.key" class="nav-item" :class="{ active: activePage === item.key }" @click="navigate(item.key)">
              <component :is="item.icon" />
              <span>{{ item.label }}</span>
              <a-badge
                v-if="item.key === 'weighAudit'"
                :count="projectPendingWeigh(selectedProjectId)"
                :number-style="{ backgroundColor: '#F77113' }"
                class="nav-badge"
              />
              <a-badge
                v-else-if="item.key === 'expenseAudit'"
                :count="projectPendingExpense(selectedProjectId)"
                :number-style="{ backgroundColor: '#F77113' }"
                class="nav-badge"
              />
            </button>
          </div>
        </div>
      </aside>

      <main class="main-panel">
        <header class="topbar">
          <div>
            <span class="eyebrow">{{ currentProject.name }}</span>
            <h1>{{ pageTitle[activePage] }}</h1>
          </div>
          <div class="topbar-actions">
            <a-button type="primary" @click="sendAgent('生成本周财务对账摘要')">
              <BarChartOutlined />
              生成摘要
            </a-button>
          </div>
        </header>

        <section v-if="activePage === 'agent'" class="content agent-layout">
          <div class="chat-panel">
            <div class="quick-grid">
              <button v-for="prompt in quickPrompts" :key="prompt" @click="sendAgent(prompt)">{{ prompt }}</button>
            </div>
            <div class="chat-stream">
              <div v-for="(msg, index) in agentMessages" :key="index" class="chat-message" :class="msg.role">
                <div class="avatar">{{ msg.role === 'agent' ? 'AI' : '我' }}</div>
                <div class="bubble">
                  <p>{{ msg.content }}</p>
                  <div v-if="msg.skills?.length" class="skill-row">
                    <a-tag v-for="skill in msg.skills" :key="skill" color="blue">{{ skill }}</a-tag>
                  </div>
                  <div v-if="msg.resultCards?.length" class="result-row">
                    <div v-for="card in msg.resultCards" :key="card.label" class="mini-result" :class="card.tone">
                      <span>{{ card.label }}</span>
                      <strong>{{ card.value }}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="chat-input">
              <a-input-search v-model:value="agentInput" size="large" placeholder="例如：赣J03528这趟赚了多少钱" enter-button="发送" @search="sendAgent()" />
            </div>
          </div>
        </section>

        <section v-else-if="activePage === 'weighAudit'" class="content review-screen">
          <div class="review-summary">
            <div>
              <span>当前 {{ reviewWeighIndex + 1 }} / {{ weighRows.length }}</span>
              <strong>{{ currentWeigh.vehiclePlate }} · {{ currentWeigh.goods }} · {{ ton(currentWeigh.net) }}</strong>
            </div>
            <div class="summary-tags">
              <a-tag :color="statusColor(currentWeigh.auditStatus)">{{ currentWeigh.auditStatus }}</a-tag>
              <a-tag v-for="item in currentWeigh.anomalies" :key="item" color="red">{{ item }}</a-tag>
            </div>
          </div>

          <div class="review-grid">
            <div class="document-pane">
              <div class="image-toolbar">
                <a-button size="small" @click="weighZoom = Math.max(0.7, weighZoom - 0.1)"><ZoomOutOutlined /></a-button>
                <a-button size="small" @click="weighZoom = Math.min(1.6, weighZoom + 0.1)"><ZoomInOutlined /></a-button>
                <a-button size="small" @click="weighRotation = (weighRotation + 90) % 360"><RotateRightOutlined /></a-button>
                <span>{{ Math.round(weighZoom * 100) }}%</span>
              </div>
              <div class="image-stage">
                <img :src="currentWeigh.image" :style="{ transform: `scale(${weighZoom}) rotate(${weighRotation}deg)` }" alt="磅单原图" />
                <div v-if="activeWeighBox" class="field-highlight" :style="boxStyle(activeWeighBox)">
                  {{ activeWeighBox.label }}
                </div>
              </div>
            </div>

            <div class="form-pane">
              <div class="form-head">
                <div>
                  <strong>Agent 结构化结果</strong>
                  <span>字段悬停可定位原图区域，支持财务改值后入库</span>
                </div>
                <a-tag color="cyan">{{ currentWeigh.source }}</a-tag>
              </div>
              <div class="field-table compact">
                <div class="field-row header">
                  <span>字段</span>
                  <span>识别值 / 可编辑</span>
                  <span>异常</span>
                </div>
                <div
                  v-for="item in weighFields"
                  :key="item.key"
                  class="field-row"
                  :class="{ active: activeFieldKey === item.key }"
                  @pointerenter="activeFieldKey = item.key"
                  @mouseover="activeFieldKey = item.key"
                  @focusin="activeFieldKey = item.key"
                  @mouseenter="activeFieldKey = item.key"
                  @mouseleave="activeFieldKey = ''"
                >
                  <span>{{ item.label }}</span>
                  <a-input :value="String(item.value)" size="small" @update:value="onWeighInput(item.key, $event)" />
                  <span class="field-issue">{{ currentWeigh.anomalies.find((issue) => issue.includes(item.label.slice(0, 2))) || '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="sticky-actions">
            <a-button @click="previousWeigh"><LeftOutlined />上一张</a-button>
            <a-button @click="nextWeigh">下一张<RightOutlined /></a-button>
            <a-button @click="saveWeigh">保存修改</a-button>
            <a-button danger @click="markWeigh('已驳回')"><CloseOutlined />驳回</a-button>
            <a-button @click="markWeigh('有疑点')"><WarningOutlined />标记疑点</a-button>
            <a-button type="primary" @click="markWeigh('已通过')"><CheckOutlined />通过并下一张</a-button>
          </div>
        </section>

        <section v-else-if="activePage === 'weighList'" class="content list-screen">
          <div class="metric-grid five">
            <div class="metric-card"><span>总车次</span><strong>{{ weighListSummary.trips }}</strong></div>
            <div class="metric-card"><span>装货吨位</span><strong>{{ ton(weighListSummary.loadingNet) }}</strong></div>
            <div class="metric-card"><span>卸货吨位</span><strong>{{ ton(weighListSummary.unloadingNet) }}</strong></div>
            <div class="metric-card"><span>含税产值</span><strong>{{ money(weighListSummary.taxableOutput) }}</strong></div>
            <div class="metric-card green"><span>利润合计</span><strong>{{ money(weighListSummary.profit) }}</strong></div>
          </div>
          <div class="formula-strip">
            <span>未识别字段按线路默认值入账</span>
            <b>含税单价 {{ weighDefaults.taxableUnitPrice }} 元/吨</b>
            <b>货物险 {{ money(weighDefaults.cargoInsurance) }}/趟</b>
            <b>司机工资 {{ money(weighDefaults.driverSalary) }}/趟</b>
            <b>税点 {{ Math.round(weighDefaults.taxRate * 100) }}%</b>
            <span>含税产值 = 卸货吨位 × 含税单价；利润 = 含税产值 - 货物险 - 司机工资 - 税点</span>
          </div>
          <div class="filter-bar">
            <a-select v-model:value="selectedProjectId" @change="selectProject">
              <a-select-option v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</a-select-option>
            </a-select>
            <a-input v-model:value="weighKeyword" placeholder="搜索车号、司机、货物、客户、地点、单号" allow-clear>
              <template #prefix><SearchOutlined /></template>
            </a-input>
            <a-button><DownloadOutlined />导出磅单汇总表</a-button>
          </div>
          <a-table
            size="small"
            :columns="weighColumns"
            :data-source="filteredPairedWeighRows"
            :pagination="{ pageSize: 10 }"
            :scroll="{ x: 1660 }"
            row-key="id"
            class="dense-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'loadingTonnage' || column.dataIndex === 'unloadingTonnage'">{{ ton(record[column.dataIndex]) }}</template>
              <template v-else-if="column.dataIndex === 'taxableOutput' || column.dataIndex === 'taxPoint' || column.dataIndex === 'profit'">
                <span :class="{ danger: column.dataIndex === 'profit' && record.profit < 0 }">{{ money(record[column.dataIndex]) }}</span>
              </template>
              <template v-else-if="column.dataIndex === 'action'"><a-button size="small" @click="openPairedWeigh(record)">原图</a-button></template>
            </template>
          </a-table>
        </section>

        <section v-else-if="activePage === 'expenseAudit'" class="content review-screen">
          <div class="review-summary">
            <div>
              <span>当前 {{ reviewExpenseIndex + 1 }} / {{ expenseRows.length }}</span>
              <strong>{{ currentExpense.driver }} · {{ currentExpense.vehiclePlate }} · {{ currentExpense.type }} {{ money(currentExpense.amount) }}</strong>
            </div>
            <div class="summary-tags">
              <a-tag :color="statusColor(currentExpense.auditStatus)">{{ currentExpense.auditStatus }}</a-tag>
              <a-tag v-for="item in currentExpense.anomalies" :key="item" color="red">{{ item }}</a-tag>
            </div>
          </div>

          <div class="review-grid">
            <div class="document-pane">
              <div class="image-toolbar">
                <a-button size="small" @click="expenseZoom = Math.max(0.7, expenseZoom - 0.1)"><ZoomOutOutlined /></a-button>
                <a-button size="small" @click="expenseZoom = Math.min(1.6, expenseZoom + 0.1)"><ZoomInOutlined /></a-button>
                <a-button size="small" @click="expenseRotation = (expenseRotation + 90) % 360"><RotateRightOutlined /></a-button>
                <a-button size="small" @click="nextExpenseImage">切换凭证 {{ expenseImageIndex + 1 }}/{{ currentExpense.images.length }}</a-button>
              </div>
              <div class="wechat-card" @mouseenter="activeExpenseFieldKey = 'item'" @mouseleave="activeExpenseFieldKey = ''">
                <span>微信群消息</span>
                <p>{{ currentExpense.message }}</p>
              </div>
              <div class="image-stage expense-stage">
                <img :src="currentExpense.images[expenseImageIndex]" :style="{ transform: `scale(${expenseZoom}) rotate(${expenseRotation}deg)` }" alt="报销凭证" />
                <div v-if="activeExpenseBox" class="field-highlight expense" :style="boxStyle(activeExpenseBox)">
                  {{ activeExpenseBox.label }}
                </div>
              </div>
            </div>

            <div class="form-pane">
              <div class="form-head">
                <div>
                  <strong>报销结构化字段</strong>
                  <span>金额、类型、付款对象可直接修正，审核后进入付款明细</span>
                </div>
                <a-tag color="cyan">{{ currentExpense.submittedAt }}</a-tag>
              </div>
              <div class="field-table compact">
                <div class="field-row header">
                  <span>字段</span>
                  <span>识别值 / 可编辑</span>
                  <span>异常</span>
                </div>
                <div
                  v-for="item in expenseFields"
                  :key="item.key"
                  class="field-row"
                  :class="{ active: activeExpenseFieldKey === item.key }"
                  @pointerenter="activeExpenseFieldKey = item.key"
                  @mouseover="activeExpenseFieldKey = item.key"
                  @focusin="activeExpenseFieldKey = item.key"
                  @mouseenter="activeExpenseFieldKey = item.key"
                  @mouseleave="activeExpenseFieldKey = ''"
                >
                  <span>{{ item.label }}</span>
                  <a-input :value="String(item.value)" size="small" @update:value="onExpenseInput(item.key, $event)" />
                  <span class="field-issue">{{ currentExpense.anomalies.find((issue) => issue.includes(item.label.slice(0, 2))) || '-' }}</span>
                </div>
              </div>
              <div class="shortcut-row">
                <a-button size="small" @click="updateExpenseValue('type', '油费')">改为油费</a-button>
                <a-button size="small" @click="updateExpenseValue('type', '过路费')">改为过路费</a-button>
                <a-button size="small" @click="currentExpense.anomalies.push('重复报销')">标记重复</a-button>
                <a-button size="small" @click="currentExpense.item = `${currentExpense.item}（合并同类费用）`">合并同类费用</a-button>
              </div>
            </div>
          </div>

          <div class="sticky-actions">
            <a-button @click="previousExpense"><LeftOutlined />上一笔</a-button>
            <a-button @click="nextExpense">下一笔<RightOutlined /></a-button>
            <a-button @click="saveExpense">保存修改</a-button>
            <a-button danger @click="markExpense('已驳回')"><CloseOutlined />驳回</a-button>
            <a-button @click="markExpense('有疑点')"><WarningOutlined />标记疑点</a-button>
            <a-button type="primary" @click="markExpense('已通过')"><CheckOutlined />通过并下一笔</a-button>
          </div>
        </section>

        <section v-else-if="activePage === 'expenseList'" class="content list-screen">
          <div class="metric-grid five">
            <div class="metric-card"><span>总报销金额</span><strong>{{ money(expenseListSummary.amount) }}</strong></div>
            <div class="metric-card green"><span>已付款</span><strong>{{ money(expenseListSummary.paid) }}</strong></div>
            <div class="metric-card orange"><span>未付款</span><strong>{{ money(expenseListSummary.unpaid) }}</strong></div>
            <div class="metric-card"><span>今日报销笔数</span><strong>{{ expenseListSummary.todayExpenseCount }}</strong></div>
            <div class="metric-card"><span>今日付款笔数</span><strong>{{ expenseListSummary.todayPaidCount }}</strong></div>
          </div>
          <div class="filter-bar">
            <a-input v-model:value="expenseKeyword" placeholder="搜索司机、车辆、类型、支付状态" allow-clear>
              <template #prefix><SearchOutlined /></template>
            </a-input>
            <a-select v-model:value="expenseStatusFilter">
              <a-select-option value="全部">全部支付状态</a-select-option>
              <a-select-option value="未付款">未付款</a-select-option>
              <a-select-option value="部分付款">部分付款</a-select-option>
              <a-select-option value="已付款">已付款</a-select-option>
            </a-select>
            <a-button><DownloadOutlined />导出付款明细表</a-button>
          </div>
          <a-table
            size="small"
            :columns="expenseColumns"
            :data-source="filteredExpenseRows"
            :pagination="{ pageSize: 10 }"
            :scroll="{ x: 1160 }"
            row-key="id"
            class="dense-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'amount'">{{ money(record.amount) }}</template>
              <template v-else-if="column.dataIndex === 'payStatus'"><a-tag :color="statusColor(record.payStatus)">{{ record.payStatus }}</a-tag></template>
              <template v-else-if="column.dataIndex === 'action'">
                <a-button size="small" type="primary" ghost :disabled="record.payStatus === '已付款'" @click="markExpensePaid(record)">
                  标记已付
                </a-button>
              </template>
            </template>
          </a-table>
        </section>

        <section v-else-if="activePage === 'dashboard'" class="content dashboard-screen">
          <div class="metric-grid four">
            <div class="metric-card"><span>总车辆数</span><strong>{{ totalStats.vehicles }}</strong></div>
            <div class="metric-card"><span>运营车辆数</span><strong>{{ totalStats.running }}</strong></div>
            <div class="metric-card"><span>本月总运费</span><strong>{{ money(totalStats.revenue) }}</strong></div>
            <div class="metric-card"><span>本月总成本</span><strong>{{ money(totalStats.cost) }}</strong></div>
            <div class="metric-card" :class="{ danger: totalStats.profit < 0 }"><span>本月毛利</span><strong>{{ money(totalStats.profit) }}</strong></div>
            <div class="metric-card"><span>平均单车利润</span><strong>{{ money(totalStats.profit / totalStats.vehicles) }}</strong></div>
            <div class="metric-card orange"><span>待审核</span><strong>{{ totalStats.pendingWeigh + totalStats.pendingExpense }}</strong></div>
            <div class="metric-card warning"><span>异常单据数</span><strong>{{ totalStats.issues }}</strong></div>
          </div>
          <div class="dashboard-grid">
            <div class="chart-card wide">
              <h3>每日利润趋势</h3>
              <div class="trend-chart">
                <div v-for="day in dailyProfitTrend" :key="day.day" class="trend-col">
                  <div class="bar" :class="{ negative: day.profit < 0 }" :style="{ height: `${Math.max(8, (Math.abs(day.profit) / maxDailyProfit) * 150)}px` }"></div>
                  <span>{{ day.day }}</span>
                  <b>{{ money(day.profit) }}</b>
                </div>
              </div>
            </div>
            <div class="chart-card">
              <h3>按车辆利润排名</h3>
              <div v-for="vehicle in vehicleRank" :key="vehicle.id" class="rank-line" @click="goVehicle(vehicle.id)">
                <span>{{ vehicle.plate }}</span>
                <div class="rank-track"><i :class="{ negative: vehicle.profit < 0 }" :style="{ width: `${Math.max(6, (Math.abs(vehicle.profit) / maxVehicleProfit) * 100)}%` }"></i></div>
                <b :class="{ danger: vehicle.profit < 0 }">{{ money(vehicle.profit) }}</b>
              </div>
            </div>
            <div class="chart-card">
              <h3>项目利润对比</h3>
              <div v-for="project in projectProfitComparison" :key="project.name" class="summary-line">
                <span>{{ project.name }}</span>
                <b :class="{ danger: project.profit < 0 }">{{ money(project.profit) }}</b>
              </div>
            </div>
            <div class="chart-card">
              <h3>异常单据分布</h3>
              <div class="issue-grid">
                <div><strong>{{ weighRows.filter((item) => item.anomalies.includes('缺少到货单')).length }}</strong><span>缺少到货单</span></div>
                <div><strong>{{ weighRows.filter((item) => item.anomalies.includes('疑似重复单')).length }}</strong><span>重复磅单</span></div>
                <div><strong>{{ expenseRows.filter((item) => item.anomalies.includes('重复报销')).length }}</strong><span>重复报销</span></div>
                <div><strong>{{ expenseRows.filter((item) => item.anomalies.includes('超预算')).length }}</strong><span>超预算</span></div>
              </div>
            </div>
            <div class="chart-card">
              <h3>按司机费用排名</h3>
              <div v-for="driver in ['何明军', '罗明', '刘启', '李进', '王成']" :key="driver" class="summary-line">
                <span>{{ driver }}</span>
                <b>{{ money(expenseRows.filter((item) => item.driver === driver).reduce((sum, item) => sum + item.amount, 0)) }}</b>
              </div>
            </div>
            <div class="chart-card">
              <h3>费用类型占比</h3>
              <div class="donut large"></div>
              <div class="legend-row">
                <span>油费</span><span>维修</span><span>路费</span><span>杂费</span>
              </div>
            </div>
          </div>
        </section>

        <section v-else-if="activePage === 'vehicleDetail'" class="content vehicle-screen">
          <div class="vehicle-head">
            <a-select v-model:value="selectedVehicleId" class="vehicle-select">
              <a-select-option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">{{ vehicle.plate }} / {{ vehicle.driver }}</a-select-option>
            </a-select>
            <div>
              <h2>{{ currentVehicleFinance.plate }} · {{ currentVehicleFinance.driver }}</h2>
              <span>{{ projectName(currentVehicleFinance.projectId) }} / {{ currentVehicleFinance.model }} / {{ currentVehicleFinance.status }}</span>
            </div>
          </div>
          <div class="metric-grid four">
            <div class="metric-card"><span>运单 / 磅单</span><strong>{{ currentVehicleBills.length }}</strong></div>
            <div class="metric-card"><span>收入</span><strong>{{ money(currentVehicleFinance.revenue) }}</strong></div>
            <div class="metric-card"><span>成本</span><strong>{{ money(currentVehicleFinance.cost) }}</strong></div>
            <div class="metric-card" :class="{ danger: currentVehicleFinance.profit < 0 }"><span>利润</span><strong>{{ money(currentVehicleFinance.profit) }}</strong></div>
          </div>
          <div class="vehicle-ledger-grid">
            <div class="chart-card vehicle-table-card">
              <h3>磅单记录</h3>
              <a-table
                size="small"
                :columns="vehicleBillColumns"
                :data-source="currentVehicleBills"
                :pagination="{ pageSize: 8 }"
                :scroll="{ x: 1110 }"
                row-key="id"
                class="dense-table inner-table"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.dataIndex === 'unloadingTonnage'">{{ ton(record.unloadingTonnage) }}</template>
                  <template v-else-if="column.dataIndex === 'taxableOutput' || column.dataIndex === 'profit'">
                    <span :class="{ danger: column.dataIndex === 'profit' && record.profit < 0 }">{{ money(record[column.dataIndex]) }}</span>
                  </template>
                  <template v-else-if="column.dataIndex === 'action'">
                    <a-button size="small" @click="openPairedWeigh(record)">原图</a-button>
                  </template>
                </template>
              </a-table>
            </div>
            <div class="chart-card vehicle-table-card">
              <h3>报销费用记录</h3>
              <a-table
                size="small"
                :columns="vehicleExpenseColumns"
                :data-source="currentVehicleExpenses"
                :pagination="{ pageSize: 8 }"
                :scroll="{ x: 890 }"
                row-key="id"
                class="dense-table inner-table"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.dataIndex === 'amount'">{{ money(record.amount) }}</template>
                  <template v-else-if="column.dataIndex === 'payStatus'"><a-tag :color="statusColor(record.payStatus)">{{ record.payStatus }}</a-tag></template>
                </template>
              </a-table>
            </div>
          </div>
          <div class="vehicle-support-grid">
            <div class="chart-card">
              <h3>缺失与风险提醒</h3>
              <a-alert
                v-if="currentVehicleFinance.profit < 0"
                type="error"
                show-icon
                message="单车利润为负"
                description="系统建议复核维修费、缺失到货单和异常成本。"
              />
              <a-alert
                v-if="currentVehicleRawBills.some((item) => item.anomalies.includes('缺少到货单'))"
                type="warning"
                show-icon
                message="存在缺失到货磅单"
                description="请联系司机补发到货磅单或手工标记原因。"
              />
              <a-alert
                v-if="currentVehicleExpenses.some((item) => item.anomalies.includes('重复报销'))"
                type="warning"
                show-icon
                message="疑似重复报销"
                description="同司机同金额同类型短时间内重复提报。"
              />
              <p v-if="currentVehicleFinance.profit >= 0 && !currentVehicleRawBills.some((item) => item.anomalies.length)" class="muted risk-empty">当前车辆暂无高优先级风险。</p>
            </div>
            <div class="chart-card">
              <h3>账务时间线</h3>
              <div class="timeline-list">
                <div v-for="item in currentVehicleTimeline" :key="`${item.time}-${item.detail}`" class="timeline-row">
                  <span>{{ item.time }}</span>
                  <a-tag :color="item.tone">{{ item.type }}</a-tag>
                  <b>{{ item.detail }}</b>
                  <strong>{{ item.amount }}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section v-else class="content project-screen">
          <div class="metric-grid three">
            <div v-for="project in projects" :key="project.id" class="project-overview" :class="{ active: project.id === selectedProjectId }" @click="selectProject(project.id)">
              <div>
                <h3>{{ project.name }}</h3>
                <a-badge :count="projectPendingTotal(project.id)" :number-style="{ backgroundColor: '#F77113' }" />
              </div>
              <p>{{ project.route }}</p>
              <div class="project-overview-metrics">
                <span>{{ projectVehicleCount(project.id) }} 辆车</span>
                <strong :class="{ danger: projectProfitValue(project.id) < 0 }">{{ money(projectProfitValue(project.id)) }}</strong>
              </div>
            </div>
          </div>
          <a-table
            size="small"
            :columns="vehicleColumns"
            :data-source="selectedProjectVehicles.map((vehicle) => vehicleFinance.find((item) => item.id === vehicle.id))"
            :pagination="{ pageSize: 8 }"
            :scroll="{ x: 880 }"
            row-key="id"
            class="dense-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'projectId'">{{ projectName(record.projectId) }}</template>
              <template v-else-if="column.dataIndex === 'revenue' || column.dataIndex === 'cost' || column.dataIndex === 'profit'">
                <span :class="{ danger: column.dataIndex === 'profit' && record.profit < 0 }">{{ money(record[column.dataIndex]) }}</span>
              </template>
              <template v-else-if="column.dataIndex === 'action'"><a-button size="small" @click="goVehicle(record.id)">账目</a-button></template>
            </template>
          </a-table>
        </section>
      </main>

      <aside v-if="activePage !== 'weighList' && activePage !== 'vehicleDetail'" class="right-panel">
        <template v-if="activePage === 'expenseList'">
          <div class="right-card">
            <span class="eyebrow">付款结构</span>
            <h2>{{ currentProject.name }}</h2>
            <div class="donut" :style="{ background: `conic-gradient(#08090C 0 30%, #F77113 30% 54%, #FB892A 54% 76%, #686BA6 76% 100%)` }"></div>
            <div v-for="item in expenseTypeSummary" :key="item.type" class="summary-line">
              <span>{{ item.type }}</span>
              <b>{{ money(item.amount) }}</b>
            </div>
          </div>
          <div class="right-card">
            <h3>按司机汇总</h3>
            <div v-for="item in expenseDriverSummary" :key="item.driver" class="summary-line">
              <span>{{ item.driver }}</span>
              <b>{{ money(item.amount) }}</b>
            </div>
          </div>
          <div class="right-card checks">
            <h3>付款动作</h3>
            <div><CheckOutlined /> 仅显示已审核通过费用</div>
            <div><CheckOutlined /> 财务在列表中标记已付</div>
            <div><CheckOutlined /> 统计随筛选条件实时变化</div>
          </div>
        </template>
        <template v-else>
          <div class="right-card">
            <span class="eyebrow">实时统计</span>
            <h2>{{ currentProject.name }}</h2>
            <div class="stat-list">
              <div><span>待审核磅单</span><strong>{{ projectStats.pendingWeigh }}</strong></div>
              <div><span>待审核报销</span><strong>{{ projectStats.pendingExpense }}</strong></div>
              <div><span>总运费</span><strong>{{ money(projectStats.revenue) }}</strong></div>
              <div><span>总成本</span><strong>{{ money(projectStats.cost) }}</strong></div>
              <div><span>毛利</span><strong :class="{ danger: projectStats.profit < 0 }">{{ money(projectStats.profit) }}</strong></div>
              <div><span>异常单据</span><strong class="danger">{{ projectStats.issues }}</strong></div>
            </div>
          </div>
          <div class="right-card">
            <h3>最近识别记录</h3>
            <div v-for="item in projectStats.recent" :key="item.id" class="recent-item">
              <div>
                <strong>{{ 'vehiclePlate' in item ? item.vehiclePlate : '-' }}</strong>
                <span>{{ 'goods' in item ? item.goods : item.type }}</span>
              </div>
              <a-tag :color="statusColor(item.auditStatus)">{{ item.auditStatus }}</a-tag>
            </div>
          </div>
          <div class="right-card checks">
            <h3>自动校验规则</h3>
            <div><CheckOutlined /> 出发 / 到货车牌一致</div>
            <div><CheckOutlined /> 毛重皮重净重差异</div>
            <div><CheckOutlined /> 缺失到货单</div>
            <div><CheckOutlined /> 重复图片 / 重复报销</div>
            <div><CheckOutlined /> 报销日期匹配行程</div>
            <div><CheckOutlined /> 单车利润为负</div>
          </div>
        </template>
      </aside>
    </div>
  </a-config-provider>
</template>
