# Verrotwood · Creador de Cultos

Creador de cultos para **Verrotwood**, el juego de escaramuzas de folk horror. Consagra a tu dios, indoctrina a tus cultistas, prepara tus rituales y lleva a la mesa una hoja de culto lista para imprimir.

**▶ Úsala online: [angelcaballerodev.github.io/Verrotwood](https://angelcaballerodev.github.io/Verrotwood/)**

> **⚠️ Herramienta no oficial creada por fans.**
> No está afiliada ni respaldada por el autor de *Verrotwood* (Mike Crutchett). *Verrotwood*, sus reglas, nombres y contenidos pertenecen a sus respectivos propietarios. **Necesitas el manual oficial para jugar.** Esta app no lo sustituye: solo ayuda a crear y llevar el control de tu culto.
>
> Si eres el autor o el titular de los derechos y quieres que se cambie o se retire algo, abre un *issue* y se atenderá enseguida.

## Qué hace

- **Culto y deidad:** nombre, lore y Atributo de Ritual (STR, DEX, INT o DEF). La web adopta la paleta de color del dios elegido.
- **Rituales:** catálogo con filtros por coste y búsqueda; elige exactamente 4.
- **Cultistas:** hasta 4, con las mejoras de stats y Salud pagadas con Favor, movimiento y Favor invertido en cada uno.
- **Equipo:** armería con armas, objetos de un solo uso y montura (una por culto). Hay una reserva del culto para el equipo sin asignar, y los objetos encontrados explorando no cuestan Favor.
- **Puntos de Ritual:** tirada por cultista y suma de la reserva del culto, o la variante de RP fijo.
- **Campaña:** contador de Poder con meta corta o larga, y recompensas de los encuentros.
- **Hoja de culto imprimible:** apaisada, en blanco y negro, en una sola página A4 o Letter.
- **Guardado:** automático en el navegador, y exportar/importar en JSON para pasar un culto a otro dispositivo.

## Cómo usarla

No necesita instalación ni servidor: es HTML, CSS y JavaScript sin dependencias.

- **Online:** [angelcaballerodev.github.io/Verrotwood](https://angelcaballerodev.github.io/Verrotwood/). Funciona también en el móvil; puedes añadirla a la pantalla de inicio.
- **Local:** descarga el repositorio y abre `index.html` en el navegador.

Los cultos se guardan en el navegador de cada persona. Para llevarlos a otro dispositivo, usa **Exportar JSON** e **Importar JSON**.

## Estructura

```
index.html          Página de la app
app.js              Lógica: estado, reglas, guardado, hoja imprimible, JSON
data/rituals.js     Catálogo de rituales
data/equipment.js   Armas, objetos y monturas
css/                Estilos por sección (base, temas, panel, cultistas, rituales, equipo, campaña, impresión)
```
