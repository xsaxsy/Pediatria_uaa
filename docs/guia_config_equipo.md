# Guía de instalación y configuración del proyecto de Expedientes Pediátricos

**Proyecto:** Sistema de Expedientes Pediátricos Web  
**Repositorio:** https://github.com/xsaxsy/Sistema-Expedientes-Pediatricos-Web  
**Tecnologías:** JavaScript, Node.js, Vercel y Neon PostgreSQL  
**Equipo:** 7 integrantes

## 1. Objetivo

Esta guía explica cómo preparar el entorno de desarrollo local, conectarse a la base de datos y trabajar con GitHub y Vercel sin modificar accidentalmente las configuraciones de los demás integrantes.

Todos los integrantes deben seguir estas instrucciones antes de comenzar a desarrollar nuevas funcionalidades.

## 2. Herramientas necesarias

Cada integrante debe tener instalado:

- Git, para descargar y actualizar el repositorio.
- Node.js y npm, para ejecutar el proyecto e instalar sus dependencias.
- Visual Studio Code o un editor equivalente.
- Una cuenta de GitHub con acceso al repositorio.
- Acceso al proyecto de Vercel cuando sea necesario utilizar sus herramientas o consultar sus despliegues.

La base de datos está alojada en Neon PostgreSQL, por lo que no es necesario instalar un servidor PostgreSQL local para utilizar la base de datos compartida.

## 3. Descargar el proyecto

Abrir Git Bash o una terminal y situarse en la carpeta donde se desea guardar el proyecto.

Ejecutar:

```bash
git clone https://github.com/xsaxsy/Sistema-Expedientes-Pediatricos-Web.git
cd Sistema-Expedientes-Pediatricos-Web
```

Instalar las dependencias:

```bash
npm install
```

Antes de comenzar a modificar archivos, verificar que el proyecto se encuentre actualizado:

```bash
git pull origin main
```

**Importante:** si el equipo utiliza ramas de desarrollo, cada integrante debe trabajar en su propia rama en lugar de realizar todos los cambios directamente en `main`.

## 4. Configuración de las variables de entorno

Las variables de entorno permiten que el proyecto conozca la dirección de la base de datos y la clave utilizada para gestionar las sesiones.

Actualmente, el código del proyecto utiliza los siguientes nombres:

| Variable | Función |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL en Neon. |
| `SESSION_SECRETA` | Clave secreta utilizada para proteger las sesiones de usuario. |

Los nombres deben coincidir exactamente con los utilizados por el código. Por ejemplo, `DATABASE_URL` y `DATABSE_URL` no son equivalentes: el segundo tiene un error de escritura.

### 4.1. Crear el archivo local

En la raíz del proyecto, crear un archivo llamado `.env.local`.

Su contenido debe seguir esta estructura:

```dotenv
DATABASE_URL="CADENA_DE_CONEXION_DE_NEON"
SESSION_SECRETA="CLAVE_SECRETA_LOCAL"
```

Los valores anteriores son ejemplos de formato y deben reemplazarse por los valores reales proporcionados de manera segura.

**No se deben copiar literalmente esos valores de ejemplo ni utilizar una cadena de conexión ficticia.**

### 4.2. Obtener los valores

**`DATABASE_URL`**

El responsable de la base de datos debe proporcionar la cadena de conexión correspondiente al entorno autorizado para desarrollo.

La cadena se obtiene desde Neon y contiene información sensible. No debe publicarse en GitHub, enviarse en capturas de pantalla públicas ni compartirse en canales sin protección.

**`SESSION_SECRETA`**

Cada integrante puede utilizar una clave secreta diferente para su entorno local. Debe ser aleatoria y suficientemente larga.

Por ejemplo, se puede generar una clave con Node.js:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

El resultado se copia en el archivo `.env.local` después de `SESSION_SECRETA=`.

La clave local no tiene que ser igual a la utilizada en Vercel. Las sesiones creadas con claves distintas no se pueden validar necesariamente entre entornos.

### 4.3. No subir las variables a GitHub

El archivo `.env.local` contiene secretos y debe permanecer únicamente en el entorno local.

Verificar que `.gitignore` incluya, como mínimo:

```gitignore
node_modules/
.vercel/
.env
.env.*
!.env.example
```

Se puede agregar un archivo `.env.example` con los nombres de las variables, pero sin valores secretos:

```dotenv
DATABASE_URL=
SESSION_SECRETA=
```

Este archivo sirve como plantilla para los demás integrantes.

Antes de realizar un commit, comprobar que `.env.local` no aparezca entre los archivos preparados para subir.

## 5. Configuración de Vercel

El proyecto utiliza un proyecto compartido en Vercel, conectado al repositorio de GitHub.

No es necesario crear un proyecto nuevo para cada integrante.

### 5.1. Diferencia entre los entornos

- **Development:** configuración destinada al desarrollo local y a las herramientas de desarrollo de Vercel.
- **Preview:** configuración utilizada en despliegues de prueba, por ejemplo, al trabajar con ramas distintas de producción.
- **Production:** configuración utilizada en el despliegue oficial del proyecto.

Una variable configurada para un entorno no debe suponerse disponible automáticamente en los demás.

### 5.2. Configuración de las variables

En el proyecto compartido, abrir la configuración de variables de entorno de Vercel.

Comprobar que el código pueda acceder a `DATABASE_URL` y `SESSION_SECRETA` en los entornos correspondientes.

Si Neon creó variables automáticamente, revisar sus nombres antes de agregar otras. La integración puede proporcionar nombres diferentes, pero el código debe recibir el nombre que realmente consulta.

Por ejemplo, si el código utiliza:

```javascript
process.env.DATABASE_URL
```

y Neon proporciona una variable llamada `POSTGRES_URL`, no se debe asumir que ambas son intercambiables automáticamente. Debe configurarse el nombre esperado por la aplicación con el valor correcto de conexión.

Si una variable muestra un aviso como “Needs attention”, no se debe eliminar ni reemplazar a ciegas. Primero hay que identificar qué significa el aviso y comprobar si la variable sigue siendo necesaria.

**Seguridad:** solo las personas autorizadas deben modificar las variables de producción. Los secretos de producción no deben copiarse a los entornos locales de todos los integrantes.

## 6. Ejecutar el proyecto localmente

Una vez instalado Node.js, las dependencias y el archivo `.env.local`, abrir una terminal en la raíz del repositorio.

Si el proyecto utiliza las funciones de API de Vercel, iniciar el entorno local con:

```bash
npx vercel dev
```

La primera vez, puede ser necesario iniciar sesión con Vercel y vincular la carpeta local al proyecto existente.

Si la vinculación solicita seleccionar un proyecto, elegir el proyecto oficial de Pediatría únicamente si se cuenta con los permisos necesarios.

No crear un proyecto nuevo si lo que se busca es utilizar el proyecto compartido.

Una vez iniciado el servidor, utilizar la dirección local que muestre la terminal.

Si el proyecto no inicia, consultar primero el error completo de la terminal antes de modificar la configuración.

## 7. Trabajo colaborativo con GitHub

Para evitar conflictos, se recomienda trabajar con ramas individuales y solicitudes de integración (*pull requests*).

Ejemplo de creación de una rama:

```bash
git switch -c feat/dashboard-alumno
```

Después de realizar los cambios:

```bash
git status
git add .
git commit -m "feat: agregar dashboard de alumno"
git push -u origin feat/dashboard-alumno
```

A continuación, crear una solicitud de integración en GitHub para revisar los cambios antes de incorporarlos a `main`.

Cada integrante debe comprobar qué archivos está agregando antes de ejecutar `git commit`.

No utilizar `git add .env.local` ni subir archivos con credenciales.

## 8. Despliegues del proyecto

El proyecto de Vercel está conectado al repositorio de GitHub.

Según la configuración de integración y las reglas de ramas:

- Los cambios enviados a una rama pueden generar un despliegue de Preview.
- Los cambios integrados en la rama configurada como producción pueden generar un despliegue de Production.
- Un despliegue con estado `Ready` indica que Vercel terminó el proceso de despliegue, pero no garantiza por sí solo que todas las funciones de la aplicación trabajen correctamente.

Los integrantes no deben cambiar la configuración global de Vercel ni las variables de producción sin autorización.

Los despliegues de Preview deben utilizar datos de prueba y, cuando sea posible, una base de datos de desarrollo separada de la base de datos oficial.

## 9. Errores frecuentes

### Error: no se proporciona una cadena de conexión a Neon

Posibles causas:

- Falta el archivo `.env.local`.
- La variable está escrita incorrectamente.
- El código espera `DATABASE_URL`, pero el entorno proporciona otro nombre.
- El entorno local no está cargando las variables esperadas.

Solución: verificar el nombre exacto de la variable, comprobar que tenga un valor válido y reiniciar el servidor después de cambiar la configuración.

### Error: la sesión no funciona

Posibles causas:

- `SESSION_SECRETA` no está definida.
- El nombre de la variable no coincide con el utilizado por el código.
- La clave cambió entre la creación y la validación de una sesión.

Solución: verificar la configuración y volver a iniciar sesión. No compartir la clave secreta con otros integrantes.

### Error: una variable de Vercel muestra “Needs attention”

No eliminar la variable inmediatamente. Revisar su origen, el entorno asignado y el mensaje completo de Vercel. Las variables administradas por integraciones pueden necesitar una acción específica.

### Advertencia de npm sobre `cache-dir`

Una advertencia de configuración de npm no implica necesariamente que el despliegue haya fallado. Si Vercel muestra `Ready`, comprobar por separado el funcionamiento de la aplicación antes de intentar corregirla.

## 10. Lista de verificación antes de empezar

Cada integrante debe confirmar lo siguiente:

- [ ] Puedo acceder al repositorio de GitHub.
- [ ] Cloné el proyecto e instalé las dependencias.
- [ ] Tengo un archivo `.env.local` válido.
- [ ] La variable `DATABASE_URL` contiene la cadena de conexión autorizada.
- [ ] La variable `SESSION_SECRETA` está definida.
- [ ] Mi archivo `.env.local` está excluido de Git.
- [ ] Puedo iniciar el proyecto localmente.
- [ ] Puedo acceder a las funciones que me corresponden.
- [ ] Sé cómo crear una rama y subir mis cambios.
- [ ] No modificaré las variables de producción sin autorización.

## 11. Reglas de seguridad

1. No compartir contraseñas, cadenas de conexión ni claves de sesión en el repositorio.
2. No utilizar la base de datos de producción para pruebas destructivas.
3. No cambiar variables compartidas sin coordinarlo con el responsable del proyecto.
4. Revisar los cambios antes de integrarlos a `main`.
5. Informar al equipo si se modifica el nombre de una variable o la estructura de configuración.
6. Si una credencial se publica accidentalmente, revocarla o rotarla cuanto antes; eliminar el archivo del último commit no garantiza que el secreto haya desaparecido del historial.

**Nota:** esta guía describe el flujo previsto de trabajo. Antes de distribuirla, el responsable del proyecto debe verificar los nombres de las variables, los permisos de Vercel y la configuración actual de Neon para asegurarse de que coincidan con el repositorio vigente.
