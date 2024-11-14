const db = require("../config/db");
const { getSocket } = require("../socket");

exports.createCart = (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  db.query(
    "INSERT INTO carts (userId) VALUES (?)",
    [userId],
    (error, result) => {
      if (error) {
        return res.status(500).json({ message: "Internal Server Error" });
      }
      res.status(201).json({
        message: "Cart created successfully",
        cartId: result.insertId,
      });
    }
  );
};

exports.getCartByUserId = (req, res) => {
  const { userId } = req.params;

  db.query("SELECT * FROM carts WHERE userId = ?", [userId], (error, carts) => {
    if (error) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
    if (carts.length === 0) {
      return res.status(404).json({ message: "No cart found for this user" });
    }
    res.json(carts[0]);
  });
};

exports.getCartItems = (req, res) => {
  const { userId } = req.params;

  db.query(
    "SELECT * FROM cart_items WHERE userId = ?",
    [userId],
    (error, items) => {
      if (error) {
        return res
          .status(500)
          .json({ message: "Error fetching cart items", error: error.message });
      }
      res.json(items);
    }
  );
};

exports.addItemToCart = (req, res) => {
  const { postId, userId, quantity } = req.body;
  const cartId = userId;

  db.query(
    "SELECT * FROM cart_items WHERE postId = ? AND userId = ?",
    [postId, userId],
    (error, items) => {
      if (error) {
        return res
          .status(500)
          .json({ message: "Error fetching cart item", error: error.message });
      }

      const io = getSocket();

      if (items.length > 0) {
        const existingItem = items[0];
        const newQuantity = existingItem.quantity + quantity;

        db.query(
          "UPDATE cart_items SET quantity = ? WHERE id = ?",
          [newQuantity, existingItem.id],
          (updateError) => {
            if (updateError) {
              return res
                .status(500)
                .json({ message: "Error updating item quantity" });
            }

            io.emit(
              "addToCartNotification",
              `Item quantity updated for postId ${postId} to ${newQuantity}`
            );

            res.status(200).json({
              message: "Item quantity updated successfully",
              itemId: existingItem.id,
              newQuantity: newQuantity,
            });
          }
        );
      } else {
        db.query(
          "INSERT INTO cart_items (postId, userId, quantity, cartId) VALUES (?, ?, ?, ?)",
          [postId, userId, quantity, cartId],
          (insertError, result) => {
            if (insertError) {
              return res.status(500).json({
                message: "Error adding item to cart",
                error: insertError.message,
              });
            }

            io.emit(
              "addToCartNotification",
              `Item added to cart with postId ${postId}`
            );

            res.status(200).json({
              message: "Item added to cart successfully",
              itemId: result.insertId,
            });
          }
        );
      }
    }
  );
};

exports.updateCartItemQuantity = (req, res) => {
  const itemId = req.params.id;
  const { newQuantity } = req.body;
  const io = getSocket();

  if (newQuantity <= 0) {
    db.query("DELETE FROM cart_items WHERE id = ?", [itemId], (deleteError) => {
      if (deleteError) {
        return res.status(500).json({ message: "Error deleting item" });
      }

      io.emit("removeFromCartNotification", `Item with ID ${itemId} removed from cart`);

      res.status(200).json({ message: "Item removed from cart", itemId });
    });
  } else {
    db.query("UPDATE cart_items SET quantity = ? WHERE id = ?", [newQuantity, itemId], (updateError) => {
      if (updateError) {
        return res.status(500).json({ message: "Error updating item quantity" });
      }

      io.emit("updateCartNotification", `Item with ID ${itemId} updated to quantity ${newQuantity}`);

      res.status(200).json({
        message: "Item quantity updated successfully",
        itemId,
        newQuantity,
      });
    });
  }
};

exports.updateItemQuantity = (req, res) => {
  const { itemId } = req.params;
  const { newQuantity } = req.body;

  if (!itemId || !newQuantity) {
    return res.status(400).json({
      message: "Missing required fields",
      received: { itemId, newQuantity },
    });
  }

  db.query(
    "UPDATE cart_items SET quantity = ? WHERE id = ?",
    [newQuantity, itemId],
    (error, result) => {
      if (error) {
        return res
          .status(500)
          .json({ message: "Error updating item quantity" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Item not found" });
      }

      return res.status(200).json({
        message: "Item quantity updated successfully",
        itemId: parseInt(itemId),
        newQuantity: parseInt(newQuantity),
      });
    }
  );
};

exports.removeItemFromCart = (req, res) => {
  const itemId = req.params.id;

  if (!itemId) {
    return res.status(400).json({ message: "Item ID is required" });
  }

  const parsedId = parseInt(itemId, 10);
  if (isNaN(parsedId)) {
    return res.status(400).json({ message: "Invalid item ID format" });
  }

  const checkQuery = "SELECT id FROM cart_items WHERE id = ?";
  db.query(checkQuery, [parsedId], (checkError, results) => {
    if (checkError) {
      return res
        .status(500)
        .json({ message: "Database error", error: checkError.message });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "Item not found", itemId: parsedId });
    }

    const deleteQuery = "DELETE FROM cart_items WHERE id = ?";
    db.query(deleteQuery, [parsedId], (deleteError, deleteResult) => {
      if (deleteError) {
        return res
          .status(500)
          .json({ message: "Error deleting item", error: deleteError.message });
      }

      if (deleteResult.affectedRows === 0) {
        return res.status(404).json({
          message: "Item not found or already deleted",
          itemId: parsedId,
        });
      }

      return res.status(200).json({
        message: "Item successfully removed from cart",
        itemId: parsedId,
      });
    });
  });
};
