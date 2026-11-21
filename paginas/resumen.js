// Vista independiente del menú. Recibe el contexto y utiliza utilidades de js/app.js.
function vista_resumen(ctx){
  const {m,b,f,phys,sectors,programs,allFinance,scope,cutoff,year,budgetRows}=ctx;
  let body='';

  // La vigencia financiera sigue el filtro; 'todas' mantiene 2026 como referencia
  // hasta que exista una fuente consolidada multianual verificable.
  const financialYear=year==='todas'?'2026':year;
  const financialRows=financialYear==='2026'?allFinance:T('RESUMEN_'+financialYear);
  const financialScope=scope;
  const depFilter=document.querySelector('#dependencia')?.value||'';
  const simpleDepScope=financialScope&&depFilter&&!document.querySelector('#sector')?.value&&!document.querySelector('#programa')?.value&&!document.querySelector('#bpin')?.value&&!document.querySelector('#buscar')?.value;
  const selectedFinance=financialScope?(simpleDepScope?financialRows.filter(x=>normDep(x.Dependencia)===normDep(depFilter)):[]):financialRows;
  const overall=selectedFinance.filter(x=>n(x['PPTO definitivo'])!==null&&n(x.Ejecutado)!==null);
  const pp=sum(overall,'PPTO definitivo'),ex=sum(overall,'Ejecutado');
  // Nunca reutilizar el porcentaje 2026 para otra vigencia.
  const financialRate=pp>0?ex/pp:null;
  const institutionalPhysical=simpleDepScope&&selectedFinance.length===1&&n(selectedFinance[0]['Avance físico (fuente)'])!==null?selectedFinance[0]['Avance físico (fuente)']:phys;
  const financialValid=overall.length>0&&pp>0;
  const moneyExact=v=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',minimumFractionDigits:0,maximumFractionDigits:0}).format(v);
  // Valores expresados en millones para evitar cortes en pantallas estrechas.
  // El importe completo se conserva al pasar el cursor por encima.
  const moneyMillions=v=>'$ '+new Intl.NumberFormat('es-CO',{maximumFractionDigits:0}).format(v/1000000)+' M';
  // Importe completo en tooltip. En pantalla: millones de pesos sin símbolo repetido.
  const financialDetails=`<div class="financial-breakdown" style="border-top:1px solid #e3eaf2;padding:9px 10px 7px"><div style="text-align:center;font-size:10px;color:#64748b;margin-bottom:6px">Valores en millones de pesos (COP) · ${esc(financialYear)}</div><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px">${[['Presupuesto definitivo',pp],['Ejecutado',ex],['Por ejecutar',pp-ex]].map(([label,value])=>`<div style="min-width:0;text-align:center;padding:0 2px" title="${esc(label+' '+financialYear+': '+(financialValid?moneyExact(value):'Sin datos'))}"><small style="display:block;color:#526b88;font-size:10px;line-height:1.25;min-height:25px">${esc(label)}</small><strong style="display:block;color:#083e79;font-size:clamp(11px,1vw,14px);font-weight:700;line-height:1.35;white-space:nowrap;font-variant-numeric:tabular-nums">${financialValid?esc('$ '+new Intl.NumberFormat('es-CO',{maximumFractionDigits:0}).format(value/1000000)):'Sin datos'}</strong></div>`).join('')}</div></div>`;
  const categories={cumplidas:0,programado:0,ejecucion:0,bajo:0,sinMeta:0,sinReporte:0};
  for(const r of m){
    const target=metaYear(r),progress=avance(r),rate=ratio(r);
    if(target===null||target<=0)categories.sinMeta++;
    else if(progress===null||rate===null)categories.sinReporte++;
    else if(rate>=1)categories.cumplidas++;
    else if(rate>=0.7)categories.programado++;
    else if(rate>0.2)categories.ejecucion++;
    else categories.bajo++;
  }
  // Escala de eficacia suministrada para el seguimiento del PDM.
  // Se aplica al promedio físico de indicadores válidos, no a los conteos de estado.
  const efficacy = n(institutionalPhysical)===null ? null : (institutionalPhysical>=0.8 ? ['Sobresaliente','#16844b'] : institutionalPhysical>=0.7 ? ['Satisfactorio','#35a96b'] : institutionalPhysical>=0.6 ? ['Medio','#d7a325'] : institutionalPhysical>=0.4 ? ['Bajo','#e88b27'] : ['Crítico','#d84343']);
  const efficacyHtml = `<article class="executive-panel efficacy-panel"><h3>◉ Calificación de eficacia · ${esc(year==='todas'?'Cuatrienio':year)}</h3><div class="efficacy-content"><div><strong class="efficacy-score">${n(institutionalPhysical)===null?'Sin dato':esc(percent(institutionalPhysical))}</strong><span class="efficacy-rating" style="--rating-color:${efficacy?efficacy[1]:'#64748b'}">${efficacy?esc(efficacy[0]):'No evaluable'}</span></div><div class="efficacy-scale"><span>Crítico &lt; 40 %</span><span>Bajo 40–&lt;60 %</span><span>Medio 60–&lt;70 %</span><span>Satisfactorio 70–&lt;80 %</span><span>Sobresaliente ≥ 80 %</span></div></div><p class="executive-footnote">Clasificación del avance físico calculado por el tablero. Los rangos son los suministrados para este proyecto; la metodología y su atribución al DNP deben validarse documentalmente.</p></article>`;
  const categoryItems=[
    ['Metas / indicadores',m.length,'target','#dceeff','#07508c',''],
    ['Cumplidas',categories.cumplidas,'check-circle','#dcf7e3','#157438'],
    ['Avance programado',categories.programado,'refresh','#e2f1ff','#0769bf'],
    ['En ejecución',categories.ejecucion,'bar-chart','#fff0df','#b75b0b'],
    ['Baja ejecución',categories.bajo,'pause','#ffe5eb','#ae2248'],
    ['Sin meta',categories.sinMeta,'pause','#e9edf3','#526075']
    /*['Sin reporte',categories.sinReporte,'x-circle','#ffe5eb','#ae2248']*/
  ];
  const symbols={'target':'◎','check-circle':'✓','bar-chart':'▥','refresh':'↻','pause':'Ⅱ','x-circle':'×'};
  const gauges=(label,value,color)=>{let valid=n(value)!==null;let raw=valid?value*100:0;let clipped=Math.max(0,Math.min(100,raw));return `<div class="gauge-item"><div class="gauge-arc" style="--gauge-color:${color};--gauge-angle:${clipped*1.8}deg"><div class="gauge-hole"><strong>${valid?esc(percent(value)):'Sin dato'}</strong></div></div><div class="gauge-label">${esc(label)}</div></div>`};
  body=`<section class="executive-summary"><div class="executive-heading"><h2><span class="heading-icon">▥</span> Resumen General del Plan de Desarrollo</h2><span class="cutoff-pill">▦ ${esc(cutoff)}</span></div><div class="executive-kpis">${categoryItems.map(([label,value,icon,bg,fg])=>`<article class="executive-kpi" style="--kpi-bg:${bg};--kpi-fg:${fg}"><span class="kpi-icon">${symbols[icon]}</span><div><strong>${nf(value)}</strong><span>${esc(label)}</span><small>${nf(m.length?value/m.length*100:0)} % del total</small></div></article>`).join('')}</div><div class="executive-charts"><article class="executive-panel"><h3>▧ Avance global del Plan</h3><div class="gauge-pair">${gauges('Avance físico',institutionalPhysical,'#0798ee')}${gauges('Ejecución financiera '+financialYear,financialRate,'#2bae58')}</div>${financialDetails}<p class="executive-footnote">${n(phys)!==null&&phys>1?'El avance físico promedio se ajusta a un máximo de 100 % por indicador. ':''}${financialRate===null?'No hay información financiera consolidada para '+financialYear+'.':financialScope&&!simpleDepScope?'No se dispone de consolidación financiera fiable para esta combinación de filtros.':'Ejecución financiera según resumen por dependencia.'}</p></article><article class="executive-panel"><h3>◉ Estado de las metas (${nf(m.length)})</h3><div class="donut-layout"><div class="donut-box"><canvas id="estadoDonut"></canvas></div><div class="donut-legend">${[['Cumplidas',categories.cumplidas,'#29a947'],['Avance programado',categories.programado,'#2198f3'],['En ejecución',categories.ejecucion,'#f39b2e'],['Baja ejecución',categories.bajo,'#e05b51'],['Sin meta',categories.sinMeta,'#9aa9bf'],['Sin reporte',categories.sinReporte,'#b72e56']].map(([label,value,color])=>`<div><i style="background:${color}"></i><span>${esc(label)}</span><strong>${nf(value)} (${nf(m.length?value/m.length*100:0)} %)</strong></div>`).join('')}</div></div></article><article class="executive-panel"><h3>▥ Ejecución financiera por vigencia</h3><div class="vigencia-chart"><div class="vigencia-bars"><div class="vigencia-axis"><span>100 %</span><span>75 %</span><span>50 %</span><span>25 %</span><span>0 %</span></div><div class="vigencia-plot">${[2024,2025,2026,2027].map((v,i)=>{const value=String(v)===financialYear?financialRate:null;const valid=n(value)!==null&&value>=0;const h=valid?Math.max(0,Math.min(100,value*100)):0;return `<div class="vigencia-col"><span class="v-value">${valid?percent(value):v===2027?'Programado':'Sin dato'}</span>${valid?`<div class="v-bar" style="--bar-height:${h}%;--bar-color:${['#073e79','#0798ee','#f59e0b'][i]}"></div>`:'<div class="v-empty"></div>'}<span class="v-year">${v}</span></div>`}).join('')}</div></div></div></article></div>${efficacyHtml}${year==='2026'&&!document.querySelector('#sector')?.value&&!document.querySelector('#programa')?.value&&!document.querySelector('#bpin')?.value&&!document.querySelector('#buscar')?.value?`<article class="executive-panel" style="margin-top:14px"><h3>▥ Consolidado oficial por dependencia · 2026</h3><div class="table-wrap"><table><thead><tr><th>Dependencia</th><th>Avance físico</th><th>Presupuesto definitivo</th><th>Ejecutado</th><th>Ejecución financiera</th></tr></thead><tbody>${selectedFinance.map(r=>`<tr><td>${esc(r.Dependencia)}</td><td>${esc(percent(r['Avance físico (fuente)']))}</td><td>${esc(money(r['PPTO definitivo']))}</td><td>${esc(money(r.Ejecutado))}</td><td>${esc(percent(r['Avance financiero (fuente)']))}</td></tr>`).join('')}</tbody></table></div></article>`:''}${renderExecutiveBottom(m,b,budgetRows,scope)}</section>`;
  $('#panel').innerHTML=body;
  if(window.Chart){let canvas=document.getElementById('estadoDonut');let dc=new Chart(canvas,{type:'doughnut',data:{labels:['Cumplidas','Avance programado','En ejecución','Baja ejecución','Sin meta','Sin reporte'],datasets:[{data:[categories.cumplidas,categories.programado,categories.ejecucion,categories.bajo,categories.sinMeta,categories.sinReporte],backgroundColor:['#29a947','#2198f3','#f39b2e','#e05b51','#9aa9bf','#b72e56'],borderWidth:2,borderColor:'#fff'}]},options:{responsive:true,maintainAspectRatio:false,cutout:'69%',plugins:{legend:{display:false}}}});charts.push(dc)}
  return;

}
