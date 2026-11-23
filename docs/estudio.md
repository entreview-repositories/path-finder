# Guía de estudio del capstone

Se revisaron las nueve tareas (`*.4 Tareas.pdf`) y las diapositivas `Week1.pdf`–`Week9.pdf` de `/run/media/codeinozzz/COMPARTIDO/prog_4/`. Las tareas de las semanas 2, 3, 6 y 7 definen la lógica de Path Finder; la semana 4 pide pruebas, la 5 SOLID, la 8 una UI de escritorio y la 9 la entrega. Los laboratorios quedan como material de refuerzo; no son otros capstones.

| Semana | Contenido del curso | Dónde estudiarlo |
| --- | --- | --- |
| 1 | Node, JavaScript, backend y errores | `app.js`, `src/presentation/http/create-app.js`: Express y métodos HTTP |
| 2 | Funciones puras, efectos secundarios, inmutabilidad; CRUD y ORM | `domain/validation.js` transforma y valida sin escribir; `infrastructure/repositories/prisma.repository.js` concentra Prisma y efectos de persistencia |
| 3 | Orden superior, currying y composición; búsqueda óptima | `neighbors(map)(cell)` fija el mapa; `pipe` ordena las paradas; `createService(repository, search)` recibe dependencias |
| 4 | Pruebas funcionales y transparencia referencial | `test/solver.test.js`: misma entrada/mismo resultado y entrada sin mutación. `api.test.js`: API y SQLite reales |
| 5 | SOLID, functors y monads; errores | `Result.map` transforma éxitos y `Result.chain` encadena cómputos. `attempt` captura errores de dominio; HTTP los convierte a JSON |
| 6 | Recursividad, concurrencia, paralelismo y generadores | `connect` enlaza hasta 17 segmentos; `searchSteps` es un generador iterable; `infrastructure/search/worker-search.js` usa worker threads y límite de capacidad |
| 7 | Filtros, tuberías, acumuladores y memoización | `neighbors` filtra límites, `pipe` compone, `connect` acumula segmentos y `memoize` limita la caché a 32 resultados |
| 8 | Map/reduce, some/every/find; UI opcional | `domain/pathfinding/bfs.js` usa map/filter/reduce/some; `ui/app.js` transforma registros y encuentra celdas. Electron integra la UI con el backend |
| 9 | Síntesis y presentación | README, colección Postman, resultados y guion de demo |

## Cómo funciona la búsqueda

Primero se valida el mapa y se ordenan las paradas por `position`. La lista de objetivos queda `[inicio, parada1, parada2, ..., destino]`. Para cada par consecutivo, BFS recorre por niveles hasta encontrar el destino de ese segmento.

BFS usa una cola y un registro de predecesores: cada celda se descubre una vez, evitando bucles y sin copiar un camino completo para cada nodo. Al alcanzar el objetivo reconstruye el camino siguiendo los predecesores. En una cuadrícula de coste uniforme, el primer camino encontrado tiene el mínimo número de pasos.

`connect` concatena los caminos quitando la primera celda de cada segmento posterior para no duplicar las uniones. Minimizar cada segmento minimiza el total cuando el orden de paradas es obligatorio. Esto no resuelve el problema distinto de encontrar el mejor orden posible de visita.

La complejidad por segmento es O(ancho × alto), con memoria del mismo orden. El total multiplica ese coste por el número de segmentos, limitado a 17. `visitedCount` suma descubrimientos por segmento; una celda visitada en dos segmentos cuenta dos veces.

## Pureza y efectos

`solve(map, start, end, avoidCells)` recibe todos los datos necesarios. No lee la base, la hora ni variables globales mutables; devuelve un valor nuevo o un error. Sus mapas y colas mutables son locales: no modifican la entrada ni son observables después de terminar.

`memoize` sí mantiene estado interno. Se ubica en el borde de ejecución, no dentro del algoritmo puro, y entrega copias de los resultados. La clave incluye el contenido de mapa, paradas y preferencias: una modificación no puede reutilizar una ruta anterior.

`infrastructure/repositories/prisma.repository.js` y HTTP tienen efectos secundarios intencionales. Las pruebas los aíslan en bases temporales. Las transacciones invalidan rutas y actualizan la versión junto con los cambios del mapa. Al guardar una búsqueda se verifica que su versión siga vigente.

## SOLID aplicado

- **Responsabilidad única:** `validation` valida, `solver` busca, `repository` persiste y `http` traduce solicitudes/respuestas.
- **Abierto/cerrado:** `createService(repository, search)` permite inyectar otra búsqueda, como Dijkstra, conservando su contrato de resultado; el servicio no necesita conocer su implementación.
- **Sustitución:** la búsqueda síncrona `solve` y la búsqueda asíncrona `createSearch()` se consumen con `await` y devuelven `path`, `distance`, `visitedCount`. La prueba de versión inyecta una búsqueda alternativa sin cambiar el servicio. No se introdujo una jerarquía artificial de clases.
- **Segregación:** el contrato del repositorio expone `get`, `list`, `create`, `update`, `remove`. El servicio usa esas operaciones sin acceder a clientes, conexiones o migraciones.
- **Inversión:** el servicio recibe el repositorio y la búsqueda; el arranque conecta las implementaciones Prisma/worker. La lógica de búsqueda no depende de Express ni SQLite.

## Result, generadores y paralelismo

`Result` es un contenedor pequeño de éxito/error con `map` y `chain`. En `solve` se usa `attempt(...).map(...)` y luego `unwrap` para añadir metadatos solo a un resultado exitoso. No hace falta una biblioteca funcional para entender el patrón.

`searchSteps` implementa `*[Symbol.iterator]()` para producir pasos de búsqueda bajo demanda. Es la excepción sintáctica necesaria a las funciones flecha: JavaScript no permite funciones flecha generadoras. La API consume el iterador hasta el resultado final; no emite pasos por red.

Dos promesas en `Promise.all` representan concurrencia, pero no garantizan paralelismo de CPU. Por eso las búsquedas grandes usan dos workers reales. Cada worker recibe una copia del mapa y conserva su propia cola. La capacidad se acota para evitar lanzar un hilo por petición sin límite.

## Decisiones para mantenerlo mínimo

Cada obstáculo ocupa una celda; varios obstáculos representan una pared o una figura irregular. Las paradas son coordenadas ordenadas y no un grafo de dependencias: no existen dependencias cíclicas que validar. Los ciclos de la cuadrícula se gestionan con el conjunto de visitados.

Las tareas contienen una frase sobre no intersectar puntos de parada que contradice el requisito de pasar por ellos. Se interpreta que las paradas son transitables y obligatorias; los obstáculos sí están prohibidos.

La UI permite crear, editar, eliminar y visualizar mapas, obstáculos, paradas y rutas. Los cambios de posición/orden de una parada se pueden hacer con PUT/PATCH o borrando y recreando desde la cuadrícula. El usuario organiza mapas y preferencias; no se agregaron requisitos de autenticación de UNO a Path Finder.

Para estudiarlo: leer primero validaciones y BFS; después servicio/repositorio; finalmente HTTP, workers, UI y pruebas. El guion de demo sigue ese mismo recorrido.

## Middleware HTTP explícito

`src/presentation/http/middleware/request.js` valida Content-Type JSON, forma del cuerpo, IDs y filtros antes de entrar al controlador. `src/presentation/http/middleware/error-handler.js` centraliza la traducción de errores y su registro. `presentation/http/create-app.js` se limita a componer el flujo de Express. Las validaciones del servicio se conservan para proteger también llamadas que no provienen de HTTP.

## Lectura después de la refactorización

1. `src/domain/pathfinding/bfs.js`: algoritmo sin HTTP ni Prisma.
2. `src/application/create-service.js` y `policies/`: reglas de cada recurso, separadas del CRUD común.
3. `src/infrastructure/repositories/prisma.repository.js`: acceso a datos y transacciones.
4. `src/presentation/http/`: rutas, controladores y middleware.
5. `ui/app.js`: conecta los módulos de usuarios, mapas, editor, rutas y demo; el dibujo vive en `ui/views/map-canvas.js`.

Las funciones reciben las dependencias que usan. Se conservaron funciones y objetos pequeños; no se agregó una jerarquía de clases para cada operación.
