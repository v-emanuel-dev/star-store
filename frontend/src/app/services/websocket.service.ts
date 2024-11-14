import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id?: number;
  userId: string;
  message: string;
  postId: string;
}

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: Socket;

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  /* private addToCartSubject = new Subject<string>();
  addToCart$ = this.addToCartSubject.asObservable();

  private removeFromCartSubject = new Subject<string>();
  removeFromCart$ = this.removeFromCartSubject.asObservable();

  private updateCartSubject = new Subject<string>();
  updateCart$ = this.updateCartSubject.asObservable(); */

  private userId: string | null = localStorage.getItem('userId');

  constructor(private http: HttpClient) {
    this.socket = io('http://localhost:3000');

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');  // Log para verificar a conexão
    });

    // Escuta notificações de novos comentários
    this.socket.on('new-comment', (data: Notification) => {
      this.addNotification(data);
    });

    /* this.socket.on('addToCartNotification', (message: string) => {
      console.log('Received ADD to cart notification:', message);
      this.addToCartSubject.next(message);
    });

    this.socket.on('removeFromCartNotification', (message: string) => {
      console.log('Received REMOVE from cart notification:', message);
      this.removeFromCartSubject.next(message);
    });

    this.socket.on('updateCartNotification', (message: string) => {
      console.log('Received UPDATE from cart notification:', message);
      this.updateCartSubject.next(message);
    }); */

    this.initializeNotifications();
    this.watchForUserIdAndFetchNotifications();
  }

  initializeNotifications() {
    if (this.userId) {
      this.fetchNotifications(this.userId);
    }
  }

  fetchNotifications(userId: string) {
    this.http
      .get<Notification[]>(`http://localhost:3000/api/comments/${userId}/notifications`)
      .subscribe((notifications) => {
        const validNotifications = notifications.filter(
          (n) => n.message && n.postId
        );
        this.notificationsSubject.next(validNotifications);
      });
  }

  private addNotification(notification: Notification) {
    if (notification && notification.message && notification.postId) {
      const currentNotifications = this.notificationsSubject.value;
      const updatedNotifications = [...currentNotifications, notification];
      this.notificationsSubject.next(updatedNotifications);
    }
  }

  private watchForUserIdAndFetchNotifications() {
    const intervalId = setInterval(() => {
      this.userId = localStorage.getItem('userId');

      if (this.userId) {
        this.fetchNotifications(this.userId);
        clearInterval(intervalId);
      }
    }, 1000);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
