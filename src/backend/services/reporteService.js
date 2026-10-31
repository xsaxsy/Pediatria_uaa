import ExcelJS from "exceljs";

export async function generarExcelValoraciones(registros) {
    const libro = new ExcelJS.Workbook();
    const hoja = libro.addWorksheet("Valoraciones");

    libro.creator = "Sistema de Expedientes Pediátricos";
    libro.created = new Date();

    hoja.columns = [
        { header: "Folio", key: "folio", width: 32 },
        { header: "Paciente", key: "nombre", width: 35 },
        {
            header: "Fecha de nacimiento",
            key: "fecha_nacimiento",
            width: 28
        },
        { header: "Sexo", key: "sexo", width: 16 },
        {
            header: "Fecha de valoración",
            key: "fecha_valoracion",
            width: 28
        },
        { header: "Estado", key: "estado", width: 18 },
        { header: "Alumno", key: "alumno", width: 35 },
        {
            header: "Correo del alumno",
            key: "correo_alumno",
            width: 40
        }
    ];

    for (const registro of registros) {
        hoja.addRow({
            folio: registro.folio ?? "",
            nombre: registro.nombre ?? "",
            fecha_nacimiento: registro.fecha_nacimiento ?? "",
            sexo: registro.sexo ?? "",
            fecha_valoracion: registro.fecha_valoracion ?? "",
            estado: registro.estado ?? "",
            alumno: registro.alumno ?? "",
            correo_alumno: registro.correo_alumno ?? ""
        });
    }

    const encabezado = hoja.getRow(1);
    encabezado.height = 25;

    encabezado.eachCell((celda) => {
        celda.font = {
            bold: true,
            color: { argb: "FFFFFFFF" }
        };

        celda.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF17365D" }
        };

        celda.alignment = {
            vertical: "middle",
            horizontal: "center"
        };
    });

    hoja.views = [{ state: "frozen", ySplit: 1 }];
    hoja.autoFilter = "A1:H1";

    return libro.xlsx.writeBuffer();
}