Инструкции разворачивания django-проекта на хосте beget.com
DJANGO 4.2.1(понизил версию до 4.1.11 т.к на хосте используют MySQL 5.7, а не 8+)
Предварительно настраивали локальный python, согласно инструкциям на хосте(+видео на Youtube)
 + устанавливаем необходимую версию Django:
Не забыть открыть полный доступ к папке .locale, через файловый менеджер хоста
python3.9 -m venv django_shop2_venv - создать виртуальную среду разработки в папке romank53.beget.tech;
source django_shop2_venv/bin/activate - активировать виртуальную среду разработки;
deactivate - команда деактивации среды разработки;
django-admin startproject mysite - создание нового проекта;

Создать файл passenger_wsgi.py со следующим содержимым:
pwd - команда в линукс запросить полный путь;
/home/r/romank53/romank53.beget.tech/My_graduate_work
/home/r/romank53/romank53.beget.tech/django_shop2_venv/lib/python3.9/site-packages

Создать файл .htaccess со следующим содержимым:
PassengerEnabled On
PassengerPython /home/r/romank53/romank53.beget.tech/django_shop2_venv/bin/python3.9
Отправить эти файлы на сервер в папку /romank53.beget.tech;

ПЕРЕНОС БД НА СЕРВЕР:
Перекинуть на сервер файл requirements.txt в папку /romank53.beget.tech;
pip install -r requirements.txt - установка сохраненных зависимостей на виртуальное окружение(ВО);
pip install django mysqlclient  - установка MYSQL;
Создали и установили связь с новой БД(панель управления beget и django settings.py(SSH_PuTTY_beget.txt - записи по БД));
python manage.py migrate - проводим миграции;
pip uninstall Django - удаляем текущую версию django;
pip install Django==4.1.11 - устанавливаем версию, которая поддерживает MySQL 5.7;
python manage.py collectstatic - собираем все статические файлы;

ПЕРЕНОС ДАННЫХ С ЛОКАЛЬНОЙ БД в json файл:
Для новой БД пометить дополнительную кодировку(мб и необязательно)(где подключали БД к django(settings.py)):
        'OPTIONS': {
            'charset': 'utf8mb4'  # This is the relevant line
        }
python -Xutf8 manage.py dumpdata --natural-primary --exclude=contenttypes --exclude=auth.Permission --
exclude=admin.logentry --indent 4 -o initial_data.json
- необходимая команда для терминала в pyCharm в django с сохранением нужной кодировки, предварительно нужно изменить
файл initial_data.json на кодировку 1251 (и чтобы она была по умолчанию, затем после
dump перекодировать файл в utf-8 и затем отправить на сервер)

python manage.py loaddata initial_data.json - подгружаем fixture для БД(выполняется на сервере по SSH);

в файл mysite/urls.py добавить строчки, чтобы static файлы в режиме debug false читались из корневой папки:
from django.urls import path, include, re_path
from django.views.static import serve as mediaserve

if settings.DEBUG:
    import debug_toolbar

    urlpatterns = [
                      path('__debug__/', include(debug_toolbar.urls)),
                  ] + urlpatterns
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    urlpatterns += [
        re_path(f'^{settings.MEDIA_URL.lstrip("/")}(?P<path>.*)$',
                mediaserve, {'document_root': settings.MEDIA_ROOT}),
        re_path(f'^{settings.STATIC_URL.lstrip("/")}(?P<path>.*)$',
                mediaserve, {'document_root': settings.STATIC_ROOT}),
    ]

Все, проект развернут на хосте beget.com с подключенной БД MySQL.

DOMEN + SSL:

1. Регистрация домена по выбору производится за дополнительную плату прямо на хосте.
2. Перенос ранее зарегистрированного бесплатного домена на другом источнике, тоже платно.
https://beget.com/ru/kb/how-to/domains
3. После регистрации домена на хосте и привязке его к сайту, можно произвести бесплатную сертификацию SSL(На хосте)
https://beget.com/ru/kb/how-to/sites/podklyuchenie-ssl-k-sajtu

Используемые ресурсы:
1. https://beget.com/ru/kb/how-to/web-apps/python#ustanovka-i-nastroyka-django - ссылка на основные инструкции по
настройке работы django-проекта на хосте;
2. https://www.youtube.com/watch?v=reURUKqkyYw&t=2s - видеоинструкция по настройке работы django-проекта на хосте;
3. https/stackoverflow.com - дополнительный источник полезной информации (форум программистов).