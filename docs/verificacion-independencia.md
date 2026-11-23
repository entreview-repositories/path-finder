# Verificación de independencia

Fecha: 14 de noviembre de 2026.

Esta demo tiene manifiesto, archivo de bloqueo, dependencias, configuración, scripts y datos propios. La carpeta que agrupa las materias no contiene herramientas ni paquetes de ejecución. Los imports relativos no salen de esta demo y no hay enlaces a recursos de las otras materias.

Se ejecutó con las demás demos detenidas y sin dependencias en la carpeta principal. Compilación, formato y pruebas finalizaron correctamente:

- 14 pruebas de lógica; cobertura de líneas 99,26 %.
- Prueba de Electron: 18 pasos, 113 nodos visitados.

Los registros de ejecución están en [verificacion/](verificacion/). Los servicios iniciados para estas pruebas quedaron detenidos; `bash iniciar.sh` vuelve a iniciar esta demo.

Los datos anteriores se conservaron. Se compararon los archivos SQLite y de audio con el respaldo; los volúmenes originales de MongoDB y PostgreSQL se copiaron a volúmenes exclusivos y se compararon antes de las pruebas.
