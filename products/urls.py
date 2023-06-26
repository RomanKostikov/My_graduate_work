from django.urls import path, re_path
from django.contrib import admin
from . import views

urlpatterns = [
    # path('', views.index, name='home')
    re_path(r'^product/(?P<product_id>\w+)/$', views.product, name='product'),
    re_path(r'^phone', views.phone, name='phone'),
    re_path(r'^laptop', views.laptop, name='laptop'),

]
