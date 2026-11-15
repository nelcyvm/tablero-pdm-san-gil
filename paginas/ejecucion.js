// Vista independiente del menú. Recibe el contexto y utiliza utilidades de js/app.js.
function vista_ejecucion(ctx){
  const {m,b,f,phys,sectors,programs,allFinance,scope,cutoff,year,budgetRows}=ctx;
  let body='';

const ok25=b.filter(x=>n(x['Ejecutado 2025'])!==null),ok26=b.filter(x=>n(x['Ejecutado 2026'])!==null);
const total25=ok25.length?sum(ok25,'Ejecutado 2025'):null,total26=ok26.length?sum(ok26,'Ejecutado 2026'):null;
const both=b.filter(x=>n(x['Ejecutado 2025'])!==null&&n(x['Ejecutado 2026'])!==null);
body=header('Ejecución por Banco de Proyectos','Cifras disponibles para 2025 y 2026')+
'<div class="exec-feature-grid">'+
'<article class="exec-feature exec-feature-blue"><span>Ejecutado 2025</span><strong>'+money(total25)+'</strong></article>'+
'<article class="exec-feature exec-feature-green"><span>Ejecutado 2026</span><strong>'+money(total26)+'</strong></article>'+
'</div>';
const rankedExec=[...b].sort((a,c)=>((n(c['Ejecutado 2025'])||0)+(n(c['Ejecutado 2026'])||0))-((n(a['Ejecutado 2025'])||0)+(n(a['Ejecutado 2026'])||0)));
body+=header('Ejecución por proyecto','Ordenado por suma de importes disponibles')+
table(['BPIN / Radicado','Proyecto','Ejecutado 2025','Ejecutado 2026','Total de ambos años*'],rankedExec.map(x=>{let a=n(x['Ejecutado 2025']),c=n(x['Ejecutado 2026']);return[x['Radicado BPIN'],x['Nombre proyecto'],money(a),money(c),a!==null&&c!==null?money(a+c):'Sin dato']}));

$('#panel').innerHTML=body;

}
