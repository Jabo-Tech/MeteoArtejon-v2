// ==========================================================
// VARIABLES E INDICADORES DISPONIBLES PARA GRÁFICAS
// (subconjunto de los de Consultas, según el documento)
// ==========================================================

const VARIABLES_GRAFICA = [
    { id: "temperatura", nombre: "Temperatura", icono: "🌡" },
    { id: "lluvia", nombre: "Lluvia", icono: "🌧" },
    { id: "viento", nombre: "Viento", icono: "💨" }
];

const INDICADORES_GRAFICA = {
    temperatura: ["maximo", "minimo", "media", "amplitud", "olasCalor"],
    lluvia: ["intensidadMax", "minimoIntensidad", "mediaIntensidad", "acumulado"],
    viento: ["maximo", "minimo", "media", "direccion"]
};

let registrosGrafica = [];
let chartLinea = null;
let chartComparativa = null;
let chartRosaVientos = null;
let chartWeibull = null;

// Guardamos el último resultado para poder pintar la tabla sin
// tener que repetir el cálculo al cambiar de vista.
let ultimoIndicador = null;
let ultimasFilasPrimario = [];
let ultimasFilasComparativo = [];
let ultimaRosaVientos = null;
let ultimaRosaVientosComparativo = null;
let ultimaVariableId = null;
let ultimaHayComparativa = true;

function cargarGraficas(registros) {

    registrosGrafica = registros;

}

// ----------------------------------------------------------
// POBLAR FILTROS
// ----------------------------------------------------------

function poblarVariablesGrafica() {

    const select = document.getElementById("graficaVariable");

    for (const variable of VARIABLES_GRAFICA) {

        const opcion = document.createElement("option");

        opcion.value = variable.id;
        opcion.textContent = `${variable.icono} ${variable.nombre}`;

        select.appendChild(opcion);

    }

}

function actualizarIndicadoresGrafica() {

    const variableId = document.getElementById("graficaVariable").value;
    const select = document.getElementById("graficaIndicador");

    select.innerHTML = "";

    for (const indicadorId of INDICADORES_GRAFICA[variableId]) {

        const indicador = INDICADORES_CONSULTA[variableId].find(i => i.id === indicadorId);

        const opcion = document.createElement("option");

        opcion.value = indicador.id;
        opcion.textContent = indicador.nombre;

        select.appendChild(opcion);

    }

}

// ----------------------------------------------------------
// PERIODO COMPARATIVO
// ----------------------------------------------------------

function calcularPeriodoAnterior(rango) {

    const inicio = new Date(rango.inicio);
    const fin = new Date(rango.fin);

    const duracionDias = Math.round((fin - inicio) / 86400000) + 1;

    const finAnterior = new Date(inicio);
    finAnterior.setDate(finAnterior.getDate() - 1);

    const inicioAnterior = new Date(finAnterior);
    inicioAnterior.setDate(inicioAnterior.getDate() - (duracionDias - 1));

    const aISO = d => d.toISOString().substring(0, 10);

    return { inicio: aISO(inicioAnterior), fin: aISO(finAnterior) };

}

function granularidadAutomatica(periodoId, rango) {

    if (periodoId === "hoy") return "hora";
    if (periodoId === "7dias" || periodoId === "mes") return "dia";
    if (periodoId === "año") return "mes";

    // personalizado: según la duración real del rango
    const dias = (new Date(rango.fin) - new Date(rango.inicio)) / 86400000;

    if (dias <= 2) return "hora";
    if (dias <= 62) return "dia";

    return "mes";

}

function acumularProgresivo(filas) {

    let corriendo = 0;

    return filas.map(fila => {

        corriendo += (fila.valor || 0);

        return { etiqueta: fila.etiqueta, valor: Number(corriendo.toFixed(1)) };

    });

}

// ----------------------------------------------------------
// ROSA DE LOS VIENTOS
// ----------------------------------------------------------

function calcularRosaVientos(registros, rango) {

    const enRango = registros.filter(r => r.fecha >= rango.inicio && r.fecha <= rango.fin);

    const conteo = { N: 0, NE: 0, E: 0, SE: 0, S: 0, SO: 0, O: 0, NO: 0 };

    for (const registro of enRango) {

        const punto = direccionDesdeGrados(registro.direccion);

        if (punto) conteo[punto]++;

    }

    return conteo;

}

// ----------------------------------------------------------
// DISTRIBUCIÓN DE WEIBULL (velocidad de viento)
// Ajuste por el método de los momentos (Justus et al.): a partir de
// la media y la desviación típica observadas se estima la forma (k)
// y la escala (c) de la Weibull que mejor las reproduce. Es la
// aproximación estándar más habitual para series de viento cuando no
// se dispone de un ajuste por máxima verosimilitud.
// ----------------------------------------------------------

function gammaFn(x) {

    const g = 7;
    const p = [
        0.99999999999980993, 676.5203681218851, -1259.1392167224028,
        771.32342877765313, -176.61502916214059, 12.507343278686905,
        -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
    ];

    if (x < 0.5) {
        return Math.PI / (Math.sin(Math.PI * x) * gammaFn(1 - x));
    }

    x -= 1;

    let a = p[0];
    const t = x + g + 0.5;

    for (let i = 1; i < g + 2; i++) {
        a += p[i] / (x + i);
    }

    return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;

}

function ajustarWeibull(valores) {

    const limpios = valores.filter(v => v !== null && v !== undefined && !isNaN(v) && v > 0);

    if (limpios.length < 10) return null;

    const media = limpios.reduce((a, b) => a + b, 0) / limpios.length;

    if (media === 0) return null;

    const varianza = limpios.reduce((a, b) => a + (b - media) ** 2, 0) / limpios.length;
    const desviacion = Math.sqrt(varianza);

    const cv = desviacion / media;

    const k = Math.pow(cv, -1.086);
    const c = media / gammaFn(1 + 1 / k);

    return { k, c, media, desviacion, muestras: limpios };

}

function densidadWeibull(x, k, c) {

    if (x < 0) return 0;

    return (k / c) * Math.pow(x / c, k - 1) * Math.exp(-Math.pow(x / c, k));

}

function calcularHistograma(valores, numBins) {

    const maximo = Math.max(...valores);
    const anchoBin = (maximo / numBins) || 1;

    const bins = Array.from({ length: numBins }, (_, i) => ({
        inicio: i * anchoBin,
        fin: (i + 1) * anchoBin,
        cuenta: 0
    }));

    for (const valor of valores) {

        let indice = Math.floor(valor / anchoBin);

        if (indice >= numBins) indice = numBins - 1;
        if (indice < 0) indice = 0;

        bins[indice].cuenta++;

    }

    return { bins, anchoBin };

}

// ----------------------------------------------------------
// COLORES (coherentes con el resto del sitio)
// ----------------------------------------------------------

const COLOR_PRINCIPAL = "#4a7bf7";
const COLOR_SECUNDARIO = "#f7c948";
const COLOR_REJILLA = "rgba(255,255,255,.12)";
const COLOR_TEXTO = "#dbe4ef";

// Si Chart.js no llegó a cargar (red lenta, CDN caída…) seguimos sin
// romper el resto de la pantalla: los filtros funcionan igual, solo
// no se podrán dibujar gráficas.
if (typeof Chart !== "undefined") {

    Chart.defaults.color = COLOR_TEXTO;
    Chart.defaults.borderColor = COLOR_REJILLA;
    Chart.defaults.font.family = "inherit";

}

// ----------------------------------------------------------
// GENERAR GRÁFICAS
// ----------------------------------------------------------

function generarGraficas() {

    if (registrosGrafica.length === 0) return;

    const variableId = document.getElementById("graficaVariable").value;
    const indicadorId = document.getElementById("graficaIndicador").value;
    const periodoId = document.getElementById("graficaPeriodo").value;

    if (typeof registrarEvento === "function") {
        registrarEvento("grafica-generada", `${variableId} / ${indicadorId}`);
    }

    const fechaInicio = document.getElementById("graficaFechaInicio").value;
    const fechaFin = document.getElementById("graficaFechaFin").value;

    const rangoPrevio = calcularRangoPeriodo(periodoId, registrosGrafica, fechaInicio, fechaFin);

    const granularidadElegida = document.getElementById("graficaGranularidad").value;

    let granularidad = granularidadElegida === "auto"
        ? granularidadAutomatica(periodoId, rangoPrevio)
        : granularidadElegida;

    // Algunos indicadores (p. ej. "Olas de calor", que necesita ver
    // varios días seguidos) solo admiten ciertas granularidades. Si la
    // elegida (automática o manual) no vale para este indicador, usamos
    // la más grande que sí admita.
    const indicadorSeleccionado = INDICADORES_CONSULTA[variableId].find(i => i.id === indicadorId);

    if (!indicadorSeleccionado.granularidades.includes(granularidad)) {
        granularidad = indicadorSeleccionado.granularidades[indicadorSeleccionado.granularidades.length - 1];
    }

    const resultado = ejecutarConsultaAvanzada(registrosGrafica, {
        variableId, indicadorId, granularidad, periodoId, fechaInicio, fechaFin
    });

    let filasLinea = resultado.filas;
    let esAcumulado = indicadorId === "acumulado";

    if (esAcumulado) {
        filasLinea = acumularProgresivo(filasLinea);
    }

    // --- Periodo comparativo ---

    const tipoComparativo = document.getElementById("graficaComparativo").value;
    const hayComparativa = tipoComparativo !== "ninguno";

    let rangoComparativo = null;
    let filasComparativas = [];
    let avisoComparativaTexto = null;

    if (hayComparativa) {

        if (tipoComparativo === "personalizado") {

            rangoComparativo = {
                inicio: document.getElementById("graficaComparativoInicio").value || resultado.rango.inicio,
                fin: document.getElementById("graficaComparativoFin").value || resultado.rango.fin
            };

        } else {

            rangoComparativo = calcularPeriodoAnterior(resultado.rango);

        }

        const resultadoComparativo = ejecutarConsultaAvanzada(registrosGrafica, {
            variableId, indicadorId,
            granularidad,
            periodoId: "personalizado",
            fechaInicio: rangoComparativo.inicio,
            fechaFin: rangoComparativo.fin
        });

        filasComparativas = resultadoComparativo.filas;

        if (esAcumulado) {
            filasComparativas = acumularProgresivo(filasComparativas);
        }

        // La estación puede no tener aún datos tan atrás como pide el
        // periodo comparativo (p. ej. "año anterior equivalente" con
        // menos de 2 años de histórico). Avisamos en vez de enseñar
        // una comparativa incompleta sin explicación.
        const fechaMinimaDatos = registrosGrafica.reduce(
            (minima, r) => (r.fecha < minima ? r.fecha : minima),
            registrosGrafica[0].fecha
        );

        if (rangoComparativo.fin < fechaMinimaDatos) {

            avisoComparativaTexto =
                `No hay datos para el periodo comparativo (${rangoComparativo.inicio} → ${rangoComparativo.fin}): ` +
                `tu estación empieza a registrar el ${fechaMinimaDatos}.`;

        } else if (rangoComparativo.inicio < fechaMinimaDatos) {

            avisoComparativaTexto =
                `El periodo comparativo (${rangoComparativo.inicio} → ${rangoComparativo.fin}) solo se solapa ` +
                `parcialmente con los datos disponibles (desde el ${fechaMinimaDatos}), así que esta comparación es incompleta.`;

        }

    }

    document.getElementById("avisoComparativa").hidden = !avisoComparativaTexto;
    document.getElementById("avisoComparativa").textContent = avisoComparativaTexto || "";

    document.getElementById("avisoComparativaTabla").hidden = !avisoComparativaTexto;
    document.getElementById("avisoComparativaTabla").textContent = avisoComparativaTexto || "";

    // Guardamos para poder repintar la tabla al cambiar de vista
    ultimoIndicador = resultado.indicador;
    ultimasFilasPrimario = filasLinea;
    ultimasFilasComparativo = filasComparativas;
    ultimaVariableId = variableId;
    ultimaHayComparativa = hayComparativa;

    if (variableId === "viento") {

        ultimaRosaVientos = calcularRosaVientos(registrosGrafica, resultado.rango);
        ultimaRosaVientosComparativo = hayComparativa
            ? calcularRosaVientos(registrosGrafica, rangoComparativo)
            : null;

    } else {

        ultimaRosaVientos = null;
        ultimaRosaVientosComparativo = null;

    }

    // Muestras de velocidad de viento del periodo actual, para el
    // ajuste de Weibull (siempre sobre el periodo principal, no el comparativo)
    let muestrasViento = [];

    if (variableId === "viento") {

        muestrasViento = registrosGrafica
            .filter(r => r.fecha >= resultado.rango.inicio && r.fecha <= resultado.rango.fin)
            .map(r => r.viento);

    }

    pintarTablaGrafica(resultado.indicador, filasLinea, filasComparativas, hayComparativa);

    if (variableId === "viento") {

        document.getElementById("bloqueTablaRosaVientos").hidden = false;

        pintarTablaRosaVientos(ultimaRosaVientos, ultimaRosaVientosComparativo, hayComparativa);

        document.getElementById("bloqueTablaWeibull").hidden = false;

        pintarTablaWeibull(muestrasViento);

    } else {

        document.getElementById("bloqueTablaRosaVientos").hidden = true;
        document.getElementById("bloqueTablaWeibull").hidden = true;

    }

    const esDireccion = variableId === "viento" && indicadorId === "direccion";

    if (typeof Chart === "undefined") {

        document.getElementById("tituloGraficaLinea").textContent =
            "No se ha podido cargar la librería de gráficas — mostrando la tabla";

        mostrarVista("tabla");

        return;

    }

    document.getElementById("bloqueTendenciaGrafica").hidden = esDireccion;

    if (!esDireccion) {
        pintarGraficaLinea(resultado.indicador, filasLinea, esAcumulado);
    }

    document.getElementById("bloqueComparativaGrafica").hidden = !hayComparativa || esDireccion;

    if (hayComparativa && !esDireccion) {
        pintarGraficaComparativa(resultado.indicador, filasLinea, filasComparativas, esAcumulado);
    }

    if (variableId === "viento") {

        document.getElementById("bloqueRosaVientos").hidden = false;

        document.querySelector("#bloqueRosaVientos .tituloSeccionGrafica").textContent =
            esDireccion ? "Rosa de los vientos" : "Rosa de los vientos (contexto)";

        pintarRosaVientos(ultimaRosaVientos, ultimaRosaVientosComparativo);

        document.getElementById("bloqueWeibull").hidden = false;

        pintarWeibull(muestrasViento);

    } else {

        document.getElementById("bloqueRosaVientos").hidden = true;
        document.getElementById("bloqueWeibull").hidden = true;

    }

}

// ----------------------------------------------------------
// PINTAR CON CHART.JS
// ----------------------------------------------------------

function pintarGraficaLinea(indicador, filas, esAcumulado) {

    const titulo = document.getElementById("tituloGraficaLinea");

    titulo.textContent = esAcumulado
        ? `${indicador.nombre} acumulada`
        : `Tendencia — ${indicador.nombre}`;

    const ctx = document.getElementById("canvasLinea");

    if (chartLinea) chartLinea.destroy();

    chartLinea = new Chart(ctx, {
        type: "line",
        data: {
            labels: filas.map(f => f.etiqueta),
            datasets: [{
                label: `${indicador.nombre}${indicador.unidad ? " (" + indicador.unidad + ")" : ""}`,
                data: filas.map(f => f.valor),
                borderColor: COLOR_PRINCIPAL,
                backgroundColor: "rgba(74,123,247,.18)",
                fill: true,
                tension: .3,
                pointRadius: filas.length > 60 ? 0 : 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { color: COLOR_REJILLA } },
                y: { grid: { color: COLOR_REJILLA } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

}

function pintarGraficaComparativa(indicador, filasPrimario, filasComparativo, esAcumulado) {

    const ctx = document.getElementById("canvasComparativa");

    if (chartComparativa) chartComparativa.destroy();

    const longitud = Math.max(filasPrimario.length, filasComparativo.length);
    const etiquetas = Array.from({ length: longitud }, (_, i) => `${i + 1}`);

    const puntos = longitud > 40 ? 0 : 3;

    chartComparativa = new Chart(ctx, {
        type: "line",
        data: {
            labels: etiquetas,
            datasets: [
                {
                    label: "Periodo actual",
                    data: filasPrimario.map(f => f.valor),
                    borderColor: COLOR_PRINCIPAL,
                    backgroundColor: "rgba(74,123,247,.15)",
                    fill: true,
                    tension: .3,
                    pointRadius: puntos
                },
                {
                    label: "Periodo comparativo",
                    data: filasComparativo.map(f => f.valor),
                    borderColor: COLOR_SECUNDARIO,
                    backgroundColor: "rgba(247,201,72,.1)",
                    borderDash: [6, 4],
                    fill: true,
                    tension: .3,
                    pointRadius: puntos
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { color: COLOR_REJILLA },
                    title: { display: true, text: "Posición dentro del periodo", color: COLOR_TEXTO }
                },
                y: { grid: { color: COLOR_REJILLA } }
            },
            plugins: {
                legend: { display: true, labels: { color: COLOR_TEXTO } }
            }
        }
    });

}

function pintarRosaVientos(conteoPrimario, conteoComparativo) {

    const ctx = document.getElementById("canvasRosaVientos");

    if (chartRosaVientos) chartRosaVientos.destroy();

    const puntos = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];

    const datasets = [{
        label: conteoComparativo ? "Periodo actual" : "Registros",
        data: puntos.map(p => conteoPrimario[p]),
        borderColor: COLOR_PRINCIPAL,
        backgroundColor: "rgba(74,123,247,.25)",
        pointBackgroundColor: COLOR_PRINCIPAL
    }];

    if (conteoComparativo) {

        datasets.push({
            label: "Periodo comparativo",
            data: puntos.map(p => conteoComparativo[p]),
            borderColor: COLOR_SECUNDARIO,
            backgroundColor: "rgba(247,201,72,.15)",
            pointBackgroundColor: COLOR_SECUNDARIO,
            borderDash: [6, 4]
        });

    }

    chartRosaVientos = new Chart(ctx, {
        type: "radar",
        data: {
            labels: puntos,
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    grid: { color: COLOR_REJILLA },
                    angleLines: { color: COLOR_REJILLA },
                    pointLabels: { color: COLOR_TEXTO },
                    ticks: { color: COLOR_TEXTO, backdropColor: "transparent" }
                }
            },
            plugins: {
                legend: { display: true, labels: { color: COLOR_TEXTO } }
            }
        }
    });

}

function pintarWeibull(muestras) {

    const bloque = document.getElementById("bloqueWeibull");
    const info = document.getElementById("infoWeibull");

    const ajuste = ajustarWeibull(muestras);

    if (!ajuste) {

        if (chartWeibull) {
            chartWeibull.destroy();
            chartWeibull = null;
        }

        info.textContent = "No hay datos suficientes en este periodo para ajustar una distribución de Weibull.";

        return;

    }

    const numBins = 15;
    const { bins, anchoBin } = calcularHistograma(ajuste.muestras, numBins);
    const total = ajuste.muestras.length;

    const etiquetas = bins.map(b => `${b.inicio.toFixed(1)}–${b.fin.toFixed(1)}`);
    const densidadObservada = bins.map(b => b.cuenta / total / anchoBin);
    const densidadTeorica = bins.map(b => densidadWeibull((b.inicio + b.fin) / 2, ajuste.k, ajuste.c));

    if (chartWeibull) chartWeibull.destroy();

    chartWeibull = new Chart(document.getElementById("canvasWeibull"), {
        data: {
            labels: etiquetas,
            datasets: [
                {
                    type: "bar",
                    label: "Observado",
                    data: densidadObservada,
                    backgroundColor: "rgba(74,123,247,.45)"
                },
                {
                    type: "line",
                    label: "Ajuste Weibull",
                    data: densidadTeorica,
                    borderColor: COLOR_SECUNDARIO,
                    backgroundColor: "transparent",
                    tension: .35,
                    pointRadius: 0,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { color: COLOR_REJILLA },
                    title: { display: true, text: "Velocidad de viento (km/h)", color: COLOR_TEXTO }
                },
                y: {
                    grid: { color: COLOR_REJILLA },
                    title: { display: true, text: "Densidad de probabilidad", color: COLOR_TEXTO }
                }
            },
            plugins: {
                legend: { display: true, labels: { color: COLOR_TEXTO } }
            }
        }
    });

    info.textContent =
        `Ajuste por método de los momentos — forma (k) = ${ajuste.k.toFixed(2)}, escala (c) = ${ajuste.c.toFixed(2)} km/h. ` +
        `Velocidad media observada: ${ajuste.media.toFixed(1)} km/h (${total} lecturas).`;

}

function pintarTablaWeibull(muestras) {

    const info = document.getElementById("infoTablaWeibull");
    const cuerpo = document.getElementById("cuerpoTablaWeibull");

    cuerpo.innerHTML = "";

    const ajuste = ajustarWeibull(muestras);

    if (!ajuste) {

        info.textContent = "No hay datos suficientes en este periodo para ajustar una distribución de Weibull.";

        return;

    }

    const numBins = 15;
    const { bins, anchoBin } = calcularHistograma(ajuste.muestras, numBins);
    const total = ajuste.muestras.length;

    for (const bin of bins) {

        const densidadObservada = bin.cuenta / total / anchoBin;
        const densidadTeorica = densidadWeibull((bin.inicio + bin.fin) / 2, ajuste.k, ajuste.c);

        const tr = document.createElement("tr");

        const tdIntervalo = document.createElement("td");
        tdIntervalo.textContent = `${bin.inicio.toFixed(1)}–${bin.fin.toFixed(1)}`;

        const tdObservado = document.createElement("td");
        tdObservado.textContent = densidadObservada.toFixed(4);

        const tdTeorico = document.createElement("td");
        tdTeorico.textContent = densidadTeorica.toFixed(4);

        tr.appendChild(tdIntervalo);
        tr.appendChild(tdObservado);
        tr.appendChild(tdTeorico);

        cuerpo.appendChild(tr);

    }

    info.textContent =
        `Ajuste por método de los momentos — forma (k) = ${ajuste.k.toFixed(2)}, escala (c) = ${ajuste.c.toFixed(2)} km/h. ` +
        `Velocidad media observada: ${ajuste.media.toFixed(1)} km/h (${total} lecturas).`;

}

// ----------------------------------------------------------
// TABLA (vista alternativa a la gráfica)
// ----------------------------------------------------------

function pintarTablaGrafica(indicador, filasPrimario, filasComparativo, hayComparativa) {

    document.getElementById("cabeceraTablaGraficaActual").textContent =
        indicador.unidad ? `Periodo actual (${indicador.unidad})` : "Periodo actual";

    document.getElementById("cabeceraTablaGraficaComparativo").textContent =
        indicador.unidad ? `Periodo comparativo (${indicador.unidad})` : "Periodo comparativo";

    document.getElementById("cabeceraTablaGraficaComparativo").hidden = !hayComparativa;

    const cuerpo = document.getElementById("cuerpoTablaGrafica");

    cuerpo.innerHTML = "";

    const longitud = Math.max(filasPrimario.length, filasComparativo.length);

    for (let i = 0; i < longitud; i++) {

        const filaActual = filasPrimario[i];
        const filaComparativa = filasComparativo[i];

        const tr = document.createElement("tr");

        const tdPosicion = document.createElement("td");
        tdPosicion.textContent = filaActual ? filaActual.etiqueta : `${i + 1}`;

        const tdActual = document.createElement("td");
        tdActual.textContent = filaActual ? formatearValorGrafica(filaActual.valor) : "—";

        tr.appendChild(tdPosicion);
        tr.appendChild(tdActual);

        if (hayComparativa) {

            const tdComparativo = document.createElement("td");
            tdComparativo.textContent = filaComparativa ? formatearValorGrafica(filaComparativa.valor) : "—";

            tr.appendChild(tdComparativo);

        }

        cuerpo.appendChild(tr);

    }

}

function pintarTablaRosaVientos(conteoPrimario, conteoComparativo, hayComparativa) {

    const puntos = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];

    const cuerpo = document.getElementById("cuerpoTablaRosaVientos");

    cuerpo.innerHTML = "";

    document.getElementById("cabeceraTablaRosaComparativo").hidden = !hayComparativa;

    for (const punto of puntos) {

        const tr = document.createElement("tr");

        const tdPunto = document.createElement("td");
        tdPunto.textContent = punto;

        const tdActual = document.createElement("td");
        tdActual.textContent = conteoPrimario[punto];

        tr.appendChild(tdPunto);
        tr.appendChild(tdActual);

        if (hayComparativa) {

            const tdComparativo = document.createElement("td");
            tdComparativo.textContent = conteoComparativo[punto];

            tr.appendChild(tdComparativo);

        }

        cuerpo.appendChild(tr);

    }

}

function formatearValorGrafica(valor) {

    if (valor === null || valor === undefined) return "—";

    if (typeof valor === "string") return valor;

    const decimales = Number.isInteger(valor) ? 0 : 1;

    return valor.toLocaleString("es-ES", {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
    });

}

// ----------------------------------------------------------
// SELECTOR DE VISTA: GRÁFICA / TABLA
// ----------------------------------------------------------

function mostrarVista(vista) {

    const esTabla = vista === "tabla";

    document.getElementById("vistaGrafica").hidden = esTabla;
    document.getElementById("vistaTabla").hidden = !esTabla;

    document.getElementById("btnVistaGrafica").classList.toggle("activo", !esTabla);
    document.getElementById("btnVistaTabla").classList.toggle("activo", esTabla);

}

document.getElementById("btnVistaGrafica").addEventListener("click", () => mostrarVista("grafica"));
document.getElementById("btnVistaTabla").addEventListener("click", () => mostrarVista("tabla"));

// ----------------------------------------------------------
// EVENTOS
// ----------------------------------------------------------

poblarVariablesGrafica();
actualizarIndicadoresGrafica();

document.getElementById("graficaVariable").addEventListener("change", actualizarIndicadoresGrafica);

document.getElementById("graficaPeriodo").addEventListener("change", () => {

    const esPersonalizado = document.getElementById("graficaPeriodo").value === "personalizado";

    document.getElementById("graficaFechasPersonalizadas").hidden = !esPersonalizado;

});

document.getElementById("graficaComparativo").addEventListener("change", () => {

    const esPersonalizado = document.getElementById("graficaComparativo").value === "personalizado";

    document.getElementById("graficaComparativoFechas").hidden = !esPersonalizado;

});

document.getElementById("btnGenerarGrafica").addEventListener("click", generarGraficas);
