const etiquetaRol = document.querySelector("#rol-usuario");
const botonCerrarSesion = document.querySelector("#btn-cerrar-sesion");

const botonMenu = document.querySelector("#btn-menu");
const botonCerrarMenu = document.querySelector("#btn-cerrar-menu");
const menuLateral = document.querySelector("#menu-lateral");
const overlay = document.querySelector("#sidebar-overlay");

const esMovil = window.matchMedia("(max-width: 768px)");

const opcionesVacias = ["No aplica", "No se valoró"];
const opcionesEstadoMultiple = ["Sí", "No", "No se valoró", "N/A"];
const listasValoracion = {
    escolaridad: ["Ninguna", "Preescolar", "Primaria", "Secundaria", "Preparatoria"],
    ocupacion: ["Estudiante", "Hogar", "Trabaja", "Ninguna"],
    religion: ["Católica", "Cristiana", "Otra", "Ninguna"],
    parentescoInformante: ["Madre", "Padre", "Abuelo(a)", "Tío(a)", "Hermano(a)", "Otro"],
    residencia: ["Propia", "Prestada", "Rentada", "Otro"],
    materialVivienda: ["Adobe", "Ladrillo", "Lámina", "Otro"],
    tiempoPrincipal: ["Hogar", "Escuela/Guardería", "Abuelos", "Otro"],
    proveedorAlimento: ["Madre", "Padre", "Hermano/a", "Otro"],
    tipoParto: ["Eutócico", "Cesárea", "Distócico", "Fórceps"],
    comidasDia: ["1", "2", "3", "4", "5 o más"],
    aguaDiaria: ["Menos de 1 L", "1–2 L", "Más de 2 L"],
    miccionesDia: ["1–3", "4–6", "7–9", "10 o más"],
    evacuacionesDia: ["1–2", "3–4", "5 o más"],
    higieneFrecuencia: ["1 vez", "2 veces", "3 o más veces", "Diaria", "Interdiaria", "Semanal"],
    bristol: ["Tipo 1: bolitas duras", "Tipo 2: grumosa", "Tipo 3: con grietas", "Tipo 4: lisa y blanda", "Tipo 5: trozos blandos", "Tipo 6: pastosa", "Tipo 7: líquida"],
    sufrimientoFetal: ["Sí", "No", "No sabe"],
    apgar1: Array.from({ length: 11 }, (_, i) => String(i)),
    apgar5: Array.from({ length: 11 }, (_, i) => String(i)),
    frecuenciaRespiratoria: null
};

// Captura de altas de valoración ABCC (los campos se conservan agrupados en JSON).
const seccionesValoracion = [
    { titulo: "I. Factores condicionantes básicos", campos: [
        ["domicilio", "Domicilio", "address"], ["hermanos", "Número de hermanos", "number"], ["rolFamilia", "Lugar que ocupa en la familia", "text"], ["ocupacion", "Ocupación", "text"], ["religion", "Religión", "text"], ["parentescoInformante", "Parentesco del informante", "text"], ["fechaIngreso", "Fecha de ingreso", "date"], ["institucion", "Institución", "text"],
        ["residencia", "Tenencia de la vivienda", "select", ["Propia", "Prestada", "Rentada", "Otra"]], ["materialVivienda", "Material de vivienda", "select", ["Adobe", "Ladrillo", "Lámina", "Otro"]], ["habitaciones", "Número de habitaciones", "number"], ["dormitorios", "Número de dormitorios", "number"], ["serviciosBasicos", "Servicios básicos disponibles", "checks", ["Agua", "Luz", "Drenaje", "Recolección de basura", "Alumbrado público", "Alcantarillado", "Pavimentación"]], ["convivenciaFamilia", "Convivencia familiar", "select", ["Buena", "Regular", "Mala"]], ["tiempoPrincipal", "Dónde pasa la mayor parte del tiempo", "select", ["Hogar", "Escuela/Guardería", "Abuelos", "Otro"]], ["relacionFamiliar", "Relación familiar", "select", ["Buena", "Regular", "Mala"]], ["ingresoFamiliar", "Ingreso económico familiar", "select", ["Menos de 1 s.m.", "1–2 s.m.", "Más de 3 s.m."]], ["rolPersona", "Rol de la persona", "select", ["Hijo/a", "Hermano/a", "Padre/Madre"]], ["vacunacion", "Esquema de vacunación", "select", ["Completo", "Incompleto"]], ["vacunacionDetalle", "Vacuna(s) o dosis pendiente(s), según la Cartilla Nacional de Salud", "text"], ["servicioSalud", "Servicios de salud", "checks", ["IMSS", "ISSSTE", "ISEA", "Particular", "Seguro Popular", "Otro"]], ["cuandoAcude", "¿Cuándo acude al servicio médico?", "checks", ["Llanto persistente", "Pérdida de apetito", "Se ve triste", "Dolor", "Signos y síntomas", "Control"]], ["decisionAtencion", "¿Cuándo decide llevarlo a recibir atención? (opcional)", "textarea"], ["barrerasSalud", "Causas por las que no asiste", "checks", ["Falta de tiempo", "Falta de dinero", "Dificultad para traslado", "Otro (especifique)"]]
    ]},
    { titulo: "II. Requisitos de autocuidado", campos: [
        ["frecuenciaRespiratoria", "Frecuencia respiratoria (por minuto)", "number"], ["cianosis", "¿Cianosis?", "yes-no-detail", "Especifique"], ["respiratorioDetalle", "Hallazgos respiratorios", "checks", ["Aleteo", "Disociación", "Quejido", "Estertores"]], ["fuma", "¿Fuma?", "yes-no-detail-binary", "Cantidad", "number"], ["silverman", "Valoración Silverman", "text"], ["anderson", "Valoración Anderson", "text"], ["desencadenantesRespiratorios", "¿Presenta factores desencadenantes respiratorios?", "yes-no-detail", "Especifique"], ["oxigenoterapia", "¿Recibe oxigenoterapia?", "yes-no-detail"],
        ["aguaDiaria", "Consumo habitual de agua (litros/día)", "number"], ["origenAgua", "Origen del agua", "checks", ["Garrafón", "Hervida", "Clorada", "Potable"]], ["otrosLiquidos", "¿Consume otro tipo de líquido?", "liquids"], ["deshidratacion", "Datos de deshidratación", "checks", ["Mucosa oral seca", "Mucosa hidratada", "Fontanela hundida", "Lienzo húmedo", "Turgencia de piel"]],
        ["peso", "Peso (kg)", "number"], ["talla", "Talla (cm)", "number"], ["perimetroCefalico", "Perímetro cefálico (cm)", "number"], ["perimetroAbdominal", "Perímetro abdominal (cm)", "number"], ["comidasDia", "Número de comidas al día", "number"], ["comeFamilia", "¿Come con la familia?", "yes-no"], ["suplementos", "¿Ingiere suplementos?", "yes-no-options", "Seleccione los suplementos", ["Vitaminas", "Minerales", "Proteínas", "Hierro", "Ácido fólico", "Otro (especifique)"]], ["proveedorAlimento", "Persona que generalmente proporciona alimento", "select", ["Madre", "Padre", "Hermano/a", "Otro"]], ["alimentacionLactante", "Alimentación de 0 a 12 meses", "textarea"], ["alimentacionMayor", "Alimentación de 1 a 18 años (cereales, vegetales, frutas, carnes, lácteos, leguminosas)", "textarea"], ["padecimientosAlimentos", "¿Presenta padecimientos relacionados con alimentos?", "yes-no-detail"],
        ["miccionesDia", "Eliminación vesical: veces al día", "number"], ["datosVesicales", "Datos vesicales", "checks", ["Incontinencia", "Retención", "Poliuria", "Anuria", "Polaquiuria", "Oliguria", "Disuria", "Dolor abdominal"]], ["orinaCaracteristicas", "Características de la orina", "checks", ["Clara", "Amarilla", "Oscura", "Turbia", "Con sangre", "Espumosa"]], ["evacuacionesDia", "Eliminación intestinal: frecuencia en 24 h", "number"], ["datosIntestinales", "Datos intestinales", "checks", ["Dolor abdominal", "Flatulencias", "Estreñimiento", "Pujo", "Diarrea", "Melena", "Tenesmo", "Dolor al evacuar", "Hemorroides", "Distensión", "Rectorragia"]], ["evacuacionCaracteristicas", "Escala de Bristol", "bristol", listasValoracion.bristol], ["medicamentosEvacuar", "¿Usa medicamentos para ayudar a evacuar?", "yes-no-detail"], ["secrecionTransvaginal", "Secreción transvaginal (en niñas prepúberes, solo si hay síntomas)", "yes-no-detail", "Características o síntomas"],
        ["horasSueno", "Horas de sueño nocturno", "number"], ["siestas", "¿Realiza siestas diurnas?", "yes-no-detail-binary", "No. de horas", "number"], ["apoyosDormir", "¿Utiliza apoyos para dormir?", "yes-no-detail"], ["despiertaNoche", "¿Despierta por la noche?", "yes-no-detail", "Motivo"], ["actividadEscolar", "¿Asiste a la escuela?", "school-level"], ["horasActividad", "Número de horas de actividad", "number"], ["reflejos", "Valoración de reflejos", "reflexes"], ["hitosPrimeraFila", "Desarrollo psicomotor: primera fila", "milestones-first"], ["hitosSegundaFila", "Desarrollo psicomotor: segunda fila", "milestones-second"], ["juegosElectronicos", "Juegos electrónicos: tipo y frecuencia", "text"], ["deporte", "¿Realiza deporte o actividad artística?", "activity-detail"], ["preferencias", "Preferencias de actividad y uso de redes sociales", "text"],
        ["audicion", "¿Presenta problemas auditivos?", "hearing"], ["vision", "¿Presenta problemas visuales?", "vision"], ["conductaSocial", "Características observadas", "checks", ["Seguridad", "Timidez", "Introversión", "Apatía", "Extroversión", "Agresividad"]], ["prevencionAccidentes", "¿Tiene conocimientos sobre prevención de accidentes en el hogar?", "yes-no"], ["toxicosResguardados", "¿Las sustancias tóxicas guardadas en el hogar están fuera del alcance de los niños?", "yes-no"], ["medicamentosResguardados", "¿Los medicamentos están en resguardo?", "yes-no"], ["grupoAyuda", "¿Acude a un grupo de ayuda?", "yes-no-detail"], ["adiccionesPropias", "¿Tiene adicciones propias?", "check"], ["problemaSalud", "¿Recuerda algún problema relevante de salud?", "yes-no-detail", "Especifique"],
        ["embarazos", "Vida intrauterina: número de embarazos", "number"], ["controlPrenatal", "¿Hubo control prenatal?", "yes-no-detail-binary", "Número de controles prenatales", "number"], ["sufrimientoFetal", "Sufrimiento fetal", "check"], ["enfermedadesEmbarazo", "¿Hubo alteraciones o enfermedades durante el embarazo?", "yes-no-detail", "Especifique la alteración", "text"], ["toxicomanias", "¿Hubo toxicomanías durante el embarazo?", "yes-no"], ["medicamentosEmbarazo", "¿Hubo prescripción de medicamentos durante el embarazo?", "yes-no"], ["malformaciones", "¿Presenta malformaciones congénitas?", "yes-no-detail", "Especifique la malformación", "text"], ["semanasGestacion", "Semanas de gestación", "number"], ["pesoNacimiento", "Peso al nacer (kg)", "number"], ["tallaNacimiento", "Talla al nacer (cm)", "number"], ["apgar1", "Apgar al minuto (0–10)", "select", Array.from({ length: 11 }, (_, i) => String(i))], ["apgar5", "Apgar a los 5 minutos (0–10)", "select", Array.from({ length: 11 }, (_, i) => String(i))], ["tipoParto", "Tipo de parto", "select", ["Eutócico", "Cesárea", "Distócico", "Fórceps"]], ["denticion", "Infancia: inicio de dentición", "text"], ["caries", "¿Presenta caries?", "yes-no"], ["ortodoncia", "¿Usa aparatos de ortodoncia?", "yes-no"], ["desarrolloSexual", "Características sexuales secundarias", "secondary-development"], ["cicloMenstrual", "Características del ciclo menstrual", "menstrual-cycle"], ["planificacion", "¿Utiliza algún método de planificación familiar?", "yes-no-detail", "¿Cuál método utiliza?"],
        ["aprendizaje", "¿Presenta problemas para el aprendizaje?", "yes-no"], ["trabajoInfantil", "¿Trabaja para aportar a gastos familiares?", "check"], ["recursosEscuela", "¿Cuenta con recursos económicos insuficientes para asistir a la escuela?", "yes-no"], ["perdidas", "¿Ha sufrido una pérdida importante recientemente?", "loss"], ["cambiosVida", "Cambios súbitos en condiciones de vida", "checks", ["Residencia", "Casa", "Escuela", "Familia", "Ingresos"]], ["seEnfermaFrecuencia", "¿Se enferma con frecuencia?", "yes-no"], ["problemasPsicologicos", "¿Presenta problemas psicológicos?", "yes-no"], ["autosuficiente", "¿Es autosuficiente?", "yes-no"], ["saludCronica", "¿Tiene una enfermedad crónica?", "chronic"], ["peligrosAmbientales", "¿Presenta exposición a peligros ambientales?", "environment"], ["desviacionSalud", "¿Requiere cuidados preventivos y reguladores específicos?", "yes-no"]
    ]}
];

for (const seccion of seccionesValoracion) {
    seccion.campos = seccion.campos.map((campo) => {
        const [clave, etiqueta, tipo, opciones] = campo;
        if (clave === "rolFamilia") return [clave, etiqueta, "select", Array.from({ length: 10 }, (_, i) => `${i + 1}°`)];
        if (clave === "institucion") return [clave, etiqueta, "select-other", ["Universidad Autónoma de Aguascalientes", "Otra institución"]];
        if (clave === "frecuenciaRespiratoria") return [clave, etiqueta, "number", null];
        if (listasValoracion[clave]) return [clave, etiqueta, "select", listasValoracion[clave]];
        if (clave === "servicioSalud" || clave === "cuandoAcude" || clave === "origenAgua" || clave === "deshidratacion" || clave === "datosIntestinales" || clave === "datosVesicales") {
            const actualizadas = opciones.map((opcion) => opcion === "Otro" ? "OTRO" : opcion);
            return [clave, etiqueta, "checks", actualizadas];
        }
        if (["silverman", "anderson"].includes(clave)) return [clave, `${etiqueta} (puntaje 0–10)`, "select", Array.from({ length: 11 }, (_, i) => String(i))];
        if (clave === "perdidas") return [clave, etiqueta, "loss"];
        return campo;
    });
}

seccionesValoracion[0].campos = seccionesValoracion[0].campos.map((campo) => {
    const cambios = {
        religion: ["religion", "Religión", "select-other", listasValoracion.religion],
        parentescoInformante: ["parentescoInformante", "Parentesco del informante", "select-other", listasValoracion.parentescoInformante],
        ocupacion: ["ocupacion", "Ocupación", "select", listasValoracion.ocupacion]
    };
    return cambios[campo[0]] || campo;
});

seccionesValoracion[1].campos = seccionesValoracion[1].campos.map((campo) => {
    const cambios = {
        aguaDiaria: ["aguaDiaria", "Consumo habitual aproximado de agua por día", "select", listasValoracion.aguaDiaria],
        comidasDia: ["comidasDia", "Número de comidas al día", "select", listasValoracion.comidasDia],
        miccionesDia: ["miccionesDia", "Eliminación vesical: frecuencia", "select", listasValoracion.miccionesDia],
        evacuacionesDia: ["evacuacionesDia", "Eliminación intestinal: frecuencia", "select", listasValoracion.evacuacionesDia],
        sufrimientoFetal: ["sufrimientoFetal", "Sufrimiento fetal", "select", listasValoracion.sufrimientoFetal],
        tipoParto: ["tipoParto", "Tipo de parto", "select", listasValoracion.tipoParto],
        controlPrenatal: ["controlPrenatal", "¿Hubo control prenatal?", "yes-no-detail-binary", "Número de controles prenatales", "number"],

        apgar1: ["apgar1", "Apgar al minuto (0–10)", "select", Array.from({ length: 11 }, (_, i) => String(i))],
        apgar5: ["apgar5", "Apgar a los 5 minutos (0–10)", "select", Array.from({ length: 11 }, (_, i) => String(i))],
        reflejos: ["reflejos", "Valoración de reflejos", "reflexes"],
        orinaCaracteristicas: ["orinaCaracteristicas", "Características de la orina", "checks", ["Clara", "Amarilla", "Oscura", "Turbia", "Con sangre", "Espumosa"]],
        evacuacionCaracteristicas: ["evacuacionCaracteristicas", "Escala de Bristol", "bristol", listasValoracion.bristol],
        alimentacionMayor: ["alimentacionMayor", "Frecuencia de consumo de alimentos por grupo", "food-scale"]
    };
    return cambios[campo[0]] || campo;
});

const frecuenciasAlimentarias = ["Nunca", "Casi nunca", "Alguna vez", "Casi siempre", "Siempre"];

const gruposFormatoFisico = [
    [
        { titulo: "A) Descriptivos de la persona", campos: ["domicilio", "zona", "hermanos", "rolFamilia", "ocupacion", "religion", "parentescoInformante", "fechaIngreso", "institucion"] },
        { titulo: "Factores socioculturales", campos: ["residencia", "materialVivienda", "habitaciones", "dormitorios", "serviciosBasicos", "convivenciaFamilia", "tiempoPrincipal", "relacionFamiliar", "ingresoFamiliar"] },
        { titulo: "B) Patrón de vida", campos: ["rolPersona", "vacunacion", "vacunacionDetalle", "banioFrecuencia", "aseoBucalFrecuencia", "aseoManosFrecuencia", "cambioRopaFrecuencia"] },
        { titulo: "C) Estado y sistema de salud", campos: ["servicioSalud", "cuandoAcude", "decisionAtencion", "barrerasSalud"] }
    ],
    [
        { titulo: "A) Requisitos universales · 1. Mantenimiento de un aporte de aire suficiente", campos: ["frecuenciaRespiratoria", "cianosis", "respiratorioDetalle", "fuma", "silverman", "anderson", "desencadenantesRespiratorios", "oxigenoterapia"] },
        { titulo: "A) Requisitos universales · 2. Mantenimiento de un aporte de agua suficiente", campos: ["aguaDiaria", "origenAgua", "otrosLiquidos", "deshidratacion"] },
        { titulo: "A) Requisitos universales · 3. Mantenimiento de un aporte de alimentos suficiente", campos: ["peso", "talla", "perimetroCefalico", "perimetroAbdominal", "comidasDia", "comeFamilia", "suplementos", "proveedorAlimento", "alimentacionLactante", "alimentacionMayor", "padecimientosAlimentos"] },
        { titulo: "A) Requisitos universales · 4. Eliminación y excrementos", campos: ["miccionesDia", "datosVesicales", "orinaCaracteristicas", "evacuacionesDia", "datosIntestinales", "evacuacionCaracteristicas", "medicamentosEvacuar", "secrecionTransvaginal"] },
        { titulo: "A) Requisitos universales · 5. Equilibrio entre actividad y reposo", campos: ["horasSueno", "siestas", "apoyosDormir", "despiertaNoche", "actividadEscolar", "horasActividad", "reflejos", "hitosPrimeraFila", "hitosSegundaFila", "juegosElectronicos", "deporte", "preferencias"] },
        { titulo: "A) Requisitos universales · 6. Equilibrio entre sociedad e interacción humana", campos: ["audicion", "vision", "conductaSocial"] },
        { titulo: "A) Requisitos universales · 7. Prevención de peligros para la vida, funcionamiento y bienestar", campos: ["prevencionAccidentes", "toxicosResguardados", "medicamentosResguardados", "grupoAyuda", "adiccionesPropias"] },
        { titulo: "A) Requisitos universales · 8. Promoción del funcionamiento humano", campos: ["problemaSalud"] },
        { titulo: "B) Desarrollo · Lo que apoya los procesos vitales · 1. Vida intrauterina", campos: ["embarazos", "controlPrenatal", "sufrimientoFetal", "enfermedadesEmbarazo", "toxicomanias", "medicamentosEmbarazo", "malformaciones"] },
        { titulo: "B) Desarrollo · Lo que apoya los procesos vitales · 2. Vida neonatal", campos: ["semanasGestacion", "pesoNacimiento", "tallaNacimiento", "apgar1", "apgar5", "tipoParto"] },
        { titulo: "B) Desarrollo · Lo que apoya los procesos vitales · 3. Infancia y adolescencia", campos: ["denticion", "caries", "ortodoncia", "desarrolloSexual", "cicloMenstrual", "planificacion"] },
        { titulo: "B) Desarrollo · Factores que mitigan o superan efectos negativos", campos: ["aprendizaje", "trabajoInfantil", "recursosEscuela", "perdidas", "cambiosVida", "seEnfermaFrecuencia", "problemasPsicologicos", "autosuficiente", "saludCronica", "peligrosAmbientales"] },
        { titulo: "C) Desviaciones de la salud", campos: ["desviacionSalud"] }
    ]
];

function renderizarValoracion() {
    const destino = document.querySelector("#valuation-fields");
    if (!destino) return;
    const crearCampo = ([clave, etiqueta, tipo, opciones, detalleTipo = "text"]) => {
        const id = `valoracion-${clave}`;
        if (tipo === "address") return `<fieldset class="valuation-field valuation-checks address-field" data-field-key="domicilio"><legend>${etiqueta}</legend><div class="address-grid"><label class="valuation-field"><span>Calle o avenida</span><input name="domicilio" autocomplete="address-line1" placeholder="Ej. Av. Universidad" maxlength="180"></label><label class="valuation-field"><span>Número exterior</span><input name="numeroExterior" autocomplete="address-line2" maxlength="20"></label><label class="valuation-field"><span>Número interior (opcional)</span><input name="numeroInterior" maxlength="20"></label><label class="valuation-field"><span>Colonia o fraccionamiento</span><input name="zona" autocomplete="address-level3" maxlength="120"></label><label class="valuation-field"><span>Municipio o alcaldía</span><input name="municipioDomicilio" autocomplete="address-level2" maxlength="120"></label><label class="valuation-field"><span>Estado</span><input name="estadoDomicilio" autocomplete="address-level1" maxlength="120"></label><label class="valuation-field"><span>Código postal</span><input name="codigoPostal" inputmode="numeric" autocomplete="postal-code" pattern="[0-9]{5}" maxlength="5"></label><label class="valuation-field"><span>País</span><input name="paisDomicilio" autocomplete="country-name" value="México" maxlength="80"></label></div></fieldset>`;
        if (tipo === "checks") return `<fieldset class="valuation-field valuation-checks" data-field-key="${clave}"><legend>${etiqueta}</legend><div class="choice-list">${opciones.filter((opcion) => !opcionesVacias.includes(opcion) && opcion !== "No presenta datos de deshidratación").map((opcion) => { const opcionKey = opcion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); const nombre = `${clave}_${opcionKey}`; const esOtro = opcion.toLowerCase().includes("otro"); return `<label class="valuation-boolean"><input type="checkbox" name="${nombre}" value="${opcion}"${esOtro ? ` data-controls-detail="${nombre}"` : ""}>${opcion}</label>${esOtro ? `<label class="valuation-field dependent-answer" hidden><span>Especifique</span><input name="${nombre}Detalle" data-detail-for="${nombre}" data-detail-value="Sí"></label>` : ""}`; }).join("")}</div></fieldset>`;
        if (tipo === "yes-no-options") return `<fieldset class="valuation-field valuation-checks conditional-question" data-field-key="${clave}"><legend>${etiqueta}</legend><label class="valuation-field"><span>Respuesta</span><select name="${clave}" data-controls-detail="${clave}"><option value="">Selecciona</option>${opcionesEstadoMultiple.map((respuesta) => `<option>${respuesta}</option>`).join("")}</select><fieldset class="valuation-field valuation-checks dependent-answer" hidden data-detail-for="${clave}" data-detail-value="Sí"><legend>${opciones || "Seleccione"}</legend><div class="choice-list">${detalleTipo.map((opcion) => { const opcionKey = opcion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); const nombre = `${clave}_${opcionKey}`; const otro = opcion.toLowerCase().includes("otro"); return `<label class="valuation-boolean"><input type="checkbox" name="${nombre}" value="${opcion}"${otro ? ` data-controls-detail="${nombre}"` : ""}>${opcion}</label>${otro ? `<label class="valuation-field dependent-answer" hidden><span>Especifique</span><input name="${nombre}Detalle" data-detail-for="${nombre}" data-detail-value="Sí"></label>` : ""}`; }).join("")}</div></fieldset></fieldset>`;
        if (tipo === "yes-no") return `<fieldset class="valuation-field valuation-checks" data-field-key="${clave}"><legend>${etiqueta}</legend><div class="choice-list">${["Sí", "No"].map((respuesta) => `<label class="valuation-boolean"><input type="radio" name="${clave}" value="${respuesta}"> ${respuesta}</label>`).join("")}</div></fieldset>`;
        if (tipo === "yes-no-detail-binary") return `<fieldset class="valuation-field valuation-checks conditional-question" data-field-key="${clave}"><legend>${etiqueta}</legend><label class="valuation-field"><span>Respuesta</span><select name="${clave}" data-controls-detail="${clave}"><option value="">Selecciona</option>${["Sí", "No"].map((respuesta) => `<option>${respuesta}</option>`).join("")}</select></label><div class="valuation-field dependent-answer" hidden><label><span>${opciones || "Especifique"}</span><input name="${clave}Detalle" type="${detalleTipo}"${detalleTipo === "number" ? " min=\"0\" step=\"1\"" : ""} data-detail-for="${clave}" data-detail-value="Sí"></label></div></fieldset>`;
        if (tipo === "liquids") return `<fieldset class="valuation-field valuation-checks conditional-question" data-field-key="${clave}"><legend>${etiqueta}</legend><label class="valuation-field"><span>Respuesta</span><select name="${clave}" data-controls-detail="${clave}"><option value="">Selecciona</option>${["Sí", "No"].map((respuesta) => `<option>${respuesta}</option>`).join("")}</select></label><label class="valuation-field dependent-answer" hidden><span>¿Cuál bebida consume?</span><input name="otrosLiquidosBebida" data-detail-for="${clave}" data-detail-value="Sí"></label><label class="valuation-field dependent-answer" hidden><span>Cantidad consumida en 24 horas</span><input name="otrosLiquidosCantidad" type="number" min="0" step="0.1" data-detail-for="${clave}" data-detail-value="Sí"></label></fieldset>`;
        if (tipo === "school-level") return `<fieldset class="valuation-field valuation-checks conditional-question" data-field-key="${clave}"><legend>${etiqueta}</legend><label class="valuation-field"><span>Respuesta</span><select name="${clave}" data-controls-detail="${clave}"><option value="">Selecciona</option>${["Sí", "No"].map((respuesta) => `<option>${respuesta}</option>`).join("")}</select></label><label class="valuation-field dependent-answer" hidden><span>¿En qué nivel?</span><select name="nivelEscolar" data-detail-for="${clave}" data-detail-value="Sí"><option value="">Selecciona</option>${["Guardería", "Kínder", "Primaria", "Secundaria", "Preparatoria"].map((nivel) => `<option>${nivel}</option>`).join("")}</select></label></fieldset>`;        if (tipo === "yes-no-detail") return `<fieldset class="valuation-field valuation-checks conditional-question" data-field-key="${clave}"><legend>${etiqueta}</legend><label class="valuation-field"><span>Respuesta</span><select name="${clave}" data-controls-detail="${clave}"><option value="">Selecciona</option>${opcionesEstadoMultiple.map((respuesta) => `<option>${respuesta}</option>`).join("")}</select></label><div class="valuation-field dependent-answer" hidden><label><span>${opciones || "Especifique"}</span><input name="${clave}Detalle" type="${detalleTipo}"${detalleTipo === "number" ? " min=\"0\" step=\"0.5\"" : ""} data-detail-for="${clave}" data-detail-value="Sí"></label></div></fieldset>`;
        if (tipo === "yes-no-options") return `<fieldset class="valuation-field valuation-checks conditional-question" data-field-key="${clave}"><legend>${etiqueta}</legend><label class="valuation-field"><span>Respuesta</span><select name="${clave}" data-controls-detail="${clave}"><option value="">Selecciona</option>${opcionesEstadoMultiple.map((respuesta) => `<option>${respuesta}</option>`).join("")}</select><fieldset class="valuation-field valuation-checks dependent-answer" hidden data-detail-for="${clave}" data-detail-value="Sí"><legend>${opciones || "Seleccione"}</legend><div class="choice-list">${detalleTipo.map((opcion) => { const opcionKey = opcion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); const nombre = `${clave}_${opcionKey}`; const otro = opcion.toLowerCase().includes("otro"); return `<label class="valuation-boolean"><input type="checkbox" name="${nombre}" value="${opcion}"${otro ? ` data-controls-detail="${nombre}"` : ""}>${opcion}</label>${otro ? `<label class="valuation-field dependent-answer" hidden><span>Especifique</span><input name="${nombre}Detalle" data-detail-for="${nombre}" data-detail-value="Sí"></label>` : ""}`; }).join("")}</div></fieldset></fieldset>`;
        if (tipo === "chronic") return `<fieldset class="valuation-field valuation-checks conditional-question" data-field-key="${clave}"><legend>${etiqueta}</legend><label class="valuation-field"><span>Respuesta</span><select name="${clave}" data-controls-detail="${clave}"><option value="">Selecciona</option>${opcionesEstadoMultiple.map((respuesta) => `<option>${respuesta}</option>`).join("")}</select><label class="valuation-field dependent-answer" hidden><span>¿Cuál es la enfermedad?</span><input name="enfermedadCronicaDetalle" data-detail-for="${clave}" data-detail-value="Sí"></label><label class="valuation-field dependent-answer" hidden><span>¿Es consciente de su enfermedad?</span><select name="concienciaEnfermedad" data-detail-for="${clave}" data-detail-value="Sí"><option value="">Selecciona</option><option>Sí</option><option>No</option></select></label><label class="valuation-field dependent-answer" hidden><span>¿Conoce los riesgos de su enfermedad?</span><select name="riesgosEnfermedad" data-detail-for="${clave}" data-detail-value="Sí"><option value="">Selecciona</option><option>Sí</option><option>No</option></select></label></fieldset>`;
        if (tipo === "environment") return `<fieldset class="valuation-field valuation-checks conditional-question" data-field-key="${clave}"><legend>${etiqueta}</legend><label class="valuation-field"><span>Respuesta</span><select name="${clave}" data-controls-detail="${clave}"><option value="">Selecciona</option>${opcionesEstadoMultiple.map((respuesta) => `<option>${respuesta}</option>`).join("")}</select><fieldset class="valuation-field valuation-checks dependent-answer" hidden data-detail-for="${clave}" data-detail-value="Sí"><legend>Seleccione los peligros ambientales</legend><div class="choice-list">${["Pesticidas", "CO2", "Zona insalubre", "Es adicto", "Convive con adictos"].map((opcion) => { const nombre = `peligro_${opcion.toLowerCase().replaceAll(" ", "_")}`; const detalle = opcion === "Convive con adictos"; return `<label class="valuation-boolean"><input type="checkbox" name="${nombre}" value="${opcion}"${detalle ? ` data-controls-detail="${nombre}"` : ""}>${opcion}</label>${detalle ? `<label class="valuation-field dependent-answer" hidden><span>Especifique con quién</span><input name="${nombre}Detalle" data-detail-for="${nombre}" data-detail-value="Sí"></label>` : ""}`; }).join("")}</div></fieldset></fieldset>`;
        if (tipo === "yes-no-options") return `<fieldset class="valuation-field valuation-checks conditional-question" data-field-key="${clave}"><legend>${etiqueta}</legend><label class="valuation-field"><span>Respuesta</span><select name="${clave}" data-controls-detail="${clave}"><option value="">Selecciona</option>${opcionesEstadoMultiple.map((respuesta) => `<option>${respuesta}</option>`).join("")}</select><fieldset class="valuation-field valuation-checks dependent-answer" hidden data-detail-for="${clave}" data-detail-value="Sí"><legend>${opciones || "Seleccione"}</legend><div class="choice-list">${detalleTipo.map((opcion) => { const opcionKey = opcion.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); const nombre = `${clave}_${opcionKey}`; const otro = opcion.toLowerCase().includes("otro"); return `<label class="valuation-boolean"><input type="checkbox" name="${nombre}" value="${opcion}"${otro ? ` data-controls-detail="${nombre}"` : ""}>${opcion}</label>${otro ? `<label class="valuation-field dependent-answer" hidden><span>Especifique</span><input name="${nombre}Detalle" data-detail-for="${nombre}" data-detail-value="Sí"></label>` : ""}`; }).join("")}</div></fieldset></label></fieldset>`;
        if (tipo === "chronic") return `<fieldset class="valuation-field valuation-checks conditional-question" data-field-key="${clave}"><legend>${etiqueta}</legend><label class="valuation-field"><span>Respuesta</span><select name="${clave}" data-controls-detail="${clave}"><option value="">Selecciona</option>${opcionesEstadoMultiple.map((respuesta) => `<option>${respuesta}</option>`).join("")}</select><label class="valuation-field dependent-answer" hidden><span>¿Cuál es la enfermedad?</span><input name="enfermedadCronicaDetalle" data-detail-for="${clave}" data-detail-value="Sí"></label><label class="valuation-field dependent-answer" hidden><span>¿Es consciente de su enfermedad?</span><select name="concienciaEnfermedad" data-detail-for="${clave}" data-detail-value="Sí"><option value="">Selecciona</option><option>Sí</option><option>No</option></select></label><label class="valuation-field dependent-answer" hidden><span>¿Conoce los riesgos de su enfermedad?</span><select name="riesgosEnfermedad" data-detail-for="${clave}" data-detail-value="Sí"><option value="">Selecciona</option><option>Sí</option><option>No</option></select></label></fieldset>`;
        if (tipo === "environment") return `<fieldset class="valuation-field valuation-checks conditional-question" data-field-key="${clave}"><legend>${etiqueta}</legend><label class="valuation-field"><span>Respuesta</span><select name="${clave}" data-controls-detail="${clave}"><option value="">Selecciona</option>${opcionesEstadoMultiple.map((respuesta) => `<option>${respuesta}</option>`).join("")}</select><fieldset class="valuation-field valuation-checks dependent-answer" hidden data-detail-for="${clave}" data-detail-value="Sí"><legend>Seleccione los peligros ambientales</legend><div class="choice-list">${["Pesticidas", "CO2", "Zona insalubre", "Es adicto", "Convive con adictos"].map((opcion) => { const nombre = `peligro_${opcion.toLowerCase().replaceAll(" ", "_")}`; const detalle = opcion === "Convive con adictos"; return `<label class="valuation-boolean"><input type="checkbox" name="${nombre}" value="${opcion}"${detalle ? ` data-controls-detail="${nombre}"` : ""}>${opcion}</label>${detalle ? `<label class="valuation-field dependent-answer" hidden><span>Especifique con quién</span><input name="${nombre}Detalle" data-detail-for="${nombre}" data-detail-value="Sí"></label>` : ""}`; }).join("")}</div></fieldset></label></fieldset>`;
        if (tipo === "activity-detail") return `<fieldset class="valuation-field valuation-checks conditional-question" data-field-key="${clave}"><legend>${etiqueta}</legend><label class="valuation-field"><span>Respuesta</span><select name="${clave}" data-controls-detail="${clave}"><option value="">Selecciona</option>${opcionesEstadoMultiple.map((respuesta) => `<option>${respuesta}</option>`).join("")}</select></label><label class="valuation-field dependent-answer" hidden><span>¿Qué deporte o actividad artística realiza?</span><input name="deporteDetalle" data-detail-for="${clave}" data-detail-value="Sí"></label><label class="valuation-field dependent-answer" hidden><span>Horas que realiza la actividad</span><input name="horasDeporte" type="number" min="0" max="24" step="0.5" data-detail-for="${clave}" data-detail-value="Sí"></label></fieldset>`;
        if (tipo === "hearing") return `<fieldset class="valuation-field valuation-checks conditional-question" data-field-key="${clave}"><legend>${etiqueta}</legend><label class="valuation-field"><span>Respuesta</span><select name="${clave}" data-controls-detail="${clave}"><option value="">Selecciona</option>${opcionesEstadoMultiple.map((respuesta) => `<option>${respuesta}</option>`).join("")}</select></label><label class="valuation-field dependent-answer" hidden><span>¿Cuenta con apoyo para escuchar?</span><select name="apoyoAuditivo" data-detail-for="${clave}" data-detail-value="Sí"><option value="">Selecciona</option>${opcionesEstadoMultiple.map((respuesta) => `<option>${respuesta}</option>`).join("")}</select></label></fieldset>`;
        if (tipo === "vision") return `<fieldset class="valuation-field valuation-checks conditional-question" data-field-key="${clave}"><legend>${etiqueta}</legend><label class="valuation-field"><span>Respuesta</span><select name="${clave}" data-controls-detail="${clave}"><option value="">Selecciona</option>${opcionesEstadoMultiple.map((respuesta) => `<option>${respuesta}</option>`).join("")}</select></label><label class="valuation-field dependent-answer" hidden><span>Especifique el problema visual</span><input name="visionDetalle" data-detail-for="${clave}" data-detail-value="Sí"></label><label class="valuation-field dependent-answer" hidden><span>¿Usa lentes?</span><select name="usaLentes" data-detail-for="${clave}" data-detail-value="Sí" data-controls-detail="usaLentes"><option value="">Selecciona</option>${opcionesEstadoMultiple.map((respuesta) => `<option>${respuesta}</option>`).join("")}</select></label><label class="valuation-field dependent-answer" hidden><span>Horas de uso de lentes por día</span><input name="horasLentes" type="number" min="0" max="24" step="0.5" data-detail-for="usaLentes" data-detail-value="Sí"></label></fieldset>`;
        if (tipo === "select-other") return `<label class="valuation-field" for="${id}"><span>${etiqueta}</span><select id="${id}" name="${clave}"${clave === "sexo" ? " required" : ""}><option value="">Selecciona</option>${opciones.concat(opcionesVacias).map((opcion) => `<option>${opcion}</option>`).join("")}</select><input class="other-detail" name="${clave}Otro" data-other-for="${clave}" placeholder="Especifique" aria-label="Especifique ${etiqueta.toLowerCase()}" hidden></label>`;
        if (tipo === "food-scale") return `<fieldset class="valuation-field valuation-checks food-scale" data-field-key="${clave}"><legend>${etiqueta}</legend>${["Cereales", "Vegetales", "Frutas", "Carnes", "Lácteos", "Leguminosas"].map((grupo) => `<fieldset class="food-row"><legend>${grupo}</legend><div class="choice-list">${frecuenciasAlimentarias.map((opcion) => `<label><input type="radio" name="${clave}_${grupo.toLowerCase()}" value="${opcion}"> ${opcion}</label>`).join("")}</div></fieldset>`).join("")}</fieldset>`;
        if (tipo === "bristol") return `<fieldset class="valuation-field valuation-checks" data-field-key="${clave}"><legend>${etiqueta}</legend><div class="choice-list">${opciones.map((opcion, indice) => `<label class="valuation-boolean"><input type="checkbox" name="${clave}_${indice + 1}" value="${indice + 1}"> ${opcion}</label>`).join("")}</div></fieldset>`;
        if (tipo === "reflexes") return `<fieldset class="valuation-field valuation-checks" data-field-key="${clave}"><legend>${etiqueta}</legend>${["Búsqueda", "Succión", "Marcha", "Prensión"].map((reflejo) => `<fieldset class="food-row"><legend>${reflejo}</legend><div class="choice-list">${["Presente", "Disminuido", "Ausente", "No se valoró"].map((opcion) => `<label><input type="radio" name="${clave}_${reflejo.toLowerCase().replaceAll(" ", "_")}" value="${opcion}"> ${opcion}</label>`).join("")}</div></fieldset>`).join("")}</fieldset>`;
        if (tipo === "milestones-first") return `<fieldset class="valuation-field valuation-checks" data-field-key="${clave}"><legend>${etiqueta}</legend><div class="choice-list">${["Sostiene la cabeza", "Se sostiene sentado", "Localiza objetos con la mirada", "Reconoce voces"].map((opcion, indice) => `<label class="valuation-boolean"><input type="checkbox" name="hito_${["sostieneCabeza", "sentado", "localizaObjetos", "reconoceVoces"][indice]}" value="${opcion}"> ${opcion}</label>`).join("")}</div></fieldset>`;
        if (tipo === "milestones-second") return `<fieldset class="valuation-field valuation-checks conditional-question" data-field-key="${clave}"><legend>${etiqueta}</legend><div class="choice-list">${["Sujeta objetos", "Gatea", "Camina solo"].map((opcion, indice) => `<label class="valuation-boolean"><input type="checkbox" name="hito_${["sujetaObjetos", "gatea", "caminaSolo"][indice]}" value="${opcion}"> ${opcion}</label>`).join("")}<label class="valuation-boolean"><input type="checkbox" name="hito_conAndadera" value="Con andadera"> Con andadera</label><label class="valuation-boolean"><input type="checkbox" name="hito_conAyuda" value="Sí" data-controls-detail="hito_conAyuda"> Con ayuda</label><label class="valuation-boolean"><input type="checkbox" name="hito_conAyuda" value="Sí" data-controls-detail="hito_conAyuda"> Con ayuda</label><label class="valuation-field dependent-answer" hidden><span>Especifique el tipo de ayuda requerida</span><input name="tipoAyudaMarcha" data-detail-for="hito_conAyuda" data-detail-value="Sí"></label></div></fieldset>`;
        if (tipo === "menstrual-cycle") return `<fieldset class="valuation-field valuation-checks conditional-question" data-field-key="${clave}"><legend>${etiqueta}</legend><fieldset class="valuation-field valuation-checks"><legend>Características</legend><div class="choice-list">${["Regular", "Irregular", "Dismenorrea"].map((opcion) => `<label class="valuation-boolean"><input type="checkbox" name="${clave}_${opcion.toLowerCase()}" value="${opcion}"> ${opcion}</label>`).join("")}</div></fieldset><label class="valuation-field"><span>Duración del ciclo</span><input name="duracionCiclo" type="text" placeholder="Ej. 28 días"></label></fieldset>`;
        if (tipo === "secondary-development") return `<fieldset class="valuation-field valuation-checks conditional-question" data-field-key="${clave}"><legend>${etiqueta}</legend><label class="valuation-field"><span>Edad de aparición</span><input name="edadAparicionCaracteristicasSexuales" type="number" min="0" step="0.5"></label><fieldset class="valuation-field valuation-checks"><legend>Desarrollo</legend><div class="choice-list">${["Desarrollo normal", "Desarrollo anormal"].map((opcion) => `<label class="valuation-boolean"><input type="radio" name="${clave}" value="${opcion}" data-controls-detail="${clave}"> ${opcion}</label>`).join("")}</div></fieldset><label class="valuation-field dependent-answer" hidden><span>Especifique las alteraciones observadas</span><input name="alteracionesDesarrolloSexualDetalle" data-detail-for="${clave}" data-detail-value="Desarrollo anormal"></label></fieldset>`;
        if (tipo === "loss") return `<fieldset class="valuation-field valuation-checks conditional-question" data-field-key="${clave}"><legend>${etiqueta}</legend><label class="valuation-field"><span>Respuesta</span><select name="perdidaImportante" data-controls-detail="perdidaImportante"><option value="">Selecciona</option>${opcionesEstadoMultiple.map((respuesta) => `<option>${respuesta}</option>`).join("")}</select></label><div class="valuation-grid dependent-answer" hidden data-detail-for="perdidaImportante" data-detail-value="Sí"><label class="valuation-field"><span>Tipo de pérdida</span><select name="tipoPerdida"><option value="">Selecciona</option>${["Familiar", "Amigo/a", "Mascota", ...opcionesVacias].map((opcion) => `<option>${opcion}</option>`).join("")}</select></label><label class="valuation-field"><span>¿Cuándo ocurrió?</span><select name="cuandoPerdida"><option value="">Selecciona</option>${["Menos de 6 meses", "6–12 meses", "1–5 años", "Más de 5 años", ...opcionesVacias].map((opcion) => `<option>${opcion}</option>`).join("")}</select></label><label class="valuation-field valuation-wide"><span>Respuesta al duelo</span><textarea name="respuestaDueloTexto" rows="2"></textarea></label></div></fieldset>`;
        if (tipo === "check") return `<fieldset class="valuation-field"><legend>${etiqueta}</legend><div class="choice-list">${["Sí", "No", "No sabe", ...opcionesVacias].map((opcion) => `<label class="valuation-boolean"><input type="radio" name="${clave}" value="${opcion}"> ${opcion}</label>`).join("")}</div></fieldset>`;
        if (tipo === "select") return `<label class="valuation-field" for="${id}"><span>${etiqueta}</span><select id="${id}" name="${clave}"${clave === "sexo" ? " required" : ""}${clave.startsWith("apgar") ? " min=\"0\" max=\"10\" step=\"1\"" : ""}><option value="">Selecciona</option>${opciones.concat(opcionesVacias).map((opcion) => `<option>${opcion}</option>`).join("")}</select>${opciones.some((opcion) => ["otro", "otra"].includes(opcion.toLowerCase())) ? `<input class="other-detail" name="${clave}Otro" data-other-for="${clave}" placeholder="Especifique otro" aria-label="Especifique otro" hidden>` : ""}</label>`;
        if (tipo === "textarea") return `<label class="valuation-field valuation-wide" for="${id}"><span>${etiqueta}</span><textarea id="${id}" name="${clave}" rows="2"></textarea></label>`;
    const ayudaCampo = clave === "vacunacionDetalle" ? " placeholder=\"Ej. vacuna y dosis pendiente que aparecen en la Cartilla\"" : "";
        return `<label class="valuation-field" for="${id}"><span>${etiqueta}</span><input id="${id}" name="${clave}" type="${tipo}"${ayudaCampo}${clave === "nombre" ? " required maxlength=\"150\"" : clave === "fechaNacimiento" ? " required" : tipo === "number" ? " step=\"any\" min=\"0\"" : ""}></label>`;
    };
    destino.innerHTML = `<fieldset class="valuation-group"><legend>1. Datos del tutor o informante</legend><div class="valuation-grid"><label class="valuation-field"><span>Nombre del tutor *</span><input name="tutorNombre" required maxlength="150"></label><label class="valuation-field"><span>Parentesco *</span><select name="tutorParentesco" required><option value="">Selecciona</option>${["Madre", "Padre", "Abuelo(a)", "Tío(a)", "Hermano(a)", "Tutor", "Otro"].map((opcion) => `<option>${opcion}</option>`).join("")}</select></label><label class="valuation-field"><span>Número telefónico *</span><input name="tutorTelefono" type="tel" required maxlength="20" autocomplete="tel"></label></div></fieldset><fieldset class="valuation-group"><legend>2. Datos del paciente y valoración</legend><div class="valuation-grid"><label class="valuation-field"><span>Nombre del paciente *</span><input name="pacienteNombre" required maxlength="150"></label><label class="valuation-field"><span>Fecha de nacimiento *</span><input name="fechaNacimiento" type="date" required></label><label class="valuation-field"><span>Edad (meses)</span><input name="edadMeses" type="number" min="0" step="1" readonly aria-live="polite"></label><label class="valuation-field"><span>Sexo *</span><select name="sexo" required><option value="">Selecciona</option>${["Masculino", "Femenino", "Otro"].map((opcion) => `<option>${opcion}</option>`).join("")}</select></label><label class="valuation-field"><span>Lugar de nacimiento</span><input name="lugarNacimiento" maxlength="150" autocomplete="address-level2"></label><label class="valuation-field"><span>Fecha de valoración *</span><input name="fechaValoracion" type="date" required></label></div></fieldset>` + seccionesValoracion.map((seccion, indice) => `<details class="valuation-group" ${indice < 2 ? "open" : ""}><summary>${seccion.titulo}</summary><div class="valuation-grid">${seccion.campos.map(crearCampo).join("")}${indice === 0 ? `<label class="valuation-field"><span>Frecuencia de baño</span><select name="banioFrecuencia"><option value="">Selecciona</option>${listasValoracion.higieneFrecuencia.map((opcion) => `<option>${opcion}</option>`).join("")}${opcionesVacias.map((opcion) => `<option>${opcion}</option>`).join("")}</select></label><label class="valuation-field"><span>Frecuencia de aseo bucal</span><select name="aseoBucalFrecuencia"><option value="">Selecciona</option>${listasValoracion.higieneFrecuencia.map((opcion) => `<option>${opcion}</option>`).join("")}${opcionesVacias.map((opcion) => `<option>${opcion}</option>`).join("")}</select></label><label class="valuation-field"><span>Frecuencia de aseo de manos</span><select name="aseoManosFrecuencia"><option value="">Selecciona</option>${listasValoracion.higieneFrecuencia.map((opcion) => `<option>${opcion}</option>`).join("")}${opcionesVacias.map((opcion) => `<option>${opcion}</option>`).join("")}</select></label><label class="valuation-field"><span>Frecuencia de cambio de ropa</span><select name="cambioRopaFrecuencia"><option value="">Selecciona</option>${listasValoracion.higieneFrecuencia.map((opcion) => `<option>${opcion}</option>`).join("")}${opcionesVacias.map((opcion) => `<option>${opcion}</option>`).join("")}</select></label>` : ""}<label class="valuation-field"><span>Estado de datos de esta sección</span><select name="estado_${indice}"><option value="">Sin indicar</option><option>Valorado</option><option>No aplica</option><option>No se valoró</option></select></label><label class="valuation-field valuation-wide"><span>Observaciones de la sección (opcional)</span><textarea name="observaciones_${indice}" rows="2"></textarea></label></div></details>`).join("") + `<p class="clinical-guidance" id="rr-guidance" aria-live="polite"></p>`;
    destino.insertAdjacentHTML("beforeend", `<label class="valuation-field final-observations"><span>Observaciones finales del evaluador (opcional)</span><textarea name="observacionesFinales" rows="4"></textarea></label>`);
    const seccionSueno = destino.querySelector('details.valuation-group:nth-of-type(2) .valuation-grid');
    if (seccionSueno) seccionSueno.insertAdjacentHTML("beforeend", `<p class="clinical-guidance valuation-wide" id="sleep-guidance" aria-live="polite"></p>`);
    destino.querySelectorAll("details.valuation-group").forEach((seccion, indice) => {
        const rejilla = seccion.querySelector(":scope > .valuation-grid");
        if (!rejilla) return;
        const contenedorSubsecciones = document.createElement("div");
        contenedorSubsecciones.className = "valuation-subsections";
        const usadas = new Set();
        for (const subseccionDef of gruposFormatoFisico[indice]) {
            const subseccion = document.createElement("section");
            subseccion.className = "valuation-subsection";
            const encabezado = document.createElement("h3");
            encabezado.textContent = subseccionDef.titulo;
            const camposSubseccion = document.createElement("div");
            camposSubseccion.className = "valuation-subsection-grid";
            subseccion.append(encabezado, camposSubseccion);
            for (const clave of subseccionDef.campos) {
                let campo = rejilla.querySelector(`[data-field-key="${clave}"]`);
                if (!campo) campo = rejilla.querySelector(`[name="${clave}"]`)?.closest(".valuation-field");
            if (!campo || usadas.has(campo)) continue;
                usadas.add(campo);
                camposSubseccion.append(campo);
            }
            if (camposSubseccion.childElementCount) contenedorSubsecciones.append(subseccion);
        }
        const camposRestantes = Array.from(rejilla.children);
        const metadatos = document.createElement("div");
        metadatos.className = "valuation-section-meta";
        camposRestantes.forEach((campo) => metadatos.append(campo));
        if (metadatos.childElementCount) contenedorSubsecciones.append(metadatos);
        rejilla.replaceChildren(contenedorSubsecciones);
    });
    const panelTutor = document.createElement("section");
    const panelPaciente = document.createElement("section");
    const panelGuia = document.createElement("section");
    panelTutor.className = panelPaciente.className = panelGuia.className = "valuation-step";
    panelPaciente.hidden = true;
    panelGuia.hidden = true;
    const nodosIniciales = Array.from(destino.children);
    nodosIniciales.slice(0, 1).forEach((nodo) => panelTutor.append(nodo));
    nodosIniciales.slice(1, 2).forEach((nodo) => panelPaciente.append(nodo));
    nodosIniciales.slice(2).forEach((nodo) => panelGuia.append(nodo));
    panelTutor.insertAdjacentHTML("beforeend", `<div class="form-actions"><span></span><button type="button" class="submit-button" data-step-next="patient">Continuar con datos del paciente</button></div>`);
    panelPaciente.insertAdjacentHTML("beforeend", `<p class="clinical-guidance" id="age-group-guidance" aria-live="polite">Ingresa fecha de nacimiento y sexo.</p><div class="form-actions"><button type="button" class="valuation-back" data-step-back="tutor">Volver</button><button type="button" class="submit-button" data-step-next="guide">Continuar a la guía ABCC</button></div>`);
    panelGuia.insertAdjacentHTML("afterbegin", `<div class="form-actions"><button type="button" class="valuation-back" data-step-back="patient">Volver a datos del paciente</button></div><p class="clinical-guidance">Antecedentes de vida intrauterina y neonatal: responder con apoyo de la madre o informante.</p>`);
    destino.replaceChildren(panelTutor, panelPaciente, panelGuia);
    const actionsFinales = document.querySelector("#valuation-form > .form-actions");
    if (actionsFinales) actionsFinales.hidden = true;
    panelGuia.querySelectorAll("details.valuation-group").forEach((grupo) => { grupo.open = true; });
    // Los datos del paciente quedan en el segundo paso del flujo.
    const detalleVacunacion = panelGuia.querySelector('[name="vacunacionDetalle"]');
    if (detalleVacunacion) {
        detalleVacunacion.dataset.detailFor = "vacunacion";
        detalleVacunacion.dataset.detailValue = "Incompleto";
        detalleVacunacion.closest(".valuation-field").hidden = true;
        detalleVacunacion.disabled = true;
    }
    const campoPlanificacion = panelGuia.querySelector('[data-field-key="planificacion"]');
    if (campoPlanificacion) {
        const bloquePrivado = document.createElement("details");
        bloquePrivado.className = "valuation-private valuation-wide";
        bloquePrivado.innerHTML = "<summary>Sección confidencial · planificación familiar</summary>";
        campoPlanificacion.replaceWith(bloquePrivado);
        bloquePrivado.append(campoPlanificacion);
    }

    const fecha = destino.querySelector('[name="fechaValoracion"]');
    fecha.value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const nombrePaciente = destino.querySelector('[name="pacienteNombre"]');
    const fechaNacimientoPaciente = destino.querySelector('[name="fechaNacimiento"]');
    const sexoPaciente = destino.querySelector('[name="sexo"]');
    const edadMeses = destino.querySelector('[name="edadMeses"]');
    edadMeses.readOnly = true;
    fechaNacimientoPaciente.max = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const guiaGrupoEdad = destino.querySelector("#age-group-guidance");
    const obtenerEdad = () => {
        if (!fechaNacimientoPaciente.value) return null;
        const [anio, mes, dia] = fechaNacimientoPaciente.value.split("-").map(Number);
        const hoy = new Date();
        const nacimientoLocal = new Date(anio, mes - 1, dia);
        if (nacimientoLocal > new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) return null;
        const meses = (hoy.getFullYear() - anio) * 12 + hoy.getMonth() - (mes - 1) - (hoy.getDate() < dia ? 1 : 0);
        const dias = Math.floor((new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) - nacimientoLocal) / 86400000);
        let grupo = dias <= 28 ? "Recién nacido" : meses < 12 ? "Lactante" : meses < 72 ? "Toddler / preescolar" : meses < 144 ? "Escolar" : meses <= 216 ? "Adolescente" : "Fuera del rango pediátrico";
        return { meses, dias, grupo };
    };
    const sincronizarCamposDependientes = () => {
        destino.querySelectorAll("[data-detail-for]").forEach((detalle) => {
            const respuesta = destino.querySelector(`[name="${detalle.dataset.detailFor}"]`);
            const visible = Boolean(respuesta && !respuesta.disabled && (
                respuesta.type === "checkbox" ? respuesta.checked
                    : respuesta.type === "radio" ? respuesta.checked && respuesta.value === detalle.dataset.detailValue
                        : respuesta.value === detalle.dataset.detailValue
            ));
            const campo = detalle.closest(".valuation-field");
            if (campo) campo.hidden = !visible;
            detalle.disabled = !visible;
            if (detalle.matches("fieldset, .valuation-grid")) {
                detalle.querySelectorAll("input, select, textarea").forEach((control) => { control.disabled = !visible; });
            } else {
                detalle.required = visible && detalle.matches("input:not([type=checkbox]), textarea, select") && !detalle.closest("fieldset[data-detail-for]");
                if (!visible && "value" in detalle) detalle.value = "";
            }
            if (!visible && detalle.matches("fieldset, .valuation-grid")) {
                detalle.querySelectorAll("input, select, textarea").forEach((control) => {
                    if (control.type === "checkbox" || control.type === "radio") control.checked = false;
                    else control.value = "";
                });
            }
        });
    };
    const controlarVisibilidadPorEdad = () => {
        const edadActual = obtenerEdad();
        edadMeses.value = edadActual ? String(edadActual.meses) : "";
        guiaGrupoEdad.textContent = edadActual
            ? `Edad: ${edadActual.meses} meses${edadActual.dias <= 28 ? ` (${edadActual.dias} días de vida)` : ""} · ${edadActual.grupo}${sexoPaciente.value ? ` · ${sexoPaciente.value}` : ""}`
            : "Ingresa una fecha de nacimiento válida para calcular la edad en meses.";
        const permitido = edadActual && edadActual.meses <= 216;
        const reglas = {
            silverman: permitido && edadActual.dias <= 28,
            anderson: permitido && edadActual.meses < 24,
            perimetroCefalico: permitido && edadActual.meses <= 36,
            alimentacionLactante: permitido && edadActual.meses <= 12,
            alimentacionMayor: permitido && edadActual.meses >= 12,
            fuma: permitido && edadActual.meses >= 120,
            juegosElectronicos: permitido && edadActual.meses >= 60,
            preferencias: permitido && edadActual.meses >= 60,
            trabajoInfantil: permitido && edadActual.meses >= 120,
            denticion: permitido && edadActual.meses <= 72,
            desarrolloSexual: permitido && edadActual.meses >= 96,
            cicloMenstrual: permitido && sexoPaciente.value === "Femenino" && edadActual.meses >= 108,
            planificacion: permitido && edadActual.meses >= 144,
            secrecionTransvaginal: permitido && sexoPaciente.value === "Femenino",
            adiccionesPropias: permitido && edadActual.meses >= 120
        };
        Object.entries(reglas).forEach(([clave, visible]) => {
            const control = panelGuia.querySelector(`[name="${clave}"]`);
            const campo = clave === "planificacion" ? control?.closest("details.valuation-private") : control?.closest("[data-field-key]") || control?.closest("label.valuation-field") || control?.closest("fieldset.valuation-field");
            if (!campo) return;
            campo.hidden = !visible;
            campo.querySelectorAll("input, select, textarea").forEach((elemento) => { elemento.disabled = !visible; });
        });
        const fontanela = panelGuia.querySelector('[name="deshidratacion_fontanela_hundida"]')?.closest(".choice-status-row");
        if (fontanela) { fontanela.hidden = !permitido || edadActual.meses > 18; fontanela.querySelectorAll("input, select").forEach((input) => { input.disabled = fontanela.hidden; }); }
        [["reflejos_búsqueda", 6], ["reflejos_succión", 6], ["reflejos_marcha", 12], ["reflejos_prensión", 12]].forEach(([nombre, maximo]) => {
            const control = panelGuia.querySelector(`[name="${nombre}"]`);
            const fila = control?.closest("fieldset.food-row");
            if (fila) { fila.hidden = !permitido || edadActual.meses > maximo; fila.querySelectorAll("input").forEach((input) => { input.disabled = fila.hidden; }); }
        });
        const controlReflejos = panelGuia.querySelector('[name="reflejos_búsqueda"]');
        const grupoReflejos = controlReflejos?.closest("fieldset.valuation-field");
        if (grupoReflejos) {
            grupoReflejos.hidden = !permitido || edadActual.meses > 12;
            grupoReflejos.querySelectorAll("input").forEach((input) => { input.disabled = grupoReflejos.hidden || input.closest("fieldset.food-row")?.hidden; });
        }
        const actividadEscolar = panelGuia.querySelector('[data-field-key="actividadEscolar"]');
        if (actividadEscolar) { actividadEscolar.hidden = !permitido; actividadEscolar.querySelectorAll("input, select, textarea").forEach((input) => { input.disabled = !permitido; }); }
        const problemasPsicologicos = panelGuia.querySelector('[data-field-key="problemasPsicologicos"]');
        const edadProblemasPsicologicosValida = permitido && edadActual.meses >= 72;
        if (problemasPsicologicos) { problemasPsicologicos.hidden = !edadProblemasPsicologicosValida; problemasPsicologicos.querySelectorAll("input").forEach((input) => { input.disabled = !edadProblemasPsicologicosValida; }); }
        const autosuficiente = panelGuia.querySelector('[data-field-key="autosuficiente"]');
        const edadAutosuficienciaValida = permitido && edadActual.meses >= 72;
        if (autosuficiente) { autosuficiente.hidden = !edadAutosuficienciaValida; autosuficiente.querySelectorAll("input").forEach((input) => { input.disabled = !edadAutosuficienciaValida; }); }
        const hitosDesarrollo = panelGuia.querySelectorAll('[data-field-key="hitosPrimeraFila"], [data-field-key="hitosSegundaFila"]');
        hitosDesarrollo.forEach((campo) => { campo.hidden = !permitido; campo.querySelectorAll("input").forEach((input) => { input.disabled = !permitido; }); });
        const nivelEscolar = panelGuia.querySelector('[name="nivelEscolar"]');
        if (nivelEscolar) {
            const edadesNivel = {
                "Guardería": (m) => m < 48,
                "Kínder": (m) => m >= 36 && m < 84,
                "Primaria": (m) => m >= 72 && m < 144,
                "Secundaria": (m) => m >= 144 && m < 180,
                "Preparatoria": (m) => m >= 180 && m <= 216
            };
            Array.from(nivelEscolar.options).forEach((option) => {
                if (!edadesNivel[option.value]) return;
                option.hidden = !permitido || !edadesNivel[option.value](edadActual.meses);
                if (option.hidden && option.selected) nivelEscolar.value = "";
            });
        }
        sincronizarCamposDependientes();
        if (!permitido) guiaGrupoEdad.textContent = edadActual ? "El formulario está diseñado para pacientes de 0 a 18 años." : "Ingresa una fecha de nacimiento válida para calcular la edad en meses.";
    };
    [fechaNacimientoPaciente, sexoPaciente].forEach((control) => control.addEventListener("change", controlarVisibilidadPorEdad));
    destino.querySelector('[data-step-next="patient"]').addEventListener("click", () => {
        const camposTutor = Array.from(panelTutor.querySelectorAll("[required]"));
        if (!camposTutor.every((campo) => campo.reportValidity())) return;
        panelTutor.hidden = true; panelPaciente.hidden = false;
    });
    destino.querySelector('[data-step-back="tutor"]').addEventListener("click", () => { panelPaciente.hidden = true; panelTutor.hidden = false; });
    destino.querySelector('[data-step-next="guide"]').addEventListener("click", () => {
        const camposPaciente = [nombrePaciente, fechaNacimientoPaciente, sexoPaciente];
        if (!camposPaciente.every((campo) => campo.reportValidity())) return;
        const edadActual = obtenerEdad();
        if (!edadActual || edadActual.meses > 216) { controlarVisibilidadPorEdad(); fechaNacimientoPaciente.reportValidity(); return; }
        controlarVisibilidadPorEdad(); panelPaciente.hidden = true; panelGuia.hidden = false;
        if (actionsFinales) actionsFinales.hidden = false;
    });
    destino.querySelector('[data-step-back="patient"]').addEventListener("click", () => { panelGuia.hidden = true; panelPaciente.hidden = false; if (actionsFinales) actionsFinales.hidden = true; });
    controlarVisibilidadPorEdad();

    destino.addEventListener("change", (evento) => {
        const select = evento.target.closest("select[name]");
        if (select) {
            const detalle = select.parentElement.querySelector(`[data-other-for="${select.name}"]`);
            if (detalle) { detalle.hidden = !select.value.toLowerCase().includes("otro"); detalle.required = !detalle.hidden; if (detalle.hidden) detalle.value = ""; }
            sincronizarCamposDependientes();
        }
        const check = evento.target.closest('input[type="checkbox"][name]');
        if (check) {
            const detalle = check.closest("fieldset")?.querySelector(`[data-other-for="${check.name}"]`);
            if (detalle && check.value.toLowerCase().includes("otro")) { detalle.hidden = !check.checked; detalle.required = check.checked; if (detalle.hidden) detalle.value = ""; }
        }
        if (evento.target.matches('input[type="checkbox"][data-controls-detail]')) sincronizarCamposDependientes();
        if (evento.target.matches('input[type="radio"][name]')) sincronizarCamposDependientes();
    });
    destino.addEventListener("input", (evento) => {
        const campo = evento.target.closest('input[name="horasLentes"], input[name="horasDeporte"], input[name="siestasDetalle"]');
        if (campo && Number(campo.value) > 24) campo.value = "24";
    });
    sincronizarCamposDependientes();

    const edad = edadMeses;
    const nacimiento = destino.querySelector('[name="fechaNacimiento"]');
    const respiraciones = destino.querySelector('[name="frecuenciaRespiratoria"]');
    const guia = destino.querySelector("#rr-guidance");
    const guiaSueno = destino.querySelector("#sleep-guidance");
    const actualizarReferenciaRespiratoria = () => {
        let edadAnios = Number(edad.value) / 12;
        if (!edad.value && nacimiento.value) edadAnios = (Date.now() - new Date(`${nacimiento.value}T00:00:00`)) / (365.25 * 24 * 60 * 60 * 1000);
        let rango;
        if (edadAnios < 2 / 12) rango = [40, 60];
        else if (edadAnios < 1) rango = [25, 50];
        else if (edadAnios <= 5) rango = [20, 40];
        else { guia.textContent = edadAnios ? "No hay rango automático configurado para mayores de 5 años; interpreta el dato con la referencia clínica correspondiente." : "Ingresa la edad o fecha de nacimiento para mostrar la referencia respiratoria."; return; }
        const valor = Number(respiraciones.value);
        guia.textContent = respiraciones.value && (valor < rango[0] || valor > rango[1])
            ? `Revisar: ${valor} respiraciones/min está fuera de la referencia orientativa para esta edad (${rango[0]}–${rango[1]}/min). Confirma la medición y valora clínicamente.`
            : `Referencia orientativa OMS para esta edad: ${rango[0]}–${rango[1]} respiraciones/min.`;
    };
    [edad, nacimiento, respiraciones].forEach((campo) => campo.addEventListener("input", actualizarReferenciaRespiratoria));
    const actualizarReferenciaSueno = () => {
        let anios = Number(edad.value) / 12;
        if (!edad.value && nacimiento.value) anios = (Date.now() - new Date(`${nacimiento.value}T00:00:00`)) / (365.25 * 24 * 60 * 60 * 1000);
        if (!anios || anios < 4 / 12) guiaSueno.textContent = "Para menores de 4 meses no hay recomendación horaria estándar en esta escala.";
        else if (anios < 1) guiaSueno.textContent = "Referencia AASM: 12–16 horas por 24 h, incluidas siestas (4–12 meses).";
        else if (anios < 3) guiaSueno.textContent = "Referencia AASM: 11–14 horas por 24 h, incluidas siestas (1–2 años).";
        else if (anios < 6) guiaSueno.textContent = "Referencia AASM: 10–13 horas por 24 h, incluidas siestas (3–5 años).";
        else if (anios < 13) guiaSueno.textContent = "Referencia AASM: 9–12 horas por 24 h (6–12 años).";
        else if (anios <= 18) guiaSueno.textContent = "Referencia AASM: 8–10 horas por 24 h (13–18 años).";
        else guiaSueno.textContent = "Sin referencia pediátrica configurada para esta edad.";
    };
    [edad, nacimiento].forEach((campo) => campo.addEventListener("input", actualizarReferenciaSueno));
    actualizarReferenciaRespiratoria();
    actualizarReferenciaSueno();
    document.querySelector("#valuation-form").addEventListener("reset", () => {
        destino.querySelectorAll(".other-detail").forEach((campo) => { campo.hidden = true; campo.required = false; });
        setTimeout(() => {
            panelTutor.hidden = false; panelPaciente.hidden = true; panelGuia.hidden = true;
            if (actionsFinales) actionsFinales.hidden = true;
            panelGuia.querySelectorAll("details.valuation-private").forEach((detalle) => { detalle.open = false; });
            controlarVisibilidadPorEdad(); actualizarReferenciaRespiratoria(); actualizarReferenciaSueno();
        }, 0);
    });
}

try {
    renderizarValoracion();
} catch (error) {
    // Un error en el formulario de altas no debe impedir que cargue el dashboard.
    console.error("No se pudo inicializar el formulario de valoraciones:", error);
}

document.querySelector("#valuation-form")?.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const boton = formulario.querySelector('button[type="submit"]');
    const mensaje = document.querySelector("#valuation-message");
    const valores = new FormData(formulario);
    const datos = {};
    for (const [clave, valor] of valores.entries()) {
        if (["pacienteNombre", "tutorNombre", "tutorParentesco", "tutorTelefono", "fechaValoracion"].includes(clave)) continue;
        if (clave.endsWith("Otro") || clave.startsWith("estado_") || clave.startsWith("observaciones_")) {
            if (valor !== "") datos[clave] = valor;
            continue;
        }
        if (formulario.elements[clave]?.type === "checkbox") {
            const casilla = formulario.elements[clave];
            datos[clave] = casilla.checked ? [casilla.value] : [];
        } else if (formulario.elements[clave]?.multiple) {
            datos[clave] = valores.getAll(clave);
        } else if (formulario.elements[clave]?.length && formulario.elements[clave][0]?.type === "checkbox") {
            datos[clave] = valores.getAll(clave);
        } else if (valor !== "") datos[clave] = formulario.elements[clave]?.type === "number" ? Number(valor) : valor;
    }
    // Asegura conservar casillas desmarcadas y grupos sin opciones seleccionadas.
    formulario.querySelectorAll('input[type="checkbox"][name]').forEach((campo) => {
        if (campo.disabled) return;
        if (!(campo.name in datos)) datos[campo.name] = [];
    });
    formulario.querySelectorAll('input[type="radio"][name]').forEach((campo) => {
        if (campo.disabled) return;
        if (!(campo.name in datos)) datos[campo.name] = "";
    });
    datos.nombre = valores.get("pacienteNombre");
    datos.edadMeses = Number(valores.get("edadMeses"));
    const domicilioPartes = ["domicilio", "numeroExterior", "numeroInterior", "zona", "municipioDomicilio", "estadoDomicilio", "codigoPostal", "paisDomicilio"]
        .map((clave) => valores.get(clave)?.trim()).filter(Boolean);
    datos.domicilio = domicilioPartes.join(", ");
    const respuestasPorSeccion = Object.fromEntries(seccionesValoracion.map((seccion) => [seccion.titulo, {}]));
    respuestasPorSeccion["Datos del paciente y valoración"] = {};
    const etiquetas = {};
    const tiposRespuesta = {};
    const etiquetasDetalles = {
        cianosisDetalle: "Especificación de cianosis",
        desencadenantesRespiratoriosDetalle: "Factores desencadenantes de alteraciones respiratorias",
        otrosLiquidosBebida: "¿Cuál bebida consume?",
        otrosLiquidosCantidad: "Cantidad consumida en 24 horas",
        enfermedadCronicaDetalle: "Enfermedad crónica",
        riesgosEnfermedad: "Conocimiento de riesgos de la enfermedad",
        respuestaDueloTexto: "Respuesta al duelo",
        cambiosVidaResidencia: "Cambio de residencia",
        cambiosVidaCasa: "Cambio en la casa",
        cambiosVidaEscuela: "Cambio de escuela",
        cambiosVidaFamilia: "Cambio en la familia",
        cambiosVidaIngresos: "Cambio en los ingresos",
        oxigenoterapiaDetalle: "Especificación de oxigenoterapia",
        padecimientosAlimentosDetalle: "Especificación de padecimiento relacionado con alimentos",
        medicamentosEvacuarDetalle: "Medicamento utilizado para ayudar a evacuar",
        siestasDetalle: "No. de horas",
        controlPrenatalDetalle: "Número de controles prenatales",
        nivelEscolar: "Nivel escolar",
        apoyosDormirDetalle: "Apoyo que utiliza para dormir",
        despiertaNocheDetalle: "Motivo por el que despierta por la noche",
        deporteDetalle: "Deporte o actividad artística que realiza",
        horasDeporte: "Horas de deporte o actividad artística",
        apoyoAuditivo: "Apoyo que utiliza para escuchar",
        visionDetalle: "Especificación del problema visual",
        usaLentes: "Uso de lentes",
        horasLentes: "Horas de uso de lentes al día",
        grupoAyudaDetalle: "Grupo de ayuda al que acude",
        respuestaDueloDetalle: "Especificación de otra respuesta al duelo"
    };
    for (const [clave, valor] of Object.entries(datos)) {
        if (clave === "observacionesFinales") {
            respuestasPorSeccion["Observaciones finales del evaluador"] = { [clave]: valor };
            etiquetas[clave] = "Observaciones finales del evaluador";
            continue;
        }
        const etiquetasDatosPaciente = {
            nombre: "Nombre del paciente",
            fechaNacimiento: "Fecha de nacimiento",
            edadMeses: "Edad (meses)",
            sexo: "Sexo",
            lugarNacimiento: "Lugar de nacimiento"
        };
        if (Object.hasOwn(etiquetasDatosPaciente, clave)) {
            respuestasPorSeccion["Datos del paciente y valoración"][clave] = valor;
            etiquetas[clave] = etiquetasDatosPaciente[clave];
            const control = formulario.elements[clave];
            tiposRespuesta[clave] = control?.type === "number" ? "number"
                : control?.type === "date" ? "date"
                : control?.type === "select-one" ? "select"
                : "text";
            continue;
        }
        const indiceForzado = ["nombre", "fechaNacimiento", "edadMeses", "sexo", "banioFrecuencia", "aseoBucalFrecuencia", "aseoManosFrecuencia", "cambioRopaFrecuencia", "numeroExterior", "numeroInterior", "municipioDomicilio", "estadoDomicilio", "codigoPostal", "paisDomicilio", "estado_0", "observaciones_0"].includes(clave) ? 0
            : ["estado_1", "observaciones_1", "tipoPerdida", "cuandoPerdida", "perdidaImportante", "respuestaDueloTexto"].includes(clave) ? 1
            : null;
        const indice = indiceForzado ?? seccionesValoracion.findIndex((seccion) => seccion.campos.some(([base]) => clave === base || clave.startsWith(`${base}_`)));
        const seccion = seccionesValoracion[indice >= 0 ? indice : 1];
        respuestasPorSeccion[seccion.titulo][clave] = valor;
        const campo = seccion.campos.find(([base]) => clave === base || clave.startsWith(`${base}_`));
        const etiquetaDuelo = clave.startsWith("respuestaDuelo_") ? `Respuesta al duelo · ${clave.slice("respuestaDuelo_".length).replaceAll("_", " ")}` : null;
        etiquetas[clave] = etiquetasDetalles[clave] || etiquetaDuelo || (campo ? `${campo[1]}${clave === campo[0] ? "" : ` · ${clave.slice(campo[0].length + 1).replaceAll("_", " ")}`}` : clave);
        const control = formulario.elements[clave];
        const tipo = control?.type || (control?.length ? control[0]?.type : "");
        tiposRespuesta[clave] = control?.multiple || tipo === "checkbox" || Array.isArray(valor) ? "multiple"
            : tipo === "radio" ? "select"
            : tipo === "select-one" ? "select"
            : tipo === "number" ? "number"
            : tipo === "date" ? "date"
            : "text";
    }
    boton.disabled = true;
    mensaje.textContent = "Guardando valoración…";
    try {
        const respuesta = await fetch("/api/valoraciones", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pacienteNombre: valores.get("pacienteNombre"), tutorNombre: valores.get("tutorNombre"), tutorParentesco: valores.get("tutorParentesco"), tutorTelefono: valores.get("tutorTelefono"), fechaValoracion: valores.get("fechaValoracion"), fechaNacimiento: valores.get("fechaNacimiento"), sexo: valores.get("sexo"), domicilio: valores.get("domicilio"), respuestasPorSeccion, etiquetas, tiposRespuesta }) });
        const resultado = await respuesta.json();
        if (!respuesta.ok || !resultado.success) throw new Error(resultado.message || "No se pudo guardar la valoración.");
        formulario.reset();
        formulario.querySelector('[name="fechaValoracion"]').value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
        mensaje.textContent = "Valoración guardada correctamente.";
    } catch (error) {
        mensaje.textContent = error.message;
    } finally {
        boton.disabled = false;
    }
});

function mostrarPanelValoraciones() {
    const mostrar = window.location.hash === "#valoraciones";
    const panel = document.querySelector("#valoraciones-panel");
    if (!panel) return;
    panel.hidden = !mostrar;
    document.querySelectorAll(".welcome-card, .section-content:not(#valoraciones-panel), .notice-card").forEach((elemento) => { elemento.hidden = mostrar; });
    document.querySelectorAll(".sidebar-nav .nav-link").forEach((enlace) => {
        const activo = mostrar ? enlace.getAttribute("href") === "#valoraciones" : enlace.getAttribute("href") === "/dashboard";
        enlace.classList.toggle("active", activo);
        if (activo) enlace.setAttribute("aria-current", "page"); else enlace.removeAttribute("aria-current");
    });
    document.querySelector(".topbar h1").textContent = mostrar ? "Valoraciones" : "Panel principal";
}
window.addEventListener("hashchange", mostrarPanelValoraciones);
mostrarPanelValoraciones();


/* =========================================
   MENÚ LATERAL
   ========================================= */

function abrirMenuMovil() {
    menuLateral.classList.add("sidebar-open");
    overlay.classList.add("overlay-visible");
    document.body.classList.add("menu-abierto");

    botonMenu.setAttribute("aria-expanded", "true");
}

function cerrarMenuMovil() {
    menuLateral.classList.remove("sidebar-open");
    overlay.classList.remove("overlay-visible");
    document.body.classList.remove("menu-abierto");

    botonMenu.setAttribute("aria-expanded", "false");
}

function alternarMenu() {
    if (esMovil.matches) {
        const estaAbierto =
            menuLateral.classList.contains("sidebar-open");

        if (estaAbierto) {
            cerrarMenuMovil();
        } else {
            abrirMenuMovil();
        }

        return;
    }

    const estaOculto =
        document.body.classList.toggle("sidebar-collapsed");

    botonMenu.setAttribute(
        "aria-expanded",
        String(!estaOculto)
    );
}

// Configurar el menú solo si la página tiene sus elementos.
if (botonMenu && botonCerrarMenu && menuLateral && overlay) {
    botonMenu.addEventListener("click", alternarMenu);

    botonCerrarMenu.addEventListener("click", cerrarMenuMovil);
    overlay.addEventListener("click", cerrarMenuMovil);

    menuLateral.querySelectorAll("a").forEach((enlace) => {
        enlace.addEventListener("click", () => {
            if (esMovil.matches) {
                cerrarMenuMovil();
            }
        });
    });

    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape" && esMovil.matches) {
            cerrarMenuMovil();
        }
    });

    esMovil.addEventListener("change", (evento) => {
        cerrarMenuMovil();

        if (!evento.matches) {
            document.body.classList.remove("sidebar-collapsed");
            botonMenu.setAttribute("aria-expanded", "true");
        }
    });
}


/* =========================================
   COMPROBACIÓN DE SESIÓN
   ========================================= */


async function comprobarSesion() {
    try {
        const respuesta = await fetch("/api/auth/me", {
            method: "GET",
            credentials: "same-origin"
        });

        if (!respuesta.ok) {
            window.location.replace("/");
            return;
        }

        const datos = await respuesta.json();

        if (!datos.success || !datos.usuario) {
            window.location.replace("/");
            return;
        }

        const rutasPorRol = {
            Alumno: "/dashboard",
            Docente: "/dashboard-docente",
            Administrativo: "/dashboard-admin"
        };

        const rol = datos.usuario.rol;
        const rutaCorrecta = rutasPorRol[rol];

        if (!rutaCorrecta) {
            window.location.replace("/");
            return;
        }

        // Evitar que un usuario permanezca en el dashboard equivocado.
        const rutaActual = window.location.pathname;

        if (rutaActual !== rutaCorrecta) {
            window.location.replace(rutaCorrecta);
            return;
        }

        if (etiquetaRol) {
            etiquetaRol.textContent = `Sesión iniciada · ${rol}`;
        }

        document.documentElement.classList.remove("auth-pending");

    } catch (error) {
        console.error("No se pudo comprobar la sesión:", error);
        window.location.replace("/");
    }
}


/* =========================================
   CIERRE DE SESIÓN
   ========================================= */


/* =========================================
   CIERRE DE SESIÓN
   ========================================= */

if (botonCerrarSesion) {
    botonCerrarSesion.addEventListener("click", async () => {
        botonCerrarSesion.disabled = true;
        botonCerrarSesion.textContent = "Cerrando sesión...";

        try {
            const respuesta = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "same-origin"
            });

            if (respuesta.ok) {
                window.location.replace("/");
                return;
            }

            alert("No se pudo cerrar la sesión. Intenta nuevamente.");

        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            alert("No se pudo conectar con el servidor.");
        }

        botonCerrarSesion.disabled = false;
        botonCerrarSesion.textContent = "Cerrar sesión";
    });
}


/* =========================================
   INICIALIZACIÓN
   ========================================= */

comprobarSesion();
