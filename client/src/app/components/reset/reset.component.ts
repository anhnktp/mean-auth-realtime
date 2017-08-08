import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FlashMessagesService } from 'angular2-flash-messages';

@Component({
  selector: 'app-reset',
  templateUrl: './reset.component.html',
  styleUrls: ['./reset.component.css']
})
export class ResetComponent implements OnInit {
  token: String;
  constructor(private route: ActivatedRoute,
              private router:Router,
              private authService:AuthService,
              private flashMessage:FlashMessagesService ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.token = params['token'];
      this.authService.resetPasswordUser(this.token).subscribe(data => {
        if (data.success) {
          this.flashMessage.show('New password has sent to your email !', {
            cssClass: 'alert-success',
            timeout: 10000});
        } else this.router.navigate(['/']);
      })
    });
  }
}
