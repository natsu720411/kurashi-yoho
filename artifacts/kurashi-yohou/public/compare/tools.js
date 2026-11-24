(() => {
  'use strict';
  const root = document.querySelector('[data-compare-tool]');
  if (!root) return;
  const tool = root.getAttribute('data-compare-tool');
  const math = window.KurashiCompareMath;
  if (!math) { console.error('Comparison calculator unavailable'); return; }
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
  const warning = root.querySelector('#input-warning');
  const saveHistoryButton = root.querySelector('#save-history');
  const historyList = root.querySelector('#history-list');
  const historyKey = 'kurashi-yoho-history-v1-' + tool;
  let history = [];
  const required = tool==='move' ? ['oldRent','newRent'] : tool==='appliance' ? ['repair','replacement'] : [];
  const moneyFields = inputs.filter((input)=>!['cycle','holdingYears','repairYears','replacementYears'].includes(input.dataset.input));
  function labelFor(key) {
    return inputs.find((input)=>input.dataset.input===key)?.closest('.field')?.querySelector('label')?.textContent || key;
  }
  function setWarning(){
    const absent = required.filter((key)=>val(key)==='');
    const invalid = inputs.filter((input)=>input.value!=='' && (['cycle','holdingYears','repairYears','replacementYears'].includes(input.dataset.input)
      ? years(input.dataset.input)===null : number(input.dataset.input)===null));
    inputs.forEach((input)=>input.setAttribute('aria-invalid',invalid.includes(input)?'true':'false'));
    if (absent.length) warning.textContent='必須項目を入力してください：'+absent.map(labelFor).join('、');
    else if (invalid.length) warning.textContent='入力値を確認してください：'+invalid.map((input)=>labelFor(input.dataset.input)).join('、');
    else if (tool==='car') {
      const optional = moneyFields.filter((input)=>input.value==='');
      warning.textContent = optional.length ? '未入力の費用が'+optional.length+'項目あります。未入力は0円で計算するため、実際の負担より低く表示されることがあります。' : 'すべての費用項目を入力しました。';
    } else {
      const optional=moneyFields.filter((input)=>!required.includes(input.dataset.input)&&input.value==='');
      warning.textContent=optional.length?'未入力の費用が'+optional.length+'項目あります。未入力は0円として計算しています。':'入力内容に基づいて計算しています。';
    }
  }
  function safeHistory(){
    try {const arr=JSON.parse(localStorage.getItem(historyKey)||'[]');return Array.isArray(arr)?arr.filter((record)=>record&&typeof record==='object'&&record.fields&&typeof record.fields==='object').slice(0,8):[];}
    catch{return [];}
  }
  function persistHistory(){
    try {localStorage.setItem(historyKey,JSON.stringify(history));return true;} catch {status.textContent='このブラウザーでは履歴を保存できません。';return false;}
  }
  function renderHistory(){
    historyList.replaceChildren();
    if(!history.length){const li=document.createElement('li');li.textContent='保存された結果はありません。';historyList.appendChild(li);return;}
    for(const item of history){
      const li=document.createElement('li'),name=document.createElement('span'),load=document.createElement('button'),del=document.createElement('button');
      name.textContent=String(item.date||'')+'　'+String(item.title||'').slice(0,80);
      load.textContent='復元';load.type='button';load.addEventListener('click',()=>{
        for(const input of inputs){const v=item.fields[input.dataset.input];if(typeof v==='string'&&/^\d{0,10}$/.test(v))input.value=v;}
        setWarning();render();send('comparison_history_loaded');status.textContent='保存した入力内容を復元しました。';
      });
      del.textContent='削除';del.type='button';del.addEventListener('click',()=>{history=history.filter((record)=>record.id!==item.id);persistHistory();renderHistory();send('comparison_history_deleted');});
      li.append(name,load,del);historyList.appendChild(li);
    }
  }
  history=safeHistory();
  renderHistory();

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
    const result = math.move(f);
    const netCash = result.netInitial, diff = result.difference, payback = result.payback;
    const summary = diff > 0 ? yen(diff) + '/月 安くなる' : diff < 0 ? yen(-diff) + '/月 高くなる' : '家賃差なし';
    const months = [0,6,12,18,24,36];
    return {
      label: '毎月の家賃の差', main: summary,
      metrics: [
        { label: '実質初期現金負担', value: yen(netCash) },
        { label: '初期費用の回収', value: payback === null ? '家賃差だけでは回収不可' : payback + 'か月' },
        { label: '1年後の差し引き', value: yen(result.afterMonths(12)) },
        { label: '3年後の差し引き', value: yen(result.afterMonths(36)) }
      ],
      chart: { type: 'signed', title: '引っ越し後の経過月数と累積差額', items: months.map((month) => ({label:month+'か月',value:result.afterMonths(month)})) },
      note: '初期費用に新居の敷金を含め、旧居からの返還金を差し引いています。敷金返還のタイミングや返還額、通勤費・光熱費・更新料等は反映していません。',
      disclaimer: '家賃差・入力した初期費用だけによる概算。実際の契約条件をご確認ください。'
    };
  }
  function calculateAppliance() {
    const f = n(['repair','replacement','oldPower','newPower'],['repair','replacement']);
    if (!f) return null;
    const powerComplete = val('oldPower') !== '' && val('newPower') !== '';
    const result = math.appliance(f);
    const powerDiff = result.annualElectricityDifference;
    const difference = result.initialDifference;
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
      metrics.push({label:'5年の単純合計（修理）', value:yen(result.totalRepair(5))});
      metrics.push({label:'5年の単純合計（新品）', value:yen(result.totalNew(5))});
      chartItems[0].value=result.totalRepair(5); chartItems[1].value=result.totalNew(5);
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
    const result = math.car({...f,cycle,holdingYears});
    const recurring = result.annualRunning, annualCar = result.annualCar, annualNoCar = result.annualNoCar;
    const noCarEntered=['transit','taxi','carshare'].some((key)=>val(key)!=='');
    const metrics=[
      {label:'車の年間維持費（購入費除く）',value:yen(recurring)},
      {label:'車の月額換算（購入費含む）',value:yen(annualCar/12)},
      {label:'車の年間換算（購入費含む）',value:yen(annualCar)},
      {label:'車の5年間の支出（購入費含む）',value:yen(recurring*5+f.purchase)}
    ];
    const chartItems=[{label:'車を所有',value:annualCar}];
    if(noCarEntered) {
      const diff=result.difference;
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
    setWarning();
    placeholder.hidden=valid;
    resultContent.hidden=!valid;
    copyButton.disabled=!valid;imageButton.disabled=!valid;saveHistoryButton.disabled=!valid;
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
  saveHistoryButton.addEventListener('click',()=>{
    if(!current)return;
    const fields=Object.fromEntries(inputs.map((input)=>[input.dataset.input,input.value]));
    history.unshift({id:Date.now()+'-'+Math.random().toString(36).slice(2),date:new Date().toLocaleDateString('ja-JP'),title:current.main,fields});
    history=history.slice(0,8);
    if(persistHistory()){renderHistory();status.textContent='現在の計算条件を保存しました。';send('comparison_history_saved');}
  });
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
  if(tool==='move'){
    const scenarioFields=[...root.querySelectorAll('[data-scenario]')];
    const scenarioOutput=root.querySelector('#scenario-result');
    const scenarioKey='kurashi-yoho-scenario-v1';
    const scenarioTerm=root.querySelector('#scenario-term');
    try{
      const saved=JSON.parse(localStorage.getItem(scenarioKey)||'{}');
      for(const field of scenarioFields){const raw=saved[field.dataset.scenario];if(typeof raw==='string'&&/^\d{0,10}$/.test(raw))field.value=raw;}
      if(['12','36','60'].includes(saved.months))scenarioTerm.value=saved.months;
    }catch{}
    let scenarioTracked=false;
    function compare(){
      const obj=Object.fromEntries(scenarioFields.map((field)=>[field.dataset.scenario,field.value]));
      const months=Number(scenarioTerm.value);
      const isValid=Object.values(obj).every((s)=>/^\d{1,10}$/.test(s)&&Number(s)<=1e9);
      if(!isValid){scenarioOutput.textContent='物件A・Bそれぞれの家賃と初期費用を入力すると比較できます。';return;}
      const r=math.places(Object.fromEntries(Object.entries(obj).map(([key,value])=>[key,Number(value)]))).afterMonths(months);
      scenarioOutput.textContent=months+'か月間：物件A '+yen(r.a)+' / 物件B '+yen(r.b)+'。'+(r.cheaper==='same'?'総負担は同じです。':(r.cheaper==='a'?'物件A':'物件B')+'のほうが'+yen(r.difference)+'低い計算です。');
      if(!scenarioTracked){send('comparison_scenario_complete');scenarioTracked=true;}
    }
    function scenarioInput(){
      try{localStorage.setItem(scenarioKey,JSON.stringify({...Object.fromEntries(scenarioFields.map((field)=>[field.dataset.scenario,field.value])),months:scenarioTerm.value}));}catch{}
      compare();
    }
    scenarioFields.forEach((field)=>field.addEventListener('input',scenarioInput));
    scenarioTerm.addEventListener('change',scenarioInput);
    compare();
  }
  root.querySelector('#show-results-mobile')?.addEventListener('click',()=>{send('comparison_result_jump');});
  send('comparison_tool_view');
  render();
})();
