<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { DownloadOutlined, ImportOutlined, PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined, PictureOutlined, FileImageOutlined } from '@ant-design/icons-vue';
import { Modal, message } from 'ant-design-vue';
import type { RecordDataSource, TirePosition, TireRecord } from './types';
import { expenseImages } from './data';

const positionLabels: Record<string, string> = { FL: '前左', FR: '前右', RL: '后左', RR: '后右', SPARE: '备胎' };
const positionOptions: { value: Exclude<TirePosition, null>; label: string }[] = [
  { value: 'FL', label: '前左' }, { value: 'FR', label: '前右' }, { value: 'RL', label: '后左' }, { value: 'RR', label: '后右' }, { value: 'SPARE', label: '备胎' }
];

function make(p: Partial<TireRecord>): TireRecord {
  const qty = p.quantity ?? 1;
  const unit = p.unitPrice ?? 0;
  return {
    id: p.id ?? `TR_${Math.round(Math.random() * 1e9)}`,
    dataSource: p.dataSource ?? 'manual',
    sourceRefId: p.sourceRefId ?? null,
    date: p.date ?? '2026-06-01',
    vendor: p.vendor ?? '',
    vehiclePlatePrefix: p.vehiclePlatePrefix ?? (p.vehiclePlate ?? '').slice(0, 2),
    vehiclePlate: p.vehiclePlate ?? '',
    tirePosition: p.tirePosition ?? null,
    quantity: qty,
    unitPrice: unit,
    totalAmount: p.totalAmount ?? qty * unit,
    tireNumber: p.tireNumber ?? null,
    remark: p.remark ?? '',
    receiptNo: p.receiptNo ?? null,
    images: p.images ?? [],
    paymentDate: p.paymentDate ?? null,
    paymentStatus: p.paymentStatus ?? '未付',
    tireNumberPending: p.tireNumberPending ?? p.tireNumber == null,
    createdAt: p.createdAt ?? '2026-06-28T09:15:00'
  };
}

const seed: Partial<TireRecord>[] = [
  // 付款明细同步 5 条
  { id: 'TR_001', dataSource: 'payment_sync', sourceRefId: 'PAY_20260627_015', date: '2026-06-27', vendor: '任正勇', vehiclePlate: '赣J05550D', tirePosition: 'FL', quantity: 1, unitPrice: 950, totalAmount: 1050, remark: '换一条新胎950元，急救费100元，共1050元', paymentStatus: '财务已付款', paymentDate: '2026-06-28' },
  { id: 'TR_002', dataSource: 'payment_sync', sourceRefId: 'PAY_20260626_011', date: '2026-06-26', vendor: '李师傅', vehiclePlate: '赣J05521D', tirePosition: 'FR', quantity: 1, unitPrice: 920, totalAmount: 920, paymentStatus: '财务已付款', paymentDate: '2026-06-27' },
  { id: 'TR_003', dataSource: 'payment_sync', sourceRefId: 'PAY_20260625_009', date: '2026-06-25', vendor: '鑫源轮胎', vehiclePlate: '赣J05533D', tirePosition: 'RL', quantity: 2, unitPrice: 900, totalAmount: 1800, paymentStatus: '已付', paymentDate: '2026-06-26' },
  { id: 'TR_004', dataSource: 'payment_sync', sourceRefId: 'PAY_20260624_007', date: '2026-06-24', vendor: '任正勇', vehiclePlate: '赣J05540D', tirePosition: 'RR', quantity: 1, unitPrice: 980, totalAmount: 980, paymentStatus: '已付', paymentDate: '2026-06-25' },
  { id: 'TR_005', dataSource: 'payment_sync', sourceRefId: 'PAY_20260623_005', date: '2026-06-23', vendor: '李师傅', vehiclePlate: '赣J05551D', tirePosition: 'FL', quantity: 1, unitPrice: 950, totalAmount: 1050, paymentStatus: '未付' },
  // 司机群拍照上报 3 条（部分缺轮胎编号）
  { id: 'TR_006', dataSource: 'wechat_robot', date: '2026-06-22', vendor: '路边轮胎店', vehiclePlate: '赣J05562D', tirePosition: 'FR', quantity: 1, unitPrice: 940, totalAmount: 940, tireNumber: null, images: [expenseImages[1]], paymentStatus: '未付' },
  { id: 'TR_007', dataSource: 'wechat_robot', date: '2026-06-21', vendor: '路边轮胎店', vehiclePlate: '赣J05573D', tirePosition: 'RL', quantity: 2, unitPrice: 910, totalAmount: 1820, tireNumber: null, images: [expenseImages[2]], paymentStatus: '未付' },
  { id: 'TR_008', dataSource: 'wechat_robot', date: '2026-06-20', vendor: '鑫源轮胎', vehiclePlate: '赣J05584D', tirePosition: 'RR', quantity: 1, unitPrice: 960, totalAmount: 960, tireNumber: 'LT20260620A', images: [expenseImages[3]], paymentStatus: '已付', paymentDate: '2026-06-21' },
  // 手动添加 2 条
  { id: 'TR_009', dataSource: 'manual', date: '2026-06-19', vendor: '任正勇', vehiclePlate: '赣J05595D', tirePosition: 'FL', quantity: 1, unitPrice: 950, totalAmount: 950, tireNumber: 'LT20260619B', receiptNo: 'SJ-0619', paymentStatus: '已付', paymentDate: '2026-06-20' },
  { id: 'TR_010', dataSource: 'manual', date: '2026-06-18', vendor: '鑫源轮胎', vehiclePlate: '赣J05506D', tirePosition: 'SPARE', quantity: 1, unitPrice: 1000, totalAmount: 1000, tireNumber: 'LT20260618C', receiptNo: 'SJ-0618', paymentStatus: '已付', paymentDate: '2026-06-19' }
];

const records = ref<TireRecord[]>(seed.map(make));

const dateRange = ref<string[]>([]);
const keyword = ref('');
const posFilter = ref<'全部' | Exclude<TirePosition, null>>('全部');
const payFilter = ref<'全部' | '已付' | '未付'>('全部');
const selectedRowKeys = ref<string[]>([]);
const editingId = ref('');
const editDraft = reactive<Record<string, any>>({});

const filtered = computed(() =>
  records.value.filter((r) => {
    const inDate = dateRange.value.length !== 2 || (r.date >= dateRange.value[0] && r.date <= dateRange.value[1]);
    const kw = keyword.value.trim();
    const inKw = !kw || [r.vendor, r.vehiclePlate, r.tireNumber ?? '', r.remark].some((v) => (v ?? '').includes(kw));
    const inPos = posFilter.value === '全部' || r.tirePosition === posFilter.value;
    const paid = r.paymentStatus === '已付' || r.paymentStatus === '财务已付款';
    const inPay = payFilter.value === '全部' || (payFilter.value === '已付' ? paid : !paid);
    return inDate && inKw && inPos && inPay;
  })
);

const stats = computed(() => {
  const rows = filtered.value;
  const totalQty = rows.reduce((s, r) => s + r.quantity, 0);
  const total = rows.reduce((s, r) => s + r.totalAmount, 0);
  const monthAmount = rows.filter((r) => r.date.startsWith('2026-06')).reduce((s, r) => s + r.totalAmount, 0);
  const unpaid = rows.filter((r) => r.paymentStatus === '未付').length;
  return {
    totalQty,
    total,
    avgPerTire: totalQty ? Math.round(total / totalQty) : 0,
    monthAmount,
    unpaid
  };
});

const columns = [
  { title: '日期', dataIndex: 'date', width: 96, sorter: (a: TireRecord, b: TireRecord) => a.date.localeCompare(b.date) },
  { title: '维修厂家', dataIndex: 'vendor', width: 110 },
  { title: '车头牌照', dataIndex: 'vehiclePlatePrefix', width: 88 },
  { title: '车牌号', dataIndex: 'vehiclePlate', width: 116 },
  { title: '轮胎位置', dataIndex: 'tirePosition', width: 88 },
  { title: '数量', dataIndex: 'quantity', width: 72, sorter: (a: TireRecord, b: TireRecord) => a.quantity - b.quantity },
  { title: '单价', dataIndex: 'unitPrice', width: 96, sorter: (a: TireRecord, b: TireRecord) => a.unitPrice - b.unitPrice },
  { title: '费用', dataIndex: 'totalAmount', width: 104, sorter: (a: TireRecord, b: TireRecord) => a.totalAmount - b.totalAmount },
  { title: '轮胎号', dataIndex: 'tireNumber', width: 130 },
  { title: '备注', dataIndex: 'remark', width: 200 },
  { title: '收据编号', dataIndex: 'receiptNo', width: 100 },
  { title: '凭证', dataIndex: 'images', width: 72 },
  { title: '付款日期', dataIndex: 'paymentDate', width: 100, sorter: (a: TireRecord, b: TireRecord) => (a.paymentDate ?? '').localeCompare(b.paymentDate ?? '') },
  { title: '付款状态', dataIndex: 'paymentStatus', width: 108 },
  { title: '操作', dataIndex: 'action', fixed: 'right', width: 180 }
];

function dt(v: string) {
  const [, m, d] = v.split('-');
  return `${Number(m)}月${Number(d)}日`;
}
function startEdit(r: TireRecord) {
  editingId.value = r.id;
  Object.assign(editDraft, r);
}
function cancelEdit() {
  editingId.value = '';
}
function saveEdit(r: TireRecord) {
  r.date = editDraft.date ?? r.date;
  r.vendor = editDraft.vendor ?? r.vendor;
  r.vehiclePlate = editDraft.vehiclePlate ?? r.vehiclePlate;
  r.vehiclePlatePrefix = r.vehiclePlate.slice(0, 2);
  if (editDraft.tirePosition !== undefined) r.tirePosition = editDraft.tirePosition;
  r.quantity = Number(editDraft.quantity) || 1;
  r.unitPrice = Number(editDraft.unitPrice) || 0;
  // 修改数量或单价 → 自动重算费用
  r.totalAmount = Number(editDraft.totalAmount) || r.quantity * r.unitPrice;
  const tn = (editDraft.tireNumber ?? '').toString().trim();
  r.tireNumber = tn || null;
  r.tireNumberPending = !r.tireNumber; // 补全后去除待补充标记
  r.remark = editDraft.remark ?? r.remark;
  r.receiptNo = editDraft.receiptNo || null;
  editingId.value = '';
  message.success('已保存');
}
// 编辑态下数量/单价变更实时联动费用
function syncFee() {
  editDraft.totalAmount = (Number(editDraft.quantity) || 0) * (Number(editDraft.unitPrice) || 0);
}
function removeRow(r: TireRecord) {
  Modal.confirm({
    title: '确认删除该条轮胎记录？删除后不可恢复。',
    okText: '删除', okType: 'danger', cancelText: '取消',
    onOk() {
      records.value = records.value.filter((x) => x.id !== r.id);
      selectedRowKeys.value = selectedRowKeys.value.filter((k) => k !== r.id);
      message.success('已删除');
    }
  });
}
function togglePaid(r: TireRecord) {
  if (r.paymentStatus === '未付') {
    r.paymentStatus = '已付';
    r.paymentDate = '2026-06-30';
    message.success('已标记已付');
  } else {
    r.paymentStatus = '未付';
    r.paymentDate = null;
    message.success('已取消标记');
  }
}

const viewerVisible = ref(false);
const viewerImages = ref<string[]>([]);
const viewerIndex = ref(0);
function viewImages(r: TireRecord) {
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
    if (selectedRowKeys.value.includes(r.id) && r.paymentStatus === '未付') {
      r.paymentStatus = '已付';
      r.paymentDate = '2026-06-30';
    }
  });
  message.success('已批量标记已付');
}
function exportRows() {
  message.success(`已导出 ${filtered.value.length} 条轮胎记录（Demo 模拟）`);
}
function importTable() {
  message.info('导入轮胎费用表格，自动匹配列名（Demo 模拟）');
}
function importImage() {
  message.info('上传轮胎照片，OCR + 手工补充轮胎编号等（Demo 模拟）');
}

const addVisible = ref(false);
const addForm = reactive<Partial<TireRecord>>({});
function openAdd() {
  Object.assign(addForm, { date: '2026-06-30', vendor: '', vehiclePlate: '', tirePosition: null, quantity: 1, unitPrice: null, totalAmount: null, tireNumber: '', remark: '', receiptNo: '' });
  addVisible.value = true;
}
function saveAdd() {
  if (!addForm.date || !addForm.vehiclePlate || addForm.unitPrice == null) {
    message.warning('日期、车牌、单价为必填项');
    return;
  }
  records.value = [make({ ...addForm, dataSource: 'manual', id: `TR_${Math.round(Math.random() * 1e9)}` }), ...records.value];
  addVisible.value = false;
  message.success('已添加');
}
</script>

<template>
  <section class="content list-screen tire-page">
    <div class="page-toolbar">
      <h2>轮胎费用</h2>
      <div class="toolbar-actions">
        <a-button @click="importTable"><template #icon><ImportOutlined /></template>导入表格</a-button>
        <a-button @click="importImage"><template #icon><FileImageOutlined /></template>图片录入</a-button>
        <a-button @click="openAdd"><template #icon><PlusOutlined /></template>手动添加</a-button>
        <a-button @click="exportRows"><template #icon><DownloadOutlined /></template>导出</a-button>
      </div>
    </div>

    <div class="metric-grid five">
      <div class="metric-card"><span>总更换条数</span><strong>{{ stats.totalQty }}</strong></div>
      <div class="metric-card"><span>总费用</span><strong>¥{{ stats.total.toLocaleString() }}</strong></div>
      <div class="metric-card"><span>单胎均价</span><strong>¥{{ stats.avgPerTire.toLocaleString() }}</strong></div>
      <div class="metric-card"><span>本月费用</span><strong>¥{{ stats.monthAmount.toLocaleString() }}</strong></div>
      <div class="metric-card orange"><span>待付款笔数</span><strong>{{ stats.unpaid }}</strong></div>
    </div>

    <div class="filter-bar tire-filter">
      <a-range-picker v-model:value="dateRange" value-format="YYYY-MM-DD" />
      <a-input v-model:value="keyword" placeholder="搜索维修厂家、车牌号、轮胎号、备注..." allow-clear>
        <template #prefix><SearchOutlined /></template>
      </a-input>
      <a-select v-model:value="posFilter" style="width: 100%">
        <a-select-option value="全部">全部位置</a-select-option>
        <a-select-option v-for="p in positionOptions" :key="p.value" :value="p.value">{{ p.label }}</a-select-option>
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
      :scroll="{ x: 1760 }"
      row-key="id"
      class="dense-table"
      :row-selection="{ selectedRowKeys, onChange: (keys: any) => (selectedRowKeys = keys) }"
    >
      <template #emptyText><a-empty description="暂无轮胎数据" /></template>
      <template #bodyCell="{ column, record }">
        <template v-if="editingId === record.id && ['date','vendor','vehiclePlate','tireNumber','remark','receiptNo'].includes(column.dataIndex)">
          <a-input v-model:value="editDraft[column.dataIndex]" size="small" />
        </template>
        <template v-else-if="editingId === record.id && column.dataIndex === 'tirePosition'">
          <a-select v-model:value="editDraft.tirePosition" size="small" style="width: 80px">
            <a-select-option v-for="p in positionOptions" :key="p.value" :value="p.value">{{ p.label }}</a-select-option>
          </a-select>
        </template>
        <template v-else-if="editingId === record.id && column.dataIndex === 'quantity'">
          <a-input-number v-model:value="editDraft.quantity" size="small" :min="1" style="width: 64px" @change="syncFee" />
        </template>
        <template v-else-if="editingId === record.id && column.dataIndex === 'unitPrice'">
          <a-input-number v-model:value="editDraft.unitPrice" size="small" :min="0" style="width: 84px" @change="syncFee" />
        </template>
        <template v-else-if="editingId === record.id && column.dataIndex === 'totalAmount'">
          <a-input-number v-model:value="editDraft.totalAmount" size="small" :min="0" style="width: 92px" />
        </template>
        <template v-else-if="column.dataIndex === 'date'">{{ dt(record.date) }}</template>
        <template v-else-if="column.dataIndex === 'tirePosition'">{{ record.tirePosition ? positionLabels[record.tirePosition] : '—' }}</template>
        <template v-else-if="column.dataIndex === 'unitPrice' || column.dataIndex === 'totalAmount'">¥{{ record[column.dataIndex].toFixed(2) }}</template>
        <template v-else-if="column.dataIndex === 'tireNumber'">
          <span v-if="record.tireNumber">{{ record.tireNumber }}</span>
          <a-tag v-else color="orange">待补充</a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'receiptNo'">{{ record.receiptNo || '—' }}</template>
        <template v-else-if="column.dataIndex === 'paymentDate'">{{ record.paymentDate ? dt(record.paymentDate) : '—' }}</template>
        <template v-else-if="column.dataIndex === 'images'">
          <a-button size="small" :disabled="!record.images.length" @click="viewImages(record)"><template #icon><PictureOutlined /></template></a-button>
        </template>
        <template v-else-if="column.dataIndex === 'paymentStatus'">
          <a-tag :color="record.paymentStatus === '未付' ? 'orange' : 'green'">{{ record.paymentStatus }}</a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'action'">
          <template v-if="editingId === record.id">
            <a-button size="small" type="primary" @click="saveEdit(record)">保存</a-button>
            <a-button size="small" @click="cancelEdit">取消</a-button>
          </template>
          <template v-else>
            <a-button size="small" @click="startEdit(record)"><template #icon><EditOutlined /></template></a-button>
            <a-button size="small" danger @click="removeRow(record)"><template #icon><DeleteOutlined /></template></a-button>
            <a-button size="small" type="primary" ghost @click="togglePaid(record)">{{ record.paymentStatus === '未付' ? '标记已付' : '取消标记' }}</a-button>
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

    <a-modal v-model:open="viewerVisible" title="轮胎凭证" :footer="null" width="640px">
      <div class="viewer">
        <a-button :disabled="viewerIndex === 0" @click="viewerIndex--">上一张</a-button>
        <img :src="viewerImages[viewerIndex]" alt="轮胎凭证" />
        <a-button :disabled="viewerIndex >= viewerImages.length - 1" @click="viewerIndex++">下一张</a-button>
      </div>
      <p class="viewer-idx">{{ viewerIndex + 1 }} / {{ viewerImages.length }}</p>
    </a-modal>

    <a-modal v-model:open="addVisible" title="手动添加轮胎记录" ok-text="保存" cancel-text="取消" @ok="saveAdd" width="560px">
      <div class="add-form">
        <label><span>日期*</span><a-input v-model:value="addForm.date" placeholder="2026-06-30" /></label>
        <label><span>维修厂家</span><a-input v-model:value="addForm.vendor" /></label>
        <label><span>车牌号*</span><a-input v-model:value="addForm.vehiclePlate" /></label>
        <label><span>轮胎位置</span>
          <a-select v-model:value="addForm.tirePosition" allow-clear style="width:100%">
            <a-select-option v-for="p in positionOptions" :key="p.value" :value="p.value">{{ p.label }}</a-select-option>
          </a-select>
        </label>
        <label><span>数量</span><a-input-number v-model:value="addForm.quantity" :min="1" style="width:100%" /></label>
        <label><span>单价*</span><a-input-number v-model:value="addForm.unitPrice" :min="0" style="width:100%" /></label>
        <label><span>费用(可选)</span><a-input-number v-model:value="addForm.totalAmount" :min="0" style="width:100%" placeholder="留空按 数量×单价" /></label>
        <label><span>轮胎号</span><a-input v-model:value="addForm.tireNumber" placeholder="留空标记待补充" /></label>
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
  flex-wrap: wrap;
}
.tire-filter {
  grid-template-columns: 260px minmax(240px, 1fr) 150px 150px;
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
</style>
