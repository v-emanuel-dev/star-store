import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { ImageService } from '../../services/image.service';
import { WebSocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isDropdownOpen = false;
  notifications: any[] = [];
  unreadNotificationsCount: number = 0;
  isNotificationsOpen: boolean = false;
  userId: number | null = null;
  profilePicture: string | null = null;
  defaultProfilePicture: string =
    'http://localhost:4200/assets/img/default-profile.png';
  userRole: string | null = null;
  notificationCount = 0;
  showNotifications = false;
  notificationsVisible = false;
  unreadCartCount = 0;
  showCartNotifications = false;

  notificationsCart: string[] = [];
  private addToCartSubscription!: Subscription;

  private userDetailsSubscription: Subscription = new Subscription();
  private notificationsSubscription: Subscription | undefined;

  constructor(
    private authService: AuthService,
    private router: Router,
    private webSocketService: WebSocketService,
    private http: HttpClient,
    private changeDetectorRef: ChangeDetectorRef,
    private imageService: ImageService,
    private cd: ChangeDetectorRef,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.userDetailsSubscription = this.authService.userDetails$
      .pipe(filter((details) => details !== null))
      .subscribe((details) => {
        if (details && details.userRole) {
          this.userRole = details.userRole;
          this.cd.detectChanges();
        }
      });

    this.imageService.profilePic$.subscribe((pic) => {
      this.profilePicture = pic || this.defaultProfilePicture;
      this.cd.detectChanges();
    });

    this.notificationsSubscription =
      this.webSocketService.notifications$.subscribe((notifications) => {
        this.notifications = notifications;
        this.unreadNotificationsCount = this.notifications.length;
        this.changeDetectorRef.detectChanges();
      });

      /* this.addToCartSubscription = this.webSocketService.addToCart$.subscribe({
        next: (message: string) => {
          this.notificationsCart.push(message);
        }
      }); */

    document.addEventListener('click', this.closeDropdowns.bind(this));
    document.addEventListener('click', this.closeCartNotifications.bind(this));

  }

  toggleCartNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  isAdmin(): boolean {
    return this.userRole === 'admin';
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  goToLoginWithMessage() {
    if (this.isLoggedIn()) {
      this.router.navigate(['/blog']);
    } else {
      this.router.navigate(['/login'], {
        queryParams: { message: 'Please log in to proceed' },
      });
      this.snackbar('Please log in to proceed');
    }
  }

  fetchNotifications() {
    if (!this.userId) return;

    this.http
      .get(`http://localhost:3000/api/comments/${this.userId}/notifications`)
      .subscribe(
        (data: any) => {
          this.notifications = data;
          this.unreadNotificationsCount = this.notifications.filter(
            (n) => !n.read
          ).length;
        },
        (error: HttpErrorResponse) => {
          this.snackbar('Error fetching notifications');
        }
      );
  }

  toggleNotifications() {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    this.snackbar(
      `Notifications ${this.isNotificationsOpen ? 'opened' : 'closed'}`
    );
  }

  markAsRead(index: number) {
    if (index < 0 || index >= this.notifications.length) {
      this.snackbar('Invalid notification index');
      return;
    }

    const notificationToRemove = this.notifications[index];
    this.snackbar('Marking notification as read');

    this.notifications.splice(index, 1);
    this.unreadNotificationsCount = this.notifications.length;
    this.isNotificationsOpen = false;

    notificationToRemove.read = true;

    this.removeNotificationFromDatabase(notificationToRemove.id).subscribe(
      () => {
        this.snackbar('Notification successfully removed from database');
      },
      () => {
        this.snackbar('Error removing notification from database');
      }
    );
  }

  private removeNotificationFromDatabase(notificationId: number) {
    return this.http.delete(
      `http://localhost:3000/api/comments/notifications/${notificationId}`
    );
  }

  hasNotifications(): boolean {
    return this.unreadNotificationsCount > 0;
  }

  markNotificationAsRead(index: number): void {
    this.notifications.splice(index, 1);
    this.unreadNotificationsCount = this.notifications.length;
  }

  closeDropdowns(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const notificationButton = document.querySelector('.fa-bell');
    const userMenuButton = document.getElementById('user-menu-button');

    if (
      notificationButton &&
      !notificationButton.contains(target) &&
      userMenuButton &&
      !userMenuButton.contains(target) &&
      !target.closest('.notifications')
    ) {
      this.isNotificationsOpen = false;
      this.isDropdownOpen = false;
    }
  }

  closeCartNotifications(event: MouseEvent): void {
    const cartButton = document.querySelector('.relative.ml-3 button');
    const notificationsContainer = document.querySelector('.absolute.right-0.mt-2');

    if (
      cartButton && !cartButton.contains(event.target as Node) &&
      notificationsContainer && !notificationsContainer.contains(event.target as Node)
    ) {
      this.showNotifications = false;  // Fechar o menu do carrinho
    }
  }

  onImageError() {
    this.snackbar('Failed to load profile picture, using default.');
    this.profilePicture = this.defaultProfilePicture;
  }

  logout(): void {
    localStorage.removeItem('profilePicture');
    this.notifications = [];
    this.unreadNotificationsCount = 0;

    this.authService.logout();
    this.snackbar('Logged out successfully');
  }

  clearNotifications(): void {
    this.notificationsCart = [];
  }

  ngOnDestroy() {

    if (this.addToCartSubscription) {
      this.addToCartSubscription.unsubscribe();
    }

    this.userDetailsSubscription.unsubscribe();
    document.removeEventListener('click', this.closeDropdowns.bind(this));
  }

  snackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: 'star-snackbar',
    });
  }
}
