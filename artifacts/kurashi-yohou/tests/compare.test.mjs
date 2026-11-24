import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const root = new URL('../',import.meta.url);
const read = (path)=>readFileSync(new URL(path,root),'utf8');
const context={};vm.runInNewContext(read('public/compare/math.js'),context);const calc=context.KurashiCompareMath;
test('moving costs and deadlines',()=>{
 const f={oldRent:80000,newRent:65000,moveFee:300000,keyMoney:0,agencyFee:0,newDeposit:0,departure:0,furniture:0,other:0,oldDepositReturn:0};
 const r=calc.move(f);assert.equal(r.difference,15000);assert.equal(r.netInitial,300000);assert.equal(r.payback,20);assert.equal(r.afterMonths(12),-120000);assert.equal(r.afterMonths(36),240000);
 assert.equal(calc.move({...f,newRent:90000}).payback,null);
});
test('two apartment comparison',()=>{
 const r=calc.places({aRent:70000,bRent:60000,aCost:200000,bCost:350000}).afterMonths(36);
 assert.equal(r.a,2720000);assert.equal(r.b,2510000);assert.equal(r.difference,210000);assert.equal(r.cheaper,'b');
});
test('repair vs replacement with electricity',()=>{
 const r=calc.appliance({repair:30000,replacement:120000,oldPower:20000,newPower:12000});
 assert.equal(r.initialDifference,90000);assert.equal(r.annualElectricityDifference,8000);assert.equal(r.totalRepair(5),130000);assert.equal(r.totalNew(5),180000);
});
test('car running cost and no-car alternatives',()=>{
 const r=calc.car({fuel:10000,parking:5000,monthlyOther:0,insurance:60000,tax:0,inspection:0,cycle:2,maintenance:0,purchase:1000000,holdingYears:5,transit:120000,taxi:20000,carshare:20000});
 assert.equal(r.annualRunning,240000);assert.equal(r.annualCar,440000);assert.equal(r.annualNoCar,160000);assert.equal(r.difference,280000);
});
test('invalid costs rejected',()=>{
 assert.throws(()=>calc.places({aRent:-1,bRent:0,aCost:0,bCost:0}),/Invalid/);
 assert.throws(()=>calc.appliance({repair:NaN,replacement:10,oldPower:0,newPower:0}),/Invalid/);
});
test('all dedicated pages load math and have canonical URLs',()=>{
 const sitemap=read('public/sitemap.xml');
 for(const slug of ['moving-value-calculator','repair-or-replace-calculator','car-or-no-car-calculator']){
  const html=read('public/'+slug+'/index.html');
  assert.match(html,/\/compare\/math\.js/);assert.match(html,/\/compare\/tools\.js/);
  assert.match(html,/rel="canonical"/);assert.ok(sitemap.includes('https://kurashi-yoho.vercel.app/'+slug+'/'));
 }
});
