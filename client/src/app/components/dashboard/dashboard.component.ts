import { Component, OnInit, OnDestroy } from '@angular/core';
import { ValidateService } from '../../services/validate.service';
import { AuthService } from '../../services/auth.service';
import { CrudService } from '../../services/crud.service';
import { Pipe, PipeTransform } from '@angular/core';
import { FlashMessagesService } from 'angular2-flash-messages';
import { ToasterService, ToasterConfig } from 'angular2-toaster';
import { NavbarComponent } from '../navbar/navbar.component';
declare var $:any;

@Component({
  moduleId: module.id,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  userslist = [];
  temp : number;
  username : String;
  name : String;
  email : String;
  role : String;
  password : String;
  roleUser : String;
  connection;
  user : any;

  public config1 : ToasterConfig = new ToasterConfig({
   positionClass: 'toast-top-right',
   limit:5,
   timeout: 3000
  });

  constructor(private authService: AuthService,
              private crudService: CrudService,
              private flashMessage:FlashMessagesService,
              private toasterService: ToasterService,
              private validateService: ValidateService,
              private navbarComponent: NavbarComponent) {}

  ngOnInit() {
    this.navbarComponent.setSmallProfileImage();
    this.authService.getAllUser().subscribe(data => {
      if (data.success){
        this.userslist = data.all;
        this.user = data.profile
      } else {
        this.flashMessage.show(data.msg, {cssClass: 'alert-danger', timeout: 3000});
      }
    });
    this.roleUser = JSON.parse(localStorage.getItem('user')).role;
    this.temp = 0;
    this.connection = this.crudService.getChange().subscribe(data => {
      if (data.type == 'add') {
         for (let j in this.user.permission) {
           if (this.user.permission[j].action == 'read' && this.user.permission[j].appliedTo == data.user.role) {
             this.userslist.push(data.user);
             this.toasterService.pop({type: 'info', title: "#"+(this.userslist.length)+" has just added by another !"});
             return false;
           }
         }
      }
      for(let i in this.userslist) {
        if (data.type == 'edit' && this.userslist[i]._id == data.id) {
          this.updateEdit(i,data.name,data.email,data.role);
          this.toasterService.pop({type: 'info', title: "#"+(parseInt(i)+1)+" has just edited by another !"});
          return false;
        }
        if (data.type == 'delete' && this.userslist[i]._id == data.id ) {
          this.userslist.splice(parseInt(i),1);
          this.toasterService.pop({type: 'info', title: "#"+(parseInt(i)+1)+" has just deleted by another !"});
          return false;
        }
      }
    })
  }

  updateEdit(i,name,email,role){
    this.userslist[i].name = name;
    this.userslist[i].email = email;
    this.userslist[i].role = role;
  }

  ngOnDestroy() {
    this.connection.unsubscribe();
  }

  openAddModal(){
    this.username = undefined;
    this.name = undefined;
    this.password = undefined;
    this.email = undefined;
    this.role = "Normal User";
    if (this.roleUser != "Admin") {
      $('.optRole').prop('disabled', true);
    } else $('.optRole').prop('disabled', false);
    $("#addModal").modal();
  }

  openInfoModal(indexOfList) {
    this.temp = indexOfList;
    $("#infoModal").modal();
  }

  openEditModal(indexOfList) {
    this.temp = indexOfList;
    this.name = this.userslist[this.temp].name;
    this.email = this.userslist[this.temp].email;
    this.role = this.userslist[this.temp].role;
    if (this.role == "Admin" || this.roleUser != "Admin") {
      $('.optRole').prop('disabled', true);
    } else $('.optRole').prop('disabled', false);
    $("#editModal").modal();
  }

  openDeleteModal(indexOfList) {
    this.temp = indexOfList;
    $("#deleteModal").modal();
  }

  openResetModal(indexOfList) {
    this.temp = indexOfList;
    $("#resetModal").modal();
  }

  reset(){
    this.authService.resetUserByAdmin(this.userslist[this.temp]._id).subscribe(data => {
      if(data.success){
        this.flashMessage.show('Reset password successfully !', {cssClass: 'alert-success', timeout: 3000});
      } else {
        this.flashMessage.show(data.msg, {cssClass: 'alert-danger', timeout: 3000});
        return false;
      }
    });
  }

  delete(){
    this.authService.deleteUser(this.userslist[this.temp]._id).subscribe(data => {
      if(data.success){
        this.flashMessage.show('User has been removed !', {cssClass: 'alert-success', timeout: 3000});
        this.crudService.sendChange({type: 'delete', id: this.userslist[this.temp]._id})
        this.userslist.splice(this.temp,1);
        this.temp = 0;
      } else {
        this.flashMessage.show(data.msg, {cssClass: 'alert-danger', timeout: 3000});
        return false;
      }
    });
  }

  add(){
    let user = {
      name: this.name,
      email: this.email,
      username: this.username,
      password: this.password,
      role : this.role
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

    // Register user
    this.authService.addUser(user).subscribe(data => {
      if(data.success){
        this.flashMessage.show(data.msg, {cssClass: 'alert-success', timeout: 3000});
        this.crudService.sendChange({type: 'add', user: user})
        this.userslist.push(user);
      } else {
        this.flashMessage.show(data.msg, {cssClass: 'alert-danger', timeout: 3000});
        return false;
      }
    });
  }

  edit(){
    let user = {
    name: this.name,
    email: this.email,
    role: this.role
    }
    if (user.name == '' || user.email == '') {
      this.flashMessage.show('Please fill in all fields !', {cssClass: 'alert-danger', timeout: 3000});
      return false;
    }
    if (!this.validateService.validateEmail(user.email)){
      this.flashMessage.show('Please use a valid email !', {cssClass: 'alert-danger', timeout: 3000});
      return false;
    }
    this.authService.editUser(this.userslist[this.temp]._id,user).subscribe(data => {
        if (data.success){
          this.flashMessage.show('User has been edited !', {cssClass: 'alert-success', timeout: 3000});
          this.crudService.sendChange({type: 'edit', id: this.userslist[this.temp]._id, name: this.name, email: this.email, role: this.role})
          this.updateEdit(this.temp,this.name,this.email,this.role);
        } else {
          this.flashMessage.show(data.msg, {cssClass: 'alert-danger', timeout: 3000});
          return false;
        }
    })
  }

  updatePermissionAllUser(){
    this.authService.updatePermissionAllUser().subscribe(data => {
      if(data.success){
        this.flashMessage.show(data.msg, {cssClass: 'alert-success', timeout: 3000});
      }
    })
  }
}
