<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  AuditOutlined,
  CheckOutlined,
  EditOutlined,
  FileImageOutlined,
  FileSearchOutlined,
  PlusOutlined,
  RightOutlined,
  SearchOutlined,
  SendOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { expenseImages } from './data';
import {
  auditTrip,
  submitTrip,
  tripExpenseTotal,
  tripRecords,
  type TripExpenseRecord,
  type TripReviewStatus
} from './operationsStore';

const props = defineProps<{ projectId: string }>();
const emit = defineEmits<{ (event: 'open-audit'): void }>();

const keyword = ref('');
const dateRange = ref<string[]>([]);
const statusFilter = ref<'全部' | TripReviewStatus>('全部');
const expenseVisible = ref(false);
const documentVisible = ref(false);
const ocrVisible = ref(false);
const selectedTrip = ref<TripExpenseRecord | null>(null);
const uploadInput = ref<HTMLInputElement | null>(null);
const uploadedImages = ref<string[]>([]);
const expenseDraft = reactive<Record<string, number>>({
  fuelAmount: 0,
  etcAmount: 0,
  driverPay: 0,
  parkingAmount: 0,
  lodgingAmount: 0,
  livingAmount: 0,
  upstreamFreight: 0,
  advanceAmount: 0
});
const documentDraft = reactive({
  waybillNo: '',
  weighbillNo: '',
  loadingTime: '2026-08-27 08:00',
  unloadingTime: '2026-08-27 18:00',
  goods: '',
  weight: 0,
  mileage: 0
});

const rows = computed(() =>
  tripRecords.value.filter((row) => {
    const matchStatus = statusFilter.value === '全部' || row.status === statusFilter.value;
    const term = keyword.value.trim();
    const matchKeyword = !term || [row.id, row.vehiclePlate, row.driver, row.route, row.customer, row.goods].some((value) => value.includes(term));
    const matchDate = !dateRange.value.length || (!dateRange.value[0] || row.startTime.slice(0, 10) >= dateRange.value[0]) && (!dateRange.value[1] || row.startTime.slice(0, 10) <= dateRange.value[1]);
    return row.projectId === props.projectId && row.status === '已审核' && matchStatus && matchKeyword && matchDate;
  })
);

const stats = computed(() => {
  const total = rows.value.reduce((sum, row) => sum + tripExpenseTotal(row), 0);
  const driverPay = rows.value.reduce((sum, row) => sum + row.driverPay + row.parkingAmount + row.lodgingAmount + row.livingAmount, 0);
  const enterprisePay = rows.value.reduce((sum, row) => sum + row.fuelAmount + row.etcAmount + row.upstreamFreight, 0);
  const advance = rows.value.reduce((sum, row) => sum + row.advanceAmount, 0);
  const receivable = rows.value.reduce((sum, row) => sum + row.receivableAmount, 0);
  return { total, driverPay, enterprisePay, advance, receivable };
});

const columns = [
  { title: '出车单号', dataIndex: 'id', width: 168 },
  { title: '状态', dataIndex: 'status', width: 94 },
  { title: '车牌 / 司机', dataIndex: 'vehicle', width: 150 },
  { title: '线路', dataIndex: 'route', width: 220 },
  { title: '起止里程', dataIndex: 'mileage', width: 138 },
  { title: '驾驶时段', dataIndex: 'time', width: 190 },
  { title: '关联单据', dataIndex: 'documents', width: 128 },
  { title: '加油气', dataIndex: 'fuelAmount', width: 100 },
  { title: 'ETC', dataIndex: 'etcAmount', width: 88 },
  { title: '司机应付', dataIndex: 'driverPay', width: 102 },
  { title: '企业应付', dataIndex: 'enterprisePay', width: 102 },
  { title: '预付金额', dataIndex: 'advanceAmount', width: 98 },
  { title: '应收金额', dataIndex: 'receivableAmount', width: 106 },
  { title: '操作', dataIndex: 'action', fixed: 'right', width: 212 }
];

function money(value: number) {
  return `¥${value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;
}

function statusColor(status: TripReviewStatus) {
  return status === '已审核' ? 'green' : status === '待审核' ? 'orange' : 'default';
}

function driverSettlement(trip: TripExpenseRecord) {
  return trip.driverPay + trip.parkingAmount + trip.lodgingAmount + trip.livingAmount;
}

function enterpriseSettlement(trip: TripExpenseRecord) {
  return trip.fuelAmount + trip.etcAmount + trip.upstreamFreight;
}

function tripWeight(trip: TripExpenseRecord) {
  return trip.legs.reduce((sum, item) => sum + item.weight, 0);
}

function openExpense(trip: TripExpenseRecord) {
  selectedTrip.value = trip;
  Object.assign(expenseDraft, {
    fuelAmount: trip.fuelAmount,
    etcAmount: trip.etcAmount,
    driverPay: trip.driverPay,
    parkingAmount: trip.parkingAmount,
    lodgingAmount: trip.lodgingAmount,
    livingAmount: trip.livingAmount,
    upstreamFreight: trip.upstreamFreight,
    advanceAmount: trip.advanceAmount
  });
  expenseVisible.value = true;
}

function saveExpense() {
  if (!selectedTrip.value) return;
  Object.assign(selectedTrip.value, expenseDraft);
  expenseVisible.value = false;
  message.success('出车费用已保存');
}

function openDocuments(trip: TripExpenseRecord) {
  selectedTrip.value = trip;
  Object.assign(documentDraft, {
    waybillNo: '',
    weighbillNo: '',
    loadingTime: '2026-08-27 08:00',
    unloadingTime: '2026-08-27 18:00',
    goods: trip.goods,
    weight: 0,
    mileage: 0
  });
  documentVisible.value = true;
}

function addLinkedDocument() {
  if (!selectedTrip.value || !documentDraft.waybillNo.trim() || !documentDraft.weighbillNo.trim()) {
    message.warning('请填写运单号和磅单号');
    return;
  }
  selectedTrip.value.legs.push({
    id: `leg-${Date.now()}`,
    waybillNo: documentDraft.waybillNo.trim(),
    weighbillNo: documentDraft.weighbillNo.trim(),
    loadingTime: documentDraft.loadingTime,
    unloadingTime: documentDraft.unloadingTime,
    goods: documentDraft.goods || selectedTrip.value.goods,
    weight: Number(documentDraft.weight) || 0,
    mileage: Number(documentDraft.mileage) || 0
  });
  documentDraft.waybillNo = '';
  documentDraft.weighbillNo = '';
  documentDraft.weight = 0;
  documentDraft.mileage = 0;
  message.success('已关联单据；同一运单可继续关联至其它出车单');
}

function triggerUpload() {
  uploadInput.value?.click();
}

function parseHandwrittenSheet(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = '';
  if (!files.length) return;
  uploadedImages.value = files.map((file) => URL.createObjectURL(file));
  ocrVisible.value = true;
  message.success(`已识别 ${files.length} 张出车单图片`);
}

function createTripFromOcr() {
  const id = `TRIP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(tripRecords.value.length + 1).padStart(3, '0')}`;
  tripRecords.value.unshift({
    id,
    projectId: props.projectId,
    vehiclePlate: '赣J02906D',
    driver: '胡俊',
    route: '砚山储配站 → 广西德保电厂',
    customer: '云南省煤炭交易（储配）中心有限公司',
    goods: '褐煤32',
    fuelType: '柴油',
    vehicleLength: '13米高栏',
    startTime: '2026-08-27 06:40',
    endTime: '2026-08-27 20:15',
    startMileage: 148620,
    endMileage: 148932,
    legs: [{ id: `leg-${Date.now()}`, waybillNo: 'DK2026082700000112', weighbillNo: 'WB20260827022', loadingTime: '2026-08-27 07:25', unloadingTime: '2026-08-27 18:55', goods: '褐煤32', weight: 43.5, mileage: 312 }],
    fuelAmount: 875,
    etcAmount: 216,
    driverPay: 600,
    parkingAmount: 30,
    lodgingAmount: 0,
    livingAmount: 60,
    upstreamFreight: 0,
    advanceAmount: 300,
    receivableAmount: 3240,
    status: '待提交',
    source: '手写出车单',
    images: uploadedImages.value.length ? uploadedImages.value : [expenseImages[0]],
    submittedAt: '2026-08-27 21:08'
  });
  ocrVisible.value = false;
  message.success('已按 OCR + LLM 解析结果新建出车单，请核对后提交');
}
</script>

<template>
  <section class="content list-screen trip-expense-page">
    <input ref="uploadInput" class="hidden-file-input" type="file" accept="image/*" multiple @change="parseHandwrittenSheet" />

    <div class="audit-entry-bar trip-audit-entry"><div class="audit-entry-info"><AuditOutlined /><div><strong>出车单审核</strong><span>当前项目 {{ tripRecords.filter((item) => item.projectId === props.projectId && item.status === '待审核').length }} 张待审核出车单</span></div></div><a-button type="primary" @click="emit('open-audit')">进入出车单审核<RightOutlined /></a-button></div>

    <div class="metric-grid five">
      <div class="metric-card"><span>合计支出</span><strong>{{ money(stats.total) }}</strong></div>
      <div class="metric-card orange"><span>司机应付</span><strong>{{ money(stats.driverPay) }}</strong></div>
      <div class="metric-card blue"><span>企业应付</span><strong>{{ money(stats.enterprisePay) }}</strong></div>
      <div class="metric-card"><span>预付金额</span><strong>{{ money(stats.advance) }}</strong></div>
      <div class="metric-card green"><span>应收金额</span><strong>{{ money(stats.receivable) }}</strong></div>
    </div>

    <div class="formula-strip"><span>本项目出车费用统计：合计支出 = 司机应付 + 企业应付；应收金额来自已审核出车单，费用明细支持按出车单追溯与复核。</span></div>

    <div class="filter-bar trip-filter-bar">
      <a-range-picker v-model:value="dateRange" value-format="YYYY-MM-DD" />
      <a-input v-model:value="keyword" allow-clear placeholder="搜索出车单、车牌、驾驶员、线路、客户、货物">
        <template #prefix><SearchOutlined /></template>
      </a-input>
      <a-select v-model:value="statusFilter">
        <a-select-option value="全部">全部状态</a-select-option>
        <a-select-option value="已审核">已审核</a-select-option>
      </a-select>
      <div class="filter-actions"><a-dropdown><a-button type="primary"><PlusOutlined />新建/导入出车单</a-button><template #overlay><a-menu><a-menu-item key="new" @click="ocrVisible = true"><PlusOutlined />新建出车单</a-menu-item><a-menu-item key="import" @click="triggerUpload"><FileImageOutlined />导入手写出车单</a-menu-item></a-menu></template></a-dropdown></div>
    </div>

    <a-table :columns="columns" :data-source="rows" row-key="id" size="small" :pagination="{ pageSize: 10 }" :scroll="{ x: 1860 }" class="dense-table">
      <template #emptyText><a-empty description="暂无出车单" /></template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'status'"><a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag></template>
        <template v-else-if="column.dataIndex === 'vehicle'"><strong>{{ record.vehiclePlate }}</strong><br /><span class="muted">{{ record.driver }}</span></template>
        <template v-else-if="column.dataIndex === 'mileage'">{{ record.startMileage.toLocaleString() }} → {{ record.endMileage.toLocaleString() }} km</template>
        <template v-else-if="column.dataIndex === 'time'">{{ record.startTime }}<br /><span class="muted">{{ record.endTime }}</span></template>
        <template v-else-if="column.dataIndex === 'documents'"><a-tag color="blue">{{ record.legs.length }} 张运单</a-tag><a-tag color="cyan">{{ record.legs.length }} 张磅单</a-tag></template>
        <template v-else-if="column.dataIndex === 'driverPay'">{{ money(driverSettlement(record)) }}</template>
        <template v-else-if="column.dataIndex === 'enterprisePay'">{{ money(enterpriseSettlement(record)) }}</template>
        <template v-else-if="['fuelAmount', 'etcAmount', 'advanceAmount', 'receivableAmount'].includes(column.dataIndex)">{{ money(record[column.dataIndex]) }}</template>
        <template v-else-if="column.dataIndex === 'action'">
          <div class="row-actions">
            <a-button size="small" @click="openDocuments(record)">关联单据</a-button>
            <a-button size="small" @click="openExpense(record)"><EditOutlined />录入费用</a-button>
            <a-button v-if="record.status === '待提交'" size="small" type="primary" @click="submitTrip(record); message.success('已提交审核')"><SendOutlined />提交</a-button>
            <a-button v-else-if="record.status === '待审核'" size="small" type="primary" @click="auditTrip(record); message.success('审核通过，已生成应收来源')"><CheckOutlined />审核通过</a-button>
          </div>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="expenseVisible" title="录入出车费用" width="980px" ok-text="保存费用" @ok="saveExpense">
      <template v-if="selectedTrip">
        <div class="trip-modal-summary">
          <div><span>出车单</span><strong>{{ selectedTrip.id }}</strong></div>
          <div><span>车辆 / 司机</span><strong>{{ selectedTrip.vehiclePlate }} · {{ selectedTrip.driver }}</strong></div>
          <div><span>关联行程</span><strong>{{ selectedTrip.legs.length }} 段 / {{ tripWeight(selectedTrip).toFixed(2) }} 吨</strong></div>
          <div><span>费用合计</span><strong>{{ money(Object.values(expenseDraft).reduce((sum, item) => sum + Number(item || 0), 0) - expenseDraft.advanceAmount) }}</strong></div>
        </div>
        <div class="expense-entry-grid">
          <section>
            <h4>分行程明细</h4>
            <div v-for="leg in selectedTrip.legs" :key="leg.id" class="trip-leg-row">
              <strong>{{ leg.waybillNo }}</strong>
              <span>{{ leg.loadingTime }} → {{ leg.unloadingTime }}</span>
              <span>{{ leg.goods }} · {{ leg.weight }} 吨 · {{ leg.mileage }} km</span>
              <a-tag color="blue">{{ leg.weighbillNo }}</a-tag>
            </div>
          </section>
          <section>
            <h4>加油气费用</h4>
            <label><span>加油气金额</span><a-input-number v-model:value="expenseDraft.fuelAmount" :min="0" addon-before="¥" style="width:100%" /></label>
            <p>优先使用企微加油小票，出车单明细与补录数据冲突时需人工确认。</p>
          </section>
          <section>
            <h4>ETC 费用</h4>
            <label><span>通行费</span><a-input-number v-model:value="expenseDraft.etcAmount" :min="0" addon-before="¥" style="width:100%" /></label>
            <p>可按关联运单拆分到本趟或跨趟分摊。</p>
          </section>
          <section>
            <h4>其它费用</h4>
            <div class="other-expense-grid">
              <label><span>司机工资</span><a-input-number v-model:value="expenseDraft.driverPay" :min="0" addon-before="¥" /></label>
              <label><span>停车</span><a-input-number v-model:value="expenseDraft.parkingAmount" :min="0" addon-before="¥" /></label>
              <label><span>住宿</span><a-input-number v-model:value="expenseDraft.lodgingAmount" :min="0" addon-before="¥" /></label>
              <label><span>生活</span><a-input-number v-model:value="expenseDraft.livingAmount" :min="0" addon-before="¥" /></label>
              <label><span>上游运费</span><a-input-number v-model:value="expenseDraft.upstreamFreight" :min="0" addon-before="¥" /></label>
              <label><span>预付金额</span><a-input-number v-model:value="expenseDraft.advanceAmount" :min="0" addon-before="¥" /></label>
            </div>
          </section>
        </div>
      </template>
    </a-modal>

    <a-modal v-model:open="documentVisible" title="出车单关联单据" width="860px" :footer="null">
      <template v-if="selectedTrip">
        <div class="document-link-summary">
          <span>{{ selectedTrip.id }}</span>
          <strong>{{ selectedTrip.vehiclePlate }} · {{ selectedTrip.route }}</strong>
          <a-tag color="blue">可关联多张运单 / 磅单</a-tag>
        </div>
        <a-table :data-source="selectedTrip.legs" :pagination="false" row-key="id" size="small" :columns="[
          { title: '运单号', dataIndex: 'waybillNo' },
          { title: '磅单号', dataIndex: 'weighbillNo' },
          { title: '装货时间', dataIndex: 'loadingTime' },
          { title: '卸货时间', dataIndex: 'unloadingTime' },
          { title: '货物', dataIndex: 'goods' },
          { title: '重量（吨）', dataIndex: 'weight' },
          { title: '里程（km）', dataIndex: 'mileage' }
        ]" />
        <div class="document-link-form">
          <strong>关联运单 / 磅单</strong>
          <a-input v-model:value="documentDraft.waybillNo" placeholder="运单号，可重复关联实现拆分" />
          <a-input v-model:value="documentDraft.weighbillNo" placeholder="磅单号" />
          <a-input-number v-model:value="documentDraft.weight" :min="0" :precision="2" placeholder="重量（吨）" />
          <a-input-number v-model:value="documentDraft.mileage" :min="0" placeholder="里程（km）" />
          <a-button type="primary" @click="addLinkedDocument"><PlusOutlined />关联</a-button>
        </div>
      </template>
    </a-modal>

    <a-modal v-model:open="ocrVisible" title="手写出车单 OCR + LLM 解析" width="900px" ok-text="生成出车单" @ok="createTripFromOcr">
      <div class="ocr-layout">
        <div class="ocr-preview">
          <img v-if="uploadedImages[0]" :src="uploadedImages[0]" alt="出车单图片" />
          <div v-else class="ocr-placeholder"><FileSearchOutlined /><span>导入手写出车单图片后，将自动识别并生成草稿。</span></div>
        </div>
        <div class="ocr-result">
          <h4>解析结果</h4>
          <div><span>车号</span><strong>赣J02906D</strong></div>
          <div><span>驾驶员</span><strong>胡俊</strong></div>
          <div><span>起止里程</span><strong>148,620 → 148,932 km</strong></div>
          <div><span>驾驶时段</span><strong>2026-08-27 06:40 → 20:15</strong></div>
          <div><span>加油明细</span><strong>柴油 118 L / ¥875</strong></div>
          <div><span>其它费用</span><strong>ETC ¥216，停车 ¥30，生活 ¥60</strong></div>
          <p>识别置信度 94%，生成后可在“录入费用”中继续调整行程拆分和金额。</p>
        </div>
      </div>
    </a-modal>
  </section>
</template>

<style scoped>
.page-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:12px}.page-toolbar h2{margin:0;font-size:18px}.page-toolbar span{color:#64748b;font-size:12px}.toolbar-actions,.row-actions{display:flex;align-items:center;gap:8px;white-space:nowrap}.hidden-file-input{display:none}.trip-filter-bar{grid-template-columns:minmax(260px,1fr) 150px minmax(260px,1fr)}.trip-filter-note{align-self:center;color:#64748b;font-size:12px}.trip-modal-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:16px;padding:12px;border:1px solid #e8edf2;background:#fafcff}.trip-modal-summary span,.trip-modal-summary strong{display:block}.trip-modal-summary span{color:#64748b;font-size:11px}.trip-modal-summary strong{margin-top:4px;color:#1f2937;font-size:13px}.expense-entry-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.expense-entry-grid section{padding:14px;border:1px solid #e3eaf0;background:#fff}.expense-entry-grid h4{margin:0 0 12px;padding-left:8px;border-left:3px solid #1677ff;color:#334155;font-size:14px}.expense-entry-grid label{display:grid;grid-template-columns:86px 1fr;align-items:center;gap:8px;margin-top:10px;color:#475569;font-size:12px}.expense-entry-grid p{margin:10px 0 0;color:#94a3b8;font-size:11px;line-height:17px}.trip-leg-row{display:grid;grid-template-columns:1.1fr 1.3fr 1.2fr auto;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid #edf1f5;font-size:12px}.trip-leg-row span{color:#64748b}.other-expense-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 14px}.other-expense-grid label{grid-template-columns:64px 1fr}.document-link-summary{display:flex;align-items:center;gap:12px;margin-bottom:14px;padding:10px 12px;background:#f8fafc;color:#475569;font-size:12px}.document-link-summary strong{color:#1f2937}.document-link-form{display:grid;grid-template-columns:120px 1fr 1fr 120px 120px auto;align-items:center;gap:8px;margin-top:14px;padding:12px;background:#f8fafc}.document-link-form strong{color:#475569;font-size:12px}.ocr-layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:18px}.ocr-preview{display:flex;align-items:center;justify-content:center;min-height:360px;border:1px dashed #cbd5e1;background:#f8fafc;overflow:hidden}.ocr-preview img{width:100%;height:360px;object-fit:contain}.ocr-placeholder{display:flex;flex-direction:column;align-items:center;gap:10px;color:#94a3b8;font-size:12px}.ocr-placeholder .anticon{font-size:34px;color:#1677ff}.ocr-result{padding:14px;border:1px solid #e6edf4;background:#fff}.ocr-result h4{margin:0 0 12px;color:#1f2937}.ocr-result>div{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #edf1f5;font-size:12px}.ocr-result span{color:#64748b}.ocr-result strong{color:#334155;text-align:right}.ocr-result p{margin:12px 0 0;color:#64748b;font-size:12px;line-height:18px}@media(max-width:1000px){.expense-entry-grid{grid-template-columns:1fr}.trip-modal-summary{grid-template-columns:1fr 1fr}.document-link-form{grid-template-columns:1fr 1fr}.ocr-layout{grid-template-columns:1fr}} 
</style>
<style scoped>
.trip-filter-bar { grid-template-columns: 220px minmax(260px, 1fr) 150px auto; }
</style>
