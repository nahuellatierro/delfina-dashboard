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
- Desde el 07/10, el corte de burbujas de WhatsApp (`Split Burbujas`) manda en una sola burbuja el saludo
  ("Soy Delfina") y la confirmación de la clase de prueba ("Avisá en recepción que venís a la clase de prueba"), y
  nunca deja solos un saludo corto al principio ni una frase corta (hasta 45 caracteres) al final. Si se cambian
  esas frases en el prompt, cambiar también el código.
- Desde el 15/10, el dashboard cuenta las clases de prueba buscando esa misma frase ("Avisá en recepción que venís a
  la clase de prueba") en la memoria de Delfina. Si se cambia en el prompt, cambiar también la función
  `dashboard_metricas` y la vista `v_gymbox_leads` de Supabase (`docs/17-dashboard-quejas-delfina.md`).
- El dashboard (`delfina-dashboard.vercel.app`) pide login y solo muestra datos a los mails de la tabla
  `dashboard_acceso`; las vistas y tablas de Delfina no se leen con la clave anon. No volver a abrirlas.
- Desde el 14/10, en Instagram la bienvenida a seguidores nuevos de ManyChat ("Say hi to new followers") le pasa la
  charla a Delfina cuando el seguidor toca "Info": manda un mensaje fijo con un `[Aviso del sistema: seguidor nuevo ...]`
  que el prompt de IG sabe tratar. Si se cambia ese texto en ManyChat, cambiar también la regla del prompt de IG (y al
  revés). Ya no se pide el WhatsApp en ese flow. Detalle en `docs/03-manychat.md`.
- Desde el 16/10 los precios de agosto valen como vigentes hasta que Beto pase precios nuevos: Delfina los pasa sin
  decir que son de agosto ni mandar a recepción por precios. Cuando cambien, actualizar los dos prompts y la fila
  `metodos_pago` de `Info_General` (y la pestaña `Precios`).
- Desde el 19/10 ManyChat está en Pro 2.500 (US$25/mes): en el plan viejo el tramo sube y baja solo con el total de
  contactos con opt-in. Por pedido de Beto, los inactivos se **borran** (no se desuscriben) todos los meses con los
  segmentos "Limpieza 2" y "Limpieza 3". El borrado lo hace Nano a mano. Después, cargar el número de Billing en la
  tabla `manychat_limpiezas`: el reporte de Telegram estima el contador con esa tabla y avisa cuando toca limpiar
  (`docs/03-manychat.md`, `docs/12-reportes-delfina.md`).
- Desde el 27/10 hay un plan de difusión de ManyChat a ex socios (Excel `no renovados.xlsx`, con datos personales: no
  se sube al repo) esperando las respuestas de Beto. No importar contactos, crear plantillas ni tocar los prompts para
  la difusión hasta que las dé. Detalle y pendientes en `docs/18-difusion-ex-socios.md`.
- Boxeo y CrossFit no tienen clase de prueba (en los dos prompts) hasta que Beto diga lo contrario.
- En el gym no hay tatami: boxeo se hace con zapatillas y kickboxing descalzo. Está en los dos prompts y en la pestaña
  `Info_General` del Sheet (desde el 07/10). Delfina repite lo que diga el Sheet, así que un dato de negocio se
  corrige en el Sheet además del prompt.

## Verificación de cambios

- Después de cambiar UI: pasada de `baseline-ui` y `fixing-accessibility`.
- Después de cambiar un flujo o una consulta a Supabase: verificar con
  Reticle contra la app corriendo antes de dar la tarea por terminada.
