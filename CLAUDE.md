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
- Desde el 02/11 ninguna burbuja de Delfina termina en punto final (pedido de Beto). Lo hace el código de `Split Burbujas` (WhatsApp) y
  `Split Burbujas IG` (función `sinPunto`) y lo refuerza la regla 9 del prompt. Si se tocan esos nodos o las reglas de escritura, mantener
  las dos cosas en los dos canales. El dashboard no se ve afectado: cuenta la frase de la clase de prueba en la memoria del agente, que
  guarda el texto original de Gemini.
- Desde el 15/10, el dashboard cuenta las clases de prueba buscando esa misma frase ("Avisá en recepción que venís a
  la clase de prueba") en la memoria de Delfina. Si se cambia en el prompt, cambiar también la función
  `dashboard_metricas` y la vista `v_gymbox_leads` de Supabase (`docs/17-dashboard-quejas-delfina.md`).
- El dashboard (`delfina-dashboard.vercel.app`) pide login y solo muestra datos a los mails de la tabla
  `dashboard_acceso`; las vistas y tablas de Delfina no se leen con la clave anon. No volver a abrirlas.
- Desde el 14/10, en Instagram la bienvenida a seguidores nuevos de ManyChat ("Say hi to new followers") le pasa la
  charla a Delfina cuando el seguidor toca "Info": manda un mensaje fijo con un `[Aviso del sistema: seguidor nuevo ...]`
  que el prompt de IG sabe tratar. Si se cambia ese texto en ManyChat, cambiar también la regla del prompt de IG (y al
  revés). Ya no se pide el WhatsApp en ese flow. Detalle en `docs/03-manychat.md`.
- Desde el 02/11 rigen los precios nuevos: los dos prompts tienen dos bloques con fecha (hasta 01/11 y desde 02/11) y
  Delfina los pasa como vigentes, sin mandar a recepción por precios. Cuando cambien de nuevo, actualizar los dos prompts
  y la fila `metodos_pago` de `Info_General` (y la pestaña `Precios`). `metodos_pago` y `Precios` del Sheet ya están actualizados (02/11); la pestaña `Promos` quedó sin tocar (Delfina no la lee).
- La Promo Noviembre ($38.900, Pase Full, 02 al 30/11) **sigue vigente** en los dos prompts: se había sacado por error y se restauró el 04/11
  (`docs/20-plan-promo-noviembre.md`). Los dos prompts también explican que los precios se actualizaron el 02/11 cuando un lead dice que
  antes pagaba menos. Sacar la promo el 01/12. Si hay una promo nueva, agregarla a los dos prompts con fecha de fin.
- Desde el 19/10 ManyChat está en Pro 2.500 (US$25/mes): en el plan viejo el tramo sube y baja solo con el total de
  contactos con opt-in. Por pedido de Beto, los inactivos se **borran** (no se desuscriben) todos los meses con los
  segmentos "Limpieza 2" y "Limpieza 3". El borrado lo hace Nano a mano. Después, cargar el número de Billing en la
  tabla `manychat_limpiezas`: el reporte de Telegram estima el contador con esa tabla y avisa cuando toca limpiar
  (`docs/03-manychat.md`, `docs/12-reportes-delfina.md`).
- Desde el 28/10 hay una difusión de ManyChat a ex socios en marcha (Excel `no renovados.xlsx` y el CSV de la lista, con
  datos personales: no se suben al repo). Se envió el 28/10 a 431 contactos. Terminó: el 02/11 se sacó la oferta de $37.900
  de los prompts y los nodos `Leer Tags` / `Aviso Difusion` de WhatsApp. No mandar nada a Beto sin OK de Nano. Detalle en
  `docs/18-difusion-ex-socios.md`.
- Desde el 28/10 el dashboard tiene la pestaña **Difusión** (`#difusion`, `DifusionTab.jsx`): muestra nombre y celular de
  los ex socios que respondieron, así que solo se ve con login y `dashboard_acceso`. Lee `dashboard_difusion()` y la tabla
  `difusion_respuestas`, que llena el workflow `GymBox - Clasificador Difusion` de n8n (cada 30 min hasta el 03/11; no manda
  mensajes). Si se cambian intenciones o motivos, cambiar a la vez el prompt del clasificador, el `check` de la tabla y las
  etiquetas de `DifusionTab.jsx` (`docs/19-desglose-difusion.md`). El CSV descargado tiene datos personales: no va al repo.
  Se despliega desde una copia limpia del commit, no desde la carpeta de trabajo (tiene archivos sueltos con datos).
- Desde el 30/10 todas las actividades tienen clase de prueba, incluidas Boxeo y CrossFit (Beto lo avisó). Está en los dos
  prompts y en `Info_General` (`clase_prueba`) del Sheet. Antes, esas dos no tenían. Plan de la promo de noviembre y de los
  precios nuevos del 02/11 en `docs/20-plan-promo-noviembre.md` (ejecutado el 02/11; faltan las pruebas con Gemini real y revisar
  ManyChat).
- En el gym no hay tatami: boxeo se hace con zapatillas y kickboxing descalzo. Está en los dos prompts y en la pestaña
  `Info_General` del Sheet (desde el 07/10). Delfina repite lo que diga el Sheet, así que un dato de negocio se
  corrige en el Sheet además del prompt.

## Verificación de cambios

- Después de cambiar UI: pasada de `baseline-ui` y `fixing-accessibility`.
- Después de cambiar un flujo o una consulta a Supabase: verificar con
  Reticle contra la app corriendo antes de dar la tarea por terminada.
