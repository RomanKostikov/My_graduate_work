from django.shortcuts import render
from products.models import *


# Create your views here.
def product(request, product_id):
    product = Product.objects.get(id=product_id)

    session_key = request.session.session_key
    if not session_key:
        request.session.cycle_key()
    print(request.session.session_key)
    return render(request, 'products/product.html', locals())


def phone(request):
    """Функция фильтрации картинок телефонов."""
    products_images = ProductImage.objects.filter(is_active=True)
    products_images_phones = products_images.filter(product__category__id=1)
    return render(request, 'products/phone.html', locals())


def laptop(request):
    """Функция фильтрации картинок телефонов."""
    products_images = ProductImage.objects.filter(is_active=True)
    products_images_laptops = products_images.filter(product__category__id=2)
    return render(request, 'products/laptop.html', locals())
