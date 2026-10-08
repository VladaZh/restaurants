# Приложение для бронирования столиков в сети ресторанов
В приложении реализована только часть, необходимая для создания заявок пользователями.

## Описание
На главном экране необходимо выбрать один из двух ресторанов, в котором будет осуществляться бронирование.
На следующей странице отображается информация о ресторане и форма бронирования столика.
Поля формы валидируются, проверяется корректность ввода номера телефона, email.
Время можно выбирать только будущее, кратное 15 минутам.
Столик можно забронировать каждый день с 9:00 до 22:00.

## Основные сущности доменной области

Сущности описывают ключевые объекты реального мира, с которыми оперирует бизнес, и правила их взаимодействия.
1. Бронирование (Reservation)

Центральная сущность системы, фиксирующая факт предстоящего визита.
Атрибуты: Дата и время визита, количество гостей. \
Бизнес-правила: \
Бронирование не может быть создано на прошедшую дату и время. \
Время бронирования должно строго находиться в рамках рабочего дня заведения (с 09:00 до 22:00). \
Бронирование не может быть создано, если на выбранное время нет свободных столиков подходящей
вместимости (возникает конфликт доступности). 

2. Гость (Guest)

Физическое лицо, которое инициирует бронирование. \
Атрибуты: Имя, номер телефона, адрес электронной почты. \
Бизнес-правила: \
Контактные данные (телефон и email) обязательны для заполнения.
Имя должно быть корректным (проходит валидацию на минимальную/максимальную длину).

3. Столик (Table)

Физический объект в ресторане, предоставляемый в пользование гостям.\
Атрибуты: Вместимость (максимальное количество посадочных мест). \
Бизнес-правила: \
Количество гостей в бронировании не может превышать максимальную вместимость доступных столиков. \
Один и тот же столик не может быть забронирован двумя разными гостями на одно и то же время. 

4. Блюдо

Объект, представляющий кулинарную продукцию ресторана для привлечения гостей.\
Атрибуты: Название блюда, фотография. \
Бизнес-правила: \
На главной странице отображается подборка фирменных блюд
(случайная выборка из 6 позиций) для формирования интереса к заведению.

5. Ресторан 

Конкретное заведение сети, в котором происходит бронирование. \
Бизнес-правила: \
Каждый филиал ограничивает доступные слоты времени для бронирования. \
Бронирования между ресторанами не пересекаются 
(столик №1 ресторана Roma не влияет на столик №1 ресторана Firenze).

## Запуск проекта с помощью docker-compose
1. Создание файлов:
   - .env по примеру .env.example
2. Запуск приложения с помощью Docker Compose
```Bash
docker compose up -d -- build
```
3. Приложение доступно по адресу:
```http://localhost```


## Запуск проекта с помощью minikube
1. Создание файлов:
   - .env по примеру .env.example
   - k8s/db-secrets.yml по примеру db-secrets-example.yml
2. Запуск minikube
```Bash
minikube start --driver=docker --container-runtime=docker
```
3. Собрать Docker-образы внутри Minikube 
```Bash
eval $(minikube docker-env)

docker build -t sre-backend:latest ./backend
docker build -t sre-frontend:latest ./frontend
```
4. Создание пространства имен
```Bash
kubectl apply -f k8s/namespace-restaurants.yml
```
5. Запуск приложения
```Bash
kubectl apply -f k8s/ -n restaurants
```
6. Вывод всех запущенных Pod'ов
```Bash 
kubectl get pods -n restaurants
```
7. Открыть приложение автоматически
```Bash 
minikube service frontend -n restaurants
```
8. Получить URL приложения
```Bash
minikube service frontend -n restaurants --url
```
9. Масштабирование сервисов
- Backend:
```Bash
kubectl scale deployment backend-deployment --replicas=4 -n restaurants
```
- Frontend:
```Bash
kubectl scale deployment frontend-deployment --replicas=4 -n restaurants
```
10. Остановить приложение
```Bash
minikube stop
```
11. Удалить кластер
```Bash
minikube delete
```


## Структура проекта
```
restaurants /
├── backend /
│   ├── alembic /                   # миграции БД
│   │   ├── versions /
│   │   │   └── 295c2a61604f_initial_migration.py 
│   │   ├── env.py 
│   │   ├── README 
│   │   └── script.py.mako 
│   ├── api /
│   │   ├── __init__.py 
│   │   ├── models.py               # модели данных для api
│   │   ├── routers.py              # endpoints
│   │   └── rules.py                # бизнес-логика
│   ├── db /
│   │   ├── __init__.py 
│   │   ├── db_models.py            # модели данных для БД
│   │   ├── exceptions.py           # кастомные ошибки
│   │   ├── reservations_repo.py    # CRUD
│   │   └── session.py              # БД-сессия
│   ├── alembic.ini 
│   ├── config.py 
│   ├── Dockerfile 
│   ├── entrypoint.sh               # команда запуска приложения
│   ├── logger.py 
│   ├── main.py 
│   ├── poetry.lock 
│   └── pyproject.toml 
├── frontend /
│   ├── src /
│   │   ├── scripts /
│   │   │   ├── api.js 
│   │   │   ├── city_dish.js 
│   │   │   ├── index.js 
│   │   │   ├── reservation.js 
│   │   │   ├── reservation.test.js 
│   │   │   ├── script.js 
│   │   │   ├── script.test.js 
│   │   │   ├── validate.js 
│   │   │   └── validate.test.js 
│   │   ├── styles /
│   │   │   ├── base.css 
│   │   │   ├── components.css 
│   │   │   ├── layout.css 
│   │   │   ├── responsive.css 
│   │   │   └── variables.css 
│   │   ├── style.css 
│   │   ├── counter.js
│   │   └── main.js
│   ├── .gitignore
│   ├── firenze.html 
│   ├── index.html
│   ├── nginx.conf
│   ├── Dockerfile
│   ├── package.json 
│   ├── package-lock.json 
│   ├── roma.html 
│   │── vite.config.js 
│   └── vitest.config.js 
├── k8s /                           # манифесты
│   ├── backend-development.yml
│   ├── backend-migration-job.yml
│   ├── backend-service.yml
│   ├── db-secrets.yml              # файл должен быть создан по примеру из db-secrets-example.yml
│   ├── db-service.yml
│   ├── db-statefulset.yml
│   ├── frontend-deployment.yml
│   ├── frontend-service.yml
│   ├── namespace-restaurants.yml
├── .env 
├── .env.example
├── .gitignore 
├── 12factors.md # файл с описанием соответствия приложения 12 факторам
├── db-secrets-example.yml # пример файла k8s/db-secrets.yml
├── docker-compose.yml 
└── README.md 
```

Стек: FastAPI, HTML + JS + CSS, Alembic, Docker