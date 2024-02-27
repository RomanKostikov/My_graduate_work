from django.urls import path, re_path
from django.contrib import admin
from . import views


urlpatterns = [
    # path('', views.index, name='home')0
    re_path(r'^basket_adding/$', views.basket_adding, name='basket_adding'),
    # re_path(r'^delete_cart/$', views.delete_cart, name='delete_cart'),
    re_path(r'^checkout/$', views.checkout, name='checkout'),
    re_path(r'^remove_from_basket/(?P<product_id>\d+)/$', views.remove_from_basket, name='remove_from_basket'),

]
