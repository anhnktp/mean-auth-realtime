import { Component, OnInit } from '@angular/core';
import { ValidateService } from '../../services/validate.service';
import { AuthService } from '../../services/auth.service';
import { FlashMessagesService } from 'angular2-flash-messages';
declare var $:any;
@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.css']
})
export class ForgotComponent implements OnInit {
  email: String;
  mesErrEmail : String;
  mesSucEmail: String;

  constructor(private validateService: ValidateService,
              private flashMessage:FlashMessagesService,
              private authService:AuthService) { }

  ngOnInit() {
    $("#goodEmail").hide();
    $("#badEmail").hide();
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

  onBlurEmail(){
    this.mesSucEmail = '';
    this.showBad("Email");
    if (this.email == undefined || this.email == '' ) {
      this.mesErrEmail = "You must enter an email !";
    } else if (!this.validateService.validateEmail(this.email)) {
      this.mesErrEmail = "Not email. Please use a valid email !";
    } else {
      this.authService.checkUserExist({email: this.email}).subscribe(data => {
        if (!data.success){
          this.showGood("Email");
          this.mesErrEmail = '';
          this.mesSucEmail = 'Valid email !';
        } else {
          this.mesErrEmail = "Email not existed. Please fill in another email !";
        }
      });
    }
  }

  onForgotSubmit(){
    if(!this.validateService.validateEmail(this.email)){
      this.flashMessage.show('Please use a valid email !', {cssClass: 'alert-danger', timeout: 3000});
      return false;
    }
    this.authService.forgotPasswordUser({email: this.email}).subscribe(data => {
      if(data.success){
        this.flashMessage.show('An email has been sent to '+this.email+' with further instruction !', {cssClass: 'alert-success', timeout: 5000});
      } else {
        this.flashMessage.show(data.msg, {cssClass: 'alert-danger', timeout: 3000});
      }
    });
  }
}
