# Demo para clientes de CSSENZA

Abrir `index.html` en un navegador. No requiere Node, servidor ni conexion a Internet.

El recorrido permite completar el nombre personal y del negocio, agregar un logo opcional, elegir vidriera o catalogo, activar WhatsApp de forma opcional, agregar de cero a cinco fotos y elegir Editorial, Nocturna o Galeria. El color de marca puede personalizarse con un selector o swatches, con contraste automatico del texto. El color puede restablecerse al del diseño elegido.

Cada foto representa un producto con nombre y descripcion. En el catalogo se puede agregar un precio opcional y elegir moneda. Las fotos se preparan una por una a un maximo de 1400 pixeles para cuidar la memoria del celular.

La vista previa y el HTML descargado incluyen detalles de producto y, para el catalogo, un pedido de prueba. Con WhatsApp se abre un mensaje de consulta; sin WhatsApp se puede descargar el pedido como texto. No se cobran pagos ni se registran compras reales.

El HTML descargado es autonomo: incluye el diseño, el logo y las imagenes. El borrador se guarda automaticamente en IndexedDB e incluye datos, fotos, logo, color y paso actual. Se recupera al volver a abrir la pagina en el mismo navegador y origen; no se envia automaticamente a un servidor. El estado de guardado aparece al pie del editor. Si el navegador bloquea el almacenamiento o no tiene espacio, se informa que el borrador no se guardo. Empezar de nuevo borra tambien el borrador local, tras la confirmacion existente. El boton de presupuesto abre un mensaje para CSSENZA con los datos basicos del proyecto, sin adjuntar las fotos ni el logo.

La imagen inicial de ejemplo fue generada con la herramienta integrada de imagenes. Su prompt esta en `assets/prompt.md`. Los iconos son un subconjunto de Lucide y se distribuyen con su licencia en `vendor/`.
