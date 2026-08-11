<script setup lang="ts">
import { computed } from 'vue';
import { DownOutlined, SettingOutlined, UpOutlined } from '@ant-design/icons-vue';

const props = defineProps<{ columns: Array<{ title: string; dataIndex?: string }>; modelValue: string[] }>();
const emit = defineEmits<{ (e: 'update:modelValue', value: string[]): void }>();
const configurable = computed(() => props.columns.filter((column) => column.dataIndex && column.dataIndex !== 'action'));
function toggle(key: string, checked: boolean) { emit('update:modelValue', checked ? [...props.modelValue, key] : props.modelValue.filter((item) => item !== key)); }
function move(key: string, direction: -1 | 1) { const value = [...props.modelValue]; const index = value.indexOf(key); const next = index + direction; if (index < 0 || next < 0 || next >= value.length) return; [value[index], value[next]] = [value[next], value[index]]; emit('update:modelValue', value); }
function reset() { emit('update:modelValue', configurable.value.map((column) => column.dataIndex!)); }
</script>

<template>
  <a-popover trigger="click" placement="bottomRight" overlay-class-name="column-settings-popover">
    <a-button><SettingOutlined />字段设置</a-button>
    <template #content>
      <div class="column-settings">
        <div class="settings-head"><strong>表格字段</strong><a-button type="link" size="small" @click="reset">恢复默认</a-button></div>
        <p>勾选展示字段，使用箭头调整顺序</p>
        <div class="settings-list">
          <div v-for="column in configurable" :key="column.dataIndex" class="settings-row">
            <a-checkbox :checked="modelValue.includes(column.dataIndex!)" @update:checked="(checked: boolean) => toggle(column.dataIndex!, checked)">{{ column.title }}</a-checkbox>
            <span v-if="modelValue.includes(column.dataIndex!)"><a-button type="text" size="small" title="上移" @click="move(column.dataIndex!, -1)"><UpOutlined /></a-button><a-button type="text" size="small" title="下移" @click="move(column.dataIndex!, 1)"><DownOutlined /></a-button></span>
          </div>
        </div>
      </div>
    </template>
  </a-popover>
</template>

<style scoped>
.column-settings { width:270px; }.settings-head { display:flex; align-items:center; justify-content:space-between; }.column-settings p { margin:0 0 8px; color:#94a3b8; font-size:12px; }.settings-list { max-height:360px; overflow:auto; }.settings-row { display:flex; align-items:center; justify-content:space-between; min-height:34px; border-top:1px solid #f1f5f9; }.settings-row > span { display:flex; }.settings-row :deep(.ant-btn) { width:26px; padding:0; }
</style>
