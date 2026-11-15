// Vista del menú Presupuesto 2027. Utiliza las funciones compartidas de js/app.js.
function vista_presupuesto(ctx) {
  const { budgetRows } = ctx;
  const gross = budgetRows.length
    ? sum(budgetRows, 'Presupuesto proyecto acuerdo 2027')
    : null;
  const millions = v => n(v) === null
    ? 'Sin dato'
    : '$ ' + new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(v / 1000000) + ' millones';

  let body = header('Presupuesto Proyecto de Acuerdo 2027');
  body += '<div class="budget-page-kpis">' +
    '<div class="budget-page-kpi"><span>Proyecto de Acuerdo · suma de registros</span><strong>' + millions(gross) + '</strong></div>' +
    '<div class="budget-page-kpi"><span>Registros presupuestales</span><strong>' + nf(budgetRows.length) + '</strong></div>' +
    '</div>';
  body += table(
    ['BPIN / Radicado', 'Sector', 'Programa', 'Producto', 'Presupuesto Proyecto de Acuerdo 2027'],
    budgetRows.map(x => [
      x['Radicado banco'], x.Sector, x.Programa, x.Producto,
      money(x['Presupuesto proyecto acuerdo 2027'])
    ])
  );
  $('#panel').innerHTML = body;
}
