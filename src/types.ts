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
  skills?: string[];
  resultCards?: Array<{ label: string; value: string; tone?: 'green' | 'orange' | 'red' | 'blue'; action?: PageKey }>;
}

export type PageKey =
  | 'agent'
  | 'weighAudit'
  | 'weighList'
  | 'expenseAudit'
  | 'expenseList'
  | 'dashboard'
  | 'vehicleDetail'
  | 'projects';
