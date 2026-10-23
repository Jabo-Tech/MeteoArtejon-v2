// ======================================
// CONDICIONES ACTUALES (portada)
// --------------------------------------
// Pide el último dato de la estación al Worker de Cloudflare, que es
// quien guarda las claves de Ecowitt. La web nunca ve esas claves.
// Se refresca solo cada 2 minutos mientras la portada está abierta.
// ======================================

// Dirección del Worker (se rellena cuando esté creado en Cloudflare).
// Mientras esté vacía, o si la web se abre con ?demo, se usan datos de ejemplo.
const DIRECTO_URL = "https://meteoartejon-directo.nasrudinsg03.workers.dev";

const DIRECTO_REFRESCO_MS = 2 * 60 * 1000;
const DIRECTO_CADUCADO_MIN = 15;

const DIRECTO_LAT = 40.795415;
const DIRECTO_LON = -4.2830187;

const DIRECTO_MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];


// ---------- Formatos ----------

function directoNumero(valor, decimales = 1) {

    return valor.toLocaleString("es-ES", {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
    }).replace("-", "−");

}

function directoHoraCorta(fecha) {

    return fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

}

function directoFechaCorta(fecha) {

    const dia = Number(fecha.toLocaleDateString("es-ES", { day: "numeric", timeZone: "Europe/Madrid" }));
    const mes = Number(fecha.toLocaleDateString("es-ES", { month: "numeric", timeZone: "Europe/Madrid" })) - 1;

    return `${dia} ${DIRECTO_MESES[mes]}`;

}


// ---------- Sol y estado del cielo ----------

// Altura del sol sobre el horizonte (grados) en la estación
function directoAlturaSol(fecha) {

    const rad = Math.PI / 180;
    const dias = fecha.getTime() / 86400000 - 10957.5; // días desde J2000

    const g = (357.529 + 0.98560028 * dias) * rad;
    const q = 280.459 + 0.98564736 * dias;
    const l = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad;
    const e = (23.439 - 0.00000036 * dias) * rad;

    const declinacion = Math.asin(Math.sin(e) * Math.sin(l));
    const ascension = Math.atan2(Math.cos(e) * Math.sin(l), Math.cos(l));

    const tsg = (280.46061837 + 360.98564736629 * dias) % 360;
    const angulo = (tsg + DIRECTO_LON) * rad - ascension;
    const lat = DIRECTO_LAT * rad;

    return Math.asin(
        Math.sin(lat) * Math.sin(declinacion) +
        Math.cos(lat) * Math.cos(declinacion) * Math.cos(angulo)
    ) / rad;

}

// La estación no mide nubes. De día se compara la radiación medida con la
// que habría con el cielo despejado; de noche se usa lo que dicen los modelos.
function directoTipoCielo(d, fecha) {

    if (d.intensidadLluvia !== null && d.intensidadLluvia > 0) {
        return d.temperatura !== null && d.temperatura <= 1 ? "nieve" : "lluvia";
    }

    const altura = directoAlturaSol(fecha);

    if (altura > 10 && d.radiacion !== null) {

        // Radiación con cielo despejado (modelo de Haurwitz)
        const cosZ = Math.sin(altura * Math.PI / 180);
        const despejado = 1098 * cosZ * Math.exp(-0.057 / cosZ);
        const fraccion = d.radiacion / despejado;

        if (fraccion >= 0.75) return "sol";
        if (fraccion >= 0.4) return "solnubes";
        return "nubes";

    }

    // Noche o sol muy bajo: icono de la hora en la predicción, si ya está cargada
    const hoy = typeof predEstado !== "undefined" && predEstado.resultado
        ? predEstado.resultado.dias[0]
        : null;

    if (hoy) {

        const hora = Number(directoHoraCorta(fecha).slice(0, 2));
        const fila = hoy.tabla.find(h => Number(h.hora) === hora);

        if (fila) {
            if (altura > 0 && (fila.tipo === "luna" || fila.tipo === "lunanubes")) {
                return fila.tipo === "luna" ? "sol" : "solnubes";
            }
            if (altura <= 0 && (fila.tipo === "sol" || fila.tipo === "solnubes")) {
                return fila.tipo === "sol" ? "luna" : "lunanubes";
            }
            return fila.tipo;
        }

    }

    return altura > 0 ? "solnubes" : "luna";

}

const DIRECTO_NOMBRES_CIELO = {
    sol: "Despejado", solnubes: "Sol y nubes", nubes: "Nublado",
    lluvia: "Lloviendo", nieve: "Nevando", tormenta: "Tormenta", niebla: "Niebla",
    luna: "Noche despejada", lunanubes: "Noche con nubes"
};


// ---------- Datos ----------

function directoDatosEjemplo() {

    return {
        hora: new Date(Date.now() - 3 * 60000).toISOString(),
        temperatura: 17.4,
        maxHoy: 18.9, horaMax: "14:05",
        minHoy: 6.2, horaMin: "07:40",
        humedad: 56,
        viento: 12.2,
        racha: 21.6,
        direccion: 315,
        presion: 1021.3,
        tendenciaPresion: -1.4,
        lluviaHoy: 0,
        intensidadLluvia: 0,
        radiacion: 410
    };

}

async function directoPedir() {

    const demo = !DIRECTO_URL || new URLSearchParams(location.search).has("demo");

    if (demo) return directoDatosEjemplo();

    const respuesta = await fetch(DIRECTO_URL, { cache: "no-store" });

    if (!respuesta.ok) throw new Error(`Worker: ${respuesta.status}`);

    return respuesta.json();

}


// ---------- Dibujo ----------

function directoTextoTendencia(delta) {

    if (delta === null || delta === undefined) return "";

    if (Math.abs(delta) < 0.5) return "→ estable";

    const flecha = delta > 0 ? "↗" : "↘";
    const verbo = delta > 0 ? "sube" : "baja";

    return `${flecha} ${verbo} ${directoNumero(Math.abs(delta))} en 3 h`;

}

let directoUltimo = null;

// Vuelve a pintar el último dato (p. ej. cuando termina de cargar la predicción
// y ya se puede saber si de noche hay nubes)
function directoRepintar() {

    if (directoUltimo) directoPintar(directoUltimo);

}

function directoPintar(d) {

    directoUltimo = d;

    const fecha = new Date(d.hora);
    const minutos = (Date.now() - fecha.getTime()) / 60000;
    const caducado = minutos > DIRECTO_CADUCADO_MIN;

    const cuerpo = document.getElementById("directoCuerpo");
    const hora = document.getElementById("directoHora");

    cuerpo.classList.remove("cargando");
    cuerpo.classList.toggle("caducado", caducado);
    hora.classList.toggle("caducado", caducado);
    hora.classList.remove("error");

    document.getElementById("directoHoraTexto").textContent = caducado
        ? `Sin datos recientes · último: ${directoFechaCorta(fecha)}, ${directoHoraCorta(fecha)}`
        : `Actualizado: ${directoFechaCorta(fecha)}, ${directoHoraCorta(fecha)}`;

    const tipo = directoTipoCielo(d, fecha);

    document.getElementById("directoIcono").innerHTML = predIcono(tipo, 130);
    document.getElementById("directoIcono").setAttribute("aria-label", DIRECTO_NOMBRES_CIELO[tipo]);

    document.getElementById("directoTemp").textContent =
        d.temperatura !== null ? `${directoNumero(d.temperatura)} °C` : "--";

    document.getElementById("directoCielo").textContent = DIRECTO_NOMBRES_CIELO[tipo];

    document.getElementById("directoExtremos").innerHTML = (d.maxHoy !== null && d.minHoy !== null)
        ? `<span class="max" title="Máxima de hoy a las ${d.horaMax}">↑ ${directoNumero(d.maxHoy)}°</span>` +
          `<span class="min" title="Mínima de hoy a las ${d.horaMin}">↓ ${directoNumero(d.minHoy)}°</span>` +
          `<span class="directoExtremosNota">hoy</span>`
        : "&nbsp;";

    document.getElementById("directoHumedad").textContent =
        d.humedad !== null ? `${Math.round(d.humedad)} %` : "--";

    if (d.viento !== null) {

        const calma = d.viento < 1;
        const letras = calma || d.direccion === null ? "" : predLetrasDireccion(d.direccion);

        document.getElementById("directoViento").innerHTML = calma
            ? "Calma"
            : `${Math.round(d.viento)} km/h <span class="directoDir">${letras}</span>${d.direccion !== null ? predFlecha(d.direccion, 18) : ""}`;

    } else {
        document.getElementById("directoViento").textContent = "--";
    }

    document.getElementById("directoRacha").textContent =
        d.racha !== null ? `racha ${Math.round(d.racha)} km/h` : "";

    document.getElementById("directoLluvia").textContent =
        d.lluviaHoy !== null ? `${directoNumero(d.lluviaHoy)} mm` : "--";

    // La intensidad solo aparece mientras llueve
    document.getElementById("directoIntensidad").textContent =
        d.intensidadLluvia > 0 ? `lloviendo ${directoNumero(d.intensidadLluvia)} mm/h` : "";

    document.getElementById("directoPresion").textContent =
        d.presion !== null ? `${Math.round(d.presion).toLocaleString("es-ES", { useGrouping: "always" })} hPa` : "--";

    document.getElementById("directoRadiacion").textContent =
        d.radiacion !== null && d.radiacion !== undefined ? `${Math.round(d.radiacion)} W/m²` : "--";

    const tendencia = document.getElementById("directoTendencia");

    tendencia.textContent = directoTextoTendencia(d.tendenciaPresion);
    tendencia.className = "directoSub" + (d.tendenciaPresion <= -2 ? " aviso" : "");
    tendencia.title = "Cambio de presión en las últimas 3 horas. Una bajada rápida suele anunciar empeoramiento.";

}

function directoError() {

    const hora = document.getElementById("directoHora");

    hora.classList.add("error");

    document.getElementById("directoHoraTexto").textContent =
        "No se puede conectar con la estación ahora mismo";

}

async function cargarDirectoPortada() {

    if (!document.getElementById("directoPortada")) return;

    document.getElementById("directoCuerpo").classList.add("cargando");

    const actualizar = async () => {

        try {
            directoPintar(await directoPedir());
        } catch (error) {
            console.error(error);
            directoError();
        }

    };

    await actualizar();

    setInterval(() => {
        if (document.visibilityState === "visible") actualizar();
    }, DIRECTO_REFRESCO_MS);

}
