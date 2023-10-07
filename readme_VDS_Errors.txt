Неполные инструкции
Попытки настройки pgadmin4/phppgadmin и разворачивание проекта через docker

Для начала обновите индекс пакетов вашего сервера, если вы не делали этого в последнее время:
sudo apt update

Затем установите следующие зависимости. К ним относятся libgmp3-dev библиотека арифметических вычислений с высокой
точностью; libpq-dev, который включает файлы заголовков и статическую библиотеку, которая помогает взаимодействовать с
серверной частью PostgreSQL:
sudo apt install libgmp3-dev libpq-dev

После этого создайте несколько каталогов, в которых pgAdmin будет хранить данные своих сеансов, данные хранилища и
журналы:
sudo mkdir -p /var/lib/pgadmin4/sessions
sudo mkdir /var/lib/pgadmin4/storage
mkdir /var/lib/pgadmin4/data
sudo mkdir /var/log/pgadmin4

Альтернатива(прямо в папке myappleshoptest.sytes.net):
mkdir /pgadmin4/data
mkdir -p /pgadmin4/sessions
mkdir /pgadmin4/storage
mkdir /pgadmin4/log
(/home/roman/myappleshoptest.sytes.net/pgadmin4)
pwd - команда в линукс запросить полный путь;

Затем измените владельца этих каталогов на пользователя и группу без полномочий root. Это необходимо, поскольку в
настоящее время они принадлежат вашему пользователю root, но мы установим pgAdmin из виртуальной среды,
принадлежащей вашему пользователю без полномочий root, и процесс установки включает создание некоторых файлов в этих
каталогах. Однако после установки мы сменим владельца на пользователя и группу www-data, чтобы их можно было передавать
в Интернет(Если вы хотите поменять сразу владельца и группу каталога или файла запишите их через двоеточие):
sudo chown -R roman:www-data /var/lib/pgadmin4
sudo chown -R roman:www-data /var/log/pgadmin4

Используйте pip для установки pgadmin4:
python -m pip install pgadmin4==6.10

Хотя pgAdmin установлен на вашем сервере, вам необходимо выполнить еще несколько шагов, чтобы убедиться, что у него есть
разрешения и настройки, необходимые для правильной работы веб-интерфейса.
Основной файл конфигурации pgAdmin config.py считывается перед любым другим файлом конфигурации. Его содержимое можно
использовать в качестве ориентира для дальнейших настроек конфигурации, которые можно указать в других файлах
конфигурации pgAdmin, но во избежание непредвиденных ошибок не следует редактировать сам файл config.py.
Мы добавим некоторые изменения конфигурации в новый файл с именем config_local.py, который будет читаться после основного.
Создайте этот файл сейчас, используя предпочитаемый вами текстовый редактор. Здесь мы будем использовать nano:
nano venv/lib/python3.10/site-packages/pgadmin4/config_local.py

В редакторе добавьте следующий контент:
DATA_DIR = '/var/lib/pgadmin4/data'
LOG_FILE = '/var/log/pgadmin4/pgadmin4.log'
SQLITE_PATH = '/var/lib/pgadmin4/pgadmin4.db'
SESSION_DB_PATH = '/var/lib/pgadmin4/sessions'
STORAGE_DIR = '/var/lib/pgadmin4/storage'
SERVER_MODE = True
Обратите внимание, что каждый из этих путей к файлам указывает на каталоги, созданные вами на шаге 1.
Вот что делают эти пять директив:
LOG_FILE: определяет файл, в котором будут храниться журналы pgAdmin.
SQLITE_PATH: pgAdmin хранит данные, связанные с пользователем, в базе данных SQLite, и эта директива указывает
программному обеспечению pgAdmin на эту базу данных конфигурации. Поскольку этот файл находится в постоянном каталоге
/var/lib/pgadmin4/, ваши пользовательские данные не будут потеряны после обновления.
SESSION_DB_PATH: указывает, какой каталог будет использоваться для хранения данных сеанса.
STORAGE_DIR: определяет, где pgAdmin будет хранить другие данные, например резервные копии и сертификаты безопасности.
SERVER_MODE: установка этой директивы True указывает pgAdmin работать в режиме сервера, а не в режиме рабочего стола.

Имея эти конфигурации, запустите сценарий установки pgAdmin, чтобы установить свои учетные данные для входа:
python venv/lib/python3.10/site-packages/pgadmin4/setup.py

После запуска этой команды вы увидите приглашение с запросом вашего адреса электронной почты и пароля. Они будут
служить вашими учетными данными для входа в систему при дальнейшем доступе к pgAdmin, поэтому обязательно запомните
или обратите внимание на то, что вы вводите здесь:

При этом pgAdmin полностью настроен. Однако программа еще не обслуживается с вашего сервера, поэтому она остается
недоступной. Чтобы решить эту проблему, мы настроим Gunicorn и Nginx для обслуживания pgAdmin, чтобы вы могли получить
доступ к его пользовательскому интерфейсу через веб-браузер.
Create / run pgadmin4.service for systemd

sudo nano /etc/systemd/system/pgadmin4.service

[Unit]
Description=pgAdmin4 service
After=network.target

[Service]
User=roman
Group=www-data
#WorkingDirectory=/home/roman/myappleshoptest.sytes.net
Environment="PATH=/home/roman/myappleshoptest.sytes.net/venv/bin"
ExecStart=/home/roman/myappleshoptest.sytes.net/venv/bin/gunicorn --bind unix:/tmp/pgadmin4.sock --workers=1 --threads=25 --chdir /home/roman/myappleshoptest.sytes.net/venv/lib/python3.10/site-packages/pgadmin4 pgAdmin4:app

[Install]
WantedBy=multi-user.target

After that, start service:

service pgadmin4 start

NGINX. Add to configuration

location /pgadmin4 {
    include proxy_params;
    proxy_pass http://unix:/tmp/pgadmin4.sock;
    proxy_set_header X-Script-Name /pgadmin4;
}

sudo systemctl restart nginx

Вы будете использовать Gunicorn для обслуживания pgAdmin в качестве веб-приложения. Однако в качестве сервера
приложений Gunicorn будет доступен только локально и недоступен через Интернет. Чтобы сделать его доступным удаленно,
вам нужно будет использовать Nginx в качестве обратного прокси.
server {
    listen 80;
    listen [::]:80;

    server_name your_domain www.your_domain;

    location / {
        proxy_pass http://unix:/tmp/pgadmin4.sock;
        include proxy_params;
    }
}

gunicorn --bind unix:/tmp/pgadmin4.sock --workers=1 --threads=25 --chdir ~/environments/my_env/lib/python3.10/site-packages/pgadmin4 pgAdmin4:app

Как установить и управлять Supervisor(если необходим):
Начните с обновления исходных кодов пакетов и установки Supervisor:
sudo apt update && sudo apt install supervisor

Служба супервизора запускается автоматически после установки. Вы можете проверить его статус:
sudo systemctl status supervisor

Помимо запуска программ, вам потребуется остановить, перезапустить или просмотреть их статус. Программа supervisctl,
которую мы использовали на шаге 2 , также имеет интерактивный режим, который мы можем использовать для управления
нашими программами.
Чтобы войти в интерактивный режим, запустите Supervisorctl без аргументов:
sudo supervisorctl

supervisorctl сначала распечатает состояние и время работы всех настроенных программ, а затем командную строку.
Ввод help покажет все доступные команды:
supervisor> help

Вы можете start или stop программу со связанными командами, за которыми следует имя программы:
supervisor> stop idle

Используя эту tail команду, вы можете просмотреть самые последние записи в журналах stdout и stderr вашей программы:
supervisor> tail idle

С помощью status вы можете еще раз просмотреть текущее состояние выполнения каждой программы после внесения каких-либо
изменений:
supervisor> status

Утилита PhpPgAdmin доступна в репозитории по дефолту в Ubuntu 22.04. Устанавливаем утилиту PhpPgAdmin под пользователем

Ubuntu:
sudo apt-get install phppgadmin

Когда утилита установится, переходим в файл конфигурации phppgadmin.conf в директории /etc/apache2/conf-available и
закомментируем строку Require local. Пропишем строку Allow From all. Такие изменения в файле конфигурации позволят
подключаться к серверу как с локальной машины, так и с других устройств.
cd /etc/apache2/conf-available
sudo nano phppgadmin.conf
________________________________________________________
Apache:
Установим веб-сервер командой:
apt install apache2

Запрещаем модуль mpm_event(устарел):
a2dismod mpm_event

Разрешаем модуль мультипроцессовой обработки mpm_prefork:
a2enmod mpm_prefork

Разрешаем модуль rewrite:
a2enmod rewrite

Переходим в папку /etc/apache2
cd ..

Меняем в файле ports.conf порт 80(т.к он занят nginx) 443 тоже закомментировать или заменить 447:
sudo nano ports.conf

Если вы просто измените порт или добавьте сюда дополнительные порты, вы, вероятно, также
необходимо изменить инструкцию VirtityHost в:
/etc/apache2/sites-enabled/000-default.conf

Переходим в папку в файл:
sudo nano /etc/apache2/sites-enabled/000-default.conf
??????

Запуск сервера Apache
sudo systemctl start apache2

Остановка сервера Apache
sudo systemctl stop apache2

Перезагрузим Apache:
sudo systemctl restart apache2

Проверяем работу Apache:
systemctl status apache2.service
Посмотреть работающие порты в Ubuntu:
sudo apt install net-tools
sudo netstat -ntlp

Веб-сервер установлен. Идем дальше.

PHP:
Устанавливаем интерпретатор php и модуль для связки apache и php:
sudo apt install php libapache2-mod-php

Будет установлена нативная версия PHP для используемой операционной системы. То есть, будет взята самая последняя версия,
доступная в репозитории. Посмотреть версию PHP после установки можно командой:
php -v

Теперь открываем настройку модуля dir:
sudo nano /etc/apache2/mods-available/dir.conf

И добавляем впереди индексных файлов index.php:
<IfModule dir_module>
    DirectoryIndex index.php index.html ...
</IfModule>

* если не указан конкретный скрипт, сначала веб-сервер пытается найти и запустить index.php, затем index.html и так
далее.

Разрешаем модуль для установленной версии PHP(какая необходима)(в моем примере 8.1):
a2enmod php8.1

Для применения настроек перезапустим апач:
systemctl restart apache2

Для проверки создадим файл:
sudo nano /var/www/html/index.php
<?php

phpinfo();

?>
На локальном компьютере откройте предпочитаемый вами веб-браузер и перейдите по IP-адресу вашего сервера:
http://your_domain (не работает)

Разворачивание проекта на сервере при помощи DOCKER and DOCKER-COMPOSE(на перспективу)(не работает):

  Users logged in:          0
  IPv4 address for docker0: 172.17.0.1
  IPv4 address for eth0:    85.193.91.73
  IPv6 address for eth0:    2a03:6f01:1:2::24ca

cp ./Dockerfile ./shop - копирование файла в нужную директорию;
docker-compose build - билд проекта (из папки 'shop');
docker-compose up - запустить контейнеры;
docker-compose down - остановить работающие контейнеры;

docker-compose.yml
version: '3.8'

services:
  web:
    # Берем Dockerfile из каталога app
    build: ./shop
    # Запускаем тестовый сервер
    command: python manage.py runserver 85.193.91.73:8000
    # куда будут помещены данные из каталога app
    volumes:
      - ./shop/:/usr/src/shop/
    # Открываем порт 8000 внутри и снаружи
    ports:
      - 8000:8000
    # Файл содержащий переменные для контейнера
#    env_file:
 #     - ./.venv.dev

Dockerfile
# pull official base image
FROM python:3.9.6-alpine

# set work directory
WORKDIR /usr/src/app

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# install dependencies
RUN pip install --upgrade pip
COPY ./requirements.txt .
RUN pip install -r requirements.txt

# copy project
COPY . .

ИЗУЧЕНИЕ ОШИБОК:
deserialization error - если возникла при закрузке fixture из dump файла БД json, значит ошибка связанна с оформлением
json файла(мб не закрыты скобки внутри файла);
_______________________________________________________________________________________________________________________
Используемые ресурсы:
1. https://www.digitalocean.com/community/tutorials/how-to-install-and-configure-pgadmin-4-in-server-mode-on-ubuntu-22-04#step-4-accessing-pgadmin -
полная инструкция по настройке pgadmin 4;
2. https://gist.github.com/rubinhozzz/9217e8b0dc834874a301cd0435e70691 - настройка сокета для pgadmin4;
3. https://vpsup.ru/stati/ustanovka-postgresql-na-ubuntu.html - настройка phppgadmin;
4. https://www.digitalocean.com/community/tutorials/how-to-install-and-configure-pgadmin-4-in-server-mode-on-ubuntu-22-04
- полная настройка phppgadmin;
5. https://django.fun/ru/articles/tutorials/dokerizaciya-django-s-pomoshyu-postgres-gunicorn-i-nginx/
6. https://fixmypc.ru/post/sozdanie-i-zapusk-konteinera-docker-s-django-postgressql-gunicorn-i-nginx/
7. https://devops.org.ru/dockercompose-summary
8. https://timeweb.com/ru/community/articles/osnovnye-komandy-docker
9. https://habr.com/ru/companies/nixys/articles/662698/
10. https/stackoverflow.com