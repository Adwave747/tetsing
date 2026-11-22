const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const id of process.argv.slice(2)) {
    const p = await b.newPage({viewport:{width:1280,height:900}});
    const media=[];
    p.on('request', r => { if (r.resourceType()==='media' || /\.(mp4|m3u8|webm)/.test(r.url())) media.push(r.url()); });
    await p.goto('https://app.tryatria.com/ad/'+id, {waitUntil:'networkidle', timeout:60000}).catch(()=>{});
    await p.waitForTimeout(1500);
    const brand = await p.innerText('body').then(t=>t.split('\n').slice(3,4)[0]).catch(()=>'');
    await p.mouse.click(421, 662); await p.waitForTimeout(3000);
    const vids = await p.$$eval('video', v=>v.map(x=>x.currentSrc||x.src));
    console.log(JSON.stringify({id, brand, vids, media:[...new Set(media)]}));
    await p.close();
  }
  await b.close();
})();
