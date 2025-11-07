# Быстрый старт: Миграция с DigitalOcean на OVH (Traefik + PM2)

> **Важно**: На сервере OVH используется Traefik для reverse proxy и PM2 для управления процессами.

## Шаг 1: Резервное копирование на старом сервере (DigitalOcean)

```bash
# Подключитесь к серверу DigitalOcean
ssh user@digitalocean-server

# Загрузите скрипт бэкапа
# (или скопируйте migrate_backup.sh на сервер)

# Сделайте скрипт исполняемым
chmod +x migrate_backup.sh

# Запустите бэкап
./migrate_backup.sh docker-compose.yml

# Скачайте архив на локальный компьютер
scp user@digitalocean-server:/backup/grampsweb_backup_*.tar.gz .
```

## Шаг 2: Подготовка нового сервера OVH

```bash
# Подключитесь к серверу OVH
ssh user@ovh-server

# Проверьте, что Docker уже установлен
docker --version
docker-compose --version

# Проверьте, что Traefik запущен
docker ps | grep traefik

# Узнайте имя сети Traefik (важно для следующего шага!)
docker network ls | grep traefik
# Или:
docker inspect $(docker ps -q --filter "name=traefik") | grep -A 10 "Networks"

# Создайте рабочую директорию
sudo mkdir -p /opt/grampsweb
sudo chown $USER:$USER /opt/grampsweb
cd /opt/grampsweb

# Клонируйте репозиторий или загрузите файлы проекта
git clone <ваш-репозиторий> .  # или загрузите файлы другим способом
```

## Шаг 3: Восстановление данных

```bash
# Загрузите архив бэкапа на новый сервер
scp grampsweb_backup_*.tar.gz user@ovh-server:/tmp/

# На сервере OVH: загрузите скрипт восстановления
# (или скопируйте migrate_restore.sh на сервер)

# Сделайте скрипт исполняемым
chmod +x migrate_restore.sh

# Восстановите данные
./migrate_restore.sh /tmp/grampsweb_backup_*.tar.gz
```

## Шаг 4: Настройка production конфигурации для Traefik

```bash
cd /opt/grampsweb

# Создайте production docker-compose.yml на основе примера для Traefik
cp docker-compose.traefik.yml.example docker-compose.yml

# Отредактируйте docker-compose.yml
nano docker-compose.yml
# Обязательно измените:
# 1. Имя сети Traefik в networks (замените traefik_network на реальное имя)
# 2. Домены в labels (замените your-domain.com на ваш домен)
# 3. SMTP настройки (если нужно)
# 4. Entrypoints (web, websecure) - проверьте, что они соответствуют вашей конфигурации Traefik
```

## Шаг 5: Обновление DNS

Обновите DNS записи вашего домена:
- **A запись**: `your-domain.com` → IP адрес OVH сервера
- **A запись**: `www.your-domain.com` → IP адрес OVH сервера (если используется)

Подождите распространения DNS (обычно 5-30 минут).

## Шаг 6: Запуск приложения

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

# Проверьте, что Traefik видит ваш сервис
docker logs traefik | grep grampsweb
```

## Шаг 7: Проверка работы

1. Откройте ваш домен в браузере
2. Проверьте, что SSL сертификат получен (должен быть зеленый замок)
3. Войдите в систему и проверьте работу всех функций

## Важные замечания

- **Traefik сеть**: Убедитесь, что имя сети в docker-compose.yml точно соответствует сети Traefik
- **Entrypoints**: Проверьте, что entrypoints (`web`, `websecure`) соответствуют конфигурации Traefik
- **Firewall**: Убедитесь, что порты 80 и 443 открыты для Traefik:
  ```bash
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw allow 22/tcp
  sudo ufw enable
  ```

- **Старый сервер**: Не удаляйте старый сервер сразу, оставьте его на несколько дней для проверки

- **Резервные копии**: Настройте регулярные бэкапы на новом сервере (см. MIGRATION_GUIDE_TRAEFIK.md)

- **PM2**: Если нужно использовать PM2 для управления процессами, см. подробности в MIGRATION_GUIDE_TRAEFIK.md

## Устранение проблем

### Проблема: SSL сертификат не получается

```bash
# Проверьте логи Traefik
docker logs traefik | grep -i acme
docker logs traefik | grep -i certificate

# Убедитесь, что DNS записи обновлены и распространились
nslookup your-domain.com

# Проверьте, что порты 80 и 443 открыты
sudo netstat -tlnp | grep -E ':(80|443)'

# Проверьте, что Traefik может получить сертификат
docker logs traefik | grep -i "letsencrypt\|acme"
```

### Проблема: Контейнеры не запускаются

```bash
# Проверьте логи
docker-compose -f docker-compose.yml logs

# Проверьте, что все volumes созданы
docker volume ls

# Проверьте, что сеть Traefik существует и контейнер подключен
docker network ls | grep traefik
docker network inspect traefik_network  # замените на ваше имя сети
```

### Проблема: Данные не отображаются

```bash
# Проверьте, что volumes восстановлены правильно
docker volume inspect gramps_db
docker volume inspect gramps_media

# Проверьте права доступа
docker exec grampsweb ls -la /app/users
```

## Дополнительная помощь

Подробное руководство для Traefik см. в файле `MIGRATION_GUIDE_TRAEFIK.md`

