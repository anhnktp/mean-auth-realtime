import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FlashMessagesService } from 'angular2-flash-messages';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username: String;
  password: String;
  authEndpoint: String;

  constructor(
    private authService:AuthService,
    private router:Router,
    private flashMessage:FlashMessagesService
  ) {}

  ngOnInit() {
    localStorage.setItem('authConfig',JSON.stringify({
      facebook:
        {client_id: '1972338099664129',authEndpoint: 'http://localhost:3000/auth/facebook', redirect_uri: 'http://localhost:4200'},
      google:
        {client_id: '267825466382-sj3e4nh9g8sr8qbk5bv1mqaj8p8031oh.apps.googleusercontent.com', authEndpoint: 'http://localhost:3000/auth/google', redirect_uri: 'http://localhost:4200'}
    }));

  }

  onLoginSocial(provider){
    this.authService.authProvider(provider,JSON.parse(localStorage.getItem('authConfig')));
  }

  onLoginSubmit(){
    const user = {
      username: this.username,
      password: this.password
    }

    this.authService.authenticateUser(user).subscribe(data => {
      if(data.success){
        this.authService.storeUserData(data.token, data.user);
        this.flashMessage.show('You are now logged in', {
          cssClass: 'alert-success',
          timeout: 3000});
        this.router.navigate(['/']);
      } else {
        this.flashMessage.show(data.msg, {
          cssClass: 'alert-danger',
          timeout: 3000});
        this.router.navigate(['login']);
      }
    });
  }

}
