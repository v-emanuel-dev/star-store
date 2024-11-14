import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, EMPTY } from 'rxjs';
import { NotificationService } from './notification.service';
import { CartItem } from '../models/cart-item.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private apiUrl = 'http://localhost:3000/api/cart';
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItemsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {
    this.loadCart();
  }

  public getCartItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  private loadCart(): void {
    const userIdString = localStorage.getItem('userId');
    const userId = userIdString ? parseInt(userIdString) : undefined;

    if (userId) {
      this.http.get<CartItem[]>(`${this.apiUrl}/${userId}/items`).subscribe(
        (items) => {
          console.log('Cart items loaded:', items);
          this.cartItemsSubject.next(items);
        },
        (error) => {
          console.error('Error loading cart:', error);
        }
      );
    }
  }

  addToCart(postId: number): void {
    const userIdString = localStorage.getItem('userId');
    const userId = userIdString ? parseInt(userIdString) : undefined;

    if (!userId) {
      this.notificationService.showNotification('User not logged in');
      return;
    }

    const currentCart = this.cartItemsSubject.value;
    const existingItem = currentCart.find((item) => item.postId === postId);

    // Sempre incrementa a quantidade, seja um item novo ou existente
    const quantity = existingItem ? 1 : 1; // quantidade a ser adicionada

    const payload = {
      postId,
      userId,
      quantity,
      cartId: userId,
    };

    this.http
      .post<{ message: string; itemId: number }>(this.apiUrl, payload)
      .subscribe(
        (response) => {
          this.loadCart(); // Recarrega o carrinho para ter o estado mais atual
          this.notificationService.showNotification('Item added to cart');
        },
        (error) => {
          console.error('Error adding item to cart:', error);
          this.notificationService.showNotification(
            'Error adding item to cart'
          );
        }
      );
  }

  removeFromCart(postId: number): void {
    const currentCart = this.cartItemsSubject.value;
    const itemToRemove = currentCart.find((item) => item.postId === postId);

    if (!itemToRemove) {
      console.warn('Item not found in cart:', postId);
      return;
    }

    const newQuantity = itemToRemove.quantity - 1;

    // Correção do endpoint
    this.http
      .put(`${this.apiUrl}/items/${itemToRemove.id}/quantity`, {
        newQuantity: newQuantity,
      })
      .subscribe({
        next: () => {
          this.loadCart();
          this.notificationService.showNotification('Item updated in cart');
        },
        error: (error) => {
          console.error('Error updating cart item:', error);
          this.notificationService.showNotification('Failed to update item');
        },
      });
  }

  // Método para obter a quantidade atual de um item
  getItemQuantity(postId: number): number {
    const item = this.cartItemsSubject.value.find(
      (item) => item.postId === postId
    );
    return item ? item.quantity : 0;
  }

  // Método para debug
  debugCartItem(cartItemId: number) {
    const item = this.cartItemsSubject.value.find(
      (item) => item.id === cartItemId
    );
    console.log('Cart item debug:', {
      itemFound: !!item,
      item: item || 'Not found',
      allItems: this.cartItemsSubject.value,
    });
  }

  logCartState() {
    const currentCart = this.cartItemsSubject.value;
    console.log('Current cart state:', currentCart);
  }

  // Método auxiliar para debug
  getCartItemDetails(postId: number): void {
    const item = this.cartItemsSubject.value.find(
      (item) => item.postId === postId
    );
    console.log('Cart item details:', {
      found: !!item,
      item: item || 'Not found',
      allItems: this.cartItemsSubject.value,
    });
  }

  getCartItemCount(): number {
    return this.cartItemsSubject.value.reduce(
      (acc, item) => acc + item.quantity,
      0
    );
  }
}
