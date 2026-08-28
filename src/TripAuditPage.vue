<script setup lang="ts">
import { computed, ref, reactive } from 'vue';
import { CheckOutlined, CloseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons-vue';
import { message, Modal } from 'ant-design-vue';
import { auditTrip, tripRecords, type TripExpenseRecord, type TripReviewStatus } from './operationsStore';

const props = defineProps<{ projectId: string }>();
const emit = defineEmits<{ (event: 'back'): void }>();
const reviewIndex = ref(0);
const activeImage = ref(0);
const editDraft = reactive<Record<string, string | number>>({});

const auditRows = computed(() => tripRecords.value.filter((trip) => trip.projectId === props.projectId && trip.status === '待审核'));
const currentTrip = computed(() => auditRows.value[reviewIndex.value] ?? null);
function syncDraft() { if (currentTrip.value) Object.assign(editDraft, currentTrip.value); }
function selectTrip(index: number) { reviewIndex.value = index; activeImage.value = 0; syncDraft(); }

const deliveryColumns = [
  { title: '日期', dataIndex: 'date', width: 150 },
  { title: '发货单位', dataIndex: 'company', width: 230 },
  { title: '货物名称', dataIndex: 'goods', width: 150 },
  { title: '发货地', dataIndex: 'from', width: 210 },
  { title: '卸货地', dataIndex: 'to', width: 180 }, { title: '出发km', dataIndex: 'startKm', width: 100 }, { title: '到达km', dataIndex: 'endKm', width: 100 }, { title: '挂车', dataIndex: 'trailer', width: 100 }, { title: '备注', dataIndex: 'remark', width: 120 }, { title: '操作', dataIndex: 'action', width: 80 }
];
const returnColumns = [
  { title: '日期', dataIndex: 'date', width: 150 },
  { title: '回货单位', dataIndex: 'company', width: 230 },
  { title: '货物名称', dataIndex: 'goods', width: 150 },
  { title: '发货地', dataIndex: 'from', width: 210 },
  { title: '卸货地', dataIndex: 'to', width: 180 }, { title: '出发km', dataIndex: 'startKm', width: 100 }, { title: '到达km', dataIndex: 'endKm', width: 100 }, { title: '挂车', dataIndex: 'trailer', width: 100 }, { title: '备注', dataIndex: 'remark', width: 120 }, { title: '操作', dataIndex: 'action', width: 80 }
];
const expenseColumns = [
  { title: '费用类型', dataIndex: 'type', width: 130 },
  { title: '加油站 / 说明', dataIndex: 'station', width: 250 },
  { title: '公升', dataIndex: 'liters', width: 100 },
  { title: '单价', dataIndex: 'unitPrice', width: 100 },
  { title: '金额', dataIndex: 'amount', width: 120 },
  { title: '公里数', dataIndex: 'mileage', width: 120 }
];
const fuelColumns = [{ title: '日期', dataIndex: 'date' }, { title: '地名', dataIndex: 'station' }, { title: '公斤/升', dataIndex: 'liters' }, { title: '单价', dataIndex: 'unitPrice' }, { title: '加油公里数', dataIndex: 'mileage' }, { title: '付款类型', dataIndex: 'payment' }, { title: '金额', dataIndex: 'amount' }, { title: '操作', dataIndex: 'action' }];
const etcColumns = [{ title: '日期', dataIndex: 'date' }, { title: '起地名', dataIndex: 'from' }, { title: '止地名', dataIndex: 'to' }, { title: '吨位', dataIndex: 'weight' }, { title: '金额', dataIndex: 'amount' }, { title: '付款类型', dataIndex: 'payment' }, { title: '操作', dataIndex: 'action' }];
const otherColumns = [{ title: '日期', dataIndex: 'date' }, { title: '费用类型', dataIndex: 'type' }, { title: '金额', dataIndex: 'amount' }, { title: '备注', dataIndex: 'remark' }, { title: '操作', dataIndex: 'action' }];

function routePlaces(route: string) {
  const [from = '-', to = '-'] = route.split(' → ');
  return { from, to };
}

function deliveryRows(trip: TripExpenseRecord) {
  const place = routePlaces(trip.route);
  return trip.legs.filter((_, index) => index % 2 === 0).map((leg) => ({
    id: leg.id, date: leg.loadingTime, company: trip.customer, goods: leg.goods, from: place.from, to: place.to, startKm: trip.startMileage, endKm: trip.endMileage, trailer: trip.vehicleLength, remark: '', action: '删除'
  }));
}
function fuelRows(trip: TripExpenseRecord) { return [{ id: 'fuel', date: trip.startTime.slice(0, 10), station: `${trip.fuelType}补给站`, liters: trip.fuelType === 'LNG' ? 260 : 220, unitPrice: trip.fuelAmount ? (trip.fuelAmount / (trip.fuelType === 'LNG' ? 260 : 220)).toFixed(2) : 0, mileage: trip.startMileage, payment: '企业支付', amount: trip.fuelAmount, action: '预览 / 作废' }]; }
function etcRows(trip: TripExpenseRecord) { const p = routePlaces(trip.route); return [{ id: 'etc', date: trip.startTime.slice(0, 10), from: p.from, to: p.to, weight: '-', amount: trip.etcAmount, payment: '企业支付', action: '预览 / 作废' }]; }
function otherRows(trip: TripExpenseRecord) { return [{ id: 'parking', date: trip.startTime.slice(0, 10), type: '停车费用', amount: trip.parkingAmount, remark: '停车场', action: '预览 / 作废' }, { id: 'lodging', date: trip.startTime.slice(0, 10), type: '住宿费用', amount: trip.lodgingAmount, remark: '司机住宿', action: '预览 / 作废' }, { id: 'living', date: trip.startTime.slice(0, 10), type: '其他费用', amount: trip.livingAmount, remark: '生活费', action: '预览 / 作废' }].filter((row) => row.amount > 0); }

function returnRows(trip: TripExpenseRecord) {
  const place = routePlaces(trip.route);
  const rows = trip.legs.filter((_, index) => index % 2 === 1).map((leg) => ({
    id: leg.id, date: leg.loadingTime, company: trip.customer, goods: leg.goods, from: place.to, to: place.from
  }));
  return rows.length ? rows : [];
}

function expenseRows(trip: TripExpenseRecord) {
  const mileage = trip.endMileage - trip.startMileage;
  const fuelLiters = trip.fuelType === 'LNG' ? 260 : 220;
  const fuelUnitPrice = trip.fuelAmount ? Number((trip.fuelAmount / fuelLiters).toFixed(2)) : 0;
  return [
    { id: 'fuel', type: '加油费用', station: `${trip.fuelType}补给站`, liters: fuelLiters, unitPrice: fuelUnitPrice, amount: trip.fuelAmount, mileage },
    { id: 'parking', type: '停车费用', station: '停车场', liters: '-', unitPrice: '-', amount: trip.parkingAmount, mileage: '-' },
    { id: 'lodging', type: '住宿费用', station: '司机住宿', liters: '-', unitPrice: '-', amount: trip.lodgingAmount, mileage: '-' },
    { id: 'etc', type: 'ETC 费用', station: '高速通行', liters: '-', unitPrice: '-', amount: trip.etcAmount, mileage: '-' },
    { id: 'other', type: '其他费用', station: '司机工资、生活费等', liters: '-', unitPrice: '-', amount: trip.driverPay + trip.livingAmount + trip.upstreamFreight, mileage: '-' }
  ].filter((item) => item.amount > 0);
}

function money(value: number) { return `¥${value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`; }
function previous() { reviewIndex.value = reviewIndex.value <= 0 ? Math.max(0, auditRows.value.length - 1) : reviewIndex.value - 1; activeImage.value = 0; syncDraft(); }
function next() { reviewIndex.value = auditRows.value.length ? (reviewIndex.value + 1) % auditRows.value.length : 0; activeImage.value = 0; syncDraft(); }
function approve() {
  if (!currentTrip.value) return;
  auditTrip(currentTrip.value);
  message.success('出车单已审核通过，已生成应收来源');
  reviewIndex.value = Math.min(reviewIndex.value, Math.max(0, auditRows.value.length - 1));
}
function reject() {
  const trip = currentTrip.value;
  if (!trip) return;
  Modal.confirm({
    title: '确认驳回此出车单？', content: '驳回后该出车单将退回提交方处理。', okText: '确认驳回', okType: 'danger', cancelText: '取消',
    onOk() { trip.status = '已驳回'; message.success('出车单已驳回'); reviewIndex.value = Math.min(reviewIndex.value, Math.max(0, auditRows.value.length - 1)); }
  });
}
function setStatus(status: TripReviewStatus) { if (currentTrip.value) { currentTrip.value.status = status; message.success(`出车单已标记为${status}`); } }
function previewReceipt() { message.info('已打开费用凭证预览'); }
function invalidateFee() { message.success('费用明细已作废'); }
</script>

<template>
  <section class="content review-screen trip-audit-page">
    <div class="review-back-bar"><a-button @click="emit('back')"><LeftOutlined />返回出车费用管理</a-button></div>
    <template v-if="currentTrip">
      <div class="review-summary trip-audit-summary">
        <div><span>当前 {{ reviewIndex + 1 }} / {{ auditRows.length }} · 来源：{{ currentTrip.source }}</span><strong>{{ currentTrip.id }} · {{ currentTrip.vehiclePlate }} · {{ currentTrip.route }}</strong></div>
        <a-select :value="reviewIndex" size="small" class="review-jump-select" @update:value="selectTrip">
          <a-select-option v-for="(trip, index) in auditRows" :key="trip.id" :value="index">{{ index + 1 }}. {{ trip.vehiclePlate }} · {{ trip.route }}</a-select-option>
        </a-select>
      </div>

      <div class="trip-audit-workspace"><div class="trip-audit-image"><div class="trip-source-badge">{{ currentTrip.source }} · 单据影像</div><img v-if="(currentTrip.images.length ? currentTrip.images : ['/demo-assets/trip-audit-handwritten.jpg'])[activeImage]" :src="(currentTrip.images.length ? currentTrip.images : ['/demo-assets/trip-audit-handwritten.jpg'])[activeImage]" alt="出车单据照片" /><div v-else>暂无出车单据照片</div><div class="trip-image-tabs"><button v-for="(_, index) in (currentTrip.images.length ? currentTrip.images : ['/demo-assets/trip-audit-handwritten.jpg'])" :key="index" :class="{active: activeImage === index}" @click="activeImage = index">图片{{ index + 1 }}</button></div></div><div class="trip-audit-sections">
        <div v-if="currentTrip.source === '企微群'" class="trip-source-note"><strong>企微群报单</strong><span>司机文字报单与小票 / 纸质出车单已由机器人 OCR 识别并结构化，以下字段可复核修改。</span></div>
        <section class="trip-audit-section"><h3>公共信息</h3><a-descriptions bordered size="small" :column="4">
          <a-descriptions-item label="车牌号"><a-input v-model:value="editDraft.vehiclePlate" size="small" /></a-descriptions-item><a-descriptions-item label="挂车号"><a-input v-model:value="editDraft.trailerPlate" size="small" /></a-descriptions-item>
          <a-descriptions-item label="主驾驶员">{{ currentTrip.driver }}</a-descriptions-item><a-descriptions-item label="副驾驶员">-</a-descriptions-item>
          <a-descriptions-item label="线路" :span="2">{{ currentTrip.route }}</a-descriptions-item><a-descriptions-item label="出发公里">{{ currentTrip.startMileage.toLocaleString() }} km</a-descriptions-item><a-descriptions-item label="到达公里">{{ currentTrip.endMileage.toLocaleString() }} km</a-descriptions-item>
        </a-descriptions></section>
        <section class="trip-audit-section"><h3>行程明细</h3><a-table :columns="deliveryColumns" :data-source="[...deliveryRows(currentTrip), ...returnRows(currentTrip)]" row-key="id" size="small" :pagination="false" :scroll="{ x: 1200 }"><template #bodyCell="{ column, record }"><a-input v-if="['company','goods','from','to','trailer','remark'].includes(column.dataIndex)" v-model:value="record[column.dataIndex]" size="small" /><a-button v-else-if="column.dataIndex === 'action'" type="link" danger size="small">删除</a-button></template></a-table></section>
        <section class="trip-audit-section"><h3>油/气费用</h3><a-table :columns="fuelColumns" :data-source="fuelRows(currentTrip)" row-key="id" size="small" :pagination="false"><template #bodyCell="{ column, record }"><template v-if="column.dataIndex === 'action'"><a-button type="link" size="small" @click="previewReceipt">预览</a-button><a-button type="link" danger size="small" @click="invalidateFee">作废</a-button></template><template v-else-if="column.dataIndex === 'amount'">{{ money(record.amount) }}</template></template></a-table></section>
        <section class="trip-audit-section"><h3>ETC费用</h3><a-table :columns="etcColumns" :data-source="etcRows(currentTrip)" row-key="id" size="small" :pagination="false"><template #bodyCell="{ column, record }"><template v-if="column.dataIndex === 'action'"><a-button type="link" size="small" @click="previewReceipt">预览</a-button><a-button type="link" danger size="small" @click="invalidateFee">作废</a-button></template><template v-else-if="column.dataIndex === 'amount'">{{ money(record.amount) }}</template></template></a-table></section>
        <section class="trip-audit-section"><h3>其他费用</h3><a-table :columns="otherColumns" :data-source="otherRows(currentTrip)" row-key="id" size="small" :pagination="false"><template #bodyCell="{ column, record }"><template v-if="column.dataIndex === 'action'"><a-button type="link" size="small" @click="previewReceipt">预览</a-button><a-button type="link" danger size="small" @click="invalidateFee">作废</a-button></template><template v-else-if="column.dataIndex === 'amount'">{{ money(record.amount) }}</template></template></a-table></section>
        <section class="trip-audit-section"><h3>预付金额（财务手动录入）</h3><div class="prepaid-editor"><a-input-number v-model:value="editDraft.advanceAmount" :min="0" addon-after="元" /></div></section>
      </div></div>
      <div class="sticky-actions"><a-button @click="previous"><LeftOutlined />上一张</a-button><a-button @click="next">下一张<RightOutlined /></a-button><a-button @click="Object.assign(currentTrip, editDraft); message.success('出车单修改已保存')">保存修改</a-button><a-button danger @click="setStatus('已驳回')"><CloseOutlined />作废</a-button><a-button @click="setStatus('有疑点')">标记疑点</a-button><a-button danger @click="reject">驳回</a-button><a-button type="primary" @click="approve"><CheckOutlined />通过并下一张</a-button></div>
    </template>
    <a-empty v-else description="暂无待审核出车单"><a-button type="primary" @click="emit('back')">返回出车费用管理</a-button></a-empty>
  </section>
</template>

<style scoped>
.trip-audit-summary{align-items:center}.trip-audit-workspace{display:grid;grid-template-columns:minmax(280px,38%) minmax(0,1fr);gap:16px;min-height:0;overflow:auto;padding-bottom:12px}.trip-audit-image{position:sticky;top:0;display:flex;align-items:center;justify-content:center;height:520px;border:1px solid #d6dee8;border-radius:8px;background:#f8fafc;overflow:hidden}.trip-audit-image img{width:100%;height:100%;object-fit:contain}.trip-audit-sections{display:grid;align-content:start;gap:14px}.trip-audit-section{border:1px solid #e3eaf0;background:#fff}.trip-audit-section h3{margin:0;padding:10px 14px;border-bottom:1px solid #e3eaf0;color:#334155;font-size:14px}.trip-audit-section :deep(.ant-descriptions){margin:14px}.trip-audit-section :deep(.ant-table-wrapper){padding:0 14px 14px}.trip-audit-section :deep(.ant-empty){margin:12px 0}.prepaid-editor{padding:14px}.trip-audit-page :deep(.sticky-actions){position:sticky;bottom:0;z-index:2}
.trip-source-badge{position:absolute;top:10px;left:12px;z-index:1;padding:4px 8px;border-radius:4px;background:rgba(15,23,42,.68);color:#fff;font-size:12px}.trip-source-note{display:flex;gap:10px;align-items:baseline;padding:9px 12px;border:1px solid #bfdbfe;border-radius:6px;background:#eff6ff;color:#475569;font-size:12px}.trip-source-note strong{color:#1677ff;font-size:13px}
</style>
<style scoped>
.trip-audit-image { flex-direction: column; align-items: stretch; justify-content: flex-start; }
.trip-audit-image { height: 760px; }
.trip-audit-image img { flex: 1; min-height: 0; height: auto; }
.trip-image-tabs { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; padding: 10px; background: #fff; border-top: 1px solid #e2e8f0; }
.trip-image-tabs button { padding: 5px 12px; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff; color: #475569; cursor: pointer; font-size: 12px; }
.trip-image-tabs button.active { border-color: #1677ff; background: #e6f4ff; color: #1677ff; }
</style>
