import { type ChangeEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { DecisionHub } from './DecisionHub';
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
        const savedAppliances = parsed.data.appliances ?? base.appliances;
        const appliances = Object.fromEntries(
          APPLIANCE_KEYS.map((key) => [
            key,
            { ...base.appliances[key], ...(savedAppliances[key] ?? {}) },
          ]),
        ) as HouseholdData['appliances'];
        return {
          stage: parsed.stage === 'result' ? 'result' : 'diagnostic',
          data: {
            ...base,
            ...parsed.data,
            appliances,
            expenses: parsed.data.expenses ?? [],
          },
        };
      }
    }
  } catch { /* Invalid local data is treated as a first visit. */ }
  return { stage: 'landing', data: createInitialData() };
}

function getStatus(year: number, month: number): TimelineStatus {
  const delta = monthsFromNow(year, month);
  if (delta <= 3) return 'もうすぐ';
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

function Header({ onHome, stage }: { onHome: () => void; stage: AppStage }) {
  return <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
    <button type="button" data-testid="button-home" onClick={onHome} className="group flex items-center gap-2.5 text-left">
      <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#175d68] text-[#ffe08a] shadow-[0_6px_0_#0d4953] transition-transform group-hover:-translate-y-0.5"><CloudSun size={22} strokeWidth={2.4} /></span>
      <span><span className="block font-display text-[17px] font-bold tracking-[-.03em] text-[#164e5a]">くらし予報</span><span className="block text-[10px] font-medium tracking-[.13em] text-[#6c898d]">LIFE WEATHER</span></span>
    </button>
    {stage !== 'landing' && <button type="button" data-testid="button-reset-header" onClick={onHome} className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-[#5b7478] transition-colors hover:bg-white hover:text-[#175d68]"><ArrowLeft size={14} /> トップに戻る</button>}
  </header>;
}

function Landing({ onStart, hasSaved }: { onStart: () => void; hasSaved: boolean }) {
  return <main className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-14 pt-7 sm:px-8 md:grid-cols-[1.1fr_.9fr] md:gap-10 md:pb-24 md:pt-14 lg:px-10">
    <section className="fade-up max-w-xl">
      <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#b8dfde] bg-white/70 px-3.5 py-2 text-xs font-bold text-[#20707a] shadow-sm"><Sparkles size={14} className="text-[#e6a746]" /> 家族の予定を、天気予報のように</div>
      <h1 className="text-balance font-display text-[clamp(2.5rem,8vw,5.65rem)] font-bold leading-[1.08] tracking-[-.065em] text-[#174f5b]">これから何に、<br /><span className="text-[#e6a746]">いつ、いくら</span>かかる？</h1>
      <p className="mt-6 max-w-md text-[15px] leading-8 text-[#557276]">くらし予報は、家電の買い替えや車の予定を先回り。<br className="hidden sm:block" />家計簿が苦手でも、未来のお金をやさしく見通せます。</p>
      <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center"><button type="button" data-testid="button-start" onClick={onStart} className="press flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#175d68] px-7 text-[15px] font-bold text-white shadow-[0_5px_0_#0d4953] transition-transform hover:-translate-y-0.5 sm:w-auto">{hasSaved ? '予報をつづける' : 'わが家の予報をつくる'} <ArrowRight size={18} /></button><span className="flex items-center gap-1.5 text-xs text-[#71898d]"><ShieldCheck size={15} className="text-[#3e9b87]" /> 登録不要・端末に保存</span></div>
      <a href="/life-cost-tools/" className="mt-5 inline-flex text-sm font-bold text-[#176873] underline decoration-[#9fcac5] underline-offset-4 hover:text-[#0d4953]">無料の出費計算ツールを見る →</a>
      <div className="mt-11 grid max-w-md grid-cols-3 gap-3 border-t border-[#cde2e2] pt-5"><div><p className="font-display text-xl font-bold text-[#175d68]">約3分</p><p className="mt-1 text-[11px] text-[#769095]">かんたん診断</p></div><div><p className="font-display text-xl font-bold text-[#175d68]">1・3・5年</p><p className="mt-1 text-[11px] text-[#769095]">先まで見通す</p></div><div><p className="font-display text-xl font-bold text-[#175d68]">無料</p><p className="mt-1 text-[11px] text-[#769095]">ずっと使える</p></div></div>
    </section>
    <section className="fade-up fade-up-delay-2 relative min-h-[390px] md:min-h-[530px]" aria-label="予報のイメージ">
      <div className="weather-sun right-[12%] top-[3%]" /><div className="cloud left-[6%] top-[18%] h-8 w-24 opacity-80" /><div className="cloud right-[4%] top-[32%] h-7 w-20 opacity-60" />
      <div className="absolute bottom-[5%] left-1/2 w-[min(100%,390px)] -translate-x-1/2 rotate-[-3deg] rounded-[28px] border border-[#c6e1df] bg-white/90 p-5 shadow-[0_22px_60px_rgba(38,105,114,.16)] backdrop-blur-sm sm:p-6"><div className="flex items-center justify-between border-b border-[#e0eded] pb-4"><div><p className="text-xs font-bold text-[#6d898d]">予報のサンプル画面</p><p className="mt-1 font-display text-2xl font-bold text-[#175d68]">これから3年</p></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff3c9] text-[#d89028]"><CloudSun size={25} /></div></div><div className="mt-5 rounded-2xl bg-[#eef8f7] p-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#e1a13f]"><CalendarDays size={18} /></span><div><p className="text-xs font-bold text-[#35666b]">近い予定</p><p className="mt-1 text-[13px] font-bold text-[#174f5b]">冷蔵庫の買い替え</p></div><span className="ml-auto rounded-full bg-[#fff0d9] px-2.5 py-1 text-[10px] font-bold text-[#a75b21]">1年以内</span></div></div><div className="mt-3 flex items-end justify-between rounded-2xl bg-[#175d68] p-4 text-white"><div><p className="text-xs text-[#b7d7d4]">毎月の積み立て目安</p><p className="mt-1 font-display text-2xl font-bold">¥18,400</p></div><TrendingUp size={26} className="text-[#ffdc78]" /></div></div>
    </section>

    <section className="fade-up md:col-span-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold tracking-[.12em] text-[#b17a26]">START HERE</p><h2 className="mt-2 font-display text-2xl font-bold tracking-[-.03em] text-[#174f5b]">目的から選ぶ</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-[#617b80]">どこから見ればいいか迷ったら、気になるテーマから選んでください。</p></div><a href="/life-cost-tools/" className="text-sm font-bold text-[#176873] underline decoration-[#9fcac5] underline-offset-4 hover:text-[#0d4953]">すべての計算ツールを見る →</a></div>
      <nav className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="目的から選ぶ">
        {[
          { href: '/future-major-expenses-guide/', icon: '🗓️', kicker: '全体を見たい', title: '5年以内の大きな出費', text: '家電・車・住まい・税金などを1年・3年・5年で整理。' },
          { href: '/appliance-5year-cost/', icon: '📺', kicker: '家電が気になる', title: '5年間の家電出費', text: '買い替え時期が重なる家電と、必要になりそうな費用を確認。' },
          { href: '/car-annual-cost/', icon: '🚙', kicker: '車が気になる', title: '車の年間維持費', text: 'ガソリン・駐車場・保険・税金・車検をまとめて計算。' },
          { href: '/homeowner-expenses-guide/', icon: '🏡', kicker: '持ち家が気になる', title: '持ち家の維持費', text: '固定資産税・保険・住宅設備や修繕の予定を整理。' },
        ].map((item) => <a key={item.href} href={item.href} data-home-featured data-featured-category={item.kicker} className="group rounded-[22px] border border-[#cfe4e1] bg-white p-5 shadow-[0_8px_24px_rgba(48,111,121,.07)] transition hover:-translate-y-1 hover:border-[#8fc8c5] hover:shadow-[0_14px_34px_rgba(48,111,121,.12)]"><div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef8f7] text-xl" aria-hidden="true">{item.icon}</span><span className="rounded-full bg-[#fff5d8] px-2.5 py-1 text-[10px] font-bold text-[#a87525]">{item.kicker}</span></div><h3 className="mt-4 text-base font-bold text-[#174f5b] group-hover:text-[#0d4953]">{item.title}</h3><p className="mt-2 text-xs leading-6 text-[#6b8588]">{item.text}</p><span className="mt-4 inline-flex text-xs font-bold text-[#176873]">見てみる →</span></a>)}
      </nav>
    </section>

    <section className="fade-up md:col-span-2 rounded-[28px] border border-[#cfe4e1] bg-white/80 p-5 shadow-[0_14px_38px_rgba(48,111,121,.08)] sm:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold tracking-[.12em] text-[#b17a26]">FREE TOOLS</p><h2 className="mt-2 font-display text-2xl font-bold tracking-[-.03em] text-[#174f5b]">気になる出費から選べる無料計算ツール</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-[#617b80]">家電の買い替え、車検、住宅設備など、気になる出費だけをすぐに計算できます。</p></div><a href="/life-cost-tools/" className="text-sm font-bold text-[#176873] underline decoration-[#9fcac5] underline-offset-4 hover:text-[#0d4953]">すべての計算ツールを見る →</a></div>
      <nav className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="無料計算ツール">
        {[
          { href: '/refrigerator-lifespan/', label: '冷蔵庫の寿命・買い替え時期' }, { href: '/washing-machine-lifespan/', label: '洗濯機の寿命・買い替え時期' }, { href: '/aircon-lifespan/', label: 'エアコンの寿命・買い替え時期' }, { href: '/car-inspection-when/', label: '次の車検時期・積立額' }, { href: '/car-annual-cost/', label: '車の年間維持費' }, { href: '/water-heater-replacement-cost/', label: '給湯器の交換費用・積立額' }, { href: '/exterior-wall-painting-cost/', label: '外壁塗装・リフォーム費用' }, { href: '/roof-repair-cost/', label: '屋根塗装・屋根修理費用' }, { href: '/car-tax-savings/', label: '自動車税の支払い・積立額' }, { href: '/property-tax-savings/', label: '固定資産税の支払い・積立額' }, { href: '/fire-insurance-renewal/', label: '火災保険の更新・積立額' }, { href: '/earthquake-insurance-renewal/', label: '地震保険の更新・積立額' },
        ].map((tool) => <a key={tool.href} href={tool.href} data-home-tool className="rounded-2xl border border-[#d5e8e5] bg-[#f7fbfa] px-4 py-4 text-sm font-bold leading-6 text-[#315e64] transition hover:-translate-y-0.5 hover:border-[#9fcac5] hover:bg-white hover:text-[#175d68]">{tool.label} →</a>)}
      </nav>
      <div className="mt-6 border-t border-[#dcebea] pt-5"><p className="text-xs font-bold tracking-[.12em] text-[#b17a26]">GUIDES</p><h3 className="mt-2 text-lg font-bold text-[#174f5b]">まとめて知りたい人向け</h3><div className="mt-3 grid gap-3 sm:grid-cols-3">
        <a data-home-guide href="/appliance-replacement-guide/" className="rounded-2xl bg-[#eef8f7] px-4 py-4 text-sm font-bold leading-6 text-[#315e64] hover:bg-white hover:text-[#175d68]">家電の買い替え時期一覧 →</a><a data-home-guide href="/home-maintenance-cost-guide/" className="rounded-2xl bg-[#eef8f7] px-4 py-4 text-sm font-bold leading-6 text-[#315e64] hover:bg-white hover:text-[#175d68]">住宅設備・リフォームの出費一覧 →</a><a data-home-guide href="/annual-expenses-guide/" className="rounded-2xl bg-[#eef8f7] px-4 py-4 text-sm font-bold leading-6 text-[#315e64] hover:bg-white hover:text-[#175d68]">毎年・数年ごとの出費一覧 →</a><a data-home-guide href="/homeowner-expenses-guide/" className="rounded-2xl bg-[#eef8f7] px-4 py-4 text-sm font-bold leading-6 text-[#315e64] hover:bg-white hover:text-[#175d68]">持ち家の出費一覧 →</a><a data-home-guide href="/car-cost-guide/" className="rounded-2xl bg-[#eef8f7] px-4 py-4 text-sm font-bold leading-6 text-[#315e64] hover:bg-white hover:text-[#175d68]">車にかかる出費一覧 →</a><a data-home-guide href="/future-major-expenses-guide/" className="rounded-2xl bg-[#eef8f7] px-4 py-4 text-sm font-bold leading-6 text-[#315e64] hover:bg-white hover:text-[#175d68]">5年先の大きな出費一覧 →</a><a data-home-guide href="/single-living-expenses-guide/" className="rounded-2xl bg-[#eef8f7] px-4 py-4 text-sm font-bold leading-6 text-[#315e64] hover:bg-white hover:text-[#175d68]">一人暮らしの出費一覧 →</a><a data-home-guide href="/family-household-expenses-guide/" className="rounded-2xl bg-[#eef8f7] px-4 py-4 text-sm font-bold leading-6 text-[#315e64] hover:bg-white hover:text-[#175d68]">家族世帯の大きな出費 →</a><a data-home-guide href="/moving-expenses-guide/" className="rounded-2xl bg-[#eef8f7] px-4 py-4 text-sm font-bold leading-6 text-[#315e64] hover:bg-white hover:text-[#175d68]">引っ越しでかかる費用一覧 →</a><a data-home-guide href="/rental-expenses-guide/" className="rounded-2xl bg-[#eef8f7] px-4 py-4 text-sm font-bold leading-6 text-[#315e64] hover:bg-white hover:text-[#175d68]">賃貸でかかる出費一覧 →</a><a data-home-guide href="/childraising-expenses-guide/" className="rounded-2xl bg-[#eef8f7] px-4 py-4 text-sm font-bold leading-6 text-[#315e64] hover:bg-white hover:text-[#175d68]">子育て世帯の大きな出費 →</a><a data-home-guide href="/new-life-expenses-guide/" className="rounded-2xl bg-[#eef8f7] px-4 py-4 text-sm font-bold leading-6 text-[#315e64] hover:bg-white hover:text-[#175d68]">新生活の出費チェック →</a><a data-home-guide href="/yearly-expense-check-guide/" className="rounded-2xl bg-[#eef8f7] px-4 py-4 text-sm font-bold leading-6 text-[#315e64] hover:bg-white hover:text-[#175d68]">年1回の家計見直し →</a>
      </div></div>
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
    {step === 1 && <div><p className="text-xs font-bold tracking-[.12em] text-[#2c9190]">STEP 1 / 3</p><h1 className="mt-2 font-display text-3xl font-bold tracking-[-.05em] text-[#174f5b]">まずは、わが家のこと</h1><p className="mt-3 text-sm leading-7 text-[#6b8588]">ざっくりで大丈夫です。あとからいつでも変更できます。</p><div className="mt-8 space-y-7"><div><FieldLabel>世帯人数 <span className="font-normal text-[#8aa0a2]">（大人・子どもを含む）</span></FieldLabel><div className="flex items-center gap-3"><button type="button" data-testid="button-household-decrease" onClick={() => setData({ ...data, householdSize: Math.max(1, data.householdSize - 1) })} className="grid h-11 w-11 place-items-center rounded-xl border border-[#d5e5e4] text-lg text-[#3e7478] hover:bg-[#eef8f7]">−</button><span data-testid="text-household-size" className="w-16 text-center font-display text-2xl font-bold text-[#175d68]">{data.householdSize}<span className="ml-1 text-sm font-medium">人</span></span><button type="button" data-testid="button-household-increase" onClick={() => setData({ ...data, householdSize: Math.min(20, data.householdSize + 1) })} className="grid h-11 w-11 place-items-center rounded-xl border border-[#d5e5e4] text-lg text-[#3e7478] hover:bg-[#eef8f7]">＋</button></div></div><div><FieldLabel>住まいのタイプ</FieldLabel><div className="grid grid-cols-1 gap-2 sm:grid-cols-3">{HOUSING_TYPES.map((housing) => <ChoiceButton key={housing} testId={`button-housing-${housing}`} selected={data.housing === housing} onClick={() => setData({ ...data, housing })}>{housing}</ChoiceButton>)}</div></div><div><FieldLabel>車を持っていますか？</FieldLabel><div className="grid grid-cols-2 gap-2"><ChoiceButton testId="button-car-no" selected={!data.car} onClick={() => setData({ ...data, car: false })}>なし</ChoiceButton><ChoiceButton testId="button-car-yes" selected={data.car} onClick={() => setData({ ...data, car: true })}>あり</ChoiceButton></div></div>{data.car && <div className="grid gap-4 rounded-2xl bg-[#f4faf9] p-4 sm:grid-cols-2"><div><FieldLabel>車検の月</FieldLabel><select data-testid="select-car-inspection-month" value={data.carInspectionMonth} onChange={(e) => setData({ ...data, carInspectionMonth: e.target.value })} className="input-style">{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}月</option>)}</select></div><div><FieldLabel>車検の見込み総額</FieldLabel><div className="flex items-center gap-2"><input data-testid="input-car-inspection-cost" type="number" min="0" step="1000" value={data.carInspectionCost || ''} onChange={(e) => setData({ ...data, carInspectionCost: Math.max(0, Number(e.target.value) || 0) })} placeholder="例：100000" className="input-style" /><span className="text-xs text-[#779095]">円</span></div></div><div><FieldLabel>保険更新の月</FieldLabel><select data-testid="select-car-insurance-month" value={data.carInsuranceMonth} onChange={(e) => setData({ ...data, carInsuranceMonth: e.target.value })} className="input-style">{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}月</option>)}</select></div><div><FieldLabel>次回保険料の見込み</FieldLabel><div className="flex items-center gap-2"><input data-testid="input-car-insurance-cost" type="number" min="0" step="1000" value={data.carInsuranceCost || ''} onChange={(e) => setData({ ...data, carInsuranceCost: Math.max(0, Number(e.target.value) || 0) })} placeholder="更新案内の金額" className="input-style" /><span className="text-xs text-[#779095]">円</span></div></div><p className="text-[11px] leading-5 text-[#789396] sm:col-span-2">金額は見積もり・更新案内などで分かれば入力してください。未入力は0円として予報し、固定の全国平均額は使いません。</p></div>}</div></div>}
    {step === 2 && <div><p className="text-xs font-bold tracking-[.12em] text-[#2c9190]">STEP 2 / 3</p><h1 className="mt-2 font-display text-3xl font-bold tracking-[-.05em] text-[#174f5b]">家電の年齢と予定額を教えてください</h1><p className="mt-3 text-sm leading-7 text-[#6b8588]">持っている家電だけ、購入年と買い替えに用意したい金額を入力。金額は試算用の仮額を入れてあるので、予定に合わせて変更できます。</p><div className="mt-7 space-y-2.5">{APPLIANCE_KEYS.map((key) => <div key={key} className={`rounded-2xl border p-3.5 transition-colors ${data.appliances[key].owned ? 'border-[#d5e5e4] bg-white' : 'border-[#e6eeee] bg-[#f8fbfb]'}`}><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf7f6] text-[#287d82]"><Tv size={17} /></span><span className="flex-1 text-sm font-bold text-[#315e64]">{key}</span><button type="button" data-testid={`button-appliance-owned-${key}`} onClick={() => updateAppliance(key, { owned: !data.appliances[key].owned })} className={`relative h-6 w-11 rounded-full transition-colors ${data.appliances[key].owned ? 'bg-[#2d9290]' : 'bg-[#cbd9da]'}`} aria-label={`${key}の所有状態`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${data.appliances[key].owned ? 'left-6' : 'left-1'}`} /></button></div>{data.appliances[key].owned && <div className="mt-3 grid gap-3 pl-12 sm:grid-cols-2"><div><label className="text-xs text-[#779095]" htmlFor={`year-${key}`}>購入年</label><div className="mt-1 flex items-center gap-2"><input id={`year-${key}`} data-testid={`input-appliance-year-${key}`} type="number" min="1980" max={currentYear} value={data.appliances[key].purchaseYear} onChange={(e) => updateAppliance(key, { purchaseYear: e.target.value })} className="input-style h-9 w-full py-1 text-sm" /><span className="text-xs text-[#779095]">年</span></div><p className="mt-1 text-[10px] text-[#94a7a9]">買い替え目安 {APPLIANCE_LIFETIMES[key].years}年</p></div><div><label className="text-xs text-[#779095]" htmlFor={`cost-${key}`}>買い替え予定額</label><div className="mt-1 flex items-center gap-2"><input id={`cost-${key}`} data-testid={`input-appliance-cost-${key}`} type="number" min="0" step="1000" value={data.appliances[key].expectedCost || ''} onChange={(e) => updateAppliance(key, { expectedCost: Math.max(0, Number(e.target.value) || 0) })} className="input-style h-9 w-full py-1 text-sm" /><span className="text-xs text-[#779095]">円</span></div><p className="mt-1 text-[10px] text-[#94a7a9]">初期値は試算用の仮額です</p></div></div>}</div>)}</div></div>}
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
  APPLIANCE_KEYS.forEach((key) => {
    const appliance = data.appliances[key];
    if (!appliance.owned || !appliance.purchaseYear || !Number.isFinite(Number(appliance.purchaseYear))) return;
    const life = APPLIANCE_LIFETIMES[key];
    const year = Number(appliance.purchaseYear) + life.years;
    if (year < now.getFullYear()) return; // 過去の目安は別の注意欄に表示する
    items.push({ id: `appliance-${key}`, name: `${key}の買い替え目安`, year, month: now.getMonth() + 1, amount: Math.max(0, Number(appliance.expectedCost) || 0), status: getStatus(year, now.getMonth() + 1), kind: 'appliance' });
  });
  if (data.car) {
    const addCarEvents = (id: string, name: string, monthValue: string, amount: number, interval: number) => {
      const startMonth = Number(monthValue) || now.getMonth() + 1;
      let next = addMonths(currentYear, startMonth, startMonth < now.getMonth() + 1 ? 12 : 0);
      for (let index = 0; monthsFromNow(next.year, next.month) <= 60; index += 1) {
        items.push({ id: `${id}-${index}`, name, year: next.year, month: next.month, amount: Math.max(0, Number(amount) || 0), status: getStatus(next.year, next.month), kind: 'car' });
        next = addMonths(next.year, next.month, interval);
      }
    };
    addCarEvents('car-inspection', '車検', data.carInspectionMonth, data.carInspectionCost, 24);
    addCarEvents('car-insurance', '自動車保険の更新', data.carInsuranceMonth, data.carInsuranceCost, 12);
  }
  data.expenses.filter((expense) => expense.frequency !== '毎月').forEach((expense) => {
    const parsed = parseMonth(expense.nextMonth);
    const interval = expense.frequency === '毎月' ? 1 : expense.frequency === '2年ごと' ? 24 : 12;
    let next = parsed;
    const past = -monthsFromNow(next.year, next.month);
    if (past > 0) next = addMonths(next.year, next.month, Math.ceil(past / interval) * interval);
    for (let index = 0; monthsFromNow(next.year, next.month) <= 60; index += 1) {
      items.push({ id: `expense-${expense.id}-${index}`, name: expense.name, year: next.year, month: next.month, amount: expense.amount, status: getStatus(next.year, next.month), kind: 'expense' });
      next = addMonths(next.year, next.month, interval);
    }
  });
  return items.sort((a, b) => a.year - b.year || a.month - b.month);
}

function Result({ data, onDataChange, onEditSettings, onReset, onExport, onImport, backupMessage }: { data: HouseholdData; onDataChange: (data: HouseholdData) => void; onEditSettings: () => void; onReset: () => void; onExport: () => void; onImport: (event: ChangeEvent<HTMLInputElement>) => void; backupMessage: string }) {
  const timeline = useMemo(() => buildTimeline(data), [data]);
  const appliances = APPLIANCE_KEYS.filter((key) => data.appliances[key].owned);
  const monthlyFixed = data.expenses.filter((item) => item.frequency === '毎月').reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0), 0);
  const overdue = appliances.filter((key) => { const y = Number(data.appliances[key].purchaseYear); return y >= 1980 && y + APPLIANCE_LIFETIMES[key].years < new Date().getFullYear(); });
  const now = new Date();
  const monthlyRows = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() + index, 1);
    const year = date.getFullYear(), month = date.getMonth() + 1;
    return { year, month, total: timeline.filter((item) => item.year === year && item.month === month).reduce((sum, item) => sum + item.amount, 0) };
  });
  const yearlyRows = Array.from({ length: 5 }, (_, index) => {
    const year = now.getFullYear() + index;
    return { year, total: timeline.filter((item) => item.year === year).reduce((sum, item) => sum + item.amount, 0) };
  });
  const maxYearTotal = Math.max(1, ...yearlyRows.map((row) => row.total));
  const upcoming = timeline.filter((item) => monthsFromNow(item.year, item.month) >= 0 && monthsFromNow(item.year, item.month) <= 3);
  const [horizon, setHorizon] = useState<1 | 3 | 5>(3);
  const visibleTimeline = timeline.filter((item) => monthsFromNow(item.year, item.month) <= horizon * 12);
  const threeYearItems = timeline.filter((item) => monthsFromNow(item.year, item.month) <= 36);
  const forecast = (years: number) => timeline.filter((item) => monthsFromNow(item.year, item.month) <= years * 12).reduce((sum, item) => sum + item.amount, 0);
  const monthlySaving = Math.ceil(forecast(3) / 36 / 100) * 100;
  let cumulative = 0;
  const deadlineMonthly = timeline.filter((item) => monthsFromNow(item.year, item.month) <= 36).reduce((max, item) => {
    cumulative += item.amount;
    return Math.max(max, Math.ceil(cumulative / Math.max(1, monthsFromNow(item.year, item.month) + 1) / 100) * 100);
  }, 0);
  const nearest = timeline[0];
  return <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-3 sm:px-8 sm:pt-9 lg:px-10"><section className="fade-up relative overflow-hidden rounded-[28px] bg-[#175d68] px-6 py-8 text-white shadow-[0_14px_40px_rgba(23,93,104,.22)] sm:px-10 sm:py-10"><div className="absolute -right-8 -top-16 h-44 w-44 rounded-full border-[18px] border-[#ffdb77]/30" /><div className="absolute -bottom-24 right-28 h-52 w-52 rounded-full border-[22px] border-[#8bd2cc]/15" /><div className="relative max-w-2xl"><div className="flex items-center gap-2 text-xs font-bold text-[#b6e0da]"><CloudSun size={17} /> 今日のくらし予報</div><h1 data-testid="text-result-title" className="mt-3 font-display text-3xl font-bold tracking-[-.06em] sm:text-5xl">あなたの未来の出費予報</h1><p className="mt-4 max-w-xl text-sm leading-7 text-[#d1ebe6]">入力した金額と家電の買い替え目安をもとに、まとまった出費のタイミングを整理しました。必要な分を少しずつ準備していきましょう。</p><div className="mt-7 flex flex-wrap items-end gap-x-10 gap-y-4"><div><p className="text-xs text-[#acd5d1]">大きな出費の積立（月平均）</p><p data-testid="text-monthly-saving" className="mt-1 font-display text-3xl font-bold text-white">{yen(monthlySaving)}<span className="ml-1 text-sm font-medium text-[#acd5d1]">/月</span></p></div><div className="border-l border-[#4e8990] pl-5"><p className="text-xs text-[#acd5d1]">月々の固定費（別枠）</p><p data-testid="text-monthly-fixed" className="mt-1 text-sm font-bold text-white">{yen(monthlyFixed)}/月</p></div>{nearest && <div className="border-l border-[#4e8990] pl-5"><p className="text-xs text-[#acd5d1]">いちばん近い予定</p><p data-testid="text-nearest-event" className="mt-1 text-sm font-bold text-[#fff0bd]">{nearest.name}</p></div>}</div></div></section><section className="mt-5 grid gap-4 sm:grid-cols-3"><ForecastCard label="今後1年間の予想支出" value={forecast(1)} accent="sun" note={`${timeline.filter((item) => monthsFromNow(item.year, item.month) <= 12).length}件の予定`} /><ForecastCard label="今後3年間の予想支出" value={forecast(3)} accent="mint" note={`${threeYearItems.length}件の予定`} /><ForecastCard label="今後5年間の予想支出" value={forecast(5)} accent="sky" note="未来の予定も含めて" /></section><div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_.75fr]"><section className="fade-up fade-up-delay-1 rounded-[24px] border border-[#d4e6e4] bg-white p-5 shadow-[0_8px_28px_rgba(48,111,121,.06)] sm:p-7"><div className="flex items-end justify-between"><div><p className="text-xs font-bold tracking-[.1em] text-[#398b8d]">LIFE TIMELINE</p><h2 className="mt-1 font-display text-2xl font-bold tracking-[-.04em] text-[#174f5b]">これからの予定</h2></div><div className="flex gap-1.5 text-[10px] font-bold text-[#799295]"><span className="rounded-full bg-[#fff0d9] px-2 py-1 text-[#a75b21]">もうすぐ</span><span className="hidden rounded-full bg-[#e5f4ec] px-2 py-1 text-[#287052] sm:inline">1年以内</span></div></div><div className="mt-5 flex flex-wrap gap-2" aria-label="予報の表示期間">{([1, 3, 5] as const).map((years) => <button type="button" key={years} aria-pressed={horizon === years} onClick={() => setHorizon(years)} className={horizon === years ? 'rounded-full bg-[#175d68] px-4 py-2 text-xs font-bold text-white' : 'rounded-full bg-[#eef7f5] px-4 py-2 text-xs font-bold text-[#26666e]'}>{years}年</button>)}</div>{visibleTimeline.length === 0 ? <EmptyTimeline /> : <div className="relative mt-7 space-y-3 before:absolute before:bottom-3 before:left-[17px] before:top-3 before:w-px before:bg-[#d6e8e5]">{visibleTimeline.map((item) => <TimelineRow key={item.id} item={item} />)}</div>}</section><aside className="space-y-6"><section className="fade-up fade-up-delay-2 rounded-[24px] border border-[#d4e6e4] bg-white p-5 shadow-[0_8px_28px_rgba(48,111,121,.06)] sm:p-7"><div className="flex items-start justify-between"><div><p className="text-xs font-bold tracking-[.1em] text-[#398b8d]">MY HOUSEHOLD</p><h2 className="mt-1 font-display text-xl font-bold text-[#174f5b]">わが家の設定</h2></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eef8f7] text-[#287d82]"><Settings2 size={17} /></span></div><div className="mt-5 grid grid-cols-2 gap-2.5 text-xs"><MiniFact icon={<UserRound size={14} />} label="世帯人数" value={`${data.householdSize}人`} /><MiniFact icon={<Home size={14} />} label="住まい" value={data.housing} /><MiniFact icon={<CarFront size={14} />} label="車" value={data.car ? 'あり' : 'なし'} /><MiniFact icon={<Tv size={14} />} label="登録家電" value={`${appliances.length}台`} /></div><button type="button" data-testid="button-edit-diagnostic" onClick={onEditSettings} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#cfe2e0] py-2.5 text-xs font-bold text-[#33777a] hover:bg-[#f2faf9]"><Pencil size={14} /> 設定を編集する</button></section><section className="fade-up fade-up-delay-3 rounded-[24px] bg-[#fff5d8] p-5 sm:p-7"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#d5942f]"><CircleHelp size={18} /></span><div><h2 className="text-sm font-bold text-[#765221]">予報の見方</h2><p className="mt-2 text-xs leading-6 text-[#876e47]">家電は購入年と買い替え予定額、車は入力した予定月と見込み額、定期支出は登録内容から計算しています。家電の買い替え時期と初期金額は試算用の目安なので、実際の予定が分かれば設定を更新してください。</p></div></div></section></aside></div>
<section className="mt-7 grid gap-4 lg:grid-cols-2">
  <div className="rounded-[24px] border border-[#d4e6e4] bg-white p-5 sm:p-7">
    <h2 className="font-display text-xl font-bold text-[#174f5b]">毎月いくら積み立てる？</h2>
    <p className="mt-2 text-sm leading-7 text-[#617b80]">今後3年間のまとまった出費の月平均と、支払いが早い予定にも備える月額を分けて表示します。貯蓄済みの金額は差し引いていません。</p>
    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-[#eef8f7] p-4"><p className="text-xs text-[#53777b]">3年間の月平均</p><p className="mt-2 text-lg font-bold text-[#175d68]">{yen(monthlySaving)}</p></div>
      <div className="rounded-xl bg-[#fff5d8] p-4"><p className="text-xs text-[#846730]">期限から逆算した月額</p><p data-testid="text-deadline-saving" className="mt-2 text-lg font-bold text-[#765221]">{yen(deadlineMonthly)}</p></div>
    </div>
    <p className="mt-3 text-xs leading-6 text-[#6b8588]">直近の出費が大きいほど右の金額は高くなります。月々の固定費 {yen(monthlyFixed)} は、どちらの積立計算にも含めていません。</p>
  </div>
  <div className="rounded-[24px] border border-[#d4e6e4] bg-white p-5 sm:p-7">
    <h2 className="font-display text-xl font-bold text-[#174f5b]">もうすぐの予定</h2>
    <p className="mt-2 text-sm leading-7 text-[#617b80]">今月から3か月先までの予定です。通知許可は不要です。</p>
    {upcoming.length === 0 ? <p className="mt-4 rounded-xl bg-[#eef8f7] p-4 text-sm text-[#53777b]">直近3か月に予定はありません。</p> : <ul className="mt-4 space-y-2">{upcoming.map((item) => <li key={item.id} className="flex justify-between gap-3 rounded-xl bg-[#fff5e4] p-3 text-sm"><span>{item.name}（{item.kind === 'appliance' ? item.year + '年ごろ' : item.year + '年' + item.month + '月'}）</span><strong>{yen(item.amount)}</strong></li>)}</ul>}
    {overdue.length > 0 && <div className="mt-4 rounded-xl bg-[#fff3e7] p-4"><p className="text-sm font-bold text-[#99602b]">買い替え目安年を過ぎた家電</p><p className="mt-2 text-xs leading-6 text-[#99602b]">{overdue.join('・')}。直ちに故障する意味ではありません。状態を確認し、必要なら購入年や予定額を更新してください。過去の金額は未来の予報に加算していません。</p></div>}
  </div>
</section>
<section className="mt-7 rounded-[24px] border border-[#d4e6e4] bg-white p-5 sm:p-7">
  <h2 className="font-display text-xl font-bold text-[#174f5b]">年間のまとまった出費グラフ</h2>
  <p className="mt-2 text-sm leading-7 text-[#617b80]">出費が集中する年を確認できます。毎月の固定費は除外しています。</p>
  <div className="mt-5 space-y-3" role="img" aria-label="年間のまとまった出費の棒グラフ">
    {yearlyRows.map((row) => <div key={row.year} className="grid grid-cols-[52px_1fr_auto] items-center gap-3 text-xs"><span className="font-bold text-[#53777b]">{row.year}年</span><div className="h-6 overflow-hidden rounded-full bg-[#eef4f4]"><div className="h-full rounded-full bg-[#49a5a2]" style={{ width: String(row.total / maxYearTotal * 100) + '%' }} /></div><span className="min-w-[76px] text-right font-bold text-[#175d68]">{yen(row.total)}</span></div>)}
  </div>
</section>
<section className="mt-7 rounded-[24px] border border-[#d4e6e4] bg-white p-5 sm:p-7">
  <h2 className="font-display text-xl font-bold text-[#174f5b]">これから12か月の出費カレンダー</h2>
  <p className="mt-2 text-sm leading-7 text-[#617b80]">月ごとの大きな出費を確認できます。購入年のみ入力する家電は、便宜上その年の現在の月として表示しています。</p>
  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
    {monthlyRows.map((row) => <div key={row.year + '-' + row.month} className={row.total > 0 ? 'rounded-xl border border-[#cfe2e0] bg-[#f0faf8] p-3' : 'rounded-xl border border-[#e1eeee] bg-[#fafdfc] p-3'}><p className="text-xs font-bold text-[#53777b]">{row.year}年 {row.month}月</p><p className={row.total > 0 ? 'mt-2 text-sm font-bold text-[#175d68]' : 'mt-2 text-sm text-[#8ba0a3]'}>{row.total > 0 ? yen(row.total) : '予定なし'}</p></div>)}
  </div>
</section>
<section className="mt-7 rounded-[24px] border border-[#d4e6e4] bg-white p-5 sm:p-7">
  <h2 className="font-display text-xl font-bold text-[#174f5b]">予定額を変えてシミュレーション</h2>
  <p className="mt-2 text-sm leading-7 text-[#617b80]">金額や購入年を変更すると予報とグラフが即座に更新され、同じ端末に保存されます。家電の初期金額は試算用の仮額です。</p>
  <div className="mt-5 grid gap-3 sm:grid-cols-2">
    {appliances.map((key) => <div key={key} className="rounded-xl bg-[#f5faf9] p-3">
      <label className="block text-sm font-bold text-[#315e64]" htmlFor={'quick-cost-' + key}>{key}の予定額</label>
      <div className="mt-2 flex items-center gap-2"><input id={'quick-cost-' + key} type="number" min="0" step="1000" className="input-style" value={data.appliances[key].expectedCost} onChange={(e) => onDataChange({ ...data, appliances: { ...data.appliances, [key]: { ...data.appliances[key], expectedCost: Math.max(0, Number(e.target.value) || 0) } } })} /><span className="text-sm text-[#779095]">円</span></div>
      <label className="mt-3 block text-xs text-[#779095]" htmlFor={'quick-year-' + key}>購入年</label>
      <input id={'quick-year-' + key} type="number" min="1980" max={currentYear} className="input-style mt-1" value={data.appliances[key].purchaseYear} onChange={(e) => onDataChange({ ...data, appliances: { ...data.appliances, [key]: { ...data.appliances[key], purchaseYear: e.target.value } } })} />
    </div>)}
    {data.car && <div className="rounded-xl bg-[#f5faf9] p-3"><label htmlFor="quick-car-inspection" className="block text-sm font-bold text-[#315e64]">車検の見込み額</label><input id="quick-car-inspection" type="number" min="0" className="input-style mt-2" value={data.carInspectionCost || ''} placeholder="見積もり金額" onChange={(e) => onDataChange({ ...data, carInspectionCost: Math.max(0, Number(e.target.value) || 0) })} /><label htmlFor="quick-car-insurance" className="mt-3 block text-sm font-bold text-[#315e64]">自動車保険の契約額</label><input id="quick-car-insurance" type="number" min="0" className="input-style mt-2" value={data.carInsuranceCost || ''} placeholder="契約額" onChange={(e) => onDataChange({ ...data, carInsuranceCost: Math.max(0, Number(e.target.value) || 0) })} /></div>}
  </div>
</section>
<section className="mt-7 rounded-[24px] border border-[#d4e6e4] bg-white p-5 sm:p-7">
  <h2 className="font-display text-xl font-bold text-[#174f5b]">データのバックアップ・復元</h2>
  <p className="mt-2 text-sm leading-7 text-[#617b80]">入力は端末に保存されます。ブラウザーのデータ削除や機種変更に備え、JSONファイルで保存・復元できます。復元時は現在のデータを上書きします。</p>
  <div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={onExport} className="rounded-xl bg-[#175d68] px-4 py-3 text-sm font-bold text-white">バックアップを保存</button><label className="cursor-pointer rounded-xl border border-[#a7ceca] px-4 py-3 text-sm font-bold text-[#175d68]">ファイルから復元<input type="file" accept=".json,application/json" onChange={onImport} className="sr-only" aria-label="バックアップファイルを選択" /></label></div>
  {backupMessage && <p role="status" className="mt-3 text-sm text-[#315e64]">{backupMessage}</p>}
</section>
<section className="mt-7 fade-up fade-up-delay-2"><ExpenseEditor expenses={data.expenses} onChange={(expenses) => onDataChange({ ...data, expenses })} /><button type="button" data-testid="button-reset-data" onClick={onReset} className="mt-8 flex items-center gap-2 text-xs font-bold text-[#8b6360] hover:text-[#b34f40]"><RotateCcw size={14} /> 保存データをすべて削除</button></section></main>;
}

function ForecastCard({ label, value, note, accent }: { label: string; value: number; note: string; accent: 'sun' | 'mint' | 'sky' }) {
  const color = accent === 'sun' ? 'bg-[#fff5dc] text-[#c18128]' : accent === 'mint' ? 'bg-[#e4f5ef] text-[#328370]' : 'bg-[#e5f4f7] text-[#367e8b]';
  return <div className="lift rounded-[20px] border border-[#d4e6e4] bg-white p-5 shadow-[0_6px_20px_rgba(48,111,121,.05)]"><div className="flex items-center justify-between"><p className="text-xs font-bold text-[#678287]">{label}</p><span className={`grid h-8 w-8 place-items-center rounded-lg ${color}`}><TrendingUp size={15} /></span></div><p data-testid={`text-forecast-${label}`} className="mt-4 font-display text-2xl font-bold tracking-[-.04em] text-[#174f5b]">{yen(value)}</p><p className="mt-1 text-[11px] text-[#8aa0a2]">{note}</p></div>;
}

function TimelineRow({ item }: { item: TimelineItem }) {
  const icon = item.kind === 'appliance' ? <Tv size={15} /> : item.kind === 'car' ? <CarFront size={15} /> : <WalletCards size={15} />;
  return <div data-testid={`row-timeline-${item.id}`} className="relative flex items-center gap-3 rounded-2xl bg-[#fbfdfd] px-3 py-3.5 pl-2"><span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#e6f3f1] text-[#287d82] ring-4 ring-white">{icon}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#315e64]">{item.name}</p><p className="mt-1 text-[11px] text-[#8aa0a2]">{item.kind === 'appliance' ? item.year + '年ごろ' : item.year + '年 ' + item.month + '月'}</p></div><div className="text-right"><span className={`inline-block rounded-full px-2 py-1 text-[10px] font-bold ${statusClass(item.status)}`}>{item.status}</span><p className="mt-1 font-display text-sm font-bold text-[#175d68]">{item.amount > 0 ? yen(item.amount) : '金額未入力'}</p></div></div>;
}

function EmptyTimeline() {
  return <div data-testid="empty-timeline" className="mt-7 rounded-2xl border border-dashed border-[#c8dfde] bg-[#f6fbfa] px-5 py-12 text-center"><CalendarDays size={28} className="mx-auto text-[#6eacab]" /><p className="mt-3 text-sm font-bold text-[#53777b]">まだ予定がありません</p><p className="mt-1 text-xs text-[#8aa0a2]">定期的な支出を追加すると、ここに表示されます。</p></div>;
}

function MiniFact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-xl bg-[#f3f9f8] p-3"><div className="flex items-center gap-1.5 text-[#6a9898]">{icon}<span className="text-[10px]">{label}</span></div><p className="mt-1.5 truncate text-xs font-bold text-[#315e64]">{value}</p></div>;
}

function normalizeBackupData(value: unknown): HouseholdData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('有効なバックアップデータではありません。');
  const raw = value as Partial<HouseholdData>;
  const base = createInitialData();
  const safeCost = (x: unknown) => Number.isFinite(Number(x)) && Number(x) >= 0 ? Math.min(Number(x), 1e10) : 0;
  const safeMonth = (x: unknown, fallback: string) => typeof x === 'string' && /^(?:\d{4}-(?:0[1-9]|1[0-2])|(?:[1-9]|1[0-2]))$/.test(x) ? x : fallback;
  const incoming = raw.appliances ?? base.appliances;
  const appliances = Object.fromEntries(APPLIANCE_KEYS.map((key) => {
    const item = incoming[key] ?? base.appliances[key];
    const year = Number(item.purchaseYear);
    return [key, { owned: typeof item.owned === 'boolean' ? item.owned : base.appliances[key].owned, purchaseYear: Number.isInteger(year) && year >= 1980 && year <= currentYear ? String(year) : base.appliances[key].purchaseYear, expectedCost: safeCost(item.expectedCost) }];
  })) as HouseholdData['appliances'];
  const expenses = Array.isArray(raw.expenses) ? raw.expenses.filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string' && item.name.length <= 100 && ['毎月', '毎年', '2年ごと'].includes(item.frequency) && Number.isFinite(Number(item.amount)) && Number(item.amount) > 0).slice(0, 200).map((item) => ({ id: item.id, name: item.name, amount: safeCost(item.amount), nextMonth: safeMonth(item.nextMonth, String(currentYear) + '-01'), frequency: item.frequency as Frequency })) : [];
  return { householdSize: Number.isInteger(raw.householdSize) && Number(raw.householdSize) >= 1 && Number(raw.householdSize) <= 20 ? Number(raw.householdSize) : base.householdSize, housing: HOUSING_TYPES.includes(raw.housing as HouseholdData['housing']) ? raw.housing as HouseholdData['housing'] : base.housing, car: raw.car === true, carInspectionMonth: safeMonth(raw.carInspectionMonth, base.carInspectionMonth), carInspectionCost: safeCost(raw.carInspectionCost), carInsuranceMonth: safeMonth(raw.carInsuranceMonth, base.carInsuranceMonth), carInsuranceCost: safeCost(raw.carInsuranceCost), appliances, expenses };
}

function App() {
  const initial = useMemo(loadSaved, []);
  const [stage, setStage] = useState<AppStage>(initial.stage);
  const [showDecisionHub, setShowDecisionHub] = useState(true);
  const [data, setData] = useState<HouseholdData>(initial.data);
  const [hasSaved, setHasSaved] = useState(initial.stage !== 'landing');
  const [lastStage, setLastStage] = useState<AppStage>(initial.stage === 'result' ? 'result' : 'diagnostic');
  const [backupMessage, setBackupMessage] = useState('');
  const onHome = () => { if (stage !== 'landing') setLastStage(stage); setStage('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const exportData = () => {
    const content = JSON.stringify({ format: 'kurashi-yoho-backup', version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'kurashi-yoho-backup.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setBackupMessage('バックアップを保存しました。');
  };
  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('1MB以下のファイルを選んでください。');
      const parsed = JSON.parse(await file.text()) as { format?: string; version?: number; data?: unknown };
      if (parsed.format !== 'kurashi-yoho-backup' || parsed.version !== 1) throw new Error('くらし予報のバックアップ形式ではありません。');
      const restored = normalizeBackupData(parsed.data);
      if (!window.confirm('現在の保存内容をこのファイルの内容で置き換えますか？')) return;
      setData(restored); setStage('result'); setLastStage('result'); setHasSaved(true); setBackupMessage('データを復元しました。');
    } catch (error) { setBackupMessage(error instanceof Error ? error.message : '復元に失敗しました。'); }
  };
  useEffect(() => { if (stage !== 'landing') { localStorage.setItem(STORAGE_KEY, JSON.stringify({ stage, data })); setHasSaved(true); } }, [stage, data]);
  const reset = () => { if (!window.confirm('保存データをすべて削除しますか？この操作は元に戻せません。')) return; localStorage.removeItem(STORAGE_KEY); setData(createInitialData()); setHasSaved(false); setLastStage('diagnostic'); setBackupMessage(''); setStage('landing'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const completeDiagnostic = (next: HouseholdData) => { setData(next); setStage('result'); setLastStage('result'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return <div className="app-shell">{showDecisionHub ? <DecisionHub hasSavedForecast={hasSaved} onOpenForecast={() => { setShowDecisionHub(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} /> : <><Header onHome={() => { setShowDecisionHub(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} stage={stage} />{stage === 'landing' && <Landing onStart={() => setStage(hasSaved ? lastStage : 'diagnostic')} hasSaved={hasSaved} />}{stage === 'diagnostic' && <Diagnostic initial={data} onComplete={completeDiagnostic} onBack={onHome} />}{stage === 'result' && <Result data={data} onDataChange={setData} onEditSettings={() => { setLastStage('diagnostic'); setStage('diagnostic'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onReset={reset} onExport={exportData} onImport={importData} backupMessage={backupMessage} />}<footer className="mx-auto max-w-6xl px-5 pb-7 pt-2 text-center text-[10px] tracking-[.08em] text-[#91a7a8] sm:px-8"><p>くらし予報　・　あなたの暮らしに、晴れ間を。</p><div className="mt-3 flex justify-center gap-4"><a href="/life-cost-tools/" className="hover:text-[#175d68]">無料計算ツール</a><a href="/about/" className="hover:text-[#175d68]">このサイトについて</a><a href="/privacy-policy/" className="hover:text-[#175d68]">プライバシーポリシー</a><a href="/site-map/" className="hover:text-[#175d68]">サイトマップ</a></div></footer></>}</div>;
}

export default App;