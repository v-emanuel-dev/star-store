const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');

// Rota para obter todos os itens no carrinho de um usuário
router.get('/:userId/items', cartController.getCartItems);

// Rota para adicionar um item ao carrinho
router.post('/', cartController.addItemToCart);

// Rota para remover um item do carrinho
router.delete('/items/:itemId', cartController.removeItemFromCart);
        
router.put('/items/:id/quantity', cartController.updateCartItemQuantity);

module.exports = router;
