import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, CalendarDays, CarFront, Check, CircleHelp,
  CloudSun, Home, Pencil, Plus, RotateCcw, Settings2, ShieldCheck,
  Sparkles, Trash2, TrendingUp, Tv, UserRound, WalletCards, X,
} from 'lucide-react';
import {
  type ApplianceKey, APPLIANCE_KEYS, APPLIANCE_LIFETIMES, createInitialData,
  currentYear, FREQUENCIES, HOUSING_TYPES, monthLabel, type Frequency,
  type HouseholdData, type RecurringExpense, yen,
} from '@/lib/constants';

type AppStage = 'landing' | 'diagnostic' | 'result';
type TimelineStatus = 'もうすぐ' | '1年以内' | '3年以内' | 'それ以降';
type TimelineItem = { id: string; name: string; year: number; month: number; amount: number; status: TimelineStatus; kind: 'appliance' | 'car' | 'expense' };
const STORAGE_KEY = 'kurashi-yohou-v1';

function loadSaved(): { stage: AppStage; data: HouseholdData } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as { stage?: AppStage; data?: HouseholdData };
      if (parsed.data) {
        const base = createInitialData();
        return {
          stage: parsed.stage === 'result' ? 'result' : 'diagnostic',
          data: {
            ...base,
            ...parsed.data,
            appliances: { ...base.appliances, ...(parsed.data.appliances ?? {}) },
            expenses: parsed.data.expenses ?? [],
          },
        };
      }
    }
  } catch { /* Invalid local data is treated as a first visit. */ }
  return { stage: 'landing', data: createInitialData() };
}

function getStatus(year: number): TimelineStatus {
  const current = new Date();
  const delta = (year - current.getFullYear()) * 12;
  if (delta <= 0) return 'もうすぐ';
  if (delta <= 12) return '1年以内';
  if (delta <= 36) return '3年以内';
  return 'それ以降';
}

function parseMonth(value: string) {
  if (value.includes('-')) {
    const [year, month] = value.split('-').map(Number);
    return { year: year || currentYear, month: month || 1 };
  }
  return { year: currentYear, month: Number(value) || 1 };
}

function addMonths(year: number, month: number, amount: number) {
  const date = new Date(year, month - 1 + amount, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function monthsFromNow(year: number, month: number) {
  const current = new Date();
  return (year - current.getFullYear()) * 12 + (month - (current.getMonth() + 1));
}

function statusClass(status: TimelineStatus) {
  if (status === 'もうすぐ') return 'bg-[#fff0d9] text-[#a75b21]';
  if (status === '1年以内') return 'bg-[#e5f4ec] text-[#287052]';
  if (status === '3年以内') return 'bg-[#e2f2f6] text-[#236b7b]';
  return 'bg-[#edf0f1] text-[#607277]';
}

function Header({ onReset, stage }: { onReset: () => void; stage: AppStage }) {
  return <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
    <button type="button" data-testid="button-home" onClick={onReset} className="group flex items-center gap-2.5 text-left">
      <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#175d68] text-[#ffe08a] shadow-[0_6px_0_#0d4953] transition-transform group-hover:-translate-y-0.5"><CloudSun size={22} strokeWidth={2.4} /></span>
      <span><span className="block font-display text-[17px] font-bold tracking-[-.03em] text-[#164e5a]">くらし予報</span><span className="block text-[10px] font-medium tracking-[.13em] text-[#6c898d]">LIFE WEATHER</span></span>
    </button>
    {stage !== 'landing' && <button type="button" data-testid="button-reset-header" onClick={onReset} className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-[#5b7478] transition-colors hover:bg-white hover:text-[#175d68]"><RotateCcw size={14} /> 最初からやり直す</button>}
  </header>;
}

function Landing({ onStart, hasSaved }: { onStart: () => void; hasSaved: boolean }) {
  return <main className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-14 pt-7 sm:px-8 md:grid-cols-[1.1fr_.9fr] md:gap-10 md:pb-24 md:pt-14 lg:px-10">
    <section className="fade-up max-w-xl">
      <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#b8dfde] bg-white/70 px-3.5 py-2 text-xs font-bold text-[#20707a] shadow-sm"><Sparkles size={14} className="text-[#e6a746]" /> 家族の予定を、天気予報のように</div>
      <h1 className="text-balance font-display text-[clamp(2.5rem,8vw,5.65rem)] font-bold leading-[1.08] tracking-[-.065em] text-[#174f5b]">これから何に、<br /><span className="text-[#e6a746]">いつ、いくら</span>かかる？</h1>
      <p className="mt-6 max-w-md text-[15px] leading-8 text-[#557276]">くらし予報は、家電の買い替えや車の予定を先回り。<br className="hidden sm:block" />家計簿が苦手でも、未来のお金をやさしく見通せます。</p>
      <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center"><button type="button" data-testid="button-start" onClick={onStart} className="press flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#175d68] px-7 text-[15px] font-bold text-white shadow-[0_5px_0_#0d4953] transition-transform hover:-translate-y-0.5 sm:w-auto">{hasSaved ? '予報をつづける' : 'わが家の予報をつくる'} <ArrowRight size={18} /></button><span className="flex items-center gap-1.5 text-xs text-[#71898d]"><ShieldCheck size={15} className="text-[#3e9b87]" /> 登録不要・端末に保存</span></div>
      <a
  href="/life-cost-tools/"
  className="mt-5 inline-flex text-sm font-bold text-[#176873] underline decoration-[#9fcac5] underline-offset-4 hover:text-[#0d4953]"
>
  無料の出費計算ツールを見る →
</a>
      <div className="mt-11 grid max-w-md grid-cols-3 gap-3 border-t border-[#cde2e2] pt-5"><div><p className="font-display text-xl font-bold text-[#175d68]">約3分</p><p className="mt-1 text-[11px] text-[#769095]">かんたん診断</p></div><div><p className="font-display text-xl font-bold text-[#175d68]">1・3・5年</p><p className="mt-1 text-[11px] text-[#769095]">先まで見通す</p></div><div><p className="font-display text-xl font-bold text-[#175d68]">無料</p><p className="mt-1 text-[11px] text-[#769095]">ずっと使える</p></div></div>
    </section>
    <section className="fade-up fade-up-delay-2 relative min-h-[390px] md:min-h-[530px]" aria-label="予報のイメージ">
      <div className="weather-sun right-[12%] top-[3%]" /><div className="cloud left-[6%] top-[18%] h-8 w-24 opacity-80" /><div className="cloud right-[4%] top-[32%] h-7 w-20 opacity-60" />
      <div className="absolute bottom-[5%] left-1/2 w-[min(100%,390px)] -translate-x-1/2 rotate-[-3deg] rounded-[28px] border border-[#c6e1df] bg-white/90 p-5 shadow-[0_22px_60px_rgba(38,105,114,.16)] backdrop-blur-sm sm:p-6"><div className="flex items-center justify-between border-b border-[#e0eded] pb-4"><div><p className="text-xs font-bold text-[#6d898d]">わが家のくらし予報</p><p className="mt-1 font-display text-2xl font-bold text-[#175d68]">これから3年</p></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff3c9] text-[#d89028]"><CloudSun size={25} /></div></div><div className="mt-5 rounded-2xl bg-[#eef8f7] p-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#e1a13f]"><CalendarDays size={18} /></span><div><p className="text-xs font-bold text-[#35666b]">近い予定</p><p className="mt-1 text-[13px] font-bold text-[#174f5b]">冷蔵庫の買い替え</p></div><span className="ml-auto rounded-full bg-[#fff0d9] px-2.5 py-1 text-[10px] font-bold text-[#a75b21]">1年以内</span></div></div><div className="mt-3 flex items-end justify-between rounded-2xl bg-[#175d68] p-4 text-white"><div><p className="text-xs text-[#b7d7d4]">毎月の積み立て目安</p><p className="mt-1 font-display text-2xl font-bold">¥18,400</p></div><TrendingUp size={26} className="text-[#ffdc78]" /></div></div>
    </section>
  </main>;
}

function Progress({ step }: { step: number }) {
  return <div className="mb-8 flex items-center gap-2" data-testid="status-progress">{[{ n: 1, label: 'わが家' }, { n: 2, label: '持ちもの' }, { n: 3, label: '予定' }].map((item, index) => <div key={item.n} className="flex flex-1 items-center gap-2"><div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${step >= item.n ? 'bg-[#175d68] text-white' : 'bg-[#dceceb] text-[#779195]'}`}>{step > item.n ? <Check size={15} /> : item.n}</div><span className={`hidden text-xs font-bold sm:block ${step >= item.n ? 'text-[#175d68]' : 'text-[#8ba0a3]'}`}>{item.label}</span>{index < 2 && <div className={`h-0.5 flex-1 rounded-full ${step > item.n ? 'bg-[#73b9b6]' : 'bg-[#dceceb]'}`} />}</div>)}</div>;
}

function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return <div className="mb-2 flex items-center gap-2"><label className="text-sm font-bold text-[#315e64]">{children}</label>{hint && <span className="text-[11px] text-[#8aa0a2]">{hint}</span>}</div>;
}

function ChoiceButton({ selected, onClick, children, testId }: { selected: boolean; onClick: () => void; children: string; testId: string }) {
  return <button type="button" data-testid={testId} onClick={onClick} className={`lift min-h-12 rounded-xl border px-3 text-sm font-bold transition-colors ${selected ? 'border-[#2b8b8a] bg-[#e3f4f1] text-[#175d68] shadow-[inset_0_0_0_1px_#2b8b8a]' : 'border-[#d5e5e4] bg-white text-[#5c777b] hover:border-[#8fc8c5]'}`}>{children}</button>;
}

function Diagnostic({ initial, onComplete, onBack }: { initial: HouseholdData; onComplete: (data: HouseholdData) => void; onBack: () => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<HouseholdData>(initial);
  const [error, setError] = useState('');
  const updateAppliance = (key: ApplianceKey, patch: Partial<HouseholdData['appliances'][ApplianceKey]>) => setData((old) => ({ ...old, appliances: { ...old.appliances, [key]: { ...old.appliances[key], ...patch } } }));
  const advance = () => { setError(''); if (step === 1 && (!data.householdSize || data.householdSize < 1)) { setError('世帯人数を入力してください'); return; } if (step < 3) setStep(step + 1); else onComplete(data); };
  return <main className="mx-auto w-full max-w-2xl px-5 pb-16 pt-4 sm:px-8 sm:pt-10"><div className="fade-up"><Progress step={step} /></div><div className="fade-up fade-up-delay-1 rounded-[26px] border border-[#cde2e2] bg-white p-5 shadow-[0_10px_35px_rgba(48,111,121,.07)] sm:p-9">
    {step === 1 && <div><p className="text-xs font-bold tracking-[.12em] text-[#2c9190]">STEP 1 / 3</p><h1 className="mt-2 font-display text-3xl font-bold tracking-[-.05em] text-[#174f5b]">まずは、わが家のこと</h1><p className="mt-3 text-sm leading-7 text-[#6b8588]">ざっくりで大丈夫です。あとからいつでも変更できます。</p><div className="mt-8 space-y-7"><div><FieldLabel>世帯人数 <span className="font-normal text-[#8aa0a2]">（大人・子どもを含む）</span></FieldLabel><div className="flex items-center gap-3"><button type="button" data-testid="button-household-decrease" onClick={() => setData({ ...data, householdSize: Math.max(1, data.householdSize - 1) })} className="grid h-11 w-11 place-items-center rounded-xl border border-[#d5e5e4] text-lg text-[#3e7478] hover:bg-[#eef8f7]">−</button><span data-testid="text-household-size" className="w-16 text-center font-display text-2xl font-bold text-[#175d68]">{data.householdSize}<span className="ml-1 text-sm font-medium">人</span></span><button type="button" data-testid="button-household-increase" onClick={() => setData({ ...data, householdSize: Math.min(20, data.householdSize + 1) })} className="grid h-11 w-11 place-items-center rounded-xl border border-[#d5e5e4] text-lg text-[#3e7478] hover:bg-[#eef8f7]">＋</button></div></div><div><FieldLabel>住まいのタイプ</FieldLabel><div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{HOUSING_TYPES.map((housing) => <ChoiceButton key={housing} testId={`button-housing-${housing}`} selected={data.housing === housing} onClick={() => setData({ ...data, housing })}>{housing}</ChoiceButton>)}</div></div><div><FieldLabel>車を持っていますか？</FieldLabel><div className="grid grid-cols-2 gap-2"><ChoiceButton testId="button-car-no" selected={!data.car} onClick={() => setData({ ...data, car: false })}>なし</ChoiceButton><ChoiceButton testId="button-car-yes" selected={data.car} onClick={() => setData({ ...data, car: true })}>あり</ChoiceButton></div></div>{data.car && <div className="grid gap-4 rounded-2xl bg-[#f4faf9] p-4 sm:grid-cols-2"><div><FieldLabel>車検の月</FieldLabel><select data-testid="select-car-inspection-month" value={data.carInspectionMonth} onChange={(e) => setData({ ...data, carInspectionMonth: e.target.value })} className="input-style">{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}月</option>)}</select></div><div><FieldLabel>保険更新の月</FieldLabel><select data-testid="select-car-insurance-month" value={data.carInsuranceMonth} onChange={(e) => setData({ ...data, carInsuranceMonth: e.target.value })} className="input-style">{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}月</option>)}</select></div></div>}</div></div>}
    {step === 2 && <div><p className="text-xs font-bold tracking-[.12em] text-[#2c9190]">STEP 2 / 3</p><h1 className="mt-2 font-display text-3xl font-bold tracking-[-.05em] text-[#174f5b]">家電の年齢を教えてください</h1><p className="mt-3 text-sm leading-7 text-[#6b8588]">持っている家電だけ、購入した年を入力。目安で大丈夫です。</p><div className="mt-7 space-y-2.5">{APPLIANCE_KEYS.map((key) => <div key={key} className={`rounded-2xl border p-3.5 transition-colors ${data.appliances[key].owned ? 'border-[#d5e5e4] bg-white' : 'border-[#e6eeee] bg-[#f8fbfb]'}`}><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf7f6] text-[#287d82]"><Tv size={17} /></span><span className="flex-1 text-sm font-bold text-[#315e64]">{key}</span><button type="button" data-testid={`button-appliance-owned-${key}`} onClick={() => updateAppliance(key, { owned: !data.appliances[key].owned })} className={`relative h-6 w-11 rounded-full transition-colors ${data.appliances[key].owned ? 'bg-[#2d9290]' : 'bg-[#cbd9da]'}`} aria-label={`${key}の所有状態`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${data.appliances[key].owned ? 'left-6' : 'left-1'}`} /></button></div>{data.appliances[key].owned && <div className="mt-3 flex items-center gap-2 pl-12"><label className="text-xs text-[#779095]" htmlFor={`year-${key}`}>購入年</label><input id={`year-${key}`} data-testid={`input-appliance-year-${key}`} type="number" min="1980" max={currentYear} value={data.appliances[key].purchaseYear} onChange={(e) => updateAppliance(key, { purchaseYear: e.target.value })} className="input-style h-9 w-28 py-1 text-sm" /><span className="text-xs text-[#779095]">年</span><span className="ml-auto hidden text-[10px] text-[#94a7a9] sm:block">目安 {APPLIANCE_LIFETIMES[key].years}年</span></div>}</div>)}</div></div>}
    {step === 3 && <div><p className="text-xs font-bold tracking-[.12em] text-[#2c9190]">STEP 3 / 3</p><h1 className="mt-2 font-display text-3xl font-bold tracking-[-.05em] text-[#174f5b]">いつもの支出を足しましょう</h1><p className="mt-3 text-sm leading-7 text-[#6b8588]">家賃、保険、サブスクなど。あとから追加・編集できます。</p><ExpenseEditor expenses={data.expenses} onChange={(expenses) => setData({ ...data, expenses })} compact /></div>}
    {error && <p data-testid="status-diagnostic-error" className="mt-5 rounded-xl bg-[#fff0ed] px-4 py-3 text-sm font-bold text-[#b34f40]">{error}</p>}
    <div className="mt-9 flex items-center justify-between border-t border-[#e3eeee] pt-5"><button type="button" data-testid="button-diagnostic-back" onClick={() => step === 1 ? onBack() : setStep(step - 1)} className="flex items-center gap-1.5 text-sm font-bold text-[#6b8588] hover:text-[#175d68]"><ArrowLeft size={16} /> 戻る</button><button type="button" data-testid="button-diagnostic-next" onClick={advance} className="press flex items-center gap-2 rounded-xl bg-[#175d68] px-5 py-3 text-sm font-bold text-white shadow-[0_3px_0_#0d4953] hover:-translate-y-0.5">{step === 3 ? '予報を見る' : '次へ進む'} <ArrowRight size={16} /></button></div>
  </div></main>;
}

function ExpenseEditor({ expenses, onChange, compact = false }: { expenses: RecurringExpense[]; onChange: (expenses: RecurringExpense[]) => void; compact?: boolean }) {
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [form, setForm] = useState({ name: '', amount: '', nextMonth: `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`, frequency: '毎月' as Frequency });
  const [error, setError] = useState('');
  const openAdd = () => { setForm({ name: '', amount: '', nextMonth: `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}`, frequency: '毎月' }); setEditing({ id: '__new__', name: '', amount: 0, nextMonth: '', frequency: '毎月' }); setError(''); };
  const openEdit = (expense: RecurringExpense) => { setForm({ name: expense.name, amount: String(expense.amount), nextMonth: expense.nextMonth, frequency: expense.frequency }); setEditing(expense); setError(''); };
  const save = () => { const amount = Number(form.amount); if (!form.name.trim() || !amount || amount < 1) { setError('名前と金額を入力してください'); return; } const next: RecurringExpense = { id: editing?.id === '__new__' ? crypto.randomUUID() : editing?.id ?? crypto.randomUUID(), name: form.name.trim(), amount, nextMonth: form.nextMonth, frequency: form.frequency }; onChange(editing?.id === '__new__' ? [...expenses, next] : expenses.map((item) => item.id === next.id ? next : item)); setEditing(null); };
  return <div className={`mt-7 ${compact ? '' : 'rounded-2xl border border-[#d5e5e4] bg-[#fbfdfd] p-5'}`}><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-[#315e64]">定期的な支出 <span className="ml-1 text-xs font-normal text-[#8aa0a2]">{expenses.length}件</span></p>{!compact && <p className="mt-1 text-xs text-[#7c9699]">未来の予定だけでも登録しておくと安心です。</p>}</div><button type="button" data-testid="button-add-expense" onClick={openAdd} className="flex items-center gap-1 rounded-xl bg-[#e4f4f1] px-3 py-2 text-xs font-bold text-[#17686e] hover:bg-[#d5edeb]"><Plus size={15} /> 追加</button></div>
    {expenses.length === 0 && <div className="mt-5 rounded-2xl border border-dashed border-[#c8dfde] bg-[#f6fbfa] px-4 py-5 text-center"><WalletCards size={22} className="mx-auto text-[#75aaa9]" /><p className="mt-2 text-xs font-bold text-[#53777b]">まだ登録されていません</p><p className="mt-1 text-[11px] text-[#8aa0a2]">家賃や保険など、思いつくものからどうぞ</p></div>}
    <div className="mt-3 space-y-2">{expenses.map((expense) => <div key={expense.id} data-testid={`row-expense-${expense.id}`} className="flex items-center gap-3 rounded-xl border border-[#e0eceb] bg-white px-3 py-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#fff3d7] text-[#bc7d28]"><WalletCards size={15} /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[#315e64]">{expense.name}</p><p className="mt-0.5 text-[11px] text-[#819699]">{monthLabel(expense.nextMonth)}・{expense.frequency}</p></div><p className="font-display text-sm font-bold text-[#175d68]">{yen(expense.amount)}</p><button type="button" data-testid={`button-edit-expense-${expense.id}`} onClick={() => openEdit(expense)} className="grid h-8 w-8 place-items-center rounded-lg text-[#789396] hover:bg-[#eef8f7] hover:text-[#175d68]"><Pencil size={14} /></button><button type="button" data-testid={`button-delete-expense-${expense.id}`} onClick={() => onChange(expenses.filter((item) => item.id !== expense.id))} className="grid h-8 w-8 place-items-center rounded-lg text-[#a2b3b4] hover:bg-[#fff0ed] hover:text-[#b34f40]"><Trash2 size={14} /></button></div>)}</div>
     {editing && <div className="fixed inset-0 z-50 grid place-items-end bg-[#123f47]/25 p-0 backdrop-blur-[2px] sm:place-items-center sm:p-5"><div className="w-full max-w-md rounded-t-[26px] bg-white p-5 shadow-2xl sm:rounded-[26px] sm:p-7"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold text-[#174f5b]">{editing.id === '__new__' ? '支出を追加' : '支出を編集'}</h2><button type="button" data-testid="button-close-expense" onClick={() => setEditing(null)} className="grid h-8 w-8 place-items-center rounded-full bg-[#eef5f4] text-[#6c8588]"><X size={16} /></button></div><div className="mt-5 space-y-4"><div><FieldLabel>支出の名前</FieldLabel><input data-testid="input-expense-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="例：自動車保険" className="input-style" /></div><div><FieldLabel>金額</FieldLabel><div className="relative"><input data-testid="input-expense-amount" type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="50000" className="input-style pr-12" /><span className="pointer-events-none absolute right-4 top-3 text-sm text-[#89a0a2]">円</span></div></div><div className="grid grid-cols-2 gap-3"><div><FieldLabel>次回の月</FieldLabel><input data-testid="input-expense-month" type="month" value={form.nextMonth.includes('-') ? form.nextMonth : `${currentYear}-${String(Number(form.nextMonth) || new Date().getMonth() + 1).padStart(2, '0')}`} onChange={(e) => setForm({ ...form, nextMonth: e.target.value })} className="input-style" /></div><div><FieldLabel>頻度</FieldLabel><select data-testid="select-expense-frequency" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as Frequency })} className="input-style">{FREQUENCIES.map((frequency) => <option key={frequency} value={frequency}>{frequency}</option>)}</select></div></div></div>{error && <p data-testid="status-expense-error" className="mt-4 text-xs font-bold text-[#b34f40]">{error}</p>}<button type="button" data-testid="button-save-expense" onClick={save} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#175d68] text-sm font-bold text-white shadow-[0_3px_0_#0d4953]"><Check size={17} /> 保存する</button></div></div>}
  </div>;
}

function buildTimeline(data: HouseholdData): TimelineItem[] {
  const now = new Date();
  const items: TimelineItem[] = [];
  APPLIANCE_KEYS.forEach((key) => { const appliance = data.appliances[key]; if (!appliance.owned || !appliance.purchaseYear) return; const life = APPLIANCE_LIFETIMES[key]; const year = Number(appliance.purchaseYear) + life.years; items.push({ id: `appliance-${key}`, name: `${key}の買い替え目安`, year, month: now.getMonth() + 1, amount: life.averageCost, status: getStatus(year), kind: 'appliance' }); });
  if (data.car) {
    const addCarEvents = (id: string, name: string, monthValue: string, amount: number, interval: number) => {
      const startMonth = Number(monthValue) || now.getMonth() + 1;
      let next = addMonths(currentYear, startMonth, startMonth < now.getMonth() + 1 ? 12 : 0);
      for (let index = 0; monthsFromNow(next.year, next.month) <= 60; index += 1) {
        items.push({ id: `${id}-${index}`, name, year: next.year, month: next.month, amount, status: getStatus(next.year), kind: 'car' });
        next = addMonths(next.year, next.month, interval);
      }
    };
    addCarEvents('car-inspection', '車検', data.carInspectionMonth, 100000, 24);
    addCarEvents('car-insurance', '自動車保険の更新', data.carInsuranceMonth, 70000, 12);
  }
  data.expenses.forEach((expense) => {
    const parsed = parseMonth(expense.nextMonth);
    const interval = expense.frequency === '毎月' ? 1 : expense.frequency === '2年ごと' ? 24 : 12;
    let next = parsed;
    if (monthsFromNow(next.year, next.month) < 0) next = addMonths(next.year, next.month, interval);
    for (let index = 0; monthsFromNow(next.year, next.month) <= 60; index += 1) {
      items.push({ id: `expense-${expense.id}-${index}`, name: expense.name, year: next.year, month: next.month, amount: expense.amount, status: getStatus(next.year), kind: 'expense' });
      next = addMonths(next.year, next.month, interval);
    }
  });
  return items.sort((a, b) => a.year - b.year || a.month - b.month);
}

function Result({ data, onDataChange, onReset }: { data: HouseholdData; onDataChange: (data: HouseholdData) => void; onReset: () => void }) {
  const timeline = useMemo(() => buildTimeline(data), [data]);
  const appliances = timeline.filter((item) => item.kind === 'appliance');
  const threeYearItems = timeline.filter((item) => monthsFromNow(item.year, item.month) <= 36);
  const forecast = (years: number) => timeline.filter((item) => monthsFromNow(item.year, item.month) <= years * 12).reduce((sum, item) => sum + item.amount, 0);
  const monthlySaving = Math.ceil(forecast(3) / 36 / 100) * 100;
  const nearest = timeline[0];
  return <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-3 sm:px-8 sm:pt-9 lg:px-10"><section className="fade-up relative overflow-hidden rounded-[28px] bg-[#175d68] px-6 py-8 text-white shadow-[0_14px_40px_rgba(23,93,104,.22)] sm:px-10 sm:py-10"><div className="absolute -right-8 -top-16 h-44 w-44 rounded-full border-[18px] border-[#ffdb77]/30" /><div className="absolute -bottom-24 right-28 h-52 w-52 rounded-full border-[22px] border-[#8bd2cc]/15" /><div className="relative max-w-2xl"><div className="flex items-center gap-2 text-xs font-bold text-[#b6e0da]"><CloudSun size={17} /> 今日のくらし予報</div><h1 data-testid="text-result-title" className="mt-3 font-display text-3xl font-bold tracking-[-.06em] sm:text-5xl">あなたの未来の出費予報</h1><p className="mt-4 max-w-xl text-sm leading-7 text-[#d1ebe6]">家電や定期的な支出をもとに、まとまった出費のタイミングを整理しました。必要な分を少しずつ準備していきましょう。</p><div className="mt-7 flex flex-wrap items-end gap-x-10 gap-y-4"><div><p className="text-xs text-[#acd5d1]">3年間の準備目安</p><p data-testid="text-monthly-saving" className="mt-1 font-display text-3xl font-bold text-white">{yen(monthlySaving)}<span className="ml-1 text-sm font-medium text-[#acd5d1]">/月</span></p></div>{nearest && <div className="border-l border-[#4e8990] pl-5"><p className="text-xs text-[#acd5d1]">いちばん近い予定</p><p data-testid="text-nearest-event" className="mt-1 text-sm font-bold text-[#fff0bd]">{nearest.name}</p></div>}</div></div></section><section className="mt-5 grid gap-4 sm:grid-cols-3"><ForecastCard label="今後1年間の予想支出" value={forecast(1)} accent="sun" note={`${timeline.filter((item) => item.year <= currentYear + 1).length}件の予定`} /><ForecastCard label="今後3年間の予想支出" value={forecast(3)} accent="mint" note={`${threeYearItems.length}件の予定`} /><ForecastCard label="今後5年間の予想支出" value={forecast(5)} accent="sky" note="未来の予定も含めて" /></section><div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_.75fr]"><section className="fade-up fade-up-delay-1 rounded-[24px] border border-[#d4e6e4] bg-white p-5 shadow-[0_8px_28px_rgba(48,111,121,.06)] sm:p-7"><div className="flex items-end justify-between"><div><p className="text-xs font-bold tracking-[.1em] text-[#398b8d]">LIFE TIMELINE</p><h2 className="mt-1 font-display text-2xl font-bold tracking-[-.04em] text-[#174f5b]">これからの予定</h2></div><div className="flex gap-1.5 text-[10px] font-bold text-[#799295]"><span className="rounded-full bg-[#fff0d9] px-2 py-1 text-[#a75b21]">もうすぐ</span><span className="hidden rounded-full bg-[#e5f4ec] px-2 py-1 text-[#287052] sm:inline">1年以内</span></div></div>{timeline.length === 0 ? <EmptyTimeline /> : <div className="relative mt-7 space-y-3 before:absolute before:bottom-3 before:left-[17px] before:top-3 before:w-px before:bg-[#d6e8e5]">{timeline.map((item) => <TimelineRow key={item.id} item={item} />)}</div>}</section><aside className="space-y-6"><section className="fade-up fade-up-delay-2 rounded-[24px] border border-[#d4e6e4] bg-white p-5 shadow-[0_8px_28px_rgba(48,111,121,.06)] sm:p-7"><div className="flex items-start justify-between"><div><p className="text-xs font-bold tracking-[.1em] text-[#398b8d]">MY HOUSEHOLD</p><h2 className="mt-1 font-display text-xl font-bold text-[#174f5b]">わが家の設定</h2></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef8f7] text-[#287d82]"><Settings2 size={17} /></span></div><div className="mt-5 grid grid-cols-2 gap-2.5 text-xs"><MiniFact icon={<UserRound size={14} />} label="世帯人数" value={`${data.householdSize}人`} /><MiniFact icon={<Home size={14} />} label="住まい" value={data.housing} /><MiniFact icon={<CarFront size={14} />} label="車" value={data.car ? 'あり' : 'なし'} /><MiniFact icon={<Tv size={14} />} label="登録家電" value={`${appliances.length}台`} /></div><button type="button" data-testid="button-edit-diagnostic" onClick={() => onDataChange(data)} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#cfe2e0] py-2.5 text-xs font-bold text-[#33777a] hover:bg-[#f2faf9]"><Pencil size={14} /> 設定を編集する</button></section><section className="fade-up fade-up-delay-3 rounded-[24px] bg-[#fff5d8] p-5 sm:p-7"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#d5942f]"><CircleHelp size={18} /></span><div><h2 className="text-sm font-bold text-[#765221]">予報の見方</h2><p className="mt-2 text-xs leading-6 text-[#876e47]">これは平均的な買い替え時期と費用から出した目安です。暮らしの変化に合わせて、予定は気軽に編集してください。</p></div></div></section></aside></div><section className="mt-7 fade-up fade-up-delay-2"><ExpenseEditor expenses={data.expenses} onChange={(expenses) => onDataChange({ ...data, expenses })} /><button type="button" data-testid="button-reset-data" onClick={onReset} className="mt-8 flex items-center gap-2 text-xs font-bold text-[#8b6360] hover:text-[#b34f40]"><RotateCcw size={14} /> 保存データをすべてリセット</button></section></main>;
}

function ForecastCard({ label, value, note, accent }: { label: string; value: number; note: string; accent: 'sun' | 'mint' | 'sky' }) {
  const color = accent === 'sun' ? 'bg-[#fff5dc] text-[#c18128]' : accent === 'mint' ? 'bg-[#e4f5ef] text-[#328370]' : 'bg-[#e5f4f7] text-[#367e8b]';
  return <div className="lift rounded-[20px] border border-[#d4e6e4] bg-white p-5 shadow-[0_6px_20px_rgba(48,111,121,.05)]"><div className="flex items-center justify-between"><p className="text-xs font-bold text-[#678287]">{label}</p><span className={`grid h-8 w-8 place-items-center rounded-lg ${color}`}><TrendingUp size={15} /></span></div><p data-testid={`text-forecast-${label}`} className="mt-4 font-display text-2xl font-bold tracking-[-.04em] text-[#174f5b]">{yen(value)}</p><p className="mt-1 text-[11px] text-[#8aa0a2]">{note}</p></div>;
}

function TimelineRow({ item }: { item: TimelineItem }) {
  const icon = item.kind === 'appliance' ? <Tv size={15} /> : item.kind === 'car' ? <CarFront size={15} /> : <WalletCards size={15} />;
  return <div data-testid={`row-timeline-${item.id}`} className="relative flex items-center gap-3 rounded-2xl bg-[#fbfdfd] px-3 py-3.5 pl-2"><span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#e6f3f1] text-[#287d82] ring-4 ring-white">{icon}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#315e64]">{item.name}</p><p className="mt-1 text-[11px] text-[#8aa0a2]">{item.year}年 {item.month}月</p></div><div className="text-right"><span className={`inline-block rounded-full px-2 py-1 text-[10px] font-bold ${statusClass(item.status)}`}>{item.status}</span><p className="mt-1 font-display text-sm font-bold text-[#175d68]">{yen(item.amount)}</p></div></div>;
}

function EmptyTimeline() {
  return <div data-testid="empty-timeline" className="mt-7 rounded-2xl border border-dashed border-[#c8dfde] bg-[#f6fbfa] px-5 py-12 text-center"><CalendarDays size={28} className="mx-auto text-[#6eacab]" /><p className="mt-3 text-sm font-bold text-[#53777b]">まだ予定がありません</p><p className="mt-1 text-xs text-[#8aa0a2]">定期的な支出を追加すると、ここに表示されます。</p></div>;
}

function MiniFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-xl bg-[#f3f9f8] p-3"><div className="flex items-center gap-1.5 text-[#6a9898]">{icon}<span className="text-[10px]">{label}</span></div><p className="mt-1.5 truncate text-xs font-bold text-[#315e64]">{value}</p></div>;
}

function App() {
  const initial = useMemo(loadSaved, []);
  const [stage, setStage] = useState<AppStage>(initial.stage);
  const [data, setData] = useState<HouseholdData>(initial.data);
  const hasSaved = initial.stage !== 'landing';
  useEffect(() => { if (stage === 'landing') localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, JSON.stringify({ stage, data })); }, [stage, data]);
  const reset = () => { localStorage.removeItem(STORAGE_KEY); setData(createInitialData()); setStage('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const completeDiagnostic = (next: HouseholdData) => { setData(next); setStage('result'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return <div className="app-shell"><Header onReset={reset} stage={stage} />{stage === 'landing' && <Landing onStart={() => setStage('diagnostic')} hasSaved={hasSaved} />}{stage === 'diagnostic' && <Diagnostic initial={data} onComplete={completeDiagnostic} onBack={() => setStage('landing')} />}{stage === 'result' && <Result data={data} onDataChange={(next) => { setData(next); setStage('diagnostic'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onReset={reset} />}<footer className="mx-auto max-w-6xl px-5 pb-7 pt-2 text-center text-[10px] tracking-[.08em] text-[#91a7a8] sm:px-8">くらし予報　・　あなたの暮らしに、晴れ間を。</footer></div>;
}

export default App;
