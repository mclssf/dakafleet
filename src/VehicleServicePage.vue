<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  BellOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import {
  vehicleDateDiff,
  vehicleServiceAlertCount,
  vehicleServiceRecords,
  type VehicleServiceRecord
} from './operationsStore';

const props = defineProps<{ projectId: string }>();

const keyword = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const settingsVisible = ref(false);
const addVisible = ref(false);
const selectedRecord = ref<VehicleServiceRecord | null>(null);
const settingsDraft = reactive<Record<string, number>>({
  insuranceWarnDays: 30,
  inspectionWarnDays: 60,
  maintenanceWarnDays: 180,
  maintenanceWarnMileage: 10000
});
const addForm = reactive({
  plate: '',
  model: '燃油牵引车',
  driver: '',
  liabilityInsurance: '2026-12-31',
  compulsoryInsurance: '2026-12-31',
  commercialInsurance: '2026-12-31',
  inspection: '2026-12-31',
  operationPermit: '2027-03-31',
  maintenanceDate: '2026-08-01',
  odometer: 0
});

const rows = computed(() =>
  vehicleServiceRecords.value.filter((record) => {
    const term = keyword.value.trim();
    return record.projectId === props.projectId && (!term || [record.plate, record.driver, record.model].some((value) => value.includes(term)));
  })
);

function insuranceDays(record: VehicleServiceRecord) {
  return Math.min(vehicleDateDiff(record.liabilityInsurance), vehicleDateDiff(record.compulsoryInsurance), vehicleDateDiff(record.commercialInsurance));
}

function inspectionDays(record: VehicleServiceRecord) {
  return vehicleDateDiff(record.inspection);
}

function maintenanceMileageLeft(record: VehicleServiceRecord) {
  return record.maintenanceWarnMileage - (record.odometer - record.maintenanceMileage);
}

function maintenanceDue(record: VehicleServiceRecord) {
  return maintenanceMileageLeft(record) <= 0 || vehicleDateDiff(record.maintenanceDate) <= -record.maintenanceWarnDays;
}

function severity(days: number, warning: number) {
  return days <= warning ? (days <= Math.ceil(warning / 2) ? 'red' : 'orange') : 'green';
}

function maintenanceSeverity(record: VehicleServiceRecord) {
  return maintenanceDue(record) ? 'red' : maintenanceMileageLeft(record) <= record.maintenanceWarnMileage * 0.2 ? 'orange' : 'green';
}

const stats = computed(() => ({
  total: rows.value.length,
  insurance: rows.value.filter((record) => !record.serviceClosed && insuranceDays(record) <= 60).length,
  inspection: rows.value.filter((record) => !record.serviceClosed && inspectionDays(record) <= record.inspectionWarnDays).length,
  maintenance: rows.value.filter((record) => !record.serviceClosed && maintenanceDue(record)).length
}));

const columns = [
  { title: '车辆', dataIndex: 'vehicle', width: 144 },
  { title: '服务状态', dataIndex: 'service', width: 104 },
  { title: '交强险', dataIndex: 'compulsoryInsurance', width: 128 },
  { title: '商业险', dataIndex: 'commercialInsurance', width: 128 },
  { title: '物流责任险', dataIndex: 'liabilityInsurance', width: 128 },
  { title: '年检', dataIndex: 'inspection', width: 118 },
  { title: '营运证', dataIndex: 'operationPermit', width: 118 },
  { title: '车辆保养', dataIndex: 'maintenance', width: 170 },
  { title: '提醒', dataIndex: 'alert', width: 150 },
  { title: '操作', dataIndex: 'action', fixed: 'right', width: 196 }
];

function dayText(days: number) {
  return days < 0 ? `已逾期 ${Math.abs(days)} 天` : `剩余 ${days} 天`;
}

function showSettings(record: VehicleServiceRecord) {
  selectedRecord.value = record;
  Object.assign(settingsDraft, {
    insuranceWarnDays: record.insuranceWarnDays,
    inspectionWarnDays: record.inspectionWarnDays,
    maintenanceWarnDays: record.maintenanceWarnDays,
    maintenanceWarnMileage: record.maintenanceWarnMileage
  });
  settingsVisible.value = true;
}

function saveSettings() {
  if (!selectedRecord.value) return;
  Object.assign(selectedRecord.value, settingsDraft);
  settingsVisible.value = false;
  message.success('车辆档案提醒阈值已保存');
}

function toggleService(record: VehicleServiceRecord) {
  record.serviceClosed = !record.serviceClosed;
  message.success(record.serviceClosed ? '车辆服务已关闭，已停止企微推送' : '车辆服务已开启，提醒推送已恢复');
}

function sendAlerts() {
  if (!vehicleServiceAlertCount.value) {
    message.success('当前没有需要推送的车辆提醒');
    return;
  }
  message.success(`已向企微群 @ 车队管理员推送 ${vehicleServiceAlertCount.value} 条车辆提醒`);
}

function importExcel(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
    message.error('请选择 XLSX、XLS 或 CSV 文件');
    return;
  }
  const importedRows = Array.from({ length: 3 }, (_, index) => ({
    id: `VS-import-${Date.now()}-${index}`,
    projectId: props.projectId,
    plate: `云A${String(88000 + index).padStart(5, '0')}D`,
    model: index % 2 ? '燃油牵引车' : '新能源重卡',
    driver: '待绑定',
    serviceClosed: false,
    liabilityInsurance: '2026-11-30',
    compulsoryInsurance: '2026-12-18',
    commercialInsurance: '2026-11-15',
    inspection: '2026-10-20',
    operationPermit: '2027-02-28',
    maintenanceDate: '2026-07-20',
    maintenanceMileage: 100000,
    odometer: 103000 + index * 200,
    insuranceWarnDays: 30,
    inspectionWarnDays: 60,
    maintenanceWarnDays: 180,
    maintenanceWarnMileage: 10000
  }));
  vehicleServiceRecords.value.unshift(...importedRows);
  message.success(`已导入 ${file.name}，新增 3 台车辆档案待核对`);
}

function saveAdd() {
  if (!addForm.plate.trim()) {
    message.warning('请填写车牌号');
    return;
  }
  vehicleServiceRecords.value.unshift({
    id: `VS-${Date.now()}`,
    projectId: props.projectId,
    plate: addForm.plate,
    model: addForm.model,
    driver: addForm.driver || '未绑定',
    serviceClosed: false,
    liabilityInsurance: addForm.liabilityInsurance,
    compulsoryInsurance: addForm.compulsoryInsurance,
    commercialInsurance: addForm.commercialInsurance,
    inspection: addForm.inspection,
    operationPermit: addForm.operationPermit,
    maintenanceDate: addForm.maintenanceDate,
    maintenanceMileage: addForm.odometer,
    odometer: addForm.odometer,
    insuranceWarnDays: 30,
    inspectionWarnDays: 60,
    maintenanceWarnDays: 180,
    maintenanceWarnMileage: 10000
  });
  addVisible.value = false;
  message.success('车辆档案已新增');
}
</script>

<template>
  <section class="content list-screen vehicle-service-page">
    <div class="page-toolbar">
      <div>
        <h2>车务管理</h2>
        <span>集中管理车辆保险、年检、营运证和保养；触发阈值后同步提醒车队管理员。</span>
      </div>
      <div class="toolbar-actions">
        <input ref="fileInput" class="hidden-file-input" type="file" accept=".xlsx,.xls,.csv" @change="importExcel" />
        <a-button @click="fileInput?.click()"><CloudUploadOutlined />批量导入</a-button>
        <a-button @click="sendAlerts"><BellOutlined />推送提醒</a-button>
        <a-button type="primary" @click="addVisible = true"><PlusOutlined />新增车辆档案</a-button>
      </div>
    </div>

    <div class="metric-grid four">
      <div class="metric-card"><span>车辆总数</span><strong>{{ stats.total }}</strong></div>
      <div class="metric-card red"><span>保险提醒</span><strong>{{ stats.insurance }}</strong><small>到期 ≤30 天红 / ≤60 天黄</small></div>
      <div class="metric-card orange"><span>年检提醒</span><strong>{{ stats.inspection }}</strong><small>到期 ≤60 天</small></div>
      <div class="metric-card blue"><span>保养提醒</span><strong>{{ stats.maintenance }}</strong><small>默认 10,000 km / 180 天</small></div>
    </div>

    <div v-if="vehicleServiceAlertCount" class="vehicle-alert-bar">
      <BellOutlined />
      <span>当前有 {{ vehicleServiceAlertCount }} 台启用服务的车辆需要关注，提醒会同步到企微车队群。</span>
      <a-button type="link" size="small" @click="sendAlerts">立即推送</a-button>
    </div>

    <div class="filter-bar vehicle-filter-bar">
      <a-input v-model:value="keyword" allow-clear placeholder="搜索车牌、司机、车型">
        <template #prefix><SearchOutlined /></template>
      </a-input>
      <span>保险阈值、年检阈值、保养里程和天数可按车辆单独维护。</span>
    </div>

    <a-table :columns="columns" :data-source="rows" row-key="id" size="small" :pagination="{ pageSize: 10 }" :scroll="{ x: 1500 }" class="dense-table">
      <template #emptyText><a-empty description="暂无车辆档案" /></template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'vehicle'"><strong>{{ record.plate }}</strong><br /><span class="muted">{{ record.model }} · {{ record.driver }}</span></template>
        <template v-else-if="column.dataIndex === 'service'"><a-tag :color="record.serviceClosed ? 'default' : 'green'">{{ record.serviceClosed ? '服务关闭' : '服务中' }}</a-tag></template>
        <template v-else-if="['compulsoryInsurance', 'commercialInsurance', 'liabilityInsurance'].includes(column.dataIndex)">
          <span :class="`deadline ${severity(vehicleDateDiff(record[column.dataIndex]), record.insuranceWarnDays)}`">{{ record[column.dataIndex] }}</span><br />
          <small :class="severity(vehicleDateDiff(record[column.dataIndex]), record.insuranceWarnDays)">{{ dayText(vehicleDateDiff(record[column.dataIndex])) }}</small>
        </template>
        <template v-else-if="column.dataIndex === 'inspection'">
          <span :class="`deadline ${severity(inspectionDays(record), record.inspectionWarnDays)}`">{{ record.inspection }}</span><br />
          <small :class="severity(inspectionDays(record), record.inspectionWarnDays)">{{ dayText(inspectionDays(record)) }}</small>
        </template>
        <template v-else-if="column.dataIndex === 'operationPermit'">{{ record.operationPermit }}<br /><small>{{ dayText(vehicleDateDiff(record.operationPermit)) }}</small></template>
        <template v-else-if="column.dataIndex === 'maintenance'">
          <span :class="maintenanceSeverity(record)">{{ record.odometer.toLocaleString() }} km</span><br />
          <small :class="maintenanceSeverity(record)">距保养 {{ maintenanceMileageLeft(record).toLocaleString() }} km / 上次 {{ record.maintenanceDate }}</small>
        </template>
        <template v-else-if="column.dataIndex === 'alert'">
          <a-tag v-if="record.serviceClosed" color="default">服务关闭，不推送</a-tag>
          <a-tag v-else-if="insuranceDays(record) <= record.insuranceWarnDays" color="red">保险到期</a-tag>
          <a-tag v-else-if="inspectionDays(record) <= record.inspectionWarnDays" color="orange">年检提醒</a-tag>
          <a-tag v-else-if="maintenanceDue(record)" color="red">保养到期</a-tag>
          <a-tag v-else color="green">正常</a-tag>
        </template>
        <template v-else-if="column.dataIndex === 'action'">
          <div class="row-actions">
            <a-button size="small" @click="showSettings(record)"><SettingOutlined />阈值</a-button>
            <a-button size="small" @click="toggleService(record)">{{ record.serviceClosed ? '开启服务' : '关闭服务' }}</a-button>
          </div>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="settingsVisible" title="车辆档案提醒阈值" width="620px" ok-text="保存配置" @ok="saveSettings">
      <template v-if="selectedRecord">
        <div class="settings-head"><strong>{{ selectedRecord.plate }}</strong><span>{{ selectedRecord.model }} · {{ selectedRecord.driver }}</span></div>
        <div class="settings-grid">
          <label><span>保险提醒（天）</span><a-input-number v-model:value="settingsDraft.insuranceWarnDays" :min="1" addon-after="天" /></label>
          <label><span>年检提醒（天）</span><a-input-number v-model:value="settingsDraft.inspectionWarnDays" :min="1" addon-after="天" /></label>
          <label><span>保养周期（天）</span><a-input-number v-model:value="settingsDraft.maintenanceWarnDays" :min="1" addon-after="天" /></label>
          <label><span>保养周期（里程）</span><a-input-number v-model:value="settingsDraft.maintenanceWarnMileage" :min="1000" :step="1000" addon-after="km" /></label>
        </div>
      </template>
    </a-modal>

    <a-modal v-model:open="addVisible" title="新增车辆档案" width="800px" ok-text="保存车辆" @ok="saveAdd">
      <div class="add-grid">
        <label><span>车牌号 *</span><a-input v-model:value="addForm.plate" /></label>
        <label><span>车型</span><a-select v-model:value="addForm.model"><a-select-option value="燃油牵引车">燃油牵引车</a-select-option><a-select-option value="新能源重卡">新能源重卡</a-select-option></a-select></label>
        <label><span>绑定司机</span><a-input v-model:value="addForm.driver" /></label>
        <label><span>当前里程</span><a-input-number v-model:value="addForm.odometer" :min="0" addon-after="km" style="width:100%" /></label>
        <label><span>交强险到期</span><a-input v-model:value="addForm.compulsoryInsurance" /></label>
        <label><span>商业险到期</span><a-input v-model:value="addForm.commercialInsurance" /></label>
        <label><span>物流责任险到期</span><a-input v-model:value="addForm.liabilityInsurance" /></label>
        <label><span>年检到期</span><a-input v-model:value="addForm.inspection" /></label>
        <label><span>营运证到期</span><a-input v-model:value="addForm.operationPermit" /></label>
        <label><span>上次保养</span><a-input v-model:value="addForm.maintenanceDate" /></label>
      </div>
    </a-modal>
  </section>
</template>

<style scoped>
.page-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:12px}.page-toolbar h2{margin:0;font-size:18px}.page-toolbar span{color:#64748b;font-size:12px}.toolbar-actions,.row-actions{display:flex;align-items:center;gap:8px;white-space:nowrap}.hidden-file-input{display:none}.metric-card small{display:block;margin-top:4px;color:#94a3b8;font-size:10px;font-weight:400;line-height:14px}.vehicle-alert-bar{display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:9px 12px;border:1px solid #fecaca;background:#fff7f7;color:#b42318;font-size:12px}.vehicle-alert-bar .ant-btn{margin-left:auto}.vehicle-filter-bar{grid-template-columns:minmax(260px,420px) 1fr}.vehicle-filter-bar>span{align-self:center;color:#64748b;font-size:12px}.deadline.red,.red{color:#d92d20}.deadline.orange,.orange{color:#d97706}.deadline.green,.green{color:#16803c}.deadline{font-weight:700}.settings-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding:11px 12px;background:#f8fafc}.settings-head span{color:#64748b;font-size:12px}.settings-grid,.add-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 18px}.settings-grid label,.add-grid label{display:grid;grid-template-columns:120px 1fr;align-items:center;gap:10px;color:#475569;font-size:12px}.settings-grid :deep(.ant-input-number){width:100%}.add-grid label{grid-template-columns:108px 1fr}@media(max-width:900px){.settings-grid,.add-grid{grid-template-columns:1fr}.vehicle-filter-bar{grid-template-columns:1fr}}
</style>
