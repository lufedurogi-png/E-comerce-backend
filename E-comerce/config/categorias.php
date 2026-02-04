<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Categorías principales del proyecto
    |--------------------------------------------------------------------------
    | El proyecto define estas categorías. Las "subcategorías" son los grupos
    | que trae CVA (API); el algoritmo abajo asigna cada grupo a una categoría.
    */
    'principales' => [
        ['id' => 'accesorios', 'nombre' => 'Accesorios', 'orden' => 1],
        ['id' => 'laptops', 'nombre' => 'Laptops', 'orden' => 2],
        ['id' => 'monitores', 'nombre' => 'Monitores', 'orden' => 3],
        ['id' => 'audio', 'nombre' => 'Audio', 'orden' => 4],
        ['id' => 'almacenamiento', 'nombre' => 'Almacenamiento', 'orden' => 5],
        ['id' => 'componentes', 'nombre' => 'Componentes', 'orden' => 6],
        ['id' => 'impresoras', 'nombre' => 'Impresoras', 'orden' => 7],
        ['id' => 'pcs', 'nombre' => 'PC\'s / Computadoras', 'orden' => 8],
        ['id' => 'otros', 'nombre' => 'Otros', 'orden' => 99],
    ],

    /*
    |--------------------------------------------------------------------------
    | Mapeo explícito grupo CVA → id categoría principal
    |--------------------------------------------------------------------------
    | Si el grupo aparece aquí, se usa esta categoría. Clave = grupo (case insensitive).
    */
    'grupo_exacto' => [
        // Accesorios
        'Hubs USB' => 'accesorios',
        'Mouse' => 'accesorios',
        'Teclado' => 'accesorios',
        'Cámaras Web' => 'accesorios',
        'Fundas' => 'accesorios',
        'Mochilas' => 'accesorios',
        'Bases / Soportes' => 'accesorios',
        'Cables / Adaptadores' => 'accesorios',
        'Mouse Pad' => 'accesorios',
        'Cargadores' => 'accesorios',
        'Baterías / Power Banks' => 'accesorios',
        'Docking Station' => 'accesorios',
        'Tapete para sillas' => 'accesorios',
        'Kits de Accesorios' => 'accesorios',
        'Reposamuñecas' => 'accesorios',
        'Lectores de Memoria' => 'accesorios',
        'Lentes VR' => 'accesorios',
        'Sillas' => 'accesorios',
        'Game Pads' => 'accesorios',
        'Presentadores' => 'accesorios',
        'Lectores de Código' => 'accesorios',
        'Cajones de Dinero' => 'accesorios',
        'Otros Accesorios' => 'accesorios',
        // Laptops
        'Laptops Gaming' => 'laptops',
        'Laptops Ultrabook' => 'laptops',
        'Laptops Business' => 'laptops',
        'Laptops 2 en 1' => 'laptops',
        'Laptops Básicas' => 'laptops',
        'Workstations' => 'laptops',
        'Chromebooks' => 'laptops',
        'MacBooks' => 'laptops',
        'Repuestos para Laptops' => 'laptops',
        'Baterías para Laptops' => 'laptops',
        'Cargadores para Laptops' => 'laptops',
        // Monitores
        'Monitores Gaming' => 'monitores',
        'Monitores 4K' => 'monitores',
        'Monitores Curvos' => 'monitores',
        'Monitores Ultrawide' => 'monitores',
        'Monitores Profesionales' => 'monitores',
        'Monitores Básicos' => 'monitores',
        'Monitores Portátiles' => 'monitores',
        'Bases para Monitores' => 'monitores',
        'Brazos para Monitores' => 'monitores',
        // Audio
        'Auriculares' => 'audio',
        'Audífonos Inalámbricos' => 'audio',
        'Audífonos Gaming' => 'audio',
        'Bocinas' => 'audio',
        'Bocinas Portátiles' => 'audio',
        'Sistemas de Sonido' => 'audio',
        'Micrófonos' => 'audio',
        'Amplificadores' => 'audio',
        'Cables de Audio' => 'audio',
        'Adaptadores de Audio' => 'audio',
        // Almacenamiento
        'SSD Internos' => 'almacenamiento',
        'SSD Externos' => 'almacenamiento',
        'HDD Internos' => 'almacenamiento',
        'HDD Externos' => 'almacenamiento',
        'Unidades USB' => 'almacenamiento',
        'Tarjetas de Memoria' => 'almacenamiento',
        'NAS' => 'almacenamiento',
        'Enclosures' => 'almacenamiento',
        'Cables SATA' => 'almacenamiento',
        // Componentes
        'Procesadores' => 'componentes',
        'Tarjetas Madre' => 'componentes',
        'Tarjetas Gráficas' => 'componentes',
        'Memoria RAM' => 'componentes',
        'Fuentes de Poder' => 'componentes',
        'Refrigeración' => 'componentes',
        'Ventiladores' => 'componentes',
        'Tarjetas de Red' => 'componentes',
        'Tarjetas de Sonido' => 'componentes',
        'Controladores' => 'componentes',
        // Impresoras (incluye Scanner y Tinta como subcategorías)
        'Impresoras' => 'impresoras',
        'Impresoras de Inyección' => 'impresoras',
        'Impresoras Láser' => 'impresoras',
        'Impresoras Multifuncionales' => 'impresoras',
        'Impresoras Matriciales' => 'impresoras',
        'Impresoras Térmicas' => 'impresoras',
        'Consumibles para Impresoras' => 'impresoras',
        'Scanner' => 'impresoras',
        'Scanners' => 'impresoras',
        // Tinta y respuestos de tinta para impresora
        'Tinta' => 'impresoras',
        'Tintas' => 'impresoras',
        'Consumibles de Tinta' => 'impresoras',
        'Cartuchos de Tinta' => 'impresoras',
        'Cartuchos de Tinta para Impresora' => 'impresoras',
        'Tóner' => 'impresoras',
        'Tóners' => 'impresoras',
        'Consumibles Tinta' => 'impresoras',
        'Repuestos de Tinta' => 'impresoras',
        'Respuertos de Tinta' => 'impresoras',
        // PC's / Computadoras de escritorio
        'PC' => 'pcs',
        'PCs' => 'pcs',
        'Computadoras de Escritorio' => 'pcs',
        'Computadoras de escritorio' => 'pcs',
        'All in One' => 'pcs',
        'Torres' => 'pcs',
        'Gabinetes' => 'pcs',
        'Kits de Computadora' => 'pcs',
    ],

    /*
    |--------------------------------------------------------------------------
    | Reglas por contenido (si no coincide con grupo_exacto)
    |--------------------------------------------------------------------------
    | Cada regla: 'contiene' => string(s) en el grupo, 'categoria' => id.
    | Se evalúan en orden; primera coincidencia gana.
    */
    /*
    |--------------------------------------------------------------------------
    | Subcategorías fijas (siempre visibles aunque no haya productos con ese grupo)
    |--------------------------------------------------------------------------
    | id_categoria => [ 'Subcategoría 1', 'Subcategoría 2' ]
    */
    'subcategorias_extra' => [
        'impresoras' => ['TINTA'],
    ],

    'grupo_contiene' => [
        ['contiene' => ['Laptop', 'Notebook', 'Chromebook', 'MacBook', 'Workstation', 'Portatil', 'Portátil'], 'categoria' => 'laptops'],
        ['contiene' => ['Monitor', 'Pantalla'], 'categoria' => 'monitores'],
        ['contiene' => ['Audífono', 'Audifonos', 'Auriculares', 'Bocina', 'Micrófono', 'Micro', 'Audio', 'Sonido'], 'categoria' => 'audio'],
        ['contiene' => ['SSD', 'HDD', 'Disco', 'Almacenamiento', 'NAS', 'Memoria'], 'categoria' => 'almacenamiento'],
        ['contiene' => ['Impresora', 'Printer', 'Scanner', 'Tinta', 'Tóner'], 'categoria' => 'impresoras'],
        ['contiene' => ['PC ', 'Desktop', 'All in One', 'Torre', 'Gabinete', 'Escritorio', 'Computadora de escritorio'], 'categoria' => 'pcs'],
        ['contiene' => ['Procesador', 'Tarjeta Madre', 'RAM', 'Fuente', 'GPU', 'Gráfica', 'Refrigeración', 'Ventilador'], 'categoria' => 'componentes'],
        ['contiene' => ['Mouse', 'Teclado', 'Hub', 'Cámara', 'Accesorio', 'Cable', 'Adaptador', 'Cargador', 'Fundas', 'Mochila', 'Soporte', 'VR', 'Silla', 'Pad'], 'categoria' => 'accesorios'],
    ],

];
