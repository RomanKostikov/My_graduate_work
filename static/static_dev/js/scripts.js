$(document).ready(function () {
    /*
    JS работаем только на стороне клиента. Необходим, чтобы обновлялся фронтенд в реальном времени
    (Без перезагрузки страницы).
    Строчки отвечающие за то, что документ будет читаться, когда функции будут готовы. Привязываем к форме на
    сайте(product.html) form_buying_product
     */
    var form = $('#form_buying_product');
    console.log(form);


    function basketUpdating(product_id, nmb, is_delete) {
        /*
        Функция выполняющая обновление информации в корзине.
         */
        var data = {};
        data.product_id = product_id;
        data.nmb = nmb;
        var csrf_token = $('#form_buying_product [name="csrfmiddlewaretoken"]').val();
        data["csrfmiddlewaretoken"] = csrf_token; // для отправки пост запросов.

        if (is_delete) {
            data["is_delete"] = true;
        }

        var url = form.attr("action");

        console.log(data)
        /*
        Строчки кода отвечающие за отображения количества товара рядом с корзиной.
         */
        $.ajax({
            url: url,
            type: 'POST',
            data: data,
            cache: true,
            success: function (data) {
                console.log("OK");
                console.log(data.products_total_nmb);
                if (data.products_total_nmb || data.products_total_nmb == 0) {
                    $('#basket_total_nmb').text("(" + data.products_total_nmb + ")");
                    console.log(data.products);
                }

            },
            error: function () {
                console.log("error")
            }
        })

    }

    form.on('submit', function (e) {
        /*
        Часть кода отвечающая за функционал кнопки "Добавить в корзину", привязана к submit_btn на стороне product.html
         */
        e.preventDefault(); // отмена повторной отправки формы, после выполнения функции
        // (Чтобы данные оставались в терминале)
        // console.log('123');
        var nmb = $('#number').val();
        console.log(nmb);
        /*
        Добавили необходимые атрибуты для считывания при нажатии кнопки.
         */
        var submit_btn = $('#submit_btn');
        var product_id = submit_btn.data("product_id");
        var name = submit_btn.data("name");
        var price = submit_btn.data("price");
        console.log(product_id);
        console.log(name);
        console.log(price);

        basketUpdating(product_id, nmb, is_delete = false)

    });

    // $(document).on('click', '.delete-item', function (e) {
    //     /*
    //     Часть кода отвечающая за удаление товара из всплывающей корзины по клику на крестик.
    //      */
    //     e.preventDefault();
    //     product_id = $(this).data("product_id")
    //     nmb = 0;
    //     console.log(product_id);
    //     basketUpdating(product_id, nmb, is_delete = true)
    // });

    function calculationBasketAmount() {
        /*
        Функция выполняющая подсчет общей стоимости товара в корзине в реальном времени.
         */
        var total_order_amount = 0;
        $('.total-product-in-basket-amount').each(function () {
            total_order_amount = total_order_amount + parseFloat($(this).text())
        });
        console.log(total_order_amount);
        $('#total_order_amount').text(total_order_amount.toFixed(2));
    }

    $(document).on('change', ".product-in-basket-nmb", function () {
        var current_nmb = $(this).val();
        var current_tr = $(this).closest('tr');
        var current_price = parseFloat(current_tr.find('.product-price').text()).toFixed(2);
        var total_amount = parseFloat(current_nmb * current_price).toFixed(2);
        current_tr.find('.total-product-in-basket-amount').text(total_amount);

        calculationBasketAmount();
    })

    calculationBasketAmount();

});

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Ищем куку с нужным именем
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function removeFromBasket(productId) {
    fetch('/remove_from_basket/' + productId + '/', {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
        }
    })
        .then(response => {
            if (response.ok) {
                // Обновить отображение корзины
                location.reload();
            } else {
                alert('Ошибка удаления товара из корзины');
            }
        });
}