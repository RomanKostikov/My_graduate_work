from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponse, HttpResponseRedirect
from orders.models import *
from .forms import CheckoutContactForm
from django.contrib.auth.models import User
from django.views.decorators.http import require_http_methods, require_POST


# Create your views here.
def basket_adding(request):
    """Функция добавления товара в корзину, задействует JS."""
    return_dict = dict()
    session_key = request.session.session_key
    print(request.POST)
    data = request.POST
    product_id = data.get("product_id")
    nmb = data.get("nmb")
    is_delete = data.get("is_delete")

    if is_delete == 'true':  # удаление товара реализовано посредством is_active=False
        ProductInBasket.objects.filter(id=product_id).update(is_active=False)
    else:  # если удаление не выполняется, то информация передается в штатном режиме(is_active=True)
        new_product, created = ProductInBasket.objects.get_or_create(session_key=session_key, product_id=product_id,
                                                                     is_active=True, order=None, defaults={"nmb": nmb})
        if not created:
            print("not created")
            new_product.nmb += int(nmb)
            new_product.save(force_update=True)

    # Работаем с представлением и с БД
    products_in_basket = ProductInBasket.objects.filter(session_key=session_key, is_active=True, order__isnull=True)
    products_total_nmb = products_in_basket.count()
    return_dict["products_total_nmb"] = products_total_nmb

    return JsonResponse(return_dict)


@require_POST
def remove_from_basket(request, product_id):
    """Функция отвечающая за удаление товара из корзины на странице оформления заказа"""
    try:
        product_in_basket = ProductInBasket.objects.get(id=product_id, session_key=request.session.session_key, is_active=True, order__isnull=True)
        product_in_basket.is_active = False
        product_in_basket.save()
        return JsonResponse({'message': 'Товар успешно удален из корзины'})
    except ProductInBasket.DoesNotExist:
        return JsonResponse({'message': 'Товар не найден в корзине'}, status=404)

def checkout(request):
    """Функция отвечающая за отображения страницы оформления заказа(Проверку заказа)."""
    session_key = request.session.session_key
    products_in_basket = ProductInBasket.objects.filter(session_key=session_key, is_active=True, order__isnull=True)
    print(products_in_basket)
    for item in products_in_basket:
        print(item.order)

    form = CheckoutContactForm(request.POST or None)
    if request.POST:
        print(request.POST)
        if form.is_valid():
            print("yes")
            data = request.POST
            name = data.get("name", "3423453")
            phone = data["phone"]
            user, created = User.objects.get_or_create(username=phone, defaults={"first_name": name})

            order = Order.objects.create(user=user, customer_name=name, customer_phone=phone, status_id=1)

            for name, value in data.items():
                if name.startswith("product_in_basket_"):
                    product_in_basket_id = name.split("product_in_basket_")[1]
                    product_in_basket = ProductInBasket.objects.get(id=product_in_basket_id)
                    print(type(value))

                    product_in_basket.nmb = value

                    product_in_basket.order = order
                    product_in_basket.save(force_update=True)

                    ProductInOrder.objects.create(product=product_in_basket.product, nmb=product_in_basket.nmb,
                                                  price_per_item=product_in_basket.price_per_item,
                                                  total_price=product_in_basket.total_price,
                                                  order=order)

            return HttpResponseRedirect(request.META['HTTP_REFERER'])
        else:
            print("no")

    return render(request, 'orders/checkout.html', locals())
