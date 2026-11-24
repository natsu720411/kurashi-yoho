(() => {
  'use strict';
  const root = document.querySelector('[data-compare-tool]');
  if (!root) return;
  const tool = root.getAttribute('data-compare-tool');
  const inputs = [...root.querySelectorAll('[data-input]')];
  const storageKey = 'kurashi-yoho-detail-v1-' + tool;
  const result = root.querySelector('#result-area');
  const placeholder = root.querySelector('#result-empty');
  const resultContent = root.querySelector('#result-content');
  const status = root.querySelector('#action-status');
  const mainLabel = root.querySelector('#result-label');
  const mainValue = root.querySelector('#result-value');
  const metrics = root.querySelector('#result-metrics');
  const chart = root.querySelector('#result-graph');
  const chartTitle = root.querySelector('#graph-title');
  const description = root.querySelector('#result-description');
  const copyButton = root.querySelector('#copy-result');
  const imageButton = root.querySelector('#image-result');
  let started = false;
  let completed = false;
  let current = null;

  function send(name) {
    if (typeof window.gtag === 'function') window.gtag('event', name, { comparison_tool: tool, page_path: location.pathname });
  }
  const val = (key) => (inputs.find((input) => input.dataset.input === key)?.value || '').trim();
  function number(key, mandatory = false) {
    const value = val(key);
    if (!value) return mandatory ? null : 0;
    if (!/^\d{1,10}$/.test(value)) return null;
    const num = Number(value);
    return Number.isSafeInteger(num) && num >= 0 && num <= 1000000000 ? num : null;
  }
  function years(key) {
    const value = val(key);
    const num = Number(value);
    return /^\d{1,2}$/.test(value) && num >= 1 && num <= 30 ? num : null;
  }
  function sum(values) { return values.reduce((acc, x) => acc + x, 0); }
  function yen(value) { return (value < -0.001 ? '−' : '') + Math.round(Math.abs(value)).toLocaleString('ja-JP') + '円'; }
  function descriptionFor(data) { return data.label + ': ' + data.main + '\n' + data.metrics.map((x) => x.label + ': ' + x.value).join('\n') + '\n※' + data.disclaimer; }
  function n(keys, required = []) {
    const result = {};
    for (const key of keys) {
      const num = number(key, required.includes(key));
      if (num === null) return null;
      result[key] = num;
    }
    return result;
  }

  function calculateMove() {
    const f = n(['oldRent','newRent','moveFee','keyMoney','agencyFee','newDeposit','oldDepositReturn','departure','furniture','other'], ['oldRent','newRent']);
    if (!f) return null;
    const outgoing = sum([f.moveFee,f.keyMoney,f.agencyFee,f.newDeposit,f.departure,f.furniture,f.other]);
    const netCash = outgoing - f.oldDepositReturn;
    const diff = f.oldRent - f.newRent;
    const payback = diff > 0 ? Math.max(0, Math.ceil(netCash / diff)) : null;
    const summary = diff > 0 ? yen(diff) + '/月 安くなる' : diff < 0 ? yen(-diff) + '/月 高くなる' : '家賃差なし';
    const months = [0,6,12,18,24,36];
    return {
      label: '毎月の家賃の差', main: summary,
      metrics: [
        { label: '実質初期現金負担', value: yen(netCash) },
        { label: '初期費用の回収', value: payback === null ? '家賃差だけでは回収不可' : payback + 'か月' },
        { label: '1年後の差し引き', value: yen(diff * 12 - netCash) },
        { label: '3年後の差し引き', value: yen(diff * 36 - netCash) }
      ],
      chart: { type: 'signed', title: '引っ越し後の経過月数と累積差額', items: months.map((month) => ({label:month+'か月',value:diff*month-netCash})) },
      note: '初期費用に新居の敷金を含め、旧居からの返還金を差し引いています。敷金返還のタイミングや返還額、通勤費・光熱費・更新料等は反映していません。',
      disclaimer: '家賃差・入力した初期費用だけによる概算。実際の契約条件をご確認ください。'
    };
  }
  function calculateAppliance() {
    const f = n(['repair','replacement','oldPower','newPower'],['repair','replacement']);
    if (!f) return null;
    const powerComplete = val('oldPower') !== '' && val('newPower') !== '';
    const powerDiff = f.oldPower - f.newPower;
    const difference = f.replacement - f.repair;
    const metrics = [
      { label:'修理見積もり', value: yen(f.repair) }, { label:'新品の総額', value: yen(f.replacement) },
      { label:'初期費用の差', value: yen(Math.abs(difference)) },
      { label:'初期費用が少ない選択', value:difference > 0 ? '修理' : difference < 0 ? '新品' : '同額' }
    ];
    const chartItems = [
      { label:'修理', value:f.repair }, { label:'新品', value:f.replacement }
    ];
    if(powerComplete){
      metrics.push({label:'年間の電気代差',value:powerDiff>0?yen(powerDiff)+' 新品が安い':powerDiff<0?yen(-powerDiff)+' 修理後が安い':'同額'});
      metrics.push({label:'5年の単純合計（修理）', value:yen(f.repair+f.oldPower*5)});
      metrics.push({label:'5年の単純合計（新品）', value:yen(f.replacement+f.newPower*5)});
      chartItems[0].value=f.repair+f.oldPower*5; chartItems[1].value=f.replacement+f.newPower*5;
    }
    const yr1=years('repairYears'),yr2=years('replacementYears');
    if(yr1!==null && yr2!==null) {
      metrics.push({label:'修理の初期費用/年',value:yen(f.repair/yr1)});
      metrics.push({label:'新品の初期費用/年',value:yen(f.replacement/yr2)});
    }
    return {
      label:'初期費用の差',main:yen(Math.abs(difference)),
      metrics, chart:{type:'positive',title:powerComplete?'5年間の費用比較（5年間使えた場合）':'初期費用の比較',items:chartItems},
      note:powerComplete?'5年分の電気代を加えた単純試算です。5年間の使用を保証しません。':'年間電気代を両方入力すると、5年間の電気代込み費用を比較できます。',
      disclaimer:'修理の可否・保証・安全性・実際の使用年数と電気代は見積もりと製品表示でご確認ください。'
    };
  }
  function calculateCar() {
    const keys=['fuel','parking','monthlyOther','insurance','tax','inspection','maintenance','purchase','transit','taxi','carshare'];
    const hasCarInput=keys.slice(0,8).some((key)=>val(key)!=='');
    const f=n(keys);
    if(!f || !hasCarInput) return null;
    const cycle=years('cycle') || 2;
    const holdingYears=years('holdingYears') || 5;
    const yearlyFuel=f.fuel*12, yearlyParking=f.parking*12;
    const recurring=sum([yearlyFuel,yearlyParking,f.monthlyOther*12,f.insurance,f.tax,f.inspection/cycle,f.maintenance]);
    const annualCar=recurring+f.purchase/holdingYears;
    const annualNoCar=f.transit+f.taxi+f.carshare;
    const noCarEntered=['transit','taxi','carshare'].some((key)=>val(key)!=='');
    const metrics=[
      {label:'車の年間維持費（購入費除く）',value:yen(recurring)},
      {label:'車の月額換算（購入費含む）',value:yen(annualCar/12)},
      {label:'車の年間換算（購入費含む）',value:yen(annualCar)},
      {label:'車の5年間の支出（購入費含む）',value:yen(recurring*5+f.purchase)}
    ];
    const chartItems=[{label:'車を所有',value:annualCar}];
    if(noCarEntered) {
      const diff=annualCar-annualNoCar;
      metrics.push({label:'車なしの移動費（年額）',value:yen(annualNoCar)});
      metrics.push({label:'年間差額',value:diff>0?'車なしが'+yen(diff)+'低い':diff<0?'車ありが'+yen(-diff)+'低い':'同額'});
      chartItems.push({label:'車なし',value:annualNoCar});
    }
    return {
      label:noCarEntered?'所有する場合の年間負担':'車の維持費・購入費の年換算',main:yen(annualCar),
      metrics, chart:{type:'positive',title:noCarEntered?'車あり/なしの年間費用':'車の年間維持費と購入費の年換算',items:chartItems},
      note:'購入費は'+holdingYears+'年間の均等割りで年換算。未入力費用は0円として計算しています。'+(noCarEntered?'車を持たない場合の交通費は入力済み項目のみです。':'車なしの公共交通・タクシー・カーシェア費用を入力すると比較できます。'),
      disclaimer:'ローン金利、車両売却額、走行距離変化、事故等は未考慮。税金・保険・車検は実額で入力してください。'
    };
  }
  const calculator=tool==='move'?calculateMove:tool==='appliance'?calculateAppliance:calculateCar;
  function drawChart(graph){
    chart.replaceChildren();
    chartTitle.textContent=graph.title;
    const max=Math.max(1,...graph.items.map((item)=>Math.abs(item.value)));
    for(const item of graph.items){
      const row=document.createElement('div');
      row.className='graph-row'+(item.value<0?' negative':'');
      const title=document.createElement('span');title.textContent=item.label;
      const track=document.createElement('div');track.className=graph.type==='signed'?'graph-signed':'graph-track';
      const bar=document.createElement('div');bar.className='graph-fill';
      if(graph.type==='signed'){
        const width=Math.min(48,Math.abs(item.value)/max*47);
        bar.style.left=(item.value<0?50-width:50)+'%';
        bar.style.width=width+'%';
      }else{bar.style.width=Math.max(0,Math.min(100,item.value/max*100))+'%';}
      track.appendChild(bar);
      const value=document.createElement('span');value.className='graph-value';value.textContent=yen(item.value);
      row.append(title,track,value);chart.appendChild(row);
    }
  }
  function render(){
    const calc=calculator();
    current=calc;
    const valid=Boolean(calc);
    placeholder.hidden=valid;
    resultContent.hidden=!valid;
    copyButton.disabled=!valid;imageButton.disabled=!valid;
    if(!valid){completed=false;return;}
    if(!completed && started){send('comparison_calculation_complete');completed=true;}
    mainLabel.textContent=calc.label;
    mainValue.textContent=calc.main;
    metrics.replaceChildren();
    for(const item of calc.metrics){
      const card=document.createElement('div');card.className='metric';
      const label=document.createElement('span');label.textContent=item.label;
      const value=document.createElement('strong');value.textContent=item.value;
      card.append(label,value);metrics.appendChild(card);
    }
    description.textContent=calc.note;
    drawChart(calc.chart);
  }
  try{
    const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');
    if(saved&&typeof saved==='object'&&!Array.isArray(saved)){
      for(const input of inputs){
        const value=saved[input.dataset.input];
        if(typeof value==='string'&&/^\d{0,10}$/.test(value))input.value=value;
      }
    }
  }catch{ /* Input is optional and stored locally. */ }
  function onInput(){
    if(!started){started=true;send('comparison_input_start');}
    try{localStorage.setItem(storageKey,JSON.stringify(Object.fromEntries(inputs.map((el)=>[el.dataset.input,el.value]))));}catch{}
    render();
  }
  for(const input of inputs){input.addEventListener('input',onInput);input.addEventListener('change',onInput);}
  function createImage(){
    const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=760;
    const context=canvas.getContext('2d');if(!context)throw Error('画像を生成できませんでした。');
    context.fillStyle='#eef8f5';context.fillRect(0,0,1200,760);
    context.fillStyle='#145f69';context.fillRect(0,0,1200,165);
    context.font='bold 33px sans-serif';context.fillStyle='#fff';context.fillText('くらし予報 / LIFE WEATHER',68,72);
    context.font='bold 42px sans-serif';context.fillText(document.querySelector('h1')?.textContent?.slice(0,25)||'暮らしの損得比較',68,135);
    context.fillStyle='#1d5962';context.font='bold 28px sans-serif';context.fillText(current.label,72,250);
    context.font='bold 56px sans-serif';context.fillText(current.main,72,340);
    context.fillStyle='#d0e2df';context.fillRect(68,374,1060,2);
    let y=442;
    for(const item of current.metrics.slice(0,4)){
      context.fillStyle='#597f84';context.font='24px sans-serif';context.fillText(item.label,72,y);
      context.fillStyle='#1e6268';context.font='bold 29px sans-serif';context.fillText(item.value.slice(0,28),630,y);
      y+=67;
    }
    context.fillStyle='#687e82';context.font='19px sans-serif';
    context.fillText('入力値による概算です。実際の見積もりや契約内容をご確認ください。',72,724);
    return canvas;
  }
  copyButton.addEventListener('click',async()=>{
    if(!current)return;
    const text='くらし予報｜'+(document.querySelector('h1')?.textContent||tool)+'\n'+descriptionFor(current)+'\n'+location.href;
    try{await navigator.clipboard.writeText(text);status.textContent='結果をコピーしました。';send('comparison_result_copy');}
    catch{status.textContent='コピーできませんでした。ブラウザーの設定をご確認ください。';}
  });
  imageButton.addEventListener('click',async()=>{
    if(!current)return;
    try{
      const canvas=createImage();
      const blob=await new Promise((resolve,reject)=>canvas.toBlob((b)=>b?resolve(b):reject(Error('画像を生成できませんでした。')),'image/png'));
      const file=new File([blob],'kurashi-yoho-result.png',{type:'image/png'});
      if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
        try{await navigator.share({files:[file],title:'くらし予報の計算結果'});status.textContent='共有メニューを開きました。';send('comparison_result_image_share');return;}
        catch(error){if(error?.name==='AbortError'){status.textContent='共有をキャンセルしました。';return;}}
      }
      const url=URL.createObjectURL(blob);
      const link=document.createElement('a');link.href=url;link.download=file.name;document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
      status.textContent='計算結果のPNG画像を保存しました。';send('comparison_result_image_download');
    }catch{status.textContent='画像を生成できませんでした。別のブラウザーでお試しください。';}
  });
  document.querySelectorAll('[data-related]').forEach((anchor)=>anchor.addEventListener('click',()=>send('comparison_related_click')));
  document.querySelector('#show-results-mobile')?.addEventListener('click',()=>result.scrollIntoView({behavior:'smooth',block:'start'}));
  send('comparison_tool_view');
  render();
})();
