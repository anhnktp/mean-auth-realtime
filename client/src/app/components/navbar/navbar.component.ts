import { Component, OnInit } from '@angular/core';
import { AuthService} from '../../services/auth.service';
import { Router } from '@angular/router';
import { FlashMessagesService } from 'angular2-flash-messages';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  constructor(
    private authService:AuthService,
    private router:Router,
    private flashMessage:FlashMessagesService) { }

  ngOnInit() {
  }

  onLogoutClick(){
    this.authService.logout();
    this.flashMessage.show('You are logged out', {
      cssClass:'alert-success',
      timeout: 3000
    });
    this.router.navigate(['/login']);
    return false;
  }

  setSmallProfileImage(){
    if(this.authService.loggedIn() == true){
     if(localStorage.getItem('currentProfileImage') && localStorage.getItem('currentProfileName')){
      let fullName = localStorage.getItem('currentProfileName')+' ';
      let image = localStorage.getItem('currentProfileImage')
      document.getElementById('small-image').setAttribute('src',image);
      document.getElementById('small-name').innerHTML = fullName.substr(0,fullName.indexOf(' '))// chi lay first name
     } else {
        this.authService.getProfile().subscribe(data => {
          let currentImageSource = this.getCurrentImageSource(data.avatar);
          localStorage.setItem('currentProfileImage',currentImageSource);
          localStorage.setItem('currentProfileName',data.name); // lay tu dau tien
          let fullName = localStorage.getItem('currentProfileName')+' ';
          document.getElementById('small-image').setAttribute('src',localStorage.getItem('currentProfileImage'));
          document.getElementById('small-name').innerHTML = fullName.substr(0,fullName.indexOf(' '));

        })
     }
    }
  }

  getCurrentImageSource(avatarField){
    if(avatarField.displayImageType == 'social'){
      return avatarField.path_social
    } else {
      let imageLocalArray = avatarField.local.image;
      let displayImageID = avatarField.local.displayImageID;
      for(let i = 0;i < imageLocalArray.length ; i++){
        if(displayImageID == imageLocalArray[i]._id){
          return imageLocalArray[i].path_local
        }
      }
    }
  }

}
