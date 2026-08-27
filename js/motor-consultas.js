// ==========================================================
// MOTOR DE CONSULTAS
// Calcula el resultado (número global + desglose por fila)
// para cualquier combinación de variable / indicador /
// granularidad / periodo, sobre el array de registros.
// ==========================================================

const NOMBRES_MES_MOTOR = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

// ----------------------------------------------------------
// 1. VARIABLES CLIMÁTICAS
// ----------------------------------------------------------

const VARIABLES_CONSULTA = [
    { id: "temperatura", nombre: "Temperatura", icono: "🌡" },
    { id: "lluvia", nombre: "Lluvia", icono: "🌧" },
    { id: "viento", nombre: "Viento", icono: "💨" },
    { id: "humedad", nombre: "Humedad", icono: "💧" },
    { id: "presion", nombre: "Presión", icono: "📈" },
    { id: "radiacion", nombre: "Radiación", icono: "☀" }
];

// ----------------------------------------------------------
// 2. INDICADORES POR VARIABLE
// Cada indicador sabe:
//   - granularidades permitidas
//   - unidad
//   - calcularBucket(registrosDelBucket, contexto) -> número (o texto)
//   - calcularGlobal(registrosDelPeriodo, filas, contexto) -> número/texto
// contexto lleva { registrosPeriodo } por si un indicador global
// necesita mirar todo el periodo (ej. "viento cte > media").
// ----------------------------------------------------------

function mediaDe(valores) {

    const limpios = valores.filter(v => v !== null && v !== undefined && !isNaN(v));

    if (limpios.length === 0) return null;

    return limpios.reduce((a, b) => a + b, 0) / limpios.length;

}

function maximoDe(valores) {

    const limpios = valores.filter(v => v !== null && v !== undefined && !isNaN(v));

    if (limpios.length === 0) return null;

    return Math.max(...limpios);

}

function minimoDe(valores) {

    const limpios = valores.filter(v => v !== null && v !== undefined && !isNaN(v));

    if (limpios.length === 0) return null;

    return Math.min(...limpios);

}

function agruparPorFecha(registros) {

    const porFecha = {};

    for (const registro of registros) {

        if (!porFecha[registro.fecha]) porFecha[registro.fecha] = [];

        porFecha[registro.fecha].push(registro);

    }

    return porFecha;

}

// El campo "direccion" del Excel guarda grados (0-360), no letras.
// Reutilizamos el mismo criterio de bucketing que ya usa
// obtenerDireccionPredominante en consultas.js.

function direccionDesdeGrados(grados) {

    const d = Number(grados);

    if (isNaN(d)) return null;

    if (d >= 337.5 || d < 22.5) return "N";
    if (d < 67.5) return "NE";
    if (d < 112.5) return "E";
    if (d < 157.5) return "SE";
    if (d < 202.5) return "S";
    if (d < 247.5) return "SO";
    if (d < 292.5) return "O";

    return "NO";

}

function modaDireccion(registros) {

    const conteo = {};

    for (const registro of registros) {

        const punto = direccionDesdeGrados(registro.direccion);

        if (!punto) continue;

        conteo[punto] = (conteo[punto] || 0) + 1;

    }

    let mejor = null;
    let maximo = 0;

    for (const punto in conteo) {

        if (conteo[punto] > maximo) {
            maximo = conteo[punto];
            mejor = punto;
        }

    }

    return mejor;

}

const INDICADORES_CONSULTA = {

    temperatura: [
        {
            id: "maximo", nombre: "Máximo", unidad: "°C", granularidades: ["hora", "dia", "mes"],
            campo: "temperaturaMax", extremo: "maximo",
            calcularBucket: regs => maximoDe(regs.map(r => r.temperaturaMax)),
            calcularGlobal: (regs, filas) => maximoDe(filas.map(f => f.valor))
        },
        {
            id: "minimo", nombre: "Mínimo", unidad: "°C", granularidades: ["hora", "dia", "mes"],
            campo: "temperaturaMin", extremo: "minimo",
            calcularBucket: regs => minimoDe(regs.map(r => r.temperaturaMin)),
            calcularGlobal: (regs, filas) => minimoDe(filas.map(f => f.valor))
        },
        {
            id: "media", nombre: "Media", unidad: "°C", granularidades: ["hora", "dia", "mes"],
            calcularBucket: regs => mediaDe(regs.map(r => r.temperatura)),
            calcularGlobal: regs => mediaDe(regs.map(r => r.temperatura))
        },
        {
            id: "max25", nombre: "Máximas > 25 ºC", unidad: "días", granularidades: ["dia", "mes"],
            umbral: 25, tipo: "umbralMax"
        },
        {
            id: "max30", nombre: "Máximas > 30 ºC", unidad: "días", granularidades: ["dia", "mes"],
            umbral: 30, tipo: "umbralMax"
        },
        {
            id: "max35", nombre: "Máximas > 35 ºC", unidad: "días", granularidades: ["dia", "mes"],
            umbral: 35, tipo: "umbralMax"
        },
        {
            id: "max40", nombre: "Máximas > 40 ºC", unidad: "días", granularidades: ["dia", "mes"],
            umbral: 40, tipo: "umbralMax"
        },
        {
            id: "minTropical", nombre: "Mínimas > 20 ºC (noche tropical)", unidad: "días", granularidades: ["dia", "mes"],
            umbral: 20, tipo: "umbralMin"
        },
        {
            id: "minTorrida", nombre: "Mínimas > 25 ºC (noche tórrida)", unidad: "días", granularidades: ["dia", "mes"],
            umbral: 25, tipo: "umbralMin"
        },
        {
            id: "minInfernal", nombre: "Mínimas > 30 ºC (noche infernal)", unidad: "días", granularidades: ["dia", "mes"],
            umbral: 30, tipo: "umbralMin"
        },
        {
            id: "helada", nombre: "Mínimas < 0 ºC (helada)", unidad: "días", granularidades: ["dia", "mes"],
            umbral: 0, tipo: "umbralMinBajo"
        },
        {
            id: "gelida", nombre: "Mínimas < -5 ºC (noche gélida)", unidad: "días", granularidades: ["dia", "mes"],
            umbral: -5, tipo: "umbralMinBajo"
        },
        {
            id: "amplitud", nombre: "Máxima amplitud térmica", unidad: "°C", granularidades: ["dia", "mes"],
            tipo: "amplitud"
        },
        {
            id: "olasCalor", nombre: "Olas de calor", unidad: "olas", granularidades: ["mes"],
            tipo: "olasCalor"
        }
    ],

    lluvia: [
        {
            id: "acumulado", nombre: "Precipitación total (acumulado)", unidad: "mm", granularidades: ["dia", "mes"],
            tipo: "lluviaAcumulada"
        },
        {
            id: "masLluvioso", nombre: "Más lluvioso", unidad: "mm", granularidades: ["dia", "mes"],
            tipo: "lluviaMaxima"
        },
        {
            id: "episodios", nombre: "Episodios de lluvia", unidad: "episodios", granularidades: ["dia", "mes"],
            tipo: "episodiosLluvia"
        },
        {
            id: "diasSinLlover", nombre: "Días sin llover (racha máxima)", unidad: "días", granularidades: ["mes"],
            tipo: "diasSinLlover"
        },
        {
            id: "diasSeguidosLloviendo", nombre: "Días seguidos lloviendo (racha máxima)", unidad: "días", granularidades: ["mes"],
            tipo: "diasSeguidosLloviendo"
        },
        {
            id: "intensidadMax", nombre: "Intensidad máxima lluvia", unidad: "mm/h", granularidades: ["hora", "dia", "mes"],
            campo: "intensidadLluvia", extremo: "maximo",
            calcularBucket: regs => maximoDe(regs.map(r => r.intensidadLluvia)),
            calcularGlobal: (regs, filas) => maximoDe(filas.map(f => f.valor))
        },
        {
            id: "minimoIntensidad", nombre: "Mínimo (intensidad)", unidad: "mm/h", granularidades: ["hora", "dia", "mes"],
            campo: "intensidadLluvia", extremo: "minimo",
            calcularBucket: regs => minimoDe(regs.map(r => r.intensidadLluvia)),
            calcularGlobal: (regs, filas) => minimoDe(filas.map(f => f.valor))
        },
        {
            id: "mediaIntensidad", nombre: "Media (intensidad)", unidad: "mm/h", granularidades: ["hora", "dia", "mes"],
            calcularBucket: regs => mediaDe(regs.map(r => r.intensidadLluvia)),
            calcularGlobal: regs => mediaDe(regs.map(r => r.intensidadLluvia))
        }
    ],

    viento: [
        {
            id: "maximo", nombre: "Máximo (racha)", unidad: "km/h", granularidades: ["hora", "dia", "mes"],
            campo: "racha", extremo: "maximo",
            calcularBucket: regs => maximoDe(regs.map(r => r.racha)),
            calcularGlobal: (regs, filas) => maximoDe(filas.map(f => f.valor))
        },
        {
            id: "minimo", nombre: "Mínimo", unidad: "km/h", granularidades: ["hora", "dia", "mes"],
            campo: "viento", extremo: "minimo",
            calcularBucket: regs => minimoDe(regs.map(r => r.viento)),
            calcularGlobal: (regs, filas) => minimoDe(filas.map(f => f.valor))
        },
        {
            id: "media", nombre: "Media", unidad: "km/h", granularidades: ["hora", "dia", "mes"],
            calcularBucket: regs => mediaDe(regs.map(r => r.viento)),
            calcularGlobal: regs => mediaDe(regs.map(r => r.viento))
        },
        {
            id: "direccion", nombre: "Dirección predominante", unidad: "", granularidades: ["hora", "dia", "mes"],
            tipo: "direccionPredominante"
        },
        {
            id: "ctemedia", nombre: "Viento cte > media", unidad: "días", granularidades: ["dia", "mes"],
            tipo: "vientoSobreMedia"
        }
    ],

    humedad: [
        {
            id: "maximo", nombre: "Máximo", unidad: "%", granularidades: ["hora", "dia", "mes"],
            campo: "humedad", extremo: "maximo",
            calcularBucket: regs => maximoDe(regs.map(r => r.humedad)),
            calcularGlobal: (regs, filas) => maximoDe(filas.map(f => f.valor))
        },
        {
            id: "minimo", nombre: "Mínimo", unidad: "%", granularidades: ["hora", "dia", "mes"],
            campo: "humedad", extremo: "minimo",
            calcularBucket: regs => minimoDe(regs.map(r => r.humedad)),
            calcularGlobal: (regs, filas) => minimoDe(filas.map(f => f.valor))
        },
        {
            id: "media", nombre: "Media", unidad: "%", granularidades: ["hora", "dia", "mes"],
            calcularBucket: regs => mediaDe(regs.map(r => r.humedad)),
            calcularGlobal: regs => mediaDe(regs.map(r => r.humedad))
        }
    ],

    presion: [
        {
            id: "maximo", nombre: "Máximo", unidad: "hPa", granularidades: ["hora", "dia", "mes"],
            campo: "presionRelativa", extremo: "maximo",
            calcularBucket: regs => maximoDe(regs.map(r => r.presionRelativa)),
            calcularGlobal: (regs, filas) => maximoDe(filas.map(f => f.valor))
        },
        {
            id: "minimo", nombre: "Mínimo", unidad: "hPa", granularidades: ["hora", "dia", "mes"],
            campo: "presionRelativa", extremo: "minimo",
            calcularBucket: regs => minimoDe(regs.map(r => r.presionRelativa)),
            calcularGlobal: (regs, filas) => minimoDe(filas.map(f => f.valor))
        },
        {
            id: "media", nombre: "Media", unidad: "hPa", granularidades: ["hora", "dia", "mes"],
            calcularBucket: regs => mediaDe(regs.map(r => r.presionRelativa)),
            calcularGlobal: regs => mediaDe(regs.map(r => r.presionRelativa))
        }
    ],

    radiacion: [
        {
            id: "maximo", nombre: "Máximo", unidad: "W/m²", granularidades: ["hora", "dia", "mes"],
            campo: "radiacion", extremo: "maximo",
            calcularBucket: regs => maximoDe(regs.map(r => r.radiacion)),
            calcularGlobal: (regs, filas) => maximoDe(filas.map(f => f.valor))
        },
        {
            id: "minimo", nombre: "Mínimo", unidad: "W/m²", granularidades: ["hora", "dia", "mes"],
            campo: "radiacion", extremo: "minimo",
            calcularBucket: regs => minimoDe(regs.map(r => r.radiacion)),
            calcularGlobal: (regs, filas) => minimoDe(filas.map(f => f.valor))
        },
        {
            id: "media", nombre: "Media", unidad: "W/m²", granularidades: ["hora", "dia", "mes"],
            calcularBucket: regs => mediaDe(regs.map(r => r.radiacion)),
            calcularGlobal: regs => mediaDe(regs.map(r => r.radiacion))
        },
        {
            id: "acumulado", nombre: "Acumulado", unidad: "Wh/m²", granularidades: ["dia", "mes"],
            tipo: "radiacionAcumulada"
        },
        {
            id: "horasSol", nombre: "Horas de sol", unidad: "h", granularidades: ["dia", "mes"],
            tipo: "horasSol"
        }
    ]

};

// ----------------------------------------------------------
// 3. PERIODOS (rango de fechas)
// ----------------------------------------------------------

function calcularRangoPeriodo(periodoId, registros, fechaInicioPersonalizada, fechaFinPersonalizada) {

    const fechas = registros.map(r => r.fecha).sort();
    const fechaMinima = fechas[0];
    const fechaMaxima = fechas[fechas.length - 1];

    if (periodoId === "personalizado") {

        return {
            inicio: fechaInicioPersonalizada || fechaMinima,
            fin: fechaFinPersonalizada || fechaMaxima
        };

    }

    if (periodoId === "todo") {
        return { inicio: fechaMinima, fin: fechaMaxima };
    }

    if (periodoId === "hoy") {
        return { inicio: fechaMaxima, fin: fechaMaxima };
    }

    const fin = new Date(fechaMaxima);
    const inicio = new Date(fechaMaxima);

    if (periodoId === "7dias") inicio.setDate(inicio.getDate() - 6);
    if (periodoId === "semana") inicio.setDate(inicio.getDate() - 6);
    if (periodoId === "mes") inicio.setDate(inicio.getDate() - 29);
    if (periodoId === "año") inicio.setFullYear(inicio.getFullYear() - 1);

    const aISO = d => d.toISOString().substring(0, 10);

    const inicioFinal = aISO(inicio) < fechaMinima ? fechaMinima : aISO(inicio);

    return { inicio: inicioFinal, fin: fechaMaxima };

}

// ----------------------------------------------------------
// 4. AGRUPACIÓN POR GRANULARIDAD
// ----------------------------------------------------------

function claveBucket(registro, granularidad) {

    if (granularidad === "hora") return `${registro.fecha} ${registro.hora.substring(0, 2)}:00`;

    if (granularidad === "mes") return registro.fecha.substring(0, 7);

    return registro.fecha; // "dia"

}

function etiquetaBucket(clave, granularidad) {

    if (granularidad === "mes") {

        const [año, mes] = clave.split("-");

        return `${NOMBRES_MES_MOTOR[Number(mes) - 1]} de ${año}`;

    }

    return clave;

}

function agruparPorGranularidad(registros, granularidad) {

    const grupos = {};

    for (const registro of registros) {

        const clave = claveBucket(registro, granularidad);

        if (!grupos[clave]) grupos[clave] = [];

        grupos[clave].push(registro);

    }

    return Object.keys(grupos).sort().map(clave => ({
        clave,
        etiqueta: etiquetaBucket(clave, granularidad),
        registros: grupos[clave]
    }));

}

// ----------------------------------------------------------
// 5. TIPOS ESPECIALES (indicadores que no son un simple
//    máximo/mínimo/media del propio registro)
// ----------------------------------------------------------

function calcularEspecialBucket(indicador, registrosBucket, contexto) {

    const dias = agruparPorFecha(registrosBucket);

    switch (indicador.tipo) {

        case "umbralMax": {

            let cuenta = 0;

            for (const fecha in dias) {

                const max = maximoDe(dias[fecha].map(r => r.temperaturaMax));

                if (max !== null && max > indicador.umbral) cuenta++;

            }

            return cuenta;

        }

        case "umbralMin": {

            let cuenta = 0;

            for (const fecha in dias) {

                const min = minimoDe(dias[fecha].map(r => r.temperaturaMin));

                if (min !== null && min > indicador.umbral) cuenta++;

            }

            return cuenta;

        }

        case "umbralMinBajo": {

            let cuenta = 0;

            for (const fecha in dias) {

                const min = minimoDe(dias[fecha].map(r => r.temperaturaMin));

                if (min !== null && min < indicador.umbral) cuenta++;

            }

            return cuenta;

        }

        case "amplitud": {

            let mayor = null;
            let fechaMayor = null;

            for (const fecha in dias) {

                const max = maximoDe(dias[fecha].map(r => r.temperaturaMax));
                const min = minimoDe(dias[fecha].map(r => r.temperaturaMin));

                if (max === null || min === null) continue;

                const amplitud = max - min;

                if (mayor === null || amplitud > mayor) {
                    mayor = amplitud;
                    fechaMayor = fecha;
                }

            }

            if (mayor === null) return null;

            return { valor: mayor, meta: { fecha: fechaMayor } };

        }

        case "olasCalor": {

            // Episodio de 3+ días consecutivos con temperatura máxima
            // >= UMBRAL_OLA_CALOR (definido en consultas.js)
            const fechasOrdenadas = Object.keys(dias).sort();

            let olas = 0;
            let racha = 0;

            for (const fecha of fechasOrdenadas) {

                const max = maximoDe(dias[fecha].map(r => r.temperaturaMax));

                if (max !== null && max >= UMBRAL_OLA_CALOR) {

                    racha++;

                } else {

                    if (racha >= 3) olas++;

                    racha = 0;

                }

            }

            if (racha >= 3) olas++;

            return olas;

        }

        case "lluviaAcumulada": {

            let total = 0;

            for (const fecha in dias) {

                total += maximoDe(dias[fecha].map(r => r.lluviaDiaria)) || 0;

            }

            return Number(total.toFixed(1));

        }

        case "lluviaMaxima": {

            const fechas = Object.keys(dias);

            let mayor = 0;
            let fechaMayor = fechas.length > 0 ? fechas[0] : null;

            for (const fecha of fechas) {

                const valor = maximoDe(dias[fecha].map(r => r.lluviaDiaria)) || 0;

                if (valor > mayor) {
                    mayor = valor;
                    fechaMayor = fecha;
                }

            }

            return { valor: mayor, meta: { fecha: fechaMayor } };

        }

        case "episodiosLluvia": {

            // Cuenta tramos consecutivos de registros con intensidadLluvia > 0
            const ordenados = [...registrosBucket].sort((a, b) =>
                (a.fecha + a.hora).localeCompare(b.fecha + b.hora)
            );

            let episodios = 0;
            let lloviendo = false;

            for (const registro of ordenados) {

                const llueve = registro.intensidadLluvia > 0;

                if (llueve && !lloviendo) episodios++;

                lloviendo = llueve;

            }

            return episodios;

        }

        case "diasSinLlover": {

            // Racha más larga de días consecutivos con lluviaDiaria === 0
            // (mismo criterio que la tarjeta de récords de Inicio)
            const fechasOrdenadas = Object.keys(dias).sort();

            let rachaActual = 0;
            let inicioActual = null;
            let mejorRacha = 0;
            let mejorInicio = null;
            let mejorFin = null;

            for (const fecha of fechasOrdenadas) {

                const lluvia = maximoDe(dias[fecha].map(r => r.lluviaDiaria)) || 0;

                if (lluvia === 0) {

                    if (rachaActual === 0) inicioActual = fecha;

                    rachaActual++;

                    if (rachaActual > mejorRacha) {
                        mejorRacha = rachaActual;
                        mejorInicio = inicioActual;
                        mejorFin = fecha;
                    }

                } else {

                    rachaActual = 0;
                    inicioActual = null;

                }

            }

            return { valor: mejorRacha, meta: { inicio: mejorInicio, fin: mejorFin } };

        }

        case "diasSeguidosLloviendo": {

            // Racha más larga de días consecutivos con lluviaDiaria > 0
            // (mismo criterio que la tarjeta de récords de Inicio)
            const fechasOrdenadas = Object.keys(dias).sort();

            let rachaActual = 0;
            let inicioActual = null;
            let mejorRacha = 0;
            let mejorInicio = null;
            let mejorFin = null;

            for (const fecha of fechasOrdenadas) {

                const lluvia = maximoDe(dias[fecha].map(r => r.lluviaDiaria)) || 0;

                if (lluvia > 0) {

                    if (rachaActual === 0) inicioActual = fecha;

                    rachaActual++;

                    if (rachaActual > mejorRacha) {
                        mejorRacha = rachaActual;
                        mejorInicio = inicioActual;
                        mejorFin = fecha;
                    }

                } else {

                    rachaActual = 0;
                    inicioActual = null;

                }

            }

            return { valor: mejorRacha, meta: { inicio: mejorInicio, fin: mejorFin } };

        }

        case "direccionPredominante": {

            return modaDireccion(registrosBucket);

        }

        case "vientoSobreMedia": {

            const mediaPeriodo = contexto.mediaVientoPeriodo;

            let cuenta = 0;

            for (const fecha in dias) {

                const mediaDia = mediaDe(dias[fecha].map(r => r.viento));

                if (mediaDia !== null && mediaPeriodo !== null && mediaDia > mediaPeriodo) cuenta++;

            }

            return cuenta;

        }

        case "radiacionAcumulada": {

            let total = 0;

            for (const registro of registrosBucket) {

                const valor = Number(registro.radiacion);

                if (!isNaN(valor)) total += valor * 0.5; // W/m² -> Wh/m² (intervalos de 30 min)

            }

            return Number(total.toFixed(1));

        }

        case "horasSol": {

            const UMBRAL_SOL = 120; // W/m², convención habitual (OMM)

            let registrosSol = 0;

            for (const registro of registrosBucket) {

                if (Number(registro.radiacion) > UMBRAL_SOL) registrosSol++;

            }

            return Number((registrosSol * 0.5).toFixed(1));

        }

        default:
            return null;

    }

}

function calcularEspecialGlobal(indicador, filas, registrosPeriodo) {

    switch (indicador.tipo) {

        case "umbralMax":
        case "umbralMin":
        case "umbralMinBajo":
        case "episodiosLluvia":
        case "olasCalor":
            return filas.reduce((suma, f) => suma + (f.valor || 0), 0);

        case "amplitud":
        case "diasSinLlover":
        case "diasSeguidosLloviendo":
        case "lluviaMaxima": {

            let mejorFila = null;

            for (const fila of filas) {

                if (mejorFila === null || fila.valor > mejorFila.valor) {
                    mejorFila = fila;
                }

            }

            if (!mejorFila) return null;

            return { valor: mejorFila.valor, meta: mejorFila.meta };

        }

        case "lluviaAcumulada":
            return Number(filas.reduce((suma, f) => suma + (f.valor || 0), 0).toFixed(1));

        case "direccionPredominante": {

            return modaDireccion(registrosPeriodo);

        }

        case "vientoSobreMedia":
            return filas.reduce((suma, f) => suma + (f.valor || 0), 0);

        case "radiacionAcumulada":
            return Number(filas.reduce((suma, f) => suma + (f.valor || 0), 0).toFixed(1));

        case "horasSol":
            return Number(filas.reduce((suma, f) => suma + (f.valor || 0), 0).toFixed(1));

        default:
            return null;

    }

}

// ----------------------------------------------------------
// 6. FUNCIÓN PRINCIPAL
// ----------------------------------------------------------

function encontrarFechaExtremo(registrosPeriodo, campo, extremo) {

    let mejor = null;

    for (const registro of registrosPeriodo) {

        const valor = Number(registro[campo]);

        if (isNaN(valor)) continue;

        const esMejor = mejor === null ||
            (extremo === "maximo" && valor > mejor.valor) ||
            (extremo === "minimo" && valor < mejor.valor);

        if (esMejor) {
            mejor = { valor, fecha: registro.fecha, hora: registro.hora };
        }

    }

    return mejor;

}

function ejecutarConsultaAvanzada(registros, opciones) {

    const { variableId, indicadorId, granularidad, periodoId, fechaInicio, fechaFin } = opciones;

    const indicador = INDICADORES_CONSULTA[variableId].find(i => i.id === indicadorId);

    const rango = calcularRangoPeriodo(periodoId, registros, fechaInicio, fechaFin);

    const registrosPeriodo = registros.filter(r => r.fecha >= rango.inicio && r.fecha <= rango.fin);

    if (registrosPeriodo.length === 0) {

        return {
            indicador,
            rango,
            resumen: { valor: null, unidad: indicador.unidad },
            filas: [],
            fechaOcurrencia: null
        };

    }

    // Contexto extra que algunos indicadores especiales necesitan
    const contexto = {
        mediaVientoPeriodo: mediaDe(registrosPeriodo.map(r => r.viento))
    };

    const buckets = agruparPorGranularidad(registrosPeriodo, granularidad);

    const filas = buckets.map(bucket => {

        const resultadoBucket = indicador.tipo
            ? calcularEspecialBucket(indicador, bucket.registros, contexto)
            : indicador.calcularBucket(bucket.registros);

        // Algunos indicadores especiales devuelven { valor, meta } para
        // poder arrastrar el día/rango exacto del extremo; los demás
        // devuelven directamente el número.
        const esObjeto = resultadoBucket !== null && typeof resultadoBucket === "object";

        return {
            etiqueta: bucket.etiqueta,
            valor: esObjeto ? resultadoBucket.valor : resultadoBucket,
            meta: esObjeto ? resultadoBucket.meta : null
        };

    }).filter(fila => fila.valor !== null);

    const resultadoGlobal = indicador.tipo
        ? calcularEspecialGlobal(indicador, filas, registrosPeriodo)
        : indicador.calcularGlobal(registrosPeriodo, filas, contexto);

    const globalEsObjeto = resultadoGlobal !== null && typeof resultadoGlobal === "object";

    const valorGlobal = globalEsObjeto ? resultadoGlobal.valor : resultadoGlobal;
    const metaGlobal = globalEsObjeto ? resultadoGlobal.meta : null;

    // Para indicadores simples de máximo/mínimo (campo + extremo definidos),
    // buscamos también el día y hora exactos en que se produjo ese valor.
    let fechaOcurrencia = null;

    if (indicador.campo && indicador.extremo) {

        const encontrado = encontrarFechaExtremo(registrosPeriodo, indicador.campo, indicador.extremo);

        if (encontrado) {
            fechaOcurrencia = { fecha: encontrado.fecha, hora: encontrado.hora };
        }

    } else if (metaGlobal) {

        if (metaGlobal.inicio && metaGlobal.fin) {
            fechaOcurrencia = { inicio: metaGlobal.inicio, fin: metaGlobal.fin };
        } else if (metaGlobal.fecha) {
            fechaOcurrencia = { fecha: metaGlobal.fecha };
        }

    }

    return {
        indicador,
        rango,
        resumen: { valor: valorGlobal, unidad: indicador.unidad },
        filas,
        fechaOcurrencia
    };

}
