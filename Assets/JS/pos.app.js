/**
 * This file is part of EasyPOS plugin for FacturaScripts
 * Copyright (C) 2020 Juan José Prieto Dzul <juanjoseprieto88@gmail.com>
 */
const cartTemplateSource = document.getElementById('cartItemTemplate').innerHTML;
const ajaxTemplateSource = document.getElementById('ajaxSearchTemplate').innerHTML;

var ajaxSearchContainer = document.getElementById('ajaxSearchResult');
var cartItemsContainer = $('#cartItemsContainer');

var cart = new Cart({doc:{}});
var cartTemplate = Sqrl.Compile(cartTemplateSource);
var ajaxTemplate = Sqrl.Compile(ajaxTemplateSource);

function onCartUpdate() {
    var data = {};
    $.each($("#" + FormName).serializeArray(), function (key, value) {
        data[value.name] = value.value;
    });
    data.action = "recalculate-document";
    data.lines = cart.getCartItems();
    $.ajax({
        type: "POST",
        url: UrlAccess,
        dataType: "json",
        data: data,
        startTime: performance.now(),
        success: function (results) {
            cart = new Cart(results);
            console.log('Items on cart:', cart.cartItems);
            console.log('Results:', results);
            updateCartView(results);
            testResponseTime(this.startTime, 'Request exec time:');
        },
        error: function (xhr, status, error) {
            //  console.log('Error:', xhr.responseText)
        }
    });
}

function onCartDelete(e) {
    let index = e.data('index');

    cart.deleteCartItem(index);
    onCartUpdate();
}

function onCartEdit(e) {
    let field = e.data('field');
    let index = e.data('index');

    cart.editCartItem(index, field, e.val());
    onCartUpdate();
}

function updateCartView(results) {
    // Hide search modal
    $('#ajaxSearchModal').modal('hide');

    // Update totals
    document.getElementById('cartTotalDisplay').value = cart.total;
    document.getElementById('cartTaxesDisplay').value = cart.totaliva;
    document.getElementById('cartNetoDisplay').value = cart.netosindto;
    document.getElementById('total').value = cart.total;
    document.getElementById('neto').value = cart.neto;
    document.getElementById('totaliva').value = cart.totaliva;
    document.getElementById('totalirpf').value = cart.totalirpf;
    document.getElementById('totalrecargo').value = cart.totalrecargo;

    // Update cart view
    var html = cartTemplate({lines: results.lines}, Sqrl);
    cartItemsContainer.html(html);
}

// Search actions
function ajaxCustomSearch(query, target) {
    var data = {
        action: "custom-search",
        query: query,
        target: target
    };
    $.ajax({
        url: UrlAccess,
        data: data,
        type: "POST",
        dataType: "json",
        startTime: performance.now(),
        success: function (data) {
            ajaxSearchContainer.innerHTML = ajaxTemplate({list: data, target: target}, Sqrl);
        },
        error: function (xhr, status) {
            //console.log('Error', xhr.responseText);
        }
    });
}

function ajaxBarcodeSearch(query) {
    var data = {
        action: "barcode-search",
        query: query
    };
    $.ajax({
        url: UrlAccess,
        data: data,
        type: "POST",
        dataType: "json",
        startTime: performance.now(),
        success: function (data) {
            if (data.length > 0) {
                setProduct(data[0].code, data[0].description);
            } else {
                console.log('No encontrado');
            }
            document.getElementById('searchByCode').value = '';
        },
        error: function (xhr, status) {
            //console.log('Error:', xhr.responseText);
        }
    });
}

function setProduct(code, description) {
    cart.addCartItem(code, description);

    onCartUpdate();
}

function setCustomer(code, description) {
    document.getElementById('codcliente').value = code;
    document.getElementById('searchCustomer').value = description;

    $('#ajaxSearchModal').modal('hide');
    ajaxSearchContainer.innerHTML = '';
}

// Payment calc
function recalculatePaymentAmount() {
    var checkoutButton = document.getElementById('checkoutButton');
    var checkoutPaymentAmount = document.getElementById('checkoutPaymentAmount');
    var checkoutPaymentChange = document.getElementById('checkoutPaymentChange');
    var checkoutPaymentMethod = document.getElementById("checkoutPaymentMethod");
    var total = parseFloat(document.getElementById('total').value);

    paymentAmount = checkoutPaymentAmount.value;
    paymentReturn = paymentAmount - total;
    paymentReturn = paymentReturn || 0;
    if (checkoutPaymentMethod.value !== CashPaymentMethod) {
        if (paymentReturn > 0) {
            paymentReturn = 0;
            paymentAmount = total;
            checkoutPaymentAmount.value = formatNumber(paymentAmount);
        }
    }
    checkoutPaymentChange.value = formatNumber(paymentReturn);
    if (paymentReturn >= 0) {
        //console.log('Cambio : ' + paymentReturn);
        checkoutButton.removeAttribute('disabled')
    } else {
        //console.log('Falta : ' + paymentReturn);
        checkoutButton.setAttribute('disabled', 'disabled')
    }
}

function onCheckoutConfirm() {
    var paymentData = {};
    paymentData.amount = document.getElementById('checkoutPaymentAmount').value;
    paymentData.change = document.getElementById('checkoutPaymentChange').value;
    paymentData.method = document.getElementById("checkoutPaymentMethod").value;

    document.getElementById("action").value = 'save-document';
    document.getElementById("lines").value = JSON.stringify(cart.getCartItems());
    document.getElementById("payments").value = JSON.stringify(paymentData);
    document.salesDocumentForm.submit();
}

function onCheckoutModalShow() {
    var modalTitle = document.getElementById('dueAmount');
    modalTitle.textContent = document.getElementById('total').value;
}

function onPauseOperation() {
    if (cart.getCartItems().length <= 0) {
        $('#checkoutModal').modal('hide');
        return;
    }

    document.getElementById('action').value = 'pause-document';
    document.getElementById('lines').value = JSON.stringify(cart.getCartItems());
    document.salesDocumentForm.submit();
}

function resumeOperation(code) {
    var data = {
        action: "resume-document",
        code: code
    };

    $.ajax({
        type: "POST",
        url: UrlAccess,
        dataType: "json",
        data: data,
        startTime: performance.now(),
        success: function (results) {
            cart = new Cart(results);
            document.getElementById('idpausada').value = results.doc.idpausada;
            updateCartView(results);
            $('#pausedOpsModal').modal('hide');
            testResponseTime(this.startTime, 'Request exec time:');
        },
        error: function (xhr, status, error) {
            //  console.log('Error:', xhr.responseText)
        }
    });
}

// Helper functions
function formatNumber(val) {
    return parseFloat(val).toFixed(2);
}

function testResponseTime(startTime, label = 'Exec time:') {
    //Calculate the difference in milliseconds.
    var time = performance.now() - startTime;

    //Convert milliseconds to seconds.
    var seconds = time / 1000;
    console.log(label, seconds.toFixed(3));
}

$(document).ready(function () {
    var barcodeInput = document.getElementById("searchByCode");
    onScan.attachTo(barcodeInput, {
        onScan: function(code) { ajaxBarcodeSearch(code) }
    });

    $('[data-toggle="offcanvas"]').on('click', function () {
        $('.offcanvas-collapse').toggleClass('open')
    });
    $('#checkoutButton').click(function () {
        onCheckoutConfirm();
    });
    $('#pauseButton').click(function () {
        onPauseOperation();
    });
    $('#checkoutPaymentAmount').keyup(function (e) {
        recalculatePaymentAmount();
    });
    $('#checkoutPaymentMethod').change(function (e) {
        recalculatePaymentAmount();
    });
    $('#checkoutModal').on('shown.bs.modal', function () {
        onCheckoutModalShow();
    });
    $('#saveCashupButton').on('click', function (event) {
        document.cashupForm.submit()
    });

    // Ajax Search Events
    $('#searchCustomer').focus(function () {
        ajaxSearchContainer.innerHTML = '';
        $('#ajaxSearchInput').data('target', 'customer');
        $('#ajaxSearchModal').modal('show');
    });
    $('#searchProduct').focus(function () {
        $('#ajaxSearchInput').data('target', 'product');
        $('#ajaxSearchModal').modal('show');
    });
    $('#ajaxSearchModal').on('shown.bs.modal', function () {
        $('#ajaxSearchInput').focus();
    });
    $('#ajaxSearchInput').keyup(function () {
        ajaxCustomSearch($(this).val(), $(this).data('target'));
    });
    $('#ajaxSearchResult').on('click', '.item-add-button', function () {
        let target = $(this).data('target');
        let code = $(this).data('code');
        let description = $(this).data('description');
        switch (target) {
            case 'product':
                setProduct(code, description);
                break;
            case 'customer':
                setCustomer(code, description);
                break;
        }
    });

    // Cart Items Events
    cartItemsContainer.on('focusout', '.cart-item', function () {
        onCartEdit($(this));
    });
    cartItemsContainer.on('click', '.cart-item-del', function () {
        onCartDelete($(this));
    });
    $('#pausedOperations').on('click', '.resume-button', function () {
        let code = $(this).data('code');

        resumeOperation(code);
    });

    // itemsContainer.addEventListener('click', function(e) {
    //     if (!e.target) return;
    //
    //     if(e.target.classList.contains('cart-item')) {
    //         alert('edit');
    //     }
    //
    //     if(e.target.classList.contains('cart-item-del')) {
    //         alert('Del button clicked');
    //     }
    // });
});