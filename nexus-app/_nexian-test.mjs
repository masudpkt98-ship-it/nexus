import { chromium } from "playwright-core";
const ROOT="/Users/masud.btg/Projects/nexus"; const base="http://localhost:3999";
const b=await chromium.launch(); const page=await b.newPage({viewport:{width:1360,height:1100}});
page.on("pageerror",e=>console.log("PAGEERR:",e.message));
await page.goto(base+"/nexian",{waitUntil:"networkidle"});
await page.locator('input[type="file"]').setInputFiles(ROOT+"/Nexian.xlsx");
await page.waitForTimeout(2500);
const info = await page.evaluate(()=>{
  const t=document.body.innerText;
  return {
    note:(t.match(/Imported[^\n]*/)||[])[0],
    total:(t.match(/Total Nexian\s*\n?\s*([\d.]+)/)||[])[1],
    mgmt:(t.match(/KPI Partner Manajemen\s*\n?\s*([\d.]+)/)||[])[1],
    partner:(t.match(/KPI Partner\s*\n?\s*([\d.]+)/g)||[]),
    rows: document.querySelectorAll('tbody tr').length,
    waLinks: document.querySelectorAll('a[href^="https://wa.me/"]').length,
  };
});
console.log(JSON.stringify(info,null,0));
await page.screenshot({path:ROOT+"/nexus-app/_nexian.png"});
await b.close();
