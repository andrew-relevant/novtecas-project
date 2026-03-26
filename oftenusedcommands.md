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