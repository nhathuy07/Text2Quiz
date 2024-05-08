import { Injectable, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { OAuthService } from 'angular-oauth2-oidc';
import { CapacitorHttp } from '@capacitor/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

export interface UserProfile {
  info: {
    name: string
  }
}

export interface UserNoteMetadata {
  id: string;
  name: string;
  subject: string;
}

export interface UserNoteContent {
  name: string;
  subject: string;
  content: string;
  keywords?: Set<string>;
}

@Injectable({
  providedIn: 'root'
})
export class UserResourceService implements OnInit {

  constructor(private readonly oauthService: OAuthService) { 
    // configure the OAuth service
    oauthService.configure({
      issuer: "https://accounts.google.com",
      strictDiscoveryDocumentValidation: false,
      silentRefreshRedirectUri: window.location.origin + '/silent-refresh.html',
      // get the current window's URI /callback page
      redirectUri: `${window.location.origin}/callback`,
      clientId: environment.GAPI_CLIENT_ID,
      scope: 'openid https://www.googleapis.com/auth/drive.appdata',
      oidc: false
    })
  }

  ngOnInit(): void {

  }

  public async signIn(force: boolean): Promise<string | null> {

    
    // init login flow
    // implicit login flow: check if an access-token exist
    await this.oauthService.loadDiscoveryDocument();
    await this.oauthService.tryLoginImplicitFlow();

    console.log(this.oauthService.hasValidAccessToken())

    if (this.oauthService.hasValidAccessToken() && force==false) {
      // Return the access token if valid
      return this.oauthService.getAccessToken();
      
    } else {

      if (!force) {
        if (!confirm("[WARN] Session expired! Log in again?")) {
          return null
        }
      }

      this.oauthService.initLoginFlow();
      this.oauthService.initLoginFlow();
      // Indicate failed access token retrieval (optional)
      return this.oauthService.getAccessToken();
      
    }

  }

  public getAccessToken(): boolean {
    return this.oauthService.hasValidAccessToken()
  }

  public async refreshAccessToken() {
    await this.oauthService.loadDiscoveryDocument();
    this.oauthService.tryLoginImplicitFlow().then(
      () =>{
        this.oauthService.silentRefresh()
      }
    )
    
  }

  public signOut(): void {
  
  }

  public async getNoteByID(id: string): Promise<UserNoteContent> {

    const res_meta = await CapacitorHttp.get({
      url: `https://www.googleapis.com/drive/v3/files/${id}`,
      headers: {'Authorization': `Bearer ${await this.signIn(false)}`}
    })
  
    const res = await CapacitorHttp.get({
      url: `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
      headers: {'Authorization': `Bearer ${await this.signIn(false)}`}
    })


    if (res.status == 200 && res_meta.status == 200) {
      // return res.data.split('\n')[2]
      console.log(res.data.split('\n'))
      return {
        name: res_meta.data.name.split('::')[1].replaceAll('.html',''),
        subject: res_meta.data.name.split('::')[0],
        content: res.data.split('\n')[1],
        keywords: res.data.split('\n')[0].split(', ')
      }

    } else {
      alert( `Fetching content failed (${res.status})`)

      return {
        content: '',
        subject: '',
        name: '',
        keywords: new Set<string>
      }
    }

    // console.log(textContent);
  }

  public async filterNotesBySubject(subject: string): Promise<Array<UserNoteMetadata>> {
    
    let arr = new Array<UserNoteMetadata>();

    await this.refreshAccessToken()
    const res = await CapacitorHttp.get(
      {
        url: "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&mimeType='text/html'",
        headers: {
          "Authorization": `Bearer ${await this.signIn(false)}`
        }
      }
    )
    console.log(res)
    if (res.status == 200) {
      for (let i = 0; i < res.data.files.length; i++) {

        if (!res.data.files[i].name.includes("::")) continue;

        let _subject = res.data.files[i].name.split("::")[0]
        if (subject == '*' || subject == _subject) {
          arr.push({
            name: res.data.files[i].name.split("::")[1].replaceAll('.html',''),
            id: res.data.files[i].id,
            subject: _subject
          })
        }

      }
    
    } else {
      alert(`Loading resource failed! (${res.status})`)
      this.signIn(true)
    }
    return arr
  }

  public async getSubjectFilters(): Promise<Set<string>> {
    await this.refreshAccessToken()
    const res = await CapacitorHttp.get(
      {
        url: "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&mimeType='text/html'",
        headers: {
          "Authorization": `Bearer ${await this.signIn(false)}`
        }
      }
    )
    let returns: Set<string> = new Set<string>()
    if (res.status != 200 ) {return returns};
    for (let i = 0; i < res.data.files.length; i++) {
      try {
        if (res.data.files[i].name.includes('::')) returns.add(res.data.files[i].name.split("::")[0])
      } catch {
        continue
      }

    }
    return returns;
  }

  public createPlan(): boolean {
    return true;
  }

  public updatePlan(): boolean {
    return true;
  }

  public discardPlan(): boolean{
    return true;
  }

  public getPlans(): Array<any> {
    return [];
  }

}
