# -*- coding: utf-8 -*-
import os, sys
sys.path.insert(0, '/home/r/romank53/romank53.beget.tech/My_graduate_work')
sys.path.insert(1, '/home/r/romank53/romank53.beget.tech/django_shop2_venv/lib/python3.9/site-packages')
os.environ['DJANGO_SETTINGS_MODULE'] = 'My_graduate_work.settings'
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()