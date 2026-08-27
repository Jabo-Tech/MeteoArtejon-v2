// ===============================
// Lee el archivo Excel
// ===============================

async function cargarExcel() {

    const respuesta = await fetch("data/datos.xlsx");
    const datos = await respuesta.arrayBuffer();

    const libro = XLSX.read(datos);
    const hoja = libro.Sheets[libro.SheetNames[0]];

    const registrosExcel = XLSX.utils.sheet_to_json(hoja);

   

    return registrosExcel.map(registro => ({

        fecha: convertirFecha(registro.Fecha),
        hora: convertirHora(registro.Hora),

        temperatura: registro.temperatura,
        temperaturaMin: registro.temperaturaMin,
        temperaturaMax: registro.temperaturaMax,

        humedad: registro.humedad,

        radiacion: registro.radiacion,
        uvi: registro.uvi,

        intensidadLluvia: registro.intensidadLluvia,
        lluviaDiaria: registro.lluviaDiaria,
        lluviaEvento: registro.lluviaEvento,
        lluviaSemanal: registro.lluviaSemanal,
        lluviaMensual: registro.lluviaMensual,
        lluviaAnual: registro.lluviaAnual,

        viento: registro.viento,
        racha: registro.racha,
        direccion: registro.direccion, // grados (0-360); ver obtenerDireccionPredominante

        presionRelativa: registro.presionRelativa,
        presionAbsoluta: registro.presionAbsoluta

    }));

}

// ===============================
// Convierte fecha de Excel
// ===============================

function convertirFecha(serial) {

    const fecha = new Date((serial - 25569) * 86400 * 1000);

    const año = fecha.getUTCFullYear();
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getUTCDate()).padStart(2, "0");

    return `${año}-${mes}-${dia}`;

}

// ===============================
// Convierte hora de Excel
// ===============================

function convertirHora(fraccion) {

    const segundosTotales = Math.round(fraccion * 86400);

    const horas = Math.floor(segundosTotales / 3600);
    const minutos = Math.floor((segundosTotales % 3600) / 60);

    return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;

}