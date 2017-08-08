import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from  '@angular/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { HomeComponent } from './components/home/home.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { ForgotComponent } from './components/forgot/forgot.component';
import { ResetComponent } from './components/reset/reset.component';

import { ValidateService } from './services/validate.service';
import { AuthService } from './services/auth.service';
import { CrudService } from './services/crud.service';
import { FlashMessagesModule } from 'angular2-flash-messages';
import { ToasterModule } from 'angular2-toaster';
import { AuthGuard } from './guards/auth.guard';
import { FilterPipe } from './filter/filter.pipe';


const appRoutes: Routes = [
  {path:'', component: HomeComponent},
  {path:'register', component: RegisterComponent},
  {path:'login', component: LoginComponent},
  {path:'dashboard', component: DashboardComponent, canActivate:[AuthGuard]},
  {path:'profile', component: ProfileComponent, canActivate:[AuthGuard]},
  {path:'forgot', component: ForgotComponent},
  {path:'reset/:token', component: ResetComponent}
];

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    LoginComponent,
    RegisterComponent,
    HomeComponent,
    DashboardComponent,
    ProfileComponent,
    ForgotComponent,
    FilterPipe,
    ResetComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpModule,
    RouterModule.forRoot(appRoutes),
    FlashMessagesModule,
    ToasterModule
  ],
  providers: [ValidateService, AuthService, AuthGuard, FilterPipe, CrudService, NavbarComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
