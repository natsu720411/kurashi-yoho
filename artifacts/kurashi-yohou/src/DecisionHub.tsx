import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Calculator, CarFront, Check, ChevronRight, CloudSun,
  Copy, House, PiggyBank, Refrigerator, RotateCcw, ShieldCheck,
  Sparkles, Wallet, Wrench,
} from 'lucide-react';
import './DecisionHub.css';

type ToolId = 'move' | 'appliance' | 'car';
type MoveFields = { currentRent: string; newRent: string; movingCost: string };
type ApplianceFields = { repairCost: string; replacementCost: string; repairYears: string; replacementYears: string };
type CarFields = { fuel: string; parking: string; monthlyOther: string; insurance: string; tax: string; inspection: string; inspectionYears: string; maintenance: string };
type Inputs = { move: MoveFields; appliance: ApplianceFields; car: CarFields };
type Props = { onOpenForecast: () => void; hasSavedForecast: boolean };

const STORAGE_KEY = 'kurashi-yoho-compare-v1';
const DEFAULT_INPUTS: Inputs = {
  move: { currentRent: '', newRent: '', movingCost: '' },
  appliance: { repairCost: '', replacementCost: '', repairYears: '', replacementYears: '' },
  car: { fuel: '', parking: '', monthlyOther: '', insurance: '', tax: '', inspection: '', inspectionYears: '2', maintenance: '' },
};
const DETAILED_PATHS: Record<ToolId, string> = {
  move: '/moving-value-calculator/',
  appliance: '/repair-or-replace-calculator/',
  car: '/car-or-no-car-calculator/',
};
const TOOL_LABELS: Record<ToolId, string> = {
  move: '引っ越しの損得',
  appliance: '修理・買い替え比較',
  car: '車の維持費',
};
const MAX_MONEY = 1_000_000_000;

function money(value: string): number | null {
  if (!/^\d+$/.test(value) || value.length > 10) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number <= MAX_MONEY ? number : null;
}
function optionalMoney(value: string): number | null {
  return value.trim() === '' ? 0 : money(value);
}
function positiveYears(value: string): number | null {
  if (!/^\d{1,2}$/.test(value)) return null;
  const years = Number(value);
  return years >= 1 && years <= 30 ? years : null;
}
function yen(value: number): string {
  return (value < 0 ? '−' : '') + Math.round(Math.abs(value)).toLocaleString('ja-JP') + '円';
}
function loadInputs(): Inputs {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, unknown>;
    const safeGroup = <T extends object>(name: ToolId, fallback: T): T => {
      const value = parsed[name];
      if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
      const data = value as Record<string, unknown>;
      return Object.fromEntries(Object.entries(fallback).map(([key, defaultValue]) => {
        const saved = data[key];
        return [key, typeof saved === 'string' && /^\d{0,10}$/.test(saved) ? saved : defaultValue];
      })) as T;
    };
    return {
      move: safeGroup('move', DEFAULT_INPUTS.move),
      appliance: safeGroup('appliance', DEFAULT_INPUTS.appliance),
      car: safeGroup('car', DEFAULT_INPUTS.car),
    };
  } catch {
    return DEFAULT_INPUTS;
  }
}
function initialTool(): ToolId {
  const query = new URLSearchParams(window.location.search).get('tool');
  return query === 'appliance' || query === 'car' || query === 'move' ? query : 'move';
}
function track(eventName: string, tool: ToolId) {
  const analytics = window as Window & { gtag?: (...args: unknown[]) => void };
  analytics.gtag?.('event', eventName, { tool_id: tool });
}

function MoneyField({ id, label, value, onChange, hint, suffix = '円' }: {
  id: string; label: string; value: string; onChange: (value: string) => void;
  hint?: string; suffix?: string;
}) {
  return (
    <div className="compare-field">
      <label htmlFor={id}>{label}</label>
      <div className="compare-input-wrap">
        <input id={id} type="number" min="0" max={MAX_MONEY} step="1" inputMode="numeric"
          value={value} placeholder="金額を入力" onChange={(event) => onChange(event.target.value)} />
        <span>{suffix}</span>
      </div>
      {hint && <p className="compare-field-hint">{hint}</p>}
    </div>
  );
}

function ResultMetric({ label, amount, note, primary = false }: {
  label: string; amount: string; note?: string; primary?: boolean;
}) {
  return <div className={primary ? 'compare-metric compare-metric-primary' : 'compare-metric'}>
    <span>{label}</span><strong>{amount}</strong>{note && <small>{note}</small>}
  </div>;
}

export function DecisionHub({ onOpenForecast, hasSavedForecast }: Props) {
  const [selectedTool, setSelectedTool] = useState<ToolId>(initialTool);
  const [inputs, setInputs] = useState<Inputs>(loadInputs);
  const [copyMessage, setCopyMessage] = useState('');
  const startedTools = useRef(new Set<ToolId>());
  const completedTools = useRef(new Set<ToolId>());
  const trackStart = (tool: ToolId) => {
    if (startedTools.current.has(tool)) return;
    startedTools.current.add(tool);
    track('comparison_input_start', tool);
  };
  const move = inputs.move;
  const appliance = inputs.appliance;
  const car = inputs.car;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs)); }
    catch { /* Private mode may disable browser storage. The calculators still work. */ }
  }, [inputs]);

  useEffect(() => {
    const onPopState = () => { setSelectedTool(initialTool()); setCopyMessage(''); };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const moveCurrent = money(move.currentRent);
  const moveNew = money(move.newRent);
  const moveCost = money(move.movingCost);
  const moveValid = moveCurrent !== null && moveNew !== null && moveCost !== null;
  const monthlyDifference = moveValid ? moveCurrent - moveNew : 0;
  const annualDifference = monthlyDifference * 12;
  const movePayback = moveValid && monthlyDifference > 0 ? Math.ceil(moveCost! / monthlyDifference) : null;

  const repair = money(appliance.repairCost);
  const replacement = money(appliance.replacementCost);
  const applianceValid = repair !== null && replacement !== null;
  const repairYears = appliance.repairYears.trim() ? positiveYears(appliance.repairYears) : null;
  const replacementYears = appliance.replacementYears.trim() ? positiveYears(appliance.replacementYears) : null;
  const compareYearly = applianceValid && repairYears !== null && replacementYears !== null;

  const carKeys: (keyof Omit<CarFields, 'inspectionYears'>)[] =
    ['fuel', 'parking', 'monthlyOther', 'insurance', 'tax', 'inspection', 'maintenance'];
  const carEntered = carKeys.some((key) => car[key].trim() !== '');
  const carValid = carEntered && carKeys.every((key) => optionalMoney(car[key]) !== null);
  const carYears = ['1', '2', '3'].includes(car.inspectionYears) ? Number(car.inspectionYears) : 2;
  const monthlyRunning = (optionalMoney(car.fuel) || 0) + (optionalMoney(car.parking) || 0) + (optionalMoney(car.monthlyOther) || 0);
  const annualRunning = monthlyRunning * 12
    + (optionalMoney(car.insurance) || 0) + (optionalMoney(car.tax) || 0)
    + (optionalMoney(car.maintenance) || 0) + (optionalMoney(car.inspection) || 0) / carYears;
  const breakdown = [
    { label: '燃料・充電', amount: (optionalMoney(car.fuel) || 0) * 12 },
    { label: '駐車場', amount: (optionalMoney(car.parking) || 0) * 12 },
    { label: 'その他の月額費', amount: (optionalMoney(car.monthlyOther) || 0) * 12 },
    { label: '保険', amount: optionalMoney(car.insurance) || 0 },
    { label: '税金', amount: optionalMoney(car.tax) || 0 },
    { label: '車検（年換算）', amount: (optionalMoney(car.inspection) || 0) / carYears },
    { label: '整備・消耗品', amount: optionalMoney(car.maintenance) || 0 },
  ];

  function chooseTool(tool: ToolId) {
    setSelectedTool(tool);
    setCopyMessage('');
    const next = new URL(window.location.href);
    next.searchParams.set('tool', tool);
    if (window.location.search !== next.search) window.history.pushState({ tool }, '', next.pathname + next.search + next.hash);
    track('compare_tool_open', tool);
    window.requestAnimationFrame(() => document.getElementById('compare-calculator')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function updateMove(key: keyof MoveFields, value: string) {
    trackStart('move');
    setInputs((before) => ({ ...before, move: { ...before.move, [key]: value } }));
  }
  function updateAppliance(key: keyof ApplianceFields, value: string) {
    trackStart('appliance');
    setInputs((before) => ({ ...before, appliance: { ...before.appliance, [key]: value } }));
  }
  function updateCar(key: keyof CarFields, value: string) {
    trackStart('car');
    setInputs((before) => ({ ...before, car: { ...before.car, [key]: value } }));
  }
  function resetInputs() {
    if (!window.confirm(TOOL_LABELS[selectedTool] + 'の入力内容を消去しますか？')) return;
    setInputs((before) => ({ ...before, [selectedTool]: DEFAULT_INPUTS[selectedTool] }));
    setCopyMessage('');
  }

  const hasResult = selectedTool === 'move' ? moveValid : selectedTool === 'appliance' ? applianceValid : carValid;
  useEffect(() => {
    if (hasResult && startedTools.current.has(selectedTool) && !completedTools.current.has(selectedTool)) {
      completedTools.current.add(selectedTool);
      track('comparison_calculation_complete', selectedTool);
    }
  }, [hasResult, selectedTool]);
  const quickChart = selectedTool === 'move'
    ? [12, 24, 36].map((month) => ({ label: month / 12 + '年後', value: monthlyDifference * month - (moveCost || 0) }))
    : selectedTool === 'appliance'
      ? [{ label: '修理', value: repair || 0 }, { label: '新品', value: replacement || 0 }]
      : breakdown.filter((item) => item.amount > 0).map((item) => ({ label: item.label, value: item.amount }));
  const quickMax = Math.max(1, ...quickChart.map((item) => Math.abs(item.value)));
  const hasNegative = quickChart.some((item) => item.value < 0);
  function summary(): string {
    if (selectedTool === 'move' && moveValid) {
      const payback = movePayback === null ? '家賃差だけでは回収できません' : movePayback + 'か月';
      return 'くらし予報｜引っ越しの損得\n今の家賃: ' + yen(moveCurrent!) + '/月\n新しい家賃: ' + yen(moveNew!) + '/月\n実質初期費用: ' + yen(moveCost!) + '\n家賃の月額差: ' + yen(monthlyDifference) + '\n初期費用の回収: ' + payback + '\n※家賃差のみの概算です。';
    }
    if (selectedTool === 'appliance' && applianceValid) {
      return 'くらし予報｜修理・買い替え比較\n修理の見積もり: ' + yen(repair!) + '\n新品の購入・設置・処分費: ' + yen(replacement!) + '\n初期費用の差: ' + yen(replacement! - repair!) + '\n※耐用年数・安全性・電気代もご確認ください。';
    }
    if (selectedTool === 'car' && carValid) {
      return 'くらし予報｜車の維持費\n月額（年換算）: ' + yen(annualRunning / 12) + '\n年間: ' + yen(annualRunning) + '\n5年間: ' + yen(annualRunning * 5) + '\n※入力した項目のみ、保有条件が続く場合の概算です。';
    }
    return '';
  }
  async function copySummary() {
    if (!hasResult) return;
    try {
      await navigator.clipboard.writeText(summary());
      setCopyMessage('計算結果をコピーしました。金額は共有前に確認してください。');
      track('compare_result_copy', selectedTool);
    } catch {
      setCopyMessage('コピーできませんでした。ブラウザーの権限を確認してください。');
    }
  }

  return (
    <div className="compare-page">
      <header className="compare-topbar">
        <a className="compare-brand" href="/" aria-label="くらし予報 トップ">
          <span className="compare-brand-icon"><CloudSun size={23} /></span>
          <span><strong>くらし予報</strong><small>LIFE WEATHER</small></span>
        </a>
        <nav aria-label="メインナビゲーション" className="compare-nav">
          <a href="#tools">計算ツール</a>
          <a href="#guides">お役立ち記事</a>
          <button type="button" onClick={onOpenForecast}>{hasSavedForecast ? '保存済みの出費予報' : '将来の出費予報'}<ChevronRight size={15}/></button>
        </nav>
      </header>

      <main>
        <section className="compare-hero">
          <div className="compare-hero-copy">
            <span className="compare-eyebrow"><Sparkles size={14}/> 暮らしの損得を、数字で見える化</span>
            <h1>その選択、<br/><em>結局いくら</em>お得？</h1>
            <p>引っ越し・家電・車のお金を、すぐに無料比較。<br className="compare-desktop-break"/>必要な金額を入れるだけ。会員登録も不要です。</p>
            <a className="compare-hero-button" href="#tools">気になることを計算する <ArrowRight size={19}/></a>
            <div className="compare-trust"><span><Check size={15}/>完全無料</span><span><Check size={15}/>登録不要</span><span><ShieldCheck size={15}/>入力値は端末内に保存</span></div>
          </div>
          <div className="compare-art" aria-hidden="true">
            <div className="compare-art-circle"></div>
            <div className="compare-art-note compare-art-note-left"><PiggyBank size={18}/> 家計の選択を比較</div>
            <div className="compare-art-card">
              <span className="compare-art-caption">比べてわかる、暮らしの数字</span>
              <span className="compare-art-figure"><Calculator size={30}/> <strong>− ¥ / ＋ ¥</strong></span>
              <span className="compare-art-rule"></span>
              <span className="compare-art-progress"><b></b></span>
              <span className="compare-art-progress small"><b></b></span>
              <span className="compare-art-caption">数値を変えると、答えも変わる。</span>
            </div>
            <div className="compare-art-note compare-art-note-right"><Check size={18}/> 自分の金額で計算</div>
          </div>
        </section>

        <section id="tools" className="compare-tools" aria-labelledby="compare-tools-title">
          <div className="compare-section-kicker">CHOOSE YOUR TOOL</div>
          <h2 id="compare-tools-title">まずは、何を調べたい？</h2>
          <p className="compare-section-lead">知りたい項目を選んで、すぐに計算できます。</p>
          <div className="compare-tool-grid" role="group" aria-label="比較する項目">
            <button type="button" data-testid="compare-select-move" aria-pressed={selectedTool === 'move'} onClick={() => chooseTool('move')} className={'compare-tool-card ' + (selectedTool === 'move' ? 'selected' : '')}>
              <span className="compare-tool-icon peach"><House size={26}/></span><span className="compare-tool-index">01 / 引っ越し</span><strong>引っ越すと得？</strong><small>今の家賃と新しい家賃を比べる</small><span className="compare-tool-arrow"><ArrowRight size={19}/></span>
            </button>
            <button type="button" data-testid="compare-select-appliance" aria-pressed={selectedTool === 'appliance'} onClick={() => chooseTool('appliance')} className={'compare-tool-card ' + (selectedTool === 'appliance' ? 'selected' : '')}>
              <span className="compare-tool-icon mint"><Refrigerator size={26}/></span><span className="compare-tool-index">02 / 家電</span><strong>修理？買い替え？</strong><small>直近の費用と使える年数で比較</small><span className="compare-tool-arrow"><ArrowRight size={19}/></span>
            </button>
            <button type="button" data-testid="compare-select-car" aria-pressed={selectedTool === 'car'} onClick={() => chooseTool('car')} className={'compare-tool-card ' + (selectedTool === 'car' ? 'selected' : '')}>
              <span className="compare-tool-icon sky"><CarFront size={26}/></span><span className="compare-tool-index">03 / 車</span><strong>維持費はいくら？</strong><small>月額・年間・5年間を計算する</small><span className="compare-tool-arrow"><ArrowRight size={19}/></span>
            </button>
          </div>
          <div className="compare-detailed-link">
            <span>もっと詳しく知りたい人はこちら</span>
            <a href={DETAILED_PATHS[selectedTool]} data-home-tool onClick={() => track('comparison_deep_link_click', selectedTool)}>費用の内訳まで詳しく比較する <ArrowRight size={16}/></a>
          </div>
        </section>

        <section id="compare-calculator" className="compare-workbench" aria-label={TOOL_LABELS[selectedTool] + 'を計算'}>
          <div className="compare-workbench-heading">
            <div><div className="compare-section-kicker">FREE SIMULATOR</div><h2>{TOOL_LABELS[selectedTool]}</h2><p>入力すると、計算結果がその場で更新されます。</p><a className="compare-deep-link" data-home-tool href={DETAILED_PATHS[selectedTool]} onClick={() => track('comparison_deep_link_click', selectedTool)}>さらに詳しい比較・グラフ・画像共有 <ArrowRight size={15}/></a></div>
            <button className="compare-reset" type="button" onClick={resetInputs}><RotateCcw size={14}/> 入力をリセット</button>
          </div>
          <div className="compare-workbench-grid">
            <div className="compare-form">
              {selectedTool === 'move' && <>
                <h3><House size={18}/> 家賃と初期費用を入力</h3>
                <MoneyField id="compare-old-rent" label="今の家賃（月額）" value={move.currentRent} onChange={(v) => updateMove('currentRent', v)} />
                <MoneyField id="compare-new-rent" label="引っ越し先の家賃（月額）" value={move.newRent} onChange={(v) => updateMove('newRent', v)} />
                <MoneyField id="compare-moving-cost" label="引っ越しの実質初期費用" value={move.movingCost} onChange={(v) => updateMove('movingCost', v)} hint="引っ越し会社代・仲介手数料など。返ってくる敷金等は差し引いた実質負担額を入力。" />
                <p className="compare-mini-note">家賃差と実質初期費用のみの比較です。通勤費、更新料、光熱費、退去費などの変化は含みません。</p>
              </>}
              {selectedTool === 'appliance' && <>
                <h3><Wrench size={18}/> 見積もりを入力</h3>
                <MoneyField id="compare-repair" label="修理の見積もり総額" value={appliance.repairCost} onChange={(v) => updateAppliance('repairCost', v)} />
                <MoneyField id="compare-replacement" label="新品の購入・設置・処分費の総額" value={appliance.replacementCost} onChange={(v) => updateAppliance('replacementCost', v)} />
                <details className="compare-optional">
                  <summary>使える年数も比べる（任意）<ChevronRight size={17}/></summary>
                  <div className="compare-optional-fields">
                    <MoneyField id="compare-repair-years" label="修理後に使えると見込む年数" value={appliance.repairYears} suffix="年" onChange={(v) => updateAppliance('repairYears', v)} hint="1〜30年。修理による延命を保証する数字ではありません。" />
                    <MoneyField id="compare-new-years" label="新品を使うと見込む年数" value={appliance.replacementYears} suffix="年" onChange={(v) => updateAppliance('replacementYears', v)} hint="1〜30年。製品や使い方で変動します。" />
                  </div>
                </details>
                <p className="compare-mini-note">異音・発煙・水漏れ等の安全に関わる異常がある場合は使用を中止し、メーカーなどに相談してください。費用だけで修理の可否を判断しません。</p>
              </>}
              {selectedTool === 'car' && <>
                <h3><CarFront size={18}/> ご自身の維持費を入力</h3>
                <div className="compare-field-pair">
                  <MoneyField id="compare-car-fuel" label="燃料・充電（月額）" value={car.fuel} onChange={(v) => updateCar('fuel', v)} />
                  <MoneyField id="compare-car-parking" label="駐車場（月額）" value={car.parking} onChange={(v) => updateCar('parking', v)} />
                  <MoneyField id="compare-car-insurance" label="任意保険（年額）" value={car.insurance} onChange={(v) => updateCar('insurance', v)} />
                  <MoneyField id="compare-car-tax" label="自動車税など（年額）" value={car.tax} onChange={(v) => updateCar('tax', v)} />
                  <MoneyField id="compare-car-inspection" label="車検1回あたり" value={car.inspection} onChange={(v) => updateCar('inspection', v)} />
                  <div className="compare-field"><label htmlFor="compare-car-cycle">車検の間隔</label><select id="compare-car-cycle" value={car.inspectionYears} onChange={(e) => updateCar('inspectionYears', e.target.value)}><option value="1">1年ごと</option><option value="2">2年ごと</option><option value="3">3年ごと</option></select><p className="compare-field-hint">実際の車両・次回車検に合わせて選択。</p></div>
                  <MoneyField id="compare-car-maintenance" label="整備・消耗品（年額）" value={car.maintenance} onChange={(v) => updateCar('maintenance', v)} />
                  <MoneyField id="compare-car-other" label="その他の費用（月額）" value={car.monthlyOther} onChange={(v) => updateCar('monthlyOther', v)} />
                </div>
                <p className="compare-mini-note">未入力の項目は0円で計算します。車両購入費・ローン・減価償却・高速料金などは入力項目に含まれていません。実見積もりや通知書の金額を使ってください。</p>
              </>}
            </div>

            <aside className="compare-result" aria-live="polite" aria-atomic="true">
              <div className="compare-result-top"><span><Calculator size={18}/> 計算結果</span><small>{TOOL_LABELS[selectedTool]}</small></div>
              {!hasResult && <div className="compare-result-empty"><span><Calculator size={38}/></span><strong>数字を入れると、ここに結果が表示されます</strong><p>{selectedTool === 'car' ? '分かる項目から入力してください。' : 'まずは上の必要な金額を入力してください。'}</p></div>}
              {selectedTool === 'move' && moveValid && <>
                <ResultMetric primary label="毎月の家賃差" amount={monthlyDifference > 0 ? yen(monthlyDifference) + ' 安い' : monthlyDifference < 0 ? yen(-monthlyDifference) + ' 高い' : '差額なし'} note="新しい家賃が安い場合はプラスの効果" />
                <div className="compare-result-metrics">
                  <ResultMetric label="1年後の差し引き" amount={yen(annualDifference - moveCost!)} note="家賃差12か月分 − 実質初期費用" />
                  <ResultMetric label="3年後の差し引き" amount={yen(annualDifference * 3 - moveCost!)} note="家賃差36か月分 − 実質初期費用" />
                </div>
                <div className="compare-payback"><span>初期費用を家賃差で回収するまで</span><strong>{movePayback === null ? '家賃差だけでは回収できません' : movePayback === 0 ? '初期費用なし' : '約' + movePayback + 'か月'}</strong></div>
                <p className="compare-result-note">差し引きのプラスは家賃差による節約効果、マイナスは初期費用を含む負担増を意味します。</p>
              </>}
              {selectedTool === 'appliance' && applianceValid && <>
                <ResultMetric primary label="新品と修理の初期費用の差" amount={yen(Math.abs(replacement! - repair!))} note={repair! < replacement! ? '修理の方が初期費用は少なくなります' : repair! > replacement! ? '新品の方が初期費用は少なくなります' : '初期費用は同じです'} />
                <div className="compare-result-metrics">
                  <ResultMetric label="修理の見積もり" amount={yen(repair!)} />
                  <ResultMetric label="新品の総額" amount={yen(replacement!)} />
                </div>
                {compareYearly && <div className="compare-yearly"><strong>1年あたりの単純換算</strong><div><span>修理後</span><b>{yen(repair! / repairYears!)}/年</b></div><div><span>新品</span><b>{yen(replacement! / replacementYears!)}/年</b></div><small>見込み年数が異なるため、耐久性・保証・電気代を含めた厳密な比較ではありません。</small></div>}
                {(appliance.repairYears || appliance.replacementYears) && !compareYearly && <p className="compare-result-note">年数比較をする場合、両方に1〜30年を入力してください。</p>}
                <p className="compare-result-note">金額だけで修理・買い替えを断定しません。メーカーの修理可否、保証、安全性も確認してください。</p>
              </>}
              {selectedTool === 'car' && carValid && <>
                <ResultMetric primary label="車の維持費（年間）" amount={yen(annualRunning)} note="入力した項目の合計・年換算" />
                <div className="compare-result-metrics">
                  <ResultMetric label="1か月あたり" amount={yen(annualRunning / 12)} />
                  <ResultMetric label="5年間" amount={yen(annualRunning * 5)} note="同じ条件が続く場合" />
                </div>
                <div className="compare-breakdown"><strong>年間の内訳</strong>{breakdown.filter((item) => item.amount > 0).map((item) => <div key={item.label}><span>{item.label}</span><b>{yen(item.amount)}</b></div>)}</div>
                <p className="compare-result-note">未入力項目は0円として計算しています。実際の費用は走行距離・契約・整備内容などで変わります。</p>
              </>}
              {hasResult && <div className="compare-quick-chart" role="img" aria-label={TOOL_LABELS[selectedTool] + 'の費用比較グラフ'}>
                <strong>費用をグラフで比較</strong>
                {quickChart.map((item) => <div className="compare-quick-row" key={item.label}>
                  <span>{item.label}</span>
                  <div className={'compare-quick-track ' + (hasNegative ? 'signed' : '')}>
                    <div className={item.value < 0 ? 'compare-quick-bar negative' : 'compare-quick-bar'} style={{
                      width: hasNegative ? Math.abs(item.value) / quickMax * 47 + '%' : Math.abs(item.value) / quickMax * 100 + '%',
                      left: hasNegative ? (item.value < 0 ? 50 - Math.abs(item.value) / quickMax * 47 : 50) + '%' : '0%'
                    }} />
                  </div>
                  <b>{yen(item.value)}</b>
                </div>)}
                <p>{selectedTool === 'move' ? '家賃差から初期費用を差し引いた累積額です。' : selectedTool === 'appliance' ? '修理と新品の初期費用の比較です。' : 'ご入力済みの年間費用の内訳です。'}</p>
              </div>}
              {hasResult && <><button type="button" className="compare-copy-button" onClick={copySummary}><Copy size={16}/> 計算結果をコピー</button>{copyMessage && <p className="compare-copy-status" role="status">{copyMessage}</p>}</>}
            </aside>
          </div>
        </section>

        <section id="guides" className="compare-related">
          <div className="compare-section-kicker">LEARN MORE</div><h2>もう少し詳しく知りたい方へ</h2>
          <div className="compare-related-grid">
            <a href="/moving-expenses-guide/"><House size={19}/><span><strong>引っ越し費用の内訳</strong><small>見積もり・契約のチェックポイント</small></span><ArrowRight size={17}/></a>
            <a href="/appliance-replacement-guide/"><Refrigerator size={19}/><span><strong>家電の買い替え時期</strong><small>洗濯機・冷蔵庫・エアコンの目安</small></span><ArrowRight size={17}/></a>
            <a href="/car-annual-cost/"><CarFront size={19}/><span><strong>車の維持費を詳しく</strong><small>税金・保険・車検を整理</small></span><ArrowRight size={17}/></a>
          </div>
        </section>

        <section className="compare-forecast-bridge">
          <span className="compare-bridge-icon"><Wallet size={27}/></span>
          <div><span className="compare-section-kicker">FOR YOUR FUTURE</span><h2>将来の出費も、まとめて見通す</h2><p>家電・車検・毎月の支出を登録して、1年・3年・5年の予定や積立額を確認。これまでの「出費予報」機能も引き続き使えます。</p></div>
          <button type="button" onClick={() => { track('compare_forecast_open', selectedTool); onOpenForecast(); }}>{hasSavedForecast ? '保存した予報を開く' : '出費予報を作成する'} <ArrowRight size={17}/></button>
        </section>
      </main>

      <footer className="compare-footer"><div><span><CloudSun size={16}/> くらし予報 / LIFE WEATHER</span><p>比べて、納得して、暮らしを選ぶ。</p></div><nav aria-label="フッターナビゲーション"><a href="/life-cost-tools/">無料ツール一覧</a><a href="/about/">このサイトについて</a><a href="/privacy-policy/">プライバシーポリシー</a><a href="/site-map/">サイトマップ</a></nav></footer>
    </div>
  );
}
