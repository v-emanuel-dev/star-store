import { Component, OnInit } from '@angular/core';
import { WebSocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
})
export class NotificationsComponent implements OnInit {
  /* notificationsCart: string[] = [];
  private notificationSubscription!: Subscription; */

  constructor(private webSocketService: WebSocketService) {}

  ngOnInit() {
    /*  this.notificationSubscription = this.webSocketService.updateCart$.subscribe({
      next: (message: string) => {
        this.notificationsCart.push(message);
      }
    }); */
  }

  ngOnDestroy(): void {
    /*  if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    } */
  }

  clearNotifications(): void {
    /*     this.notificationsCart = [];
     */
  }
}
