/**
 * This file is part of POS plugin for FacturaScripts
 * Copyright (C) 2020 Juan José Prieto Dzul <juanjoseprieto88@gmail.com>
 */
const AjaxRequestUrl = "POS";

export function resumeDocument(callback, code) {
    let data = {
        action: "resume-document",
        code: code
    };

    $.ajax({
        type: "POST",
        url: AjaxRequestUrl,
        dataType: "json",
        data: data,
        success: callback,
        error: function (xhr) {
            console.error('Error al cargar la venta', xhr.responseText);
        }
    });
}

export function recalculate(callback, lines, formName) {
    let data = {};
    $.each($("#" + formName).serializeArray(), function (key, value) {
        data[value.name] = value.value;
    });

    data.action = "recalculate-document";
    data.lines = lines;

    $.ajax({
        type: "POST",
        url: AjaxRequestUrl,
        dataType: "json",
        data: data,
        success: callback,
        error: function (xhr) {
            console.error('Error al recalcular las lineas', xhr.responseText);
        }
    });
}

export function search(callback, query, target) {
    let data = {
        action: "custom-search",
        query: query,
        target: target
    };
    $.ajax({
        type: "POST",
        url: AjaxRequestUrl,
        dataType: "json",
        data: data,
        success: callback,
        error: function (xhr) {
            console.error('Error en la busqueda', xhr.responseText);
            return false;
        }
    });
}

export function searchBarcode(callback, query) {
    let data = {
        action: "barcode-search",
        query: query
    };
    $.ajax({
        type: "POST",
        url: AjaxRequestUrl,
        dataType: "json",
        data: data,
        success: callback,
        error: function (xhr) {
            console.error('Error searching by code', xhr.responseText);
        }
    });
}

// Helper functions
export function formatNumber(val) {
    return parseFloat(val).toFixed(2);
}

export function testResponseTime(startTime, label = 'Exec time:') {
    //Calculate the difference in milliseconds.
    let time = performance.now() - startTime;

    //Convert milliseconds to seconds.
    let seconds = time / 100;
    console.log(label, seconds.toFixed(3));
}