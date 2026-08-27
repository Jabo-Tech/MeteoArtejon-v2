function obtenerPrimerDiaSuperaTemperatura(registros, temperatura) {

    const dias = {};

    // Temperatura máxima de cada día
    for (const registro of registros) {

        if (!(registro.fecha in dias) || registro.temperaturaMax > dias[registro.fecha]) {
            dias[registro.fecha] = registro.temperaturaMax;
        }

    }

    // Primer día que supera la temperatura en cada año
    const primerosPorAño = {};

    const fechas = Object.keys(dias).sort();

    for (const fecha of fechas) {

        if (dias[fecha] < temperatura) continue;

        const año = fecha.substring(0, 4);

        if (!(año in primerosPorAño)) {

            primerosPorAño[año] = {
                fecha: fecha,
                valor: dias[fecha]
            };

        }

    }

    // Buscar el más temprano de todos los años
    let mejor = null;

    for (const año in primerosPorAño) {

        const dato = primerosPorAño[año];

        // MM-DD
        const mesDia = dato.fecha.substring(5);

        if (!mejor || mesDia < mejor.fecha.substring(5)) {

            mejor = {
                año: año,
                fecha: dato.fecha,
                valor: dato.valor
            };

        }

    }

    return mejor;

}

function obtenerUltimoDiaSuperaTemperatura(registros, temperatura) {

    const dias = {};

    // Temperatura máxima de cada día
    for (const registro of registros) {

        if (!(registro.fecha in dias) || registro.temperaturaMax > dias[registro.fecha]) {
            dias[registro.fecha] = registro.temperaturaMax;
        }

    }

    // Último día que supera la temperatura en cada año
    const ultimosPorAño = {};

    const fechas = Object.keys(dias).sort().reverse();

    for (const fecha of fechas) {

        if (dias[fecha] < temperatura) continue;

        const año = fecha.substring(0, 4);

        if (!(año in ultimosPorAño)) {

            ultimosPorAño[año] = {
                fecha: fecha,
                valor: dias[fecha]
            };

        }

    }

    // Buscar el más tardío de todos los años
    let mejor = null;

    for (const año in ultimosPorAño) {

        const dato = ultimosPorAño[año];

        const mesDia = dato.fecha.substring(5);

        if (!mejor || mesDia > mejor.fecha.substring(5)) {

            mejor = {
                año: año,
                fecha: dato.fecha,
                valor: dato.valor
            };

        }

    }

    return mejor;

}
function obtenerAñoMasLluvioso(registros) {

    const lluviaPorAño = {};

    // El año en curso está incompleto: no es comparable con años enteros
    const añoActual = registros[registros.length - 1].fecha.substring(0, 4);

    for (const registro of registros) {

        const año = registro.fecha.substring(0, 4);

        if (año === añoActual) continue;

        if (!(año in lluviaPorAño) || registro.lluviaAnual > lluviaPorAño[año]) {
            lluviaPorAño[año] = registro.lluviaAnual;
        }

    }

    let mejorAño = null;
    let mayorLluvia = -1;

    for (const año in lluviaPorAño) {

        if (lluviaPorAño[año] > mayorLluvia) {

            mayorLluvia = lluviaPorAño[año];
            mejorAño = año;

        }

    }

    return {
        año: mejorAño,
        lluvia: mayorLluvia
    };

}
function obtenerMesMasLluvioso(registros) {

    const lluviaPorMes = {};

    // El mes en curso está incompleto: no es comparable con meses enteros
    const mesActual = registros[registros.length - 1].fecha.substring(0, 7);

    for (const registro of registros) {

        const mes = registro.fecha.substring(0, 7);

        if (mes === mesActual) continue;

        if (!(mes in lluviaPorMes) || registro.lluviaMensual > lluviaPorMes[mes]) {
            lluviaPorMes[mes] = registro.lluviaMensual;
        }

    }

    let mejorMes = null;
    let mayorLluvia = -1;

    for (const mes in lluviaPorMes) {

        if (lluviaPorMes[mes] > mayorLluvia) {

            mayorLluvia = lluviaPorMes[mes];
            mejorMes = mes;

        }

    }

    return {
        mes: mejorMes,
        lluvia: mayorLluvia
    };

}
function obtenerDiaMasLluvioso(registros) {

    const lluviaPorDia = {};

    for (const registro of registros) {

        if (!(registro.fecha in lluviaPorDia) || registro.lluviaDiaria > lluviaPorDia[registro.fecha]) {
            lluviaPorDia[registro.fecha] = registro.lluviaDiaria;
        }

    }

    let mejorDia = null;
    let mayorLluvia = -1;

    for (const fecha in lluviaPorDia) {

        if (lluviaPorDia[fecha] > mayorLluvia) {

            mayorLluvia = lluviaPorDia[fecha];
            mejorDia = fecha;

        }

    }

    return {
        fecha: mejorDia,
        lluvia: mayorLluvia
    };

}

function obtenerPrimeraHeladaTemporada(registros) {

    const dias = {};

    for (const registro of registros) {

        if (!(registro.fecha in dias) || registro.temperaturaMin < dias[registro.fecha]) {
            dias[registro.fecha] = registro.temperaturaMin;
        }

    }

    const primerasPorAño = {};

    const fechas = Object.keys(dias).sort();

    for (const fecha of fechas) {

        const año = fecha.substring(0, 4);
        const mes = Number(fecha.substring(5, 7));

        // Solo buscamos a partir de julio
        if (mes < 7) continue;

        if (dias[fecha] >= 0) continue;

        if (!(año in primerasPorAño)) {

            primerasPorAño[año] = {
                fecha,
                valor: dias[fecha]
            };

        }

    }

    let mejor = null;

    for (const año in primerasPorAño) {

        const dato = primerasPorAño[año];

        if (!mejor || dato.fecha.substring(5) < mejor.fecha.substring(5)) {

            mejor = {
                año,
                fecha: dato.fecha,
                valor: dato.valor
            };

        }

    }

    return mejor;

}

function obtenerUltimaHeladaTemporada(registros) {

    const dias = {};

    for (const registro of registros) {

        if (!(registro.fecha in dias) || registro.temperaturaMin < dias[registro.fecha]) {
            dias[registro.fecha] = registro.temperaturaMin;
        }

    }

    const ultimasPorAño = {};

    const fechas = Object.keys(dias).sort().reverse();

    for (const fecha of fechas) {

        const año = fecha.substring(0, 4);
        const mes = Number(fecha.substring(5, 7));

        // Solo buscamos hasta junio
        if (mes > 6) continue;

        if (dias[fecha] >= 0) continue;

        if (!(año in ultimasPorAño)) {

            ultimasPorAño[año] = {
                fecha,
                valor: dias[fecha]
            };

        }

    }

    let mejor = null;

    for (const año in ultimasPorAño) {

        const dato = ultimasPorAño[año];

        if (!mejor || dato.fecha.substring(5) > mejor.fecha.substring(5)) {

            mejor = {
                año,
                fecha: dato.fecha,
                valor: dato.valor
            };

        }

    }

    return mejor;

}

function obtenerVeranoMasCaluroso(registros) {

    const veranos = {};

    // El verano en curso (si estamos en jun-ago) está incompleto
    const ultima = registros[registros.length - 1].fecha;
    const añoActual = ultima.substring(0, 4);
    const mesActualNum = Number(ultima.substring(5, 7));
    const veranoEnCurso = (mesActualNum >= 6 && mesActualNum <= 8) ? añoActual : null;

    for (const registro of registros) {

        const mes = Number(registro.fecha.substring(5, 7));

        // Solo junio, julio y agosto
        if (mes < 6 || mes > 8) continue;

        const año = registro.fecha.substring(0, 4);

        if (año === veranoEnCurso) continue;

        const temperatura = Number(registro.temperatura);

        // Ignorar valores no válidos
        if (isNaN(temperatura)) continue;

        if (!(año in veranos)) {

            veranos[año] = {
                suma: 0,
                registros: 0
            };

        }

        veranos[año].suma += temperatura;
        veranos[año].registros++;

    }

    let mejor = null;

    for (const año in veranos) {

        if (veranos[año].registros === 0) continue;

        const media = veranos[año].suma / veranos[año].registros;

        if (mejor === null || media > mejor.media) {

            mejor = {
                año: año,
                media: media
            };

        }

    }

    return mejor;

}

function obtenerEventosLluvia(registros) {

    const eventos = [];

    let enEvento = false;
    let inicio = null;
    let lluviaInicio = 0;

    for (let i = 0; i < registros.length; i++) {

        const registro = registros[i];

        if (registro.intensidadLluvia > 0) {

            if (!enEvento) {

                enEvento = true;

                inicio = registro;

                lluviaInicio = registro.lluviaAnual;

            }

        } else {

            if (enEvento) {

                const fin = registros[i - 1];

                eventos.push({
                    inicio,
                    fin,
                    duracion: new Date(`${fin.fecha}T${fin.hora}`) - new Date(`${inicio.fecha}T${inicio.hora}`),
                    lluvia: fin.lluviaAnual - lluviaInicio
                });

                enEvento = false;

            }

        }

    }

    // Si termina lloviendo en el último registro
    if (enEvento) {

        const fin = registros[registros.length - 1];

        eventos.push({
            inicio,
            fin,
            duracion: new Date(`${fin.fecha}T${fin.hora}`) - new Date(`${inicio.fecha}T${inicio.hora}`),
            lluvia: fin.lluviaAnual - lluviaInicio
        });

    }

    return eventos;

}

function obtenerEventoLluviaMasLargo(registros) {

    const eventos = obtenerEventosLluvia(registros);

    return eventos.reduce((mejor, actual) =>
        actual.duracion > mejor.duracion ? actual : mejor
    );

}

function obtenerEventoLluviaMasLluvioso(registros) {

    const eventos = obtenerEventosLluvia(registros);

    return eventos.reduce((mejor, actual) =>
        actual.lluvia > mejor.lluvia ? actual : mejor
    );

}
function obtenerMesMasVentoso(registros) {

    const meses = {};

    // El mes en curso está incompleto: no es comparable con meses enteros
    const mesActual = registros[registros.length - 1].fecha.substring(0, 7);

    for (const registro of registros) {

        const viento = Number(registro.viento);

        if (isNaN(viento)) continue;

        const año = registro.fecha.substring(0, 4);
        const mes = registro.fecha.substring(5, 7);

        const clave = `${año}-${mes}`;

        if (clave === mesActual) continue;

        if (!meses[clave]) {

            meses[clave] = {
                suma: 0,
                registros: 0
            };

        }

        meses[clave].suma += viento;
        meses[clave].registros++;

    }

    let mejorClave = null;
    let mejorMedia = -Infinity;

    for (const clave in meses) {

        const media = meses[clave].suma / meses[clave].registros;

        if (media > mejorMedia) {

            mejorMedia = media;
            mejorClave = clave;

        }

    }

    if (!mejorClave) return null;

    const nombresMes = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];

    const año = mejorClave.substring(0, 4);
    const mes = Number(mejorClave.substring(5, 7));

    return {
        mes: `${nombresMes[mes - 1]} de ${año}`,
        media: mejorMedia
    };

}

function obtenerAñoMasSoleado(registros) {

    const años = {};

    // El año en curso está incompleto: no es comparable con años enteros
    const añoActual = registros[registros.length - 1].fecha.substring(0, 4);

    for (const registro of registros) {

        const radiacion = Number(registro.radiacion);

        if (isNaN(radiacion)) continue;

        const año = registro.fecha.substring(0, 4);

        if (año === añoActual) continue;

        if (!años[año]) {
            años[año] = 0;
        }

        años[año] += radiacion * 0.5; // W/m² -> Wh/m² (intervalos de 30 min)

    }

    let mejorAño = null;
    let mayorRadiacion = -Infinity;

    for (const año in años) {

        if (años[año] > mayorRadiacion) {

            mayorRadiacion = años[año];
            mejorAño = año;

        }

    }

    if (!mejorAño) return null;

    return {
        año: mejorAño,
        radiacion: mayorRadiacion
    };

}

function obtenerAñoMasCalido(registros) {

    const años = {};

    // El año en curso está incompleto: no es comparable con años enteros
    const añoActual = registros[registros.length - 1].fecha.substring(0, 4);

    for (const registro of registros) {

        const temperatura = Number(registro.temperatura);

        if (isNaN(temperatura)) continue;

        const año = registro.fecha.substring(0, 4);

        if (año === añoActual) continue;

        if (!años[año]) {

            años[año] = {
                suma: 0,
                registros: 0
            };

        }

        años[año].suma += temperatura;
        años[año].registros++;

    }

    let mejorAño = null;
    let mejorMedia = -Infinity;

    for (const año in años) {

        const media = años[año].suma / años[año].registros;

        if (media > mejorMedia) {

            mejorMedia = media;
            mejorAño = año;

        }

    }

    if (!mejorAño) return null;

    return {
        año: mejorAño,
        media: mejorMedia
    };

}

function obtenerMesMasCaluroso(registros) {

    const meses = {};

    // El mes en curso está incompleto: no es comparable con meses enteros
    const mesActual = registros[registros.length - 1].fecha.substring(0, 7);

    for (const registro of registros) {

        const temperatura = Number(registro.temperatura);

        if (isNaN(temperatura)) continue;

        const año = registro.fecha.substring(0, 4);
        const mes = registro.fecha.substring(5, 7);

        const clave = `${año}-${mes}`;

        if (clave === mesActual) continue;

        if (!meses[clave]) {

            meses[clave] = {
                suma: 0,
                registros: 0
            };

        }

        meses[clave].suma += temperatura;
        meses[clave].registros++;

    }

    let mejorClave = null;
    let mejorMedia = -Infinity;

    for (const clave in meses) {

        const media = meses[clave].suma / meses[clave].registros;

        if (media > mejorMedia) {

            mejorMedia = media;
            mejorClave = clave;

        }

    }

    if (!mejorClave) return null;

    const nombresMes = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];

    const año = mejorClave.substring(0, 4);
    const mes = Number(mejorClave.substring(5, 7));

    return {
        mes: `${nombresMes[mes - 1]} de ${año}`,
        media: mejorMedia
    };

}

function obtenerVeranoMasNochesTropicales(registros) {

    const dias = {};

    // Obtener la temperatura mínima diaria
    for (const registro of registros) {

        const temperaturaMin = Number(registro.temperaturaMin);

        if (isNaN(temperaturaMin)) continue;

        const fecha = registro.fecha;

        if (!dias[fecha]) {

            dias[fecha] = temperaturaMin;

        } else {

            dias[fecha] = Math.min(dias[fecha], temperaturaMin);

        }

    }

    // Contar noches tropicales por verano
    const veranos = {};

    // El verano en curso (si estamos en jun-ago) está incompleto
    const ultima = registros[registros.length - 1].fecha;
    const añoActualN = ultima.substring(0, 4);
    const mesActualNumN = Number(ultima.substring(5, 7));
    const veranoEnCursoN = (mesActualNumN >= 6 && mesActualNumN <= 8) ? añoActualN : null;

    for (const fecha in dias) {

        const año = fecha.substring(0, 4);
        const mes = Number(fecha.substring(5, 7));

        // Solo junio, julio y agosto
        if (mes < 6 || mes > 8) continue;

        if (año === veranoEnCursoN) continue;

        if (!veranos[año]) {

            veranos[año] = 0;

        }

        if (dias[fecha] >= 20) {

            veranos[año]++;

        }

    }

    let mejorAño = null;
    let mayorNumero = -1;

    for (const año in veranos) {

        if (veranos[año] > mayorNumero) {

            mayorNumero = veranos[año];
            mejorAño = año;

        }

    }

    if (!mejorAño) return null;

    return {
        año: mejorAño,
        noches: mayorNumero
    };

}
function obtenerVeranoMasNochesTorridas(registros) {

    const dias = {};

    // Obtener la temperatura mínima diaria
    for (const registro of registros) {

        const temperaturaMin = Number(registro.temperaturaMin);

        if (isNaN(temperaturaMin)) continue;

        const fecha = registro.fecha;

        if (!dias[fecha]) {

            dias[fecha] = temperaturaMin;

        } else {

            dias[fecha] = Math.min(dias[fecha], temperaturaMin);

        }

    }

    // Contar noches tórridas por verano
    const veranos = {};

    // El verano en curso (si estamos en jun-ago) está incompleto
    const ultima = registros[registros.length - 1].fecha;
    const añoActualN = ultima.substring(0, 4);
    const mesActualNumN = Number(ultima.substring(5, 7));
    const veranoEnCursoN = (mesActualNumN >= 6 && mesActualNumN <= 8) ? añoActualN : null;

    for (const fecha in dias) {

        const año = fecha.substring(0, 4);
        const mes = Number(fecha.substring(5, 7));

        // Solo junio, julio y agosto
        if (mes < 6 || mes > 8) continue;

        if (año === veranoEnCursoN) continue;

        if (!veranos[año]) {

            veranos[año] = 0;

        }

        if (dias[fecha] >= 25) {

            veranos[año]++;

        }

    }

    let mejorAño = null;
    let mayorNumero = -1;

    for (const año in veranos) {

        if (veranos[año] > mayorNumero) {

            mayorNumero = veranos[año];
            mejorAño = año;

        }

    }

    if (!mejorAño) return null;

    return {
        año: mejorAño,
        noches: mayorNumero
    };

}

function obtenerInviernoMasHeladas(registros) {

    const dias = {};

    // Obtener la temperatura mínima diaria
    for (const registro of registros) {

        const temperaturaMin = Number(registro.temperaturaMin);

        if (isNaN(temperaturaMin)) continue;

        const fecha = registro.fecha;

        if (!dias[fecha]) {

            dias[fecha] = temperaturaMin;

        } else {

            dias[fecha] = Math.min(dias[fecha], temperaturaMin);

        }

    }

    // Contar días de helada por invierno
    const inviernos = {};

    // El invierno en curso (si estamos en dic-feb) está incompleto
    const ultima = registros[registros.length - 1].fecha;
    const añoUlt = Number(ultima.substring(0, 4));
    const mesUlt = Number(ultima.substring(5, 7));

    let inviernoEnCurso = null;

    if (mesUlt === 12) {
        inviernoEnCurso = añoUlt + 1;
    } else if (mesUlt === 1 || mesUlt === 2) {
        inviernoEnCurso = añoUlt;
    }

    for (const fecha in dias) {

        const año = Number(fecha.substring(0, 4));
        const mes = Number(fecha.substring(5, 7));

        let invierno;

        // Invierno meteorológico: diciembre, enero y febrero
        if (mes === 12) {

            invierno = año + 1;

        } else if (mes === 1 || mes === 2) {

            invierno = año;

        } else {

            continue;

        }

        if (invierno === inviernoEnCurso) continue;

        if (!inviernos[invierno]) {

            inviernos[invierno] = 0;

        }

        if (dias[fecha] < 0) {

            inviernos[invierno]++;

        }

    }

    let mejorInvierno = null;
    let mayorNumero = -1;

    for (const invierno in inviernos) {

        if (inviernos[invierno] > mayorNumero) {

            mayorNumero = inviernos[invierno];
            mejorInvierno = invierno;

        }

    }

    if (!mejorInvierno) return null;

    return {
        invierno: `${Number(mejorInvierno) - 1}/${mejorInvierno}`,
        heladas: mayorNumero
    };

}

function obtenerMesMasFrio(registros) {

    const meses = {};

    // El mes en curso está incompleto: no es comparable con meses enteros
    const mesActual = registros[registros.length - 1].fecha.substring(0, 7);

    for (const registro of registros) {

        const temperatura = Number(registro.temperatura);

        if (isNaN(temperatura)) continue;

        const año = registro.fecha.substring(0, 4);
        const mes = registro.fecha.substring(5, 7);

        const clave = `${año}-${mes}`;

        if (clave === mesActual) continue;

        if (!meses[clave]) {

            meses[clave] = {
                suma: 0,
                registros: 0
            };

        }

        meses[clave].suma += temperatura;
        meses[clave].registros++;

    }

    let peorClave = null;
    let peorMedia = Infinity;

    for (const clave in meses) {

        const media = meses[clave].suma / meses[clave].registros;

        if (media < peorMedia) {

            peorMedia = media;
            peorClave = clave;

        }

    }

    if (!peorClave) return null;

    const nombresMes = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];

    const año = peorClave.substring(0, 4);
    const mes = Number(peorClave.substring(5, 7));

    return {
        mes: `${nombresMes[mes - 1]} de ${año}`,
        media: peorMedia
    };

}




function obtenerCuriosidades(registros) {

    const curiosidades = [];

    let dato;
    let actual;

    dato = obtenerPrimerDiaSuperaTemperatura(registros, 30);
    actual = obtenerDiaSuperaTemperaturaAñoActual(registros, 30);
    curiosidades.push({
        icono: "🥵",
        titulo: "¿Cuándo alcanzamos los 30 ºC más pronto?",
        valor: dato.fecha,
        detalle: `${dato.valor.toFixed(1)} °C`,
        iconoActual: "🥵",
        tituloActual: "Este año",
        valorActual: actual ? actual.fecha : "Aún no",
        detalleActual: actual ? `${actual.valor.toFixed(1)} °C` : "No hemos llegado a 30 °C este año"
    });

    dato = obtenerUltimoDiaSuperaTemperatura(registros, 30);
    actual = (() => {
        const registrosAño = obtenerRegistrosAñoActual(registros);
        return obtenerUltimoDiaSuperaTemperatura(registrosAño, 30);
    })();
    curiosidades.push({
        icono: "🥵",
        titulo: "¿Cuándo nos olvidamos de los 30 ºC más tarde?",
        valor: dato.fecha,
        detalle: `${dato.valor.toFixed(1)} °C`,
        iconoActual: "🥵",
        tituloActual: "Este año, hasta ahora",
        valorActual: actual ? actual.fecha : "Aún no",
        detalleActual: actual ? `${actual.valor.toFixed(1)} °C` : "No hemos llegado a 30 °C este año"
    });

    dato = obtenerAñoMasLluvioso(registros);
    actual = obtenerLluviaAcumuladaAñoActual(registros);
    curiosidades.push({
        icono: "🌧️",
        titulo: "¿Cuál ha sido el año más lluvioso?",
        valor: dato.año,
        detalle: `${dato.lluvia.toFixed(1)} mm`,
        iconoActual: "🌧️",
        tituloActual: "Este año, hasta ahora",
        valorActual: `${actual.lluvia.toFixed(1)} mm`,
        detalleActual: `Acumulado a ${actual.fecha}`
    });

    dato = obtenerMesMasLluvioso(registros);
    actual = obtenerMesMasLluviosoAñoActual(registros);
    curiosidades.push({
        icono: "🌧️",
        titulo: "¿Cuál ha sido el mes más lluvioso?",
        valor: dato.mes,
        detalle: `${dato.lluvia.toFixed(1)} mm`,
        iconoActual: "🌧️",
        tituloActual: "Este año",
        valorActual: actual && actual.mes ? actual.mes : "--",
        detalleActual: actual && actual.mes ? `${actual.lluvia.toFixed(1)} mm` : "Aún sin meses completos este año"
    });

    dato = obtenerDiaMasLluvioso(registros);
    actual = obtenerDiaMasLluviosoAñoActual(registros);
    curiosidades.push({
        icono: "☔",
        titulo: "¿Cuál ha sido el día más lluvioso?",
        valor: dato.fecha,
        detalle: `${dato.lluvia.toFixed(1)} mm`,
        iconoActual: "☔",
        tituloActual: "Este año",
        valorActual: actual && actual.fecha ? actual.fecha : "--",
        detalleActual: actual && actual.fecha ? `${actual.lluvia.toFixed(1)} mm` : "Sin lluvia registrada este año"
    });

    dato = obtenerPrimeraHeladaTemporada(registros);
    actual = obtenerHeladaActualTrasVerano(registros);
    curiosidades.push({
    icono: "🥶",
    titulo: "¿En qué fecha llegó la primera helada tras el verano?",
    valor: dato.fecha,
    detalle: `${dato.valor.toFixed(1)} °C`,
    iconoActual: "🥶",
    tituloActual: "Esta temporada",
    valorActual: actual ? actual.fecha : "Aún sin heladas",
    detalleActual: actual ? `${actual.valor.toFixed(1)} °C` : "Todavía no ha helado desde el verano"
    });

    dato = obtenerUltimaHeladaTemporada(registros);
    actual = obtenerHeladaActualAntesVerano(registros);
    curiosidades.push({
    icono: "🌱",
    titulo: "¿En qué fecha llegó la última helada antes del verano?",
    valor: dato.fecha,
    detalle: `${dato.valor.toFixed(1)} °C`,
    iconoActual: "🌱",
    tituloActual: "Esta temporada",
    valorActual: actual ? actual.fecha : "Sin heladas",
    detalleActual: actual ? `${actual.valor.toFixed(1)} °C` : "No hemos tenido heladas este año"
    });

    dato = obtenerVeranoMasCaluroso(registros);
    actual = obtenerVeranoActualCaluroso(registros);
    curiosidades.push({
    icono: "🌡️",
    titulo: "¿Cuál ha sido el verano más caluroso?",
    valor: dato.año,
    detalle: `${dato.media.toFixed(1)} °C de media`,
    iconoActual: "🌡️",
    tituloActual: "Este verano, hasta ahora",
    valorActual: actual ? `${actual.media.toFixed(1)} °C` : "Fuera de temporada",
    detalleActual: actual ? "Media de este verano" : "Ahora mismo no es verano"
    });

    dato = obtenerEventoLluviaMasLargo(registros);
    actual = obtenerEventoLluviaMasLargoAñoActual(registros);
    curiosidades.push({
    icono: "🌧️",
    titulo: "¿Cuál ha sido el episodio de lluvia más largo?",
    valor: `${Math.floor(dato.duracion / 3600000)} h ${Math.round((dato.duracion % 3600000) / 60000)} min`,
    detalle: `${dato.inicio.fecha} ${dato.inicio.hora} → ${dato.fin.fecha} ${dato.fin.hora}`,
    iconoActual: "🌧️",
    tituloActual: "Este año",
    valorActual: actual ? `${Math.floor(actual.duracion / 3600000)} h ${Math.round((actual.duracion % 3600000) / 60000)} min` : "--",
    detalleActual: actual ? `${actual.inicio.fecha} ${actual.inicio.hora} → ${actual.fin.fecha} ${actual.fin.hora}` : "Sin episodios de lluvia este año"
    });

    dato = obtenerEventoLluviaMasLluvioso(registros);
    actual = obtenerEventoLluviaMasLluviosoAñoActual(registros);
    curiosidades.push({
    icono: "⛈️",
    titulo: "¿Cuál ha sido el episodio de lluvia con más precipitación acumulada?",
    valor: `${dato.lluvia.toFixed(1)} mm`,
    detalle: `${dato.inicio.fecha} ${dato.inicio.hora} → ${dato.fin.fecha} ${dato.fin.hora}`,
    iconoActual: "⛈️",
    tituloActual: "Este año",
    valorActual: actual ? `${actual.lluvia.toFixed(1)} mm` : "--",
    detalleActual: actual ? `${actual.inicio.fecha} ${actual.inicio.hora} → ${actual.fin.fecha} ${actual.fin.hora}` : "Sin episodios de lluvia este año"
    });


    dato = obtenerMesMasVentoso(registros);
    actual = obtenerMesMasVentosoAñoActual(registros);
    curiosidades.push({
    icono: "🌬️",
    titulo: "¿Cuál ha sido el mes más ventoso?",
    valor: dato.mes,
    detalle: `${dato.media.toFixed(1)} km/h de media`,
    iconoActual: "🌬️",
    tituloActual: "Este año",
    valorActual: actual && actual.mes ? actual.mes : "--",
    detalleActual: actual && actual.mes ? `${actual.media.toFixed(1)} km/h de media` : "Aún sin meses completos este año"
    });


    dato = obtenerAñoMasSoleado(registros);
    actual = obtenerRadiacionAcumuladaAñoActual(registros);

    curiosidades.push({
    icono: "☀️",
    titulo: "¿Cuál ha sido el año más soleado?",
    valor: dato.año,
    detalle: `${Math.round(dato.radiacion).toLocaleString()} kW/m² acumulados`,
    iconoActual: "☀️",
    tituloActual: "Este año, hasta ahora",
    valorActual: `${Math.round(actual.radiacion).toLocaleString()} kW/m²`,
    detalleActual: "Acumulados este año"
    });

    dato = obtenerAñoMasCalido(registros);
    actual = obtenerMediaTemperaturaAñoActual(registros);
    curiosidades.push({
    icono: "🌡️",
    titulo: "¿Cuál ha sido el año más cálido?",
    valor: dato.año,
    detalle: `${dato.media.toFixed(1)} °C de temperatura media`,
    iconoActual: "🌡️",
    tituloActual: "Este año, hasta ahora",
    valorActual: actual ? `${actual.media.toFixed(1)} °C` : "--",
    detalleActual: "Media de este año"
    });

    dato = obtenerMesMasCaluroso(registros);
    actual = obtenerMesMasCalurosoAñoActual(registros);
    curiosidades.push({
    icono: "🥵",
    titulo: "¿Cuál ha sido el mes más caluroso?",
    valor: dato.mes,
    detalle: `${dato.media.toFixed(1)} °C de temperatura media`,
    iconoActual: "🥵",
    tituloActual: "Este año",
    valorActual: actual && actual.mes ? actual.mes : "--",
    detalleActual: actual && actual.mes ? `${actual.media.toFixed(1)} °C de media` : "Aún sin meses completos este año"
    });

   dato = obtenerVeranoMasNochesTropicales(registros);
   actual = obtenerNochesVeranoActual(registros, 20);
    curiosidades.push({
    icono: "🌃",
    titulo: "¿Qué verano tuvo más noches tropicales >20ºC?",
    valor: dato.año,
    detalle: `${dato.noches} noches tropicales`,
    iconoActual: "🌃",
    tituloActual: "Este verano, hasta ahora",
    valorActual: actual ? `${actual.noches} noches` : "Fuera de temporada",
    detalleActual: actual ? "Noches tropicales este verano" : "Ahora mismo no es verano"
    });


    dato = obtenerVeranoMasNochesTorridas(registros);
    actual = obtenerNochesVeranoActual(registros, 25);
    curiosidades.push({
    icono: "🔥",
    titulo: "¿Qué verano tuvo más noches tórridas >25ºC?",
    valor: dato.año,
    detalle: `${dato.noches} noches tórridas`,
    iconoActual: "🔥",
    tituloActual: "Este verano, hasta ahora",
    valorActual: actual ? `${actual.noches} noches` : "Fuera de temporada",
    detalleActual: actual ? "Noches tórridas este verano" : "Ahora mismo no es verano"
    });

    dato = obtenerInviernoMasHeladas(registros);
    actual = obtenerHeladasInviernoActual(registros);
    curiosidades.push({
    icono: "🥶",
    titulo: "¿Qué invierno tuvo más heladas?",
    valor: dato.invierno,
    detalle: `${dato.heladas} días de helada`,
    iconoActual: "🥶",
    tituloActual: "Este invierno, hasta ahora",
    valorActual: actual ? `${actual.heladas} días` : "Fuera de temporada",
    detalleActual: actual ? "Heladas este invierno" : "Ahora mismo no es invierno"
    });

    dato = obtenerMesMasFrio(registros);
    actual = obtenerMesMasFrioAñoActual(registros);
    curiosidades.push({
    icono: "🧊",
    titulo: "¿Cuál ha sido el mes más frío?",
    valor: dato.mes,
    detalle: `${dato.media.toFixed(1)} °C de temperatura media`,
    iconoActual: "🧊",
    tituloActual: "Este año",
    valorActual: actual && actual.mes ? actual.mes : "--",
    detalleActual: actual && actual.mes ? `${actual.media.toFixed(1)} °C de media` : "Aún sin meses completos este año"
    });

    dato = obtenerVeranoMasOlasCalor(registros);
    actual = obtenerOlasCalorVeranoActual(registros);
    curiosidades.push({
    icono: "🥵",
    titulo: "¿Qué verano tuvo más olas de calor?",
    valor: dato.año || "Sin datos",
    detalle: dato.año
        ? `${dato.olas} ola${dato.olas === 1 ? "" : "s"} · ${dato.dias} día${dato.dias === 1 ? "" : "s"} sobre ${UMBRAL_OLA_CALOR}°C`
        : "Aún no se ha registrado ninguna",
    iconoActual: "🥵",
    tituloActual: "Este verano",
    valorActual: actual ? `${actual.olas} ola${actual.olas === 1 ? "" : "s"}` : "Fuera de temporada",
    detalleActual: actual
        ? `${actual.dias} día${actual.dias === 1 ? "" : "s"} sobre ${UMBRAL_OLA_CALOR}°C`
        : "Ahora mismo no es verano"
    });


    return curiosidades;

}




// ========================================
// VERSIÓN "AHORA MISMO" DE CADA CURIOSIDAD
// ========================================

function obtenerCicloActualInfo(registros) {

    const ultima = registros[registros.length - 1].fecha;

    return {
        fecha: ultima,
        año: ultima.substring(0, 4),
        mes: Number(ultima.substring(5, 7))
    };

}

function obtenerDiaSuperaTemperaturaAñoActual(registros, temperatura) {

    return obtenerPrimerDiaSuperaTemperatura(obtenerRegistrosAñoActual(registros), temperatura);

}

function obtenerLluviaAcumuladaAñoActual(registros) {

    const registrosAño = obtenerRegistrosAñoActual(registros);

    const ultimo = registrosAño[registrosAño.length - 1];

    return {
        lluvia: Number(ultimo.lluviaAnual) || 0,
        fecha: ultimo.fecha
    };

}

function obtenerLluviaAcumuladaMesActual(registros) {

    const mesActual = registros[registros.length - 1].fecha.substring(0, 7);

    const registrosMes = registros.filter(r => r.fecha.substring(0, 7) === mesActual);

    const ultimo = registrosMes[registrosMes.length - 1];

    return {
        lluvia: Number(ultimo.lluviaMensual) || 0,
        fecha: ultimo.fecha
    };

}

function obtenerLluviaHoy(registros) {

    const ultimo = registros[registros.length - 1];

    return {
        lluvia: Number(ultimo.lluviaDiaria) || 0,
        fecha: ultimo.fecha
    };

}

function obtenerHeladaActualTrasVerano(registros) {

    const ultima = registros[registros.length - 1].fecha;
    const añoUlt = Number(ultima.substring(0, 4));
    const mesUlt = Number(ultima.substring(5, 7));

    // El ciclo "tras el verano" empieza el 1 de julio del año en curso
    // (o del año anterior, si todavía no hemos llegado a julio)
    const añoInicioCiclo = mesUlt >= 7 ? añoUlt : añoUlt - 1;
    const inicioCiclo = `${añoInicioCiclo}-07-01`;

    const enCiclo = registros.filter(r => r.fecha >= inicioCiclo && r.fecha <= ultima);

    if (enCiclo.length === 0) return null;

    const dias = {};

    for (const registro of enCiclo) {

        if (!(registro.fecha in dias) || registro.temperaturaMin < dias[registro.fecha]) {
            dias[registro.fecha] = registro.temperaturaMin;
        }

    }

    const fechas = Object.keys(dias).sort();

    for (const fecha of fechas) {

        if (dias[fecha] < 0) {
            return { fecha, valor: dias[fecha] };
        }

    }

    return null;

}

function obtenerHeladaActualAntesVerano(registros) {

    const ultima = registros[registros.length - 1].fecha;
    const añoUlt = Number(ultima.substring(0, 4));

    // El ciclo "antes del verano" es enero-junio del año en curso
    const inicioCiclo = `${añoUlt}-01-01`;
    const topeCiclo = `${añoUlt}-06-30`;
    const finCiclo = ultima < topeCiclo ? ultima : topeCiclo;

    const enCiclo = registros.filter(r => r.fecha >= inicioCiclo && r.fecha <= finCiclo);

    if (enCiclo.length === 0) return null;

    const dias = {};

    for (const registro of enCiclo) {

        if (!(registro.fecha in dias) || registro.temperaturaMin < dias[registro.fecha]) {
            dias[registro.fecha] = registro.temperaturaMin;
        }

    }

    const fechas = Object.keys(dias).sort().reverse();

    for (const fecha of fechas) {

        if (dias[fecha] < 0) {
            return { fecha, valor: dias[fecha] };
        }

    }

    return null;

}

function obtenerVeranoActualCaluroso(registros) {

    const { año, mes } = obtenerCicloActualInfo(registros);

    if (mes < 6 || mes > 8) return null;

    let suma = 0;
    let cuenta = 0;

    for (const registro of registros) {

        if (registro.fecha.substring(0, 4) !== año) continue;

        const m = Number(registro.fecha.substring(5, 7));

        if (m < 6 || m > 8) continue;

        const temperatura = Number(registro.temperatura);

        if (isNaN(temperatura)) continue;

        suma += temperatura;
        cuenta++;

    }

    if (cuenta === 0) return null;

    return { año, media: suma / cuenta };

}

function obtenerEpisodioLluviaActual(registros) {

    const ultimoRegistro = registros[registros.length - 1];

    if (!(ultimoRegistro.intensidadLluvia > 0)) return null;

    const eventos = obtenerEventosLluvia(registros);

    if (eventos.length === 0) return null;

    const ultimoEvento = eventos[eventos.length - 1];

    if (ultimoEvento.fin.fecha !== ultimoRegistro.fecha || ultimoEvento.fin.hora !== ultimoRegistro.hora) {
        return null;
    }

    return ultimoEvento;

}

function obtenerVientoMedioMesActual(registros) {

    const mesActual = registros[registros.length - 1].fecha.substring(0, 7);

    let suma = 0;
    let cuenta = 0;

    for (const registro of registros) {

        if (registro.fecha.substring(0, 7) !== mesActual) continue;

        const viento = Number(registro.viento);

        if (isNaN(viento)) continue;

        suma += viento;
        cuenta++;

    }

    if (cuenta === 0) return null;

    return { mes: mesActual, media: suma / cuenta };

}

function obtenerRadiacionAcumuladaAñoActual(registros) {

    const registrosAño = obtenerRegistrosAñoActual(registros);

    let radiacion = 0;

    for (const registro of registrosAño) {

        const valor = Number(registro.radiacion);

        if (isNaN(valor)) continue;

        radiacion += valor * 0.5; // W/m² -> Wh/m² (intervalos de 30 min)

    }

    return {
        año: registrosAño[0].fecha.substring(0, 4),
        radiacion
    };

}

function obtenerMediaTemperaturaAñoActual(registros) {

    const registrosAño = obtenerRegistrosAñoActual(registros);

    let suma = 0;
    let cuenta = 0;

    for (const registro of registrosAño) {

        const temperatura = Number(registro.temperatura);

        if (isNaN(temperatura)) continue;

        suma += temperatura;
        cuenta++;

    }

    if (cuenta === 0) return null;

    return { año: registrosAño[0].fecha.substring(0, 4), media: suma / cuenta };

}

function obtenerMediaTemperaturaMesActual(registros) {

    const mesActual = registros[registros.length - 1].fecha.substring(0, 7);

    const nombresMes = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];

    let suma = 0;
    let cuenta = 0;

    for (const registro of registros) {

        if (registro.fecha.substring(0, 7) !== mesActual) continue;

        const temperatura = Number(registro.temperatura);

        if (isNaN(temperatura)) continue;

        suma += temperatura;
        cuenta++;

    }

    if (cuenta === 0) return null;

    const año = mesActual.substring(0, 4);
    const mes = Number(mesActual.substring(5, 7));

    return {
        mes: `${nombresMes[mes - 1]} de ${año}`,
        media: suma / cuenta
    };

}

function obtenerNochesVeranoActual(registros, umbral) {

    const { año, mes } = obtenerCicloActualInfo(registros);

    if (mes < 6 || mes > 8) return null;

    const dias = {};

    for (const registro of registros) {

        if (registro.fecha.substring(0, 4) !== año) continue;

        const m = Number(registro.fecha.substring(5, 7));

        if (m < 6 || m > 8) continue;

        const temperaturaMin = Number(registro.temperaturaMin);

        if (isNaN(temperaturaMin)) continue;

        if (!(registro.fecha in dias) || temperaturaMin < dias[registro.fecha]) {
            dias[registro.fecha] = temperaturaMin;
        }

    }

    let noches = 0;

    for (const fecha in dias) {

        if (dias[fecha] >= umbral) noches++;

    }

    return { año, noches };

}

function obtenerHeladasInviernoActual(registros) {

    const ultima = registros[registros.length - 1].fecha;
    const añoUlt = Number(ultima.substring(0, 4));
    const mesUlt = Number(ultima.substring(5, 7));

    if (mesUlt !== 12 && mesUlt !== 1 && mesUlt !== 2) return null;

    const inviernoActual = mesUlt === 12 ? añoUlt + 1 : añoUlt;

    const dias = {};

    for (const registro of registros) {

        const año = Number(registro.fecha.substring(0, 4));
        const mes = Number(registro.fecha.substring(5, 7));

        let invierno;

        if (mes === 12) {
            invierno = año + 1;
        } else if (mes === 1 || mes === 2) {
            invierno = año;
        } else {
            continue;
        }

        if (invierno !== inviernoActual) continue;

        const temperaturaMin = Number(registro.temperaturaMin);

        if (isNaN(temperaturaMin)) continue;

        if (!(registro.fecha in dias) || temperaturaMin < dias[registro.fecha]) {
            dias[registro.fecha] = temperaturaMin;
        }

    }

    let heladas = 0;

    for (const fecha in dias) {

        if (dias[fecha] < 0) heladas++;

    }

    return {
        invierno: `${inviernoActual - 1}/${inviernoActual}`,
        heladas
    };

}


// ========================================
// RÉCORDS DEL AÑO EN CURSO (no del instante actual)
// ========================================

function obtenerDiaMasLluviosoAñoActual(registros) {

    return obtenerDiaMasLluvioso(obtenerRegistrosAñoActual(registros));

}

function obtenerEventoLluviaMasLargoAñoActual(registros) {

    const eventos = obtenerEventosLluvia(obtenerRegistrosAñoActual(registros));

    if (eventos.length === 0) return null;

    return eventos.reduce((mejor, actual) =>
        actual.duracion > mejor.duracion ? actual : mejor
    );

}

function obtenerEventoLluviaMasLluviosoAñoActual(registros) {

    const eventos = obtenerEventosLluvia(obtenerRegistrosAñoActual(registros));

    if (eventos.length === 0) return null;

    return eventos.reduce((mejor, actual) =>
        actual.lluvia > mejor.lluvia ? actual : mejor
    );

}

function obtenerMesMasFrioAñoActual(registros) {

    return obtenerMesMasFrio(obtenerRegistrosAñoActual(registros));

}

function obtenerMesMasCalurosoAñoActual(registros) {

    return obtenerMesMasCaluroso(obtenerRegistrosAñoActual(registros));

}

function obtenerMesMasVentosoAñoActual(registros) {

    return obtenerMesMasVentoso(obtenerRegistrosAñoActual(registros));

}

function obtenerMesMasLluviosoAñoActual(registros) {

    return obtenerMesMasLluvioso(obtenerRegistrosAñoActual(registros));

}


// ========================================
// VERANO CON MÁS OLAS DE CALOR
// (usa UMBRAL_OLA_CALOR, definido en consultas.js)
// ========================================

function obtenerVeranoMasOlasCalor(registros) {

    const dias = {};

    for (const registro of registros) {

        const mes = Number(registro.fecha.substring(5, 7));

        if (mes < 6 || mes > 8) continue;

        if (!(registro.fecha in dias) || registro.temperaturaMax > dias[registro.fecha]) {
            dias[registro.fecha] = registro.temperaturaMax;
        }

    }

    // El verano en curso (si estamos en jun-ago) está incompleto
    const ultima = registros[registros.length - 1].fecha;
    const añoActual = ultima.substring(0, 4);
    const mesActualNum = Number(ultima.substring(5, 7));
    const veranoEnCurso = (mesActualNum >= 6 && mesActualNum <= 8) ? añoActual : null;

    const veranos = {};

    const fechasOrdenadas = Object.keys(dias).sort();

    let añoRachaActual = null;
    let rachaActual = 0;

    function cerrarRacha() {

        if (rachaActual >= 3 && añoRachaActual && añoRachaActual !== veranoEnCurso) {
            veranos[añoRachaActual] = (veranos[añoRachaActual] || 0) + 1;
        }

        rachaActual = 0;
        añoRachaActual = null;

    }

    for (const fecha of fechasOrdenadas) {

        const año = fecha.substring(0, 4);

        if (dias[fecha] >= UMBRAL_OLA_CALOR) {

            if (añoRachaActual !== año) {
                cerrarRacha();
                añoRachaActual = año;
            }

            rachaActual++;

        } else {

            cerrarRacha();

        }

    }

    cerrarRacha();

    let mejorAño = null;
    let mejorCuenta = 0;

    for (const año in veranos) {

        if (veranos[año] > mejorCuenta) {
            mejorCuenta = veranos[año];
            mejorAño = año;
        }

    }

    // Nº de días individuales (no agrupados en olas) que superaron el
    // umbral en el verano ganador — sirve para comprobar a ojo que el
    // recuento de olas cuadra con los días reales.
    let diasEnMejorAño = 0;

    if (mejorAño) {

        for (const fecha of fechasOrdenadas) {

            if (fecha.substring(0, 4) === mejorAño && dias[fecha] >= UMBRAL_OLA_CALOR) {
                diasEnMejorAño++;
            }

        }

    }

    return { año: mejorAño, olas: mejorCuenta, dias: diasEnMejorAño };

}

// ========================================
// OLAS DE CALOR DEL VERANO EN CURSO
// (para la cara trasera de la tarjeta — solo tiene valor si estamos
// dentro de la temporada de verano ahora mismo)
// ========================================

function obtenerOlasCalorVeranoActual(registros) {

    const { año, mes } = obtenerCicloActualInfo(registros);

    if (mes < 6 || mes > 8) return null;

    const dias = {};

    for (const registro of registros) {

        if (registro.fecha.substring(0, 4) !== año) continue;

        const m = Number(registro.fecha.substring(5, 7));

        if (m < 6 || m > 8) continue;

        if (!(registro.fecha in dias) || registro.temperaturaMax > dias[registro.fecha]) {
            dias[registro.fecha] = registro.temperaturaMax;
        }

    }

    const fechasOrdenadas = Object.keys(dias).sort();

    let racha = 0;
    let olas = 0;
    let diasSobreUmbral = 0;

    for (const fecha of fechasOrdenadas) {

        if (dias[fecha] >= UMBRAL_OLA_CALOR) {

            racha++;
            diasSobreUmbral++;

        } else {

            if (racha >= 3) olas++;

            racha = 0;

        }

    }

    if (racha >= 3) olas++;

    return { año, olas, dias: diasSobreUmbral };

}
