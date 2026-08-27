function obtenerPeriodoDisponible(registros) {

    return {
        inicio: registros[0].fecha,
        fin: registros[registros.length - 1].fecha,
        registros: registros.length
    };

}
// ========================================
// INFORMACIÓN GENERAL
// ========================================

function obtenerPeriodoDisponible(registros) {

    return {
        inicio: registros[0].fecha,
        fin: registros[registros.length - 1].fecha,
        registros: registros.length
    };

}

function obtenerUltimaActualizacion(registros) {

    const ultimo = registros[registros.length - 1];

    return {
        fecha: ultimo.fecha,
        hora: ultimo.hora
    };

}

// ========================================
// TEMPERATURA
// ========================================

function obtenerTemperaturaMaximaAbsoluta(registros) {

    let maxima = registros[0];

    for (const registro of registros) {

        if (registro.temperaturaMax > maxima.temperaturaMax) {
            maxima = registro;
        }

    }

    return {
        valor: maxima.temperaturaMax,
        fecha: maxima.fecha,
        hora: maxima.hora
    };

}

function obtenerTemperaturaMinimaAbsoluta(registros) {

    let minima = registros[0];

    for (const registro of registros) {

        if (registro.temperaturaMin < minima.temperaturaMin) {
            minima = registro;
        }

    }

    return {
        valor: minima.temperaturaMin,
        fecha: minima.fecha,
        hora: minima.hora
    };

}

function obtenerMaximaAmplitudTermica(registros) {

    const dias = {};

    for (const registro of registros) {

        if (!dias[registro.fecha]) {

            dias[registro.fecha] = {
                maxima: registro.temperaturaMax,
                minima: registro.temperaturaMin
            };

        } else {

            if (registro.temperaturaMax > dias[registro.fecha].maxima) {
                dias[registro.fecha].maxima = registro.temperaturaMax;
            }

            if (registro.temperaturaMin < dias[registro.fecha].minima) {
                dias[registro.fecha].minima = registro.temperaturaMin;
            }

        }

    }

    let mejorFecha = null;
    let mayorAmplitud = -Infinity;

    for (const fecha in dias) {

        const amplitud = dias[fecha].maxima - dias[fecha].minima;

        if (amplitud > mayorAmplitud) {
            mayorAmplitud = amplitud;
            mejorFecha = fecha;
        }

    }

    return {
        valor: mayorAmplitud,
        fecha: mejorFecha
    };

}
function obtenerMaximaAmplitudTermicaAñoActual(registros) {

    const ultimoAño = Math.max(
        ...registros.map(r => Number(r.fecha.substring(0, 4)))
    );

    const registrosAño = registros.filter(registro =>
        Number(registro.fecha.substring(0, 4)) === ultimoAño
    );

    return obtenerMaximaAmplitudTermica(registrosAño);

}

// ========================================
// VIENTO
// ========================================

function obtenerRachaMaximaViento(registros) {

    let maxima = registros[0];

    for (const registro of registros) {

        if (registro.racha > maxima.racha) {
            maxima = registro;
        }

    }

    return {
        valor: maxima.racha,
        fecha: maxima.fecha,
        hora: maxima.hora
    };

// ========================================
// DIAS LLOVIENDO
// ========================================

}
function obtenerMayorRachaDiasLloviendo(registros) {

    const dias = {};

    // Obtener la lluvia de cada día
    for (const registro of registros) {

        if (!(registro.fecha in dias)) {

    dias[registro.fecha] = registro.lluviaDiaria;

} else {

    if (registro.lluviaDiaria > dias[registro.fecha]) {
        dias[registro.fecha] = registro.lluviaDiaria;
    }

}

    }

    const fechas = Object.keys(dias).sort();

    let rachaActual = 0;
    let mejorRacha = 0;
    let fechaInicio = null;
    let mejorInicio = null;
    let mejorFin = null;

    for (const fecha of fechas) {

        if (dias[fecha] > 0) {

            if (rachaActual === 0) {
                fechaInicio = fecha;
            }

            rachaActual++;

            if (rachaActual > mejorRacha) {

                mejorRacha = rachaActual;
                mejorInicio = fechaInicio;
                mejorFin = fecha;

            }

        } else {

            rachaActual = 0;

        }

    }

    return {
        valor: mejorRacha,
        inicio: mejorInicio,
        fin: mejorFin
    };

}

// ========================================
// DIAS SIN LLOVER
// ========================================

function obtenerMayorRachaDiasSinLlover(registros) {

    const dias = {};

    // Obtener la lluvia final de cada día
    for (const registro of registros) {

        if (!(registro.fecha in dias)) {

            dias[registro.fecha] = registro.lluviaDiaria;

        } else {

            if (registro.lluviaDiaria > dias[registro.fecha]) {
                dias[registro.fecha] = registro.lluviaDiaria;
            }

        }

    }

    const fechas = Object.keys(dias).sort();

    let rachaActual = 0;
    let mejorRacha = 0;
    let fechaInicio = null;
    let mejorInicio = null;
    let mejorFin = null;

    for (const fecha of fechas) {

        if (dias[fecha] === 0) {

            if (rachaActual === 0) {
                fechaInicio = fecha;
            }

            rachaActual++;

            if (rachaActual > mejorRacha) {

                mejorRacha = rachaActual;
                mejorInicio = fechaInicio;
                mejorFin = fecha;

            }

        } else {

            rachaActual = 0;

        }

    }

    return {
        valor: mejorRacha,
        inicio: mejorInicio,
        fin: mejorFin
    };

}

// ========================================
// RADIACIÓN MÁXIMA DIARIA
// ========================================


function obtenerMaximaRadiacionDiaria(registros) {

    const dias = {};

    // Acumular la energía solar diaria (Wh/m²)
    for (const registro of registros) {

        if (!(registro.fecha in dias)) {
            dias[registro.fecha] = 0;
        }

        // Cada registro representa 30 minutos
        dias[registro.fecha] += registro.radiacion * 0.5;

    }

    let mejorFecha = null;
    let maximaRadiacion = -Infinity;

    for (const fecha in dias) {

        if (dias[fecha] > maximaRadiacion) {

            maximaRadiacion = dias[fecha];
            mejorFecha = fecha;

        }

    }

    return {
        valor: Number(maximaRadiacion.toFixed(1)),
        fecha: mejorFecha
    };

}
function obtenerDireccionPredominante(registros) {

    const conteo = {
        N: 0,
        NE: 0,
        E: 0,
        SE: 0,
        S: 0,
        SO: 0,
        O: 0,
        NO: 0
    };

    for (const registro of registros) {

        const d = registro.direccion;

        if (d >= 337.5 || d < 22.5) {
            conteo.N++;
        } else if (d < 67.5) {
            conteo.NE++;
        } else if (d < 112.5) {
            conteo.E++;
        } else if (d < 157.5) {
            conteo.SE++;
        } else if (d < 202.5) {
            conteo.S++;
        } else if (d < 247.5) {
            conteo.SO++;
        } else if (d < 292.5) {
            conteo.O++;
        } else {
            conteo.NO++;
        }

    }

    let direccion = "";
    let maximo = 0;

    for (const punto in conteo) {

        if (conteo[punto] > maximo) {
            maximo = conteo[punto];
            direccion = punto;
        }

    }

    return {
        valor: direccion,
        porcentaje: Number((100 * maximo / registros.length).toFixed(1)),
        frecuencias: conteo
    };

}

// ========================================
// FILTRO: SOLO EL AÑO EN CURSO
// ========================================

function obtenerRegistrosAñoActual(registros) {

    const añoActual = registros[registros.length - 1].fecha.substring(0, 4);

    return registros.filter(registro =>
        registro.fecha.substring(0, 4) === añoActual
    );

}

const NOMBRES_DIRECCION = {
    N: "Norte",
    NE: "Noreste",
    E: "Este",
    SE: "Sureste",
    S: "Sur",
    SO: "Suroeste",
    O: "Oeste",
    NO: "Noroeste"
};

function obtenerNombreDireccion(abreviatura) {
    return NOMBRES_DIRECCION[abreviatura] || abreviatura;
}

function obtenerTemperaturaMaximaAñoActual(registros) {
    return obtenerTemperaturaMaximaAbsoluta(obtenerRegistrosAñoActual(registros));
}

function obtenerTemperaturaMinimaAñoActual(registros) {
    return obtenerTemperaturaMinimaAbsoluta(obtenerRegistrosAñoActual(registros));
}

function obtenerRachaMaximaVientoAñoActual(registros) {
    return obtenerRachaMaximaViento(obtenerRegistrosAñoActual(registros));
}

function obtenerMaximaRadiacionDiariaAñoActual(registros) {
    return obtenerMaximaRadiacionDiaria(obtenerRegistrosAñoActual(registros));
}

function obtenerDireccionPredominanteAñoActual(registros) {
    return obtenerDireccionPredominante(obtenerRegistrosAñoActual(registros));
}

// ========================================
// RACHAS EN CURSO (hasta el último registro)
// ========================================

function obtenerRachaActualDiasSinLlover(registros) {

    const dias = {};

    for (const registro of registros) {

        if (!(registro.fecha in dias) || registro.lluviaDiaria > dias[registro.fecha]) {
            dias[registro.fecha] = registro.lluviaDiaria;
        }

    }

    const fechas = Object.keys(dias).sort();

    let racha = 0;
    let inicio = null;

    for (let i = fechas.length - 1; i >= 0; i--) {

        const fecha = fechas[i];

        if (dias[fecha] === 0) {

            racha++;
            inicio = fecha;

        } else {
            break;
        }

    }

    return {
        valor: racha,
        inicio: inicio,
        fin: fechas[fechas.length - 1]
    };

}

function obtenerRachaActualDiasLloviendo(registros) {

    const dias = {};

    for (const registro of registros) {

        if (!(registro.fecha in dias) || registro.lluviaDiaria > dias[registro.fecha]) {
            dias[registro.fecha] = registro.lluviaDiaria;
        }

    }

    const fechas = Object.keys(dias).sort();

    let racha = 0;
    let inicio = null;

    for (let i = fechas.length - 1; i >= 0; i--) {

        const fecha = fechas[i];

        if (dias[fecha] > 0) {

            racha++;
            inicio = fecha;

        } else {
            break;
        }

    }

    return {
        valor: racha,
        inicio: inicio,
        fin: fechas[fechas.length - 1]
    };

}


// ========================================
// OLAS DE CALOR
// Criterio AEMET: episodio de 3+ días consecutivos con temperatura
// máxima >= umbral. 35.4°C es una aproximación razonada para esta
// ubicación (meseta a ~1000m), no el valor oficial exacto de AEMET
// para esta estación concreta — ajustar si se consigue el dato real.
// ========================================

const UMBRAL_OLA_CALOR = 35.4;

function obtenerRachaActualOlaCalor(registros) {

    const dias = {};

    for (const registro of registros) {

        if (!(registro.fecha in dias) || registro.temperaturaMax > dias[registro.fecha]) {
            dias[registro.fecha] = registro.temperaturaMax;
        }

    }

    const fechas = Object.keys(dias).sort();

    let racha = 0;
    let inicio = null;

    for (let i = fechas.length - 1; i >= 0; i--) {

        const fecha = fechas[i];

        if (dias[fecha] >= UMBRAL_OLA_CALOR) {

            racha++;
            inicio = fecha;

        } else {
            break;
        }

    }

    return {
        valor: racha,
        inicio: inicio,
        fin: fechas[fechas.length - 1]
    };

}
