Инструкции разворачивания django-проекта на VDS timeweb.cloud
Ubuntu 22.04, postgresql, gunicorn, nginx
(переход в рабочую папку cd /myappleshoptest.sytes.net):

Ubuntu(Необходимые команды):
SSH:
Чтобы заново подключиться по SSH к серверу, который был переустановлен, необходимо удалить файлы known_hosts.old
Добавили нового пользователя:
adduser roman

Добавили в группу sudo:
usermod -aG sudo roman

Переключиться на нового пользователя:
su - roman

Проверка на привилегии:
sudo ls -la /root

Обновления пакетов apt:
sudo apt update

Команда установит pip,файлы Python, дальше на их основе мы развернем Gunicorn, СУБД PostgreSQL и установим библиотеки,
какие понадобятся для работы с Django, а также веб-сервер Nginx:
sudo apt install python3-pip python3-dev libpq-dev postgresql postgresql-contrib nginx curl

POSTGRESQL:
Зашли в postgres:
sudo -u postgres psql

Создали БД:
CREATE DATABASE db1;

Создали нового пользователя:
CREATE USER django_shop WITH PASSWORD 'live5913';

Чтобы упростить дальнейшую работу, сразу зададим ряд настроек. Например, изменим кодировку на UTF-8, зададим схему
изоляции транзакций «read committed», установим часовой пояс:
ALTER ROLE django_shop SET client_encoding TO 'utf8';
ALTER ROLE django_shop SET default_transaction_isolation TO 'read committed';
ALTER ROLE django_shop SET timezone TO 'UTC';

Теперь для нового пользователя надо открыть доступ на администрирование БД:
GRANT ALL PRIVILEGES ON DATABASE db1 TO django_shop;

Выход из postgres:
\q

Виртуальная среда разработки:
Обновляем pip:
sudo -H pip3 install --upgrade pip

Устанавливаем pip virtualenv:
sudo -H pip3 install virtualenv

После инсталляции сделаем новый каталог, где будут размещены проектные модули, и сразу зайдем туда:
mkdir ~/myappleshoptest.sytes.net
cd ~/myappleshoptest.sytes.net

И развернем и активируем виртуальную среду Python:
virtualenv venv
source venv/bin/activate

Установим плагин необходимый для работы postgresql;
pip install psycopg2-binary

Если не подключаться по SFTP, то можно скопировать репозиторий с GitHub(но для удобства работы, лучше видеть структуру
проекта):
Копирование репозитория:
git remote add origin https://github.com/RomanKostikov/My_graduate_work.git

Из какой ветки копировать:
git pull origin main

ИЛИ можно воспользоваться FileZilla(SFTP) и передавать необходимые файлы;

Установка сохраненных зависимостей:
pip install -r requirements.txt

Складывать файлы будем в ранее указанный каталог. В нем система сделает отдельную папку для размещения фактического кода,
скрипта управления:
django-admin startproject mysite ~/myappleshoptest.sytes.net

Команда удалить папку;
rm -rf shop

Переименовать файл в Ubuntu(Но можно и подключить новую БД в файле settings.py, старую закомментировать):
mv settings_prod1.py settings_prod.py

Проводим миграции;
python manage.py migrate

Команда перехода в БД(Если необходимо):
python manage.py dbshell

Посмотреть список всех таблиц с описанием:
\dt+

ПЕРЕНОС ДАННЫХ(в json файл):
        Для новой БД пометить(где подключали БД к django):
        'OPTIONS': {
            'charset': 'utf8mb4'  # This is the relevant line
        }

Необходимая команда для терминала в pyCharm в django с сохранением нужной кодировки(чтобы сохранить кириллицу).
Предварительно нужно изменить файл initial_data.json на кодировку 1251(и чтобы она была по умолчанию, затем после
dump перекодировать файл в utf-8 и затем отправить на сервер):
python -Xutf8 manage.py dumpdata --natural-primary --exclude=contenttypes --exclude=auth.Permission --
exclude=admin.logentry --indent 4 -o initial_data.json


Подгружаем fixture для БД(выполняется на сервере по SSH):
python manage.py loaddata initial_data.json
python manage.py collectstatic - собираем все статические файлы в созданном проекте;
Работа с БД(postegresql)(Если потребуется):
Создание и удаление базы данных (соответственно):
createdb и dropdb

Создание и удаление пользователя (соответственно)(предварительно вернуться в главное меню):
createuser и dropuser

Работа с таблицами:
Удаление всех таблиц:
GRANT ALL ON SCHEMA public TO public;

Удаление определенной таблицы:
psql => DROP table django_admin_log;

Создание таблицы в Postgresql:
CREATE table django_admin_log (pk INT);

Запуск проекта на сервере без gunicorn и nginx:

В файле settings.py необходимо указать HOST на котором будет открываться проект или можно указать *, тогда все хосты
будут проходить:

ALLOWED_HOSTS = [
    '85.193.91.73',
    '127.0.0.1',
    'localhost',
    '0.0.0.0',
]

Команда запуска:
python manage.py runserver 85.193.91.73:8001

Перейти в браузер и ввести ссылку:
85.193.91.73:8001


GUNICORN(timeweb):
Устанавливаем программу:
pip install gunicorn

Сокет Gunicorn появляется при старте systemd, после чего прослушивает подключения.
Но сначала создадим файл с привилегиями sudo:
sudo nano /etc/systemd/system/gunicorn.socket

В нем мы сделаем новый раздел [Unit], куда внесем описательную часть сокета, раздел [Socket],
при помощи которого определим его размещение и [Install] для обеспечения установки в указанное время:
[Unit]
Description=gunicorn socket
[Socket]
ListenStream=/run/gunicorn.sock
[Install]
WantedBy=sockets.target

При закрытии файла обязательно согласитесь на сохранение изменений. Перейдем к служебному файлу systemd.
Его также надо создать и открыть на редактирование:

sudo nano /etc/systemd/system/gunicorn.service

Начнем с раздела [Unit], где укажем метаданные и зависимости – описание службы, предписание инициализировать ее
только после подтверждения связи с хостом.

[Unit]
Description=gunicorn daemon
Requires=gunicorn.socket
After=network.target

Перейдем к разделу [Service]. В нем зададим пользовательскую учетку и группу, под которой планируем запускать процесс.
В этом материале укажем в качестве владельца пользователя, потому что он таковым формально и является.
Зададим группу www-data, карту рабочей папки и команду, запускающую службы. В качестве примера используем 3 процесса:
pwd - команда в линукс запросить полный путь;

[Service]
User=roman
Group=www-data
WorkingDirectory=/home/roman/myappleshoptest.sytes.net
ExecStart=/home/roman/myappleshoptest.sytes.net/venv/bin/gunicorn \
          --access-logfile - \
          --workers 3 \
          --bind unix:/run/gunicorn.sock \
          mysite.wsgi:application

В «хвосте» внесем раздел [Install]. В нем будем хранить информацию, куда systemd привязывать эти службы, если они будут
активированы при загрузке.

[Install]
WantedBy=multi-user.target

Все, можно закрывать файл с сохраненными изменениями. Попробуем стартовать сокет Gunicorn:
sudo systemctl start gunicorn.socket
sudo systemctl enable gunicorn.socket

Статус процесса и сам факт того, получилось ли у него стартовать, можно проверить командой:
sudo systemctl status gunicorn.socket

Важно учитывать, что при запуске gunicorn.socket служба gunicorn.service неактивна. Проверить это можно командой:
sudo systemctl status gunicorn

Продиагностируем активацию сокета установлением коннекта через curl:
curl --unix-socket /run/gunicorn.sock localhost

Если данные отображаются в HTML-формате, все отлично – Gunicorn стартовал и готов обслуживать программы на Django.
Проверим службу командой:
sudo systemctl status gunicorn

Если при выводе отражаются ошибки, искать первопричину надо начинать с журнала:
sudo journalctl -u gunicorn

Также желательно вручную сверить содержимое файла gunicorn.service. Можно перезапустить демона для повторного
считывания данных по Gunicorn:

sudo systemctl daemon-reload
sudo systemctl restart gunicorn

До устранения любых ошибок продолжать дальше нельзя!

Настроим Nginx как прокси для Gunicorn:

Сначала сделаем и откроем модуль в папке Nginx sites-available:
sudo nano /etc/nginx/sites-available/mysite

Запустим редактирование файла и внесем инструкцию прослушивать порт 80, отвечать на домен или IP-адрес нашего хоста:

server {
    listen 80;
    server_name 85.193.91.73;
}

Следующим шагом зададим инструкцию игнорировать любые проблемы, связанные с поиском favicon. И укажем, где расположены
статичные ресурсы, перенесенные нами ранее в каталог по пути ~/myprojectdir/static
(можно не указывать nginx отрывает все static файлы проекта).

server {
    listen 80;
    server_name server_domain_or_IP;
    location = /favicon.ico { access_log off; log_not_found off; }
    location /static/ {
        root /home/roman/myappleshoptest.sytes.net/static/static_prod;
    }

    location /media/ {
        root /home/roman/myappleshoptest.sytes.net/static/media;
    }
}

Последним шагом создадим блок location / {}, который задаст соответствие любым запросам. В него внесем файл proxy_params,
поставляемый в типовом наборе Nginx. Тогда поступающие данные будут перекидываться прямо в сокет.

server {
    listen 80;
    server_name 85.193.91.73;

    location = /favicon.ico { access_log off; log_not_found off; }
#    location /static/ {
#        root /home/roman;
 #   }

#   location /media/ {
#        root /home/roman/myappleshoptest.sytes.net/;
#    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/run/gunicorn.sock;
    }
}


NGINX(альтернативная конфигурация файла):
server {
  listen 80;
  server_name 85.193.91.73;
  location = /favicon.ico { access_log off; log_not_found off; }

  location /static/ {
    root /home/django_shop2/;
  }
  location /media/ {
    root /home/django_shop2/;
  }
  location /admin/static/ {
    root /home/django_shop2/;
  }
  location / {
    include proxy_params;
    proxy_pass http://unix:/home/django_shop2/server.sock;
  }
}

Закроем файл с сохранением изменений. И активируем его путем привязки к папке sites-enabled:
sudo ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled

Продиагностируем Nginx на предмет ошибок в синтаксисе(работает и рестарт(показывает ошибки)):
sudo nginx –t

Перезапустите Nginx:
sudo systemctl restart nginx

Остановить Nginx:
sudo systemctl stop nginx

Запустить Nginx:
sudo systemctl start nginx

Подключение своего domena к IP сервера:
Зарегистрировал бесплатный domen на:
https://my.noip.com/
myappleshoptest.sytes.net

Добавляю его в файл конфигурации nginx:
server_name myappleshoptest.sytes.net; # вместо IP

Переходим в браузер по ссылке:
myappleshoptest.sytes.net

Проводим TLS сертификацию нашего домена и получаем защищенный протокол связи https:
https://letsencrypt.org/ru/

SSH на сервер:
Подключитесь по SSH к серверу, на котором работает ваш HTTP-сайт от имени пользователя с привилегиями sudo.

Установить Snapd:
Вам необходимо установить snapd и обязательно следовать всем инструкциям, чтобы включить поддержку классической Snap.
Следуйте этим инструкциям на сайте Snapcraft, чтобы установить Snapd .
sudo apt update
sudo apt install snapd

Удалите certbot-auto и все пакеты ОС Certbot.
Если у вас есть какие-либо пакеты Certbot, установленные с помощью диспетчера пакетов ОС, например apt, dnfили yum, вам
следует удалить их перед установкой оснастки Certbot, чтобы гарантировать, что при запуске команды certbot используется
оснастка, а не установка из менеджера пакетов вашей ОС. Точная команда для этого зависит от вашей ОС, но
распространенными примерами являются sudo apt-get remove certbot, sudo dnf remove certbot или sudo yum remove certbot.
sudo apt-get remove certbot

Установить сертификатбот:
Запустите эту команду в командной строке на компьютере, чтобы установить Certbot.
sudo snap install --classic certbot

Подготовьте команду Certbot:
Выполните следующую инструкцию в командной строке на компьютере, чтобы убедиться, что команду certbot можно выполнить.
sudo ln -s /snap/bin/certbot /usr/bin/certbot

Выберите, как вы хотите запустить Certbot
Либо получите и установите сертификаты...
Запустите эту команду, чтобы получить сертификат, и Certbot автоматически отредактирует вашу конфигурацию nginx для его
обслуживания, включив доступ HTTPS за один шаг:
sudo certbot --nginx # выбрал этот вариант

Или просто получите сертификат:
Если вы чувствуете себя более консервативно и хотите внести изменения в конфигурацию nginx вручную, запустите эту
команду:
sudo certbot certonly --nginx

Тестирование автоматического продления:
Пакеты Certbot в вашей системе поставляются с заданием cron или таймером systemd, который автоматически обновит ваши
сертификаты до истечения срока их действия. Вам не нужно будет снова запускать Certbot, если вы не измените свою
конфигурацию.
Вы можете протестировать автоматическое продление ваших сертификатов, выполнив следующую команду:
sudo certbot renew --dry-run

Команда для обновления certbot установлена в одном из следующих мест:
/etc/crontab/
/etc/cron.*/*
systemctl list-timers

Подтвердите, что Certbot сработал:
Чтобы убедиться, что ваш сайт настроен правильно, зайдите https://yourwebsite.com/в браузер и найдите значок замка в
строке URL.

Установка pgadmin4 для удобной работы с БД postgres

Скачиваем и устанавливаем с надежного источника pgadmin4:
https://www.pgadmin.org/

Посмотреть открытые порты ubuntu:
sudo apt install net-tools
sudo netstat -ntlp

Подключение к серверу PostgreSQL через SSH-туннель:
Вот шаги для подключения к серверу PostgreSQL через SSH-туннель. Для этого вам необходимо иметь SSH-соединение от
клиента к серверу. По умолчанию в большинстве систем Linux уже установлен SSH-клиент. Мы будем использовать это для
туннелирования SSH. Вот команда для создания SSH-соединения с локального компьютера на удаленный сервер PostgreSQL.
ssh -N -L 1111:127.0.0.1:5432 [ПОЛЬЗОВАТЕЛЬ]@[SERVER_IP]
Н: ssh -L 5001:localhost:5432 roman@85.193.91.73

В приведенной выше команде:
-N – не выполнять удаленную команду -L 1111:127.0.0.1:5432 – Переадресация локального порта. Таким образом, все
соединения, отправленные на локальный порт 1111, перенаправляются на удаленный порт 5432 через соединение SSH.
5432 — это порт PostgreSQL по умолчанию на удаленном сервере. Обратите внимание: вам необходимо использовать другой
номер локального порта (например, 1111) в строке переадресации портов, поскольку ваш локальный сервер PostgreSQL может
уже работать на порту 5432 и он будет недоступен. [USER]@[SERVER_IP] – IP-адрес удаленного пользователя и сервера.
По умолчанию приведенная выше команда запускает туннель SSH на переднем плане. Если вы хотите запустить туннель в
фоновом режиме, используйте опцию -f:

По умолчанию SSH работает на порту 22. Если ваш SSH-сервер работает на другом порту, используйте -p [НОМЕР ПОРТА],
чтобы указать фактический номер порта SSH.

Резервные копии сервера
Не забудьте сделать снапшот настроенного сервера для быстрого его восстановления!
Раздел Бэкапы => сделать снапшот
_______________________________________________________________________________________________________________________
Используемые ресурсы:
1. https://timeweb.cloud/tutorials/django/kak-ustanovit-django-nginx-i-gunicorn-na-virtualnyj-server - ссылка на
основные инструкции по настройке работы: postgresql, gunicorn, nginx;
2. https://michal.karzynski.pl/blog/2013/06/09/django-nginx-gunicorn-virtualenv-supervisor/ - ссылка на дополнительные
инструкции по настройке работы: postgresql, gunicorn, nginx;
3. https://www.youtube.com/watch?v=zWziE0A8eLg&list=PLsoiJYadj99l6t9ZZjdJy7eOs2Pdd6rwK&index=20 - ссылка на
видеоинструкции по настройке работы: postgresql, gunicorn, nginx;
4. https://fedingo.com/how-to-connect-to-postgresql-server-via-ssh-tunnel/ - ссылка на инструкцию подключение по ssh к
postgresql;
5. https://www.youtube.com/watch?v=SaM1_nNDi3s&t=10s - ссылка на видеоинструкции подключение по ssh к
postgresql(pgadmin4);
6. https/stackoverflow.com - вспомогательный сайт для решения возникающих трудностей (форум программистов).
