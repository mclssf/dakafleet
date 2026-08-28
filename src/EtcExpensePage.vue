<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { CloudDownloadOutlined, DownloadOutlined, ImportOutlined, PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined, PictureOutlined, LoadingOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons-vue';
import { Modal, message } from 'ant-design-vue';
import type { EtcRecord, EtcVehicleType } from './types';
import ImportReviewModal, { type ImportColumn } from './ImportReviewModal.vue';
import ImportSourceModal from './ImportSourceModal.vue';
import TableColumnSettings from './TableColumnSettings.vue';
import { expenseImages } from './data';

const vehicleTypeOptions: EtcVehicleType[] = ['一类货车', '二类货车', '三类货车', '四类货车', '五类货车', '六类货车'];

function make(p: Partial<EtcRecord>): EtcRecord {
  const original = p.originalAmount ?? null;
  const discount = p.discountAmount ?? null;
  // 上游只给原价和折扣时，实扣金额由两者相减
  const amount = p.amount ?? (original != null ? original - (discount ?? 0) : 0);
  return {
    id: p.id ?? `ETC_${Math.round(Math.random() * 1e9)}`,
    dataSource: p.dataSource ?? 'manual',
    sourceRefId: p.sourceRefId ?? null,
    transactionNo: p.transactionNo ?? null,
    date: p.date ?? '2026-06-01',
    vehiclePlate: p.vehiclePlate ?? '',
    etcCardNo: p.etcCardNo ?? '',
    vehicleType: p.vehicleType ?? '六类货车',
    entryStation: p.entryStation ?? '',
    exitStation: p.exitStation ?? '',
    entryTime: p.entryTime ?? null,
    exitTime: p.exitTime ?? null,
    mileage: p.mileage ?? null,
    originalAmount: original,
    discountAmount: discount,
    amount,
    balance: p.balance ?? null,
    provider: p.provider ?? '',
    driver: p.driver ?? '',
    remark: p.remark ?? '',
    images: p.images ?? [],
    paymentDate: p.paymentDate ?? null,
    createdAt: p.createdAt ?? '2026-06-26T10:00:00',
    syncedPaid: p.syncedPaid
  };
}

const seed: Partial<EtcRecord>[] = [
  { id: 'ETC_001', dataSource: 'upstream_fetch', transactionNo: 'TX202606250011', date: '2026-06-25', vehiclePlate: '赣J0587D', etcCardNo: '3601****4821', vehicleType: '六类货车', entryStation: '砚山收费站', exitStation: '德保收费站', entryTime: '2026-06-25 06:12', exitTime: '2026-06-25 10:48', mileage: 286, originalAmount: 486, discountAmount: 72.9, balance: 2418.3, provider: '云南 ETC', driver: '罗明', paymentDate: '2026-06-26' },
  { id: 'ETC_002', dataSource: 'upstream_fetch', transactionNo: 'TX202606250034', date: '2026-06-25', vehiclePlate: '赣J0521D', etcCardNo: '3601****4822', vehicleType: '六类货车', entryStation: '德保收费站', exitStation: '砚山收费站', entryTime: '2026-06-25 13:20', exitTime: '2026-06-25 17:55', mileage: 286, originalAmount: 486, discountAmount: 72.9, balance: 1876.5, provider: '云南 ETC', driver: '邓华', paymentDate: '2026-06-26' },
  { id: 'ETC_003', dataSource: 'upstream_fetch', transactionNo: 'TX202606240008', date: '2026-06-24', vehiclePlate: '赣J0533D', etcCardNo: '3601****4823', vehicleType: '六类货车', entryStation: '曲靖东收费站', exitStation: '宣威收费站', entryTime: '2026-06-24 07:40', exitTime: '2026-06-24 09:26', mileage: 112, originalAmount: 198, discountAmount: 29.7, balance: 3204.8, provider: '云南 ETC', driver: '张勇', paymentDate: '2026-06-25' },
  { id: 'ETC_004', dataSource: 'upstream_fetch', transactionNo: 'TX202606240029', date: '2026-06-24', vehiclePlate: '赣J0540D', etcCardNo: '3601****4824', vehicleType: '五类货车', entryStation: '富源收费站', exitStation: '曲靖东收费站', entryTime: '2026-06-24 11:05', exitTime: '2026-06-24 12:38', mileage: 96, originalAmount: 152, discountAmount: 22.8, balance: 940.2, provider: '云南 ETC', driver: '刘启' },
  { id: 'ETC_005', dataSource: 'upstream_fetch', transactionNo: 'TX202606230017', date: '2026-06-23', vehiclePlate: '赣J0551D', etcCardNo: '3601****4825', vehicleType: '六类货车', entryStation: '砚山收费站', exitStation: '田东收费站', entryTime: '2026-06-23 05:50', exitTime: '2026-06-23 11:32', mileage: 342, originalAmount: 578, discountAmount: 86.7, balance: 1520.4, provider: '广西 ETC', driver: '罗明', paymentDate: '2026-06-24' },
  { id: 'ETC_006', dataSource: 'upstream_fetch', transactionNo: 'TX202606230041', date: '2026-06-23', vehiclePlate: '赣J0562D', etcCardNo: '3601****4826', vehicleType: '六类货车', entryStation: '田东收费站', exitStation: '砚山收费站', entryTime: '2026-06-23 14:10', exitTime: '2026-06-23 19:47', mileage: 342, originalAmount: 578, discountAmount: 86.7, balance: 2065.9, provider: '广西 ETC', driver: '邓华' },
  { id: 'ETC_007', dataSource: 'table_import', date: '2026-06-22', vehiclePlate: '赣J0573D', etcCardNo: '3601****4827', vehicleType: '六类货车', entryStation: '砚山收费站', exitStation: '德保收费站', entryTime: '2026-06-22 06:30', exitTime: '2026-06-22 11:02', mileage: 286, originalAmount: 486, discountAmount: 72.9, provider: '云南 ETC', driver: '张勇', paymentDate: '2026-06-23' },
  { id: 'ETC_008', dataSource: 'table_import', date: '2026-06-22', vehiclePlate: '赣J0584D', etcCardNo: '3601****4828', vehicleType: '六类货车', entryStation: '德保收费站', exitStation: '砚山收费站', entryTime: '2026-06-22 14:15', exitTime: '2026-06-22 18:50', mileage: 286, originalAmount: 486, discountAmount: 72.9, provider: '云南 ETC', driver: '刘启' },
  { id: 'ETC_009', dataSource: 'table_import', date: '2026-06-21', vehiclePlate: '赣J0595D', etcCardNo: '3601****4829', vehicleType: '五类货车', entryStation: '曲靖东收费站', exitStation: '宣威收费站', entryTime: '2026-06-21 08:05', exitTime: '2026-06-21 09:41', mileage: 112, originalAmount: 176, discountAmount: 26.4, provider: '云南 ETC', driver: '罗明', paymentDate: '2026-06-22' },
  { id: 'ETC_010', dataSource: 'image_ocr', date: '2026-06-20', vehiclePlate: '赣J0506D', etcCardNo: '3601****4830', vehicleType: '六类货车', entryStation: '砚山收费站', exitStation: '华银收费站', entryTime: '2026-06-20 06:00', exitTime: '2026-06-20 12:15', mileage: 368, originalAmount: 624, discountAmount: 93.6, provider: '广西 ETC', driver: '邓华', images: [expenseImages[0]], remark: '通行费发票 OCR' },
  { id: 'ETC_011', dataSource: 'payment_sync', sourceRefId: 'PAY_2011', date: '2026-06-19', vehiclePlate: '赣J0517D', etcCardNo: '3601****4831', vehicleType: '六类货车', entryStation: '华银收费站', exitStation: '砚山收费站', entryTime: '2026-06-19 15:30', exitTime: '2026-06-19 21:40', mileage: 368, amount: 530.4, provider: '广西 ETC', driver: '张勇', syncedPaid: true },
  { id: 'ETC_012', dataSource: 'payment_sync', sourceRefId: 'PAY_2012', date: '2026-06-18', vehiclePlate: '赣J0528D', etcCardNo: '3601****4832', vehicleType: '六类货车', entryStation: '砚山收费站', exitStation: '德保收费站', entryTime: '2026-06-18 07:12', exitTime: '2026-06-18 11:44', mileage: 286, amount: 413.1, provider: '云南 ETC', driver: '刘启', syncedPaid: false },
  { id: 'ETC_013', dataSource: 'payment_sync', sourceRefId: 'PAY_2013', date: '2026-06-17', vehiclePlate: '赣J0539D', etcCardNo: '3601****4833', vehicleType: '五类货车', entryStation: '富源收费站', exitStation: '曲靖东收费站', entryTime: '2026-06-17 10:20', exitTime: '2026-06-17 11:52', mileage: 96, amount: 129.2, provider: '云南 ETC', driver: '罗明', syncedPaid: true },
  { id: 'ETC_014', dataSource: 'manual', date: '2026-06-16', vehiclePlate: '赣J0540D', etcCardNo: '3601****4824', vehicleType: '五类货车', entryStation: '曲靖东收费站', exitStation: '富源收费站', mileage: 96, amount: 129.2, provider: '云南 ETC', driver: '刘启', remark: '司机现金过站后补录', paymentDate: '2026-06-17' },
  { id: 'ETC_015', dataSource: 'manual', date: '2026-06-15', vehiclePlate: '赣J0551D', etcCardNo: '3601****4825', vehicleType: '六类货车', entryStation: '砚山收费站', exitStation: '田东收费站', mileage: 342, amount: 491.3, provider: '广西 ETC', driver: '张勇', remark: 'ETC 未识别，人工补录' }
];

const records = ref<EtcRecord[]>(seed.map(make));

const dateRange = ref<string[]>([]);
const keyword = ref('');
const sourceFilter = ref<'全部' | 'fetch' | 'import' | 'sync' | 'manual'>('全部');
const payFilter = ref<'全部' | '已付' | '未付'>('全部');
const selectedRowKeys = ref<string[]>([]);
const editingId = ref('');
const editDraft = reactive<Record<string, any>>({});

const sourceLabelMap: Record<string, string> = {
  upstream_fetch: '上游抓取',
  table_import: '导入数据',
  image_ocr: '导入数据',
  manual: '手动添加',
  payment_sync: '自动同步'
};
function sourceLabel(r: EtcRecord) {
  return sourceLabelMap[r.dataSource] ?? '手动添加';
}
function sourceColor(r: EtcRecord) {
  return r.dataSource === 'upstream_fetch' ? 'purple' : r.dataSource === 'payment_sync' ? 'cyan' : 'blue';
}
function isSync(r: EtcRecord) {
  return r.dataSource === 'payment_sync';
}
// 付款明细同步：付款状态跟随付款明细（syncedPaid）；其它来源用 paymentDate 手动标记
function isPaid(r: EtcRecord) {
  return isSync(r) ? !!r.syncedPaid : !!r.paymentDate;
}
function sourceGroup(r: EtcRecord) {
  if (r.dataSource === 'upstream_fetch') return 'fetch';
  if (r.dataSource === 'manual') return 'manual';
  return ['table_import', 'image_ocr', 'upstream_import'].includes(r.dataSource) ? 'import' : 'sync';
}

const filtered = computed(() =>
  records.value.filter((r) => {
    const inDate = dateRange.value.length !== 2 || (r.date >= dateRange.value[0] && r.date <= dateRange.value[1]);
    const kw = keyword.value.trim();
    const inKw = !kw || [r.vehiclePlate, r.etcCardNo, r.entryStation, r.exitStation, r.driver, r.remark, r.transactionNo ?? ''].some((v) => (v ?? '').includes(kw));
    const inSource = sourceFilter.value === '全部' || sourceGroup(r) === sourceFilter.value;
    const inPay = payFilter.value === '全部' || (payFilter.value === '已付' ? isPaid(r) : !isPaid(r));
    return inDate && inKw && inSource && inPay;
  })
);

const stats = computed(() => {
  const rows = filtered.value;
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const discount = rows.reduce((s, r) => s + (r.discountAmount ?? 0), 0);
  const mileage = rows.reduce((s, r) => s + (r.mileage ?? 0), 0);
  return {
    count: rows.length,
    total,
    discount,
    perKm: mileage ? (total / mileage).toFixed(2) : '—',
    unpaid: rows.filter((r) => !isPaid(r)).length
  };
});

const baseColumns = [
  { title: '通行日期', dataIndex: 'date', width: 100, sorter: (a: EtcRecord, b: EtcRecord) => a.date.localeCompare(b.date) },
  { title: '来源', dataIndex: 'source', width: 100 },
  { title: '车牌号', dataIndex: 'vehiclePlate', width: 108 },
  { title: 'ETC 卡号', dataIndex: 'etcCardNo', width: 130 },
  { title: '车型', dataIndex: 'vehicleType', width: 96 },
  { title: '入口站', dataIndex: 'entryStation', width: 130 },
  { title: '出口站', dataIndex: 'exitStation', width: 130 },
  { title: '入口时间', dataIndex: 'entryTime', width: 140 },
  { title: '出口时间', dataIndex: 'exitTime', width: 140 },
  { title: '里程(km)', dataIndex: 'mileage', width: 96, sorter: (a: EtcRecord, b: EtcRecord) => (a.mileage ?? 0) - (b.mileage ?? 0) },
  { title: '原始金额', dataIndex: 'originalAmount', width: 104 },
  { title: '优惠金额', dataIndex: 'discountAmount', width: 104 },
  { title: '实扣金额', dataIndex: 'amount', width: 108, sorter: (a: EtcRecord, b: EtcRecord) => a.amount - b.amount },
  { title: '卡余额', dataIndex: 'balance', width: 100 },
  { title: '发行方', dataIndex: 'provider', width: 100 },
  { title: '司机', dataIndex: 'driver', width: 88 },
  { title: '交易流水号', dataIndex: 'transactionNo', width: 150 },
  { title: '付款日期', dataIndex: 'paymentDate', width: 104, sorter: (a: EtcRecord, b: EtcRecord) => (a.paymentDate ?? '').localeCompare(b.paymentDate ?? '') },
  { title: '付款状态', dataIndex: 'payStatus', width: 96 },
  { title: '备注', dataIndex: 'remark', width: 150 },
  { title: '凭证', dataIndex: 'images', width: 72 },
  { title: '操作', dataIndex: 'action', fixed: 'right', width: 200 }
];
const defaultFieldKeys = baseColumns.filter((column) => column.dataIndex !== 'action').map((column) => column.dataIndex);
const fieldKeys = ref<string[]>(JSON.parse(localStorage.getItem('etc-table-columns') || 'null') || defaultFieldKeys);
watch(fieldKeys, (value) => localStorage.setItem('etc-table-columns', JSON.stringify(value)), { deep: true });
const columns = computed(() => [...fieldKeys.value.map((key) => baseColumns.find((column) => column.dataIndex === key)).filter(Boolean), baseColumns.find((column) => column.dataIndex === 'action')]);

function dt(v: string) {
  const [, m, d] = v.split('-');
  return `${Number(m)}月${Number(d)}日`;
}
function money(v: number | null) {
  return v == null ? '—' : `¥${v.toFixed(2)}`;
}
const editableFields = ['date', 'vehiclePlate', 'etcCardNo', 'entryStation', 'exitStation', 'entryTime', 'exitTime', 'mileage', 'originalAmount', 'discountAmount', 'amount', 'provider', 'driver', 'remark'];
function startEdit(r: EtcRecord) {
  editingId.value = r.id;
  Object.assign(editDraft, r);
}
function cancelEdit() {
  editingId.value = '';
}
function saveEdit(r: EtcRecord) {
  r.date = editDraft.date ?? r.date;
  r.vehiclePlate = editDraft.vehiclePlate ?? r.vehiclePlate;
  r.etcCardNo = editDraft.etcCardNo ?? r.etcCardNo;
  if (editDraft.vehicleType) r.vehicleType = editDraft.vehicleType;
  r.entryStation = editDraft.entryStation ?? r.entryStation;
  r.exitStation = editDraft.exitStation ?? r.exitStation;
  r.entryTime = editDraft.entryTime || null;
  r.exitTime = editDraft.exitTime || null;
  r.mileage = editDraft.mileage === '' || editDraft.mileage == null ? null : Number(editDraft.mileage);
  r.originalAmount = editDraft.originalAmount === '' || editDraft.originalAmount == null ? null : Number(editDraft.originalAmount);
  r.discountAmount = editDraft.discountAmount === '' || editDraft.discountAmount == null ? null : Number(editDraft.discountAmount);
  r.amount = Number(editDraft.amount) || 0;
  r.provider = editDraft.provider ?? r.provider;
  r.driver = editDraft.driver ?? r.driver;
  r.remark = editDraft.remark ?? r.remark;
  editingId.value = '';
  message.success('已保存');
}
// 编辑态改原始/优惠金额时实时联动实扣金额
function syncAmount() {
  const original = Number(editDraft.originalAmount);
  if (!Number.isFinite(original)) return;
  editDraft.amount = Number((original - (Number(editDraft.discountAmount) || 0)).toFixed(2));
}
function removeRow(r: EtcRecord) {
  Modal.confirm({
    title: '确认删除该条 ETC 记录？删除后不可恢复。',
    okText: '删除', okType: 'danger', cancelText: '取消',
    onOk() {
      records.value = records.value.filter((x) => x.id !== r.id);
      selectedRowKeys.value = selectedRowKeys.value.filter((k) => k !== r.id);
      message.success('已删除');
    }
  });
}
function togglePaid(r: EtcRecord) {
  if (isSync(r)) return;
  if (r.paymentDate) {
    r.paymentDate = null;
    message.success('已取消标记');
  } else {
    r.paymentDate = '2026-06-30';
    message.success('已标记已付');
  }
}

const viewerVisible = ref(false);
const viewerImages = ref<string[]>([]);
const viewerIndex = ref(0);
function viewImages(r: EtcRecord) {
  if (!r.images.length) return;
  viewerImages.value = r.images;
  viewerIndex.value = 0;
  viewerVisible.value = true;
}

function batchDelete() {
  if (!selectedRowKeys.value.length) return;
  Modal.confirm({
    title: `确认批量删除已选 ${selectedRowKeys.value.length} 条记录？`,
    okText: '删除', okType: 'danger', cancelText: '取消',
    onOk() {
      records.value = records.value.filter((x) => !selectedRowKeys.value.includes(x.id));
      selectedRowKeys.value = [];
      message.success('批量删除完成');
    }
  });
}
function batchPaid() {
  records.value.forEach((r) => {
    if (selectedRowKeys.value.includes(r.id) && !isSync(r) && !r.paymentDate) r.paymentDate = '2026-06-30';
  });
  message.success('已批量标记已付（付款明细同步记录跟随明细状态，不参与）');
}
function exportRows() {
  message.success(`已导出 ${filtered.value.length} 条 ETC 记录（Demo 模拟）`);
}

// ===== 上游 ETC 自动抓取 =====
// 配置发行方账号 → 抓取该账号名下所有 ETC 卡的通行流水 → 按交易流水号与已有记录去重 → 勾选入库。
const fetchConfigVisible = ref(false);
const fetchResultVisible = ref(false);
const fetching = ref(false);
const fetchProgress = ref(0);
const fetchStep = ref('');
const fetchDrafts = ref<Record<string, any>[]>([]);
const fetchSelectedKeys = ref<number[]>([]);
const fetchTimers: number[] = [];
const autoFetchEnabled = ref(localStorage.getItem('etc-auto-fetch') === '1');
const lastFetchAt = ref(localStorage.getItem('etc-last-fetch') || '2026-06-26 08:00');

const fetchForm = reactive({
  provider: '云南 ETC',
  account: 'kxcl_fleet',
  password: '••••••••',
  startDate: '2026-06-26',
  endDate: '2026-06-30'
});

const providerOptions = [
  { value: '云南 ETC', label: '云南 ETC（云通卡）' },
  { value: '广西 ETC', label: '广西 ETC（八桂行）' },
  { value: '中石化 ETC', label: '中石化 ETC 车宝卡' },
  { value: '交通部路网', label: '交通部路网结算中心' }
];

// Demo：模拟上游返回的通行流水，含一条与 ETC_001 重复的流水号用于演示去重
const fetchSamples: Record<string, any>[] = [
  { transactionNo: 'TX202606300012', date: '2026-06-30', vehiclePlate: '赣J0587D', etcCardNo: '3601****4821', vehicleType: '六类货车', entryStation: '砚山收费站', exitStation: '德保收费站', entryTime: '2026-06-30 06:08', exitTime: '2026-06-30 10:35', mileage: 286, originalAmount: 486, discountAmount: 72.9, balance: 2005.4, driver: '罗明' },
  { transactionNo: 'TX202606300047', date: '2026-06-30', vehiclePlate: '赣J0521D', etcCardNo: '3601****4822', vehicleType: '六类货车', entryStation: '德保收费站', exitStation: '砚山收费站', entryTime: '2026-06-30 13:44', exitTime: '2026-06-30 18:12', mileage: 286, originalAmount: 486, discountAmount: 72.9, balance: 1463.4, driver: '邓华' },
  { transactionNo: 'TX202606290021', date: '2026-06-29', vehiclePlate: '赣J0533D', etcCardNo: '3601****4823', vehicleType: '六类货车', entryStation: '曲靖东收费站', exitStation: '宣威收费站', entryTime: '2026-06-29 07:31', exitTime: '2026-06-29 09:14', mileage: 112, originalAmount: 198, discountAmount: 29.7, balance: 3036.5, driver: '张勇' },
  { transactionNo: 'TX202606290055', date: '2026-06-29', vehiclePlate: '赣J0540D', etcCardNo: '3601****4824', vehicleType: '五类货车', entryStation: '富源收费站', exitStation: '曲靖东收费站', entryTime: '2026-06-29 11:20', exitTime: '2026-06-29 12:49', mileage: 96, originalAmount: 152, discountAmount: 22.8, balance: 811.0, driver: '刘启' },
  // 出口站未上传：上游偶发缺字段，入库前需人工补全
  { transactionNo: 'TX202606280033', date: '2026-06-28', vehiclePlate: '赣J0551D', etcCardNo: '3601****4825', vehicleType: '六类货车', entryStation: '砚山收费站', exitStation: '', entryTime: '2026-06-28 05:47', exitTime: '', mileage: null, originalAmount: 578, discountAmount: 86.7, balance: 1029.1, driver: '罗明' },
  { transactionNo: 'TX202606280061', date: '2026-06-28', vehiclePlate: '赣J0562D', etcCardNo: '3601****4826', vehicleType: '六类货车', entryStation: '田东收费站', exitStation: '砚山收费站', entryTime: '2026-06-28 14:02', exitTime: '2026-06-28 19:38', mileage: 342, originalAmount: 578, discountAmount: 86.7, balance: 1574.7, driver: '邓华' },
  // 与 ETC_001 流水号相同：抓取时应识别为已入库
  { transactionNo: 'TX202606250011', date: '2026-06-25', vehiclePlate: '赣J0587D', etcCardNo: '3601****4821', vehicleType: '六类货车', entryStation: '砚山收费站', exitStation: '德保收费站', entryTime: '2026-06-25 06:12', exitTime: '2026-06-25 10:48', mileage: 286, originalAmount: 486, discountAmount: 72.9, balance: 2418.3, driver: '罗明' }
];

const fetchSteps = ['正在登录上游 ETC 平台…', '正在读取名下 ETC 卡列表…', '正在拉取通行流水…', '正在按交易流水号比对去重…'];

function draftIssues(d: Record<string, any>) {
  const missing: string[] = [];
  if (!d.date) missing.push('通行日期');
  if (!d.vehiclePlate) missing.push('车牌号');
  if (!d.exitStation) missing.push('出口站');
  if (d.amount == null) missing.push('实扣金额');
  return missing;
}
const fetchNewCount = computed(() => fetchDrafts.value.filter((d) => !d.duplicated).length);
const fetchDupCount = computed(() => fetchDrafts.value.filter((d) => d.duplicated).length);

function startFetch() {
  if (!fetchForm.account) {
    message.warning('请填写上游平台账号');
    return;
  }
  fetchConfigVisible.value = false;
  // 清掉上一次未跑完的定时器，避免旧回调覆盖本次抓取结果
  fetchTimers.splice(0).forEach((timer) => window.clearTimeout(timer));
  fetching.value = true;
  fetchProgress.value = 0;
  fetchStep.value = fetchSteps[0];
  fetchDrafts.value = [];
  fetchSelectedKeys.value = [];
  fetchResultVisible.value = true;
  fetchSteps.forEach((step, index) => {
    fetchTimers.push(
      window.setTimeout(() => {
        fetchStep.value = step;
        fetchProgress.value = Math.round(((index + 1) / fetchSteps.length) * 100);
      }, index * 550)
    );
  });
  fetchTimers.push(
    window.setTimeout(() => {
      const existingNos = new Set(records.value.map((r) => r.transactionNo).filter(Boolean));
      // 账期内的流水，加上账期外但已入库的流水（让用户看到去重结果）
      fetchDrafts.value = fetchSamples
        .filter((row) => (row.date >= fetchForm.startDate && row.date <= fetchForm.endDate) || existingNos.has(row.transactionNo))
        .map((row, index) => ({
          ...row,
          key: index,
          amount: row.originalAmount == null ? null : Number((row.originalAmount - (row.discountAmount ?? 0)).toFixed(2)),
          duplicated: existingNos.has(row.transactionNo)
        }));
      // 默认只勾选未入库且字段完整的流水
      fetchSelectedKeys.value = fetchDrafts.value.filter((d) => !d.duplicated && !draftIssues(d).length).map((d) => d.key);
      fetching.value = false;
      fetchStep.value = '抓取完成';
    }, fetchSteps.length * 550 + 400)
  );
}

function confirmFetch() {
  const chosen = fetchDrafts.value.filter((d) => fetchSelectedKeys.value.includes(d.key));
  if (!chosen.length) {
    message.warning('请至少勾选一条通行流水');
    return;
  }
  const invalid = chosen.filter((d) => draftIssues(d).length);
  if (invalid.length) {
    message.warning(`还有 ${invalid.length} 条流水缺必填项，请补全后再入库`);
    return;
  }
  const added = chosen.map((d) =>
    make({
      dataSource: 'upstream_fetch',
      id: `ETC_${Math.round(Math.random() * 1e9)}`,
      transactionNo: d.transactionNo,
      date: d.date,
      vehiclePlate: d.vehiclePlate,
      etcCardNo: d.etcCardNo,
      vehicleType: d.vehicleType,
      entryStation: d.entryStation,
      exitStation: d.exitStation,
      entryTime: d.entryTime || null,
      exitTime: d.exitTime || null,
      mileage: d.mileage == null ? null : Number(d.mileage),
      originalAmount: d.originalAmount == null ? null : Number(d.originalAmount),
      discountAmount: d.discountAmount == null ? null : Number(d.discountAmount),
      amount: Number(d.amount) || 0,
      balance: d.balance == null ? null : Number(d.balance),
      provider: fetchForm.provider,
      driver: d.driver ?? ''
    })
  );
  records.value = [...added, ...records.value];
  fetchResultVisible.value = false;
  lastFetchAt.value = '2026-06-30 09:20';
  localStorage.setItem('etc-last-fetch', lastFetchAt.value);
  message.success(`已从${fetchForm.provider}入库 ${added.length} 条通行流水`);
}

watch(autoFetchEnabled, (value) => {
  localStorage.setItem('etc-auto-fetch', value ? '1' : '0');
  message.success(value ? '已开启每日 08:00 自动抓取上游 ETC 流水' : '已关闭自动抓取');
});

onBeforeUnmount(() => fetchTimers.splice(0).forEach((timer) => window.clearTimeout(timer)));

// ===== 表格 / 票据导入 =====
const tableImportVisible = ref(false);
const importSourceVisible = ref(false);
const tableFileInput = ref<HTMLInputElement | null>(null);
const receiptFileInput = ref<HTMLInputElement | null>(null);
const tableImportFileName = ref('ETC通行明细_202606.xlsx');
const tableImportColumns: ImportColumn[] = [
  { key: 'date', label: '通行日期', sourceNames: ['交易日期'], required: true },
  { key: 'vehiclePlate', label: '车牌号', sourceNames: ['车牌'], required: true },
  { key: 'etcCardNo', label: 'ETC 卡号', sourceNames: ['卡号'] },
  { key: 'entryStation', label: '入口站', sourceNames: ['入口收费站'] },
  { key: 'exitStation', label: '出口站', sourceNames: ['出口收费站'], required: true },
  { key: 'mileage', label: '里程', sourceNames: ['通行里程(km)'], type: 'number' },
  { key: 'amount', label: '实扣金额', sourceNames: ['交易金额(元)'], type: 'number', required: true }
];
const tableImportRows = [
  { date: '2026-06-29', vehiclePlate: '赣J05590D', etcCardNo: '3601****4841', entryStation: '砚山收费站', exitStation: '德保收费站', mileage: 286, amount: 413.1 },
  { date: '2026-06-29', vehiclePlate: '赣J05601D', etcCardNo: '3601****4842', entryStation: '德保收费站', exitStation: '砚山收费站', mileage: 286, amount: 413.1 },
  { date: '2026-06-28', vehiclePlate: '', etcCardNo: '3601****4843', entryStation: '曲靖东收费站', exitStation: '宣威收费站', mileage: 112, amount: 168.3 },
  { date: '2026-06-28', vehiclePlate: '赣J05612D', etcCardNo: '3601****4844', entryStation: '富源收费站', exitStation: '', mileage: null, amount: null }
];
function importTable() {
  tableFileInput.value?.click();
}
function selectImportSource(source: 'table' | 'receipt') { source === 'table' ? importTable() : receiptFileInput.value?.click(); }
function onTableFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  (event.target as HTMLInputElement).value = '';
  if (!file) return;
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) { message.error('请选择 XLSX、XLS 或 CSV 文件'); return; }
  if (file.size > 10 * 1024 * 1024) { message.error('文件不能超过 10 MB'); return; }
  tableImportFileName.value = file.name;
  message.success(`已读取 ${file.name}，请核对字段映射与异常数据`);
  tableImportVisible.value = true;
}
function confirmTableImport(rows: Array<Record<string, string | number | null>>) {
  const added = rows.map((row) =>
    make({
      dataSource: 'table_import',
      id: `ETC_${Math.round(Math.random() * 1e9)}`,
      date: String(row.date),
      vehiclePlate: String(row.vehiclePlate),
      etcCardNo: String(row.etcCardNo ?? ''),
      entryStation: String(row.entryStation ?? ''),
      exitStation: String(row.exitStation ?? ''),
      mileage: row.mileage == null ? null : Number(row.mileage),
      amount: Number(row.amount) || 0
    })
  );
  records.value = [...added, ...records.value];
  message.success(`已导入 ${added.length} 条 ETC 记录`);
}

// 票据识别导入：上传多张通行费发票/小票 → OCR 草稿 → 勾选核对 → 批量导入
const ocrImportVisible = ref(false);
const ocrDrafts = ref<Record<string, any>[]>([]);
const ocrSelectedKeys = ref<number[]>([]);
function onReceiptFile(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files ?? []);
  (event.target as HTMLInputElement).value = '';
  if (!files.length) return;
  if (files.some((file) => !file.type.startsWith('image/') && file.type !== 'application/pdf' && !/\.(pdf|png|jpe?g|webp)$/i.test(file.name))) { message.error('请选择 PDF、JPG、PNG 或 WEBP 文件'); return; }
  if (files.some((file) => file.size > 20 * 1024 * 1024)) { message.error('单个文件不能超过 20 MB'); return; }
  const samples = [
    { date: '2026-06-30', vehiclePlate: '赣J0587D', etcCardNo: '3601****4821', entryStation: '砚山收费站', exitStation: '德保收费站', mileage: 286, amount: 413.1, remark: '通行费发票 OCR，请核对' },
    { date: '2026-06-29', vehiclePlate: '赣J0521D', etcCardNo: '3601****4822', entryStation: '德保收费站', exitStation: '', mileage: null, amount: 413.1, remark: '出口站未识别，请补充' },
    { date: '2026-06-28', vehiclePlate: '赣J0533D', etcCardNo: '3601****4823', entryStation: '曲靖东收费站', exitStation: '宣威收费站', mileage: 112, amount: 168.3, remark: '通行费发票 OCR，请核对' }
  ];
  ocrDrafts.value = files.map((file, index) => ({
    key: index,
    ...samples[index % samples.length],
    image: file.type.startsWith('image/') ? URL.createObjectURL(file) : expenseImages[index % expenseImages.length],
    fileName: file.name
  }));
  ocrSelectedKeys.value = ocrDrafts.value.filter((d) => !draftIssues(d).length).map((d) => d.key);
  ocrImportVisible.value = true;
}
function removeOcrDraft(key: number) {
  ocrDrafts.value = ocrDrafts.value.filter((d) => d.key !== key);
  ocrSelectedKeys.value = ocrSelectedKeys.value.filter((k) => k !== key);
}
function confirmOcrImport() {
  const chosen = ocrDrafts.value.filter((d) => ocrSelectedKeys.value.includes(d.key));
  if (!chosen.length) {
    message.warning('请至少勾选一条记录');
    return;
  }
  if (chosen.some((d) => draftIssues(d).length)) {
    message.warning('勾选记录的通行日期、车牌、出口站、实扣金额均为必填');
    return;
  }
  const added = chosen.map((d) =>
    make({
      dataSource: 'image_ocr',
      id: `ETC_${Math.round(Math.random() * 1e9)}`,
      date: d.date,
      vehiclePlate: d.vehiclePlate,
      etcCardNo: d.etcCardNo,
      entryStation: d.entryStation,
      exitStation: d.exitStation,
      mileage: d.mileage == null ? null : Number(d.mileage),
      amount: Number(d.amount) || 0,
      remark: d.remark,
      images: d.image ? [d.image] : []
    })
  );
  records.value = [...added, ...records.value];
  ocrImportVisible.value = false;
  message.success(`已批量审核并导入 ${added.length} 条 ETC 记录`);
}

const addVisible = ref(false);
const addForm = reactive<Record<string, any>>({});
function openAdd() {
  Object.assign(addForm, { date: '2026-06-30', vehiclePlate: '', etcCardNo: '', vehicleType: '六类货车', entryStation: '', exitStation: '', entryTime: '', exitTime: '', mileage: null, originalAmount: null, discountAmount: null, amount: null, provider: '云南 ETC', driver: '', remark: '' });
  addVisible.value = true;
}
function saveAdd() {
  if (!addForm.date || !addForm.vehiclePlate || !addForm.exitStation || addForm.amount == null) {
    message.warning('通行日期、车牌号、出口站、实扣金额为必填项');
    return;
  }
  records.value = [make({ ...addForm, dataSource: 'manual', id: `ETC_${Math.round(Math.random() * 1e9)}` }), ...records.value];
  addVisible.value = false;
  message.success('已添加');
}
</script>

<template>
  <section class="content list-screen etc-page">
    <div class="page-toolbar">
      <div>
        <h2>ETC 费用</h2>
        <span>汇总上游 ETC 平台自动抓取、表格导入、票据识别和手动补录的高速通行费</span>
      </div>
      <div class="toolbar-actions">
        <input ref="tableFileInput" class="hidden-file-input" type="file" accept=".xlsx,.xls,.csv" @change="onTableFile" />
        <input ref="receiptFileInput" class="hidden-file-input" type="file" multiple accept="application/pdf,.pdf,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" @change="onReceiptFile" />
        <a-button type="primary" @click="fetchConfigVisible = true"><template #icon><CloudDownloadOutlined /></template>上游抓取</a-button>
        <a-button @click="importSourceVisible = true"><template #icon><ImportOutlined /></template>导入数据</a-button>
        <a-button @click="openAdd"><template #icon><PlusOutlined /></template>手动添加</a-button>
        <TableColumnSettings v-model="fieldKeys" :columns="baseColumns" />
        <a-button @click="exportRows"><template #icon><DownloadOutlined /></template>导出</a-button>
      </div>
    </div>

    <div class="metric-grid five">
      <div class="metric-card"><span>通行笔数</span><strong>{{ stats.count }}</strong></div>
      <div class="metric-card"><span>ETC 总支出</span><strong>¥{{ stats.total.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</strong></div>
      <div class="metric-card"><span>累计优惠</span><strong>¥{{ stats.discount.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</strong></div>
      <div class="metric-card blue"><span>每公里通行费</span><strong>¥{{ stats.perKm }}</strong></div>
      <div class="metric-card orange"><span>未付款笔数</span><strong>{{ stats.unpaid }}</strong></div>
    </div>

    <div class="etc-fetch-bar">
      <CloudDownloadOutlined />
      <span>上游 ETC 已接入 <b>{{ fetchForm.provider }}</b>，最近抓取 <b>{{ lastFetchAt }}</b>；抓取按交易流水号自动去重，重复流水不入库。</span>
      <a-switch v-model:checked="autoFetchEnabled" size="small" />
      <span class="etc-fetch-switch-label">每日自动抓取</span>
    </div>

    <div class="filter-bar etc-filter">
      <a-range-picker v-model:value="dateRange" value-format="YYYY-MM-DD" />
      <a-input v-model:value="keyword" placeholder="搜索车牌、卡号、收费站、司机、流水号..." allow-clear>
        <template #prefix><SearchOutlined /></template>
      </a-input>
      <a-select v-model:value="sourceFilter" style="width: 100%">
        <a-select-option value="全部">全部来源</a-select-option>
        <a-select-option value="fetch">上游抓取</a-select-option>
        <a-select-option value="import">导入数据</a-select-option>
        <a-select-option value="manual">手动添加</a-select-option>
        <a-select-option value="sync">自动同步</a-select-option>
      </a-select>
      <a-select v-model:value="payFilter" style="width: 100%">
        <a-select-option value="全部">全部付款状态</a-select-option>
        <a-select-option value="已付">已付</a-select-option>
        <a-select-option value="未付">未付</a-select-option>
      </a-select>
    </div>

    <a-table
      size="small"
      :columns="columns"
      :data-source="filtered"
      :pagination="{ pageSize: 10 }"
      :scroll="{ x: 2100 }"
      row-key="id"
      class="dense-table"
      :row-selection="{ selectedRowKeys, onChange: (keys: any) => (selectedRowKeys = keys) }"
    >
      <template #emptyText><a-empty description="暂无 ETC 数据" /></template>
      <template #bodyCell="{ column, record }">
        <template v-if="editingId === record.id && ['originalAmount','discountAmount'].includes(column.dataIndex)">
          <a-input-number v-model:value="editDraft[column.dataIndex]" size="small" :min="0" style="width: 92px" @change="syncAmount" />
        </template>
        <template v-else-if="editingId === record.id && ['mileage','amount'].includes(column.dataIndex)">
          <a-input-number v-model:value="editDraft[column.dataIndex]" size="small" :min="0" style="width: 92px" />
        </template>
        <template v-else-if="editingId === record.id && column.dataIndex === 'vehicleType'">
          <a-select v-model:value="editDraft.vehicleType" size="small" style="width: 92px">
            <a-select-option v-for="t in vehicleTypeOptions" :key="t" :value="t">{{ t }}</a-select-option>
          </a-select>
        </template>
        <template v-else-if="editingId === record.id && editableFields.includes(column.dataIndex)">
          <a-input v-model:value="editDraft[column.dataIndex]" size="small" />
        </template>
        <template v-else-if="column.dataIndex === 'date'">{{ dt(record.date) }}</template>
        <template v-else-if="column.dataIndex === 'source'"><a-tag :color="sourceColor(record)">{{ sourceLabel(record) }}</a-tag></template>
        <template v-else-if="['originalAmount','discountAmount','balance'].includes(column.dataIndex)">{{ money(record[column.dataIndex]) }}</template>
        <template v-else-if="column.dataIndex === 'amount'"><strong>¥{{ record.amount.toFixed(2) }}</strong></template>
        <template v-else-if="column.dataIndex === 'mileage'">{{ record.mileage == null ? '—' : `${record.mileage} km` }}</template>
        <template v-else-if="['entryTime','exitTime','transactionNo','provider','driver','remark'].includes(column.dataIndex)">{{ record[column.dataIndex] || '—' }}</template>
        <template v-else-if="column.dataIndex === 'paymentDate'">{{ record.paymentDate ? dt(record.paymentDate) : '—' }}</template>
        <template v-else-if="column.dataIndex === 'payStatus'">
          <a-tag :color="isPaid(record) ? 'green' : 'orange'">{{ isPaid(record) ? '已付' : '未付' }}</a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'images'">
          <a-button size="small" :disabled="!record.images.length" @click="viewImages(record)"><template #icon><PictureOutlined /></template></a-button>
        </template>
        <template v-else-if="column.dataIndex === 'action'">
          <template v-if="editingId === record.id">
            <a-button size="small" type="primary" @click="saveEdit(record)">保存</a-button>
            <a-button size="small" @click="cancelEdit">取消</a-button>
          </template>
          <template v-else>
            <a-button size="small" @click="startEdit(record)"><template #icon><EditOutlined /></template></a-button>
            <a-button size="small" danger @click="removeRow(record)"><template #icon><DeleteOutlined /></template></a-button>
            <a-button v-if="!isSync(record)" size="small" type="primary" ghost @click="togglePaid(record)">{{ isPaid(record) ? '取消标记' : '标记已付' }}</a-button>
          </template>
        </template>
      </template>
    </a-table>

    <div v-if="selectedRowKeys.length" class="batch-bar">
      <span>已选 {{ selectedRowKeys.length }} 条</span>
      <a-button size="small" danger @click="batchDelete">批量删除</a-button>
      <a-button size="small" @click="exportRows">批量导出</a-button>
      <a-button size="small" @click="batchPaid">批量标记已付</a-button>
    </div>

    <a-modal v-model:open="viewerVisible" title="ETC 凭证" :footer="null" width="640px">
      <div class="viewer">
        <a-button :disabled="viewerIndex === 0" @click="viewerIndex--">上一张</a-button>
        <img :src="viewerImages[viewerIndex]" alt="ETC 凭证" />
        <a-button :disabled="viewerIndex >= viewerImages.length - 1" @click="viewerIndex++">下一张</a-button>
      </div>
      <p class="viewer-idx">{{ viewerIndex + 1 }} / {{ viewerImages.length }}</p>
    </a-modal>

    <a-modal v-model:open="fetchConfigVisible" title="上游 ETC 自动抓取" ok-text="开始抓取" cancel-text="取消" width="620px" @ok="startFetch">
      <p class="fetch-lead">配置上游 ETC 平台账号与账期，系统将登录平台拉取名下所有 ETC 卡的通行流水，按交易流水号与已入库记录去重后供你审核。</p>
      <div class="add-form">
        <label class="wide"><span>ETC 发行方 / 服务商*</span>
          <a-select v-model:value="fetchForm.provider" style="width:100%">
            <a-select-option v-for="p in providerOptions" :key="p.value" :value="p.value">{{ p.label }}</a-select-option>
          </a-select>
        </label>
        <label><span>平台账号*</span><a-input v-model:value="fetchForm.account" placeholder="上游平台登录账号" /></label>
        <label><span>平台密码</span><a-input-password v-model:value="fetchForm.password" /></label>
        <label><span>账期开始</span><a-input v-model:value="fetchForm.startDate" placeholder="2026-06-26" /></label>
        <label><span>账期结束</span><a-input v-model:value="fetchForm.endDate" placeholder="2026-06-30" /></label>
      </div>
      <div class="fetch-note"><CheckCircleOutlined /><span>账号凭据仅用于本次抓取，登录态由智能体托管；开启「每日自动抓取」后每天 08:00 自动执行。</span></div>
    </a-modal>

    <a-modal v-model:open="fetchResultVisible" title="上游 ETC 通行流水 · 审核后入库" width="1080px" :footer="fetching ? null : undefined" ok-text="确认入库" cancel-text="取消" @ok="confirmFetch">
      <div v-if="fetching" class="fetch-loading">
        <LoadingOutlined spin />
        <strong>{{ fetchStep }}</strong>
        <a-progress :percent="fetchProgress" :show-info="false" status="active" style="width: 320px" />
        <span>正在从 {{ fetchForm.provider }} 抓取 {{ fetchForm.startDate }} 至 {{ fetchForm.endDate }} 的通行流水</span>
      </div>
      <div v-else class="fetch-result">
        <div class="fetch-summary">
          <CloudDownloadOutlined />
          <div>
            <strong>{{ fetchForm.provider }} · {{ fetchForm.startDate }} ~ {{ fetchForm.endDate }}</strong>
            <span>共抓取 {{ fetchDrafts.length }} 条通行流水，勾选并核对后入库</span>
          </div>
          <div class="fetch-summary-state">
            <a-tag color="green"><CheckCircleOutlined /> {{ fetchNewCount }} 条待入库</a-tag>
            <a-tag v-if="fetchDupCount" color="default"><WarningOutlined /> {{ fetchDupCount }} 条已入库</a-tag>
          </div>
        </div>
        <a-checkbox-group v-model:value="fetchSelectedKeys" class="fetch-list">
          <div v-for="d in fetchDrafts" :key="d.key" class="fetch-item" :class="{ duplicated: d.duplicated, invalid: !d.duplicated && draftIssues(d).length }">
            <a-checkbox :value="d.key" :disabled="d.duplicated" class="fetch-check" />
            <div class="fetch-route">
              <b>{{ d.vehiclePlate || '车牌未识别' }}</b>
              <span>{{ d.entryStation || '—' }} → {{ d.exitStation || '出口待补' }}</span>
              <em>{{ d.transactionNo }}</em>
            </div>
            <div class="add-form fetch-fields">
              <label><span>通行日期*</span><a-input v-model:value="d.date" /></label>
              <label><span>车牌号*</span><a-input v-model:value="d.vehiclePlate" /></label>
              <label><span>入口站</span><a-input v-model:value="d.entryStation" /></label>
              <label><span>出口站*</span><a-input v-model:value="d.exitStation" /></label>
              <label><span>里程(km)</span><a-input-number v-model:value="d.mileage" :min="0" style="width:100%" /></label>
              <label><span>实扣金额*</span><a-input-number v-model:value="d.amount" :min="0" style="width:100%" /></label>
            </div>
            <div class="fetch-state">
              <a-tag v-if="d.duplicated" color="default">已入库</a-tag>
              <a-tag v-else-if="draftIssues(d).length" color="red">缺 {{ draftIssues(d).join('、') }}</a-tag>
              <a-tag v-else color="green">通过</a-tag>
            </div>
          </div>
        </a-checkbox-group>
        <a-empty v-if="!fetchDrafts.length" description="所选账期内没有新的通行流水" />
      </div>
      <template v-if="!fetching" #footer>
        <span class="fetch-footer-hint">已选 {{ fetchSelectedKeys.length }} / {{ fetchNewCount }} 条待入库流水；重复流水号不可勾选</span>
        <a-button @click="fetchResultVisible = false">取消</a-button>
        <a-button type="primary" :disabled="!fetchSelectedKeys.length" @click="confirmFetch">确认入库 {{ fetchSelectedKeys.length }} 条</a-button>
      </template>
    </a-modal>

    <a-modal v-model:open="ocrImportVisible" title="ETC 票据识别 · 审核后导入" ok-text="批量审核并导入" cancel-text="取消" width="960px" @ok="confirmOcrImport">
      <div class="batch-import">
        <p class="batch-import-tip">已识别 {{ ocrDrafts.length }} 张票据，勾选并核对修改后批量导入（已选 {{ ocrSelectedKeys.length }} 条）。</p>
        <a-checkbox-group v-model:value="ocrSelectedKeys" class="batch-import-list">
          <div v-for="d in ocrDrafts" :key="d.key" class="batch-import-item">
            <a-checkbox :value="d.key" class="batch-import-check" />
            <div class="import-image">
              <img :src="d.image" alt="ETC 票据" />
              <span>{{ d.fileName || 'OCR 图片' }}</span>
            </div>
            <div class="add-form import-fields">
              <label><span>通行日期*</span><a-input v-model:value="d.date" /></label>
              <label><span>车牌号*</span><a-input v-model:value="d.vehiclePlate" /></label>
              <label><span>ETC 卡号</span><a-input v-model:value="d.etcCardNo" /></label>
              <label><span>入口站</span><a-input v-model:value="d.entryStation" /></label>
              <label><span>出口站*</span><a-input v-model:value="d.exitStation" /></label>
              <label><span>实扣金额*</span><a-input-number v-model:value="d.amount" :min="0" style="width:100%" /></label>
              <label class="wide"><span>备注</span><a-input v-model:value="d.remark" /></label>
            </div>
            <a-button size="small" danger class="batch-import-remove" @click="removeOcrDraft(d.key)">移除</a-button>
          </div>
        </a-checkbox-group>
        <a-empty v-if="!ocrDrafts.length" description="暂无待导入票据" />
      </div>
    </a-modal>

    <a-modal v-model:open="addVisible" title="手动添加 ETC 记录" ok-text="保存" cancel-text="取消" @ok="saveAdd" width="620px">
      <div class="add-form">
        <label><span>通行日期*</span><a-input v-model:value="addForm.date" placeholder="2026-06-30" /></label>
        <label><span>车牌号*</span><a-input v-model:value="addForm.vehiclePlate" /></label>
        <label><span>ETC 卡号</span><a-input v-model:value="addForm.etcCardNo" /></label>
        <label><span>车型</span>
          <a-select v-model:value="addForm.vehicleType" style="width:100%">
            <a-select-option v-for="t in vehicleTypeOptions" :key="t" :value="t">{{ t }}</a-select-option>
          </a-select>
        </label>
        <label><span>入口站</span><a-input v-model:value="addForm.entryStation" /></label>
        <label><span>出口站*</span><a-input v-model:value="addForm.exitStation" /></label>
        <label><span>入口时间</span><a-input v-model:value="addForm.entryTime" placeholder="2026-06-30 06:00" /></label>
        <label><span>出口时间</span><a-input v-model:value="addForm.exitTime" placeholder="2026-06-30 10:30" /></label>
        <label><span>里程(km)</span><a-input-number v-model:value="addForm.mileage" :min="0" style="width:100%" /></label>
        <label><span>实扣金额*</span><a-input-number v-model:value="addForm.amount" :min="0" style="width:100%" /></label>
        <label><span>发行方</span>
          <a-select v-model:value="addForm.provider" style="width:100%">
            <a-select-option v-for="p in providerOptions" :key="p.value" :value="p.value">{{ p.label }}</a-select-option>
          </a-select>
        </label>
        <label><span>司机</span><a-input v-model:value="addForm.driver" /></label>
        <label class="wide"><span>备注</span><a-input v-model:value="addForm.remark" /></label>
      </div>
    </a-modal>

    <ImportReviewModal
      v-model:open="tableImportVisible"
      title="导入 ETC 通行表格 · 审核后导入"
      :file-name="tableImportFileName"
      :columns="tableImportColumns"
      :sample-rows="tableImportRows"
      @confirm="confirmTableImport"
    />
    <ImportSourceModal v-model:open="importSourceVisible" entity="ETC 费用" receipt-hint="识别通行费发票、ETC 小票或对账 PDF" @select="selectImportSource" />
  </section>
</template>

<style scoped>
.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}
.page-toolbar h2 {
  margin: 0;
  font-size: 18px;
}
.page-toolbar > div > span {
  color: #64748b;
  font-size: 12px;
}
.hidden-file-input { display: none; }
.toolbar-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  white-space: nowrap;
}
.etc-fetch-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 9px 12px;
  border: 1px solid #ddd6fe;
  background: #faf8ff;
  border-radius: 8px;
  color: #5b4a9a;
  font-size: 12px;
}
.etc-fetch-bar :deep(.anticon) { font-size: 15px; }
.etc-fetch-bar > span:first-of-type { margin-right: auto; }
.etc-fetch-switch-label { color: #6b5f90; }
.etc-filter {
  grid-template-columns: 220px minmax(220px, 1fr) 140px 140px;
}
.batch-bar {
  position: sticky;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 10px 16px;
  background: #08090c;
  color: #fff;
  border-radius: 8px;
}
.batch-bar span {
  margin-right: auto;
}
.viewer {
  display: flex;
  align-items: center;
  gap: 12px;
}
.viewer img {
  flex: 1;
  max-height: 420px;
  object-fit: contain;
  border-radius: 8px;
}
.viewer-idx {
  text-align: center;
  margin: 8px 0 0;
  color: #6b5f70;
}
/* 上游抓取 */
.fetch-lead { margin: 0 0 14px; color: #64748b; font-size: 13px; }
.fetch-note { display: flex; gap: 7px; align-items: center; margin-top: 14px; padding: 9px 10px; background: #f8fafc; color: #64748b; font-size: 12px; border-radius: 6px; }
.fetch-loading { min-height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #64748b; }
.fetch-loading :deep(.anticon) { font-size: 30px; color: #7c3aed; }
.fetch-result { max-height: 62vh; overflow-y: auto; }
.fetch-summary { display: flex; align-items: center; gap: 10px; padding: 10px 12px; margin-bottom: 12px; border: 1px solid #ddd6fe; background: #faf8ff; border-radius: 9px; }
.fetch-summary :deep(.anticon) { color: #7c3aed; font-size: 22px; }
.fetch-summary div:first-of-type { flex: 1; }
.fetch-summary strong, .fetch-summary span { display: block; }
.fetch-summary span { color: #64748b; font-size: 12px; margin-top: 3px; }
.fetch-summary-state { display: flex; gap: 6px; }
.fetch-list { display: flex; flex-direction: column; gap: 10px; width: 100%; }
.fetch-item { display: grid; grid-template-columns: 24px 190px 1fr 96px; gap: 12px; align-items: start; padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; }
.fetch-item.invalid { background: #fff7f7; border-color: #fecaca; }
.fetch-item.duplicated { background: #f8fafc; opacity: .68; }
.fetch-check { margin-top: 6px; }
.fetch-route { display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
.fetch-route b { font-size: 13px; }
.fetch-route span { color: #475569; }
.fetch-route em { color: #94a3b8; font-style: normal; font-size: 11px; }
.fetch-state { align-self: center; }
.fetch-fields { align-content: start; }
.fetch-footer-hint { float: left; margin-top: 6px; color: #94a3b8; font-size: 12px; }
/* 票据识别导入 */
.import-image { display: flex; flex-direction: column; gap: 6px; align-items: center; }
.import-image img { width: 100%; max-height: 200px; object-fit: contain; border: 1px solid #e5e7eb; border-radius: 8px; }
.import-image span { color: #6b5f70; font-size: 12px; }
.batch-import { max-height: 62vh; overflow-y: auto; }
.batch-import-tip { margin: 0 0 12px; color: #6b5f70; font-size: 13px; }
.batch-import-list { display: flex; flex-direction: column; gap: 12px; width: 100%; }
.batch-import-item { display: grid; grid-template-columns: 24px 200px 1fr auto; gap: 12px; align-items: start; padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fbfbfb; }
.batch-import-check { margin-top: 6px; }
.batch-import-remove { align-self: center; }
.import-fields { align-content: start; }
.add-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.add-form label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}
.add-form label.wide {
  grid-column: 1 / -1;
}
@media (max-width: 900px) {
  .etc-filter { grid-template-columns: 1fr; }
}
</style>
