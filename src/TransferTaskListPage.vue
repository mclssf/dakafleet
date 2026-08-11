<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { CheckCircleOutlined, DownloadOutlined, EyeOutlined, InboxOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import TableColumnSettings from './TableColumnSettings.vue';

const props = defineProps<{ mode: 'import' | 'export' }>();
const emit = defineEmits<{ (e: 'change-mode', mode: 'import' | 'export'): void }>();
const project = ref('全部项目');
const business = ref('全部业务');
const status = ref('全部状态');
const keyword = ref('');
const pageSize = ref(20);
const importVisible = ref(false);
const importStep = ref(0);
const importProject = ref<string>();
const importBusiness = ref<string>();
const importFiles = ref<any[]>([]);
const importMappings = ref([
  { source: '维修日期', target: 'date', confidence: '高' },
  { source: '维修厂家', target: 'vendor', confidence: '高' },
  { source: '车牌', target: 'vehiclePlate', confidence: '高' },
  { source: '项目说明', target: 'description', confidence: '中' },
  { source: '金额(元)', target: 'amount', confidence: '高' },
  { source: '备注', target: 'remark', confidence: '高' }
]);
const systemFields = [
  { value: '', label: '不导入' }, { value: 'date', label: '日期 *' }, { value: 'vendor', label: '对方账户' },
  { value: 'vehiclePlate', label: '车牌号 *' }, { value: 'description', label: '维修内容 *' }, { value: 'amount', label: '支出金额 *' }, { value: 'remark', label: '备注' }
];
const mappingValid = computed(() => ['date', 'vehiclePlate', 'description', 'amount'].every((key) => importMappings.value.some((item) => item.target === key)) && new Set(importMappings.value.filter((item) => item.target).map((item) => item.target)).size === importMappings.value.filter((item) => item.target).length);

const projects = ['小帅科技有限公司综合项目', '小帅科技有限公司报销项目', '小帅科技有限公司磅单项目'];
const businesses = ['维修费用', '磅单', '报销明细', '充电明细', '轮胎费用'];
const rows = ref(Array.from({ length: 16 }, (_, index) => {
  const types = props.mode === 'import' ? ['维修费用导入', '磅单导入', '报销导入', '充电明细导入'] : ['维修费用导出', '磅单导出', '报销导出'];
  const type = types[index % types.length];
  const time = `${String(17 - Math.floor(index / 3)).padStart(2, '0')}:${String((51 - index * 7 + 60) % 60).padStart(2, '0')}`;
  const failed = props.mode === 'import' && index === 3;
  return {
    id: `${props.mode}-${index}`,
    type,
    file: `${type.replace('导入', '').replace('导出', '')}_${index % 2 ? '汇总表' : '明细'}_20260811_${time.replace(':', '')}.xlsx`,
    project: projects[index % projects.length],
    status: failed ? '部分失败' : '已完成',
    progress: 100,
    submitter: index > 11 ? '13344449999' : '本地联调真实姓名',
    submittedAt: `2026-08-${index > 12 ? '10' : '11'} ${time}`,
    completedAt: `2026-08-${index > 12 ? '10' : '11'} ${time}`,
    result: failed ? '成功 46 条，失败 2 条' : props.mode === 'import' ? `成功导入 ${32 + index * 3} 条` : '处理成功'
  };
}));

const filtered = computed(() => rows.value.filter((row) => {
  return (project.value === '全部项目' || row.project === project.value)
    && (business.value === '全部业务' || row.type.startsWith(business.value))
    && (status.value === '全部状态' || row.status === status.value)
    && (!keyword.value.trim() || row.file.includes(keyword.value.trim()) || row.submitter.includes(keyword.value.trim()));
}));
const taskStats = computed(() => ({ total: rows.value.length, completed: rows.value.filter((row) => row.status === '已完成').length, exception: rows.value.filter((row) => row.status !== '已完成').length }));
const baseTaskColumns = [
  { title:'类型', dataIndex:'type', width:130 }, { title:'文件', dataIndex:'file', width:240 }, { title:'项目', dataIndex:'project', width:210 },
  { title:'状态', dataIndex:'status', width:100 }, { title:'进度', dataIndex:'progress', width:150 }, { title:'提交人', dataIndex:'submitter', width:150 },
  { title:'提交时间', dataIndex:'submittedAt', width:160 }, { title:'完成时间', dataIndex:'completedAt', width:160 }, { title:'结果', dataIndex:'result', width:170 },
  { title:'操作', dataIndex:'action', fixed:'right', width:100 }
];
const taskFieldKeys = ref<string[]>(JSON.parse(localStorage.getItem('transfer-task-columns') || 'null') || baseTaskColumns.filter((column) => column.dataIndex !== 'action').map((column) => column.dataIndex));
watch(taskFieldKeys, (value) => localStorage.setItem('transfer-task-columns', JSON.stringify(value)), { deep:true });
const taskColumns = computed(() => [...taskFieldKeys.value.map((key) => baseTaskColumns.find((column) => column.dataIndex === key)).filter(Boolean), baseTaskColumns.find((column) => column.dataIndex === 'action')]);

function reset() { project.value = '全部项目'; business.value = '全部业务'; status.value = '全部状态'; keyword.value = ''; }
function act(row: typeof rows.value[number]) {
  message.success(props.mode === 'import' ? `已打开 ${row.file} 的导入明细` : `开始下载 ${row.file}`);
}
function openImport() { importStep.value = 0; importProject.value = undefined; importBusiness.value = undefined; importFiles.value = []; importVisible.value = true; }
function beforeUpload(file: any) { importFiles.value = [file]; return false; }
function nextImportStep() {
  if (importStep.value === 0 && (!importProject.value || !importBusiness.value)) { message.warning('请先选择项目和业务类型'); return; }
  if (importStep.value === 1 && !importFiles.value.length) { message.warning('请先选择需要导入的文件'); return; }
  if (importStep.value === 2 && !mappingValid.value) { message.warning('请完成必填字段映射，并移除重复映射'); return; }
  if (importStep.value < 3) importStep.value++;
}
function submitImport() {
  const now = '18:06';
  rows.value.unshift({ id: `import-${Date.now()}`, type: `${importBusiness.value}导入`, file: importFiles.value[0]?.name || '待导入文件.xlsx', project: importProject.value!, status: '已完成', progress: 100, submitter: '本地联调真实姓名', submittedAt: `2026-08-11 ${now}`, completedAt: `2026-08-11 ${now}`, result: '成功导入 48 条' });
  importVisible.value = false;
  message.success('导入任务已创建，可在列表中查看结果');
}
</script>

<template>
  <section class="content transfer-task-page">
    <div class="transfer-head"><div><h2>导入导出</h2><span>统一管理数据文件的导入、导出进度与处理结果</span></div><div class="head-actions"><a-button><ReloadOutlined />刷新</a-button><a-button v-if="mode === 'import'" type="primary" @click="openImport"><PlusOutlined />新建导入</a-button></div></div>
    <div class="transfer-tabs">
      <button :class="{ active: mode === 'import' }" @click="emit('change-mode', 'import')">导入任务</button>
      <button :class="{ active: mode === 'export' }" @click="emit('change-mode', 'export')">导出任务</button>
    </div>
    <div class="task-summary">
      <div><span>全部任务</span><strong>{{ taskStats.total }}</strong></div><div><span>处理完成</span><strong>{{ taskStats.completed }}</strong></div><div :class="{ attention: taskStats.exception }"><span>需处理</span><strong>{{ taskStats.exception }}</strong></div>
      <p v-if="mode === 'import'">导入异常不会写入业务数据，可进入详情修正后继续导入。</p><p v-else>导出文件生成后可在任务列表中随时下载。</p>
    </div>
    <div class="transfer-filters">
      <a-select v-model:value="project"><a-select-option value="全部项目">请选择项目</a-select-option><a-select-option v-for="item in projects" :key="item" :value="item">{{ item }}</a-select-option></a-select>
      <a-select v-model:value="business"><a-select-option value="全部业务">请选择业务类型</a-select-option><a-select-option v-for="item in businesses" :key="item" :value="item">{{ item }}</a-select-option></a-select>
      <a-select v-model:value="status"><a-select-option value="全部状态">请选择状态</a-select-option><a-select-option value="已完成">已完成</a-select-option><a-select-option value="部分失败">部分失败</a-select-option></a-select>
      <a-input v-model:value="keyword" allow-clear placeholder="搜索文件或提交人"><template #prefix><SearchOutlined /></template></a-input>
      <a-button @click="reset">重置</a-button><a-button type="primary">搜索</a-button><TableColumnSettings v-model="taskFieldKeys" :columns="baseTaskColumns" />
    </div>
    <a-table :columns="taskColumns" :data-source="filtered" row-key="id" size="small" :pagination="{ pageSize }" :scroll="{ x: 1420 }" class="dense-table transfer-table">
      <template #bodyCell="{ column, record }"><template v-if="column.dataIndex === 'status'"><a-tag :color="record.status === '已完成' ? 'green' : 'orange'">{{ record.status }}</a-tag></template><template v-else-if="column.dataIndex === 'progress'"><a-progress :percent="record.progress" size="small" /></template><template v-else-if="column.dataIndex === 'result'"><span :class="{ warning: record.status !== '已完成' }"><CheckCircleOutlined v-if="record.status === '已完成'" /> {{ record.result }}</span></template><template v-else-if="column.dataIndex === 'action'"><a-button type="link" size="small" @click="act(record)"><EyeOutlined v-if="mode === 'import'" /><DownloadOutlined v-else />{{ mode === 'import' ? '详情' : '下载' }}</a-button></template></template>
      <template #emptyText><a-empty description="暂无任务记录" /></template>
    </a-table>
    <div class="transfer-foot">共 {{ filtered.length }} 条记录 <a-select v-model:value="pageSize" size="small"><a-select-option :value="20">20条/页</a-select-option><a-select-option :value="50">50条/页</a-select-option></a-select></div>

    <a-modal v-if="mode === 'import'" v-model:open="importVisible" title="新建导入任务" width="760px" :footer="null">
      <a-steps :current="importStep" size="small" class="import-steps" :items="[{ title: '选择业务' }, { title: '上传文件' }, { title: '字段映射' }, { title: '校验确认' }]" />
      <div class="import-step-body">
        <div v-if="importStep === 0" class="import-choice-grid">
          <label><span>所属项目 *</span><a-select v-model:value="importProject" placeholder="请选择项目"><a-select-option v-for="item in projects" :key="item" :value="item">{{ item }}</a-select-option></a-select></label>
          <label><span>业务类型 *</span><a-select v-model:value="importBusiness" placeholder="请选择业务类型"><a-select-option v-for="item in businesses" :key="item" :value="item">{{ item }}</a-select-option></a-select></label>
          <a-alert class="wide" type="info" show-icon message="选择业务类型后，系统会自动匹配对应模板和必填字段。" />
        </div>
        <div v-else-if="importStep === 1">
          <a-upload-dragger :file-list="importFiles" :before-upload="beforeUpload" :max-count="1" accept=".xlsx,.xls,.csv,.pdf,.jpg,.jpeg,.png,.webp" @remove="importFiles = []">
            <p class="ant-upload-drag-icon"><InboxOutlined /></p><p class="ant-upload-text">点击或拖拽文件到此处</p><p class="ant-upload-hint">支持 Excel、CSV、PDF 和图片；表格最大 10 MB，PDF 最大 20 MB</p>
          </a-upload-dragger>
          <div class="upload-aids"><a-button type="link"><DownloadOutlined />下载{{ importBusiness }}导入模板</a-button><span>文件仅用于当前项目，导入前不会写入业务数据</span></div>
        </div>
        <div v-else-if="importStep === 2" class="mapping-panel">
          <div class="mapping-head"><span>源文件字段</span><span>系统字段</span><span>匹配度</span></div>
          <div v-for="item in importMappings" :key="item.source" class="mapping-row"><span>{{ item.source }}</span><a-select v-model:value="item.target"><a-select-option v-for="field in systemFields" :key="field.value" :value="field.value">{{ field.label }}</a-select-option></a-select><a-tag :color="item.confidence === '高' ? 'green' : 'orange'">{{ item.confidence }}</a-tag></div>
          <a-alert v-if="!mappingValid" type="error" show-icon message="日期、车牌号、维修内容、支出金额必须映射，且系统字段不能重复。" />
        </div>
        <div v-else class="validation-summary">
          <CheckCircleOutlined /><h3>预校验完成</h3><p>共识别 50 条数据，48 条可直接导入，2 条缺少车牌号。</p>
          <div><span>可导入<strong>48</strong></span><span>待补全<strong class="orange">2</strong></span><span>重复数据<strong>0</strong></span></div>
          <a-checkbox checked>仅导入校验通过的数据，异常数据保留在任务详情中</a-checkbox>
        </div>
      </div>
      <div class="import-actions"><a-button @click="importVisible = false">取消</a-button><a-button v-if="importStep > 0" @click="importStep--">上一步</a-button><a-button v-if="importStep < 3" type="primary" @click="nextImportStep">下一步</a-button><a-button v-else type="primary" @click="submitImport">确认导入 48 条</a-button></div>
    </a-modal>
  </section>
</template>

<style scoped>
.transfer-task-page { min-width:0; }.transfer-head,.head-actions { display:flex; align-items:center; justify-content:space-between; gap:8px; }.transfer-head { margin-bottom:14px; }.transfer-head h2 { margin:0; font-size:18px; }.transfer-head span { color:#64748b; font-size:12px; }.transfer-filters { display:grid; grid-template-columns:1.1fr 1fr .9fr 1fr auto auto; gap:10px; padding:16px; margin-bottom:12px; background:#fff; border:1px solid #e5e7eb; border-radius:8px; }.transfer-table { background:#fff; }.transfer-foot { display:flex; align-items:center; gap:10px; margin-top:10px; color:#64748b; font-size:12px; }.warning { color:#d97706; }
.transfer-tabs { display:flex; gap:24px; border-bottom:1px solid #e5e7eb; margin-bottom:12px; }.transfer-tabs button { position:relative; padding:10px 2px; border:0; background:transparent; color:#64748b; cursor:pointer; }.transfer-tabs button.active { color:#111827; font-weight:700; }.transfer-tabs button.active::after { content:''; position:absolute; left:0; right:0; bottom:-1px; height:2px; background:#1677ff; }.task-summary { display:flex; align-items:stretch; gap:10px; margin-bottom:12px; }.task-summary > div { min-width:120px; padding:10px 14px; background:#fff; border:1px solid #e5e7eb; border-radius:7px; }.task-summary span,.task-summary strong { display:block; }.task-summary span { color:#64748b; font-size:12px; }.task-summary strong { margin-top:2px; font-size:20px; }.task-summary .attention { border-color:#fed7aa; background:#fff7ed; }.task-summary .attention strong { color:#c2410c; }.task-summary p { flex:1; align-self:center; margin:0; color:#64748b; font-size:12px; text-align:right; }
.import-steps { padding:8px 4px 22px; }.import-step-body { min-height:320px; padding:20px; border:1px solid #e5e7eb; background:#fafafa; border-radius:8px; }.import-choice-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }.import-choice-grid label { display:flex; flex-direction:column; gap:7px; }.import-choice-grid .wide { grid-column:1/-1; }.upload-aids { display:flex; align-items:center; justify-content:space-between; margin-top:10px; color:#64748b; font-size:12px; }.mapping-head,.mapping-row { display:grid; grid-template-columns:1fr 1.3fr 70px; align-items:center; gap:12px; }.mapping-head { padding:0 10px 8px; color:#64748b; font-size:12px; }.mapping-row { padding:8px 10px; border-top:1px solid #e5e7eb; background:#fff; }.mapping-panel :deep(.ant-alert) { margin-top:12px; }.validation-summary { display:flex; flex-direction:column; align-items:center; gap:10px; padding-top:25px; }.validation-summary > .anticon { color:#16a34a; font-size:38px; }.validation-summary h3,.validation-summary p { margin:0; }.validation-summary > div { display:flex; gap:12px; margin:12px 0; }.validation-summary > div span { min-width:120px; padding:12px; text-align:center; background:#fff; border:1px solid #e5e7eb; border-radius:6px; color:#64748b; }.validation-summary strong { display:block; color:#111827; font-size:24px; }.validation-summary strong.orange { color:#d97706; }.import-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:16px; }
@media (max-width: 1100px) { .transfer-filters { grid-template-columns:1fr 1fr 1fr; } }
</style>
