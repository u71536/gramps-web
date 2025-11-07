# Руководство по миграции с DigitalOcean на OVH (Traefik + PM2)

## Особенности инфраструктуры OVH

На сервере OVH используется:
- **Traefik** - для reverse proxy и автоматического SSL
- **PM2** - для управления процессами (если нужно)
- **Docker** - уже установлен

## Подготовка к миграции

### 1. Резервное копирование данных на старом сервере (DigitalOcean)

Используйте скрипт `migrate_backup.sh` или выполните вручную:

```bash
# Подключитесь к серверу DigitalOcean
ssh user@digitalocean-server

# Загрузите скрипт бэкапа
chmod +x migrate_backup.sh

# Запустите бэкап
./migrate_backup.sh docker-compose.yml

# Скачайте архив на локальный компьютер
scp user@digitalocean-server:/backup/grampsweb_backup_*.tar.gz .
```

## Настройка нового сервера на OVH

### 1. Проверка Traefik

Убедитесь, что Traefik уже запущен и работает:

```bash
# Проверьте, что Traefik запущен
docker ps | grep traefik

# Проверьте имя сети Traefik
docker network ls | grep traefik

# Обычно это может быть: traefik_default, traefik_network, web или другое
# Узнайте точное имя сети:
docker inspect $(docker ps -q --filter "name=traefik") | grep -A 10 "Networks"
```

### 2. Создание структуры директорий

```bash
# Создайте рабочую директорию
sudo mkdir -p /opt/grampsweb
sudo chown $USER:$USER /opt/grampsweb
cd /opt/grampsweb
```

### 3. Восстановление данных

```bash
# Загрузите архив бэкапа на новый сервер
scp grampsweb_backup_*.tar.gz user@ovh-server:/tmp/

# На сервере OVH: загрузите скрипт восстановления
chmod +x migrate_restore.sh

# Восстановите данные
./migrate_restore.sh /tmp/grampsweb_backup_*.tar.gz
```

### 4. Настройка docker-compose.yml для Traefik

Создайте `docker-compose.yml` на основе `docker-compose.traefik.yml.example`:

```bash
cd /opt/grampsweb
cp docker-compose.traefik.yml.example docker-compose.yml
nano docker-compose.yml
```

**Важно обновить:**

1. **Имя сети Traefik** - замените `traefik_network` на реальное имя сети вашего Traefik:
   ```yaml
   networks:
     traefik_network:  # Замените на реальное имя сети
       external: true
   ```

2. **Домены** - замените `your-domain.com` на ваш реальный домен в labels:
   ```yaml
   - "traefik.http.routers.grampsweb.rule=Host(`your-domain.com`) || Host(`www.your-domain.com`)"
   ```

3. **Entrypoints** - убедитесь, что entrypoints соответствуют вашей конфигурации Traefik:
   - `web` - обычно для HTTP (порт 80)
   - `websecure` - обычно для HTTPS (порт 443)

   Если у вас другие имена, обновите их в labels.

4. **CertResolver** - убедитесь, что имя cert resolver правильное (обычно `letsencrypt`)

### 5. Проверка конфигурации Traefik

Убедитесь, что в вашем Traefik есть middleware для редиректа на HTTPS:

```bash
# Проверьте конфигурацию Traefik
docker exec traefik cat /etc/traefik/traefik.yml
# или
docker exec traefik cat /traefik.yml
```

Если middleware `redirect-to-https` не существует, создайте его в конфигурации Traefik или удалите эту строку из labels:

```yaml
# Удалите эту строку, если middleware не существует:
# - "traefik.http.routers.grampsweb-http.middlewares=redirect-to-https"
```

Альтернативно, создайте middleware в docker-compose.yml Traefik или в его конфигурации:

```yaml
# В docker-compose.yml Traefik добавьте:
labels:
  - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
  - "traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true"
```

### 6. Создание volumes (если не восстановлены)

```bash
# Volumes должны быть созданы скриптом восстановления
# Если нет, создайте вручную:
docker volume create gramps_users
docker volume create gramps_index
docker volume create gramps_thumb_cache
docker volume create gramps_cache
docker volume create gramps_secret
docker volume create gramps_db
docker volume create gramps_media
docker volume create gramps_tmp
```

### 7. Обновление DNS записей

Обновите DNS записи вашего домена:
- **A запись**: `your-domain.com` → IP адрес OVH сервера
- **A запись**: `www.your-domain.com` → IP адрес OVH сервера (если используется)

Подождите распространения DNS (обычно 5-30 минут).

### 8. Запуск приложения

```bash
cd /opt/grampsweb

# Проверьте конфигурацию перед запуском
docker-compose -f docker-compose.yml config

# Запустите приложение
docker-compose -f docker-compose.yml up -d

# Проверьте статус
docker-compose -f docker-compose.yml ps

# Проверьте логи
docker-compose -f docker-compose.yml logs -f grampsweb
```

### 9. Проверка работы Traefik

```bash
# Проверьте, что Traefik видит ваш сервис
docker logs traefik | grep grampsweb

# Проверьте, что сертификат получен
docker logs traefik | grep -i certificate
```

## Использование PM2 (опционально)

Если вы хотите использовать PM2 для управления контейнерами или другими процессами:

### Установка PM2

```bash
# Установите Node.js (если еще не установлен)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установите PM2
sudo npm install -g pm2
```

### Создание PM2 конфигурации

Создайте файл `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'grampsweb-docker',
    script: 'docker-compose',
    args: '-f /opt/grampsweb/docker-compose.yml up',
    cwd: '/opt/grampsweb',
    interpreter: 'none',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

Однако, если вы используете Docker Compose с `restart: always`, PM2 может быть не нужен для управления контейнерами. PM2 полезен, если у вас есть другие Node.js процессы, которые нужно управлять.

## Проверка работы

1. Откройте ваш домен в браузере
2. Проверьте, что SSL сертификат работает (должен быть зеленый замок)
3. Войдите в систему и проверьте работу всех функций
4. Проверьте логи на ошибки:

```bash
# Логи приложения
docker-compose -f docker-compose.yml logs -f grampsweb

# Логи Celery
docker-compose -f docker-compose.yml logs -f grampsweb_celery

# Логи Traefik
docker logs traefik -f
```

## Устранение проблем

### Проблема: Traefik не видит контейнер

```bash
# Проверьте, что контейнер в той же сети, что и Traefik
docker network inspect traefik_network  # замените на ваше имя сети

# Проверьте labels контейнера
docker inspect grampsweb | grep -A 20 Labels

# Убедитесь, что traefik.enable=true
```

### Проблема: SSL сертификат не получается

```bash
# Проверьте логи Traefik
docker logs traefik | grep -i acme
docker logs traefik | grep -i certificate

# Убедитесь, что DNS записи обновлены
nslookup your-domain.com

# Проверьте, что порты 80 и 443 открыты и доступны для Let's Encrypt
```

### Проблема: 404 или Bad Gateway

```bash
# Проверьте, что приложение запущено и слушает порт 5001
docker exec grampsweb netstat -tlnp | grep 5001

# Проверьте логи приложения
docker-compose -f docker-compose.yml logs grampsweb

# Проверьте правила Traefik
docker logs traefik | grep grampsweb
```

### Проблема: Большие файлы не загружаются

Убедитесь, что middleware для больших загрузок настроен правильно. В labels должно быть:

```yaml
- "traefik.http.middlewares.grampsweb-upload.buffering.maxRequestBodyBytes=104857600"
- "traefik.http.routers.grampsweb.middlewares=grampsweb-upload"
```

Также проверьте настройки Traefik для максимального размера тела запроса.

## Настройка регулярных резервных копий

Создайте скрипт для автоматических бэкапов:

```bash
#!/bin/bash
# /opt/grampsweb/backup.sh

BACKUP_DIR="/backup/grampsweb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

cd /opt/grampsweb

# Бэкап volumes
for volume in gramps_users gramps_index gramps_thumb_cache \
              gramps_cache gramps_secret gramps_db gramps_media; do
  docker run --rm \
    -v $volume:/data \
    -v $BACKUP_DIR:/backup \
    alpine tar czf /backup/${volume}_${DATE}.tar.gz -C /data .
done

# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Добавьте в crontab:

```bash
crontab -e
# Добавьте строку:
0 2 * * * /opt/grampsweb/backup.sh
```

## Дополнительные настройки Traefik

Если нужно добавить дополнительные middleware (например, для rate limiting, auth и т.д.), создайте их в конфигурации Traefik или через labels других контейнеров.

Пример добавления rate limiting:

```yaml
labels:
  - "traefik.http.middlewares.grampsweb-ratelimit.ratelimit.average=100"
  - "traefik.http.middlewares.grampsweb-ratelimit.ratelimit.burst=50"
  - "traefik.http.routers.grampsweb.middlewares=grampsweb-ratelimit,grampsweb-upload"
```

## Важные замечания

1. **Сеть Traefik**: Убедитесь, что имя сети в docker-compose.yml точно соответствует сети Traefik
2. **Entrypoints**: Проверьте, что entrypoints (`web`, `websecure`) соответствуют конфигурации Traefik
3. **Firewall**: Убедитесь, что порты 80 и 443 открыты для Traefik
4. **Старый сервер**: Не удаляйте старый сервер сразу, оставьте его на несколько дней для проверки

