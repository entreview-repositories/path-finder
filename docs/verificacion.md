# Verificación — 12 de noviembre de 2026

Entorno: Node.js 24.22.0, Prisma 7.10.1, SQLite con el adaptador oficial y Electron 45.3.1.

| Comprobación | Resultado |
| --- | --- |
| `npm run setup` | Cliente generado y migración aplicada correctamente |
| `npm test` | 14 pruebas aprobadas, cero fallos |
| Cobertura de líneas del backend | 99,40 % |
| Cobertura de funciones del backend | 98,85 % |
| Cobertura de ramas del backend | 95,04 % |
| `npm run test:desktop` | Ventana real, ejemplo creado, ruta guardada de 18 pasos, parada visitada y ruta recuperada |
| `npm run test:performance` | 50 búsquedas de 100 × 100; 403 ms en total, media aproximada 8,05 ms |
| Colección Postman | 31 solicitudes verificadas en secuencia contra SQLite mediante un ejecutor HTTP; no se ejecutó la aplicación Postman |
| Dos búsquedas mediante workers | Distancias de 198 pasos; aproximadamente 38,54 ms incluyendo arranque |

La prueba de escritorio usa una base temporal independiente y mantiene el sandbox de Electron. Captura la ventana después de calcular la ruta. El proceso puede registrar un aviso de Vulkan/Wayland del sistema gráfico; la prueba terminó correctamente.

Las mediciones dependen del equipo. La diferencia de heap observada no demuestra ausencia de fugas; el benchmark solo detecta regresiones evidentes de tiempo y memoria. La caché y el número de workers tienen límites explícitos.

La cobertura corresponde a los módulos escritos en `src/**/*.js`. Excluye Prisma generado (TypeScript), lanzadores, interfaz y scripts; no se presenta como cobertura de toda la aplicación.

No se grabó video ni se publicó en GitHub. El código, colección y guion quedan preparados localmente.

[Captura de la demo comprobada](demo.png).
