# Deploy — create-mp-preference Edge Function

## Requisitos previos
```bash
npm install -g supabase
supabase login
supabase link --project-ref bavarmytvyntpohimkqt
```

---

## Paso 1 — Registrar el Access Token como secret

⚠️  El token se escribe SIN comillas, sin espacios ni salto de línea al final.

```bash
supabase secrets set MP_ACCESS_TOKEN=APP_USR-8643952932566777-052814-d3fc56fc244e87a9274e9d4490cb5915-3432357979 --project-ref bavarmytvyntpohimkqt
```

Verifica que quedó guardado:
```bash
supabase secrets list --project-ref bavarmytvyntpohimkqt
```
Debes ver `MP_ACCESS_TOKEN` en la lista.

---

## Paso 2 — Deploy de la función

```bash
supabase functions deploy create-mp-preference --no-verify-jwt --project-ref bavarmytvyntpohimkqt
```

`--no-verify-jwt` permite que el frontend llame la función con la anon key
sin necesitar un JWT de usuario autenticado.

---

## Paso 3 — (Opcional) SITE_URL para producción

En desarrollo las back_urls usan http://localhost:5173.
Para producción, agrega este secret ANTES de re-deployar:

```bash
supabase secrets set SITE_URL=https://tu-dominio.com --project-ref bavarmytvyntpohimkqt
supabase functions deploy create-mp-preference --no-verify-jwt --project-ref bavarmytvyntpohimkqt
```

---

## Verificar los logs en tiempo real

Abre el Dashboard de Supabase → Edge Functions → create-mp-preference → Logs.
O desde CLI:

```bash
supabase functions logs create-mp-preference --project-ref bavarmytvyntpohimkqt
```

---

## Errores comunes y su causa

| Error | Causa | Fix |
|-------|-------|-----|
| `MP_ACCESS_TOKEN no está configurado` (500) | Secret no registrado | Ejecutar Paso 1 |
| `Unauthorized` / 401 de MP | Token con comillas extras o incorrecto | Re-ejecutar `secrets set` sin comillas |
| `auto_return invalid. back_url.success must be defined` | back_urls vacías o con URL inválida | Ya corregido en el código — re-deployar |
| `CORS error` en el navegador | OPTIONS preflight sin headers correctos | Ya corregido en el código — re-deployar |
