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

| Panel           | Funciones                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| **Videos**      | Subir, abrir y eliminar proyectos.                                                                           |
| **Subtítulos**  | Texto y tiempos: transcribir, editar palabras, sincronizar y ajustar tiempos. Frases: organizar bloques. |
| **Estilos**     | Plantillas predeterminadas y personales; personalización por Diseño, Texto y Posición.            |
| **Miniatura**   | Plantilla, Título y Encuadre en pestañas; fotograma desde la línea de tiempo y descarga PNG desde el preview.                          |
| **Guion**       | Comparar, adaptar y alinear el guion con el audio.                                                           |
| **Revisión IA** | Revisar correcciones; configuración y prueba de Gemini en una sección secundaria.                            |

En **Estilos → Personalizar**, usa **Superior / Inferior** para editar cada línea por separado. La sincronización está en **Subtítulos → Texto y tiempos**. Las pestañas se recuerdan por proyecto durante la sesión del navegador, incluso al cambiar de menú o recargar. Las flechas recorren las pestañas; Inicio/Fin seleccionan la primera/última. Esta preferencia de interfaz no cambia los diseños ni sus valores guardados.

## Flujo de trabajo

1. Sube un video de hasta **3 minutos y 500 MB** en **Videos**.
2. En **Subtítulos → Texto**, elige español, inglés o portugués y pulsa **Transcribir**. Whisper procesa el audio en CPU y descarga el modelo en su primer uso.
3. Aplica una plantilla desde **Estilos → Plantillas**. Personaliza una o dos líneas en **Estilos → Personalizar**, con opciones independientes para la línea superior e inferior.
4. Revisa las palabras, frases y tiempos desde **Subtítulos** y la línea de tiempo.
5. Pulsa **Exportar video** para generar un MP4 con los subtítulos integrados en la imagen.

El video de trabajo se normaliza a 30 fps y hasta 1080 píxeles de ancho. Se conserva una copia del original dentro del proyecto y sus metadatos (resolución, FPS, bitrate y audio). El archivo original seleccionado no se modifica. Esto requiere espacio para ambas copias.

En **Videos → Proyectos**, el botón de papelera elimina el proyecto tras confirmar: borra su video de trabajo, la copia del original guardada en el proyecto, subtítulos, miniaturas y exportaciones. No elimina el archivo original seleccionado ni las plantillas personales. Es irreversible y se bloquea mientras haya un trabajo pesado o se estén generando miniaturas del proyecto.

## Miniaturas para shorts

La vista previa de Miniatura incluye la misma barra vertical que el video: **Guía**, **Grilla**, **Pantalla completa** y **Ajustar**, con controles independientes de visibilidad, color y opacidad. **Ctrl + rueda** amplía la vista; puedes mover el título sobre la imagen y desplazar la vista ampliada arrastrando el fondo. **Ajustar** restaura el 100%; **Esc** sale de pantalla completa. El zoom de vista previa, la guía y la grilla no se incluyen en el PNG ni cambian su resolución.

En **Miniatura**, selecciona el fotograma directamente en la línea de tiempo. La vista previa se actualiza al recorrer o reproducir el video, sin un botón de captura. Al volver al menú se recupera el instante guardado. El editor utiliza el video normalizado sin subtítulos integrados. Las nueve plantillas combinan de una a tres líneas. Selecciona un texto directamente en el preview para abrir **Título** con un único campo y sus ajustes. También puedes seleccionarlo desde la lista compacta de textos. Usa **Ctrl + clic** en el preview o en la lista para añadir o quitar textos de la selección. Al seleccionar varios, puedes arrastrarlos juntos y aplicarles cambios de estilo desde un único panel; cada uno conserva su contenido. El panel muestra los valores del último texto seleccionado. Arrastra para mover solo esa línea; haz clic fuera o pulsa Escape con el preview enfocado para deseleccionar. El borde de selección no se incluye en el PNG. Los ajustes de **Bloque completo** mantienen la alineación conjunta. Cada texto permite personalizar fuente, tamaño, color, negrita, cursiva, subrayado, mayúsculas, espaciado, contorno y sombra con interruptores. El texto se conserva al cambiar de plantilla y se redistribuye según sus líneas. La miniatura es una imagen PNG estática; no incluye animación ni resaltado de palabra activa.

Elige una de las nueve plantillas en la grilla 3×3 (**Impacto**, **Editorial**, **Contraste**, **Neón**, **Cine**, **Manuscrito**, **Cómic**, **Minimal** y **Marco**), escribe un título de hasta 160 caracteres y ajusta fuente, tamaño, colores, borde y fondo. Arrastra sobre la portada para mover el título, o usa las posiciones horizontal y vertical. El encuadre incluye zoom y desplazamientos de la imagen, con recorte proporcional a 9:16.

**Descargar miniatura** genera una imagen independiente de **1080 × 1920**, sin guías ni grilla. El diseño se guarda con el proyecto y admite deshacer/rehacer; no modifica los estilos, palabras ni tiempos de los subtítulos, ni se incorpora al MP4. No publica la portada automáticamente en ninguna plataforma.

Miniatura incluye botones para alinear el título por sus bordes a izquierda/centro/derecha y arriba/centro/abajo. Las posiciones muestran 0.0 en el centro, con derecha/arriba positivas e izquierda/abajo negativas, y los deslizadores y el arrastre se imantan al centro. Cuando la guía 9:16 está activa, se respetan sus zonas reservadas. La guía visible se superpone solo al preview; el PNG contiene únicamente la composición de la miniatura.

## Preview y línea de tiempo

En móvil, la barra del preview es horizontal para mantener accesibles Guía, Grilla, Pantalla completa y Ajustar. El botón de tema permanece visible. La línea de tiempo permite **Compactar / Expandir** sin quitar pistas ni deformar las miniaturas.

La barra vertical del preview incluye **Guía**, **Grilla**, **Pantalla completa** y **Ajustar**. Guía y Grilla abren paneles con interruptor de visibilidad, color y opacidad de 0% a 100%. La guía de zona segura usa la plantilla visual proporcionada para videos 9:16; la grilla 3×3 se adapta a cualquier proporción. Ambas acompañan el zoom y el desplazamiento sin bloquear la edición y no se incluyen en el MP4 ni en SRT/VTT. **Pantalla completa** activa la pantalla completa del navegador; usa **Salir** o Esc para volver. **Ajustar** restablece el zoom al 100% y centra la vista. La guía es una referencia visual y no garantiza coincidir con todas las variantes de TikTok.

- **Espacio:** reproducir o pausar, sin interferir al escribir en los campos.
- **Ctrl + rueda sobre el preview:** zoom de 25% a 400%. Al ampliar, arrastra el fondo para desplazarte. Solo modifica la vista, no la exportación.
- **Texto sobre el preview:** arrastra el recuadro para moverlo y su esquina para cambiar el tamaño. Los cambios sí se aplican a la exportación. En pantallas estrechas usa los controles del panel.
- La línea de tiempo permanece abajo y conserva tres pistas: **subtítulos, video con miniaturas y audio**. Durante la reproducción se desplaza para mantener el cursor centrado.
- Arrastra la regla o el cursor vertical, o pulsa las pistas de video y audio para buscar un instante.
- Usa el deslizador o **Ctrl + rueda sobre la línea de tiempo** para ampliar de 100% a 2000%.
- **Alt + rueda sobre la línea de tiempo:** desplaza horizontalmente las pistas. Si el video está reproduciéndose, lo pausa para que el seguimiento del cursor no revierta el desplazamiento manual.
- Arrastra una palabra para moverla y sus bordes para ajustar su duración; se respetan las palabras vecinas y los límites del video.
- Haz doble clic en una palabra para abrirla y resaltarla en **Subtítulos**. Con el foco sobre un clip o borde, las flechas ajustan un fotograma; `Shift + flechas`, diez.

Se generan entre 12 y 120 miniaturas proporcionales y una forma de onda del audio. El puntero sobre la pista de video muestra un fotograma ampliado. El ajuste de sincronización adelanta inicialmente los subtítulos **150 ms**, sin modificar los tiempos del audio o video.

## Frases y estilos

En **Subtítulos → Texto y tiempos → Palabras**, cada fila tiene un botón **＋** para insertar una palabra justo debajo, además de eliminarla. **Agregar al final** conserva la inserción al final de la lista. Se utiliza un hueco temporal si existe; de lo contrario se reparte el tiempo de una palabra vecina y se muestra un aviso. Si no hay espacio suficiente se solicita ajustar los tiempos. La nueva palabra queda seleccionada para editarla; los cambios admiten deshacer y guardado automático. Los bloques fijados conservan su agrupación.

En **Estilos → Personalizar → Texto**, cada línea tiene tipografía, negrita, cursiva, subrayado, tamaño, colores y animación independientes. Contorno y sombra permiten ajustar color, opacidad y tamaño. Los botones de mayúsculas, minúsculas, texto original y primera letra mayúscula cambian la presentación sin modificar la transcripción.

En esa misma sección, **Ocultar puntuación (. , ; :)** elimina visualmente esos cuatro signos en ambas líneas del preview y del MP4. Es reversible y conserva el texto original para edición, guion, Gemini, agrupación y SRT/VTT. No cambia palabras ni tiempos; la máquina de escribir conserva los instantes de los caracteres originales. No afecta a los títulos de Miniatura.

En **Estilos → Personalizar → Posición**, las posiciones muestran **0.0 en el centro del video**, con derecha/arriba positivas e izquierda/abajo negativas. Los botones alinean a izquierda/centro/derecha y arriba/centro/abajo. Los deslizadores se imantan al centro dentro de un punto; las flechas permiten ajustar sin quedar atrapado en el imán. Con la guía 9:16 habilitada, los controles de posición y el arrastre respetan sus límites considerando el tamaño del texto visible. Si no hay texto visible se usa la última medida o una estimación inicial; conviene pausar sobre la frase que quieres alinear. Un bloque demasiado grande muestra un aviso para reducir el tamaño. Las posiciones internas siguen guardadas en porcentajes para conservar proyectos y plantillas anteriores.

La agrupación automática considera puntuación, pausas y conectores frecuentes en español. La cantidad de palabras por bloque es orientativa: admite hasta dos palabras adicionales y considera límites de cuatro segundos y 64 caracteres, salvo una palabra individual que ya los exceda. El modo de una palabra por bloque conserva ese comportamiento. Son reglas locales, no un análisis semántico completo.

En **Subtítulos → Frases**, puedes editar directamente el texto de cada bloque; se sincroniza en ambas direcciones con **Texto y tiempos** y el preview. Al corregir palabras se conservan sus tiempos cuando es posible; al añadir o quitar palabras, sus tiempos se estiman dentro del intervalo de esa frase sin desplazar las vecinas. Cada frase usa un campo de una sola línea: pulsa **Enter** para dividir en la posición del cursor y continuar en la segunda frase. El inicio o final del campo no crea frases vacías. Si vacías una frase, se elimina al salir del campo o pulsar Enter; también desaparece de Texto y tiempos y admite deshacer. También puedes unir con la siguiente. La primera modificación fija los cortes actuales, que se conservan al cambiar de plantilla. **Restablecer agrupación automática** elimina esos cortes, incluidos los importados. No cambia las palabras ni sus tiempos.

En dos líneas, la separación automática considera la longitud del texto y evita dejar conectores al final. Una cantidad explícita de palabras para la línea superior conserva tu elección. Preview, MP4 y SRT/VTT comparten la agrupación.

En **Subtítulos → Texto → Resaltar una palabra**, configura color, fuente, tamaño, mayúsculas o animación individual. Restablecer la palabra recupera los valores de la línea. Las animaciones del bloque siguen afectando al conjunto.

En **Estilos → Plantillas → Mis plantillas**, guarda el estilo actual, aplícalo, renómbralo, duplícalo o elimínalo. Se guarda en `.local/templates.json`; los tamaños y espaciados se escalan al ancho del proyecto de destino. Las plantillas no reemplazan el texto, los tiempos ni los estilos individuales de palabras.

## Guion original

Pega el texto definitivo en **Guion** y elige:

- **Comparar texto:** compara el texto localmente sin aplicar cambios.
- **Usar guion como texto:** conserva tiempos en sustituciones uno a uno y estima los fragmentos con inserciones o eliminaciones, sin volver a analizar el audio.
- **Sincronizar con audio:** calcula tiempos por palabra mediante alineación acústica CTC con MMS-300M. Descarga unos 317 MB la primera vez; después reutiliza la caché. No requiere Python.

Para la alineación acústica, usa español, inglés o portugués y un guion que corresponda a lo que se escucha. Los números se convierten internamente a su pronunciación para analizar el audio, conservando los dígitos originales en los subtítulos. Se admiten enteros, años, separadores de miles, decimales, porcentajes, horas e importes como S/25, $10 y €1. Separadores seguidos de grupos de tres cifras se interpretan como miles. Si un número se pronuncia de otra forma (por ejemplo, un identificador leído dígito a dígito), puedes escribir esa pronunciación con letras. Revisa los resultados con confianza baja. La operación regenera los subtítulos y admite deshacer durante la sesión.

## SRT y VTT

En **Subtítulos → ⋯ Archivos SRT / VTT**, importa archivos de hasta **2 MB y 10 000 palabras**. Se muestra la cantidad de subtítulos antes de reemplazar el texto. Los tiempos por palabra se estiman dentro de cada bloque; no se admiten bloques superpuestos o fuera del video.

Al aplicar la importación, el adelanto se restablece a **0 ms** para respetar los tiempos del archivo y evitar aplicarlo dos veces. Deshacer restaura las palabras y la sincronización anteriores.

La exportación SRT/VTT incluye el ajuste de sincronización, texto y tiempos, sin colores ni animaciones. El MP4 conserva el diseño visual.

## Gemini opcional

El campo **Modelo** es un desplegable. **Cargar modelos disponibles** consulta el catálogo de Google con la clave escrita o, si se deja vacía, con la guardada; no guarda la nueva clave ni envía el guion o los subtítulos. Filtra modelos de generación de texto y conserva el modelo actual aunque no aparezca en la lista. Gemini 2.5 Flash es el valor inicial para configuraciones nuevas y la alternativa si no se puede cargar el catálogo. La disponibilidad no garantiza cuota ni compatibilidad de todos los modelos con la revisión estructurada: usa **Probar Gemini** antes de guardar.

En **Revisión IA → Configuración de Gemini → Configurar**, introduce una clave y el modelo. Puedes probar la conexión desde el formulario o desde **Probar conexión**. Las pruebas envían un saludo sintético y consumen una solicitud.

**Revisar texto** envía el texto a Google. Si activas **Incluir guion original en Gemini**, también envía el guion. El video y el audio no se envían. Revisa las tarjetas **Original / Propuesta**, acepta individualmente o todas, rechaza y deshaz la última aplicación. Las correcciones conservan los identificadores y tiempos; no insertan ni eliminan palabras. Las propuestas se conservan al cambiar de panel en la sesión del proyecto.

La clave se guarda en texto plano en `.local/gemini.json`, excluida de Git y fuera de la carpeta pública; no se devuelve al navegador. Se admiten `GEMINI_API_KEY` y `GEMINI_MODEL` como variables del proceso si no existe la configuración guardada. No uses variables `VITE_*` para claves. No hay carga automática de archivos `.env`.

El estado **Configurado** indica que hay una clave guardada, no que la conexión se haya comprobado. Usa **Probar conexión** para verificarla.

Gemini necesita conexión y está sujeto a cuotas y costos del proveedor. Las demás herramientas procesan los datos localmente.

## Guardado, apariencia y datos

Los cambios válidos se guardan tras **1,5 segundos de inactividad**. También puedes guardar manualmente. Antes de subir otro video se guardan los cambios pendientes; si falla, se cancela la subida. Al cambiar de proyecto con cambios pendientes, un modal permite guardar y abrir, descartar y abrir o cancelar. Volver a transcribir también requiere confirmar en un modal del editor. El cierre de la página avisa si quedan cambios sin guardar.

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

La exportación MP4 usa automáticamente el original como referencia: resolución orientada, FPS y bitrate de video. Los subtítulos mantienen la proporción del preview. Se conserva H.264 o H.265; otros códecs se convierten a H.264 por compatibilidad. El audio AAC/MP3 se copia sin recodificar; otros formatos pasan a AAC usando los parámetros compatibles de referencia. Las dimensiones impares se ajustan a pares y el video con FPS variables se exporta a FPS constantes de referencia. El tamaño final puede variar: el bitrate es un objetivo, no un límite exacto.

Los proyectos anteriores usan su video de trabajo como referencia porque ya no conservan el original. Para recuperar sus parámetros originales, importa el archivo de nuevo. La exportación usa un solo render en paralelo y 128 MB de caché de video. La importación limita FFmpeg a dos hilos.

## Uso de recursos

AnimaTX usa una cola común para importación, miniaturas, transcripción, sincronización y exportación: solo procesa una tarea pesada a la vez. La IA y FFmpeg usan hasta dos hilos; los filtros de FFmpeg usan uno. El proceso del servidor y sus comandos FFmpeg solicitan prioridad inferior a la normal cuando el sistema lo permite. La exportación conserva los parámetros del original y usa un render en paralelo con 128 MB de caché. Estos límites reducen la presión de recursos; no equivalen a un porcentaje fijo de CPU o RAM.

Antes de iniciar se comprueba la memoria disponible: 1,25 GiB para IA, 768 MiB para exportación y 384 MiB para importación o miniaturas. Si no hay margen, se muestra un mensaje para liberar memoria. El alineador almacena las decisiones en dos bits (cuatro veces menos memoria), reutiliza sus filas y libera el modelo antes del cálculo final. Los modelos siguen en formato cuantizado q8.

El botón **Cancelar**, junto al estado del trabajo, detiene transcripción, sincronización o exportación, incluida su espera en la cola. El siguiente trabajo empieza después de liberar el anterior. Una llamada nativa de IA puede tardar en devolver el control. Los resultados incompletos no reemplazan los subtítulos y los archivos temporales del trabajo se limpian. Procesar con menos hilos puede tardar más. Reinicia el servidor después de actualizar.
