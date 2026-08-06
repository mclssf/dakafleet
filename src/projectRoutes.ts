import { computed, ref } from 'vue';

// 项目线路映射：客户在项目下自行配置线路，并声明发/收货单位的可能写法（别名）。
// 磅单审核时按「发货单位命中 + 收货单位命中（双端）」把磅单映射到标准线路并自动回填；
// 线路计算配置（含税单价 / 司机工资）也以标准线路名为 key，避免别名把同一线路裂成多条。
export interface ProjectRoute {
  id: string;
  projectId: string;
  name: string;
  shipperAliases: string[];
  receiverAliases: string[];
  enabled: boolean;
}

// 种子数据取自真实磅单组合；p1 的「云南煤炭交易中心 / 全称」正是别名裂线路的实例
export const projectRoutes = ref<ProjectRoute[]>([
  {
    id: 'pr-1',
    projectId: 'p1',
    name: '砚山-德保电厂',
    shipperAliases: ['云南省煤炭交易（储配）中心有限公司', '云南煤炭交易中心'],
    receiverAliases: ['广西德保电厂', '德保电厂'],
    enabled: true
  },
  {
    id: 'pr-2',
    projectId: 'p1',
    name: '砚山-华银',
    shipperAliases: ['云南砚山矿务'],
    receiverAliases: ['广西华银铝业'],
    enabled: true
  },
  {
    id: 'pr-3',
    projectId: 'p2',
    name: '富源-曲靖园区',
    shipperAliases: ['富源采石场'],
    receiverAliases: ['曲靖园区料场', '曲靖料场'],
    enabled: true
  },
  {
    id: 'pr-4',
    projectId: 'p2',
    name: '曲靖-宣威',
    shipperAliases: ['曲靖料场'],
    receiverAliases: ['宣威搅拌站'],
    enabled: true
  },
  {
    id: 'pr-5',
    projectId: 'p3',
    name: '华银-田东',
    shipperAliases: ['广西华银铝业', '华银铝业'],
    receiverAliases: ['田东华银料场', '田东料场'],
    enabled: true
  }
]);

export const routesByProject = computed(() => {
  const map = new Map<string, ProjectRoute[]>();
  projectRoutes.value.forEach((route) => {
    const bucket = map.get(route.projectId);
    if (bucket) bucket.push(route);
    else map.set(route.projectId, [route]);
  });
  return map;
});

function aliasHit(aliases: string[], text: string) {
  const clean = text.trim();
  if (!clean) return false;
  return aliases.some((alias) => alias === clean);
}

// 双端都命中才回填；只命中一边或都未命中返回 null，由审核页标疑点
export function matchProjectRoute(projectId: string, shipper: string, receiver: string): ProjectRoute | null {
  const candidates = routesByProject.value.get(projectId) ?? [];
  return (
    candidates.find(
      (route) => route.enabled && aliasHit(route.shipperAliases, shipper) && aliasHit(route.receiverAliases, receiver)
    ) ?? null
  );
}

export function addProjectRoute(route: Omit<ProjectRoute, 'id' | 'enabled'>) {
  projectRoutes.value.unshift({
    ...route,
    id: `pr-${Date.now()}-${projectRoutes.value.length}`,
    enabled: true
  });
}

export function removeProjectRoute(id: string) {
  projectRoutes.value = projectRoutes.value.filter((route) => route.id !== id);
}
