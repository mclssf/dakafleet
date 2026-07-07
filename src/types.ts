export type AuditStatus = '待审核' | '已通过' | '已驳回' | '有疑点';
export type PayStatus = '未付款' | '已付款' | '部分付款';
export type WeighType = '出发磅单' | '到货磅单' | '未识别';

export interface FieldBox {
  key: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Project {
  id: string;
  name: string;
  route: string;
  vehicles: number;
  pending: number;
  profit: number;
  status: '正常' | '关注' | '异常';
}

export interface Vehicle {
  id: string;
  plate: string;
  trailer?: string;
  driver: string;
  owner: string;
  projectId: string;
  status: '运营中' | '待检修' | '停运';
  model: string;
}

export interface WeighBill {
  id: string;
  type: WeighType;
  projectId: string;
  receiver: string;
  shipper: string;
  goods: string;
  mineType: string;
  gross: number;
  tare: number;
  net: number;
  carrier: string;
  vehiclePlate: string;
  driver: string;
  remark: string;
  maker: string;
  date: string;
  time: string;
  source: string;
  confidence: number;
  auditStatus: AuditStatus;
  anomalies: string[];
  freight: number;
  cost: number;
  image: string;
  fieldBoxes: FieldBox[];
}

export interface Expense {
  id: string;
  projectId: string;
  driver: string;
  vehiclePlate: string;
  type: string;
  item: string;
  amount: number;
  occurredDate: string;
  submittedAt: string;
  images: string[];
  payee: string;
  payStatus: PayStatus;
  auditStatus: AuditStatus;
  anomalies: string[];
  confidence: number;
  message: string;
  fieldBoxes: FieldBox[];
}

export interface AgentMessage {
  role: 'user' | 'agent';
  content: string;
  intent?: string;
  taskSteps?: string[];
  streaming?: boolean;
  skills?: string[];
  resultCards?: Array<{ label: string; value: string; tone?: 'green' | 'orange' | 'red' | 'blue'; action?: PageKey }>;
}

export type PageKey =
  | 'agent'
  | 'weighAudit'
  | 'weighList'
  | 'expenseAudit'
  | 'expenseList'
  | 'chargingDetail'
  | 'maintenanceDetail'
  | 'tireExpense'
  | 'dashboard'
  | 'vehicleDetail'
  | 'projects'
  | 'projectManage'
  | 'agentOps';

export type RecordDataSource = 'payment_sync' | 'upstream_import' | 'manual' | 'wechat_robot' | 'table_import' | 'image_ocr';

export interface ChargingRecord {
  id: string;
  dataSource: RecordDataSource;
  sourceRefId: string | null;
  date: string;
  vehiclePlate: string;
  startSOC: number | null;
  endSOC: number | null;
  chargingKwh: number | null;
  normalKwh: number | null;
  batteryCapacity: number;
  kwhDiff: number | null;
  diffRatioPercent: number | null;
  startTime: string | null;
  endTime: string | null;
  unitPrice: number | null;
  serviceFee: number | null;
  topUpAmount: number | null;
  totalAmount: number | null;
  balance: number | null;
  odometer: number | null;
  chargingStation: string;
  remark: string;
  isComplete: boolean;
  status: string;
  createdAt: string;
}

export type MaintenanceCategory =
  | '维修费-轮胎'
  | '维修费-底盘'
  | '维修费-刹车'
  | '维修费-货箱'
  | '维修费-电路'
  | '维修费-液压'
  | '维修费-电焊'
  | '维修费-大修'
  | '维修费-施救'
  | '维修费-耗材'
  | '维修费-工时'
  | '维修费-其他';

export interface MaintenanceRecord {
  id: string;
  dataSource: RecordDataSource;
  sourceRefId: string | null;
  date: string;
  vendor: string;
  vehiclePlate: string;
  description: string;
  amount: number;
  paymentDate: string | null;
  remark: string;
  period: string;
  category: MaintenanceCategory;
  reviewStatus: 'pending' | 'approved';
  images: string[];
  createdAt: string;
}

export type TirePosition = 'FL' | 'FR' | 'RL' | 'RR' | 'SPARE' | null;

export interface TireRecord {
  id: string;
  dataSource: RecordDataSource;
  sourceRefId: string | null;
  date: string;
  vendor: string;
  vehiclePlatePrefix: string;
  vehiclePlate: string;
  tirePosition: TirePosition;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  tireNumber: string | null;
  remark: string;
  receiptNo: string | null;
  images: string[];
  paymentDate: string | null;
  paymentStatus: '已付' | '未付' | '财务已付款';
  tireNumberPending: boolean;
  createdAt: string;
}
