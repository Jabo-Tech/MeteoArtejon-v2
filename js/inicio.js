function cargarInicio(registros) {

    cargarTemperaturaMaxima(registros);
    cargarTemperaturaMinima(registros);
    cargarAmplitudMaxima(registros);
    cargarMayorRacha(registros);
    cargarDiasSinLluvia(registros);
    cargarDiasLloviendo(registros);
    cargarMayorRadiacion(registros);
    cargarDireccionPredominante(registros);

    cargarTemperaturaMaximaAnual(registros);
    cargarTemperaturaMinimaAnual(registros);
    cargarAmplitudMaximaAnual(registros);
    cargarMayorRachaAnual(registros);
    cargarDireccionPredominanteAnual(registros);
    cargarDiasSinLluviaActual(registros);
    cargarDiasLloviendoActual(registros);
    cargarMayorRadiacionAnual(registros);

    curiosidades = obtenerCuriosidades(registros);

    paginaCuriosidades = 0;

    mostrarCuriosidades();

}

// ======================================
// FLIP DE TARJETAS (toca para ver el dato del año / racha actual)
// ======================================

document.querySelectorAll(".tarjeta").forEach(tarjeta => {

    tarjeta.addEventListener("click", () => {
        tarjeta.classList.toggle("girada");
    });

});

// ======================================
// TEMPERATURA MÁXIMA
// ======================================

function cargarTemperaturaMaxima(registros) {

    const dato = obtenerTemperaturaMaximaAbsoluta(registros);

    document.getElementById("tempMaxValor").textContent =
        `${dato.valor.toFixed(1)} °C`;

    document.getElementById("tempMaxFecha").textContent =
        `${dato.fecha} · ${dato.hora}`;

}

// ======================================
// TEMPERATURA MÍNIMA
// ======================================

function cargarTemperaturaMinima(registros) {

    const dato = obtenerTemperaturaMinimaAbsoluta(registros);

    document.getElementById("tempMinValor").textContent =
        `${dato.valor.toFixed(1)} °C`;

    document.getElementById("tempMinFecha").textContent =
        `${dato.fecha} · ${dato.hora}`;

}

// ======================================
// AMPLITUD TÉRMICA
// ======================================

function cargarAmplitudMaxima(registros) {

    const dato = obtenerMaximaAmplitudTermica(registros);

    document.getElementById("amplitudValor").textContent =
        `${dato.valor.toFixed(1)} °C`;

    document.getElementById("amplitudFecha").textContent =
        dato.fecha;

}

// ======================================
// MAYOR RACHA
// ======================================

function cargarMayorRacha(registros) {

    const dato = obtenerRachaMaximaViento(registros);

    document.getElementById("rachaValor").textContent =
        `${dato.valor.toFixed(1)} km/h`;

    document.getElementById("rachaFecha").textContent =
        `${dato.fecha} · ${dato.hora}`;

}

// ======================================
// DÍAS SIN LLOVER
// ======================================

function cargarDiasSinLluvia(registros) {

    const dato = obtenerMayorRachaDiasSinLlover(registros);

    document.getElementById("sinLluviaValor").textContent =
        `${dato.valor} días`;

    document.getElementById("sinLluviaFecha").textContent =
        `${dato.inicio} → ${dato.fin}`;

}

// ======================================
// DÍAS LLOVIENDO
// ======================================

function cargarDiasLloviendo(registros) {

    const dato = obtenerMayorRachaDiasLloviendo(registros);

    document.getElementById("lluviaValor").textContent =
        `${dato.valor} días`;

    document.getElementById("lluviaFecha").textContent =
        `${dato.inicio} → ${dato.fin}`;

}

// ======================================
// RADIACIÓN
// ======================================

function cargarMayorRadiacion(registros) {

    const dato = obtenerMaximaRadiacionDiaria(registros);

    document.getElementById("radiacionValor").textContent =
        `${dato.valor} Wh/m²`;

    document.getElementById("radiacionFecha").textContent =
        dato.fecha;

}
function cargarDireccionPredominante(registros) {

    const dato = obtenerDireccionPredominante(registros);

    document.getElementById("direccionValor").textContent =
        `${dato.valor} (${obtenerNombreDireccion(dato.valor)})`;

    document.getElementById("direccionDetalle").textContent =
        `${dato.porcentaje} % de los registros`;

}
let curiosidades = [];

let paginaCuriosidades = 0;

function esMovil() {

    return window.matchMedia("(max-width: 768px)").matches;

}

function obtenerPorPagina() {

    return esMovil() ? 2 : 4;

}

function mostrarCuriosidades() {

    const porPagina = obtenerPorPagina();
    const totalPaginas = Math.ceil(curiosidades.length / porPagina);

    // Si venimos de cambiar de tamaño de pantalla, recolocamos la página
    // dentro de rango en vez de dejarla apuntando a un hueco vacío.
    if (paginaCuriosidades >= totalPaginas) {
        paginaCuriosidades = 0;
    }

    for (let i = 0; i < 4; i++) {

        const tarjeta = document.getElementById(`curiosidad${i + 1}`) ||
            document.querySelectorAll(".curiosidad")[i];

        if (i >= porPagina) {

            tarjeta.classList.add("oculta");
            continue;

        }

        tarjeta.classList.remove("oculta");

        const indice = (paginaCuriosidades * porPagina + i) % curiosidades.length;

        pintarCuriosidad(i + 1, curiosidades[indice]);

    }

    document.getElementById("indicadorPaginaCuriosidades").textContent =
        `(${paginaCuriosidades + 1}/${totalPaginas})`;

    // Al cambiar de página, las tarjetas vuelven a su cara delantera
    document.querySelectorAll(".curiosidad.girada").forEach(tarjeta => {
        tarjeta.classList.remove("girada");
    });

}

function pintarCuriosidad(numero, curiosidad) {

    document.getElementById(`iconoCuriosidad${numero}`).textContent =
        curiosidad.icono;

    document.getElementById(`tituloCuriosidad${numero}`).textContent =
        curiosidad.titulo;

    document.getElementById(`valorCuriosidad${numero}`).textContent =
        curiosidad.valor;

    document.getElementById(`detalleCuriosidad${numero}`).textContent =
        curiosidad.detalle;

    document.getElementById(`iconoCuriosidad${numero}Actual`).textContent =
        curiosidad.iconoActual;

    document.getElementById(`tituloCuriosidad${numero}Actual`).textContent =
        curiosidad.tituloActual;

    document.getElementById(`valorCuriosidad${numero}Actual`).textContent =
        curiosidad.valorActual;

    document.getElementById(`detalleCuriosidad${numero}Actual`).textContent =
        curiosidad.detalleActual;

}

document.querySelectorAll(".curiosidad").forEach(tarjeta => {

    tarjeta.addEventListener("click", () => {
        tarjeta.classList.toggle("girada");
    });

});
document.getElementById("btnCuriosidadSiguiente").addEventListener("click", () => {

    const porPagina = obtenerPorPagina();
    const totalPaginas = Math.ceil(curiosidades.length / porPagina);

    paginaCuriosidades++;

    if (paginaCuriosidades >= totalPaginas) {
        paginaCuriosidades = 0;
    }

    mostrarCuriosidades();

});

document.getElementById("btnCuriosidadAnterior").addEventListener("click", () => {

    const porPagina = obtenerPorPagina();
    const totalPaginas = Math.ceil(curiosidades.length / porPagina);

    paginaCuriosidades--;

    if (paginaCuriosidades < 0) {
        paginaCuriosidades = totalPaginas - 1;
    }

    mostrarCuriosidades();

});

let temporizadorRedimension;

window.addEventListener("resize", () => {

    clearTimeout(temporizadorRedimension);

    temporizadorRedimension = setTimeout(() => {

        if (curiosidades.length > 0) {
            mostrarCuriosidades();
        }

    }, 200);

});
// ======================================
// CARAS TRASERAS: DATOS DEL AÑO EN CURSO
// ======================================

function cargarTemperaturaMaximaAnual(registros) {

    const dato = obtenerTemperaturaMaximaAñoActual(registros);

    document.getElementById("tempMaxValorAnual").textContent =
        `${dato.valor.toFixed(1)} °C`;

    document.getElementById("tempMaxFechaAnual").textContent =
        `${dato.fecha} · ${dato.hora}`;

}

function cargarTemperaturaMinimaAnual(registros) {

    const dato = obtenerTemperaturaMinimaAñoActual(registros);

    document.getElementById("tempMinValorAnual").textContent =
        `${dato.valor.toFixed(1)} °C`;

    document.getElementById("tempMinFechaAnual").textContent =
        `${dato.fecha} · ${dato.hora}`;

}

function cargarAmplitudMaximaAnual(registros) {

    const dato = obtenerMaximaAmplitudTermicaAñoActual(registros);

    document.getElementById("amplitudValorAnual").textContent =
        `${dato.valor.toFixed(1)} °C`;

    document.getElementById("amplitudFechaAnual").textContent =
        dato.fecha;

}

function cargarMayorRachaAnual(registros) {

    const dato = obtenerRachaMaximaVientoAñoActual(registros);

    document.getElementById("rachaValorAnual").textContent =
        `${dato.valor.toFixed(1)} km/h`;

    document.getElementById("rachaFechaAnual").textContent =
        `${dato.fecha} · ${dato.hora}`;

}

function cargarDireccionPredominanteAnual(registros) {

    const dato = obtenerDireccionPredominanteAñoActual(registros);

    document.getElementById("direccionValorAnual").textContent =
        `${dato.valor} (${obtenerNombreDireccion(dato.valor)})`;

    document.getElementById("direccionDetalleAnual").textContent =
        `${dato.porcentaje} % de los registros`;

}

function cargarMayorRadiacionAnual(registros) {

    const dato = obtenerMaximaRadiacionDiariaAñoActual(registros);

    document.getElementById("radiacionValorAnual").textContent =
        `${dato.valor} Wh/m²`;

    document.getElementById("radiacionFechaAnual").textContent =
        dato.fecha;

}

// ======================================
// CARAS TRASERAS: RACHAS EN CURSO
// ======================================

function cargarDiasSinLluviaActual(registros) {

    const dato = obtenerRachaActualDiasSinLlover(registros);

    document.getElementById("sinLluviaValorActual").textContent =
        `${dato.valor} días`;

    document.getElementById("sinLluviaFechaActual").textContent =
        dato.inicio ? `Desde el ${dato.inicio}` : "--";

}

function cargarDiasLloviendoActual(registros) {

    const dato = obtenerRachaActualDiasLloviendo(registros);

    document.getElementById("lluviaValorActual").textContent =
        `${dato.valor} días`;

    document.getElementById("lluviaFechaActual").textContent =
        dato.inicio ? `Desde el ${dato.inicio}` : "--";

}
