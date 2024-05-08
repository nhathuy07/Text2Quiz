import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonCard, IonCardHeader, IonLabel, IonContent, IonGrid } from '@ionic/angular/standalone';
import { Router } from '@angular/router';


import { UserResourceService } from '../user-resource.service';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.page.html',
  styleUrls: ['./callback.page.scss'],
  standalone: true,
  imports: [IonCard, IonCardHeader, IonLabel, IonContent, IonGrid, CommonModule, FormsModule, IonButton]
})
export class CallbackPage implements OnInit {
  public user_msg: string = ""

  constructor(private userResource: UserResourceService, private router: Router) { 

  }

  async ngOnInit() {
    this.userResource.signIn(false).then(
      (access_token) => {
        if (access_token != null) {
          
          this.user_msg = "Login successful. Redirecting..."
          // console.log(access_token)

          setTimeout(() => {
            // Your task to be executed after the delay
            this.router.navigate(['dashboard'])
          }, 30); // Delay in milliseconds


        }
      }
    ).catch(
      () => {this.user_msg = "Invalid session. Please log in again."}
    )
    if (this.userResource.getAccessToken()) {
      this.router.navigate(['dashboard'])
    }
    
    // some quick fixes for an issue where redirection to /dashboard didn't happen

  }

  back_to_login() {
    this.router.navigate(['signin'])
  }


}
