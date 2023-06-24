'use strict';

// Модуль сравнения товаров
var compare = (function($) {

    var ui = {
        $body: $('body'),
        elAddToCompare: '.js-add-to-compare',
        elCompareFilters: '.js-compare-filter',
        elCompareRemove: '.js-compare-remove',
        $compareTab: $('#compare-tab'),
        $compareTable: $('#compare-table')
    };

    var tpl = {
        filters: _.template($('#compare-filters-template').html() || ''),
        header: _.template($('#compare-header-template').html() || ''),
        props: _.template($('#compare-props-template').html() || '')
    };

    var settings = {
        cookie: {
            goods: 'compared_goods',
            category: 'compared_category'
        }
    };

    // Добавление товара к сравнению
    function _onClickAddToCompare(e) {
        var $button = $(e.target),
            goodId = $button.attr('data-id'),
            categoryId = $button.attr('data-category-id'),
            comparedGoodsStr = $.cookie(settings.cookie.goods),
            comparedGoodsArr = comparedGoodsStr ? comparedGoodsStr.split(',') : [],
            comparedCategoryId = $.cookie(settings.cookie.category);

        // Проверяем, совпадают ли категории товаров
        if (comparedCategoryId && categoryId !== comparedCategoryId) {
            alert('Не допускается сравнивать товары разных категорий');
            return false;
        }

        // Проверяем, нет ли этого товара уже в куках
        if (comparedGoodsArr.indexOf(goodId) === -1) {
            // Добавляем новый товар в массив сравниваемых
            comparedGoodsArr.push(goodId);
            $.cookie(settings.cookie.goods, comparedGoodsArr.join(','), {expires: 365, path: '/'});
            $.cookie(settings.cookie.category, categoryId, {expires: 365, path: '/'});
            updateCompareTab();
            alert('Товар добавлен к сравнению!');
        } else {
            alert('Этот товар уже есть в списке сравниваемых');
        }
    }

    // Смена фильтра
    function _onClickCompareFilters(e) {
        ui.$compareTable.attr('data-compare', e.target.value);
    }

    // Удаление товара из списка сравниваемых
    function _onClickCompareRemove(e) {
        var id = $(e.target).attr('data-id'),
            goods = $.cookie(settings.cookie.goods).split(','),
            categoryId = $.cookie(settings.cookie.category),
            newGoods = _.without(goods, id),
            newGoodsStr = newGoods.join(',');

        // Удаляем куки, если исключили все товары
        if (!newGoodsStr) {
            $.removeCookie(settings.cookie.goods, {path: '/'});
            $.removeCookie(settings.cookie.category, {path: '/'});
        }

        // Меняем хэш и перезагружаем страницу
        document.location.hash = newGoodsStr ? encodeURIComponent(categoryId + '|' + newGoodsStr) : '';
        document.location.reload();
    }

    // Навешиваем события
    function _bindHandlers() {
        ui.$body.on('click', ui.elAddToCompare, _onClickAddToCompare);
        ui.$body.on('click', ui.elCompareFilters, _onClickCompareFilters);
        ui.$body.on('click', ui.elCompareRemove, _onClickCompareRemove);
    }

    // Обновление количества сравниваемых товаров во вкладке
    function updateCompareTab() {
        var comparedGoodsStr = $.cookie(settings.cookie.goods),
            comparedGoodsArr = comparedGoodsStr ? comparedGoodsStr.split(',') : [],
            comparedCategoryId = $.cookie(settings.cookie.category),
            compareHref = 'compare.html' + (comparedGoodsArr.length ? '#' + encodeURIComponent(comparedCategoryId + '|' + comparedGoodsStr) : '');

        // Обновляем метку с количеством товаров во вкладке compare
        ui.$compareTab.find('span').text(comparedGoodsArr.length || '');

        // Обновляем ссылку во вкладке compare
        ui.$compareTab.find('a').attr('href', compareHref);
    }

    // Получение массива основных свойств из response.data.goods
    function _getBaseProps(goods) {
        // Конфиг для базовых свойств
        var baseProps = [{
            key: 'brand',
            prop: 'Бренд'
        }, {
            key: 'price',
            prop: 'Цена'
        }, {
            key: 'rating',
            prop: 'Рейтинг'
        }];

        var valuesWithIds, values, equal;

        // Возвращаем свойства со списком значений
        return _.map(baseProps, function(item) {

            // Массив объектов из id и значений для конкретного свойства
            valuesWithIds = _.map(goods, function(good) {
                return {
                    goodId: good.good_id,
                    value: good[item.key]
                }
            });

            // Массив значений конкретного свойства
            values = _.pluck(valuesWithIds, 'value');

            // Одинаковые ли значения во всех товарах
            equal = _.uniq(values).length === 1;

            // Возвращаем объект с набором данных
            return {
                prop: item.prop,
                values: valuesWithIds,
                equal: equal
            }
        });
    }

    // Получение массива дополнительных свойств из response.data.props
    function _getAdditionalProps(props) {
        var valuesWithIds, values, equal;
        return _.chain(props)
            .groupBy('prop')
            .map(function(valuesArray, key) {

                // Массив объектов из id и значений для конкретного свойства
                valuesWithIds = _.map(valuesArray, function(item) {
                    return {
                        goodId: item.good_id,
                        value: item.value
                    }
                });

                // Массив значений конкретного свойства
                values = _.pluck(valuesWithIds, 'value');

                // Одинаковые ли значения во всех товарах
                equal = (values.length > 1) && (_.uniq(values).length === 1);

                return {
                    prop: key,
                    values: valuesWithIds,
                    equal: equal
                }
            })
            .value();
    }

    // Рендер таблицы сравнения
    function _renderCompareTable(response) {
        var filters = [{
                value: 'all',
                title: 'Все',
                checked: true
            },{
                value: 'equal',
                title: 'Совпадающие'
            },{
                value: 'not-equal',
                title: 'Различающиеся'
            }];

        var goods = response.data.goods;

        var allProps = _.union(
            _getBaseProps(goods),
            _getAdditionalProps(response.data.props)
        );

        // Рендерим фильтры
        ui.$compareTable.find('thead tr').html(tpl.filters({
            buttons: filters
        }));

        // Рендерим товары в шапке таблицы
        ui.$compareTable.find('thead tr').append(tpl.header({
            goods: goods
        }));

        // Рендерим свойства товаров в таблице
        ui.$compareTable.find('tbody').append(tpl.props({
            goods: _.pluck(goods, 'good_id'),
            props: allProps
        }));
    }

    // Ошибка получения данных
    function _onAjaxError(response) {
        console.error('response', response);
        // Далее обработка ошибки, зависит от фантазии
    }

    // Инициализация страницы compare
    function _initComparePage() {
        var hashData = decodeURIComponent(location.hash).substr(1).split('|'),
            categoryId = hashData.length ? hashData[0] : 0,
            goods = hashData.length ? hashData[1] : [];

        if (!goods) {
            alert('Не выбраны товары для сравнения');
            return false;
        }

        // Записываем в куки значения из хэша
        $.cookie(settings.cookie.goods, goods, {expires: 365, path: '/'});
        $.cookie(settings.cookie.category, categoryId, {expires: 365, path: '/'});

        // Запрашиваем данные с сервера
        $.ajax({
            url: 'scripts/compare.php',
            data: 'goods=' + encodeURIComponent(goods),
            type: 'GET',
            cache: false,
            dataType: 'json',
            error: _onAjaxError,
            success: function(response) {
                if (response.code === 'success') {
                    _renderCompareTable(response);
                } else {
                    _onAjaxError(response);
                }
            }
        });
    }

    // Инициализация модуля
    function init() {
        _bindHandlers();
        if (ui.$body.attr('data-page') === 'compare') {
            _initComparePage();
        }
    }


    // Экспортируем наружу
    return {
        updateCompareTab: updateCompareTab,
        init: init
    }

})(jQuery);