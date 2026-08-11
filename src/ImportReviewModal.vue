<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { CheckCircleOutlined, FileExcelOutlined, WarningOutlined } from '@ant-design/icons-vue';

// 表格导入预览：选文件（模拟）→ 列名自动匹配 → 异常行标红可修 → 确认导入。
// 轮胎 / 维修 / 充电三页共用，字段与示例数据由调用页配置。
export interface ImportColumn {
  key: string;
  label: string;
  // 表格里可能出现的原始列名（用于展示"列名自动匹配"结果）
  sourceNames: string[];
  required?: boolean;
  type?: 'text' | 'number';
}

const props = defineProps<{
  open: boolean;
  title: string;
  columns: ImportColumn[];
  // 模拟解析出的表格行（含故意的缺失/异常，演示标红）
  sampleRows: Array<Record<string, string | number | null>>;
  fileName: string;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'confirm', rows: Array<Record<string, string | number | null>>): void;
}>();

const rows = ref<Array<Record<string, string | number | null>>>([]);
const selectedKeys = ref<number[]>([]);
const fieldMappings = ref<Record<string, string>>({});

const mappedColumns = computed(() => props.columns.flatMap((sourceColumn) => {
  const target = props.columns.find((column) => column.key === fieldMappings.value[sourceColumn.key]);
  return target ? [{ ...target, sourceKey: sourceColumn.key, sourceLabel: sourceColumn.sourceNames[0] }] : [];
}));
const mappingIssues = computed(() => {
  const targets = Object.values(fieldMappings.value).filter(Boolean);
  const missing = props.columns.filter((column) => column.required && !targets.includes(column.key)).map((column) => column.label);
  const duplicate = targets.find((key, index) => targets.indexOf(key) !== index);
  return duplicate ? ['系统字段不能重复映射'] : missing.map((label) => `缺少“${label}”映射`);
});

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    fieldMappings.value = Object.fromEntries(props.columns.map((column) => [column.key, column.key]));
    rows.value = props.sampleRows.map((row, index) => ({ ...row, __key: index }));
    // 默认勾选校验通过的行，异常行留给用户修完再勾
    selectedKeys.value = rows.value.filter((row) => !rowIssues(row).length).map((row) => Number(row.__key));
  }
);

function rowIssues(row: Record<string, string | number | null>) {
  return mappedColumns.value
    .filter((column) => column.required)
    .filter((column) => {
      const value = row[column.sourceKey];
      return value === null || value === undefined || String(value).trim() === '';
    })
    .map((column) => column.label);
}

const issueCount = computed(() => rows.value.filter((row) => rowIssues(row).length).length);

function confirmImport() {
  const chosen = rows.value.filter((row) => selectedKeys.value.includes(Number(row.__key)));
  if (!chosen.length) return;
  const stillInvalid = chosen.filter((row) => rowIssues(row).length);
  if (stillInvalid.length) return;
  emit(
    'confirm',
    chosen.map((row) => {
      const clean: Record<string, string | number | null> = {};
      mappedColumns.value.forEach((column) => { clean[column.key] = row[column.sourceKey] ?? null; });
      return clean;
    })
  );
  emit('update:open', false);
}

const confirmDisabled = computed(() => {
  const chosen = rows.value.filter((row) => selectedKeys.value.includes(Number(row.__key)));
  return !!mappingIssues.value.length || !chosen.length || chosen.some((row) => rowIssues(row).length);
});
</script>

<template>
  <a-modal
    :open="open"
    :title="title"
    width="960px"
    cancel-text="取消"
    @update:open="emit('update:open', $event)"
    @cancel="emit('update:open', false)"
  >
    <div class="table-import">
      <div class="import-progress"><span class="done">1 选择文件</span><i></i><span class="active">2 映射与校验</span><i></i><span>3 确认导入</span></div>
      <div class="table-import-file">
        <FileExcelOutlined />
        <div>
          <strong>{{ fileName }}</strong>
          <span>已解析 {{ rows.length }} 行 · 列名自动匹配完成</span>
        </div>
        <div class="table-import-file-state">
          <a-tag color="green"><CheckCircleOutlined /> {{ rows.length - issueCount }} 行可导入</a-tag>
          <a-tag v-if="issueCount" color="red"><WarningOutlined /> {{ issueCount }} 行缺必填项</a-tag>
        </div>
      </div>

      <div class="table-import-mapping">
        <span class="table-import-mapping-title">字段映射</span>
        <div v-for="sourceColumn in columns" :key="sourceColumn.key" class="table-import-map-row">
          <span>{{ sourceColumn.sourceNames[0] }}</span><b>→</b>
          <a-select v-model:value="fieldMappings[sourceColumn.key]" size="small" style="width: 132px">
            <a-select-option value="">不导入</a-select-option>
            <a-select-option v-for="target in columns" :key="target.key" :value="target.key">{{ target.label }}{{ target.required ? ' *' : '' }}</a-select-option>
          </a-select>
        </div>
        <a-alert v-if="mappingIssues.length" type="error" show-icon :message="mappingIssues.join('；')" />
      </div>

      <div class="table-import-grid-wrap">
        <table class="table-import-grid">
          <thead>
            <tr>
              <th class="check-col"></th>
              <th v-for="column in mappedColumns" :key="column.sourceKey">
                {{ column.label }}<i v-if="column.required">*</i>
              </th>
              <th>校验</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="Number(row.__key)" :class="{ invalid: rowIssues(row).length }">
              <td class="check-col">
                <a-checkbox
                  :checked="selectedKeys.includes(Number(row.__key))"
                  :disabled="rowIssues(row).length > 0"
                  @update:checked="(checked: boolean) => {
                    selectedKeys = checked
                      ? [...selectedKeys, Number(row.__key)]
                      : selectedKeys.filter((key) => key !== Number(row.__key));
                  }"
                />
              </td>
              <td v-for="column in mappedColumns" :key="column.sourceKey">
                <a-input-number
                  v-if="column.type === 'number'"
                  :value="row[column.sourceKey] === null ? undefined : Number(row[column.sourceKey])"
                  size="small"
                  style="width: 100%"
                  @update:value="(value: number | null) => { row[column.sourceKey] = value; if (!rowIssues(row).length && !selectedKeys.includes(Number(row.__key))) selectedKeys = [...selectedKeys, Number(row.__key)]; }"
                />
                <a-input
                  v-else
                  :value="row[column.sourceKey] === null ? '' : String(row[column.sourceKey])"
                  size="small"
                  @update:value="(value: string) => { row[column.sourceKey] = value; if (!rowIssues(row).length && !selectedKeys.includes(Number(row.__key))) selectedKeys = [...selectedKeys, Number(row.__key)]; }"
                />
              </td>
              <td>
                <a-tag v-if="rowIssues(row).length" color="red">缺 {{ rowIssues(row).join('、') }}</a-tag>
                <a-tag v-else color="green">通过</a-tag>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template #footer>
      <span class="table-import-footer-hint">已选 {{ selectedKeys.length }} / {{ rows.length }} 行；异常行补全必填项后自动加入</span>
      <a-button @click="emit('update:open', false)">取消</a-button>
      <a-button type="primary" :disabled="confirmDisabled" @click="confirmImport">确认导入 {{ selectedKeys.length }} 行</a-button>
    </template>
  </a-modal>
</template>

<style scoped>
.table-import {
  max-height: 62vh;
  overflow-y: auto;
}
.import-progress { display:flex; align-items:center; justify-content:center; gap:8px; margin:0 0 14px; color:#94a3b8; font-size:12px; }.import-progress span { white-space:nowrap; }.import-progress span.done { color:#16a34a; }.import-progress span.active { color:#1677ff; font-weight:700; }.import-progress i { width:54px; height:1px; background:#e2e8f0; }

.table-import-file {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #bbf7d0;
  border-radius: 9px;
  background: #f0fdf4;
  margin-bottom: 10px;
}

.table-import-file > span:first-child,
.table-import-file :deep(.anticon) {
  color: #16a34a;
  font-size: 22px;
}

.table-import-file strong {
  display: block;
  font-size: 13px;
}

.table-import-file span {
  display: block;
  color: #64748b;
  font-size: 12px;
}

.table-import-file-state {
  margin-left: auto;
  display: flex;
  gap: 6px;
}

.table-import-mapping {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.table-import-mapping-title {
  color: #475569;
  font-size: 12px;
  font-weight: 700;
  margin-right: 4px;
}

.table-import-map-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 9px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
}
.table-import-map-row > span { min-width: 68px; color: #475569; }.table-import-map-row > b { color: #94a3b8; }
.table-import-mapping :deep(.ant-alert) { width: 100%; padding: 5px 9px; }

.table-import-map-chip b {
  color: #0f172a;
}

.table-import-grid-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.table-import-grid {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.table-import-grid th {
  padding: 8px 10px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  text-align: left;
  white-space: nowrap;
}

.table-import-grid th i {
  color: #dc2626;
  font-style: normal;
  margin-left: 2px;
}

.table-import-grid td {
  padding: 6px 10px;
  border-bottom: 1px solid #f1f5f9;
  min-width: 110px;
}

.table-import-grid tr.invalid {
  background: #fef2f2;
}

.check-col {
  width: 34px;
  min-width: 34px;
}

.table-import-footer-hint {
  float: left;
  margin-top: 6px;
  color: #94a3b8;
  font-size: 12px;
}
</style>
