// Vista independiente del menú. Recibe el contexto y utiliza utilidades de js/app.js.
function vista_resumen(ctx){
  const {m,b,f,phys,sectors,programs,allFinance,scope,cutoff,year,budgetRows}=ctx;
  let body='';

  const overall=allFinance.filter(x=>n(x['PPTO definitivo'])!==null&&n(x.Ejecutado)!==null);
  const pp=sum(overall,'PPTO definitivo'),ex=sum(overall,'Ejecutado');
  const financialRate=!scope&&pp>0?ex/pp:f.ratio;
  const categories={cumplidas:0,bajo:0,seguimiento:0,sinMeta:0,sinReporte:0};
  for(const r of m){
    const target=metaYear(r),progress=avance(r),rate=ratio(r);
    if(target===null||target<=0)categories.sinMeta++;
    else if(progress===null||rate===null)categories.sinReporte++;
    else if(rate>=1)categories.cumplidas++;
    else if(rate<0.5)categories.bajo++;
    else categories.seguimiento++;
  }
  const categoryItems=[
    ['Metas / indicadores',m.length,'target','#dceeff','#07508c',''],
    ['Cumplidas',categories.cumplidas,'check-circle','#dcf7e3','#157438'],
    ['Bajo avance',categories.bajo,'bar-chart','#fff0df','#b75b0b'],
    ['En seguimiento',categories.seguimiento,'refresh','#e2f1ff','#0769bf'],
    ['Sin meta',categories.sinMeta,'pause','#e9edf3','#526075']
    /*['Sin reporte',categories.sinReporte,'x-circle','#ffe5eb','#ae2248']*/
  ];
  const symbols={'target':'◎','check-circle':'✓','bar-chart':'▥','refresh':'↻','pause':'Ⅱ','x-circle':'×'};
  const gauges=(label,value,color)=>{let valid=n(value)!==null;let raw=valid?value*100:0;let clipped=Math.max(0,Math.min(100,raw));return `<div class="gauge-item"><div class="gauge-arc" style="--gauge-color:${color};--gauge-angle:${clipped*1.8}deg"><div class="gauge-hole"><strong>${valid?esc(percent(value)):'Sin dato'}</strong></div></div><div class="gauge-label">${esc(label)}</div></div>`};
  body=`<section class="executive-summary"><div class="executive-heading"><h2><span class="heading-icon">▥</span> Resumen General del Plan de Desarrollo</h2><span class="cutoff-pill">▦ ${esc(cutoff)}</span></div><div class="executive-kpis">${categoryItems.map(([label,value,icon,bg,fg])=>`<article class="executive-kpi" style="--kpi-bg:${bg};--kpi-fg:${fg}"><span class="kpi-icon">${symbols[icon]}</span><div><strong>${nf(value)}</strong><span>${esc(label)}</span><small>${nf(m.length?value/m.length*100:0)} % del total</small></div></article>`).join('')}</div><div class="executive-charts"><article class="executive-panel"><h3>▧ Avance global del Plan</h3><div class="gauge-pair">${gauges('Avance físico',phys,'#0798ee')}${gauges('Ejecución financiera',financialRate,'#2bae58')}</div><p class="executive-footnote">${n(phys)!==null&&phys>1?'El avance físico promedio se ajusta a un máximo de 100 % por indicador. ':''}${scope?'Ejecución financiera por registros de metas: provisional.':'Ejecución financiera según resumen por dependencia.'}</p></article><article class="executive-panel"><h3>◉ Estado de las metas (${nf(m.length)})</h3><div class="donut-layout"><div class="donut-box"><canvas id="estadoDonut"></canvas></div><div class="donut-legend">${[['Cumplidas',categories.cumplidas,'#29a947'],['Bajo avance',categories.bajo,'#f39b2e'],['En seguimiento',categories.seguimiento,'#2198f3'],['Sin meta',categories.sinMeta,'#9aa9bf'],['Sin reporte',categories.sinReporte,'#b72e56']].map(([label,value,color])=>`<div><i style="background:${color}"></i><span>${esc(label)}</span><strong>${nf(value)} (${nf(m.length?value/m.length*100:0)} %)</strong></div>`).join('')}</div></div></article><article class="executive-panel"><h3>▥ Ejecución financiera por vigencia</h3><div class="vigencia-chart"><div class="vigencia-bars"><div class="vigencia-axis"><span>100 %</span><span>75 %</span><span>50 %</span><span>25 %</span><span>0 %</span></div><div class="vigencia-plot">${[2024,2025,2026,2027].map((v,i)=>{const value=v===2026?financialRate:null;const valid=n(value)!==null&&value>=0;const h=valid?Math.max(0,Math.min(100,value*100)):0;return `<div class="vigencia-col"><span class="v-value">${valid?percent(value):v===2027?'Programado':'Sin dato'}</span>${valid?`<div class="v-bar" style="--bar-height:${h}%;--bar-color:${['#073e79','#0798ee','#f59e0b'][i]}"></div>`:'<div class="v-empty"></div>'}<span class="v-year">${v}</span></div>`}).join('')}</div></div></div></article></div>${renderExecutiveBottom(m,b,budgetRows,scope)}</section>`;
  $('#panel').innerHTML=body;
  if(window.Chart){let canvas=document.getElementById('estadoDonut');let dc=new Chart(canvas,{type:'doughnut',data:{labels:['Cumplidas','Bajo avance','En seguimiento','Sin meta','Sin reporte'],datasets:[{data:[categories.cumplidas,categories.bajo,categories.seguimiento,categories.sinMeta,categories.sinReporte],backgroundColor:['#29a947','#f39b2e','#2198f3','#9aa9bf','#b72e56'],borderWidth:2,borderColor:'#fff'}]},options:{responsive:true,maintainAspectRatio:false,cutout:'69%',plugins:{legend:{display:false}}}});charts.push(dc)}
  return;

}
