import { ref } from 'vue';

// 用户修正记忆：审核页人工把识别值改成 X 的动作，是最可靠的别名来源。
// 磅单审核保存时自动 diff 沉淀到这里，运营在企业字典里确认后转为正式别名。
// 维度是开放集合（与企业字典的可自定义维度对应），车牌号/驾驶员属受控字段单独分流
export type MemoryDimension = string;

export interface CorrectionMemory {
  id: string;
  dimension: MemoryDimension;
  from: string;
  to: string;
  count: number;
  lastAt: string;
  source: string;
}

// 预置几条演示数据，与 weighBills 里的真实值对应
export const correctionMemories = ref<CorrectionMemory[]>([
  {
    id: 'mem-1',
    dimension: '发货单位',
    from: '云南煤炭交易中心',
    to: '云南省煤炭交易（储配）中心有限公司',
    count: 3,
    lastAt: '2026-06-29',
    source: '磅单审核'
  },
  {
    id: 'mem-2',
    dimension: '磅单员',
    from: '陈会记',
    to: '陈会计',
    count: 2,
    lastAt: '2026-06-28',
    source: '磅单审核'
  }
]);

const dimensionByField: Record<string, MemoryDimension> = {
  shipper: '发货单位',
  receiver: '收货单位',
  goods: '货物名称',
  carrier: '客户',
  maker: '磅单员',
  driver: '驾驶员',
  vehiclePlate: '车牌号'
};

export function dimensionForField(fieldKey: string): MemoryDimension | undefined {
  return dimensionByField[fieldKey];
}

// 相同 维度+原值+改后值 累加次数，否则新增一条
export function recordCorrection(dimension: MemoryDimension, from: string, to: string, at: string, source = '磅单审核') {
  const cleanFrom = from.trim();
  const cleanTo = to.trim();
  if (!cleanFrom || !cleanTo || cleanFrom === cleanTo) return;
  const existing = correctionMemories.value.find(
    (item) => item.dimension === dimension && item.from === cleanFrom && item.to === cleanTo
  );
  if (existing) {
    existing.count += 1;
    existing.lastAt = at;
    return;
  }
  correctionMemories.value.unshift({
    id: `mem-${Date.now()}-${correctionMemories.value.length}`,
    dimension,
    from: cleanFrom,
    to: cleanTo,
    count: 1,
    lastAt: at,
    source
  });
}

export function removeCorrectionMemory(id: string) {
  correctionMemories.value = correctionMemories.value.filter((item) => item.id !== id);
}
