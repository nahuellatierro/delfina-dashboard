# gymbox-dash

Dashboard de leads de Delfina, la asistente IA de GymBox para WhatsApp e Instagram. Contexto completo del ecosistema
en `../estudio/hermes-context/gymbox.md` (relevado el 26/08; no incluye los cambios del 29/09).

## Documentación operativa: leer primero `docs/`

`docs/` tiene todo lo operativo de Delfina: workflows de n8n nodo por nodo, ManyChat, audios, Supabase, cómo revisar
ejecuciones, historial y pendientes. Empezar por `docs/README.md`.

- **`docs/` está en `.gitignore` y NUNCA se sube:** este repo es público y ahí hay URLs de webhooks, IDs y prompts.
- No copiar URLs de webhooks, IDs de credenciales ni prompts a archivos versionados (este `CLAUDE.md`, `README.md`,
  `src/`).
- Al cambiar un workflow de n8n o ManyChat, actualizar `docs/` (y los exports en `docs/workflows/` y
  `docs/prompts/`) en la misma sesión.

## Reglas clave de Delfina

- Hay **dos workflows** (WhatsApp e Instagram) con prompts casi iguales: todo cambio de precios, promos o reglas va en
  los dos.
- Antes de publicar un cambio en producción: backup + `test_workflow` con datos simulados + verificar el prompt byte a
  byte. Después, mirar las primeras ejecuciones reales. Procedimiento completo en `docs/06-runbook-ejecuciones.md`.
- En ManyChat, confirmar que la cuenta abierta es la de GymBox antes de editar (ver `docs/03-manychat.md`).
- Desde el 05/10 hay un detector de quejas y objetos perdidos que corre antes de Delfina y avisa por Telegram
  (`docs/14-propuesta-detector-quejas.md`). Si se cambian sus reglas, volver a correr el set de prueba de
  `docs/workflows/quejas/` antes de publicar. La sección de quejas está en los dos prompts.

## Verificación de cambios

- Después de cambiar UI: pasada de `baseline-ui` y `fixing-accessibility`.
- Después de cambiar un flujo o una consulta a Supabase: verificar con
  Reticle contra la app corriendo antes de dar la tarea por terminada.
