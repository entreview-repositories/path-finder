# Arquitectura de Programación 4

Esta carpeta es la unidad de instalación y ejecución; no necesita recursos de otras materias.

`src/domain/`, `src/application/`, `src/infrastructure/`, `src/presentation/` y `ui/`.

El dominio contiene reglas, la aplicación coordina operaciones, la infraestructura maneja datos/procesos externos y la presentación adapta HTTP o interfaz. Las dependencias se conectan al arrancar. Los middleware procesan el transporte; las reglas vuelven a validarse en los casos de uso.

Los archivos de configuración, herramientas locales y scripts pertenecen a esta demo. El formato se aplica con npm run format desde su propia carpeta.
