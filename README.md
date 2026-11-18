# AnimaTX

Editor web local para crear subtítulos animados en shorts y reels. Para uso personal, sin cuentas ni base de datos. La transcripción y la exportación se ejecutan en tu computadora; Gemini es opcional y utiliza una sola API key.

## Requisitos e inicio

- Node.js 22 o superior y npm.
- Conexión para instalar dependencias y descargar los modelos y el navegador de exportación por primera vez.
- Espacio para videos, exportaciones y modelos locales.

En Windows puedes abrir `iniciar.cmd`: instala las dependencias si faltan, compila y arranca el servidor. También puedes ejecutar:

```powershell
npm.cmd install
npm.cmd run build
npm.cmd start
```

Abre [AnimaTX](http://127.0.0.1:4310). Mantén abierta la consola; `Ctrl + C` detiene el servidor. En PowerShell, `npm.cmd` evita el bloqueo de ejecución de `npm.ps1`.

Para desarrollo:

```powershell
npm.cmd run dev
```

Abre [el editor de desarrollo](http://127.0.0.1:5173). Este comando inicia Vite y el servidor local. Reinícialo después de cambiar archivos del servidor. En otros sistemas puedes usar `npm` en lugar de `npm.cmd`.

## Menú lateral

| Panel            | Funciones                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Videos**       | Subir un video o abrir proyectos guardados.                                                                             |
| **Editar texto** | Transcribir y personalizar la apariencia: fuente, tamaño, colores, borde, posición, animación, mayúsculas y espaciados. |
| **Plantillas**   | Nueve estilos predeterminados y plantillas personales.                                                                  |
| **Subtítulos**   | Editar palabras y tiempos, organizar frases, resaltar palabras e importar/exportar SRT/VTT.                             |
| **Guion**        | Pegar el texto definitivo, compararlo, adaptarlo o alinearlo con el audio.                                              |
| **Revisión IA**  | Configurar y probar Gemini, revisar correcciones y aceptarlas o rechazarlas.                                            |

## Flujo de trabajo

1. Sube un video de hasta **3 minutos y 500 MB** en **Videos**.
2. En **Editar texto**, elige español, inglés o portugués y pulsa **Transcribir**. Whisper procesa el audio en CPU y descarga el modelo en su primer uso.
3. Aplica una plantilla desde **Plantillas**. Personaliza una o dos líneas en **Editar texto**, con opciones independientes para la línea superior e inferior.
4. Revisa las palabras, frases y tiempos desde **Subtítulos** y la línea de tiempo.
5. Pulsa **Exportar** para generar un MP4 con los subtítulos integrados en la imagen.

El video de trabajo se normaliza a 30 fps y hasta 1080 píxeles de ancho. El archivo original seleccionado no se modifica.

## Preview y línea de tiempo

- **Espacio:** reproducir o pausar, sin interferir al escribir en los campos.
- **Ctrl + rueda sobre el preview:** zoom de 25% a 400%. Al ampliar, arrastra el fondo para desplazarte. Solo modifica la vista, no la exportación.
- **Texto sobre el preview:** arrastra el recuadro para moverlo y su esquina para cambiar el tamaño. Los cambios sí se aplican a la exportación. En pantallas estrechas usa los controles del panel.
- La línea de tiempo permanece abajo y conserva tres pistas: **subtítulos, video con miniaturas y audio**. Durante la reproducción se desplaza para mantener el cursor centrado.
- Arrastra la regla o el cursor vertical, o pulsa las pistas de video y audio para buscar un instante.
- Usa el deslizador o **Ctrl + rueda sobre la línea de tiempo** para ampliar de 100% a 2000%.
- Arrastra una palabra para moverla y sus bordes para ajustar su duración; se respetan las palabras vecinas y los límites del video.
- Haz doble clic en una palabra para abrirla y resaltarla en **Subtítulos**. Con el foco sobre un clip o borde, las flechas ajustan un fotograma; `Shift + flechas`, diez.

Se generan entre 12 y 120 miniaturas proporcionales y una forma de onda del audio. El puntero sobre la pista de video muestra un fotograma ampliado. El ajuste de sincronización adelanta inicialmente los subtítulos **150 ms**, sin modificar los tiempos del audio o video.

## Frases y estilos

La agrupación automática considera puntuación, pausas y conectores frecuentes en español. La cantidad de palabras por bloque es orientativa: admite hasta dos palabras adicionales y considera límites de cuatro segundos y 64 caracteres, salvo una palabra individual que ya los exceda. El modo de una palabra por bloque conserva ese comportamiento. Son reglas locales, no un análisis semántico completo.

En **Subtítulos → Frases y bloques**, puedes dividir después de una palabra o unir con la siguiente. La primera modificación fija los cortes actuales, que se conservan al cambiar de plantilla. **Restablecer agrupación automática** elimina esos cortes, incluidos los importados. No cambia las palabras ni sus tiempos.

En dos líneas, la separación automática considera la longitud del texto y evita dejar conectores al final. Una cantidad explícita de palabras para la línea superior conserva tu elección. Preview, MP4 y SRT/VTT comparten la agrupación.

En **Subtítulos → Resaltar una palabra**, configura color, fuente, tamaño, mayúsculas o animación individual. Restablecer la palabra recupera los valores de la línea. Las animaciones del bloque siguen afectando al conjunto.

En **Plantillas → Mis plantillas**, guarda el estilo actual, aplícalo, renómbralo, duplícalo o elimínalo. Se guarda en `.local/templates.json`; los tamaños y espaciados se escalan al ancho del proyecto de destino. Las plantillas no reemplazan el texto, los tiempos ni los estilos individuales de palabras.

## Guion original

Pega el texto definitivo en **Guion** y elige:

- **Contrastar con transcripción:** compara el texto localmente sin aplicar cambios.
- **Adaptar subtítulos al guion:** conserva tiempos en sustituciones uno a uno y estima los fragmentos con inserciones o eliminaciones, sin volver a analizar el audio.
- **Alinear guion con el audio:** calcula tiempos por palabra mediante alineación acústica CTC con MMS-300M. Descarga unos 317 MB la primera vez; después reutiliza la caché. No requiere Python.

Para la alineación acústica, usa español, inglés o portugués, escribe los números con letras y un guion que corresponda a lo que se escucha. Revisa los resultados con confianza baja. La operación regenera los subtítulos y admite deshacer durante la sesión.

## SRT y VTT

En **Subtítulos → Importar / exportar SRT y VTT**, importa archivos de hasta **2 MB y 10 000 palabras**. Se muestra la cantidad de subtítulos antes de reemplazar el texto. Los tiempos por palabra se estiman dentro de cada bloque; no se admiten bloques superpuestos o fuera del video.

Al aplicar la importación, el adelanto se restablece a **0 ms** para respetar los tiempos del archivo y evitar aplicarlo dos veces. Deshacer restaura las palabras y la sincronización anteriores.

La exportación SRT/VTT incluye el ajuste de sincronización, texto y tiempos, sin colores ni animaciones. El MP4 conserva el diseño visual.

## Gemini opcional

En **Revisión IA → Configurar**, introduce una clave y el modelo. Puedes probar la conexión desde el formulario o desde **Probar conexión**. Las pruebas envían un saludo sintético y consumen una solicitud.

**Revisar texto** envía el texto a Google. Si activas **Incluir guion original en Gemini**, también envía el guion. El video y el audio no se envían. Revisa las tarjetas **Original / Propuesta**, acepta individualmente o todas, rechaza y deshaz la última aplicación. Las correcciones conservan los identificadores y tiempos; no insertan ni eliminan palabras. Las propuestas se conservan al cambiar de panel en la sesión del proyecto.

La clave se guarda en texto plano en `.local/gemini.json`, excluida de Git y fuera de la carpeta pública; no se devuelve al navegador. Se admiten `GEMINI_API_KEY` y `GEMINI_MODEL` como variables del proceso si no existe la configuración guardada. No uses variables `VITE_*` para claves. No hay carga automática de archivos `.env`.

Gemini necesita conexión y está sujeto a cuotas y costos del proveedor. Las demás herramientas procesan los datos localmente.

## Guardado, apariencia y datos

Los cambios válidos se guardan tras **1,5 segundos de inactividad**. También puedes guardar manualmente. Antes de subir otro video se guardan los cambios pendientes; si falla, se cancela la subida. El cierre de la página avisa si quedan cambios sin guardar.

**Ctrl + Z** deshace; **Ctrl + Y** o **Ctrl + Shift + Z** rehacen. El historial conserva hasta 50 acciones durante la sesión y se reinicia al cambiar de proyecto o recargar. Las escrituras del navegador se serializan y el servidor reemplaza el JSON de forma atómica.

El botón de **sol/luna** alterna entre claro y oscuro y guarda tu preferencia en el navegador. Sin preferencia previa toma inicialmente el tema del dispositivo. No modifica el video exportado.

| Ruta                    | Contenido                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------- |
| `data/<uuid>/`          | Video normalizado, proyecto, audio temporal, transcripción, miniaturas y exportaciones. |
| `.local/templates.json` | Plantillas personales.                                                                  |
| `.local/gemini.json`    | Configuración y clave de Gemini.                                                        |
| `.cache/`               | Modelos locales descargados.                                                            |
| `dist/`                 | Interfaz compilada.                                                                     |

Respalda `data/` y `.local/templates.json` para conservar tus proyectos y plantillas. Estos datos, las claves y los recursos generados no se incluyen en Git. Remotion descarga su navegador en la primera exportación; tras las descargas iniciales puedes trabajar sin conexión, excepto con Gemini.

El servidor escucha en `127.0.0.1:4310` y está diseñado para uso personal. Transcripción, alineación y exportación se ejecutan de uno en uno. No cierres el servidor durante un trabajo: los trabajos en curso no se recuperan al reiniciar.

## Desarrollo y verificación

Stack: React 19, TypeScript, Vite, Node.js/Express, Remotion, FFmpeg y Transformers.js. FFmpeg se incluye mediante `ffmpeg-static`.

```powershell
npm.cmd test
npx.cmd tsc --noEmit
npm.cmd run build
```

Las pruebas cubren agrupación, sincronización, edición temporal, CTC, formatos, historial, plantillas, validación y bloqueo de trabajos concurrentes. Las pruebas de Gemini utilizan respuestas simuladas. Los scripts `*-smoke.mjs` de `tests/` son verificaciones manuales adicionales; algunos necesitan un servidor iniciado, descargas o archivos sintéticos en `data/test-fixtures/` y no forman parte de `npm test`.

## Licencias

El proyecto declara licencia ISC en `package.json`. Los modelos y dependencias conservan sus propias condiciones. El [modelo de alineación MMS-300M](https://huggingface.co/onnx-community/mms-300m-1130-forced-aligner-ONNX) declara CC-BY-NC-4.0; tenlo en cuenta antes de ampliar el uso personal. Consulta también los [términos de Remotion](https://www.remotion.dev/pricing).
