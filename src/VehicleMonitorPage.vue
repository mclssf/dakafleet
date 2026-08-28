<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  CarOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  FullscreenOutlined,
  ReloadOutlined,
  WarningOutlined
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

type VehicleStatus = '空车' | '重车' | '故障' | '掉线';

interface MonitorVehicle {
  id: string;
  projectId: string;
  plate: string;
  driver: string;
  status: VehicleStatus;
  speed: number;
  mileage: number;
  remainingKm: number;
  battery: number;
  location: string;
  updatedAt: string;
  x: number;
  y: number;
  route: string;
}

const props = defineProps<{ projectId: string }>();

const statusFilter = ref<'全部' | VehicleStatus>('全部');
const selectedId = ref('monitor-1');
const autoRefresh = ref(true);

const monitorVehicles: MonitorVehicle[] = [
  { id: 'monitor-1', projectId: 'p1', plate: '赣J03528D', driver: '罗明', status: '重车', speed: 54, mileage: 382, remainingKm: 104, battery: 63, location: '德保高速 S60 · 百色方向', updatedAt: '10 秒前', x: 56, y: 31, route: '砚山储配站 → 广西德保电厂' },
  { id: 'monitor-2', projectId: 'p1', plate: '赣J01379D', driver: '邓华', status: '空车', speed: 48, mileage: 316, remainingKm: 68, battery: 74, location: '靖西南服务区 · G80', updatedAt: '18 秒前', x: 39, y: 46, route: '广西德保电厂 → 砚山储配站' },
  { id: 'monitor-3', projectId: 'p1', plate: '赣J00607D', driver: '程大昌', status: '重车', speed: 42, mileage: 426, remainingKm: 176, battery: 51, location: '田东收费站 · S13', updatedAt: '22 秒前', x: 68, y: 55, route: '广西华银装车点 → 砚山库' },
  { id: 'monitor-4', projectId: 'p1', plate: '赣J02906D', driver: '胡俊', status: '空车', speed: 36, mileage: 288, remainingKm: 223, battery: 82, location: '砚山北服务区 · G80', updatedAt: '35 秒前', x: 27, y: 67, route: '砚山储配站 → 广西德保电厂' },
  { id: 'monitor-5', projectId: 'p1', plate: '赣J05067D', driver: '张朴全', status: '故障', speed: 0, mileage: 189, remainingKm: 0, battery: 38, location: '百色物流园东门', updatedAt: '2 分钟前', x: 78, y: 35, route: '田东料场 → 广西华银厂区' },
  { id: 'monitor-6', projectId: 'p1', plate: '赣J09113D', driver: '赵云江', status: '重车', speed: 58, mileage: 354, remainingKm: 92, battery: 67, location: '德保电厂北门 · S60', updatedAt: '12 秒前', x: 72, y: 24, route: '砚山储配站 → 广西德保电厂' },
  { id: 'monitor-7', projectId: 'p1', plate: '赣J05857D', driver: '高洪伟', status: '掉线', speed: 0, mileage: 0, remainingKm: 0, battery: 0, location: '最后定位：靖西市区', updatedAt: '27 分钟前', x: 48, y: 76, route: '砚山库 → 靖西天桂库' },
  { id: 'monitor-8', projectId: 'p1', plate: '赣J05805D', driver: '邱红志', status: '空车', speed: 41, mileage: 247, remainingKm: 132, battery: 72, location: '富宁服务区 · G80', updatedAt: '15 秒前', x: 18, y: 42, route: '广西德保电厂 → 砚山储配站' },
  { id: 'monitor-9', projectId: 'p2', plate: '沪A20170A', driver: '王成', status: '重车', speed: 52, mileage: 203, remainingKm: 87, battery: 66, location: '曲靖北收费站', updatedAt: '16 秒前', x: 48, y: 42, route: '富源采石场 → 曲靖园区' },
  { id: 'monitor-10', projectId: 'p3', plate: '粤B98790D', driver: '何明军', status: '空车', speed: 39, mileage: 211, remainingKm: 118, battery: 71, location: '田东华银料场', updatedAt: '20 秒前', x: 63, y: 46, route: '田东华银料场 → 华银厂区' }
];

const rows = computed(() =>
  monitorVehicles.filter((vehicle) => vehicle.projectId === props.projectId && (statusFilter.value === '全部' || vehicle.status === statusFilter.value))
);
const selectedVehicle = computed(() => rows.value.find((vehicle) => vehicle.id === selectedId.value) ?? rows.value[0] ?? monitorVehicles[0]);
const overview = computed(() => ({
  total: monitorVehicles.filter((vehicle) => vehicle.projectId === props.projectId).length,
  empty: monitorVehicles.filter((vehicle) => vehicle.projectId === props.projectId && vehicle.status === '空车').length,
  loaded: monitorVehicles.filter((vehicle) => vehicle.projectId === props.projectId && vehicle.status === '重车').length,
  warning: monitorVehicles.filter((vehicle) => vehicle.projectId === props.projectId && vehicle.status === '故障').length,
  offline: monitorVehicles.filter((vehicle) => vehicle.projectId === props.projectId && vehicle.status === '掉线').length
}));
const mileageRank = computed(() => [...rows.value].sort((a, b) => b.mileage - a.mileage).slice(0, 10));
const alerts = computed(() => monitorVehicles.filter((vehicle) => vehicle.projectId === props.projectId && (vehicle.status === '故障' || vehicle.status === '掉线' || vehicle.battery < 45)));

function statusColor(status: VehicleStatus) {
  return status === '重车' ? '#e24b4a' : status === '故障' ? '#e28524' : status === '掉线' ? '#64748b' : '#18a875';
}

function cycleRefresh() {
  autoRefresh.value = !autoRefresh.value;
  message.success(autoRefresh.value ? '已开启实时刷新' : '已暂停实时刷新');
}

function refreshNow() {
  message.success('车辆定位已刷新');
}
</script>

<template>
  <section class="vehicle-monitor-screen">
    <div class="monitor-topbar">
      <div>
        <span>车辆 GPS 实时监控</span>
        <h2>车辆大屏监控</h2>
      </div>
      <div class="monitor-top-actions">
        <span class="live-state"><i :class="{ paused: !autoRefresh }"></i>{{ autoRefresh ? '定位实时刷新中' : '定位刷新已暂停' }}</span>
        <a-button @click="refreshNow"><ReloadOutlined />刷新定位</a-button>
        <a-button @click="cycleRefresh">{{ autoRefresh ? '暂停刷新' : '开启刷新' }}</a-button>
        <a-button type="primary" @click="message.success('已进入浏览器全屏模式')"><FullscreenOutlined />全屏</a-button>
      </div>
    </div>

    <div class="monitor-layout">
      <aside class="monitor-panel monitor-overview">
        <header><span>车队总览</span><b>{{ overview.total }} 辆</b></header>
        <button class="overview-stat" :class="{ active: statusFilter === '全部' }" @click="statusFilter = '全部'"><i></i><span>总车辆</span><strong>{{ overview.total }}</strong><em>辆</em></button>
        <button class="overview-stat empty" :class="{ active: statusFilter === '空车' }" @click="statusFilter = '空车'"><i></i><span>空车</span><strong>{{ overview.empty }}</strong><em>辆</em></button>
        <button class="overview-stat loaded" :class="{ active: statusFilter === '重车' }" @click="statusFilter = '重车'"><i></i><span>重车</span><strong>{{ overview.loaded }}</strong><em>辆</em></button>
        <button class="overview-stat warning" :class="{ active: statusFilter === '故障' }" @click="statusFilter = '故障'"><i></i><span>故障</span><strong>{{ overview.warning }}</strong><em>辆</em></button>
        <button class="overview-stat offline" :class="{ active: statusFilter === '掉线' }" @click="statusFilter = '掉线'"><i></i><span>掉线</span><strong>{{ overview.offline }}</strong><em>辆</em></button>

        <div class="monitor-filter-label">状态筛选</div>
        <div class="monitor-status-filters">
          <button :class="{ active: statusFilter === '全部' }" @click="statusFilter = '全部'">全部</button>
          <button :class="{ active: statusFilter === '空车' }" @click="statusFilter = '空车'">空车</button>
          <button :class="{ active: statusFilter === '重车' }" @click="statusFilter = '重车'">重车</button>
          <button :class="{ active: statusFilter === '故障' }" @click="statusFilter = '故障'">故障</button>
          <button :class="{ active: statusFilter === '掉线' }" @click="statusFilter = '掉线'">掉线</button>
        </div>

        <div class="today-overview">
          <span>今日概况</span>
          <div><b>总里程</b><strong>{{ mileageRank.reduce((sum, item) => sum + item.mileage, 0).toLocaleString() }} km</strong></div>
          <div><b>在途运单</b><strong>{{ overview.loaded + 2 }} 单</strong></div>
          <div><b>待处理告警</b><strong class="warning-text">{{ alerts.length }}</strong></div>
        </div>
      </aside>

      <main class="monitor-map">
        <div class="map-region-label label-a">砚山储配站</div>
        <div class="map-region-label label-b">靖西市</div>
        <div class="map-region-label label-c">广西德保电厂</div>
        <div class="map-region-label label-d">百色物流园</div>
        <div class="map-river river-one"></div>
        <div class="map-river river-two"></div>
        <i class="map-road road-a"></i><i class="map-road road-b"></i><i class="map-road road-c"></i><i class="map-road road-d"></i><i class="map-road road-e"></i>
        <i class="map-route route-a"></i><i class="map-route route-b"></i><i class="map-route route-c"></i>
        <span class="road-number road-a-no">G80</span><span class="road-number road-b-no">S60</span><span class="road-number road-c-no">S13</span>
        <button
          v-for="vehicle in rows"
          :key="vehicle.id"
          class="vehicle-point"
          :class="[`status-${vehicle.status}`, { selected: selectedVehicle?.id === vehicle.id }]"
          :style="{ left: `${vehicle.x}%`, top: `${vehicle.y}%`, '--vehicle-color': statusColor(vehicle.status) }"
          @click="selectedId = vehicle.id"
        >
          <span class="point-pulse"></span>
          <CarOutlined />
          <div v-if="selectedVehicle?.id === vehicle.id" class="vehicle-float-card">
            <header>{{ vehicle.plate }} <b>{{ vehicle.speed }} km/h</b></header>
            <div><span>行驶 {{ vehicle.mileage }} km</span><span>剩余 {{ vehicle.remainingKm }} km</span></div>
            <footer><i :style="{ width: `${vehicle.battery}%` }"></i><b>{{ vehicle.battery }}%</b><span>{{ vehicle.status }}</span></footer>
          </div>
        </button>

        <div class="map-legend">
          <span><i class="legend-empty"></i>空车</span><span><i class="legend-loaded"></i>重车</span><span><i class="legend-warning"></i>故障</span><span><i class="legend-offline"></i>掉线</span>
        </div>
        <div class="selected-vehicle-bar">
          <EnvironmentOutlined />
          <div><strong>{{ selectedVehicle?.plate }} · {{ selectedVehicle?.driver }}</strong><span>{{ selectedVehicle?.location }}</span></div>
          <a-tag :color="selectedVehicle?.status === '重车' ? 'red' : selectedVehicle?.status === '故障' ? 'orange' : selectedVehicle?.status === '掉线' ? 'default' : 'green'">{{ selectedVehicle?.status }}</a-tag>
          <em>{{ selectedVehicle?.updatedAt }}</em>
        </div>
      </main>

      <aside class="monitor-panel monitor-ranking">
        <header><span>今日里程排行</span><b>升序 TOP 10</b></header>
        <button v-for="(vehicle, index) in mileageRank" :key="vehicle.id" class="rank-row" :class="{ active: selectedVehicle?.id === vehicle.id }" @click="selectedId = vehicle.id">
          <i>{{ index + 1 }}</i>
          <span class="rank-status" :style="{ background: statusColor(vehicle.status) }"></span>
          <strong>{{ vehicle.plate }}</strong>
          <em>{{ vehicle.mileage }} km</em>
        </button>

        <div class="alert-queue">
          <header><span>告警队列</span><b>{{ alerts.length }} 条</b></header>
          <button v-for="vehicle in alerts" :key="`${vehicle.id}-alert`" @click="selectedId = vehicle.id">
            <WarningOutlined />
            <span><strong>{{ vehicle.plate }} · {{ vehicle.status === '掉线' ? '定位掉线' : vehicle.status === '故障' ? '车辆故障' : '低电量' }}</strong><em>{{ vehicle.location }}</em></span>
          </button>
          <div v-if="!alerts.length" class="alert-empty"><CheckCircleOutlined />暂无待处理告警</div>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.vehicle-monitor-screen{display:grid;height:100%;min-height:0;grid-template-rows:72px minmax(0,1fr);background:#eef4fa;color:#183047}.monitor-topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 20px;border-bottom:1px solid #d5e1eb;background:#fff}.monitor-topbar>div:first-child>span{display:block;color:#72839a;font-size:11px}.monitor-topbar h2{margin:2px 0 0;color:#183047;font-size:20px;line-height:26px}.monitor-top-actions{display:flex;align-items:center;gap:8px}.live-state{display:flex;align-items:center;gap:6px;margin-right:4px;color:#49708c;font-size:12px}.live-state i{width:7px;height:7px;border-radius:50%;background:#19ad7c;box-shadow:0 0 0 4px rgba(25,173,124,.13)}.live-state i.paused{background:#f1a12b;box-shadow:0 0 0 4px rgba(241,161,43,.13)}.monitor-layout{display:grid;min-height:0;grid-template-columns:248px minmax(680px,1fr) 270px;gap:12px;padding:12px}.monitor-panel{min-height:0;overflow:auto;padding:14px;border:1px solid #dce7f0;border-radius:6px;background:rgba(255,255,255,.94);box-shadow:0 4px 16px rgba(49,80,109,.08)}.monitor-panel>header,.alert-queue>header{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px;color:#1f3a52;font-size:14px;font-weight:700}.monitor-panel>header b,.alert-queue>header b{color:#90a1b1;font-size:11px;font-weight:600}.overview-stat{display:grid;grid-template-columns:8px 1fr auto 16px;align-items:center;gap:9px;width:100%;min-height:54px;margin-bottom:8px;padding:0 11px;border:1px solid #e0e9f1;border-radius:6px;background:#fff;color:#6c7e91;text-align:left;cursor:pointer}.overview-stat:hover,.overview-stat.active{border-color:#93b8d7;background:#f3f9ff}.overview-stat i{width:7px;height:7px;border-radius:50%;background:#4b86d1}.overview-stat.empty i{background:#20b887}.overview-stat.loaded i{background:#e64a4b}.overview-stat.warning i{background:#ec9b28}.overview-stat.offline i{background:#8492a1}.overview-stat span{font-size:13px}.overview-stat strong{color:#183047;font-size:24px;line-height:1}.overview-stat em{color:#8a9aab;font-size:11px;font-style:normal}.monitor-filter-label{margin:19px 0 8px;color:#8b9cac;font-size:12px}.monitor-status-filters{display:flex;flex-wrap:wrap;gap:7px}.monitor-status-filters button{height:29px;padding:0 9px;border:1px solid #dce7f0;border-radius:14px;background:#fff;color:#61748a;font-size:12px;cursor:pointer}.monitor-status-filters button.active{border-color:#72a7d4;background:#edf7ff;color:#2778b5}.today-overview{margin-top:20px;padding-top:15px;border-top:1px solid #e5edf3}.today-overview>span{display:block;margin-bottom:10px;color:#8b9cac;font-size:12px}.today-overview>div{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f4f7;font-size:12px}.today-overview b{color:#75869a;font-weight:500}.today-overview strong{color:#29465e}.warning-text{color:#db6a1e!important}.monitor-map{position:relative;min-height:0;overflow:hidden;border:1px solid #d3e2dd;border-radius:6px;background-color:#eff4ef;background-image:linear-gradient(28deg,rgba(255,255,255,.68) 12%,transparent 12.5%,transparent 87%,rgba(255,255,255,.68) 87.5%,rgba(255,255,255,.68)),linear-gradient(152deg,rgba(255,255,255,.68) 12%,transparent 12.5%,transparent 87%,rgba(255,255,255,.68) 87.5%,rgba(255,255,255,.68)),radial-gradient(circle at 19% 24%,rgba(132,191,124,.24) 0 5%,transparent 5.5%),radial-gradient(circle at 81% 71%,rgba(132,191,124,.23) 0 7%,transparent 7.5%);background-size:42px 72px,42px 72px,100% 100%,100% 100%;box-shadow:inset 0 0 50px rgba(55,93,72,.07)}.monitor-map:before{content:'';position:absolute;inset:0;opacity:.55;background-image:linear-gradient(90deg,transparent 49.8%,rgba(120,154,128,.12) 50%,transparent 50.2%),linear-gradient(transparent 49.8%,rgba(120,154,128,.12) 50%,transparent 50.2%);background-size:150px 150px;pointer-events:none}.map-river{position:absolute;height:34px;border:8px solid rgba(93,177,220,.6);border-left-color:transparent;border-right-color:transparent;border-radius:50%;transform:rotate(-23deg);filter:drop-shadow(0 0 1px rgba(255,255,255,.85))}.river-one{width:80%;left:4%;top:42%}.river-two{width:56%;right:-12%;top:8%;transform:rotate(35deg)}.map-road{position:absolute;z-index:1;height:9px;border:2px solid rgba(101,122,135,.25);border-radius:99px;background:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.45);transform-origin:left center}.road-a{width:115%;top:39%;left:-6%;transform:rotate(-20deg)}.road-b{width:102%;top:64%;left:8%;transform:rotate(18deg)}.road-c{width:94%;top:21%;left:20%;transform:rotate(33deg)}.road-d{width:84%;top:79%;left:-8%;transform:rotate(-9deg)}.road-e{width:74%;top:10%;left:30%;transform:rotate(81deg)}.map-route{position:absolute;z-index:2;height:4px;border-radius:99px;transform-origin:left center;opacity:.9}.route-a{width:70%;top:48%;left:15%;background:#1e88e5;transform:rotate(-24deg)}.route-b{width:58%;top:65%;left:22%;background:#8e49d7;transform:rotate(9deg)}.route-c{width:48%;top:29%;left:36%;background:#e54b4b;transform:rotate(34deg)}.road-number{position:absolute;z-index:3;padding:2px 5px;border-radius:2px;background:#68a84e;color:#fff;font-size:10px;font-weight:700}.road-a-no{top:40%;left:41%}.road-b-no{top:66%;left:58%}.road-c-no{top:25%;left:63%}.map-region-label{position:absolute;z-index:2;color:rgba(57,94,75,.73);font-size:17px;font-weight:700;text-shadow:0 1px 0 rgba(255,255,255,.8)}.label-a{left:12%;top:14%}.label-b{left:39%;top:37%}.label-c{right:12%;top:17%}.label-d{right:10%;bottom:18%}.vehicle-point{position:absolute;z-index:8;display:flex;align-items:center;justify-content:center;width:38px;height:38px;margin:-19px 0 0 -19px;border:3px solid #fff;border-radius:50%;background:var(--vehicle-color);color:#fff;box-shadow:0 3px 10px rgba(20,56,57,.3);cursor:pointer;transition:transform .18s,border-color .18s}.vehicle-point:hover,.vehicle-point.selected{z-index:12;transform:scale(1.1);border-color:#fff}.vehicle-point .anticon{font-size:19px}.point-pulse{position:absolute;width:54px;height:54px;border:2px solid var(--vehicle-color);border-radius:50%;opacity:.35;animation:pulse 2s infinite}.status-掉线{filter:grayscale(.4)}.vehicle-float-card{position:absolute;left:22px;bottom:26px;width:198px;border:1px solid rgba(31,120,90,.16);border-radius:5px;background:#fff;box-shadow:0 8px 22px rgba(41,76,85,.18);color:#304458;text-align:left;overflow:hidden;pointer-events:none}.vehicle-float-card header{display:flex;justify-content:space-between;padding:9px 10px;background:#20a977;color:#fff;font-size:13px;font-weight:700}.vehicle-float-card header b{font-size:12px}.vehicle-float-card>div{display:flex;justify-content:space-between;padding:9px 10px;color:#64748b;font-size:11px}.vehicle-float-card footer{display:flex;align-items:center;gap:7px;padding:7px 10px;border-top:1px solid #edf2f5;color:#64748b;font-size:11px}.vehicle-float-card footer i{height:5px;max-width:94px;border-radius:99px;background:#35b88a}.vehicle-float-card footer b{color:#e49725}.vehicle-float-card footer span{margin-left:auto;color:#20a977}.map-legend{position:absolute;z-index:7;left:14px;bottom:67px;display:flex;gap:12px;padding:8px 10px;border:1px solid rgba(201,215,220,.8);border-radius:4px;background:rgba(255,255,255,.9);color:#596f81;font-size:11px}.map-legend span{display:flex;align-items:center;gap:4px}.map-legend i{width:8px;height:8px;border-radius:50%}.legend-empty{background:#18a875}.legend-loaded{background:#e24b4a}.legend-warning{background:#e28524}.legend-offline{background:#64748b}.selected-vehicle-bar{position:absolute;z-index:10;right:14px;bottom:14px;display:flex;align-items:center;gap:9px;min-width:330px;padding:10px 12px;border:1px solid rgba(204,218,223,.9);border-radius:5px;background:rgba(255,255,255,.95);box-shadow:0 4px 12px rgba(45,75,85,.1)}.selected-vehicle-bar>.anticon{color:#1d9c70;font-size:18px}.selected-vehicle-bar>div{display:flex;flex-direction:column;min-width:0;margin-right:auto}.selected-vehicle-bar strong{color:#304458;font-size:12px}.selected-vehicle-bar span{overflow:hidden;color:#708396;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.selected-vehicle-bar em{color:#8a9aaa;font-size:11px;font-style:normal}.rank-row{display:grid;grid-template-columns:25px 8px 1fr auto;align-items:center;gap:7px;width:100%;min-height:42px;padding:0 7px;border:1px solid transparent;border-bottom-color:#edf2f6;background:transparent;color:#455f75;text-align:left;cursor:pointer}.rank-row:hover,.rank-row.active{border-color:#d8e9f6;border-radius:4px;background:#f5faff}.rank-row>i{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:3px;background:#f1f5f8;color:#8291a0;font-size:11px;font-style:normal;font-weight:700}.rank-row:nth-child(2)>i{background:#fff0c7;color:#b78017}.rank-status{width:7px;height:7px;border-radius:50%}.rank-row strong{font-size:12px}.rank-row em{color:#708396;font-size:11px;font-style:normal}.alert-queue{margin-top:17px;padding-top:14px;border-top:1px solid #e6eef3}.alert-queue>button{display:flex;align-items:flex-start;gap:8px;width:100%;padding:9px 4px;border:0;border-bottom:1px solid #edf2f6;background:transparent;color:#d77e23;text-align:left;cursor:pointer}.alert-queue>button:hover{background:#fff8ef}.alert-queue>button>.anticon{margin-top:2px}.alert-queue button span{display:flex;flex-direction:column;gap:3px;min-width:0}.alert-queue button strong{color:#55687a;font-size:12px}.alert-queue button em{overflow:hidden;color:#8b9bac;font-size:11px;font-style:normal;text-overflow:ellipsis;white-space:nowrap}.alert-empty{display:flex;align-items:center;gap:6px;padding:12px 0;color:#559b7a;font-size:12px}@keyframes pulse{0%,100%{transform:scale(.65);opacity:.35}55%{transform:scale(1);opacity:0}}@media(max-width:1200px){.monitor-layout{grid-template-columns:220px minmax(580px,1fr) 238px}.vehicle-float-card{width:180px}.monitor-top-actions .live-state{display:none}}@media(max-width:900px){.monitor-layout{grid-template-columns:210px minmax(520px,1fr)}.monitor-ranking{display:none}.monitor-topbar{padding:10px 14px}.monitor-top-actions .ant-btn:nth-child(3){display:none}}
</style>
