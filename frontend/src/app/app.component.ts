import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ImageService } from './services/image.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private imageService: ImageService,
    private authService: AuthService
  ) {
    this.imageService.initialize();
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      const accessToken = params['accessToken'];
      const userId = params['userId'];
      const email = params['email'];
      const username = params['username'];
      const profilePicture = params['profilePicture'];
      const userRole = params['userRole'];
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('accessToken', token);
        localStorage.setItem('userId', userId);
        localStorage.setItem('email', email);
        localStorage.setItem('username', username);
        localStorage.setItem('profilePicture', profilePicture);
        localStorage.setItem('userRole', userRole);
        this.authService.setUserRole(userRole);
        this.authService.setUserDetails({
          userRole,
          userId,
          email,
          username,
          profilePicture,
        });
      }
    });
  }
}
