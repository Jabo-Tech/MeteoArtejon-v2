async function cargarDirecto() {

    const aviso = document.getElementById("avisoDirecto");

    let datos;

    try {

        const respuesta = await fetch("data/directo.json", { cache: "no-store" });
        datos = await respuesta.json();

    } catch (error) {

        aviso.hidden = false;
        aviso.textContent = "No se han podido cargar los datos en directo. Inténtalo de nuevo en unos minutos.";
        return;

    }

    if (!datos.actualizado) {

        aviso.hidden = false;
        aviso.textContent = "Todavía no hay datos en directo disponibles. La primera actualización puede tardar unos minutos.";
        return;

    }

    const fechaActualizacion = new Date(datos.actualizado);
    const minutosDesde = (Date.now() - fechaActualizacion.getTime()) / 60000;

    if (minutosDesde > 60) {

        aviso.hidden = false;
        aviso.textContent = "Estos datos llevan más de una hora sin actualizarse. Puede que la estación esté desconectada.";

    } else {

        aviso.hidden = true;

    }

    document.getElementById("directoTemperatura").textContent =
        datos.temperatura !== null ? `${datos.temperatura.toFixed(1)} °C` : "--";

    document.getElementById("directoSensacion").textContent =
        datos.sensacion !== null ? `Sensación ${datos.sensacion.toFixed(1)} °C` : "--";

    document.getElementById("directoHumedad").textContent =
        datos.humedad !== null ? `${datos.humedad.toFixed(0)} %` : "--";

    document.getElementById("directoViento").textContent =
        datos.viento !== null ? `${datos.viento.toFixed(1)} km/h` : "--";

    document.getElementById("directoRacha").textContent =
        datos.racha !== null ? `Racha ${datos.racha.toFixed(1)} km/h` : "--";

    document.getElementById("directoDireccion").textContent =
        datos.direccion ? `${datos.direccion} (${datos.direccionNombre})` : "--";

    document.getElementById("directoPresion").textContent =
        datos.presion !== null ? `${datos.presion.toFixed(1)} hPa` : "--";

    document.getElementById("directoLluvia").textContent =
        datos.lluviaHoy !== null ? `${datos.lluviaHoy.toFixed(1)} mm` : "--";

    document.getElementById("directoIntensidad").textContent =
        datos.intensidadLluvia !== null ? `Intensidad ${datos.intensidadLluvia.toFixed(1)} mm/h` : "--";

    document.getElementById("directoRadiacion").textContent =
        datos.radiacion !== null ? `${datos.radiacion.toFixed(0)} W/m²` : "--";

    document.getElementById("directoUvi").textContent =
        datos.uvi !== null ? `UVI ${datos.uvi.toFixed(1)}` : "--";

    document.getElementById("directoActualizado").textContent =
        `Última actualización: ${fechaActualizacion.toLocaleString("es-ES")}`;

}
