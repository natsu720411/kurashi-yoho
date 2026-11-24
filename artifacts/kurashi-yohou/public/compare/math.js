(function (global) {
'use strict';
const num=(o,k)=>{const v=o[k];if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>1e9)throw Error('Invalid amount: '+k);return v};
function move(f){let initial=['moveFee','keyMoney','agencyFee','newDeposit','departure','furniture','other'].reduce((s,k)=>s+num(f,k),0)-num(f,'oldDepositReturn');let diff=num(f,'oldRent')-num(f,'newRent');return {netInitial:initial,difference:diff,payback:diff>0?Math.max(0,Math.ceil(initial/diff)):null,afterMonths:(m)=>diff*m-initial};}
function places(f){let a=num(f,'aRent'),b=num(f,'bRent'),ca=num(f,'aCost'),cb=num(f,'bCost');return {afterMonths:(months)=>{let totalA=ca+a*months,totalB=cb+b*months;return {a:totalA,b:totalB,difference:Math.abs(totalA-totalB),cheaper:totalA===totalB?'same':totalA<totalB?'a':'b'}}};}
function appliance(f){let r=num(f,'repair'),n=num(f,'replacement'),old=num(f,'oldPower'),fresh=num(f,'newPower');return {initialDifference:n-r,annualElectricityDifference:old-fresh,totalRepair:(years)=>r+old*years,totalNew:(years)=>n+fresh*years};}
function car(f){const cycle=num(f,'cycle'),holding=num(f,'holdingYears');if(cycle<1||cycle>3||holding<1||holding>30)throw Error('Invalid year count');
const annualRunning=12*(num(f,'fuel')+num(f,'parking')+num(f,'monthlyOther'))+num(f,'insurance')+num(f,'tax')+num(f,'inspection')/cycle+num(f,'maintenance');
const annualCar=annualRunning+num(f,'purchase')/holding,annualNoCar=num(f,'transit')+num(f,'taxi')+num(f,'carshare');return {annualRunning,annualCar,annualNoCar,difference:annualCar-annualNoCar};}
global.KurashiCompareMath=Object.freeze({move,places,appliance,car});
})(typeof window !== 'undefined'?window:globalThis);
