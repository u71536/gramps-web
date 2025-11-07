# Руководство по миграции с DigitalOcean на OVH

## Подготовка к миграции

### 1. Резервное копирование данных на старом сервере (DigitalOcean)

Подключитесь к серверу DigitalOcean и выполните следующие команды:

```bash
# Создайте директорию для бэкапов
mkdir -p /backup/grampsweb

# Остановите контейнеры (опционально, для консистентности данных)
cd /opt/grampsweb  # или путь к вашему docker-compose.yml
docker-compose -f docker-compose.yml stop

# Создайте резервные копии всех volumes
# ВАЖНО: Используем абсолютные пути (/backup/grampsweb) вместо $(pwd) для надежности!
docker run --rm \
  -v gramps_users_test:/data:ro \
  -v /backup/grampsweb:/backup \
  alpine sh -c "cd /data && tar czf /backup/gramps_users_test.tar.gz ."

docker run --rm \
  -v gramps_index_test:/data:ro \
  -v /backup/grampsweb:/backup \
  alpine sh -c "cd /data && tar czf /backup/gramps_index_test.tar.gz ."

docker run --rm \
  -v gramps_thumb_cache_test:/data:ro \
  -v /backup/grampsweb:/backup \
  alpine sh -c "cd /data && tar czf /backup/gramps_thumb_cache_test.tar.gz ."

docker run --rm \
  -v gramps_cache_test:/data:ro \
  -v /backup/grampsweb:/backup \
  alpine sh -c "cd /data && tar czf /backup/gramps_cache_test.tar.gz ."

docker run --rm \
  -v gramps_secret_test:/data:ro \
  -v /backup/grampsweb:/backup \
  alpine sh -c "cd /data && tar czf /backup/gramps_secret_test.tar.gz ."

docker run --rm \
  -v gramps_db_test:/data:ro \
  -v /backup/grampsweb:/backup \
  alpine sh -c "cd /data && tar czf /backup/gramps_db_test.tar.gz ."

docker run --rm \
  -v gramps_media_test:/data:ro \
  -v /backup/grampsweb:/backup \
  alpine sh -c "cd /data && tar czf /backup/gramps_media_test.tar.gz ."

# Проверьте, что все бэкапы volumes созданы
echo "Проверка созданных бэкапов:"
ls -lh /backup/grampsweb/*.tar.gz

# Скопируйте конфигурационные файлы
cp /opt/grampsweb/docker-compose.yml /backup/grampsweb/
cp /opt/grampsweb/nginx_proxy.conf /backup/grampsweb/
cp /opt/grampsweb/static /backup/grampsweb/ -r 2>/dev/null || true

# Создайте архив всех бэкапов
cd /backup
tar czf grampsweb_backup_$(date +%Y%m%d_%H%M%S).tar.gz grampsweb/

# Проверьте содержимое архива
echo "Содержимое архива:"
tar tzf /backup/grampsweb_backup_*.tar.gz | head -20

# Запустите контейнеры обратно
cd /opt/grampsweb
docker-compose -f docker-compose.yml start

# Загрузите архив на ваш компьютер или в облачное хранилище
# Используйте scp, rsync или другой метод
# Пример: scp user@server:/backup/grampsweb_backup_*.tar.gz .
```

### 2. Экспорт SSL сертификатов (если нужно сохранить)

```bash
# Экспорт сертификатов из acme-companion
mkdir -p /backup/grampsweb
docker run --rm \
  -v grampsweb_certs:/data:ro \
  -v /backup/grampsweb:/backup \
  alpine sh -c "cd /data && tar czf /backup/ssl_certs.tar.gz ."
```

## Настройка нового сервера на OVH

### 1. Подготовка сервера OVH

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка необходимых пакетов
sudo apt install -y docker.io docker-compose git curl

# Запуск Docker
sudo systemctl enable docker
sudo systemctl start docker

# Добавление пользователя в группу docker (если нужно)
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Создание структуры директорий

```bash
# Создайте рабочую директорию
sudo mkdir -p /opt/grampsweb
sudo chown $USER:$USER /opt/grampsweb
cd /opt/grampsweb
```

### 3. Клонирование репозитория (или загрузка файлов)

```bash
# Если используете git
git clone <ваш-репозиторий> .

# Или загрузите файлы через scp/rsync
```

### 4. Восстановление данных

```bash
# Загрузите архив бэкапа на новый сервер
# Затем распакуйте его в рабочую директорию
cd /opt/grampsweb
tar xzf /path/to/grampsweb_backup_*.tar.gz

# Если архив распаковался в поддиректорию grampsweb, переместите файлы на уровень выше
if [ -d "grampsweb" ]; then
    mv grampsweb/* .
    rmdir grampsweb
fi

# Восстановите volumes из бэкапов (создайте volumes, если их еще нет)
docker volume create gramps_users_test
docker volume create gramps_index_test
docker volume create gramps_thumb_cache_test
docker volume create gramps_cache_test
docker volume create gramps_secret_test
docker volume create gramps_db_test
docker volume create gramps_media_test
docker volume create gramps_tmp_test

# Восстановите данные в volumes
# ВАЖНО: Используем абсолютные пути (/opt/grampsweb) для надежности!
# Убедитесь, что файлы *.tar.gz находятся в /opt/grampsweb/
docker run --rm \
  -v gramps_users_test:/data \
  -v /opt/grampsweb:/backup \
  alpine sh -c "cd /data && tar xzf /backup/gramps_users_test.tar.gz"

docker run --rm \
  -v gramps_index_test:/data \
  -v /opt/grampsweb:/backup \
  alpine sh -c "cd /data && tar xzf /backup/gramps_index_test.tar.gz"

docker run --rm \
  -v gramps_thumb_cache_test:/data \
  -v /opt/grampsweb:/backup \
  alpine sh -c "cd /data && tar xzf /backup/gramps_thumb_cache_test.tar.gz"

docker run --rm \
  -v gramps_cache_test:/data \
  -v /opt/grampsweb:/backup \
  alpine sh -c "cd /data && tar xzf /backup/gramps_cache_test.tar.gz"

docker run --rm \
  -v gramps_secret_test:/data \
  -v /opt/grampsweb:/backup \
  alpine sh -c "cd /data && tar xzf /backup/gramps_secret_test.tar.gz"

docker run --rm \
  -v gramps_db_test:/data \
  -v /opt/grampsweb:/backup \
  alpine sh -c "cd /data && tar xzf /backup/gramps_db_test.tar.gz"

docker run --rm \
  -v gramps_media_test:/data \
  -v /opt/grampsweb:/backup \
  alpine sh -c "cd /data && tar xzf /backup/gramps_media_test.tar.gz"
```

### 5. Создание docker-compose.yml для production

Создайте файл `docker-compose.yml` на основе `docker-compose.test.yml`, но с production настройками:

```yaml
version: '3'

services:
  grampsweb: &grampsweb
    container_name: grampsweb
    image: ghcr.io/u71536/gramps-web-new:1.1.0  # Обновите версию при необходимости
    restart: always
    environment: &grampsweb-env
      GRAMPSWEB_TREE: "Gramps Web"
      VIRTUAL_PORT: "5001"
      VIRTUAL_HOST: your-domain.com  # Замените на ваш домен
      LETSENCRYPT_HOST: your-domain.com
      LETSENCRYPT_EMAIL: your-email@example.com  # Замените на ваш email
      GRAMPSWEB_CELERY_CONFIG__broker_url: "redis://grampsweb_redis:6379/0"
      GRAMPSWEB_CELERY_CONFIG__result_backend: "redis://grampsweb_redis:6379/0"
      GRAMPSWEB_RATELIMIT_STORAGE_URI: redis://grampsweb_redis:6379/1
      PORT: "5001"
      # SMTP Settings
      GRAMPSWEB_EMAIL_HOST: "mail.smtp2go.com"
      GRAMPSWEB_EMAIL_PORT: "2525"
      GRAMPSWEB_EMAIL_HOST_USER: "rstak.co"
      GRAMPSWEB_EMAIL_HOST_PASSWORD: "8Z71sMNzgFCRsCaN"
      GRAMPSWEB_DEFAULT_FROM_EMAIL: "noreply@rstak.co"
      GRAMPSWEB_EMAIL_USE_TLS: "True"
    expose:
      - "5001"
    volumes:
      - gramps_users_test:/app/users
      - gramps_index_test:/app/indexdir
      - gramps_thumb_cache_test:/app/thumbnail_cache
      - gramps_cache_test:/app/cache
      - gramps_secret_test:/app/secret
      - gramps_db_test:/root/.gramps/grampsdb
      - gramps_media_test:/app/media
      - gramps_tmp_test:/tmp
      - ./static:/app/static
    networks:
      - grampsweb_proxy-tier
      - default

  grampsweb_celery:
    <<: *grampsweb
    container_name: grampsweb_celery
    depends_on:
      - grampsweb_redis
    environment:
      <<: *grampsweb-env
      VIRTUAL_PORT: ""
      VIRTUAL_HOST: ""
      LETSENCRYPT_HOST: ""
      LETSENCRYPT_EMAIL: ""
    command: celery -A gramps_webapi.celery worker --loglevel=INFO --concurrency=2

  grampsweb_redis:
    image: docker.io/library/redis:7.2.4-alpine
    container_name: grampsweb_redis
    restart: always
    networks:
      - default

  proxy:
    image: nginxproxy/nginx-proxy
    container_name: nginx-proxy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    environment:
      ENABLE_IPV6: "true"
    volumes:
      - ./nginx_proxy.conf:/etc/nginx/conf.d/my_proxy.conf:ro
      - conf:/etc/nginx/conf.d
      - dhparam:/etc/nginx/dhparam
      - certs:/etc/nginx/certs:ro
      - vhost.d:/etc/nginx/vhost.d
      - html:/usr/share/nginx/html
      - /var/run/docker.sock:/tmp/docker.sock:ro
    networks:
      - proxy-tier

  acme-companion:
    image: nginxproxy/acme-companion
    container_name: nginx-proxy-acme
    restart: always
    environment:
      NGINX_PROXY_CONTAINER: nginx-proxy
    volumes:
      - certs:/etc/nginx/certs:rw
      - vhost.d:/etc/nginx/vhost.d
      - html:/usr/share/nginx/html
      - acme:/etc/acme.sh
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - proxy-tier
    depends_on:
      - proxy

volumes:
  gramps_users_test:
  gramps_index_test:
  gramps_thumb_cache_test:
  gramps_cache_test:
  gramps_secret_test:
  gramps_db_test:
  gramps_media_test:
  gramps_tmp_test:

networks:
  grampsweb_proxy-tier:
    external: true
  default:
```

### 6. Создание внешней сети (если используется nginx-proxy)

**Примечание:** Если вы используете Traefik (как на OVH), пропустите этот шаг и перейдите к разделу для Traefik.

Если вы используете nginx-proxy, создайте внешнюю сеть:

```bash
# Проверьте, существует ли сеть
docker network ls | grep grampsweb_proxy-tier

# Если сети нет, создайте её
docker network create grampsweb_proxy-tier

# Если сеть уже существует (например, от другого проекта), это нормально - просто используйте её
```

### 7. Обновление DNS записей

Перед запуском обновите DNS записи вашего домена, чтобы они указывали на новый IP-адрес сервера OVH:

- **A запись**: `your-domain.com` → IP адрес OVH сервера
- **A запись**: `www.your-domain.com` → IP адрес OVH сервера (если используется)

### 8. Запуск приложения

```bash
cd /opt/grampsweb
docker-compose -f docker-compose.yml up -d
```

### 9. Проверка работы

```bash
# Проверьте статус контейнеров
docker-compose -f docker-compose.yml ps

# Проверьте логи
docker-compose -f docker-compose.yml logs -f

# Проверьте, что SSL сертификат получен
docker exec nginx-proxy-acme ls -la /etc/acme.sh/
```

## Важные замечания

1. **SMTP настройки**: Убедитесь, что SMTP настройки в `docker-compose.yml` корректны для нового сервера.

2. **Firewall**: Настройте firewall на OVH сервере:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

3. **Мониторинг**: После миграции проверьте работу всех функций приложения.

4. **Старый сервер**: Не удаляйте старый сервер сразу, оставьте его на несколько дней для проверки.

5. **Резервные копии**: Настройте регулярные резервные копии на новом сервере.

## Автоматизация резервного копирования

Создайте скрипт для регулярных бэкапов:

```bash
#!/bin/bash
# /opt/grampsweb/backup.sh

BACKUP_DIR="/backup/grampsweb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

cd /opt/grampsweb

# Бэкап volumes (используем абсолютные пути!)
for volume in gramps_users_test gramps_index_test gramps_thumb_cache_test \
              gramps_cache_test gramps_secret_test gramps_db_test gramps_media_test; do
  docker run --rm \
    -v $volume:/data:ro \
    -v $BACKUP_DIR:/backup \
    alpine sh -c "cd /data && tar czf /backup/${volume}_${DATE}.tar.gz ."
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

