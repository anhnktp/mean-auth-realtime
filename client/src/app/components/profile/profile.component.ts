import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FlashMessagesService } from 'angular2-flash-messages';
import { NavbarComponent } from '../navbar/navbar.component';
import { ValidateService } from '../../services/validate.service';
import { trigger,state,style,animate,transition} from '@angular/animations';

declare var $:any;

@Component({
  selector: 'app-profile',
  animations: [
   trigger('verticalSlide', [
     state('void', style({
       transform: 'translateY(-20%)'
     })),
     state('*',   style({
       transform: 'translateY(0)'
     })),
     transition('void => *', animate(300)),
     transition('* => void', animate(100)),
   ]),
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})

export class ProfileComponent implements OnInit {
  username: String;
  name: String;
  email: String;
  tempName: String;
  tempEmail : String;
  role: String;
  password : String;
  mesErrPassword : String;
  newPassword : String;
  mesErrNewPassword : String;
  confirmPassword : String;
  mesErrConfirmPassword : String;
  ok:boolean;
  imageSocialUrl: string;
  imageLocalArray = [];
  filesToUpload: Array<File> = [];
  isOpenPopover = false;
  tempIncrementNumber = 0;
  changeAvatar = 'Change avatar';
  displayImageID: string; // ảnh hiện tại khi slide ảnh, là ảnh thứ 4 trong modal
  displayImageLocalArray = [];
  pickedImageIndex = 0;
  typeAccount: String;

  constructor(private authService:AuthService,
              private flashMessage:FlashMessagesService,
              private validateService: ValidateService,
              private router:Router,
              private navbarComponent: NavbarComponent) { }

  ngOnInit() {
    this.authService.getProfile().subscribe(profile => {
      this.username = profile.username;
      this.name = profile.name;
      this.email = profile.email;
      this.role = profile.role;
      this.imageSocialUrl = profile.avatar.path_social;
      this.imageLocalArray = profile.avatar.local.image;
      this.displayImageID = profile.avatar.local.displayImageID; //ObjectId cua image array
      this.setTypeAccount(profile);
      this.setAvatarFirst(profile.avatar.displayImageType); // set avatar khi vào profile
      this.setSlideAvatar();
      this.navbarComponent.setSmallProfileImage();
    },
    err => {
      console.log(err);
      return false;
    });
  }

  setTypeAccount(profile){
    if(profile.facebook.id){
      this.typeAccount = 'Facebook'
    }
    else if(profile.google.id){
      this.typeAccount = 'Google'
    }
    else {
      this.typeAccount = 'local'
    }
  }
  // load 4 ảnh gần nhất lên đầu tiên trong slide show
  setSlideAvatar(){
     let temp = 0;
     let arr_length = this.imageLocalArray.length;
     for(let i = arr_length - 4;i < arr_length ; i++){
       if(i < 0){
         i = 0;
       }
       this.displayImageLocalArray[temp] = this.imageLocalArray[i];
       Object.assign(this.displayImageLocalArray[temp],{_index: i});
       temp++;
     }
   }

  toElemIndex(ObjectID){
    for(let i = 0;i < this.imageLocalArray.length ; i++){
      if(ObjectID == this.imageLocalArray[i]._id){
        return i;
      }
    }
  }

  setAvatarFirst(displayImageType){
    if(displayImageType == 'social'){
      document.getElementById('img-avatar').setAttribute( 'src',this.imageSocialUrl);
    }
    if(displayImageType == 'local'){
      document.getElementById('img-avatar').setAttribute( 'src',this.imageLocalArray[this.toElemIndex(this.displayImageID)].path_local);
    }
  }

  uploadNewAvatar(event) {
      this.filesToUpload = <Array<File>>event.target.files
      const formData: any = new FormData();
      const files: Array<File> = this.filesToUpload;
      formData.append('upload',files[0]);
      this.authService.uploadImage(formData).subscribe(file => {
        if(file.success){
            let newImage = file.base64ImageData;
            document.getElementById('img-avatar').setAttribute( 'src',file.base64ImageData);
            this.imageLocalArray.push({path_local: newImage, _id: file.imageID})
            this.setSlideAvatar();
            this.displayImageID = file.imageID;
            this.flashMessage.show('Updated your avatar', {cssClass: 'alert-success', timeout: 3000});
            this.setNavbarImage(newImage);
        } else {
            this.flashMessage.show(file.msg,{cssClass: 'alert-danger', timeout: 2000});
        }
     })
  }

  onBlurPassword(){
    if (this.password == '' ) {
      this.mesErrPassword= "You must enter current password !";
      $("#password").show();
    } else {
      this.authService.checkComparePassword({password: this.password}).subscribe(data => {
        if (data.success) $("#password").hide();
        else {
          this.mesErrPassword = "Password is not correct !";
          $("#password").show();
        }
      });
    }
 }

  onBlurNewPassword(){
    if (this.newPassword == '' ) {
      this.mesErrNewPassword= "You must enter new password !";
      $("#newPassword").show();
    } else if (this.confirmPassword != '' && this.newPassword != this.confirmPassword){
      this.mesErrConfirmPassword= "Oops, that's not the same password !";
      $("#confirmPassword").show();
    }
    else $("#newPassword").hide();
  }

  onBlurConfirmPassword(){
    if (this.confirmPassword == '' ) {
      this.mesErrConfirmPassword= "You must enter confirm password!";
      $("#confirmPassword").show();
    } else if (this.newPassword == '') $("#confirmPassword").hide();
    else if (this.newPassword != this.confirmPassword){
      this.mesErrConfirmPassword= "Oops, that's not the same password !";
      $("#confirmPassword").show();
    } else $("#confirmPassword").hide();
  }

  openEditProfileModal() {
    this.tempName = this.name;
    this.tempEmail = this.email;
    $("#editProfileModal").modal();
  }

  openChangePasswordModal() {
    this.password = '';
    this.newPassword = '';
    this.confirmPassword = '';
    $("#password").hide();
    $("#newPassword").hide();
    $("#confirmPassword").hide();
    $("#changePasswordModal").modal();
  }

  openChangeLocalAvatarModal(){
    $("#changeLocalAvatarModal").modal();
  }

  setAvaSocial(){
     let newImage = this.imageSocialUrl;
     document.getElementById('img-avatar').setAttribute( 'src',newImage);
     this.authService.editProfileAvatar({displayImageType: 'social', editType: 'EDIT_CURRENT_AVATAR'}).subscribe(data =>{
       });
     this.setNavbarImage(newImage)
   }

   setAvaLocal(_index){
     let newImage = this.displayImageLocalArray[this.pickedImageIndex].path_local;
     document.getElementById('img-avatar').setAttribute( 'src',newImage);
     this.displayImageID = this.imageLocalArray[_index]._id;
     this.authService.editProfileAvatar({displayImageType: 'local',displayImageID: this.displayImageID,  editType: 'EDIT_CURRENT_AVATAR'}).subscribe(data =>{});
     this.setNavbarImage(newImage);
   }

   setNavbarImage(newImage){
      document.getElementById('small-image').setAttribute('src',newImage);
      localStorage.setItem('currentProfileImage',newImage);
   }

   onClickOpenModalImage(attributeName,valueName){
   let img = $("["+attributeName+" = "+valueName+"]")
   let modal = document.getElementById('viewAvatarModal');
   let modalImg = document.getElementById('img01');
   modal.style.display = "block";
   modalImg.setAttribute('src',img.attr('src'));
   $("#changeLocalAvatarModal").modal('hide')
   }

   onClickChooseImage(i){
    $('[_index ='+i+']').css('border', '5px solid green')
    $('[_index !='+i+']').css('border', 'none')
    this.pickedImageIndex = i;
   }

   onClickUpdateLocalAvatar(){
    this.setAvaLocal(this.displayImageLocalArray[this.pickedImageIndex]._index);
   }

   onClickNextButton(){
     let lastElement = this.displayImageLocalArray[this.displayImageLocalArray.length - 1];
     if(this.imageLocalArray.length > 4 && lastElement._index < this.imageLocalArray.length - 1){
       this.displayImageLocalArray.push(this.imageLocalArray[lastElement._index + 1]);
       this.displayImageLocalArray.splice(0,1);
       Object.assign(this.displayImageLocalArray[3],{_index: lastElement._index + 1})
     }
   }

   onClickPrevButton(){
      let firstElement = this.displayImageLocalArray[0];
      if(this.imageLocalArray.length > 4 && firstElement._index > 0){
        this.displayImageLocalArray.splice(this.displayImageLocalArray.length - 1,1);
        this.displayImageLocalArray.unshift(this.imageLocalArray[firstElement._index - 1]);
        Object.assign(this.displayImageLocalArray[0],{_index: firstElement._index - 1})
      }
   }

  openPopover(){
    this.tempIncrementNumber++;
    if((this.tempIncrementNumber % 2) !== 0) {
      this.isOpenPopover = true;
      this.changeAvatar = 'Close'
    } else {
      this.isOpenPopover = false;
      this.changeAvatar = 'Change avatar'
    }
  }

  onClickDeleteAvatar(){
    let indexPickedElem = this.displayImageLocalArray[this.pickedImageIndex]._index
    let avaInfo = {
      editType: 'DELETE_AVATAR',
      deleteImageID: this.imageLocalArray[indexPickedElem]._id
    }
    if(avaInfo.deleteImageID == this.imageLocalArray[0]._id || avaInfo.deleteImageID == this.displayImageID){
      $("#changeLocalAvatarModal").modal('hide')
      this.flashMessage.show('Cannot delete default avatar or current avatar',{cssClass: 'alert-danger', timeout: 3000})
    } else{
      this.authService.editProfileAvatar(avaInfo).subscribe(data => {}) // chinh sua tren server
      let deleteElement = this.displayImageLocalArray[this.pickedImageIndex];
      this.displayImageLocalArray.splice(this.pickedImageIndex,1);
      this.imageLocalArray.splice(deleteElement._index,1);
      this.setSlideAvatar();
    }
  }

  check(){
    this.authService.checkComparePassword({password: this.password}).subscribe(data => {
      if (data.success){
        $("#password").hide();
        this.ok = true;
      } else {
        this.mesErrPassword = "Password is not correct !";
        $("#password").show();
        this.ok = false;
      }
    });
  }

  changePassword(){
    if (this.password == '' || this.newPassword == '' || this.confirmPassword == '') {
      $("#changePasswordModal").modal("hide");
      this.flashMessage.show('Please fill in all fields !', {cssClass: 'alert-danger', timeout: 3000});
      return false;
    }
    this.check();
    if (this.newPassword != this.confirmPassword) {
      this.mesErrConfirmPassword= "Oops, that's not the same password !";
      $("#confirmPassword").show();
      return false;
    }
    if (!this.ok) return false;
    this.authService.changePasswordUser({password: this.newPassword}).subscribe(data => {
        if(data.success){
          this.flashMessage.show('Changed password successfully !', {cssClass: 'alert-success', timeout: 3000});
        } else {
          this.flashMessage.show('Changed password failed !', {cssClass: 'alert-danger', timeout: 3000});
        }
      });
    $("#changePasswordModal").modal("hide");
  }

  editProfile(){
    if (this.tempName == '' || this.tempEmail == '') {
      this.flashMessage.show('Please fill in all fields !', {cssClass: 'alert-danger', timeout: 3000});
      return false;
    }
    if (!this.validateService.validateEmail(this.tempEmail)){
      this.flashMessage.show('Please use a valid email !', {cssClass: 'alert-danger', timeout: 3000});
      return false;
    }
    let user = {
      name: this.tempName,
      email: this.tempEmail,
    }
    this.authService.editProfile(user).subscribe(data => {
        if (data.success){
          this.flashMessage.show('Profile has been updated !', {cssClass: 'alert-success', timeout: 3000});
          this.name = this.tempName;
          this.email = this.tempEmail;
        } else {
          this.flashMessage.show(data.msg, {cssClass: 'alert-danger', timeout: 3000});
          return false;
        }
    })
  }
}
