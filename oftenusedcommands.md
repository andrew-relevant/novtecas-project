# Список всех volumes
docker volume ls

# Очистить Docker. Удалит: неиспользуемые контейнеры, dangling images, кеш
# Очистить build cache (часто жирный)
docker system prune -a -f
docker builder prune -a -f

# Обнулить Docker контейнер с базой данных, для дальнейшей загрузки из seed при билде.
docker volume rm novtecas_pgdata

# Запуск билда всего проекта на проде
docker compose -f docker-compose.prod.yml build --no-cache

# Остановить проекты
docker compose down

# запустить проекты
docker compose -f docker-compose.prod.yml up -d

# Выгрузить на прод из гита
git pull origin main

# Собрать CMS отдельно
docker compose -f docker-compose.prod.yml build --no-cache cms

# Затем Web отдельно
docker compose -f docker-compose.prod.yml build --no-cache web

# Запустить
docker compose -f docker-compose.prod.yml up -d

## -----------------------
## Сборка проекта по отдельности в случае если падает по причине не хватки памяти
## -----------------------

# Остановить все контейнеры, чтобы освободить RAM
docker compose -f docker-compose.prod.yml down

# Очистить кеш Docker (он тоже жрёт память)
docker system prune -f
docker builder prune -f

# Проверить свободную память
free -h

# Собрать CMS отдельно через docker build (без bake)
docker build --no-cache -f cms/Dockerfile.prod -t novtecas-cms ./cms

# Потом Web
docker build --no-cache -f web/Dockerfile.prod -t novtecas-web --build-arg STRAPI_INTERNAL_URL=http://cms:1337 ./web

# Запустить
docker compose -f docker-compose.prod.yml up -d
# ------------------------