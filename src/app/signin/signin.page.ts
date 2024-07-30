import { Component, OnInit, afterRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { CapacitorHttp, HttpResponse } from '@capacitor/core'
import { AlertController, IonImg, IonGrid, IonRow, IonCol, IonCardTitle, IonCardContent, IonCardSubtitle, IonLabel, IonCard, IonButton, IonSegmentButton, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { UserResourceService } from '../user-resource.service';
import { Router } from '@angular/router';

import {TranslateModule, TranslateService} from '@ngx-translate/core';
import { Preferences } from '@capacitor/preferences';

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
    private translate: TranslateService,
    private alertCtrl: AlertController
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

    const {value} = await  Preferences.get({key: 'permissionAdequate'})

    if (value == 'true') {
      this.userResource.signIn(true)
    } 
    else {
      const permissionPrompt = await this.alertCtrl.create(
      {
        header: this.translate.instant('permissionPrompt'),
        subHeader: this.translate.instant('permissionPurpose'),
        message: this.translate.instant('permissionAccessDriveAppdata'),
        buttons: [
          {text: this.translate.instant('continue'), role: 'confirm', handler: () => {console.log(this.userResource.signIn(true))}},
          {text: this.translate.instant('cancel'), role: 'cancel', handler: () => {permissionPrompt.dismiss()}}
        ]
      }
    )

    permissionPrompt.present()
  }
  }

}
