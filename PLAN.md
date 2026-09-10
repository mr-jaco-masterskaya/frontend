# План интеграции API и повышения качества frontend колл-центра

## Цель

Сделать типизированный, устойчивый к регистру и запускаемый в Docker Next.js frontend оператора, использующий существующий `/api/v1` Call Center API без изменений схемы базы данных.

## Граница текущей работы

Экран заказов и кухонный workflow находятся в работе у другого разработчика. До отдельного согласования не изменяем:

- `app/(nav)/orders/**`;
- `app/(nav)/kitchen/**`;
- `app/(nav)/order-new/**`;
- `entities/Order/**` и связанные order/kitchen widgets/features.

Общий transport и независимые shared-типы можно расширять только так, чтобы не менять поведение этих экранов.

## Приоритет работ

1. Сначала подключаем API к mock-срезам вне заказов и кухни через typed clients и mappers, сохраняя текущие UI-модели.
2. Для каждого подключённого среза сразу добавляем unit/component-тесты success/loading/empty/error и access-denied состояний.
3. После прохождения поведения удаляем заменённые runtime mocks и выполняем FSD-рефакторинг, не затрагивая чужой order/kitchen scope.
4. В конце проводим общую интеграционную проверку Docker и полный аудит контрактов.

## Текущая волна работ

Статус: первая non-order API wave завершена; order/kitchen/new-order scope заморожен.

| Срез | Владелец | Граница | Результат |
| --- | --- | --- | --- |
| Session/auth boundary | завершено | `entities/auth` + `shared/api` | DTO mapping, expiry handling, recovery tests |
| Cities, points, catalog, allergens | завершено на API-слое | `entities` reference-data only | typed clients, mappers, tests |
| Customer lookup/history, delivery map, client promos | завершено | customer/delivery/promo + existing widgets | runtime wiring, states, tests |
| Notifications API | завершено на API-слое | `entities/notifications` | typed client, mapper, read actions, tests; widget mounting pending |
| Catalog runtime screen | ожидает снятия frozen boundary | order-new scope | client готов, UI не менять |
| Orders, kitchen, new order | отдельный разработчик | frozen | не изменять |
| Review and UI smoke | review pass | read-only | findings without UI edits |

Каждый срез принимается только после проверки реального backend-контракта, тестов transport/mapping и отсутствия изменений в frozen scope.

## Подтверждённые ограничения API

- delivery API возвращает доступные улицы, точки и отдельные валидированные polygon coordinates; карта не должна рисовать выдуманные границы из legacy fixtures;
- проверка адреса остаётся источником истины для доступности адреса до появления отдельного geometry-контракта;
- `/promos` возвращает `name` промокода, но не отдельные `code` и customer-specific `isApplied`; frontend не подменяет эти поля догадками;
- catalog API подключён на entity-уровне, но runtime catalog находится внутри frozen `order-new` scope.

## Legacy-поведение клиента и заказа (jaco-center-new)

Проверен legacy Call Center в `jaco-center-new` и его endpoint-контракт
`test_app-1.php`. Это не просто визуальный макет: там зафиксирован полный
операторский сценарий, который нельзя потерять при переходе на `/api/v1`.

### Клиент

1. Телефон сохраняется в формате legacy и при потере фокуса запускает два
   запроса: сведения о регистрации/последнем заказе и сохранённые адреса.
2. UI явно показывает «Клиент зарегистрирован» либо «Клиент НЕ зарегистрирован».
3. Для незарегистрированного номера оператор открывает форму регистрации прямо
   из индикатора телефона. Минимально обязательное поле — имя; дополнительно
   передаются фамилия, дата рождения и пол.
4. После успешной регистрации состояние номера и промокода перечитывается, а
   оператор остаётся в текущем оформлении заказа.
5. Адреса клиента выбираются из сохранённых адресов; новый адрес проходит
   проверку зоны, затем сохраняется в профиле клиента.

### Заказ

1. До создания legacy собирает тип заказа (доставка/самовывоз), точку, корзину,
   промокод, комментарий, сдачу, предзаказ и адрес доставки.
2. Для доставки обязательны подтверждённая зона, этаж, подъезд и квартира;
   корпус не является отдельной обязательной сущностью legacy.
3. Backend получает итоговую корзину и адрес, а не доверенный frontend total;
   после успешного создания UI показывает номер, точку, время ожидания или
   предзаказ и очищает текущий draft.
4. Оплата в legacy передаётся как cash; новый API должен сохранять серверную
   проверку cart/order и идемпотентность, не перенося legacy-расчёты в UI.

### Обязательные разрывы для нового frontend/API

- `GET /customers/lookup` покрывает только lookup и чтение; отдельного
  защищённого `POST /customers` для регистрации оператора сейчас нет.
- Новый `HeaderNewOrder` не показывает найденный/ненайденный статус и не
  открывает форму создания клиента, поэтому текущий UX слабее legacy.
- Нужно добавить customer-create контракт с нормализацией телефона,
  уникальностью, point/city access, audit и безопасной обработкой гонок до
  полноценного включения в order-new.
- Клиентский flow должен иметь явные состояния `found`, `not_found`, `creating`,
  `created`, `error`; отсутствие клиента не должно превращаться в позднюю
  ошибку подтверждения заказа.
- На API-границе требуется сопоставить legacy `number`, `user_id`, `addrDev`,
  `addrPic`, `timePred`, `payFull` с typed draft/confirm DTO, не сохраняя
  legacy POST-форму.

### План миграции поведения

1. Зафиксировать customer-create контракт и минимальный обязательный набор полей
   с владельцем Chef; до этого оставить создание клиента feature-flagged.
2. Добавить Storybook-сценарии lookup: зарегистрирован, нет регистрации,
   network/API error, создание клиента, duplicate phone и retry.
3. Подключить customer-create к order-new через отдельный workflow service;
   не менять `orders` и `kitchen` страницы другого разработчика.
4. Покрыть интеграционно последовательность `lookup → create (если нужно) →
   address → draft → validate → confirm`, включая повторную отправку и отказ
   по доступу.
5. После этого удалить page-local client mocks и считать legacy behavior
   воспроизведённым по контракту, а не по копированию `test_app-1.php`.

## Базовый аудит

Сделано на стабилизационном этапе:

- объединены дублирующиеся деревья `features/Order` и `features/order` в единый lowercase-путь;
- исправлены импорты, которые ломались на Linux;
- сохранён production standalone output Next;
- добавлены отдельный Docker dev-образ, hot reload и именованные volumes;
- публичные API/Maps env явно передаются через Compose и описаны в README;
- добавлен единый путь проверки для host и Docker;
- добавлены первые unit-тесты API transport.

Оставшиеся архитектурные разрывы:

- runtime API подключён для авторизации, справочников, clients, delivery map и promos;
- TanStack Query добавлен как optional server-state слой; новый order-creation catalog использует его, legacy screens не зависят от миграции;
- orders, kitchen и new-order используют page-local mock-данные в frozen scope; client history detail использует mock payload до появления order-detail контракта;
- API DTO и UI DTO смешаны в `entities/Order`, отсутствуют явные mapper-границы;
- состояние workflow распределено между page-компонентами и Zustand stores;
- order workflow остаётся без полного набора тестов до снятия frozen boundary;
- notifications client готов, но durable polling и mounting в layout требуют отдельного UI решения;
- для runtime-состояний нужны единые loading, empty, retry и authorization states;
- production public env нужно задавать во время сборки образа.

## Этапы реализации

### 1. Основа и гигиена репозитория

- добавить CI-проверку lowercase-путей и импортов на case-sensitive filesystem;
- отделить runtime-код от story fixtures и убрать импорты page-local mocks из entities/features;
- ввести общие типы envelopes, pagination и API errors;
- оставить построение URL и авторизацию в `shared/api`;
- покрыть `apiRequest`, error envelopes, unauthorized callback и query serialization.

### 2. Сессия и access boundary

- оставить login, logout, `/me`, refresh и expiry handling внутри auth entity;
- использовать единый `RequireAuth` boundary для защищённых маршрутов;
- определить DTO оператора один раз и маппить API response на границе;
- протестировать bootstrap без token, с valid token, expired token, network failure, refresh и logout.

### 3. Справочники

- добавить типизированные клиенты и hooks для cities и points;
- загружать разрешённые точки через API и убрать static cafe/city data из runtime-страниц;
- добавить catalog и item-detail clients, включая allergens и modifier links;
- определить loading, empty, stale и error states;
- протестировать фильтрацию доступа и response mapping через mocked HTTP.

### 4. Рабочее место клиента

- подключить phone lookup и customer profile;
- подключить список и CRUD адресов, а также delivery street validation;
- подключить customer order history и доступные promo history;
- сохранить point/customer authorization API и показывать 403/404 как понятные состояния;
- протестировать normalization, cache invalidation и object-level access failures.

### 5. Жизненный цикл заказа

- заменить mock order tables на `/orders` и `/orders/{id}` queries;
- маппить legacy numeric statuses в единую UI-модель статуса;
- подключить cart replacement, validation, draft creation, confirm и cancellation;
- использовать server totals и idempotency keys; не считать authoritative prices на frontend;
- не реализовывать operator status transitions, пока владелец Chef workflow явно не выставит этот API;
- протестировать draft → confirm/cancel state machine и duplicate submit.

Текущий order-new progress:

- customer lookup и защищённое создание клиента подключены;
- cart replacement, draft, server validation и idempotent confirmation подключены;
- подтверждённый `chef_order_id` теперь сохраняется в typed draft result и может
  использоваться UI вместо случайного номера.

Остаётся убрать presentation-only legacy values из order-new: стоимость доставки,
время ожидания, stop-state и дополнительные позиции должны приходить из API либо
явно отображаться как недоступные до server validation. Нельзя оставлять
случайный order number или считать локальный total подтверждённым.

### 6. Доставка, промокоды и отображение оплаты

- подключить delivery zones, street search, address validation и preorder slots;
- подключить promo list/check/evaluate и показывать server-provided fixed prices/discounts;
- отображать YooKassa/refund status из API; bank-side refund logic на frontend не реализовывать;
- протестировать invalid addresses, unavailable slots, exhausted/reused promos и stale cart prices.

### 7. Kitchen, notifications и reports

- заменить kitchen mocks на `/kitchen/orders` и detail queries;
- добавить durable notification polling с bounded backoff и read/read-all actions;
- подключить reports с явными date/point filters;
- протестировать остановку polling, потерю авторизации и empty results.

### 8. Quality gates и выпуск

- unit-тесты API clients, mappers, stores и workflow reducers;
- component-тесты loading/error/empty/success states;
- Storybook-тесты reusable UI states и accessibility;
- Docker build и runtime smoke test против локального API;
- CI: TypeScript, build, unit/component tests, case-sensitive import audit и Docker image build;
- документация local API, production API, CORS и frontend-only secrets.

## Definition of done

- `docker compose -f docker-compose.dev.yml up --build` запускает FE с hot reload;
- `docker compose up --build -d` поднимает production standalone image;
- каждый runtime-экран использует typed API client или явно отмечен как pending в этом плане;
- duplicate case-variant paths отсутствуют;
- тесты покрывают transport, auth recovery, DTO mapping и каждый пользовательский workflow;
- frontend не содержит credentials для Chef, MariaDB или Redis.
