<?php
/**
 * ODK App - Lanzador para Apache XAMPP
 * Carga el bundle optimizado de dist/ cuando se ejecuta directamente en XAMPP.
 */
if (file_exists(__DIR__ . '/dist/index.html')) {
    $html = file_get_contents(__DIR__ . '/dist/index.html');
    // Ajusta las rutas relativas de assets a la subcarpeta dist/
    $html = str_replace('src="./assets/', 'src="./dist/assets/', $html);
    $html = str_replace('href="./assets/', 'href="./dist/assets/', $html);
    echo $html;
    exit;
}

// Fallback al index.html principal
include __DIR__ . '/index.html';
