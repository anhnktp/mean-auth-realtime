import { Component, OnInit } from '@angular/core';
import { ValidateService } from '../../services/validate.service';
import { AuthService } from '../../services/auth.service';
import { FlashMessagesService } from 'angular2-flash-messages';
import { Router } from '@angular/router';
declare var $:any;
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  name: String;
  username: String;
  email: String;
  password: String;
  password2: String;
  mesErrUsername : String;
  mesSucUsername : String;
  mesErrName : String;
  mesErrEmail : String;
  mesSucEmail: String;
  mesErrPassword : String;
  mesErrPassword2 : String;

  constructor(
    private validateService: ValidateService,
    private flashMessage:FlashMessagesService,
    private authService:AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.hideAll("Username");
    this.hideAll("Name");
    this.hideAll("Email");
    this.hideAll("Password");
    this.hideAll("Password2");
  }

  hideAll(id){
    $("#good"+id).hide();
    $("#bad"+id).hide();
  }

  showBad(id){
    $("#good"+id).hide();
    $("#bad"+id).show();
    $("#txt"+id).parent().removeClass("has-success has-feedback");
    $("#txt"+id).parent().addClass("has-error has-feedback");
  }

  showGood(id){
    $("#bad"+id).hide();
    $("#good"+id).show();
    $("#txt"+id).parent().removeClass("has-error has-feedback");
    $("#txt"+id).parent().addClass("has-success has-feedback")
  }

  onBlurUsername(){
    this.mesSucUsername = '';
    this.showBad("Username");
    if (this.username == undefined || this.username == '' ) {
      this.mesErrUsername = "You must enter a username !"
    } else {
      this.authService.checkUserExist({username: this.username}).subscribe(data => {
        if (data.success){
          this.showGood("Username");
          this.mesErrUsername = '';
          this.mesSucUsername = 'You can choose this username !';
        } else {
          this.mesErrUsername = "Username existed. Please fill in another username !";
        }
      });
    }
  }

  onBlurName(){
    if (this.name == undefined || this.name == '' ) {
      this.showBad("Name");
      this.mesErrName = "You must enter a name !"
    }
    else {
      this.showGood("Name");
      this.mesErrName = '';
    }
  }

  onBlurEmail(){
    this.mesSucEmail = '';
    this.showBad("Email");
    if (this.email == undefined || this.email == '' ) {
      this.mesErrEmail = "You must enter an email !"
    } else if (!this.validateService.validateEmail(this.email)) {
      this.mesErrEmail = "Not email. Please use a valid email !";
    } else {
      this.authService.checkUserExist({email: this.email}).subscribe(data => {
        if (data.success){
          this.showGood("Email");
          this.mesErrEmail = '';
          this.mesSucEmail = 'Valid email !';
        } else {
          this.mesErrEmail = "Email existed. Please fill in another email !";
        }
      });
    }
  }

  onBlurPassword(){
    if (this.password == undefined || this.password == '' ) {
      this.showBad("Password");
      this.mesErrPassword = "You must enter a password !"
    } else {
      this.showGood("Password");
      this.mesErrPassword = '';
    }
  }

  onBlurPassword2(){
    this.showBad("Password2");
    if (this.password2 == undefined || this.password2 == '' ) {
      this.mesErrPassword2 = "You must enter a password !"
    } else if (this.password != this.password2) {
      this.mesErrPassword2 = "Oops, that's not the same password !"
    } else {
      this.showGood("Password2");
      this.mesErrPassword2 = '';
    }
  }

  onRegisterSubmit(){
    let user = {
      name: this.name,
      email: this.email,
      username: this.username,
      password: this.password
    }

    // Required Fields
    if(!this.validateService.validateRegister(user)){
      this.flashMessage.show('Please fill in all fields !', {cssClass: 'alert-danger', timeout: 3000});
      return false;
    }

    // Validate Email
    if(!this.validateService.validateEmail(user.email)){
      this.flashMessage.show('Please use a valid email !', {cssClass: 'alert-danger', timeout: 3000});
      return false;
    }

    if (this.password != this.password2) return false;

    // Register user
    this.authService.registerUser(user).subscribe(data => {
      if(data.success){
        this.flashMessage.show('You are now registered successfully and can log in !', {cssClass: 'alert-success', timeout: 3000});
        this.router.navigate(['/login']);
      } else {
        this.flashMessage.show(data.msg, {cssClass: 'alert-danger', timeout: 3000});
        this.router.navigate(['/register']);
      }
    });

  }

}
