<script setup lang="ts">
import { computed, ref } from 'vue';
import { DownloadOutlined, FilePdfOutlined, SearchOutlined, SendOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { receivableSettlement, tripRecords, type TripExpenseRecord } from './operationsStore';

const props = defineProps<{ projectId: string }>();

const keyword = ref('');
const customerFilter = ref('全部客户');
const previewVisible = ref(false);
const previewRows = ref<TripExpenseRecord[]>([]);
const settlementFilter = ref<'全部' | '待收款' | '已收款' | '待开票' | '已开票'>('全部');

const reviewedTrips = computed(() => tripRecords.value.filter((trip) => trip.projectId === props.projectId && trip.status === '已审核'));
const customers = computed(() => [...new Set(reviewedTrips.value.map((trip) => trip.customer))]);

const rows = computed(() =>
  reviewedTrips.value.filter((trip) => {
    const settlement = receivableSettlement.value[trip.id] ?? { invoice: '待开票', receipt: '待收款', dueDate: '2026-09-10' };
    const term = keyword.value.trim();
    const keywordMatched = !term || [trip.id, trip.route, trip.vehiclePlate, trip.driver, trip.customer, trip.goods].some((value) => value.includes(term));
    const customerMatched = customerFilter.value === '全部客户' || customerFilter.value === trip.customer;
    const settlementMatched =
      settlementFilter.value === '全部' ||
      settlement.invoice === settlementFilter.value ||
      settlement.receipt === settlementFilter.value;
    return keywordMatched && customerMatched && settlementMatched;
  })
);

const stats = computed(() => {
  const total = rows.value.reduce((sum, trip) => sum + trip.receivableAmount, 0);
  const advance = rows.value.reduce((sum, trip) => sum + trip.advanceAmount, 0);
  const received = rows.value
    .filter((trip) => (receivableSettlement.value[trip.id]?.receipt ?? '待收款') === '已收款')
    .reduce((sum, trip) => sum + Math.max(0, trip.receivableAmount - trip.advanceAmount), 0);
  const invoice = rows.value.filter((trip) => (receivableSettlement.value[trip.id]?.invoice ?? '待开票') === '已开票').length;
  return { total, advance, received, outstanding: total - advance - received, invoice };
});

const columns = [
  { title: '应收单号', dataIndex: 'id', width: 168 },
  { title: '审核状态', dataIndex: 'status', width: 94 },
  { title: '账期', dataIndex: 'period', width: 96 },
  { title: '客户 / 线路', dataIndex: 'customer', width: 245 },
  { title: '车牌 / 司机', dataIndex: 'vehicle', width: 150 },
  { title: '装货 / 卸货时间', dataIndex: 'time', width: 186 },
  { title: '燃油 / 车长', dataIndex: 'vehicleSpec', width: 130 },
  { title: '货物', dataIndex: 'goods', width: 115 },
  { title: '件数 / 重量', dataIndex: 'cargo', width: 120 },
  { title: '应收金额', dataIndex: 'receivable', width: 104 },
  { title: '预付冲抵', dataIndex: 'advance', width: 104 },
  { title: '开票', dataIndex: 'invoice', width: 88 },
  { title: '回收', dataIndex: 'receipt', width: 98 },
  { title: '到期日', dataIndex: 'dueDate', width: 105 },
  { title: '操作', dataIndex: 'action', fixed: 'right', width: 214 }
];

function settlementOf(trip: TripExpenseRecord) {
  return receivableSettlement.value[trip.id] ?? { invoice: '待开票', receipt: '待收款', dueDate: '2026-09-10' };
}

function money(value: number) {
  return `¥${value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;
}

function dueDays(trip: TripExpenseRecord) {
  const date = settlementOf(trip).dueDate;
  return Math.ceil((new Date(`${date}T00:00:00`).getTime() - new Date('2026-08-27T00:00:00').getTime()) / 86400000);
}

function tripWeight(trip: TripExpenseRecord) {
  return trip.legs.reduce((sum, item) => sum + item.weight, 0);
}

function markInvoice(trip: TripExpenseRecord) {
  const current = settlementOf(trip);
  receivableSettlement.value[trip.id] = { ...current, invoice: current.invoice === '待开票' ? '已开票' : '待开票' };
  message.success(current.invoice === '待开票' ? '已标记开票' : '已撤销开票标记');
}

function markReceipt(trip: TripExpenseRecord) {
  const current = settlementOf(trip);
  receivableSettlement.value[trip.id] = { ...current, receipt: current.receipt === '待收款' ? '已收款' : '待收款' };
  message.success(current.receipt === '待收款' ? '客户付款已自动核销应收单' : '已撤销收款核销');
}

function openPreview() {
  previewRows.value = rows.value;
  previewVisible.value = true;
}
</script>

<template>
  <section class="content list-screen receivable-page">
    <div class="page-toolbar">
      <div>
        <h2>应收管理</h2>
        <span>仅汇总已审核出车单；按客户、线路与账期生成应收、对账和回收跟踪。</span>
      </div>
      <div class="toolbar-actions">
        <a-button @click="openPreview"><FilePdfOutlined />对账单预览</a-button>
        <a-button type="primary" @click="openPreview"><SendOutlined />生成并发送对账单</a-button>
      </div>
    </div>

    <div class="metric-grid five">
      <div class="metric-card green"><span>应收合计</span><strong>{{ money(stats.total) }}</strong></div>
      <div class="metric-card"><span>预付冲抵</span><strong>{{ money(stats.advance) }}</strong></div>
      <div class="metric-card blue"><span>已回收</span><strong>{{ money(stats.received) }}</strong></div>
      <div class="metric-card orange"><span>待回收</span><strong>{{ money(stats.outstanding) }}</strong></div>
      <div class="metric-card"><span>已开票单</span><strong>{{ stats.invoice }}</strong></div>
    </div>

    <div class="filter-bar receivable-filter-bar">
      <a-input v-model:value="keyword" allow-clear placeholder="搜索应收单、客户、线路、车牌、司机、货物">
        <template #prefix><SearchOutlined /></template>
      </a-input>
      <a-select v-model:value="customerFilter">
        <a-select-option value="全部客户">全部客户</a-select-option>
        <a-select-option v-for="customer in customers" :key="customer" :value="customer">{{ customer }}</a-select-option>
      </a-select>
      <a-select v-model:value="settlementFilter">
        <a-select-option value="全部">全部回收状态</a-select-option>
        <a-select-option value="待开票">待开票</a-select-option>
        <a-select-option value="已开票">已开票</a-select-option>
        <a-select-option value="待收款">待收款</a-select-option>
        <a-select-option value="已收款">已收款</a-select-option>
      </a-select>
      <a-button @click="message.success(`已导出 ${rows.length} 条应收记录`)"><DownloadOutlined />导出</a-button>
    </div>

    <div class="receivable-note">
      <span><b>生成规则：</b>出车单审核通过后自动生成应收来源。</span>
      <span><b>核销规则：</b>客户付款自动核销；出车预付金额优先冲抵应收。</span>
    </div>

    <a-table :columns="columns" :data-source="rows" row-key="id" size="small" :pagination="{ pageSize: 10 }" :scroll="{ x: 2020 }" class="dense-table">
      <template #emptyText>
        <a-empty description="暂无已审核出车单。审核通过出车单后会自动生成应收单。" />
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'id'"><strong>AR-{{ record.id.slice(-11) }}</strong></template>
        <template v-else-if="column.dataIndex === 'status'"><a-tag color="green">{{ record.status }}</a-tag></template>
        <template v-else-if="column.dataIndex === 'period'">2026-08</template>
        <template v-else-if="column.dataIndex === 'customer'"><strong>{{ record.customer }}</strong><br /><span class="muted">{{ record.route }}</span></template>
        <template v-else-if="column.dataIndex === 'vehicle'"><strong>{{ record.vehiclePlate }}</strong><br /><span class="muted">{{ record.driver }}</span></template>
        <template v-else-if="column.dataIndex === 'time'">{{ record.legs[0]?.loadingTime }}<br /><span class="muted">{{ record.legs[record.legs.length - 1]?.unloadingTime }}</span></template>
        <template v-else-if="column.dataIndex === 'vehicleSpec'">{{ record.fuelType }}<br /><span class="muted">{{ record.vehicleLength }}</span></template>
        <template v-else-if="column.dataIndex === 'cargo'">{{ record.legs.length }} 单 / {{ tripWeight(record).toFixed(2) }} 吨 / 0 方</template>
        <template v-else-if="column.dataIndex === 'receivable'"><strong>{{ money(record.receivableAmount) }}</strong></template>
        <template v-else-if="column.dataIndex === 'advance'">{{ money(record.advanceAmount) }}</template>
        <template v-else-if="column.dataIndex === 'invoice'"><a-tag :color="settlementOf(record).invoice === '已开票' ? 'green' : 'default'">{{ settlementOf(record).invoice }}</a-tag></template>
        <template v-else-if="column.dataIndex === 'receipt'"><a-tag :color="settlementOf(record).receipt === '已收款' ? 'green' : 'orange'">{{ settlementOf(record).receipt }}</a-tag></template>
        <template v-else-if="column.dataIndex === 'dueDate'"><span :class="{ danger: dueDays(record) < 0 }">{{ settlementOf(record).dueDate }}</span><br /><small :class="{ danger: dueDays(record) < 0 }">{{ dueDays(record) < 0 ? `逾期 ${Math.abs(dueDays(record))} 天` : `剩余 ${dueDays(record)} 天` }}</small></template>
        <template v-else-if="column.dataIndex === 'action'">
          <div class="row-actions">
            <a-button size="small" @click="markInvoice(record)">{{ settlementOf(record).invoice === '已开票' ? '撤销开票' : '标记开票' }}</a-button>
            <a-button size="small" type="primary" @click="markReceipt(record)">{{ settlementOf(record).receipt === '已收款' ? '撤销核销' : '确认收款' }}</a-button>
          </div>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="previewVisible" title="客户对账单在线预览" width="1000px" :footer="null">
      <div class="statement-sheet">
        <header>
          <div>
            <span>开心车联 · 运输服务对账单</span>
            <h2>{{ previewRows[0]?.customer ?? '客户' }}</h2>
          </div>
          <div class="statement-period"><strong>2026 年 08 月</strong><span>账期结算单</span></div>
        </header>
        <div class="statement-meta">
          <span>线路：{{ [...new Set(previewRows.map((item) => item.route))].join('；') || '-' }}</span>
          <span>生成日期：2026-08-27</span>
          <span>应收合计：{{ money(previewRows.reduce((sum, item) => sum + item.receivableAmount, 0)) }}</span>
        </div>
        <a-table :data-source="previewRows" row-key="id" size="small" :pagination="false" :columns="[
          { title: '出车单号', dataIndex: 'id' },
          { title: '车牌号', dataIndex: 'vehiclePlate' },
          { title: '线路', dataIndex: 'route' },
          { title: '货物', dataIndex: 'goods' },
          { title: '重量（吨）', key: 'weight' },
          { title: '应收金额', key: 'amount' }
        ]">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'weight'">{{ tripWeight(record).toFixed(2) }}</template>
            <template v-else-if="column.key === 'amount'">{{ money(record.receivableAmount) }}</template>
          </template>
        </a-table>
        <footer>
          <span>请于约定账期内完成付款，付款后系统将自动核销对应应收单。</span>
          <div><a-button @click="message.success('已生成 PDF 文件')"><FilePdfOutlined />生成 PDF</a-button><a-button type="primary" @click="message.success('对账单已发送至客户联系人')"><SendOutlined />发送客户</a-button></div>
        </footer>
      </div>
    </a-modal>
  </section>
</template>

<style scoped>
.page-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:12px}.page-toolbar h2{margin:0;font-size:18px}.page-toolbar span{color:#64748b;font-size:12px}.toolbar-actions,.row-actions{display:flex;align-items:center;gap:8px;white-space:nowrap}.receivable-filter-bar{grid-template-columns:minmax(260px,1fr) minmax(200px,.6fr) 150px auto}.receivable-note{display:flex;gap:20px;margin:-2px 0 12px;color:#64748b;font-size:12px}.receivable-note b{color:#475569}.statement-sheet{padding:8px 12px}.statement-sheet header{display:flex;align-items:flex-start;justify-content:space-between;padding:8px 0 18px;border-bottom:2px solid #1f2937}.statement-sheet header span{color:#64748b;font-size:12px}.statement-sheet h2{margin:6px 0 0;color:#1f2937;font-size:22px}.statement-period{display:flex;flex-direction:column;align-items:flex-end;gap:4px}.statement-period strong{color:#1f2937;font-size:14px}.statement-meta{display:flex;justify-content:space-between;gap:12px;margin:16px 0;color:#64748b;font-size:12px}.statement-sheet footer{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:16px;padding-top:14px;border-top:1px solid #e5e7eb;color:#64748b;font-size:12px}.statement-sheet footer>div{display:flex;gap:8px}@media(max-width:1000px){.receivable-filter-bar{grid-template-columns:1fr 1fr}.statement-meta,.statement-sheet footer{align-items:flex-start;flex-direction:column}}
</style>
