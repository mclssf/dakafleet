<script setup lang="ts">
import { FileExcelOutlined, FileImageOutlined, HistoryOutlined, RightOutlined } from '@ant-design/icons-vue';

defineProps<{ open: boolean; entity: string; receiptHint?: string }>();
const emit = defineEmits<{ (e: 'update:open', value: boolean): void; (e: 'select', source: 'table' | 'receipt'): void }>();
function select(source: 'table' | 'receipt') { emit('update:open', false); emit('select', source); }
</script>

<template>
  <a-modal :open="open" :title="`导入${entity}`" width="680px" :footer="null" @cancel="emit('update:open', false)">
    <p class="source-lead">选择数据来源，上传后可核对字段映射和异常数据，确认前不会写入正式列表。</p>
    <div class="source-options">
      <button type="button" @click="select('table')"><FileExcelOutlined class="excel" /><span><strong>表格批量导入</strong><small>适合一次导入多条结构化数据</small><em>XLSX、XLS、CSV · 最大 10 MB</em></span><RightOutlined /></button>
      <button type="button" @click="select('receipt')"><FileImageOutlined class="vision" /><span><strong>凭证智能识别</strong><small>{{ receiptHint || '识别图片或 PDF 中的业务字段' }}</small><em>PDF、JPG、PNG、WEBP · 最大 20 MB</em></span><RightOutlined /></button>
    </div>
    <div class="source-note"><HistoryOutlined /><span>系统会记住本次字段映射，下次导入同类文件时自动匹配。</span></div>
  </a-modal>
</template>

<style scoped>
.source-lead { margin:0 0 14px; color:#64748b; font-size:13px; }.source-options { display:grid; grid-template-columns:1fr 1fr; gap:12px; }.source-options button { display:grid; grid-template-columns:42px 1fr 16px; align-items:center; gap:10px; min-height:116px; padding:16px; border:1px solid #e2e8f0; border-radius:8px; background:#fff; text-align:left; cursor:pointer; transition:.15s ease; }.source-options button:hover { border-color:#1677ff; box-shadow:0 0 0 2px rgba(22,119,255,.08); }.source-options button > .anticon:first-child { display:grid; place-items:center; width:42px; height:42px; border-radius:7px; font-size:22px; }.source-options .excel { color:#15803d; background:#f0fdf4; }.source-options .vision { color:#c2410c; background:#fff7ed; }.source-options span { min-width:0; }.source-options strong,.source-options small,.source-options em { display:block; }.source-options strong { color:#0f172a; font-size:14px; }.source-options small { margin-top:4px; color:#475569; }.source-options em { margin-top:8px; color:#94a3b8; font-size:11px; font-style:normal; }.source-options button > .anticon:last-child { color:#94a3b8; }.source-note { display:flex; gap:7px; align-items:center; margin-top:14px; padding:9px 10px; background:#f8fafc; color:#64748b; font-size:12px; border-radius:6px; }
</style>
