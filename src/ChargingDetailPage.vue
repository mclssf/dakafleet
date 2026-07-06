<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { DownloadOutlined, ImportOutlined, PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons-vue';
import { Modal, message } from 'ant-design-vue';
import type { ChargingRecord, RecordDataSource } from './types';

const DEFAULT_CAPACITY = 430;

const sourceLabels: Record<RecordDataSource, string> = {
  payment_sync: '付款明细同步',
  upstream_import: '上游系统导入',
  manual: '手动添加',
  wechat_robot: '微信机器人',
  table_import: '表格导入',
  image_ocr: '图片识别'
};

// 计算衍生字段（正常电数、电量差异、单价、电量差异占比）
function recompute(r: ChargingRecord) {
  const complete = r.startSOC != null && r.endSOC != null && r.chargingKwh != null;
  r.isComplete = complete;
  if (!complete) {
    r.normalKwh = null;
    r.kwhDiff = null;
    r.unitPrice = null;
    r.diffRatioPercent = null;
    return;
  }
  const cap = r.batteryCapacity || DEFAULT_CAPACITY;
  r.normalKwh = Number((((r.endSOC! - r.startSOC!) / 100) * cap).toFixed(2));
  r.kwhDiff = Number(((r.chargingKwh as number) - r.normalKwh).toFixed(2));
  r.unitPrice = r.chargingKwh ? Number(((r.totalAmount ?? 0) / r.chargingKwh).toFixed(2)) : null;
  r.diffRatioPercent = r.chargingKwh ? Number((((r.kwhDiff as number) / r.chargingKwh) * 100).toFixed(2)) : null;
}

function make(partial: Partial<ChargingRecord>): ChargingRecord {
  const r: ChargingRecord = {
    id: partial.id ?? `CR_${Math.round(Math.random() * 1e9)}`,
    dataSource: partial.dataSource ?? 'manual',
    sourceRefId: partial.sourceRefId ?? null,
    date: partial.date ?? '2026-06-01',
    vehiclePlate: partial.vehiclePlate ?? '',
    startSOC: partial.startSOC ?? null,
    endSOC: partial.endSOC ?? null,
    chargingKwh: partial.chargingKwh ?? null,
    normalKwh: null,
    batteryCapacity: partial.batteryCapacity ?? DEFAULT_CAPACITY,
    kwhDiff: null,
    diffRatioPercent: null,
    startTime: partial.startTime ?? null,
    endTime: partial.endTime ?? null,
    unitPrice: null,
    serviceFee: partial.serviceFee ?? null,
    topUpAmount: partial.topUpAmount ?? null,
    totalAmount: partial.totalAmount ?? null,
    balance: partial.balance ?? null,
    odometer: partial.odometer ?? null,
    chargingStation: partial.chargingStation ?? '',
    remark: partial.remark ?? '',
    isComplete: true,
    status: 'active',
    createdAt: partial.createdAt ?? '2026-06-14T08:30:00'
  };
  recompute(r);
  return r;
}

const seed: Partial<ChargingRecord>[] = [
  { id: 'CR_001', dataSource: 'upstream_import', date: '2026-06-13', vehiclePlate: '粤B4147D', startSOC: 29, endSOC: 98, chargingKwh: 271.14, totalAmount: 12964.7, serviceFee: 67.78, topUpAmount: 211.38, chargingStation: '广福铺光大车营量充电站', batteryCapacity: 430 },
  { id: 'CR_002', dataSource: 'upstream_import', date: '2026-06-14', vehiclePlate: '粤B4152D', startSOC: 18, endSOC: 96, chargingKwh: 334.2, totalAmount: 261.0, serviceFee: 40.1, chargingStation: '沙井高速充电站', batteryCapacity: 430 },
  { id: 'CR_003', dataSource: 'upstream_import', date: '2026-06-15', vehiclePlate: '粤B4163D', startSOC: 35, endSOC: 90, chargingKwh: 285.5, totalAmount: 222.7, serviceFee: 35.0, chargingStation: '龙华服务区充电站', batteryCapacity: 430 },
  { id: 'CR_004', dataSource: 'upstream_import', date: '2026-06-16', vehiclePlate: '粤B4147D', startSOC: 22, endSOC: 88, chargingKwh: 310.6, totalAmount: 245.4, serviceFee: 38.5, chargingStation: '广福铺光大车营量充电站', batteryCapacity: 430 },
  { id: 'CR_005', dataSource: 'upstream_import', date: '2026-06-17', vehiclePlate: '粤B4171D', startSOC: 40, endSOC: 99, chargingKwh: 210.3, totalAmount: 168.2, serviceFee: 26.4, chargingStation: '观澜光大充电站', batteryCapacity: 430 },
  // 异常：占比 > 10%
  { id: 'CR_006', dataSource: 'upstream_import', date: '2026-06-18', vehiclePlate: '粤B4152D', startSOC: 20, endSOC: 95, chargingKwh: 250.0, totalAmount: 196.0, serviceFee: 31.0, chargingStation: '沙井高速充电站', batteryCapacity: 430 },
  { id: 'CR_007', dataSource: 'upstream_import', date: '2026-06-19', vehiclePlate: '粤B4188D', startSOC: 30, endSOC: 92, chargingKwh: 330.0, totalAmount: 258.0, serviceFee: 40.0, chargingStation: '福永充电站', batteryCapacity: 430 },
  // 异常：占比 5%~10%
  { id: 'CR_008', dataSource: 'upstream_import', date: '2026-06-20', vehiclePlate: '粤B4163D', startSOC: 25, endSOC: 90, chargingKwh: 264.0, totalAmount: 208.0, serviceFee: 32.0, chargingStation: '龙华服务区充电站', batteryCapacity: 430 },
  { id: 'CR_009', dataSource: 'payment_sync', sourceRefId: 'EXP_20260621_012', date: '2026-06-21', vehiclePlate: '粤B4171D', startSOC: 33, endSOC: 89, chargingKwh: 253.0, totalAmount: 199.0, serviceFee: 30.0, chargingStation: '观澜光大充电站', batteryCapacity: 430 },
  { id: 'CR_010', dataSource: 'payment_sync', sourceRefId: 'EXP_20260622_020', date: '2026-06-22', vehiclePlate: '粤B4188D', startSOC: 28, endSOC: 91, chargingKwh: 275.0, totalAmount: 216.0, serviceFee: 34.0, chargingStation: '福永充电站', batteryCapacity: 430 },
  // 付款明细同步 - 数据不完整（缺 SOC）
  { id: 'CR_011', dataSource: 'payment_sync', sourceRefId: 'EXP_20260623_031', date: '2026-06-23', vehiclePlate: '粤B4147D', totalAmount: 320.0, chargingStation: '补电费同步', remark: '补电费 320 元' },
  { id: 'CR_012', dataSource: 'payment_sync', sourceRefId: 'EXP_20260624_033', date: '2026-06-24', vehiclePlate: '粤B4152D', totalAmount: 280.0, chargingStation: '补电费同步', remark: '充电 280 元' },
  { id: 'CR_013', dataSource: 'payment_sync', sourceRefId: 'EXP_20260625_040', date: '2026-06-25', vehiclePlate: '粤B4163D', totalAmount: 265.0, chargingStation: '电费同步', remark: '电费 265 元' },
  // 手动添加
  { id: 'CR_014', dataSource: 'manual', date: '2026-06-26', vehiclePlate: '粤B4171D', startSOC: 26, endSOC: 93, chargingKwh: 288.1, totalAmount: 226.0, serviceFee: 35.0, chargingStation: '观澜光大充电站', batteryCapacity: 430 },
  { id: 'CR_015', dataSource: 'manual', date: '2026-06-27', vehiclePlate: '粤B4188D', startSOC: 31, endSOC: 97, chargingKwh: 283.8, totalAmount: 223.0, serviceFee: 34.0, chargingStation: '福永充电站', batteryCapacity: 430 }
];

const records = ref<ChargingRecord[]>(seed.map(make));

const dateRange = ref<string[]>([]);
const keyword = ref('');
const sourceFilter = ref<'全部' | RecordDataSource>('全部');
const selectedRowKeys = ref<string[]>([]);
const editingId = ref('');
const editDraft = reactive<Record<string, any>>({});

const filtered = computed(() =>
  records.value.filter((r) => {
    const inDate = dateRange.value.length !== 2 || (r.date >= dateRange.value[0] && r.date <= dateRange.value[1]);
    const kw = keyword.value.trim();
    const inKw = !kw || [r.vehiclePlate, r.chargingStation, r.remark].some((v) => (v ?? '').includes(kw));
    const inSource = sourceFilter.value === '全部' || r.dataSource === sourceFilter.value;
    return inDate && inKw && inSource;
  })
);

const stats = computed(() => {
  const rows = filtered.value;
  const totalKwh = rows.reduce((s, r) => s + (r.chargingKwh ?? 0), 0);
  const totalAmount = rows.reduce((s, r) => s + (r.totalAmount ?? 0), 0);
  const abnormal = rows.filter((r) => r.diffRatioPercent != null && Math.abs(r.diffRatioPercent) > 5).length;
  return {
    count: rows.length,
    totalKwh: totalKwh.toFixed(1),
    totalAmount,
    avgPrice: totalKwh ? (totalAmount / totalKwh).toFixed(2) : '—',
    abnormal
  };
});

const columns = [
  { title: '日期', dataIndex: 'date', width: 96, sorter: (a: ChargingRecord, b: ChargingRecord) => a.date.localeCompare(b.date) },
  { title: '车牌', dataIndex: 'vehiclePlate', width: 96 },
  { title: '开始SOC', dataIndex: 'startSOC', width: 88, sorter: (a: ChargingRecord, b: ChargingRecord) => (a.startSOC ?? 0) - (b.startSOC ?? 0) },
  { title: '结束SOC', dataIndex: 'endSOC', width: 88, sorter: (a: ChargingRecord, b: ChargingRecord) => (a.endSOC ?? 0) - (b.endSOC ?? 0) },
  { title: '充电度数', dataIndex: 'chargingKwh', width: 100, sorter: (a: ChargingRecord, b: ChargingRecord) => (a.chargingKwh ?? 0) - (b.chargingKwh ?? 0) },
  { title: '正常电数', dataIndex: 'normalKwh', width: 100 },
  { title: '电量差异', dataIndex: 'kwhDiff', width: 100, sorter: (a: ChargingRecord, b: ChargingRecord) => (a.kwhDiff ?? 0) - (b.kwhDiff ?? 0) },
  { title: '开始时间', dataIndex: 'startTime', width: 92 },
  { title: '结束时间', dataIndex: 'endTime', width: 92 },
  { title: '单价', dataIndex: 'unitPrice', width: 80 },
  { title: '服务费', dataIndex: 'serviceFee', width: 88 },
  { title: '充值', dataIndex: 'topUpAmount', width: 88 },
  { title: '充电金额', dataIndex: 'totalAmount', width: 104, sorter: (a: ChargingRecord, b: ChargingRecord) => (a.totalAmount ?? 0) - (b.totalAmount ?? 0) },
  { title: '余额', dataIndex: 'balance', width: 88 },
  { title: '公里数', dataIndex: 'odometer', width: 88 },
  { title: '充电地址', dataIndex: 'chargingStation', width: 180 },
  { title: '电量差异占比', dataIndex: 'diffRatioPercent', width: 118, sorter: (a: ChargingRecord, b: ChargingRecord) => (a.diffRatioPercent ?? 0) - (b.diffRatioPercent ?? 0) },
  { title: '备注', dataIndex: 'remark', width: 160 },
  { title: '操作', dataIndex: 'action', fixed: 'right', width: 150 }
];

function dt(v: string) {
  const [, m, d] = v.split('-');
  return `${Number(m)}月${Number(d)}日`;
}
function num(v: number | null, suffix = '') {
  return v == null ? '—' : `${v}${suffix}`;
}
function rowClassName(r: ChargingRecord) {
  if (!r.isComplete) return 'row-incomplete';
  const ratio = Math.abs(r.diffRatioPercent ?? 0);
  if (ratio > 10) return 'row-danger';
  if (ratio > 5) return 'row-warn';
  return '';
}

function startEdit(r: ChargingRecord) {
  editingId.value = r.id;
  Object.assign(editDraft, r);
}
function cancelEdit() {
  editingId.value = '';
}
function saveEdit(r: ChargingRecord) {
  const numFields: (keyof ChargingRecord)[] = ['startSOC', 'endSOC', 'chargingKwh', 'serviceFee', 'topUpAmount', 'totalAmount', 'balance', 'odometer'];
  numFields.forEach((k) => {
    const v = (editDraft as any)[k];
    (r as any)[k] = v === '' || v == null ? null : Number(v);
  });
  r.date = editDraft.date ?? r.date;
  r.vehiclePlate = editDraft.vehiclePlate ?? r.vehiclePlate;
  r.chargingStation = editDraft.chargingStation ?? r.chargingStation;
  r.remark = editDraft.remark ?? r.remark;
  recompute(r);
  editingId.value = '';
  message.success('已保存并重新计算');
}
function removeRow(r: ChargingRecord) {
  Modal.confirm({
    title: '确认删除该条充电记录？删除后不可恢复。',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      records.value = records.value.filter((x) => x.id !== r.id);
      selectedRowKeys.value = selectedRowKeys.value.filter((k) => k !== r.id);
      message.success('已删除');
    }
  });
}
function viewSource(r: ChargingRecord) {
  Modal.info({
    title: '数据来源',
    content: `来源类型：${sourceLabels[r.dataSource]}${r.sourceRefId ? `\n关联单据：${r.sourceRefId}` : ''}${r.dataSource === 'payment_sync' ? '\n来自付款明细同步记录' : ''}`
  });
}

function batchDelete() {
  if (!selectedRowKeys.value.length) return;
  Modal.confirm({
    title: `确认批量删除已选 ${selectedRowKeys.value.length} 条记录？`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      records.value = records.value.filter((x) => !selectedRowKeys.value.includes(x.id));
      selectedRowKeys.value = [];
      message.success('批量删除完成');
    }
  });
}
function exportRows() {
  message.success(`已导出 ${filtered.value.length} 条充电记录（Demo 模拟）`);
}
function importUpstream() {
  message.info('弹出文件选择，支持 .xlsx/.xls/.csv 上游系统表格导入（Demo 模拟）');
}

// 手动添加
const addVisible = ref(false);
const addForm = reactive<Partial<ChargingRecord>>({ batteryCapacity: DEFAULT_CAPACITY });
function openAdd() {
  Object.assign(addForm, { date: '2026-06-30', vehiclePlate: '', startSOC: null, endSOC: null, chargingKwh: null, serviceFee: null, topUpAmount: null, totalAmount: null, chargingStation: '', remark: '', batteryCapacity: DEFAULT_CAPACITY });
  addVisible.value = true;
}
function saveAdd() {
  if (!addForm.date || !addForm.vehiclePlate || addForm.chargingKwh == null) {
    message.warning('日期、车牌、充电度数为必填项');
    return;
  }
  records.value = [make({ ...addForm, dataSource: 'manual', id: `CR_${Math.round(Math.random() * 1e9)}` }), ...records.value];
  addVisible.value = false;
  message.success('已手动添加并自动计算衍生字段');
}
</script>

<template>
  <section class="content list-screen charging-page">
    <div class="page-toolbar">
      <h2>充电明细</h2>
      <div class="toolbar-actions">
        <a-button @click="importUpstream"><template #icon><ImportOutlined /></template>导入上游系统表格</a-button>
        <a-button @click="openAdd"><template #icon><PlusOutlined /></template>手动添加</a-button>
        <a-button @click="exportRows"><template #icon><DownloadOutlined /></template>导出</a-button>
      </div>
    </div>

    <div class="metric-grid five">
      <div class="metric-card"><span>总充电次数</span><strong>{{ stats.count }}</strong></div>
      <div class="metric-card"><span>总充电度数</span><strong>{{ stats.totalKwh }} kWh</strong></div>
      <div class="metric-card"><span>总充电金额</span><strong>¥{{ stats.totalAmount.toLocaleString() }}</strong></div>
      <div class="metric-card"><span>平均单价</span><strong>¥{{ stats.avgPrice }} 元/kWh</strong></div>
      <div class="metric-card orange"><span>异常电量笔数</span><strong>{{ stats.abnormal }}</strong></div>
    </div>

    <div class="filter-bar">
      <a-range-picker v-model:value="dateRange" value-format="YYYY-MM-DD" />
      <a-input v-model:value="keyword" placeholder="搜索车牌、加油站地址、备注..." allow-clear>
        <template #prefix><SearchOutlined /></template>
      </a-input>
      <a-select v-model:value="sourceFilter" style="width: 100%">
        <a-select-option value="全部">全部来源</a-select-option>
        <a-select-option value="payment_sync">付款明细同步</a-select-option>
        <a-select-option value="upstream_import">上游系统导入</a-select-option>
        <a-select-option value="manual">手动添加</a-select-option>
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
      :row-class-name="(record: ChargingRecord) => rowClassName(record)"
      :row-selection="{ selectedRowKeys, onChange: (keys: any) => (selectedRowKeys = keys) }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="editingId === record.id && ['date','vehiclePlate','startSOC','endSOC','chargingKwh','serviceFee','topUpAmount','totalAmount','balance','odometer','chargingStation','remark'].includes(column.dataIndex)">
          <a-input v-model:value="editDraft[column.dataIndex]" size="small" />
        </template>
        <template v-else-if="column.dataIndex === 'date'">{{ dt(record.date) }}</template>
        <template v-else-if="column.dataIndex === 'startSOC'">{{ num(record.startSOC, '%') }}</template>
        <template v-else-if="column.dataIndex === 'endSOC'">{{ num(record.endSOC, '%') }}</template>
        <template v-else-if="column.dataIndex === 'diffRatioPercent'">
          <span :class="{ 'blue-text': (record.kwhDiff ?? 0) < 0 }">{{ record.diffRatioPercent == null ? '—' : record.diffRatioPercent + '%' }}</span>
        </template>
        <template v-else-if="column.dataIndex === 'kwhDiff'">
          <span :class="{ 'blue-text': (record.kwhDiff ?? 0) < 0 }">{{ num(record.kwhDiff) }}</span>
        </template>
        <template v-else-if="['normalKwh','unitPrice','serviceFee','topUpAmount','totalAmount','balance','odometer','chargingKwh','startTime','endTime'].includes(column.dataIndex)">
          {{ num(record[column.dataIndex]) }}
        </template>
        <template v-else-if="column.dataIndex === 'action'">
          <template v-if="editingId === record.id">
            <a-button size="small" type="primary" @click="saveEdit(record)">保存</a-button>
            <a-button size="small" @click="cancelEdit">取消</a-button>
          </template>
          <template v-else>
            <a-button size="small" @click="startEdit(record)"><template #icon><EditOutlined /></template></a-button>
            <a-button size="small" danger @click="removeRow(record)"><template #icon><DeleteOutlined /></template></a-button>
            <a-button size="small" @click="viewSource(record)"><template #icon><EyeOutlined /></template></a-button>
          </template>
        </template>
      </template>
    </a-table>

    <div v-if="selectedRowKeys.length" class="batch-bar">
      <span>已选 {{ selectedRowKeys.length }} 条</span>
      <a-button size="small" danger @click="batchDelete">批量删除</a-button>
      <a-button size="small" @click="exportRows">批量导出</a-button>
    </div>

    <a-modal v-model:open="addVisible" title="手动添加充电记录" ok-text="保存" cancel-text="取消" @ok="saveAdd" width="560px">
      <div class="add-form">
        <label><span>日期*</span><a-input v-model:value="addForm.date" placeholder="2026-06-30" /></label>
        <label><span>车牌*</span><a-input v-model:value="addForm.vehiclePlate" placeholder="粤B4147D" /></label>
        <label><span>开始SOC(%)</span><a-input-number v-model:value="addForm.startSOC" :min="0" :max="100" style="width:100%" /></label>
        <label><span>结束SOC(%)</span><a-input-number v-model:value="addForm.endSOC" :min="0" :max="100" style="width:100%" /></label>
        <label><span>充电度数*</span><a-input-number v-model:value="addForm.chargingKwh" :min="0" style="width:100%" /></label>
        <label><span>电池容量(kWh)</span><a-input-number v-model:value="addForm.batteryCapacity" :min="0" style="width:100%" /></label>
        <label><span>服务费</span><a-input-number v-model:value="addForm.serviceFee" :min="0" style="width:100%" /></label>
        <label><span>充电金额</span><a-input-number v-model:value="addForm.totalAmount" :min="0" style="width:100%" /></label>
        <label class="wide"><span>充电地址</span><a-input v-model:value="addForm.chargingStation" /></label>
        <label class="wide"><span>备注</span><a-input v-model:value="addForm.remark" /></label>
      </div>
    </a-modal>
  </section>
</template>

<style scoped>
.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.page-toolbar h2 {
  margin: 0;
  font-size: 18px;
}
.toolbar-actions {
  display: flex;
  gap: 8px;
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
.blue-text {
  color: #2563eb;
  font-weight: 600;
}
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
:deep(.row-danger) > td {
  background: #fee2e2 !important;
}
:deep(.row-danger) td:nth-child(18) {
  color: #dc2626;
  font-weight: 700;
}
:deep(.row-warn) > td {
  background: #fef3c7 !important;
}
:deep(.row-warn) td:nth-child(18) {
  color: #ea580c;
  font-weight: 700;
}
:deep(.row-incomplete) > td {
  background: #f3f4f6 !important;
  color: #9ca3af;
}
</style>
