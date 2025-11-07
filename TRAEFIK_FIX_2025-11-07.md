# Исправление конфликта Traefik labels после миграции

**Дата:** 7 ноября 2025
**Проблема:** Конфликт имён в Traefik labels между старым и новым проектом grampsweb

---

## Проблема

После переноса проекта grampsweb на новый сервер с Traefik возникли следующие ошибки:

- ❌ SSL не работал
- ❌ 404 ошибка при доступе к сайту
- ❌ Оба домена (`familytree.rstak.co` и `sargsyangenealogy.com`) открывали один и тот же контейнер

---

## Причина

Конфликт имён в Traefik labels:

1. **Старый проект** (`grampsweb_test`) и **новый проект** (`grampsweb`) использовали одинаковые имена роутеров и сервисов в Traefik
2. Оба проекта имели:
   - `traefik.http.routers.grampsweb`
   - `traefik.http.services.grampsweb`
3. Новый проект имел ошибку: роутер `grampsweb-new` ссылался на сервис `grampsweb` вместо `grampsweb-new`

---

## Решение

### 1. Переименование всех Traefik labels нового проекта

Переименовали все Traefik labels нового проекта с `grampsweb` на `grampsweb-new`:

**Роутеры:**
- `grampsweb` → `grampsweb-new` (HTTPS)
- `grampsweb-http` → `grampsweb-new-http` (HTTP redirect)

**Сервис:**
- `grampsweb` → `grampsweb-new`

**Middleware:**
- `grampsweb-redirect` → `grampsweb-new-redirect`
- `grampsweb-upload` → `grampsweb-new-upload`
- `grampsweb-headers` → `grampsweb-new-headers`

### 2. Исправление ссылки на сервис

**Было:**
```yaml
- "traefik.http.routers.grampsweb-new.service=grampsweb"
```

**Стало:**
```yaml
- "traefik.http.routers.grampsweb-new.service=grampsweb-new"
```

### 3. Перезапуск контейнеров

```bash
cd /opt/grampsweb
docker-compose restart grampsweb
docker restart traefik
```

---

## Результат

✅ `familytree.rstak.co` → контейнер `grampsweb` (новый проект)
✅ `sargsyangenealogy.com` → контейнер `grampsweb_test` (старый проект)
✅ SSL сертификаты работают для обоих доменов
✅ Каждый домен показывает свой контент

Теперь оба проекта работают независимо друг от друга! 🚀

---

## Урок на будущее

При использовании нескольких проектов с Traefik на одном сервере:

1. **Всегда используйте уникальные имена** для роутеров, сервисов и middleware
2. **Проверяйте конфликты** перед деплоем:
   ```bash
   curl -s http://localhost:8080/api/http/routers | grep -i "your-router-name"
   ```
3. **Используйте префиксы** для группировки (например, `project1-router`, `project2-router`)
4. **Проверяйте логи Traefik** на наличие ошибок:
   ```bash
   docker logs traefik | grep -iE "error|warn|conflict"
   ```

---

## Финальная конфигурация

Пример правильных labels для нового проекта:

```yaml
labels:
  - "traefik.enable=true"
  # HTTPS Router
  - "traefik.http.routers.grampsweb-new.rule=Host(`familytree.rstak.co`)"
  - "traefik.http.routers.grampsweb-new.entrypoints=websecure"
  - "traefik.http.routers.grampsweb-new.tls.certresolver=letsencrypt"
  - "traefik.http.routers.grampsweb-new.service=grampsweb-new"
  # HTTP -> HTTPS redirect
  - "traefik.http.middlewares.grampsweb-new-redirect.redirectscheme.scheme=https"
  - "traefik.http.middlewares.grampsweb-new-redirect.redirectscheme.permanent=true"
  - "traefik.http.routers.grampsweb-new-http.rule=Host(`familytree.rstak.co`)"
  - "traefik.http.routers.grampsweb-new-http.entrypoints=web"
  - "traefik.http.routers.grampsweb-new-http.middlewares=grampsweb-new-redirect"
  # Service
  - "traefik.http.services.grampsweb-new.loadbalancer.server.port=5001"
  # Middleware
  - "traefik.http.middlewares.grampsweb-new-upload.buffering.maxRequestBodyBytes=104857600"
  - "traefik.http.middlewares.grampsweb-new-headers.headers.customrequestheaders.X-Forwarded-Proto=https"
  - "traefik.http.routers.grampsweb-new.middlewares=grampsweb-new-headers,grampsweb-new-upload"
```

---

**Примечание:** Этот документ описывает решение проблемы, возникшей при миграции проекта с DigitalOcean на OVH сервер с Traefik.

