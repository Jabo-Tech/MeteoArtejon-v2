// ======================================
// PREDICCIÓN · MOTOR DE CÁLCULO
// --------------------------------------
// Pide los modelos a Open-Meteo, los combina según el análisis de
// octubre de 2026 (ver "analisis-modelos-prediccion.md") y corrige
// las temperaturas con los datos de la estación.
//
//   · Hoy ............ media de AROME e ICON-EU (corregidos)
//   · Mañana y pasado  ICON-EU (corregido)
//   · Días 4 a 7 ..... media de 6 modelos globales (corregida)
//   · Probabilidad de lluvia y fiabilidad: 82 escenarios
//     (51 del europeo ECMWF + 31 del americano GFS)
//
// La corrección (sesgo) se recalcula sola con el Excel: cada vez
// que se suben datos nuevos, la primera visita la vuelve a calcular
// y la guarda en el navegador para las siguientes.
// ======================================

const PRED = {

    latitud: 40.795,
    longitud: -4.283,
    zona: "Europe/Madrid",

    modelosGlobales: [
        "ecmwf_ifs025",
        "icon_global",
        "gfs_global",
        "gem_seamless",
        "ukmo_global_deterministic_10km",
        "jma_seamless"
    ],

    // El anemómetro mide de media la mitad que el modelo a 10 m
    // (análisis de oct-2026). Las rachas, en torno al 70 %.
    factorViento: 0.5,
    factorRacha: 0.7,

    // Sesgos por defecto (modelo − estación, en °C), por si no se
    // pudiera calcular la calibración. Salen del análisis.
    sesgoPorDefecto: {
        tx: -1.3,
        tn: 0.4
    },

    // Litros de hoy, mañana y pasado: media de estos 7 modelos.
    // Probado con la estación (oct-2026): acierta más que cualquiera por separado.
    modelosLitros: [
        "meteofrance_arome_france",
        "icon_eu",
        "ecmwf_ifs025",
        "gfs_global",
        "ukmo_global_deterministic_10km",
        "icon_global",
        "gem_seamless"
    ],

    // Umbral de "día de lluvia", igual que en el análisis
    umbralLluvia: 1,

    // Umbral de "hora con lluvia": la que ya moja el suelo
    umbralLluviaHora: 0.3,

    claveCache: "meteoartejon-calibracion-v2"

};


// ======================================
// UTILIDADES
// ======================================

function predUrl(base, parametros) {

    const consulta = Object.entries(parametros)
        .map(([clave, valor]) => `${clave}=${encodeURIComponent(valor)}`)
        .join("&");

    return `${base}?${consulta}`;

}

async function predPedir(base, parametros, intento = 1) {

    const respuesta = await fetch(predUrl(base, {
        latitude: PRED.latitud,
        longitude: PRED.longitud,
        timezone: PRED.zona,
        ...parametros
    }));

    // Open-Meteo limita las peticiones simultáneas: si se pasa, se espera y se reintenta
    if (respuesta.status === 429 && intento < 4) {
        await new Promise(resolver => setTimeout(resolver, 1500 * intento));
        return predPedir(base, parametros, intento + 1);
    }

    const datos = await respuesta.json();

    if (!respuesta.ok || datos.error) {
        throw new Error(datos.reason || `Error ${respuesta.status} en Open-Meteo`);
    }

    return datos;

}

function predMedia(valores) {

    const validos = valores.filter(v => v !== null && v !== undefined && !isNaN(v));

    if (!validos.length) return null;

    return validos.reduce((a, b) => a + b, 0) / validos.length;

}

function predPercentil(valores, p) {

    const ordenados = [...valores].sort((a, b) => a - b);
    const posicion = (ordenados.length - 1) * p;
    const abajo = Math.floor(posicion);
    const arriba = Math.ceil(posicion);

    return ordenados[abajo] + (ordenados[arriba] - ordenados[abajo]) * (posicion - abajo);

}

function predSumarDias(fechaTexto, dias) {

    const fecha = new Date(`${fechaTexto}T12:00:00Z`);
    fecha.setUTCDate(fecha.getUTCDate() + dias);

    return fecha.toISOString().slice(0, 10);

}

function predHoyTexto() {

    // Fecha de hoy en hora peninsular, formato AAAA-MM-DD
    return new Intl.DateTimeFormat("en-CA", { timeZone: PRED.zona }).format(new Date());

}

// Forma del ciclo diario: 0 a las 7 h (mínima), 1 a las 15 h (máxima).
// Sirve para repartir la corrección entre la de la mínima y la de la máxima.
function predFormaDiaria(hora) {

    if (hora >= 7 && hora <= 15) {
        return (1 - Math.cos(Math.PI * (hora - 7) / 8)) / 2;
    }

    const desdeMaxima = ((hora - 15) + 24) % 24;

    return (1 + Math.cos(Math.PI * desdeMaxima / 16)) / 2;

}

function predLetrasDireccion(grados) {

    const puntos = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];

    return puntos[Math.round((((grados % 360) + 360) % 360) / 45) % 8];

}

function predNombreDireccion(letras) {

    return {
        N: "del norte", NE: "del noreste", E: "del este", SE: "del sureste",
        S: "del sur", SO: "del suroeste", O: "del oeste", NO: "del noroeste"
    }[letras];

}

// Agrupa una serie horaria por días: devuelve { fecha: [valores] }
function predAgruparPorDia(tiempos, valores) {

    const dias = {};

    tiempos.forEach((t, i) => {

        const fecha = t.slice(0, 10);

        (dias[fecha] = dias[fecha] || []).push(valores[i]);

    });

    return dias;

}

// Máxima, mínima y suma diarias de una serie horaria (solo días casi completos)
function predResumenDiario(tiempos, temperaturas, lluvias) {

    const resumen = {};

    const porDiaT = temperaturas ? predAgruparPorDia(tiempos, temperaturas) : {};
    const porDiaP = lluvias ? predAgruparPorDia(tiempos, lluvias) : {};

    const fechas = new Set([...Object.keys(porDiaT), ...Object.keys(porDiaP)]);

    fechas.forEach(fecha => {

        const t = (porDiaT[fecha] || []).filter(v => v !== null);
        const p = (porDiaP[fecha] || []).filter(v => v !== null);

        resumen[fecha] = {
            tx: t.length >= 22 ? Math.max(...t) : null,
            tn: t.length >= 22 ? Math.min(...t) : null,
            p: p.length >= 22 ? p.reduce((a, b) => a + b, 0) : null
        };

    });

    return resumen;

}


// ======================================
// DATOS DIARIOS DE LA ESTACIÓN
// ======================================

function predDiasEstacion(registros) {

    const dias = {};
    const vistos = new Set();

    registros.forEach(r => {

        if (!r.fecha || !r.hora) return;

        const clave = `${r.fecha} ${r.hora}`;

        if (vistos.has(clave)) return;

        vistos.add(clave);

        const d = (dias[r.fecha] = dias[r.fecha] || { n: 0, tx: -Infinity, tn: Infinity, p: 0 });

        d.n++;

        if (isFinite(r.temperaturaMax)) d.tx = Math.max(d.tx, r.temperaturaMax);
        if (isFinite(r.temperaturaMin)) d.tn = Math.min(d.tn, r.temperaturaMin);
        if (isFinite(r.lluviaDiaria)) d.p = Math.max(d.p, r.lluviaDiaria);

    });

    // Solo días completos (al menos 44 de los 48 registros de media hora)
    const completos = {};

    Object.entries(dias).forEach(([fecha, d]) => {

        if (d.n >= 44 && isFinite(d.tx) && isFinite(d.tn)) {
            completos[fecha] = { tx: d.tx, tn: d.tn, p: d.p };
        }

    });

    return completos;

}


// ======================================
// CALIBRACIÓN (SESGOS) Y AUDITORÍA
// ======================================

function predSesgo(modelo, estacion) {

    const dtx = [], dtn = [];

    Object.entries(modelo).forEach(([fecha, m]) => {

        const o = estacion[fecha];

        if (!o) return;

        if (m.tx !== null) dtx.push(m.tx - o.tx);
        if (m.tn !== null) dtn.push(m.tn - o.tn);

    });

    if (dtx.length < 30) return null;

    return { tx: predMedia(dtx), tn: predMedia(dtn), n: dtx.length };

}

// Descarga lo que predijo un modelo N días antes, para todo el periodo de la estación
async function predPasadasAnteriores(modelo, desfases, inicio, fin, conLluvia = []) {

    const variables = [
        ...desfases.map(d => `temperature_2m_previous_day${d}`),
        ...conLluvia.map(d => `precipitation_previous_day${d}`)
    ];

    const datos = await predPedir("https://previous-runs-api.open-meteo.com/v1/forecast", {
        models: modelo,
        start_date: inicio,
        end_date: fin,
        hourly: variables.join(",")
    });

    const salida = {};

    desfases.forEach(d => {

        const lluvia = conLluvia.includes(d) ? datos.hourly[`precipitation_previous_day${d}`] : null;

        salida[d] = predResumenDiario(datos.hourly.time, datos.hourly[`temperature_2m_previous_day${d}`], lluvia);

    });

    conLluvia.filter(d => !desfases.includes(d)).forEach(d => {

        salida[d] = predResumenDiario(datos.hourly.time, null, datos.hourly[`precipitation_previous_day${d}`]);

    });

    return salida;

}

function predLeerCache() {

    try {
        return JSON.parse(localStorage.getItem(PRED.claveCache)) || null;
    } catch (error) {
        return null;
    }

}

function predGuardarCache(valor) {

    try {
        localStorage.setItem(PRED.claveCache, JSON.stringify(valor));
    } catch (error) {
        // Sin almacenamiento disponible: se recalculará en la próxima visita
    }

}

function predPeriodoEstacion(estacion) {

    const fechas = Object.keys(estacion).sort();

    return { inicio: fechas[0], fin: fechas[fechas.length - 1] };

}

// Calibración rápida: lo que necesita la portada (hoy, mañana y pasado)
async function predCalibracionRapida(estacion) {

    const { inicio, fin } = predPeriodoEstacion(estacion);
    const cache = predLeerCache();

    if (cache && cache.fin === fin && cache.rapida) return cache.rapida;

    // Hoy: la pasada más reciente de cada modelo (archivo histórico)
    const hoy = await predPedir("https://historical-forecast-api.open-meteo.com/v1/forecast", {
        models: "icon_eu,meteofrance_arome_france",
        start_date: inicio,
        end_date: fin,
        daily: "temperature_2m_max,temperature_2m_min"
    });

    const sesgos = {};

    ["icon_eu", "meteofrance_arome_france"].forEach(m => {

        const diario = {};

        hoy.daily.time.forEach((fecha, i) => {
            diario[fecha] = {
                tx: hoy.daily[`temperature_2m_max_${m}`][i],
                tn: hoy.daily[`temperature_2m_min_${m}`][i]
            };
        });

        sesgos[`${m}_0`] = predSesgo(diario, estacion);

    });

    // Mañana y pasado: lo que dijo ICON-EU con 1 y 2 días de antelación
    const icon = await predPasadasAnteriores("icon_eu", [1, 2], inicio, fin);

    sesgos.icon_eu_1 = predSesgo(icon[1], estacion);
    sesgos.icon_eu_2 = predSesgo(icon[2], estacion);

    predGuardarCache({ ...(cache && cache.fin === fin ? cache : {}), fin, rapida: sesgos });

    return sesgos;

}

// Calibración completa: días 4 a 7 y auditoría predictiva
async function predCalibracionCompleta(estacion) {

    const { inicio, fin } = predPeriodoEstacion(estacion);
    const cache = predLeerCache();

    if (cache && cache.fin === fin && cache.completa) return cache.completa;

    const rapida = await predCalibracionRapida(estacion);

    // De una en una: son descargas grandes y Open-Meteo no admite muchas a la vez
    const icon = await predPasadasAnteriores("icon_eu", [1], inicio, fin, [1]);
    const arome = await predPasadasAnteriores("meteofrance_arome_france", [], inicio, fin, [1]);

    const globales = [];

    for (const modelo of PRED.modelosGlobales) {
        globales.push(await predPasadasAnteriores(modelo, [3, 4, 5, 6], inicio, fin, [1, 5]));
    }

    // Litros de la víspera: media de los mismos 7 modelos que usa la web
    const porModelo = { meteofrance_arome_france: arome[1], icon_eu: icon[1] };

    PRED.modelosGlobales.forEach((m, i) => { porModelo[m] = globales[i][1]; });

    const lluviaVispera = {};

    Object.keys(estacion).forEach(fecha => {

        const valores = PRED.modelosLitros
            .map(m => porModelo[m] && porModelo[m][fecha] ? porModelo[m][fecha].p : null)
            .filter(v => v !== null);

        if (valores.length >= 4) lluviaVispera[fecha] = predMedia(valores);

    });

    // Media de los modelos globales para cada día y cada antelación
    const media = {};

    [3, 4, 5, 6].forEach(d => {

        media[d] = {};

        Object.keys(estacion).forEach(fecha => {

            const valores = globales.map(g => g[d] && g[d][fecha]).filter(Boolean);

            if (valores.length < 3) return;

            media[d][fecha] = {
                tx: predMedia(valores.map(v => v.tx)),
                tn: predMedia(valores.map(v => v.tn)),
                p: predMedia(valores.map(v => v.p))
            };

        });

    });

    const sesgos = { ...rapida };

    [3, 4, 5, 6].forEach(d => {
        sesgos[`globales_${d}`] = predSesgo(media[d], estacion);
    });

    const auditoria = predAuditoria(estacion, icon[1], lluviaVispera, media[5], sesgos);

    const completa = { sesgos, auditoria };

    predGuardarCache({ fin, rapida, completa });

    return completa;

}

// ¿Se cumplió lo que se predijo la víspera y 5 días antes?
function predAuditoria(estacion, iconVispera, lluviaVispera, globales5, sesgos) {

    const sv = sesgos.icon_eu_1 || PRED.sesgoPorDefecto;
    const s5 = sesgos.globales_5 || PRED.sesgoPorDefecto;

    const fechas = Object.keys(estacion).sort();
    const ultima = fechas[fechas.length - 1];

    const periodos = {
        mes: predSumarDias(ultima, -29),
        anio: predSumarDias(ultima, -364),
        todo: fechas[0]
    };

    const resultado = {};

    Object.entries(periodos).forEach(([nombre, desde]) => {

        const cuentas = {
            vispera: { tx: [], tn: [], llueve: [], litros: [] },
            cinco: { tx: [], tn: [], llueve: [], litros: [] }
        };

        fechas.filter(f => f >= desde).forEach(fecha => {

            const o = estacion[fecha];

            const casos = [
                ["vispera", iconVispera[fecha], sv, lluviaVispera[fecha] !== undefined ? lluviaVispera[fecha] : null],
                ["cinco", globales5[fecha], s5, globales5[fecha] ? globales5[fecha].p : null]
            ];

            casos.forEach(([clave, m, s, lluvia]) => {

                if (!m) return;

                const c = cuentas[clave];

                if (m.tx !== null) c.tx.push(Math.abs((m.tx - s.tx) - o.tx) <= 2);
                if (m.tn !== null) c.tn.push(Math.abs((m.tn - s.tn) - o.tn) <= 2);

                if (lluvia !== null && lluvia !== undefined) {

                    const real = o.p >= PRED.umbralLluvia;
                    const previsto = lluvia >= PRED.umbralLluvia;

                    c.llueve.push(real === previsto);

                    if (real || previsto) {
                        c.litros.push(Math.abs(lluvia - o.p) <= Math.max(2, 0.3 * o.p));
                    }

                }

            });

        });

        const porcentaje = lista => lista.length ? Math.round(100 * lista.filter(Boolean).length / lista.length) : null;

        resultado[nombre] = {
            dias: cuentas.vispera.tx.length,
            filas: ["tx", "tn", "llueve", "litros"].map(v => [porcentaje(cuentas.vispera[v]), porcentaje(cuentas.cinco[v])])
        };

    });

    resultado.ultimoDato = ultima;

    return resultado;

}


// ======================================
// PREDICCIÓN DE LOS PRÓXIMOS 7 DÍAS
// ======================================

// Tipo de cielo a partir del código de tiempo de los modelos (OMM)
function predTipoCodigo(codigo, noche) {

    if (codigo === null || codigo === undefined) return noche ? "luna" : "solnubes";
    if (codigo >= 95) return "tormenta";
    if ((codigo >= 71 && codigo <= 77) || codigo === 85 || codigo === 86) return "nieve";
    if (codigo >= 51) return "lluvia";
    if (codigo === 45 || codigo === 48) return "niebla";
    if (codigo === 3) return "nubes";
    if (codigo === 2) return noche ? "lunanubes" : "solnubes";

    return noche ? "luna" : "sol";

}

// "crudo" permite recalcular con otros sesgos sin volver a descargar los modelos
async function obtenerPrediccion(sesgos, crudo = null) {

    const variables = [
        "temperature_2m", "precipitation", "relative_humidity_2m",
        "wind_speed_10m", "wind_gusts_10m", "wind_direction_10m",
        "weather_code", "cloud_cover", "pressure_msl", "snowfall",
        "sunshine_duration"
    ];

    const modelos = ["icon_eu", "meteofrance_arome_france", ...PRED.modelosGlobales];

    const [det, astro, ens, previa] = crudo || await Promise.all([

        predPedir("https://api.open-meteo.com/v1/forecast", {
            models: modelos.join(","),
            hourly: variables.join(","),
            forecast_days: 7
        }),

        predPedir("https://api.open-meteo.com/v1/forecast", {
            daily: "sunrise,sunset,sunshine_duration,uv_index_max",
            forecast_days: 7
        }),

        predPedir("https://ensemble-api.open-meteo.com/v1/ensemble", {
            models: "ecmwf_ifs025,gfs025",
            hourly: "temperature_2m,precipitation",
            forecast_days: 7
        }).catch(() => null),

        predPedir("https://previous-runs-api.open-meteo.com/v1/forecast", {
            models: "ecmwf_ifs025",
            hourly: "temperature_2m,temperature_2m_previous_day1,precipitation,precipitation_previous_day1",
            forecast_days: 7
        }).catch(() => null)

    ]);

    const tiempos = det.hourly.time;
    const fechas = [...new Set(tiempos.map(t => t.slice(0, 10)))].slice(0, 7);

    const serie = (variable, modelo, indices) => indices.map(i => {
        const lista = det.hourly[`${variable}_${modelo}`];
        return lista ? lista[i] : null;
    });

    const completo = (variable, modelo, indices) => serie(variable, modelo, indices).every(v => v !== null);

    const sesgoDe = clave => (sesgos && sesgos[clave]) || PRED.sesgoPorDefecto;

    // Escenarios (miembros) de los conjuntos
    const miembrosLluvia = ens ? Object.keys(ens.hourly).filter(k => k.startsWith("precipitation")) : [];
    const miembrosTemp = ens ? Object.keys(ens.hourly).filter(k => k.startsWith("temperature_2m")) : [];

    const dias = fechas.map((fecha, d) => {

        const indices = tiempos.map((t, i) => t.startsWith(fecha) ? i : -1).filter(i => i >= 0);
        const horas = indices.map(i => Number(tiempos[i].slice(11, 13)));

        // ---------- Qué modelos se usan este día ----------
        let fuentes, claveSesgo;

        if (d === 0) {
            fuentes = ["meteofrance_arome_france", "icon_eu"].filter(m => completo("temperature_2m", m, indices));
            claveSesgo = m => `${m}_0`;
        } else if (d <= 2 && completo("temperature_2m", "icon_eu", indices)) {
            fuentes = ["icon_eu"];
            claveSesgo = m => `${m}_${d}`;
        } else {
            fuentes = PRED.modelosGlobales.filter(m => completo("temperature_2m", m, indices));
            claveSesgo = () => `globales_${Math.max(3, d)}`;
        }

        if (!fuentes.length) fuentes = PRED.modelosGlobales.filter(m => completo("temperature_2m", m, indices));

        // ---------- Temperatura horaria corregida ----------
        const temperaturas = horas.map((h, k) => predMedia(fuentes.map(m => {

            const s = sesgoDe(claveSesgo(m));
            const correccion = s.tn + (s.tx - s.tn) * predFormaDiaria(h);
            const valor = det.hourly[`temperature_2m_${m}`][indices[k]];

            return valor === null ? null : valor - correccion;

        })));

        // Lluvia horaria: hasta pasado mañana, media de los 7 modelos que mejor
        // acertaron los litros en la estación; después, la de los modelos del día
        let fuenteLluvia = fuentes;

        const modelosLitros = PRED.modelosLitros.filter(m => completo("precipitation", m, indices));

        if (d <= 2 && modelosLitros.length >= 4) fuenteLluvia = modelosLitros;

        const lluvias = indices.map(i => Math.max(0, predMedia(fuenteLluvia.map(m => det.hourly[`precipitation_${m}`][i])) || 0));

        const media = variable => indices.map(i => predMedia(fuentes.map(m => (det.hourly[`${variable}_${m}`] || [])[i])));

        const humedades = media("relative_humidity_2m");
        const vientos = media("wind_speed_10m").map(v => v === null ? null : v * PRED.factorViento);
        const rachas = media("wind_gusts_10m").map(v => v === null ? null : v * PRED.factorRacha);
        const presiones = media("pressure_msl");
        const nubes = media("cloud_cover");

        // Sol: segundos de sol de cada hora, de los mismos modelos del día.
        // Con esto se calculan las horas de sol y los iconos, para que cuadren entre sí.
        const sol = media("sunshine_duration").map(v => v === null ? null : Math.max(0, Math.min(3600, v)));
        const horasSol = sol.some(v => v !== null) ? sol.reduce((a, b) => a + (b || 0), 0) / 3600 : null;

        // Dirección: la del modelo principal del día (no se puede promediar entre modelos)
        const modeloDireccion = fuentes.includes("icon_eu") ? "icon_eu" : (fuentes.includes("ecmwf_ifs025") ? "ecmwf_ifs025" : fuentes[0]);
        const direcciones = serie("wind_direction_10m", modeloDireccion, indices);

        // Código de tiempo: del modelo principal
        const modeloCodigo = fuentes.includes("icon_eu") ? "icon_eu" : (fuentes.includes("ecmwf_ifs025") ? "ecmwf_ifs025" : fuentes[0]);
        const codigos = serie("weather_code", modeloCodigo, indices);
        const nieve = predMedia(fuentes.map(m => serie("snowfall", m, indices).reduce((a, b) => a + (b || 0), 0))) || 0;

        // ---------- Escenarios: probabilidad y rango de lluvia ----------
        let probabilidad = null, rango = null, dispersion = null;

        if (miembrosLluvia.length) {

            const ei = ens.hourly.time.map((t, i) => t.startsWith(fecha) ? i : -1).filter(i => i >= 0);

            const totales = miembrosLluvia
                .map(k => ei.reduce((s, i) => s + (ens.hourly[k][i] || 0), 0));

            probabilidad = 100 * totales.filter(t => t >= PRED.umbralLluvia).length / totales.length;
            rango = [predPercentil(totales, 0.25), predPercentil(totales, 0.75)];

            const maximas = miembrosTemp
                .map(k => Math.max(...ei.map(i => ens.hourly[k][i]).filter(v => v !== null)))
                .filter(v => isFinite(v));

            if (maximas.length > 5) {
                const m = predMedia(maximas);
                dispersion = Math.sqrt(predMedia(maximas.map(v => (v - m) ** 2)));
            }

        }

        // Probabilidad por hora (o por bloque): % de escenarios con lluvia en esa hora
        const probHora = hora => {

            if (!miembrosLluvia.length) return null;

            const i = ens.hourly.time.indexOf(`${fecha}T${String(hora).padStart(2, "0")}:00`);

            if (i < 0) return null;

            return 100 * miembrosLluvia.filter(k => (ens.hourly[k][i] || 0) >= PRED.umbralLluviaHora).length / miembrosLluvia.length;

        };

        // ---------- Cambio respecto a la actualización anterior ----------
        let cambio = 0;

        if (previa) {

            const pi = previa.hourly.time.map((t, i) => t.startsWith(fecha) ? i : -1).filter(i => i >= 0);
            const ahora = pi.map(i => previa.hourly.temperature_2m[i]).filter(v => v !== null);
            const antes = pi.map(i => previa.hourly.temperature_2m_previous_day1[i]).filter(v => v !== null);
            const lluviaAhora = pi.reduce((s, i) => s + (previa.hourly.precipitation[i] || 0), 0);
            const lluviaAntes = pi.reduce((s, i) => s + (previa.hourly.precipitation_previous_day1[i] || 0), 0);

            if (ahora.length > 20 && antes.length > 20) {
                cambio = Math.abs(Math.max(...ahora) - Math.max(...antes)) + 0.15 * Math.min(10, Math.abs(lluviaAhora - lluviaAntes));
            }

        }

        // ---------- Resumen del día ----------
        const tx = Math.max(...temperaturas.filter(v => v !== null));
        const tn = Math.min(...temperaturas.filter(v => v !== null));
        const lluviaTotal = lluvias.reduce((a, b) => a + b, 0);

        const salida = astro.daily.sunrise[d] ? Number(astro.daily.sunrise[d].slice(11, 13)) : 8;
        const puesta = astro.daily.sunset[d] ? Number(astro.daily.sunset[d].slice(11, 13)) : 19;

        const esNoche = h => h < salida || h > puesta;

        // Dirección dominante: media vectorial ponderada por la velocidad
        let sx = 0, sy = 0;

        direcciones.forEach((g, k) => {

            if (g === null || vientos[k] === null) return;

            sx += vientos[k] * Math.sin(g * Math.PI / 180);
            sy += vientos[k] * Math.cos(g * Math.PI / 180);

        });

        const direccion = (Math.atan2(sx, sy) * 180 / Math.PI + 360) % 360;

        const diurnas = horas.map((h, k) => (h >= 9 && h <= 20) ? k : -1).filter(k => k >= 0);

        // Cielo del día
        const probParaCielo = probabilidad !== null ? probabilidad : (lluviaTotal >= 1 ? 60 : 0);
        const hayTormenta = diurnas.some(k => codigos[k] >= 95);

        let tipo;

        if (nieve >= 0.5) tipo = "nieve";
        else if (hayTormenta && probParaCielo >= 30) tipo = "tormenta";
        else if (probParaCielo >= 50 || lluviaTotal >= 2) tipo = "lluvia";
        else {

            // Fracción de las horas de luz que hace sol
            const horasLuz = Math.max(1, puesta - salida);
            const fraccion = horasSol !== null ? horasSol / horasLuz : 1 - (predMedia(diurnas.map(k => nubes[k])) || 0) / 100;

            tipo = fraccion >= 0.75 ? "sol" : fraccion >= 0.35 ? "solnubes" : "nubes";

        }

        // Avisos
        const avisos = [];

        if (tn < 0) avisos.push("Helada");
        if (nieve >= 0.5) avisos.push("Nieve");
        if (hayTormenta) avisos.push("Tormenta");
        if (Math.max(...rachas.filter(v => v !== null)) >= 50) avisos.push("Viento fuerte");

        const hayNiebla = horas.some((h, k) => h <= 11 && ((humedades[k] >= 97 && vientos[k] !== null && vientos[k] < 3) || codigos[k] === 45 || codigos[k] === 48));

        if (hayNiebla) avisos.push("Niebla");

        // Fiabilidad: coincidencia entre escenarios + cambios entre actualizaciones
        let puntuacion = (dispersion !== null ? dispersion : 0.6 + 0.35 * d) + 0.5 * cambio;

        if (probabilidad !== null) puntuacion += 1 - Math.abs(probabilidad - 50) / 50;

        const fiabilidad = puntuacion < 1.6 ? 3 : puntuacion < 2.8 ? 2 : 1;

        // Horas: cada hora hasta pasado mañana, cada 3 horas después
        const paso = d < 3 ? 1 : 3;

        const tabla = [];

        for (let k = 0; k < horas.length; k += paso) {

            const bloque = [];

            for (let j = k; j < Math.min(k + paso, horas.length); j++) bloque.push(j);

            const h = horas[k];
            const mm = bloque.reduce((s, j) => s + lluvias[j], 0);
            const pBloque = Math.max(...bloque.map(j => probHora(horas[j]) || 0));

            // Icono de la hora: lluvia, nieve, tormenta o niebla según el modelo;
            // si no, según el sol de esa hora (de día) o las nubes (de noche)
            const solBloque = predMedia(bloque.map(j => sol[j]));
            const nubesBloque = predMedia(bloque.map(j => nubes[j]));
            const codigoTipo = predTipoCodigo(codigos[k], esNoche(h));

            let tipoHora;

            if (mm >= 0.1) tipoHora = (codigoTipo === "nieve" || codigoTipo === "tormenta") ? codigoTipo : "lluvia";
            else if (codigoTipo === "niebla" || codigoTipo === "tormenta") tipoHora = codigoTipo;
            else if (esNoche(h)) tipoHora = (nubesBloque || 0) < 40 ? "luna" : "lunanubes";
            else if (solBloque !== null) tipoHora = solBloque / 3600 >= 0.75 ? "sol" : solBloque / 3600 >= 0.25 ? "solnubes" : "nubes";
            else tipoHora = (nubesBloque || 0) < 30 ? "sol" : (nubesBloque || 0) < 70 ? "solnubes" : "nubes";

            tabla.push({
                hora: String(h).padStart(2, "0"),
                tipo: tipoHora,
                temp: temperaturas[k] === null ? null : Math.round(temperaturas[k]),
                mm,
                prob: pBloque,
                humedad: humedades[k] === null ? null : Math.round(humedades[k]),
                viento: vientos[k] === null ? null : Math.round(vientos[k]),
                racha: Math.round(Math.max(...bloque.map(j => rachas[j] || 0))),
                direccion: direcciones[k]
            });

        }

        return {
            fecha,
            tipo,
            tx, tn,
            probabilidad,
            lluviaTotal,
            rango,
            viento: predMedia(diurnas.map(k => vientos[k])),
            racha: Math.max(...rachas.filter(v => v !== null)),
            direccion,
            horasSol,
            uv: astro.daily.uv_index_max[d],
            salida: astro.daily.sunrise[d] ? astro.daily.sunrise[d].slice(11, 16) : "--",
            puesta: astro.daily.sunset[d] ? astro.daily.sunset[d].slice(11, 16) : "--",
            presion: predMedia(presiones),
            avisos,
            fiabilidad,
            paso,
            tabla,
            modelos: fuentes
        };

    });

    return { dias, generado: new Date(), crudo: [det, astro, ens, previa] };

}


// ======================================
// TEXTOS PARA MOSTRAR
// ======================================

function predTextoProbabilidad(probabilidad) {

    if (probabilidad === null) return "--";
    if (probabilidad < 10) return "0 %";

    return `${Math.min(100, Math.round(probabilidad / 5) * 5)} %`;

}

// Litros: cifra aproximada hoy y mañana, rango después
function predTextoLitros(dia, posicion) {

    if (dia.probabilidad !== null && dia.probabilidad < 10) return "—";

    if (posicion <= 1 || !dia.rango) {

        const litros = Math.round(dia.lluviaTotal);

        if (dia.lluviaTotal < 0.5) return "< 1 mm";

        return `≈ ${Math.max(1, litros)} mm`;

    }

    const bajo = Math.floor(dia.rango[0]);
    const alto = Math.max(1, Math.ceil(dia.rango[1]));

    if (alto <= 1 && bajo === 0) return "< 1 mm";
    if (bajo === alto) return `≈ ${alto} mm`;

    return `${bajo}–${alto} mm`;

}

function predTextoTemperatura(valor) {

    return `${String(Math.round(valor)).replace("-", "−")}°`;

}
