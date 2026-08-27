let registrosConsulta = [];

function cargarConsultas(registros) {

    registrosConsulta = registros;

}

function poblarSelectVariables() {

    const select = document.getElementById("filtroVariable");

    for (const variable of VARIABLES_CONSULTA) {

        const opcion = document.createElement("option");

        opcion.value = variable.id;
        opcion.textContent = `${variable.icono} ${variable.nombre}`;

        select.appendChild(opcion);

    }

}

function actualizarIndicadores() {

    const variableId = document.getElementById("filtroVariable").value;
    const select = document.getElementById("filtroIndicador");

    select.innerHTML = "";

    for (const indicador of INDICADORES_CONSULTA[variableId]) {

        const opcion = document.createElement("option");

        opcion.value = indicador.id;
        opcion.textContent = indicador.nombre;

        select.appendChild(opcion);

    }

}

function formatearValor(valor, unidad) {

    if (valor === null || valor === undefined) return "Sin datos";

    if (typeof valor === "string") return unidad ? `${valor} ${unidad}` : valor;

    const decimales = Number.isInteger(valor) ? 0 : 1;

    const numero = valor.toLocaleString("es-ES", {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
    });

    return unidad ? `${numero} ${unidad}` : numero;

}

function pintarResultado(resultado) {

    const { indicador, rango, resumen, filas, fechaOcurrencia } = resultado;

    document.getElementById("resultadoEtiqueta").textContent = indicador.nombre;

    document.getElementById("resultadoValor").textContent =
        formatearValor(resumen.valor, resumen.unidad);

    document.getElementById("resultadoRango").textContent =
        filas.length > 0
            ? `${rango.inicio} → ${rango.fin}`
            : `${rango.inicio} → ${rango.fin} · sin datos en este periodo`;

    const elementoFecha = document.getElementById("resultadoFecha");

    if (fechaOcurrencia && fechaOcurrencia.inicio && fechaOcurrencia.fin) {

        elementoFecha.hidden = false;
        elementoFecha.textContent = fechaOcurrencia.inicio === fechaOcurrencia.fin
            ? `Ocurrió el ${fechaOcurrencia.inicio}`
            : `Del ${fechaOcurrencia.inicio} al ${fechaOcurrencia.fin}`;

    } else if (fechaOcurrencia && fechaOcurrencia.fecha) {

        elementoFecha.hidden = false;
        elementoFecha.textContent = fechaOcurrencia.hora
            ? `Ocurrió el ${fechaOcurrencia.fecha} · ${fechaOcurrencia.hora}`
            : `Ocurrió el ${fechaOcurrencia.fecha}`;

    } else {

        elementoFecha.hidden = true;

    }

}

// ======================================
// EVENTOS
// ======================================

poblarSelectVariables();
actualizarIndicadores();

document.getElementById("filtroVariable").addEventListener("change", actualizarIndicadores);

document.getElementById("filtroPeriodo").addEventListener("change", () => {

    const esPersonalizado = document.getElementById("filtroPeriodo").value === "personalizado";

    document.getElementById("fechasPersonalizadas").hidden = !esPersonalizado;

});

document.getElementById("btnConsultar").addEventListener("click", () => {

    if (registrosConsulta.length === 0) return;

    const variableId = document.getElementById("filtroVariable").value;
    const indicadorId = document.getElementById("filtroIndicador").value;

    const indicador = INDICADORES_CONSULTA[variableId].find(i => i.id === indicadorId);

    // Consultas solo enseña el dato global del periodo (sin desglose ni
    // selector de granularidad), así que usamos internamente el bucket
    // más grande disponible: es indiferente para el resultado en casi
    // todos los indicadores, y minimiza artefactos de corte en los que
    // sí dependen de la agrupación (p. ej. episodios de lluvia a caballo
    // entre dos días).
    const granularidad = indicador.granularidades.includes("mes")
        ? "mes"
        : indicador.granularidades[indicador.granularidades.length - 1];

    const opciones = {
        variableId,
        indicadorId,
        granularidad,
        periodoId: document.getElementById("filtroPeriodo").value,
        fechaInicio: document.getElementById("filtroFechaInicio").value,
        fechaFin: document.getElementById("filtroFechaFin").value
    };

    const resultado = ejecutarConsultaAvanzada(registrosConsulta, opciones);

    pintarResultado(resultado);

    if (typeof registrarEvento === "function") {
        registrarEvento("consulta-realizada", `${variableId} / ${indicadorId}`);
    }

});
