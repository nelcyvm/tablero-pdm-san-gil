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
  if (cumplimiento < 0.5) return 'bajo';
  return 'seguimiento';
}

function vista_metas(ctx) {
  const {m, phys, year} = ctx;
  const estados = [
    ['todas', 'Todas las metas'],
    ['cumplida', 'Cumplidas'],
    ['bajo', 'Bajo avance'],
    ['seguimiento', 'En seguimiento'],
    ['sinmeta', 'Sin meta programada'],
    ['sinreporte', 'Sin reporte']
  ];

  const renderMetasFiltradas = () => {
    const visibles = estadoMetasSeleccionado === 'todas'
      ? m
      : m.filter(r => estadoCumplimientoMeta(r) === estadoMetasSeleccionado);
    const avanceFisico = physical(visibles);
    const contenido = header('Metas e indicadores de producto', 'Numeral segundo del oficio') +
      '<div class="panel-card" style="padding:10px 14px;margin-bottom:12px">' +
        '<label for="estado-metas" style="display:block;font-weight:600;color:#073e79;margin-bottom:5px">Estado de cumplimiento</label>' +
        '<select id="estado-metas" aria-label="Filtrar metas por estado" style="width:100%;max-width:320px;min-height:35px;padding:5px 9px;border:1px solid #bfd3ea;border-radius:7px;background:#fff;color:#073e79">' +
          estados.map(([valor, etiqueta]) => '<option value="' + valor + '"' + (estadoMetasSeleccionado === valor ? ' selected' : '') + '>' + etiqueta + '</option>').join('') +
        '</select>' +
        '<span style="margin-left:12px;font-size:13px;color:#526075">' + nf(visibles.length) + ' de ' + nf(m.length) + ' metas</span>' +
      '</div>' +
      cards([
        ['Indicadores', nf(visibles.length), 'Según filtros'],
        ['Con avance registrado', nf(visibles.filter(x => avance(x) !== null).length), 'Vigencia seleccionada'],
        ['Cumplimiento medio', percent(avanceFisico), 'Promedio ajustado (máx. 100 % por meta)'],
        ['Con BPIN', nf(visibles.filter(x => x['Radicado banco']).length), 'Identificador registrado']
      ]) +
      table(
        ['Sector', 'Programa', 'Producto', 'Indicador', 'BPIN / radicado', 'Meta ' + year, 'Avance ' + year, '% cumplimiento', 'Proyecto Acuerdo 2027'],
        visibles.map(x => [x.Sector, x.Programa, x.Producto, x['Indicador PDM'], x['Radicado banco'], nf(metaYear(x)), nf(avance(x)), bar(ratio(x)), money(x['Presupuesto proyecto acuerdo 2027'])])
      );
    $('#panel').innerHTML = contenido;
    document.getElementById('estado-metas').addEventListener('change', e => {
      estadoMetasSeleccionado = e.target.value;
      renderMetasFiltradas();
    });
  };
  renderMetasFiltradas();
}
