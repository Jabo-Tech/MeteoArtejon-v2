// ======================================
// ANALÍTICA (GoatCounter) — sin cookies, sin datos personales.
// Si el script no llegó a cargar (red bloqueada, adblock...) estas
// funciones simplemente no hacen nada, sin romper el resto de la web.
// ======================================

function registrarVisita(ruta, titulo) {

    if (window.goatcounter && typeof window.goatcounter.count === "function") {
        window.goatcounter.count({ path: ruta, title: titulo });
    }

}

function registrarEvento(ruta, titulo) {

    if (window.goatcounter && typeof window.goatcounter.count === "function") {
        window.goatcounter.count({ path: ruta, title: titulo, event: true });
    }

}

document.addEventListener("DOMContentLoaded", async () => {

    registrarVisita("/", "Portada");

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

    registrarVisita("/inicio", "01 · Records");

    cargarInicio(registros);

};

    document.getElementById("btnDatosDirecto").onclick = () => {

    mostrarPantalla(pantallaDirecto);

    registrarVisita("/directo", "04 · Datos en directo");

    cargarDirecto();

};

    document.getElementById("btnConsultas").onclick = () => {

    mostrarPantalla(pantallaConsultas);

    registrarVisita("/consultas", "02 · Consultas");

    cargarConsultas(registros);

};

    document.getElementById("btnGraficas").onclick = () => {

    mostrarPantalla(pantallaGraficas);

    registrarVisita("/graficas", "03 · Gráficas");

    cargarGraficas(registros);

};

    document.querySelectorAll(".logoDashboard").forEach(boton => {

    boton.onclick = () => {

        aplicacion.style.display = "none";
        portada.style.display = "flex";

        registrarVisita("/", "Portada");

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

