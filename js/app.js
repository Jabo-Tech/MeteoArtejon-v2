// ======================================
// ANALÍTICA (GoatCounter) — sin cookies, sin datos personales.
// Si el script no llegó a cargar (red bloqueada, adblock...) estas
// funciones simplemente no hacen nada, sin romper el resto de la web.
//
// La primera visita (la carga inicial de la web) la registra el propio
// script de GoatCounter en cuanto termina de cargar — así no depende de
// que nuestro código adivine el momento exacto en que ya está listo.
//
// registrarEvento(): se registra aparte, en "Events" dentro de
// GoatCounter, sin sumar al contador de visitas. Se usa para moverse
// entre pantallas (para saber qué se usa, sin inflar las visitas) y
// para acciones como "Consultar" o "Generar gráficas".
// ======================================

function registrarEvento(ruta, titulo) {

    if (window.goatcounter && typeof window.goatcounter.count === "function") {
        window.goatcounter.count({ path: ruta, title: titulo, event: true });
    }

}

document.addEventListener("DOMContentLoaded", async () => {

    // El directo no depende del Excel: se pide antes para que salga cuanto antes
    cargarDirectoPortada();

    const registros = await cargarExcel();

    cargarPortada(registros);

    cargarPrediccionPortada(registros).then(directoRepintar);

    const portada = document.getElementById("portada");
    const aplicacion = document.getElementById("aplicacion");

    const pantallaInicio = document.getElementById("pantallaInicio");
    const pantallaConsultas = document.getElementById("pantallaConsultas");
    const pantallaGraficas = document.getElementById("pantallaGraficas");
    const pantallaPrediccion = document.getElementById("pantallaPrediccion");

    function mostrarPantalla(pantalla) {

        portada.style.display = "none";
        aplicacion.style.display = "block";

        pantallaInicio.hidden = pantalla !== pantallaInicio;
        pantallaConsultas.hidden = pantalla !== pantallaConsultas;
        pantallaGraficas.hidden = pantalla !== pantallaGraficas;
        pantallaPrediccion.hidden = pantalla !== pantallaPrediccion;

        window.scrollTo(0, 0);

    }

    document.getElementById("btnInicio").onclick = () => {

    mostrarPantalla(pantallaInicio);

    registrarEvento("pantalla-inicio", "01 · Records");

    cargarInicio(registros);

};

    document.getElementById("btnConsultas").onclick = () => {

    mostrarPantalla(pantallaConsultas);

    registrarEvento("pantalla-consultas", "02 · Consultas");

    cargarConsultas(registros);

};

    document.getElementById("btnGraficas").onclick = () => {

    mostrarPantalla(pantallaGraficas);

    registrarEvento("pantalla-graficas", "03 · Gráficas");

    cargarGraficas(registros);

};

    document.getElementById("btnPrediccion").onclick = () => {

    mostrarPantalla(pantallaPrediccion);

    registrarEvento("pantalla-prediccion", "04 · Predicción");

    cargarPantallaPrediccion(registros);

};

    document.querySelectorAll(".logoDashboard").forEach(boton => {

    boton.onclick = () => {

        aplicacion.style.display = "none";
        portada.style.display = "flex";

        registrarEvento("pantalla-portada", "Vuelta a portada");

        // Al volver, dejamos las tarjetas en su cara delantera
        document.querySelectorAll(".girada").forEach(tarjeta => {
            tarjeta.classList.remove("girada");
        });

        window.scrollTo(0, 0);

    };

});

    const modalVariables = document.getElementById("modalVariables");

    document.getElementById("btnExplicacionVariables").onclick = () => {
        modalVariables.hidden = false;
    };

    document.getElementById("btnCerrarModal").onclick = () => {
        modalVariables.hidden = true;
    };

    modalVariables.addEventListener("click", (evento) => {

        if (evento.target === modalVariables) {
            modalVariables.hidden = true;
        }

    });

    const modalPrediccion = document.getElementById("modalPrediccion");

    document.getElementById("btnExplicacionPrediccion").onclick = () => {
        modalPrediccion.hidden = false;
        registrarEvento("modal-prediccion", "Cómo se predice el tiempo");
    };

    document.getElementById("btnCerrarModalPrediccion").onclick = () => {
        modalPrediccion.hidden = true;
    };

    modalPrediccion.addEventListener("click", (evento) => {

        if (evento.target === modalPrediccion) {
            modalPrediccion.hidden = true;
        }

    });

    document.addEventListener("keydown", (evento) => {

        if (evento.key === "Escape") {
            modalVariables.hidden = true;
            modalPrediccion.hidden = true;
        }

    });

});

