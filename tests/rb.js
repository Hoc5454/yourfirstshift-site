const { chromium } = require('playwright');const fs=require('fs');
const [,,html,look,out]=process.argv;
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({acceptDownloads:true,viewport:{width:390,height:844}});const p=await ctx.newPage();
 p.on('pageerror',e=>console.log('PAGEERR',e.message));p.on('dialog',d=>{console.log('DIALOG',d.message());d.dismiss();});
 await ctx.route('**/*',r=>{const u=r.request().url();
  if(u.startsWith('http://yfs.local/app.html'))return r.fulfill({body:fs.readFileSync(html),contentType:'text/html'});
  if(u.includes('html2pdf.bundle'))return r.fulfill({body:fs.readFileSync('node_modules/html2pdf.js/dist/html2pdf.bundle.min.js'),contentType:'application/javascript'});
  if(u.includes('jspdf.umd'))return r.fulfill({body:fs.readFileSync('node_modules/jspdf/dist/jspdf.umd.min.js'),contentType:'application/javascript'});
  if(u.includes('fonts.g'))return r.fulfill({body:'',contentType:'text/css'});
  return r.fulfill({body:'{}',contentType:'application/json'});});
 await p.addInitScript(()=>{localStorage.setItem('yfs_pro','1');});
 await p.goto('http://yfs.local/app.html');await p.waitForTimeout(800);
 await p.evaluate((look)=>{isPro=true;selectedStyle=look;const i=TOOLS.findIndex(t=>t.hasBuilder);switchTool(i);
  const v={name:'Jeffrey Moreno',target:'Pipeline Welder & Field Foreman',location:'Port St. Lucie, FL',phone:'(772) 555-0142',email:'jeff.moreno@email.com',links:'',
  experience:'Field Foreman | Coastal Pipeline Services | 2019 – Present\n• Run daily operations for 6–14 person crews on gas transmission tie-ins\n• Coordinate excavation, welding, coating, and hydrotest subcontractors\n• Cut rework 30% with pre-job walk-downs and weld-map checks\n• 1,400+ days without a lost-time incident\nPipeline Welder | Sunbelt Energy Contractors | 2015 – 2019\n• SMAW downhill welding on 6"–24" transmission lines to API 1104\n• 98% X-ray pass rate over 4 years\n• Hot taps, stopple fittings, and live-gas tie-ins\nWelder Helper | Treasure Coast Utilities | 2012 – 2015\n• Prepped bevels and ran fire watch on water and sewer mains\n• Operated mini-excavator and skid steer',
  skills:'SMAW, GTAW, API 1104, Hot taps, Hydrotesting, Excavation & trenching, Crew leadership, OSHA 30, CDL-A, Bilingual English / Spanish',
  education:'Welding Technology Certificate — Indian River State College, 2013\nHigh School Diploma — Fort Pierce Central, 2010',extra:'Excavation & Trenching Competent Person · Operator Qualification (14 tasks)'};
  Object.entries(v).forEach(([k,x])=>{const el=document.getElementById('b_'+k);if(el)el.value=x;});
  rbSummary='Field foreman and certified pipeline welder with 12 years on Florida gas transmission and utility projects. Leads crews of 6–14 safely and on schedule.';rbRender();},look);
 await p.waitForTimeout(300);
 const ok=await p.evaluate(()=>!!document.getElementById('rbDlBtn'));console.log('btn',ok);
 const [d]=await Promise.all([p.waitForEvent('download',{timeout:30000}),p.evaluate(()=>rbDownloadPdf())]);
 console.log('file',d.suggestedFilename());await d.saveAs(out);await b.close();})();
