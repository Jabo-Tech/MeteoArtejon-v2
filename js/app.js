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

    const registros = await cargarExcel();

    cargarPortada(registros);

    const portada = document.getElementById("portada");
    const aplicacion = document.getElementById("aplicacion");

    const pantallaInicio = document.getElementById("pantallaInicio");
    const pantallaDirecto = document.getElementById("pantallaDirecto");
    const pantallaConsultas = document.getElementById("pantallaConsultas");
    const pantallaGraficas = document.getElementById("pantallaGraficas");

    function mostrarPantalla(pantalla) {

        portada.style.display = "none";
        aplicacion.style.display = "block";

        pantallaInicio.hidden = pantalla !== pantallaInicio;
        pantallaDirecto.hidden = pantalla !== pantallaDirecto;
        pantallaConsultas.hidden = pantalla !== pantallaConsultas;
        pantallaGraficas.hidden = pantalla !== pantallaGraficas;

        window.scrollTo(0, 0);

    }

    document.getElementById("btnInicio").onclick = () => {

    mostrarPantalla(pantallaInicio);

    registrarEvento("pantalla-inicio", "01 · Records");

    cargarInicio(registros);

};

    document.getElementById("btnDatosDirecto").onclick = () => {

    mostrarPantalla(pantallaDirecto);

    registrarEvento("pantalla-directo", "04 · Datos en directo");

    cargarDirecto();

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

    document.addEventListener("keydown", (evento) => {

        if (evento.key === "Escape") {
            modalVariables.hidden = true;
        }

    });

});

