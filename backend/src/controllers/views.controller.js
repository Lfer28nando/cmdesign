// src/controllers/views.controller.js

export const renderHome = (req, res) => {
    // Asumo que tienes un index.ejs o home.ejs. 
    // Ajusta el nombre 'index' si tu archivo se llama diferente.
    res.render('pages/index'); 
};

export const renderCart = (req, res) => {
    res.render('pages/carrito');
};

export const renderCheckout = (req, res) => {
    res.render('pages/checkout');
};

export const renderOrderConfirmed = (req, res) => {
    res.render('pages/pedido-confirmado');
};

export const renderAdmin = (req, res) => {
    res.render('pages/admin');
};

export const renderDetailProduct = (req, res) => {
    res.render('pages/producto')
};

export const renderCatalog = (req, res) => {
    res.render('pages/catalogo')
};

export const renderLogin = (req, res) => { 
    res.render('pages/login')
};

export const renderRegister = (req, res) => {
    res.render('pages/register')
};

export const renderShirts = (req, res) => {
    res.render('pages/shirts')
};

export const renderNinos = (req, res) => {
    res.render('pages/ninos')
};

export const renderNinosShirts = (req, res) => {
    res.render('pages/ninos-shirts')
};
