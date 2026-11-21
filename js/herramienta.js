// Convertidor PDM San Gil: solo DOCUMENTO CONSOLIDADO.
// Requiere SheetJS XLSX en herramienta.html y config/filas_financieras_2026.json.
const $ = s => document.querySelector(s);
let base=null, payload=null, report=null, financialConfig=null;
const message=(s,bad=false)=>{const el=$('#resultado');el.style.display='block';el.style.borderLeftColor=bad?'#c43d3d':'#0798ee';el.textContent=s};
const cell=(r,i)=>{let v=r[i];return v===undefined||v===''?null:v};
const normalize=v=>String(v??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('es');
const cols={'Sector':0,'Programa':1,'Código producto':2,'Rubro presupuestal':3,'Radicado banco':4,'Producto':5,'Indicador PDM':6,'Unidad':7,'Meta 2024':8,'Meta 2025':9,'Meta 2026':10,'Meta 2027':11,'Meta cuatrienio':12,'Avance 2024':13,'Avance 2025':14,'Avance 2026':15,'Avance 2027':16,'Avance acumulado':17,'% avance cuatrienio (fuente)':22,'Acciones por indicador':34,'Soporte acción':35,'Responsable':36,'PPTO definitivo 2026':37,'Ejecutado 2026 (fuente)':38,'Saldo 2026':39,'Enlace SECOP':40,'% avance físico 2026 (fuente)':20};
function rowsFromExcel(ws){
 const grid=XLSX.utils.sheet_to_json(ws,{header:1,defval:null,raw:true,blankrows:true});
 if(normalize(grid[3]?.[0])!=='sector'||!normalize(grid[3]?.[6]).includes('indicador'))throw Error('Encabezados inesperados: verifique fila 4.');
 const records=[];const sourceRows=new Map();
 for(let i=4;i<grid.length;i++){
  const r=grid[i]||[];sourceRows.set(i+1,r);
  if(!r[2]||!r[6])continue;
  const obj={'Fila origen 2026':i+1};
  for(const [k,j] of Object.entries(cols))obj[k]=cell(r,j);
  for(const k of ['Código producto','Radicado banco'])if(obj[k]!=null)obj[k]=String(obj[k]).trim();
  records.push(obj);
 }
 return {records,sourceRows};
}
function cleanDep(v){return String(v??'').normalize('NFKC').replace(/[\u00a0\u2000-\u200d\u202f\u2060\ufeff]/g,' ').replace(/\s+/g,' ').trim().toLocaleUpperCase('es');}
function calculateSummary(records,sourceRows){
  // Fuente única: valores cacheados de AK y U en DOCUMENTO CONSOLIDADO.
  // Los nombres se normalizan para que los espacios no excluyan metas.
  const summary=[];
  const byDep=new Map();
  for(const r of records){const dep=cleanDep(r.Responsable);if(!dep)continue;
    if(!byDep.has(dep))byDep.set(dep,[]);byDep.get(dep).push(r);
  }
  const configured=new Set(financialConfig.map(rule=>cleanDep(rule.dependencia)));
  const unexpected=[...byDep.keys()].filter(dep=>!configured.has(dep));
  if(unexpected.length)throw Error('Responsables sin regla financiera: '+unexpected.join(', '));
  for(const rule of financialConfig){
    const dep=cleanDep(rule.dependencia);
    const candidates=byDep.get(dep)||[];
    const vals=candidates.map(r=>r['% avance físico 2026 (fuente)']).filter(v=>typeof v==='number'&&Number.isFinite(v));
    const physical=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
    let budget=0,executed=0;
    for(const excelRow of rule.filas_financieras){
      const r=sourceRows.get(excelRow);
      if(!r)throw Error('Falta fila financiera '+excelRow+' de '+dep+'.');
      const b=cell(r,37),e=cell(r,38);
      if(b!=null&&!Number.isFinite(Number(b)))throw Error('Presupuesto no numérico, fila '+excelRow);
      if(e!=null&&!Number.isFinite(Number(e)))throw Error('Ejecutado no numérico, fila '+excelRow);
      budget+=Number(b||0);executed+=Number(e||0);
    }
    summary.push({'Dependencia':dep,'Avance físico (fuente)':physical,'PPTO definitivo':budget,'Ejecutado':executed,'Por ejecutar':budget-executed,'Avance financiero (fuente)':budget?executed/budget:null,'Metas':candidates.length,'Metas consideradas promedio':vals.length});
  }
  return summary;
}
function download(obj,name){const a=document.createElement('a');const url=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}
$('#procesar').onclick=async()=>{
 const file=$('#archivo').files[0];if(!file)return message('Seleccione el Excel.',true);
 if(!window.XLSX)return message('No se cargó SheetJS XLSX.',true);
 try{
  const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true});
  if(!wb.Sheets['DOCUMENTO CONSOLIDADO'])throw Error('Falta hoja DOCUMENTO CONSOLIDADO.');
  const {records,sourceRows}=rowsFromExcel(wb.Sheets['DOCUMENTO CONSOLIDADO']);
  if(records.length!==base.tablas.METAS_2026.length)throw Error('El Excel contiene '+records.length+' metas y el JSON base '+base.tablas.METAS_2026.length+'. No se reemplazó nada.');
  const oldByRow=new Map(base.tablas.METAS_2026.map(r=>[Number(r['Fila origen 2026']),r]));
  const missing=records.filter(r=>!oldByRow.has(r['Fila origen 2026']));
  const changedIdentity=records.filter(r=>{const old=oldByRow.get(r['Fila origen 2026']);return old&&['Código producto','Indicador PDM','Radicado banco'].some(k=>normalize(old[k])!==normalize(r[k]));});
  if(changedIdentity.length)throw Error('Se detectaron '+changedIdentity.length+' cambios de identidad (código, indicador o radicado) en filas existentes. Revise filas insertadas o desplazadas antes de publicar.');
  if(missing.length)throw Error('Cambió la numeración de filas de '+missing.length+' metas. Revise el cruce antes de publicar.');
  const metas=records.map(r=>({...oldByRow.get(r['Fila origen 2026']),...r,Responsable:cleanDep(r.Responsable)}));
  // Validación estructural: las filas financieras deben seguir apuntando a los mismos indicadores.
  const shifted=[];
  for(const rule of financialConfig)for(const n of rule.filas_financieras){
    const old=oldByRow.get(n),fresh=records.find(r=>r['Fila origen 2026']===n);
    if(!old||!fresh||['Código producto','Indicador PDM','Radicado banco'].some(k=>normalize(old[k])!==normalize(fresh[k])))shifted.push(n);
  }
  if(shifted.length)throw Error('Las filas financieras configuradas ya no corresponden a las metas originales: '+[...new Set(shifted)].slice(0,12).join(', ')+'. Revise la configuración; no se generó JSON.');
  const summary=calculateSummary(records,sourceRows);
  if(summary.length!==15)throw Error('Se esperaban 15 dependencias y se encontraron '+summary.length);
  const budget=summary.reduce((a,r)=>a+r['PPTO definitivo'],0),executed=summary.reduce((a,r)=>a+r.Ejecutado,0);
  if(!(budget>0)||!Number.isFinite(budget)||!Number.isFinite(executed))throw Error('Totales financieros inválidos; conversión detenida.');
  const phys=summary.map(r=>r['Avance físico (fuente)']).filter(v=>v!=null);
  const financialYears={...base.finanzas_por_vigencia,'2024':base.finanzas_por_vigencia?.['2024']??null,'2025':base.finanzas_por_vigencia?.['2025']??null,'2026':{presupuesto_definitivo:Math.round(budget*100)/100,ejecutado:Math.round(executed*100)/100,por_ejecutar:Math.round((budget-executed)*100)/100,porcentaje_ejecucion:budget?Math.round(10000*executed/budget)/100:null},'2027':base.finanzas_por_vigencia?.['2027']??null};
  payload={...base,finanzas_por_vigencia:financialYears,metadata:{...base.metadata,corte:base.metadata?.corte||'2026-10-31',fuente_actualizacion:file.name+' — DOCUMENTO CONSOLIDADO',fecha_conversion:new Date().toISOString().slice(0,10),nota_actualizacion:'RESUMEN_2026 calculado exclusivamente desde DOCUMENTO CONSOLIDADO: promedio AK/U con responsables normalizados y sumas AL/AM. No se lee RESUMEN. Banco y 2027 conservados.'},tablas:{...base.tablas,METAS_2026:metas,RESUMEN_2026:summary}};
  report={archivo:file.name,hoja:'DOCUMENTO CONSOLIDADO',validacion_identidad:'207 filas y claves (código, indicador, radicado) verificadas por fila',metas:metas.length,dependencias:summary.length,presupuesto:budget,ejecutado:executed,ejecucion_financiera_pct:budget?100*executed/budget:null,finanzas_por_vigencia:financialYears,promedio_fisico_dependencias_pct:phys.length?100*phys.reduce((a,b)=>a+b,0)/phys.length:null,advertencia:'Avance físico por dependencia calculado desde AK/U agrupando responsables normalizados (sin espacios sobrantes). Avance global institucional: promedio de 15 dependencias. Las filas financieras AL/AM siguen una configuración de posiciones originales.'};
  if(Math.abs(budget-101522028904.08)<1 && Math.abs(executed-94446329411.77)<1){report.conciliacion_referencia_2026='COINCIDE con el corte de referencia 2026-10-31';}
  else {report.conciliacion_referencia_2026='DIFIERE del corte de referencia: revise si corresponde a un nuevo corte y valide las 15 dependencias';}
  $('#acciones').style.display='flex';message('Conversión preparada: '+metas.length+' metas; '+summary.length+' dependencias; ejecución financiera '+report.ejecucion_financiera_pct.toFixed(2)+' %. Descargue el informe y valide antes de publicar.');
 }catch(e){payload=null;report=null;$('#acciones').style.display='none';message('Error: '+e.message,true)}
};
$('#descargar').onclick=()=>payload&&download(payload,'tablero.json');
$('#informe').onclick=()=>report&&download(report,'informe_conciliacion.json');
$('#respaldo').onclick=()=>base&&download(base,'tablero_respaldo.json');
$('#previsualizar').onclick=()=>{if(!payload)return;try{localStorage.setItem('pdm_preview',JSON.stringify(payload));location.href='index.html#resumen'}catch(e){message('No cabe en almacenamiento local. Descargue el JSON.',true)}};
$('#salir').onclick=()=>{localStorage.removeItem('pdm_preview');message('Vista previa desactivada.')};
(async()=>{try{
 const [a,b]=await Promise.all([fetch('datos/tablero.json',{cache:'no-store'}),fetch('config/filas_financieras_2026.json',{cache:'no-store'})]);
 if(!a.ok||!b.ok)throw Error('No se pudieron leer el JSON base o la configuración financiera.');
 base=await a.json();financialConfig=await b.json();
 if(!Array.isArray(base?.tablas?.METAS_2026)||!Array.isArray(financialConfig))throw Error('JSON o configuración inválidos.');
 $('#procesar').disabled=false;message('Base lista: '+base.tablas.METAS_2026.length+' metas y '+financialConfig.length+' reglas financieras.');
}catch(e){message('Error al cargar: '+e.message+'. Abra la página mediante XAMPP.',true)}})();
