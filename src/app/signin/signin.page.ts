import { Component, OnInit, afterRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { CapacitorHttp, HttpResponse } from '@capacitor/core'
import { IonImg, IonGrid, IonRow, IonCol, IonCardTitle, IonCardContent, IonCardSubtitle, IonLabel, IonCard, IonButton, IonSegmentButton, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { UserResourceService } from '../user-resource.service';
import { Router } from '@angular/router';

import {TranslateModule, TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
  standalone: true,
  imports: [TranslateModule, IonImg, IonGrid, IonRow, IonCol, IonCardTitle, IonCardContent, IonCardSubtitle, IonLabel, IonCard, IonButton, IonSegmentButton,IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})

export class SigninPage implements OnInit {

  constructor(
    private router: Router,  
    private userResource: UserResourceService,
    private translate: TranslateService
  ) { 
    // if (this.userResource.getAccessToken()) {
    //   this.router.navigate(['dashboard'])
    //  }
  }
  
  ngOnInit() {

   this.translate.use(this.translate.getBrowserLang() ? this.translate.getBrowserLang() as string : "en")

   if (this.userResource.getAccessToken() == true) {
    this.router.navigate(['dashboard'])
   }
  }

  

  async google_authenticate() {
    console.log(this.userResource.signIn(false))
  }
  
  // get_google_oauth_url(client_id: string, redirect_uri: string, scope: Array<string>): string {
  //   return encodeURI(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope.join(" ")}&response_type=token`)
  // }
}
