<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { DownloadOutlined, ImportOutlined, PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined, PictureOutlined, FileImageOutlined } from '@ant-design/icons-vue';
import { Modal, message } from 'ant-design-vue';
import type { MaintenanceCategory, MaintenanceRecord, RecordDataSource } from './types';
import { expenseImages } from './data';

const categoryOptions: MaintenanceCategory[] = ['维修费-轮胎', '维修费-底盘', '维修费-刹车', '维修费-货箱', '维修费-电路', '维修费-液压', '维修费-电焊', '维修费-大修', '维修费-施救', '维修费-耗材', '维修费-工时', '维修费-其他'];

// 根据内容关键词自动归类
const keywordMap: { cat: MaintenanceCategory; keys: string[] }[] = [
  { cat: '维修费-轮胎', keys: ['轮胎', '换胎', '补胎', '新胎', '急救胎'] },
  { cat: '维修费-底盘', keys: ['底盘', '大梁', '悬挂', '减震'] },
  { cat: '维修费-刹车', keys: ['刹车', '制动'] },
  { cat: '维修费-货箱', keys: ['货箱', '车厢', '栏板', '自卸'] },
  { cat: '维修费-电路', keys: ['电路', '线路', '电瓶', '发电机', '起动机'] },
  { cat: '维修费-液压', keys: ['液压', '油泵', '举升'] },
  { cat: '维修费-电焊', keys: ['电焊', '焊接', '切割', '加固'] },
  { cat: '维修费-大修', keys: ['大修', '发动机', '变速箱', '翻新'] },
  { cat: '维修费-施救', keys: ['施救', '拖车', '救援', '吊装'] },
  { cat: '维修费-耗材', keys: ['配件', '耗材', '润滑油', '滤芯', '黄油'] },
  { cat: '维修费-工时', keys: ['工时', '人工', '修理费'] }
];
function classify(text: string): MaintenanceCategory {
  for (const m of keywordMap) if (m.keys.some((k) => text.includes(k))) return m.cat;
  return '维修费-其他';
}

function make(p: Partial<MaintenanceRecord>): MaintenanceRecord {
  const description = p.description ?? '';
  return {
    id: p.id ?? `MT_${Math.round(Math.random() * 1e9)}`,
    dataSource: p.dataSource ?? 'manual',
    sourceRefId: p.sourceRefId ?? null,
    date: p.date ?? '2026-06-01',
    vendor: p.vendor ?? '',
    vehiclePlate: p.vehiclePlate ?? '',
    description,
    amount: p.amount ?? 0,
    paymentDate: p.paymentDate ?? null,
    remark: p.remark ?? '',
    period: p.period ?? `${Number((p.date ?? '2026-06-01').split('-')[1])}月`,
    category: p.category ?? classify(description),
    reviewStatus: p.reviewStatus ?? 'approved',
    images: p.images ?? [],
    createdAt: p.createdAt ?? '2026-06-26T10:00:00'
  };
}

const seed: Partial<MaintenanceRecord>[] = [
  { id: 'MT_001', dataSource: 'table_import', date: '2026-06-25', vendor: '高速汽配', vehiclePlate: '赣J0587D', description: '打黄油90元', amount: 90, images: [expenseImages[0]] },
  { id: 'MT_002', dataSource: 'table_import', date: '2026-06-24', vendor: '鑫源轮胎', vehiclePlate: '赣J0521D', description: '更换后左轮胎一条', amount: 950 },
  { id: 'MT_003', dataSource: 'payment_sync', sourceRefId: 'PAY_1001', date: '2026-06-23', vendor: '顺达底盘', vehiclePlate: '赣J0533D', description: '底盘大梁裂纹加固', amount: 1860, reviewStatus: 'pending', images: [expenseImages[1]] },
  { id: 'MT_004', dataSource: 'table_import', date: '2026-06-22', vendor: '安行刹车', vehiclePlate: '赣J0540D', description: '更换刹车片刹车盘', amount: 1280 },
  { id: 'MT_005', dataSource: 'table_import', date: '2026-06-21', vendor: '恒达货箱', vehiclePlate: '赣J0551D', description: '货箱栏板焊接修复', amount: 760, images: [expenseImages[2]] },
  { id: 'MT_006', dataSource: 'image_ocr', date: '2026-06-20', vendor: '光明电路', vehiclePlate: '赣J0562D', description: '更换发电机线路检修', amount: 2100, reviewStatus: 'pending', images: [expenseImages[3]] },
  { id: 'MT_007', dataSource: 'table_import', date: '2026-06-19', vendor: '力压液压', vehiclePlate: '赣J0573D', description: '自卸液压油泵维修', amount: 3400 },
  { id: 'MT_008', dataSource: 'table_import', date: '2026-06-18', vendor: '强焊电焊', vehiclePlate: '赣J0584D', description: '车架电焊加固', amount: 520 },
  { id: 'MT_009', dataSource: 'payment_sync', sourceRefId: 'PAY_1009', date: '2026-06-17', vendor: '大修厂', vehiclePlate: '赣J0595D', description: '发动机大修整机翻新', amount: 20960, reviewStatus: 'pending', images: [expenseImages[4]] },
  { id: 'MT_010', dataSource: 'table_import', date: '2026-06-16', vendor: '救援公司', vehiclePlate: '赣J0506D', description: '高速施救拖车', amount: 1500 },
  { id: 'MT_011', dataSource: 'table_import', date: '2026-06-15', vendor: '配件城', vehiclePlate: '赣J0517D', description: '更换滤芯润滑油耗材', amount: 380 },
  { id: 'MT_012', dataSource: 'table_import', date: '2026-06-14', vendor: '修理工', vehiclePlate: '赣J0528D', description: '维修工时人工费', amount: 600 },
  { id: 'MT_013', dataSource: 'table_import', date: '2026-06-13', vendor: '高速汽配', vehiclePlate: '赣J0539D', description: '补胎两条', amount: 160, images: [expenseImages[5]] },
  { id: 'MT_014', dataSource: 'table_import', date: '2026-06-12', vendor: '安行刹车', vehiclePlate: '赣J0540D', description: '刹车油更换', amount: 220 },
  { id: 'MT_015', dataSource: 'image_ocr', date: '2026-06-11', vendor: '顺达底盘', vehiclePlate: '赣J0551D', description: '悬挂减震器更换', amount: 1680, reviewStatus: 'pending', images: [expenseImages[6]] },
  { id: 'MT_016', dataSource: 'table_import', date: '2026-06-10', vendor: '恒达货箱', vehiclePlate: '赣J0562D', description: '自卸货箱液压维修', amount: 2600 },
  { id: 'MT_017', dataSource: 'table_import', date: '2026-06-09', vendor: '光明电路', vehiclePlate: '赣J0573D', description: '电瓶更换', amount: 680 },
  { id: 'MT_018', dataSource: 'table_import', date: '2026-06-08', vendor: '配件城', vehiclePlate: '赣J0584D', description: '配件耗材采购', amount: 430 },
  { id: 'MT_019', dataSource: 'table_import', date: '2026-06-07', vendor: '强焊电焊', vehiclePlate: '赣J0595D', description: '货箱切割加固', amount: 890 },
  { id: 'MT_020', dataSource: 'table_import', date: '2026-06-06', vendor: '鑫源轮胎', vehiclePlate: '赣J0506D', description: '新胎更换两条', amount: 1900, images: [expenseImages[0]] }
];

const records = ref<MaintenanceRecord[]>(seed.map(make));

const dateRange = ref<string[]>([]);
const keyword = ref('');
const catFilter = ref<'全部' | MaintenanceCategory>('全部');
const selectedRowKeys = ref<string[]>([]);
const editingId = ref('');
const editDraft = reactive<Record<string, any>>({});

const filtered = computed(() =>
  records.value.filter((r) => {
    const inDate = dateRange.value.length !== 2 || (r.date >= dateRange.value[0] && r.date <= dateRange.value[1]);
    const kw = keyword.value.trim();
    const inKw = !kw || [r.vendor, r.vehiclePlate, r.description, r.remark].some((v) => (v ?? '').includes(kw));
    const inCat = catFilter.value === '全部' || r.category === catFilter.value;
    return inDate && inKw && inCat;
  })
);

const stats = computed(() => {
  const rows = filtered.value;
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const amounts = rows.map((r) => r.amount);
  return {
    count: rows.length,
    total,
    monthAvg: rows.length ? Math.round(total / 30) : 0,
    maxSingle: amounts.length ? Math.max(...amounts) : 0,
    pending: rows.filter((r) => r.reviewStatus === 'pending').length
  };
});

const columns = [
  { title: '日期', dataIndex: 'date', width: 96, sorter: (a: MaintenanceRecord, b: MaintenanceRecord) => a.date.localeCompare(b.date) },
  { title: '对方账户', dataIndex: 'vendor', width: 120 },
  { title: '车牌号', dataIndex: 'vehiclePlate', width: 108 },
  { title: '内容', dataIndex: 'description', width: 200 },
  { title: '分类', dataIndex: 'category', width: 120 },
  { title: '支出金额', dataIndex: 'amount', width: 108, sorter: (a: MaintenanceRecord, b: MaintenanceRecord) => a.amount - b.amount },
  { title: '付款日期', dataIndex: 'paymentDate', width: 108, sorter: (a: MaintenanceRecord, b: MaintenanceRecord) => (a.paymentDate ?? '').localeCompare(b.paymentDate ?? '') },
  { title: '备注', dataIndex: 'remark', width: 140 },
  { title: '期间', dataIndex: 'period', width: 72 },
  { title: '审核', dataIndex: 'reviewStatus', width: 80 },
  { title: '凭证', dataIndex: 'images', width: 76 },
  { title: '操作', dataIndex: 'action', fixed: 'right', width: 150 }
];

function dt(v: string) {
  const [, m, d] = v.split('-');
  return `${Number(m)}月${Number(d)}日`;
}
function startEdit(r: MaintenanceRecord) {
  editingId.value = r.id;
  Object.assign(editDraft, r);
}
function cancelEdit() {
  editingId.value = '';
}
function saveEdit(r: MaintenanceRecord) {
  r.date = editDraft.date ?? r.date;
  r.vendor = editDraft.vendor ?? r.vendor;
  r.vehiclePlate = editDraft.vehiclePlate ?? r.vehiclePlate;
  r.description = editDraft.description ?? r.description;
  r.amount = Number(editDraft.amount) || 0;
  r.paymentDate = editDraft.paymentDate || null;
  r.remark = editDraft.remark ?? r.remark;
  if (editDraft.category) r.category = editDraft.category;
  r.period = `${Number(r.date.split('-')[1])}月`;
  editingId.value = '';
  message.success('已保存');
}
function removeRow(r: MaintenanceRecord) {
  Modal.confirm({
    title: '确认删除该条维修记录？删除后不可恢复。',
    okText: '删除', okType: 'danger', cancelText: '取消',
    onOk() {
      records.value = records.value.filter((x) => x.id !== r.id);
      selectedRowKeys.value = selectedRowKeys.value.filter((k) => k !== r.id);
      message.success('已删除');
    }
  });
}

// 凭证查看
const viewerVisible = ref(false);
const viewerImages = ref<string[]>([]);
const viewerIndex = ref(0);
function viewImages(r: MaintenanceRecord) {
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
function batchApprove() {
  records.value.forEach((r) => {
    if (selectedRowKeys.value.includes(r.id)) r.reviewStatus = 'approved';
  });
  message.success('已批量标记已审');
}
function exportRows() {
  message.success(`已导出 ${filtered.value.length} 条维修记录（Demo 模拟）`);
}
function importTable() {
  message.info('上传维修清单 Excel/CSV 导入，自动匹配列名（Demo 模拟）');
}
function importImage() {
  message.info('上传定点维修店照片/收据，OCR + 大模型识别提取字段（Demo 模拟）');
}

const addVisible = ref(false);
const addForm = reactive<Partial<MaintenanceRecord>>({});
function openAdd() {
  Object.assign(addForm, { date: '2026-06-30', vendor: '', vehiclePlate: '', description: '', amount: null, remark: '', category: undefined });
  addVisible.value = true;
}
function saveAdd() {
  if (!addForm.date || !addForm.vehiclePlate || !addForm.description || addForm.amount == null) {
    message.warning('日期、车牌、内容、支出金额为必填项');
    return;
  }
  records.value = [make({ ...addForm, dataSource: 'manual', id: `MT_${Math.round(Math.random() * 1e9)}` }), ...records.value];
  addVisible.value = false;
  message.success('已添加，分类自动归类');
}
</script>

<template>
  <section class="content list-screen maintenance-page">
    <div class="page-toolbar">
      <h2>维修费用</h2>
      <div class="toolbar-actions">
        <a-button @click="importTable"><template #icon><ImportOutlined /></template>导入定点维修表格</a-button>
        <a-button @click="importImage"><template #icon><FileImageOutlined /></template>导入图片识别</a-button>
        <a-button @click="openAdd"><template #icon><PlusOutlined /></template>手动添加</a-button>
        <a-button @click="exportRows"><template #icon><DownloadOutlined /></template>导出</a-button>
      </div>
    </div>

    <div class="metric-grid five">
      <div class="metric-card"><span>总维修次数</span><strong>{{ stats.count }}</strong></div>
      <div class="metric-card"><span>总支出金额</span><strong>¥{{ stats.total.toLocaleString() }}</strong></div>
      <div class="metric-card"><span>月度平均</span><strong>¥{{ stats.monthAvg.toLocaleString() }}</strong></div>
      <div class="metric-card"><span>最高单项</span><strong>¥{{ stats.maxSingle.toLocaleString() }}</strong></div>
      <div class="metric-card orange"><span>待审核笔数</span><strong>{{ stats.pending }}</strong></div>
    </div>

    <div class="filter-bar">
      <a-range-picker v-model:value="dateRange" value-format="YYYY-MM-DD" />
      <a-input v-model:value="keyword" placeholder="搜索对方账户、车牌号、内容、备注..." allow-clear>
        <template #prefix><SearchOutlined /></template>
      </a-input>
      <a-select v-model:value="catFilter" style="width: 100%">
        <a-select-option value="全部">全部分类</a-select-option>
        <a-select-option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</a-select-option>
      </a-select>
    </div>

    <a-table
      size="small"
      :columns="columns"
      :data-source="filtered"
      :pagination="{ pageSize: 10 }"
      :scroll="{ x: 1500 }"
      row-key="id"
      class="dense-table"
      :row-selection="{ selectedRowKeys, onChange: (keys: any) => (selectedRowKeys = keys) }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="editingId === record.id && ['date','vendor','vehiclePlate','description','amount','paymentDate','remark'].includes(column.dataIndex)">
          <a-input v-model:value="editDraft[column.dataIndex]" size="small" />
        </template>
        <template v-else-if="editingId === record.id && column.dataIndex === 'category'">
          <a-select v-model:value="editDraft.category" size="small" style="width: 110px">
            <a-select-option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</a-select-option>
          </a-select>
        </template>
        <template v-else-if="column.dataIndex === 'date'">{{ dt(record.date) }}</template>
        <template v-else-if="column.dataIndex === 'amount'">¥{{ record.amount.toFixed(2) }}</template>
        <template v-else-if="column.dataIndex === 'paymentDate'">{{ record.paymentDate ? dt(record.paymentDate) : '—' }}</template>
        <template v-else-if="column.dataIndex === 'category'"><a-tag color="geekblue">{{ record.category }}</a-tag></template>
        <template v-else-if="column.dataIndex === 'reviewStatus'">
          <a-tag :color="record.reviewStatus === 'approved' ? 'green' : 'orange'">{{ record.reviewStatus === 'approved' ? '已审' : '待审' }}</a-tag>
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
          </template>
        </template>
      </template>
    </a-table>

    <div v-if="selectedRowKeys.length" class="batch-bar">
      <span>已选 {{ selectedRowKeys.length }} 条</span>
      <a-button size="small" danger @click="batchDelete">批量删除</a-button>
      <a-button size="small" @click="exportRows">批量导出</a-button>
      <a-button size="small" @click="batchApprove">批量标记已审</a-button>
    </div>

    <a-modal v-model:open="viewerVisible" title="维修凭证" :footer="null" width="640px">
      <div class="viewer">
        <a-button :disabled="viewerIndex === 0" @click="viewerIndex--">上一张</a-button>
        <img :src="viewerImages[viewerIndex]" alt="维修凭证" />
        <a-button :disabled="viewerIndex >= viewerImages.length - 1" @click="viewerIndex++">下一张</a-button>
      </div>
      <p class="viewer-idx">{{ viewerIndex + 1 }} / {{ viewerImages.length }}</p>
    </a-modal>

    <a-modal v-model:open="addVisible" title="手动添加维修记录" ok-text="保存" cancel-text="取消" @ok="saveAdd" width="560px">
      <div class="add-form">
        <label><span>日期*</span><a-input v-model:value="addForm.date" placeholder="2026-06-30" /></label>
        <label><span>对方账户</span><a-input v-model:value="addForm.vendor" /></label>
        <label><span>车牌号*</span><a-input v-model:value="addForm.vehiclePlate" /></label>
        <label><span>支出金额*</span><a-input-number v-model:value="addForm.amount" :min="0" style="width:100%" /></label>
        <label class="wide"><span>内容*</span><a-input v-model:value="addForm.description" placeholder="维修事项描述，将自动归类" /></label>
        <label><span>分类(可选)</span>
          <a-select v-model:value="addForm.category" allow-clear style="width:100%" placeholder="留空自动归类">
            <a-select-option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</a-select-option>
          </a-select>
        </label>
        <label><span>备注</span><a-input v-model:value="addForm.remark" /></label>
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
