from django.urls import path, re_path
from django.contrib import admin
from . import views
urlpatterns = [
    # path('', views.index, name='home')0
    re_path(r'^basket_adding/$', views.basket_adding, name='basket_adding'),

]
