// Shared damaged / hostile / extreme On the Job data sets (made-up data only). Used by otj_edge_t.js and otj_restore_t.js.
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');const T=ymd(new Date());const t0=new Date(T+'T07:00:00').getTime();
const SET={rate:28,otRate:'',period:'weekly',anchor:T,weekStart:1,state:'FL',stateRate:'',filing:'single',k401:'',health:'',credits:'',extraWH:'',perDiem:'',perDiemNT:false};
const base=x=>Object.assign({app:'yfs-on-the-job',v:1,created:Date.now(),settings:SET,labels:{proj:'Job / Project #',po:'PO # + Line',cost:'Cost Code',wo:'Work Order #'},jobs:[{id:'j1',name:'Gulf Coast Grocers',rate:'',otRate:'',active:true}],codes:[],entries:[],pto:{buckets:[]},clock:null,log:[],lastBackup:Date.now(),ui:{a2hsX:1}},x);
const W=(o)=>Object.assign({id:'e'+Math.random(),kind:'work',date:T,start:t0,end:t0+8*3600e3,breakMin:0,jobId:'j1',codeId:'',splits:[],note:''},o);
const XSS='<img src=x onerror="window.__pwn=1">';
const CASES={
 'missing lists (old/partial save)':{app:'yfs-on-the-job',v:1,settings:SET},
 'lists are wrong types':base({jobs:null,codes:'x',entries:{},pto:null,log:5,labels:null,ui:null}),
 'settings half-filled':base({settings:{rate:'abc',period:'nope',state:'ZZ',filing:'?',weekStart:9},entries:[W({})]}),
 'no settings but has entries':base({settings:null,entries:[W({})]}),
 'garbage entries':base({entries:[null,5,'x',{},W({start:'x',end:null}),W({date:'not-a-date'}),W({end:t0-3600e3}),W({breakMin:99999}),W({jobId:'gone'}),W({splits:[{codeId:'gone',hours:'x'},null]}),W({kind:'pto',bucket:'gone',hours:-5}),W({kind:'weird'})]}),
 'extreme numbers':base({settings:Object.assign({},SET,{rate:1e12,k401:1e9,health:-500,extraWH:1e9,perDiem:1e7,credits:-1e6}),entries:[W({end:t0+400*3600e3}),W({date:'1900-01-01',start:-1e15,end:1e15})]}),
 'negative + zero pay':base({settings:Object.assign({},SET,{rate:-20}),jobs:[{id:'j1',name:'',rate:0,otRate:-1,active:true}],entries:[W({})]}),
 'hostile names':base({jobs:[{id:'j1',name:XSS,rate:'',otRate:'',active:true}],codes:[{id:'c1',nick:XSS,jobId:'j1',fields:{proj:XSS,po:XSS,cost:XSS,wo:XSS},active:true},{id:'c2',nick:XSS}],labels:{proj:XSS,po:XSS,cost:XSS,wo:XSS},entries:[W({note:XSS,codeId:'c1'})],pto:{buckets:[{id:'b1',name:XSS,type:XSS,earn:XSS,per:XSS}]},log:[{t:Date.now(),what:XSS,old:XSS,new:XSS,reason:XSS}]}),
 'clock left running for a year':base({clock:{start:Date.now()-365*86400e3,jobId:'j1',breaks:[{s:Date.now()-1000}]}}),
 'clock is garbage':base({clock:{start:'x',breaks:'y'}}),
 'pto garbage':base({pto:{buckets:[null,{id:'b',name:'Vac',hours:'x',accrual:null,start:'bad'},{id:'c',name:'Sick',accrual:{type:'perHour',rate:1e9}}]},entries:[W({kind:'pto',bucket:'b',hours:1e9})]}),
 '5,000 entries':base({entries:Array.from({length:5000},(_,i)=>W({id:'e'+i,date:ymd(new Date(Date.now()-i*86400e3)),start:t0-i*86400e3,end:t0-i*86400e3+9*3600e3}))}),
};
module.exports={CASES,base,W,SET,T,t0,XSS,ymd};
