export type HousingType = '賃貸' | '持ち家マンション' | '持ち家戸建て';
export type Frequency = '毎月' | '毎年' | '2年ごと';

export type ApplianceKey = '冷蔵庫' | '洗濯機' | 'エアコン' | 'テレビ' | '掃除機' | '電子レンジ' | '炊飯器';

export type ApplianceInput = {
  owned: boolean;
  purchaseYear: string;
};

export type RecurringExpense = {
  id: string;
  name: string;
  amount: number;
  nextMonth: string;
  frequency: Frequency;
};

export type HouseholdData = {
  householdSize: number;
  housing: HousingType;
  car: boolean;
  carInspectionMonth: string;
  carInsuranceMonth: string;
  appliances: Record<ApplianceKey, ApplianceInput>;
  expenses: RecurringExpense[];
};

export const APPLIANCE_LIFETIMES: Record<ApplianceKey, { years: number; averageCost: number; note: string }> = {
  冷蔵庫: { years: 10, averageCost: 120000, note: '大きさと省エネ性能で幅があります' },
  洗濯機: { years: 8, averageCost: 100000, note: '乾燥機能つきは高めです' },
  エアコン: { years: 10, averageCost: 120000, note: '設置工事費を含む目安です' },
  テレビ: { years: 10, averageCost: 100000, note: 'サイズ別の平均的な目安です' },
  掃除機: { years: 7, averageCost: 55000, note: 'コードレスは電池交換も考慮します' },
  電子レンジ: { years: 10, averageCost: 45000, note: 'オーブン機能つきの平均です' },
  炊飯器: { years: 6, averageCost: 35000, note: '容量により変わります' },
};

export const APPLIANCE_KEYS = Object.keys(APPLIANCE_LIFETIMES) as ApplianceKey[];
export const HOUSING_TYPES: HousingType[] = ['賃貸', '持ち家マンション', '持ち家戸建て'];
export const FREQUENCIES: Frequency[] = ['毎月', '毎年', '2年ごと'];

export const createInitialData = (): HouseholdData => ({
  householdSize: 2,
  housing: '賃貸',
  car: false,
  carInspectionMonth: '6',
  carInsuranceMonth: '6',
  appliances: Object.fromEntries(APPLIANCE_KEYS.map((key) => [key, { owned: true, purchaseYear: String(new Date().getFullYear() - 4) }])) as Record<ApplianceKey, ApplianceInput>,
  expenses: [],
});

export const yen = (value: number) => `${new Intl.NumberFormat('ja-JP').format(Math.round(value))}円`;
export const monthLabel = (month: string) => {
  if (!month) return '月未設定';
  const [year, value] = month.includes('-') ? month.split('-') : ['', month];
  return year ? `${year}年${Number(value)}月` : `${Number(value)}月`;
};
export const currentYear = new Date().getFullYear();