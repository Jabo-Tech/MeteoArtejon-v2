function calcularDuracionPeriodo(inicio, fin) {

    const d1 = new Date(inicio);
    const d2 = new Date(fin);

    let años = d2.getFullYear() - d1.getFullYear();

    const aniversario = new Date(d1);
    aniversario.setFullYear(d1.getFullYear() + años);

    if (aniversario > d2) {
        años--;
        aniversario.setFullYear(d1.getFullYear() + años);
    }

    const msPorDia = 24 * 60 * 60 * 1000;
    const dias = Math.round((d2 - aniversario) / msPorDia);

    return { años, dias };

}

function cargarPortada(registros) {

    const periodo = obtenerPeriodoDisponible(registros);
    const ultima = obtenerUltimaActualizacion(registros);

    const duracion = calcularDuracionPeriodo(periodo.inicio, periodo.fin);

    let textoDuracion;

    if (duracion.años > 0) {
        textoDuracion = `${duracion.años} año${duracion.años === 1 ? "" : "s"} y ${duracion.dias} día${duracion.dias === 1 ? "" : "s"}`;
    } else {
        textoDuracion = `${duracion.dias} día${duracion.dias === 1 ? "" : "s"}`;
    }

    document.getElementById("periodoDisponible").textContent =
        `${periodo.inicio} - ${periodo.fin} (${textoDuracion})`;

    document.getElementById("numeroRegistros").textContent =
        periodo.registros.toLocaleString("es-ES");

    document.getElementById("ultimaActualizacion").textContent =
        `${ultima.fecha} ${ultima.hora}`;

}