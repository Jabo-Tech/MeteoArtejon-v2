// ======================================
// PREDICCIÓN · PANTALLAS
// --------------------------------------
// Dibuja la tarjeta de la portada (hoy, mañana y pasado) y la
// pantalla "04 · Predicción" (7 días, tabla por horas, datos del día
// y auditoría predictiva). Los cálculos están en prediccion.js.
// ======================================

const predEstado = {
    resultado: null,       // última predicción calculada
    sesgos: null,          // sesgos en uso
    completa: null,        // calibración completa + auditoría
    diaSeleccionado: 0,
    periodoAuditoria: "anio",
    cargando: null
};

const PRED_DIAS_SEMANA = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const PRED_DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const PRED_MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const PRED_MESES_LARGOS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];


// ======================================
// ICONOS (SVG)
// ======================================

function predIcono(tipo, ancho = 56) {

    const sol = `<g stroke="#fbbf24" stroke-width="3" stroke-linecap="round"><line x1="22" y1="3" x2="22" y2="8"/><line x1="8" y1="17" x2="13" y2="17"/><line x1="12" y1="7" x2="15.5" y2="10.5"/><line x1="32" y1="7" x2="28.5" y2="10.5"/></g><circle cx="22" cy="18" r="8.5" fill="#fbbf24"/>`;
    const nube = (color = "#e5e7eb") => `<path d="M22 46h26a9 9 0 0 0 0-18 12 12 0 0 0-22.5 4A7 7 0 0 0 22 46z" fill="${color}"/>`;
    const nubeAlta = (color = "#e5e7eb") => `<path d="M17 32h30a10 10 0 0 0 0-20 13 13 0 0 0-24.5 4A8 8 0 0 0 17 32z" fill="${color}"/>`;
    const luna = `<path d="M30 4a14 14 0 1 0 12 20A11 11 0 0 1 30 4z" fill="#e5e7eb"/>`;

    const formas = {
        sol: `<g stroke="#fbbf24" stroke-width="3" stroke-linecap="round"><line x1="32" y1="2" x2="32" y2="8"/><line x1="32" y1="44" x2="32" y2="50"/><line x1="8" y1="26" x2="14" y2="26"/><line x1="50" y1="26" x2="56" y2="26"/><line x1="15" y1="9" x2="19" y2="13"/><line x1="45" y1="39" x2="49" y2="43"/><line x1="49" y1="9" x2="45" y2="13"/><line x1="19" y1="39" x2="15" y2="43"/></g><circle cx="32" cy="26" r="11" fill="#fbbf24"/>`,
        solnubes: sol + nube(),
        nubes: `<path d="M14 42h32a11 11 0 0 0 0-22 14 14 0 0 0-26.5 4.5A9 9 0 0 0 14 42z" fill="#cbd5e1"/>`,
        lluvia: nubeAlta() + `<g stroke="#60a5fa" stroke-width="3" stroke-linecap="round"><line x1="22" y1="38" x2="19" y2="46"/><line x1="32" y1="38" x2="29" y2="46"/><line x1="42" y1="38" x2="39" y2="46"/></g>`,
        nieve: nubeAlta() + `<g fill="#ffffff"><circle cx="21" cy="41" r="2.6"/><circle cx="32" cy="45" r="2.6"/><circle cx="43" cy="41" r="2.6"/></g>`,
        tormenta: nubeAlta("#94a3b8") + `<path d="M33 33l-7 10h6l-3 8 9-12h-6l3-6z" fill="#fde047"/>`,
        niebla: `<g stroke="#cbd5e1" stroke-width="3.5" stroke-linecap="round"><line x1="10" y1="18" x2="54" y2="18"/><line x1="6" y1="27" x2="48" y2="27"/><line x1="14" y1="36" x2="58" y2="36"/><line x1="10" y1="45" x2="44" y2="45"/></g>`,
        luna: luna,
        lunanubes: luna + nube("#94a3b8")
    };

    const alto = Math.round(ancho * 52 / 64);

    return `<svg width="${ancho}" height="${alto}" viewBox="0 0 64 52" aria-hidden="true">${formas[tipo] || formas.solnubes}</svg>`;

}

const PRED_NOMBRES_CIELO = {
    sol: "Despejado", solnubes: "Sol y nubes", nubes: "Nublado", lluvia: "Lluvia",
    nieve: "Nieve", tormenta: "Tormenta", niebla: "Niebla", luna: "Despejado", lunanubes: "Nubes"
};

function predFlecha(grados, tam = 18) {

    // La flecha apunta hacia donde sopla el viento (de donde viene + 180°)
    return `<svg width="${tam}" height="${tam}" viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(${Math.round(grados + 180)} 12 12)"><path d="M12 3l5.5 11-5.5-3-5.5 3z" fill="#ffffff"/></g></svg>`;

}

const PRED_ICONO_GOTA = `<svg width="16" height="18" viewBox="0 0 20 22" aria-hidden="true"><path d="M10 2C10 2 3 10 3 14a7 7 0 0 0 14 0C17 10 10 2 10 2z" fill="#60a5fa"/></svg>`;
const PRED_ICONO_VIENTO = `<svg width="20" height="18" viewBox="0 0 24 22" fill="none" stroke="#93c5fd" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2 8h13a3 3 0 1 0-3-3"/><path d="M2 13h18a3 3 0 1 1-3 3"/><path d="M2 18h8"/></svg>`;
const PRED_ICONO_SOL = `<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="#fbbf24"/><g stroke="#fbbf24" stroke-width="2" stroke-linecap="round"><line x1="12" y1="1.5" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22.5"/><line x1="1.5" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22.5" y2="12"/></g></svg>`;
const PRED_ICONO_AVISO = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l9.5 17h-19z"/><line x1="12" y1="10" x2="12" y2="14"/></svg>`;


// ======================================
// FORMATOS
// ======================================

function predFecha(fechaTexto) {

    const f = new Date(`${fechaTexto}T12:00:00Z`);

    return {
        corto: PRED_DIAS_SEMANA[f.getUTCDay()],
        largo: PRED_DIAS_LARGOS[f.getUTCDay()],
        dia: f.getUTCDate(),
        mes: PRED_MESES[f.getUTCMonth()],
        mesLargo: PRED_MESES_LARGOS[f.getUTCMonth()],
        anio: f.getUTCFullYear()
    };

}

function predNombreDia(posicion, fechaTexto) {

    if (posicion === 0) return "Hoy";
    if (posicion === 1) return "Mañana";

    const f = predFecha(fechaTexto);

    return f.corto.charAt(0) + f.corto.slice(1).toLowerCase();

}

function predColorTemperatura(t) {

    const c = Math.max(-5, Math.min(30, t));
    const tono = Math.round(230 - (c + 5) * (230 / 35));
    const claro = tono > 35 && tono < 110;

    return {
        fondo: `hsl(${tono}, 70%, ${claro ? 52 : 40}%)`,
        texto: claro ? "#111827" : "#ffffff"
    };

}

function predAvisosHtml(avisos) {

    return avisos.slice(0, 2)
        .map(a => `<span class="predAviso">${PRED_ICONO_AVISO}${a}</span>`)
        .join("");

}

function predFiabilidadHtml(nivel) {

    const texto = ["", "baja", "media", "alta"][nivel];
    const barras = [1, 2, 3].map(n => `<span class="${n <= nivel ? "activa" : ""}"></span>`).join("");

    return `<span class="predFiabilidad" title="Fiabilidad ${texto}"><span class="predBarras" aria-hidden="true">${barras}</span>Fiabilidad <strong>${texto}</strong></span>`;

}


// ======================================
// CARGA (compartida por portada y pantalla)
// ======================================

async function predCargar(registros) {

    if (predEstado.resultado && (Date.now() - predEstado.resultado.generado) < 30 * 60 * 1000) {
        return predEstado.resultado;
    }

    if (predEstado.cargando) return predEstado.cargando;

    predEstado.cargando = (async () => {

        const estacion = predDiasEstacion(registros);

        let sesgos = null;

        try {
            const cache = predLeerCache();
            sesgos = (cache && cache.completa) ? cache.completa.sesgos : await predCalibracionRapida(estacion);
        } catch (error) {
            console.warn("Calibración no disponible, se usan los sesgos por defecto", error);
        }

        predEstado.sesgos = sesgos;
        predEstado.resultado = await obtenerPrediccion(sesgos);

        return predEstado.resultado;

    })();

    try {
        return await predEstado.cargando;
    } finally {
        predEstado.cargando = null;
    }

}


// ======================================
// PORTADA: HOY, MAÑANA Y PASADO
// ======================================

async function cargarPrediccionPortada(registros) {

    const contenedor = document.getElementById("predPortadaDias");

    if (!contenedor) return;

    contenedor.innerHTML = `<p class="predCargando">Cargando la previsión…</p>`;

    try {

        const { dias } = await predCargar(registros);

        contenedor.innerHTML = dias.slice(0, 3).map((d, i) => {

            const f = predFecha(d.fecha);
            const letras = predLetrasDireccion(d.direccion);

            return `
                <article class="predDiaPortada">
                    <div class="predDiaNombre">${["Hoy", "Mañana", "Pasado"][i]}</div>
                    <div class="predDiaFecha">${f.corto.toLowerCase()} ${f.dia} ${f.mes}</div>
                    <div class="predDiaIcono" role="img" aria-label="${PRED_NOMBRES_CIELO[d.tipo]}">${predIcono(d.tipo, 60)}</div>
                    <div class="predTemperaturas"><span class="max">${predTextoTemperatura(d.tx)}</span><span class="min"> / ${predTextoTemperatura(d.tn)}</span></div>
                    ${d.avisos.length ? `<div class="predAvisos">${predAvisosHtml(d.avisos)}</div>` : ""}
                    <div class="predStats">
                        <div class="predStat predStatLluvia">${PRED_ICONO_GOTA}<strong>${predTextoProbabilidad(d.probabilidad)}</strong><span>${predTextoLitros(d, i)}</span><em>Lluvia</em></div>
                        <div class="predStat">${PRED_ICONO_VIENTO}<strong>${Math.round(d.viento)} km/h</strong><span>rachas ${Math.round(d.racha)}</span><em>Viento</em></div>
                        <div class="predStat">${predFlecha(d.direccion, 20)}<strong>${letras}</strong><span>${predNombreDireccion(letras)}</span><em>Dirección</em></div>
                    </div>
                </article>`;

        }).join("");

    } catch (error) {

        console.error(error);
        contenedor.innerHTML = `<p class="predCargando">No se ha podido cargar la previsión. Inténtalo de nuevo en unos minutos.</p>`;

    }

}


// ======================================
// PANTALLA 04 · PREDICCIÓN
// ======================================

async function cargarPantallaPrediccion(registros) {

    const contenedorDias = document.getElementById("predDias");

    contenedorDias.innerHTML = `<p class="predCargando">Cargando la previsión…</p>`;
    document.getElementById("predAuditoria").innerHTML = `<p class="predCargando">Calculando la auditoría con los datos de la estación…</p>`;

    try {

        await predCargar(registros);
        predDibujarPantalla();

    } catch (error) {

        console.error(error);
        contenedorDias.innerHTML = `<p class="predCargando">No se ha podido cargar la previsión. Inténtalo de nuevo en unos minutos.</p>`;
        return;

    }

    // Calibración completa (días 4-7 y auditoría): puede tardar unos segundos la primera vez
    try {

        const estacion = predDiasEstacion(registros);
        const completa = await predCalibracionCompleta(estacion);

        predEstado.completa = completa;

        if (predEstado.sesgos !== completa.sesgos) {
            predEstado.sesgos = completa.sesgos;
            predEstado.resultado = await obtenerPrediccion(completa.sesgos, predEstado.resultado.crudo);
            predDibujarPantalla();
        }

        predDibujarAuditoria();

    } catch (error) {

        console.error(error);
        document.getElementById("predAuditoria").innerHTML = `<p class="predCargando">No se ha podido calcular la auditoría en este momento.</p>`;

    }

}

function predDibujarPantalla() {

    const { dias } = predEstado.resultado;
    const sel = predEstado.diaSeleccionado;

    // ---------- Tarjetas de 7 días ----------
    document.getElementById("predDias").innerHTML = dias.map((d, i) => {

        const f = predFecha(d.fecha);
        const letras = predLetrasDireccion(d.direccion);
        const subtitulo = i === 0 ? `Hoy · ${f.dia} ${f.mes}` : i === 1 ? `Mañana · ${f.dia} ${f.mes}` : `${f.dia} ${f.mes}`;

        return `
            <button type="button" class="predCard ${i === sel ? "seleccionada" : ""}" data-dia="${i}" aria-pressed="${i === sel}">
                <span class="predCardDia">${f.corto}</span>
                <span class="predCardFecha">${subtitulo}</span>
                <span class="predDiaIcono" role="img" aria-label="${PRED_NOMBRES_CIELO[d.tipo]}">${predIcono(d.tipo, 58)}</span>
                <span class="predTemperaturas"><span class="max">${predTextoTemperatura(d.tx)}</span><span class="min"> / ${predTextoTemperatura(d.tn)}</span></span>
                ${d.avisos.length ? `<span class="predAvisos">${predAvisosHtml(d.avisos)}</span>` : ""}
                <span class="predCardSeparador"></span>
                <span class="predCardFila">${PRED_ICONO_GOTA}<span><strong>${predTextoProbabilidad(d.probabilidad)}</strong> · ${predTextoLitros(d, i)}</span></span>
                <span class="predCardFila">${predFlecha(d.direccion, 16)}<span><strong>${Math.round(d.viento)} km/h</strong> ${letras}<br><small>rachas ${Math.round(d.racha)}</small></span></span>
                <span class="predCardFila">${PRED_ICONO_SOL}<span>${d.horasSol !== null ? Math.round(d.horasSol) + " h de sol" : "--"}</span></span>
                <span class="predCardFila">${predFiabilidadHtml(d.fiabilidad)}</span>
            </button>`;

    }).join("");

    document.querySelectorAll(".predCard").forEach(boton => {
        boton.onclick = () => predSeleccionarDia(Number(boton.dataset.dia));
    });

    // ---------- Pestañas de días ----------
    document.getElementById("predTabs").innerHTML = dias.map((d, i) => {

        const f = predFecha(d.fecha);

        return `<button type="button" role="tab" class="predTab ${i === sel ? "activa" : ""}" data-dia="${i}" aria-selected="${i === sel}"><strong>${f.corto.charAt(0) + f.corto.slice(1).toLowerCase()}</strong><span>${f.dia} ${f.mes}</span></button>`;

    }).join("");

    document.querySelectorAll(".predTab").forEach(boton => {
        boton.onclick = () => predSeleccionarDia(Number(boton.dataset.dia));
    });

    predDibujarHoras();
    predDibujarExtras();

}

function predSeleccionarDia(i) {

    predEstado.diaSeleccionado = i;
    predDibujarPantalla();

}

function predDibujarHoras() {

    const d = predEstado.resultado.dias[predEstado.diaSeleccionado];
    const f = predFecha(d.fecha);

    document.getElementById("predHorasTitulo").textContent =
        `${f.largo.charAt(0).toUpperCase() + f.largo.slice(1)}, ${f.dia} de ${f.mesLargo} de ${f.anio}`;

    document.getElementById("predHorasPaso").textContent = d.paso === 1
        ? "Detalle cada hora"
        : "Detalle cada 3 horas · a partir del día 4 los modelos dan menos resolución";

    const filas = [
        ["Hora", h => `<strong>${h.hora}</strong>`],
        ["Estado", h => `<span role="img" aria-label="${PRED_NOMBRES_CIELO[h.tipo]}">${predIcono(h.tipo, 28)}</span>`],
        ["Temperatura (°C)", h => {
            if (h.temp === null) return "--";
            const c = predColorTemperatura(h.temp);
            return { html: `<strong>${String(h.temp).replace("-", "−")}</strong>`, estilo: `background:${c.fondo};color:${c.texto}` };
        }],
        ["Lluvia (mm)", h => h.mm >= 0.1
            ? { html: h.mm.toFixed(1).replace(".", ","), estilo: `background:rgba(59,130,246,${Math.min(0.85, 0.3 + h.mm / 3).toFixed(2)})` }
            : "0"],
        ["Prob. lluvia", h => h.prob === null ? "--" : { html: predTextoProbabilidad(h.prob), estilo: h.prob >= 30 ? "color:#93c5fd;font-weight:700" : "" }],
        ["Humedad (%)", h => h.humedad === null ? "--" : { html: h.humedad, estilo: `background:rgba(99,102,241,${(0.12 + h.humedad / 220).toFixed(2)})` }],
        ["Viento (km/h)", h => h.viento === null ? "--" : `<strong>${h.viento}</strong>`],
        ["Rachas (km/h)", h => `<span class="predSuave">${h.racha}</span>`],
        ["Dirección", h => h.direccion === null ? "--" : `${predFlecha(h.direccion, 16)}<br><span class="predSuave">${predLetrasDireccion(h.direccion)}</span>`]
    ];

    const cuerpo = filas.map(([etiqueta, celda]) => {

        const celdas = d.tabla.map(h => {

            const valor = celda(h);

            return typeof valor === "object"
                ? `<td style="${valor.estilo}">${valor.html}</td>`
                : `<td>${valor}</td>`;

        }).join("");

        return `<tr><th scope="row">${etiqueta}</th>${celdas}</tr>`;

    }).join("");

    document.getElementById("predTabla").innerHTML = `<table class="predTablaHoras">${cuerpo}</table>`;

}

function predDibujarExtras() {

    const d = predEstado.resultado.dias[predEstado.diaSeleccionado];
    const f = predFecha(d.fecha);

    document.getElementById("predExtrasTitulo").textContent = `Datos adicionales · ${f.largo} ${f.dia}`;

    const uv = d.uv === null ? null : Math.round(d.uv);
    const uvTexto = uv === null ? "--" : uv <= 2 ? "Bajo" : uv <= 5 ? "Moderado" : uv <= 7 ? "Alto" : uv <= 10 ? "Muy alto" : "Extremo";
    const uvFondo = uv === null ? "#cbd5e1" : uv <= 2 ? "#86efac" : uv <= 5 ? "#fde047" : uv <= 7 ? "#fdba74" : "#fca5a5";

    const tarjeta = (icono, titulo, valor) => `
        <div class="predExtra">${icono}<div><div class="predExtraTitulo">${titulo}</div><div class="predExtraValor">${valor}</div></div></div>`;

    document.getElementById("predExtras").innerHTML = [
        tarjeta(`<svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true"><path d="M12 32a12 12 0 0 1 24 0z" fill="#fbbf24"/><line x1="6" y1="36" x2="42" y2="36" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/><path d="M24 6v10M19 11l5-5 5 5" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`, "Salida del sol", d.salida),
        tarjeta(`<svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true"><path d="M12 32a12 12 0 0 1 24 0z" fill="#fb923c"/><line x1="6" y1="36" x2="42" y2="36" stroke="#fb923c" stroke-width="3" stroke-linecap="round"/><path d="M24 16V6M19 11l5 5 5-5" fill="none" stroke="#fb923c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`, "Puesta del sol", d.puesta),
        tarjeta(`<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4.5 17a9 9 0 1 1 15 0"/><line x1="12" y1="13" x2="16" y2="8"/><circle cx="12" cy="13" r="1.4" fill="#60a5fa"/></svg>`, "Presión atmosférica", d.presion === null ? "--" : `${Math.round(d.presion).toLocaleString("es-ES")} hPa`),
        tarjeta(`<svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="10" fill="#fbbf24"/><g stroke="#fbbf24" stroke-width="3" stroke-linecap="round"><line x1="24" y1="3" x2="24" y2="8"/><line x1="24" y1="40" x2="24" y2="45"/><line x1="3" y1="24" x2="8" y2="24"/><line x1="40" y1="24" x2="45" y2="24"/></g></svg>`, "Índice UV máximo", `<span class="predUv" style="background:${uvFondo}">${uv === null ? "--" : uv}</span> ${uvTexto}`),
        tarjeta(`<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fde68a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l9.5 17h-19z"/><line x1="12" y1="10" x2="12" y2="14"/><circle cx="12" cy="17" r=".8" fill="#fde68a"/></svg>`, "Avisos", d.avisos.length ? d.avisos.join(" · ") : "Sin avisos")
    ].join("");

}


// ======================================
// AUDITORÍA PREDICTIVA
// ======================================

function predDibujarAuditoria() {

    const auditoria = predEstado.completa && predEstado.completa.auditoria;
    const contenedor = document.getElementById("predAuditoria");

    if (!auditoria) return;

    const periodo = auditoria[predEstado.periodoAuditoria];

    const preguntas = [
        ["¿Acertó la máxima?", "dentro de ±2 °C"],
        ["¿Acertó la mínima?", "dentro de ±2 °C"],
        ["¿Acertó si llovía o no?", "umbral de 1 mm en el día"],
        ["¿Acertó los litros?", "días con lluvia: dentro de ±2 mm o ±30 %"]
    ];

    const celda = valor => {

        if (valor === null) return `<span class="predNota">sin datos</span>`;

        const nivel = valor >= 85 ? "bien" : valor >= 70 ? "regular" : "mal";
        const icono = {
            bien: `<polyline points="4,12 10,18 20,6"/>`,
            regular: `<line x1="5" y1="12" x2="19" y2="12"/>`,
            mal: `<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>`
        }[nivel];

        return `<span class="predSemaforo ${nivel}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icono}</svg>${valor} %</span>`;

    };

    const filas = preguntas.map((p, i) => `
        <div class="predAudPregunta"><strong>${p[0]}</strong><span>${p[1]}</span></div>
        <div class="predAudCelda">${celda(periodo.filas[i][0])}</div>
        <div class="predAudCelda">${celda(periodo.filas[i][1])}</div>`).join("");

    const v = periodo.filas[0][0], c = periodo.filas[0][1];

    const frase = (v !== null && c !== null)
        ? `La máxima prevista la víspera se cumple ${Math.round(v / 10)} de cada 10 veces; la prevista 5 días antes, ${Math.round(c / 10)} de cada 10.`
        : "";

    const ultimo = predFecha(auditoria.ultimoDato);

    const botones = [["mes", "Último mes"], ["anio", "Último año"], ["todo", "Todo"]]
        .map(([clave, nombre]) => `<button type="button" role="tab" class="predPeriodo ${clave === predEstado.periodoAuditoria ? "activa" : ""}" data-periodo="${clave}" aria-selected="${clave === predEstado.periodoAuditoria}">${nombre}</button>`)
        .join("");

    contenedor.innerHTML = `
        <div class="predAudCabecera">
            <p>¿Se cumple lo que se predice? Se compara lo que se predijo con lo que midió después la estación.</p>
            <div class="predPeriodos" role="tablist" aria-label="Periodo">${botones}</div>
        </div>
        <div class="predAudTabla">
            <div></div>
            <div class="predAudColumna">Dicho la víspera</div>
            <div class="predAudColumna">Dicho 5 días antes</div>
            ${filas}
        </div>
        <p class="predAudFrase">${frase}</p>
        <p class="predNota">Se actualiza cada vez que se suben los datos de la estación · último dato: ${ultimo.dia} ${ultimo.mes} ${ultimo.anio} · ${periodo.dias} días comparados. Verde: 85 % o más · ámbar: 70–84 % · rojo: menos del 70 %.</p>`;

    contenedor.querySelectorAll(".predPeriodo").forEach(boton => {
        boton.onclick = () => {
            predEstado.periodoAuditoria = boton.dataset.periodo;
            predDibujarAuditoria();
        };
    });

}
