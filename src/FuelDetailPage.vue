<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { DownloadOutlined, PlusOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { addFuelRecord, fuelRecords, type FuelRecord } from './operationsStore';

const props = defineProps<{ projectId: string }>();

const keyword = ref('');
const modelFilter = ref('全部车型');
const driverFilter = ref('全部司机');
const monthFilter = ref('2026-08');
const addVisible = ref(false);
const form = reactive({
  date: '2026-08-27',
  location: '',
  vehiclePlate: '',
  driver: '',
  model: '燃油牵引车',
  fuelType: '柴油' as '柴油' | 'LNG',
  liters: 0,
  unitPrice: 7.4,
  odometer: null as number | null
});

interface EnrichedFuelRecord extends FuelRecord {
  previousOdometer: number | null;
  consumption: number | null;
  anomaly: '正常' | '里程缺失' | '油耗偏高' | '连续异常';
}

const allRows = computed<EnrichedFuelRecord[]>(() => {
  const sourceRows = fuelRecords.value.filter((record) => record.projectId === props.projectId);
  const byVehicle = new Map<string, FuelRecord[]>();
  sourceRows.forEach((row) => {
    const rows = byVehicle.get(row.vehiclePlate) ?? [];
    rows.push(row);
    byVehicle.set(row.vehiclePlate, rows);
  });

  const enriched: EnrichedFuelRecord[] = [];
  byVehicle.forEach((vehicleRows) => {
    const sorted = [...vehicleRows].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    let previousOdometer: number | null = null;
    let abnormalRun = 0;
    sorted.forEach((row) => {
      const distance = row.odometer != null && previousOdometer != null ? row.odometer - previousOdometer : null;
      const consumption = distance && distance > 0 ? Number(((row.liters / distance) * 100).toFixed(1)) : null;
      let anomaly: EnrichedFuelRecord['anomaly'] = '正常';
      if (consumption == null) {
        anomaly = '里程缺失';
        abnormalRun = 0;
      } else if (consumption > 39) {
        abnormalRun += 1;
        anomaly = abnormalRun >= 3 ? '连续异常' : '油耗偏高';
      } else {
        abnormalRun = 0;
      }
      enriched.push({ ...row, previousOdometer, consumption, anomaly });
      if (row.odometer != null) previousOdometer = row.odometer;
    });
  });
  return enriched.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
});

const models = computed(() => [...new Set(allRows.value.map((row) => row.model))]);
const drivers = computed(() => [...new Set(allRows.value.map((row) => row.driver))]);

const rows = computed(() =>
  allRows.value.filter((row) => {
    const term = keyword.value.trim();
    const matchedKeyword = !term || [row.vehiclePlate, row.driver, row.location].some((value) => value.includes(term));
    const matchedModel = modelFilter.value === '全部车型' || modelFilter.value === row.model;
    const matchedDriver = driverFilter.value === '全部司机' || driverFilter.value === row.driver;
    return matchedKeyword && matchedModel && matchedDriver && row.date.startsWith(monthFilter.value);
  })
);

const stats = computed(() => {
  const totalLiters = rows.value.reduce((sum, row) => sum + row.liters, 0);
  const totalAmount = rows.value.reduce((sum, row) => sum + row.amount, 0);
  const totalDistance = rows.value.reduce((sum, row) => sum + (row.odometer != null && row.previousOdometer != null ? Math.max(0, row.odometer - row.previousOdometer) : 0), 0);
  return {
    totalLiters,
    totalAmount,
    avgConsumption: totalDistance ? ((totalLiters / totalDistance) * 100).toFixed(1) : '—',
    missing: rows.value.filter((row) => row.anomaly === '里程缺失').length,
    abnormal: rows.value.filter((row) => row.anomaly === '油耗偏高' || row.anomaly === '连续异常').length
  };
});

const columns = [
  { title: '加油日期', dataIndex: 'date', width: 104 },
  { title: '来源', dataIndex: 'source', width: 102 },
  { title: '地点', dataIndex: 'location', width: 160 },
  { title: '车号 / 司机', dataIndex: 'vehicle', width: 150 },
  { title: '燃油类型', dataIndex: 'fuelType', width: 96 },
  { title: '公升', dataIndex: 'liters', width: 84 },
  { title: '单价', dataIndex: 'unitPrice', width: 82 },
  { title: '金额', dataIndex: 'amount', width: 92 },
  { title: '本次公里数', dataIndex: 'odometer', width: 112 },
  { title: '上次公里数', dataIndex: 'previousOdometer', width: 112 },
  { title: '单次油耗', dataIndex: 'consumption', width: 106 },
  { title: '异常', dataIndex: 'anomaly', width: 116 },
  { title: '小票', dataIndex: 'receiptImage', width: 74 },
  { title: '操作', dataIndex: 'action', fixed: 'right', width: 88 }
];

function sourceColor(source: FuelRecord['source']) {
  return source === '企微小票' ? 'blue' : source === '出车单明细' ? 'cyan' : 'default';
}

function anomalyColor(anomaly: EnrichedFuelRecord['anomaly']) {
  return anomaly === '连续异常' ? 'red' : anomaly === '油耗偏高' ? 'orange' : anomaly === '里程缺失' ? 'default' : 'green';
}

function saveAdd() {
  if (!form.date || !form.location || !form.vehiclePlate || !form.driver || !form.liters) {
    message.warning('请填写日期、地点、车号、司机和加油公升');
    return;
  }
  addFuelRecord({
    projectId: props.projectId,
    date: form.date,
    location: form.location,
    vehiclePlate: form.vehiclePlate,
    driver: form.driver,
    model: form.model,
    fuelType: form.fuelType,
    liters: Number(form.liters),
    unitPrice: Number(form.unitPrice),
    odometer: form.odometer,
    source: '手动补录'
  });
  addVisible.value = false;
  message.success('加油记录已补录，油耗已重新计算');
}
</script>

<template>
  <section class="content list-screen fuel-detail-page">
    <div class="page-toolbar">
      <div>
        <h2>加油明细</h2>
        <span>汇总出车单、司机企微群加油小票和手动补录；同一笔冲突时按企微小票、出车单、补录优先级处理。</span>
      </div>
      <div class="toolbar-actions">
        <a-button @click="message.success(`已导出 ${rows.length} 条加油明细`)"><DownloadOutlined />按月导出</a-button>
        <a-button type="primary" @click="addVisible = true"><PlusOutlined />手动补录</a-button>
      </div>
    </div>

    <div class="metric-grid five">
      <div class="metric-card"><span>加油总公升</span><strong>{{ stats.totalLiters.toFixed(1) }} L</strong></div>
      <div class="metric-card"><span>加油总金额</span><strong>¥{{ stats.totalAmount.toLocaleString() }}</strong></div>
      <div class="metric-card blue"><span>单车百公里油耗</span><strong>{{ stats.avgConsumption }} L</strong></div>
      <div class="metric-card orange"><span>里程缺失</span><strong>{{ stats.missing }}</strong></div>
      <div class="metric-card red"><span>油耗异常</span><strong>{{ stats.abnormal }}</strong></div>
    </div>

    <div class="fuel-rule-bar">
      <WarningOutlined />
      <span>油耗基线默认 <b>30 L/100km</b>；单次超过基线 1.3 倍标黄，连续 3 次标红并提示推送车队管理员。</span>
    </div>

    <div class="filter-bar fuel-filter-bar">
      <a-input v-model:value="keyword" allow-clear placeholder="搜索车号、司机、加油地点">
        <template #prefix><SearchOutlined /></template>
      </a-input>
      <a-select v-model:value="modelFilter"><a-select-option value="全部车型">全部车型</a-select-option><a-select-option v-for="model in models" :key="model" :value="model">{{ model }}</a-select-option></a-select>
      <a-select v-model:value="driverFilter"><a-select-option value="全部司机">全部司机</a-select-option><a-select-option v-for="driver in drivers" :key="driver" :value="driver">{{ driver }}</a-select-option></a-select>
      <a-select v-model:value="monthFilter"><a-select-option value="2026-08">2026 年 08 月</a-select-option><a-select-option value="2026-07">2026 年 07 月</a-select-option></a-select>
    </div>

    <a-table :columns="columns" :data-source="rows" row-key="id" size="small" :pagination="{ pageSize: 10 }" :scroll="{ x: 1660 }" class="dense-table">
      <template #emptyText><a-empty description="暂无加油记录" /></template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'source'"><a-tag :color="sourceColor(record.source)">{{ record.source }}</a-tag></template>
        <template v-else-if="column.dataIndex === 'vehicle'"><strong>{{ record.vehiclePlate }}</strong><br /><span class="muted">{{ record.driver }}</span></template>
        <template v-else-if="column.dataIndex === 'liters'">{{ record.liters.toFixed(1) }} L</template>
        <template v-else-if="column.dataIndex === 'unitPrice'">¥{{ record.unitPrice.toFixed(2) }}</template>
        <template v-else-if="column.dataIndex === 'amount'"><strong>¥{{ record.amount.toLocaleString() }}</strong></template>
        <template v-else-if="column.dataIndex === 'odometer'">{{ record.odometer == null ? '—' : `${record.odometer.toLocaleString()} km` }}</template>
        <template v-else-if="column.dataIndex === 'previousOdometer'">{{ record.previousOdometer == null ? '—' : `${record.previousOdometer.toLocaleString()} km` }}</template>
        <template v-else-if="column.dataIndex === 'consumption'"><span :class="{ warning: record.anomaly === '油耗偏高', danger: record.anomaly === '连续异常' }">{{ record.consumption == null ? '—' : `${record.consumption} L/100km` }}</span></template>
        <template v-else-if="column.dataIndex === 'anomaly'"><a-tag :color="anomalyColor(record.anomaly)">{{ record.anomaly }}</a-tag></template>
        <template v-else-if="column.dataIndex === 'receiptImage'"><a-button v-if="record.receiptImage" size="small" @click="message.info('已关联加油小票图片')">查看</a-button><span v-else class="muted">无</span></template>
        <template v-else-if="column.dataIndex === 'action'"><a-button size="small" @click="message.success('已标记为待人工核对')">核对</a-button></template>
      </template>
    </a-table>

    <a-modal v-model:open="addVisible" title="手动补录加油明细" width="760px" ok-text="保存并计算油耗" @ok="saveAdd">
      <div class="fuel-add-grid">
        <label><span>加油日期 *</span><a-input v-model:value="form.date" /></label>
        <label><span>加油地点 *</span><a-input v-model:value="form.location" /></label>
        <label><span>车号 *</span><a-input v-model:value="form.vehiclePlate" /></label>
        <label><span>司机 *</span><a-input v-model:value="form.driver" /></label>
        <label><span>车型</span><a-select v-model:value="form.model"><a-select-option value="燃油牵引车">燃油牵引车</a-select-option><a-select-option value="新能源重卡">新能源重卡</a-select-option></a-select></label>
        <label><span>燃油类型</span><a-select v-model:value="form.fuelType"><a-select-option value="柴油">柴油</a-select-option><a-select-option value="LNG">LNG</a-select-option></a-select></label>
        <label><span>加油公升 *</span><a-input-number v-model:value="form.liters" :min="0" :precision="1" addon-after="L" style="width:100%" /></label>
        <label><span>单价</span><a-input-number v-model:value="form.unitPrice" :min="0" :precision="2" addon-before="¥" style="width:100%" /></label>
        <label><span>加油时公里数</span><a-input-number v-model:value="form.odometer" :min="0" addon-after="km" style="width:100%" /></label>
      </div>
    </a-modal>
  </section>
</template>

<style scoped>
.page-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:12px}.page-toolbar h2{margin:0;font-size:18px}.page-toolbar span{color:#64748b;font-size:12px}.toolbar-actions{display:flex;align-items:center;gap:8px;white-space:nowrap}.metric-card small{font-size:11px}.fuel-rule-bar{display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:9px 12px;border:1px solid #fed7aa;background:#fffaf3;color:#9a5b13;font-size:12px}.fuel-filter-bar{grid-template-columns:minmax(260px,1fr) 160px 150px 140px}.warning{color:#d97706;font-weight:700}.danger{color:#d92d20;font-weight:700}.fuel-add-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 18px}.fuel-add-grid label{display:grid;grid-template-columns:100px 1fr;align-items:center;gap:10px;color:#475569;font-size:12px}@media(max-width:900px){.fuel-filter-bar,.fuel-add-grid{grid-template-columns:1fr}}
</style>
