// Vista independiente del menú. Recibe el contexto y utiliza utilidades de js/app.js.
function vista_banco(ctx){
  const {m,b,f,phys,sectors,programs,allFinance,scope,cutoff,year,budgetRows}=ctx;
  let body='';

let related=new Map();m.forEach(x=>{let k=txt(x['Radicado banco']).trim();if(k){if(!related.has(k))related.set(k,[]);related.get(k).push(x)}});
const ranked=b.map(x=>({...x,productCount:(related.get(txt(x['Radicado BPIN']).trim())||[]).length})).sort((a,c)=>c.productCount-a.productCount);
const withProducts=ranked.filter(x=>x.productCount>0);
body=header('Banco de Programas y Proyectos','Portafolio de proyectos y productos vinculados')+
cards([['Proyectos registrados',nf(b.length),'Banco 2025–2026'],['BPIN únicos',nf(uniq(b.map(x=>txt(x['Radicado BPIN']).trim())).length),''],['Proyectos con productos',nf(withProducts.length),'Identificados por BPIN'],['Productos asociados',nf(m.filter(x=>txt(x['Radicado banco']).trim()).length),'']]);
body+=header('Portafolio de proyectos','Ordenado por cantidad de productos vinculados')+
table(['BPIN / Radicado','Nombre del proyecto','Productos vinculados'],ranked.map(x=>[x['Radicado BPIN'],x['Nombre proyecto'],nf(x.productCount)]));
body+=header('Productos vinculados a proyectos','Detalle del Plan de Acción')+
table(['BPIN / Radicado','Sector','Programa','Producto','Indicador','Meta 2026','Avance 2026'],m.filter(x=>txt(x['Radicado banco']).trim()).map(x=>[x['Radicado banco'],x.Sector,x.Programa,x.Producto,x['Indicador PDM'],nf(x['Meta 2026']),nf(x['Avance 2026'])]));

$('#panel').innerHTML=body;

}
