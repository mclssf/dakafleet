import { computed, ref } from 'vue';
import { expenseImages, vehicles } from './data';

export type TripReviewStatus = '待提交' | '待审核' | '已审核' | '已驳回' | '有疑点';

export interface TripLeg {
  id: string;
  waybillNo: string;
  weighbillNo: string;
  loadingTime: string;
  unloadingTime: string;
  goods: string;
  weight: number;
  mileage: number;
}

export interface TripExpenseRecord {
  id: string;
  projectId: string;
  vehiclePlate: string;
  driver: string;
  route: string;
  customer: string;
  goods: string;
  fuelType: '柴油' | 'LNG' | '电';
  vehicleLength: string;
  startTime: string;
  endTime: string;
  startMileage: number;
  endMileage: number;
  legs: TripLeg[];
  fuelAmount: number;
  etcAmount: number;
  driverPay: number;
  parkingAmount: number;
  lodgingAmount: number;
  livingAmount: number;
  upstreamFreight: number;
  advanceAmount: number;
  receivableAmount: number;
  status: TripReviewStatus;
  source: '手写出车单' | '手动补录' | '企微群' | '司机小程序';
  images: string[];
  submittedAt: string;
  auditAt?: string;
}

export interface FuelRecord {
  id: string;
  projectId: string;
  date: string;
  location: string;
  vehiclePlate: string;
  driver: string;
  model: string;
  fuelType: '柴油' | 'LNG';
  liters: number;
  unitPrice: number;
  amount: number;
  odometer: number | null;
  source: '企微小票' | '出车单明细' | '手动补录';
  receiptImage?: string;
}

export interface VehicleServiceRecord {
  id: string;
  projectId: string;
  plate: string;
  model: string;
  driver: string;
  serviceClosed: boolean;
  liabilityInsurance: string;
  compulsoryInsurance: string;
  commercialInsurance: string;
  inspection: string;
  operationPermit: string;
  maintenanceDate: string;
  maintenanceMileage: number;
  odometer: number;
  insuranceWarnDays: number;
  inspectionWarnDays: number;
  maintenanceWarnDays: number;
  maintenanceWarnMileage: number;
}

const today = '2026-08-27';

export const tripRecords = ref<TripExpenseRecord[]>([
  {
    id: 'TRIP-20260826001',
    projectId: 'p1',
    vehiclePlate: '赣J03528D',
    driver: '罗明',
    route: '砚山储配站 → 广西德保电厂',
    customer: '云南省煤炭交易（储配）中心有限公司',
    goods: '褐煤32',
    fuelType: '柴油',
    vehicleLength: '13米高栏',
    startTime: '2026-08-25 07:20',
    endTime: '2026-08-26 00:35',
    startMileage: 182340,
    endMileage: 182826,
    legs: [
      { id: 'leg-1', waybillNo: 'DK2026082500000142', weighbillNo: 'WB20260825018', loadingTime: '2026-08-25 08:10', unloadingTime: '2026-08-25 18:55', goods: '褐煤32', weight: 43.68, mileage: 262 },
      { id: 'leg-2', waybillNo: 'DK2026082600000031', weighbillNo: 'WB20260826004', loadingTime: '2026-08-26 19:30', unloadingTime: '2026-08-26 23:40', goods: '褐煤32', weight: 12.4, mileage: 224 }
    ],
    fuelAmount: 1680,
    etcAmount: 386,
    driverPay: 840,
    parkingAmount: 60,
    lodgingAmount: 120,
    livingAmount: 80,
    upstreamFreight: 0,
    advanceAmount: 500,
    receivableAmount: 5480,
    status: '已审核',
    source: '手写出车单',
    images: [expenseImages[0], expenseImages[1]],
    submittedAt: '2026-08-26 08:35',
    auditAt: '2026-08-26 11:20'
  },
  {
    id: 'TRIP-20260826002',
    projectId: 'p1',
    vehiclePlate: '赣J01379D',
    driver: '邓华',
    route: '砚山储配站 → 靖西天桂库',
    customer: '云南省煤炭交易（储配）中心有限公司',
    goods: '氧化铝',
    fuelType: 'LNG',
    vehicleLength: '13.75米高栏',
    startTime: '2026-08-26 06:45',
    endTime: '2026-08-26 21:10',
    startMileage: 96430,
    endMileage: 96742,
    legs: [
      { id: 'leg-3', waybillNo: 'DK2026082600000085', weighbillNo: 'WB20260826015', loadingTime: '2026-08-26 07:35', unloadingTime: '2026-08-26 18:40', goods: '氧化铝', weight: 42.86, mileage: 312 }
    ],
    fuelAmount: 920,
    etcAmount: 228,
    driverPay: 600,
    parkingAmount: 30,
    lodgingAmount: 0,
    livingAmount: 60,
    upstreamFreight: 0,
    advanceAmount: 300,
    receivableAmount: 3320,
    status: '待审核',
    source: '企微群',
    images: ['/demo-assets/trip-audit-wechat.png', '/demo-assets/trip-audit-paper.png', '/demo-assets/trip-audit-miniapp.png'],
    submittedAt: '2026-08-26 22:08'
  },
  {
    id: 'TRIP-20260827001',
    projectId: 'p1',
    vehiclePlate: '赣J00607D',
    driver: '程大昌',
    route: '广西华银装车点 → 砚山库',
    customer: '广西华银铝业有限公司',
    goods: '散装氧化铝',
    fuelType: '柴油',
    vehicleLength: '13米自卸',
    startTime: '2026-08-27 04:30',
    endTime: '2026-08-27 19:40',
    startMileage: 230850,
    endMileage: 231214,
    legs: [
      { id: 'leg-4', waybillNo: 'DK2026082700000016', weighbillNo: 'WB20260827003', loadingTime: '2026-08-27 05:15', unloadingTime: '2026-08-27 17:20', goods: '散装氧化铝', weight: 44.12, mileage: 364 },
      { id: 'leg-5', waybillNo: 'DK2026082700000021', weighbillNo: 'WB20260827006', loadingTime: '2026-08-27 18:10', unloadingTime: '2026-08-27 19:15', goods: '散装氧化铝', weight: 4.8, mileage: 0 }
    ],
    fuelAmount: 0,
    etcAmount: 0,
    driverPay: 0,
    parkingAmount: 0,
    lodgingAmount: 0,
    livingAmount: 0,
    upstreamFreight: 0,
    advanceAmount: 0,
    receivableAmount: 4180,
    status: '待审核',
    source: '司机小程序',
    images: ['/demo-assets/trip-audit-miniapp.png', '/demo-assets/trip-audit-wechat.png'],
    submittedAt: '2026-08-27 20:12'
  }
]);

export const fuelRecords = ref<FuelRecord[]>([
  { id: 'FUEL-001', projectId: 'p1', date: '2026-08-24', location: '砚山南服务区', vehiclePlate: '赣J03528D', driver: '罗明', model: '燃油牵引车', fuelType: '柴油', liters: 210, unitPrice: 7.42, amount: 1558.2, odometer: 182120, source: '企微小票', receiptImage: expenseImages[3] },
  { id: 'FUEL-002', projectId: 'p1', date: '2026-08-25', location: '德保高速服务区', vehiclePlate: '赣J03528D', driver: '罗明', model: '燃油牵引车', fuelType: '柴油', liters: 58, unitPrice: 7.28, amount: 422.24, odometer: 182616, source: '出车单明细', receiptImage: expenseImages[0] },
  { id: 'FUEL-003', projectId: 'p1', date: '2026-08-24', location: '砚山北加气站', vehiclePlate: '赣J01379D', driver: '邓华', model: '燃油牵引车', fuelType: 'LNG', liters: 182, unitPrice: 4.95, amount: 900.9, odometer: 96100, source: '企微小票', receiptImage: expenseImages[4] },
  { id: 'FUEL-004', projectId: 'p1', date: '2026-08-25', location: '靖西物流园加气站', vehiclePlate: '赣J01379D', driver: '邓华', model: '燃油牵引车', fuelType: 'LNG', liters: 76, unitPrice: 4.98, amount: 378.48, odometer: 96412, source: '出车单明细' },
  { id: 'FUEL-005', projectId: 'p1', date: '2026-08-22', location: '华银厂区油站', vehiclePlate: '赣J00607D', driver: '程大昌', model: '燃油牵引车', fuelType: '柴油', liters: 134, unitPrice: 7.35, amount: 984.9, odometer: 230120, source: '企微小票', receiptImage: expenseImages[5] },
  { id: 'FUEL-006', projectId: 'p1', date: '2026-08-24', location: '田东服务区', vehiclePlate: '赣J00607D', driver: '程大昌', model: '燃油牵引车', fuelType: '柴油', liters: 154, unitPrice: 7.42, amount: 1142.68, odometer: 230420, source: '企微小票', receiptImage: expenseImages[6] },
  { id: 'FUEL-007', projectId: 'p1', date: '2026-08-26', location: '砚山储配站油站', vehiclePlate: '赣J00607D', driver: '程大昌', model: '燃油牵引车', fuelType: '柴油', liters: 160, unitPrice: 7.38, amount: 1180.8, odometer: 230710, source: '手动补录' },
  { id: 'FUEL-008', projectId: 'p1', date: '2026-08-27', location: '砚山储配站油站', vehiclePlate: '赣J00607D', driver: '程大昌', model: '燃油牵引车', fuelType: '柴油', liters: 166, unitPrice: 7.4, amount: 1228.4, odometer: 231040, source: '出车单明细' },
  { id: 'FUEL-009', projectId: 'p1', date: '2026-08-27', location: '靖西南服务区', vehiclePlate: '赣J02906D', driver: '胡俊', model: '燃油牵引车', fuelType: '柴油', liters: 92, unitPrice: 7.36, amount: 677.12, odometer: null, source: '手动补录' }
]);

export const vehicleServiceRecords = ref<VehicleServiceRecord[]>(
  vehicles.map((vehicle, index) => ({
    id: `VS-${vehicle.id}`,
    projectId: vehicle.projectId,
    plate: vehicle.plate,
    model: vehicle.model,
    driver: vehicle.driver,
    serviceClosed: index === 3,
    liabilityInsurance: ['2026-09-05', '2026-10-18', '2026-11-30'][index % 3],
    compulsoryInsurance: ['2026-09-12', '2026-11-06', '2027-01-08'][index % 3],
    commercialInsurance: ['2026-09-28', '2026-10-08', '2026-12-20'][index % 3],
    inspection: ['2026-09-10', '2026-10-20', '2027-02-15'][index % 3],
    operationPermit: ['2026-12-05', '2027-01-12', '2027-03-20'][index % 3],
    maintenanceDate: ['2026-03-12', '2026-05-18', '2026-08-02'][index % 3],
    maintenanceMileage: 170000 + index * 3200,
    odometer: 180200 + index * 3650,
    insuranceWarnDays: 30,
    inspectionWarnDays: 60,
    maintenanceWarnDays: 180,
    maintenanceWarnMileage: 10000
  }))
);

export const receivableSettlement = ref<Record<string, { invoice: '待开票' | '已开票'; receipt: '待收款' | '已收款'; dueDate: string }>>({
  'TRIP-20260826001': { invoice: '已开票', receipt: '待收款', dueDate: '2026-08-25' }
});

export function tripExpenseTotal(trip: TripExpenseRecord) {
  return trip.fuelAmount + trip.etcAmount + trip.driverPay + trip.parkingAmount + trip.lodgingAmount + trip.livingAmount + trip.upstreamFreight;
}

export function submitTrip(trip: TripExpenseRecord) {
  trip.status = '待审核';
}

export function auditTrip(trip: TripExpenseRecord) {
  trip.status = '已审核';
  trip.auditAt = today;
  if (!receivableSettlement.value[trip.id]) {
    receivableSettlement.value[trip.id] = { invoice: '待开票', receipt: '待收款', dueDate: '2026-09-10' };
  }
}

export function addFuelRecord(record: Omit<FuelRecord, 'id' | 'amount'> & { amount?: number }) {
  fuelRecords.value.unshift({
    ...record,
    id: `FUEL-${Date.now()}`,
    amount: record.amount ?? Number((record.liters * record.unitPrice).toFixed(2))
  });
}

function dayDiff(target: string) {
  return Math.ceil((new Date(`${target}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000);
}

export const vehicleServiceAlertCount = computed(() =>
  vehicleServiceRecords.value.filter((record) => {
    const insuranceDays = Math.min(dayDiff(record.liabilityInsurance), dayDiff(record.compulsoryInsurance), dayDiff(record.commercialInsurance));
    const inspectionDays = dayDiff(record.inspection);
    const maintenanceDue = record.odometer - record.maintenanceMileage >= record.maintenanceWarnMileage || dayDiff(record.maintenanceDate) <= -record.maintenanceWarnDays;
    return !record.serviceClosed && (insuranceDays <= record.insuranceWarnDays || inspectionDays <= record.inspectionWarnDays || maintenanceDue);
  }).length
);

export function vehicleDateDiff(target: string) {
  return dayDiff(target);
}
