// Vista independiente del menú Metas y productos.
// El filtro local de estado utiliza la misma clasificación que el Resumen General.
let estadoMetasSeleccionado = 'todas';

function estadoCumplimientoMeta(r) {
  const meta = metaYear(r);
  const ejecutado = avance(r);
  const cumplimiento = ratio(r);
  if (meta === null || meta <= 0) return 'sinmeta';
  if (ejecutado === null || cumplimiento === null) return 'sinreporte';
  if (cumplimiento >= 1) return 'cumplida';
  if (cumplimiento >= 0.7) return 'programado';
  if (cumplimiento > 0.2) return 'ejecucion';
  return 'bajo';
}

function vista_metas(ctx) {
  const {m, phys, year} = ctx;
  const estados = [
    ['todas', 'Todas las metas'],
    ['cumplida', 'Cumplidas'],
    ['programado', 'Avance programado'],
    ['ejecucion', 'En ejecución'],
    ['bajo', 'Baja ejecución'],
    ['sinmeta', 'Sin meta programada'],
    ['sinreporte', 'Sin reporte']
  ];

  const renderMetasFiltradas = () => {
    const visibles = estadoMetasSeleccionado === 'todas'
      ? m
      : m.filter(r => estadoCumplimientoMeta(r) === estadoMetasSeleccionado);
    const avanceFisico = physical(visibles);
    const conteos = estados.slice(1).map(([clave, nombre]) => ({
      clave, nombre, cantidad: m.filter(r => estadoCumplimientoMeta(r) === clave).length
    }));
    const maxConteo = Math.max(1, ...conteos.map(x => x.cantidad));
    const colores = {cumplida:'#18a058',programado:'#1687c9',ejecucion:'#ef9b21',bajo:'#d95151',sinmeta:'#8996a6',sinreporte:'#b17acb'};
    const graficoEstados = '<div aria-label="Distribución de metas por estado" style="min-width:260px;flex:1;max-width:650px">' +
      '<div style="font-weight:600;color:#073e79;margin-bottom:7px;font-size:13px">Distribución por estado · ' + nf(m.length) + ' metas</div>' +
      conteos.map(x => '<button type="button" class="pdm-estado-barra" data-estado="' + x.clave + '" aria-label="Filtrar ' + x.nombre + ': ' + x.cantidad + ' metas" style="display:grid;grid-template-columns:minmax(105px,145px) 1fr 30px;align-items:center;gap:8px;width:100%;padding:3px 4px;margin:0 0 2px;border:' + (estadoMetasSeleccionado===x.clave?'1px solid #9cb9d9':'1px solid transparent') + ';border-radius:5px;background:' + (estadoMetasSeleccionado===x.clave?'#eaf2fc':'transparent') + ';cursor:pointer;text-align:left;color:#243b55;font:inherit;font-size:11px">' +
        '<span>' + x.nombre + '</span><span style="display:block;height:9px;border-radius:5px;background:#e7edf4;overflow:hidden"><span style="display:block;height:100%;width:' + (x.cantidad/maxConteo*100).toFixed(2) + '%;background:' + colores[x.clave] + ';border-radius:5px"></span></span><strong style="text-align:right">' + x.cantidad + '</strong></button>').join('') + '</div>';
    const contenido = header('Metas e indicadores de producto', 'Numeral segundo del oficio') +
      '<div class="panel-card" style="padding:12px 14px;margin-bottom:12px;display:flex;gap:22px;align-items:flex-start;flex-wrap:wrap">' +
        '<div style="flex:0 1 330px;min-width:245px">' +
          '<label for="estado-metas" style="display:block;font-weight:600;color:#073e79;margin-bottom:6px">Estado de cumplimiento</label>' +
          '<select id="estado-metas" aria-label="Filtrar metas por estado" style="width:100%;min-height:35px;padding:5px 9px;border:1px solid #bfd3ea;border-radius:7px;background:#fff;color:#073e79">' +
            estados.map(([valor, etiqueta]) => '<option value="' + valor + '"' + (estadoMetasSeleccionado === valor ? ' selected' : '') + '>' + etiqueta + '</option>').join('') +
          '</select>' +
          '<div style="margin-top:7px;font-size:13px;color:#526075">' + nf(visibles.length) + ' de ' + nf(m.length) + ' metas</div>' +
        '</div>' + graficoEstados +
      '</div>' +
      cards([
        ['Indicadores', nf(visibles.length), 'Según filtros'],
        ['Con dato reportado', nf(visibles.filter(x => avance(x) !== null).length), 'Incluye avances iguales a cero'],
        ['Avance físico promedio', percent(avanceFisico), 'Promedio ajustado (máx. 100 % por meta)'],
        ['Con BPIN', nf(visibles.filter(x => x['Radicado banco']).length), 'Identificador registrado']
      ]) +
      table(
        ['Sector', 'Programa', 'Producto', 'Indicador', 'BPIN / radicado', 'Meta ' + year, 'Ejecución física ' + year, '% cumplimiento', 'Proyecto Acuerdo 2027'],
        visibles.map(x => [x.Sector, x.Programa, x.Producto, x['Indicador PDM'], x['Radicado banco'], nf(metaYear(x)), avance(x) === null ? 'Sin reporte' : nf(avance(x)), bar(ratio(x)), money(x['Presupuesto proyecto acuerdo 2027'])])
      );
    $('#panel').innerHTML = contenido;
    document.querySelectorAll('.pdm-estado-barra').forEach(boton => {
      boton.addEventListener('click', () => {
        const clave = boton.dataset.estado;
        estadoMetasSeleccionado = estadoMetasSeleccionado === clave ? 'todas' : clave;
        renderMetasFiltradas();
      });
    });
    document.getElementById('estado-metas').addEventListener('change', e => {
      estadoMetasSeleccionado = e.target.value;
      renderMetasFiltradas();
    });
  };
  renderMetasFiltradas();
}
