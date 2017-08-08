import { Component, OnInit } from '@angular/core';
import { AuthService} from '../../services/auth.service';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { FlashMessagesService } from 'angular2-flash-messages';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  tempConfigProvider = {client_id: '',authEndpoint: '', redirect_uri: ''};
  code: String;
  name: String;
  constructor(private authService: AuthService,
              private location: Location,
              private router: Router,
              private flashMessage:FlashMessagesService,
              private navbarComponent: NavbarComponent) { }

  ngOnInit() {
    let params = new URLSearchParams(this.location.path(false).split('?')[1]);
    this.code = params.get('code');
    if(this.code){
      let provider = localStorage.getItem('provider');
      let auth_config = localStorage.getItem('authConfig');
      this.tempConfigProvider = JSON.parse(auth_config)[provider];
      this.authService.loginProvider(this.code,this.tempConfigProvider.authEndpoint).subscribe(data => {
        if(data.success){
          this.authService.storeUserData(data.token,data.user);
          this.router.navigate(['/']);
          this.flashMessage.show('You are now logged in', {
            cssClass: 'alert-success',
            timeout: 3000});
          this.navbarComponent.setSmallProfileImage();
        } else {
          this.flashMessage.show('Login by social account failed!', {
            cssClass: 'alert-danger',
            timeout: 3000});
          this.router.navigate(['login']);
        }
      })
    } else {
      this.navbarComponent.setSmallProfileImage();
    }
  }

}
