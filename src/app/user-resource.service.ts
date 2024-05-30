import { Injectable, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { OAuthService } from 'angular-oauth2-oidc';
import { CapacitorHttp } from '@capacitor/core';
import { WeekDay } from '@angular/common';

export interface UserProfile {
  info: {
    name: string
  }
}

export interface UserNoteMetadata {
  id: string;
  name: string;
  subject: string;
  last_percentage?: number;
}

export interface RevisionSummary {
  total: number;
  correct: number;
  retried: number;

  weak_points: string[];
  next_revision_due: number;
  next_revision_due_weak_points: number;
}

export interface UserNoteContent {
  name: string;
  subject: string;
  content: string;
  keywords?: Set<string>;
}

export interface StudyPlan {
  title: string;
  threshold: number;
  filters: Set<string>;
  due?: Date;
  schedule?: WeekDay[];
  recursive: boolean;
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
      // silentRefreshRedirectUri: window.location.origin + '/silent-refresh.html',
      // get the current window's URI /callback page
      redirectUri: `${window.location.origin}/callback`,
      clientId: environment.GAPI_CLIENT_ID,
      scope: 'openid https://www.googleapis.com/auth/drive.appdata',
      oidc: false
    })
  }

  ngOnInit(): void {

  }

  /**
   * Fisher-Yates shuffling algorithm
   * @param {Array<any>} arr input array for shuffling
   * @returns {Array<any>}
   * https://www.geeksforgeeks.org/shuffle-a-given-array-using-fisher-yates-shuffle-algorithm/
   *
  **/
  public _shuffle_list(arr: Array<string>): Array<string> {
    let _a = arr
    for (let i = _a.length - 1; i > 0; i--) 
      { 
          // Pick a random index from 0 to i 
          let j = Math.floor(Math.random() * i);
   
          // Swap arr[i] with the element 
          // at random index 
          [_a[i], _a[j]] = [_a[j], _a[i]];
      }
    return _a
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

      let __delim_pos = res.data.indexOf('\n')

      return {
        name: res_meta.data.name.split('::')[1].replaceAll('.html',''),
        subject: res_meta.data.name.split('::',1)[0],
        content: res.data.substring(__delim_pos+1),
        keywords: new Set<string>(res.data.substring(0,__delim_pos).split(','))
      }

    } else {
      alert( `Fetching content failed (${res.status})`)

      return {
        content: '',
        subject: '',
        name: '',
        keywords: new Set<string>()
      }
    }

    // console.log(textContent);
  }

  public async filterNotesBySubject(subject: string): Promise<Array<UserNoteMetadata>> {
    
    let arr = new Array<UserNoteMetadata>();

    // await this.refreshAccessToken()
    const res = await CapacitorHttp.get(
      {
        url: "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=mimeType = 'text/html'",
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
    // await this.refreshAccessToken()
    const res = await CapacitorHttp.get(
      {
        url: "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=mimeType = 'text/html'",
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

  public async writeServerTempFile(content: any, title: string, keywords?: Set<string>): Promise<string | null> {
    console.log(keywords)
    const r = await CapacitorHttp.post(
      {
        url: `http://${environment.BACKEND_LOC}/temp/`,
        data: {
          'content': content,
          'title': title,
          'keywords': Array.from(keywords?keywords:[])
        }
      }
    )
    return r.data
  }

  public async readServerTempFile(id: string): Promise<any[]> {
    const r = await CapacitorHttp.get(
      {
        url: `http://${environment.BACKEND_LOC}/temp/${id}`,
        // params: {'id': id}
      }
    )
    // title,content,keywords
    if (r.status != 200) {
      return [null, null, null]
    }
    return r.data
  }

  public async logRevisionResult(title:string, summary: RevisionSummary):Promise<boolean> {
    
    // check if result already exists
    const check_res =await CapacitorHttp.get(
      {
        url: `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name = '${title}.last'`,
        headers: {
          "Content-Type": "multipart/related; boundary=ENDPART",
          // @ts-ignore
          "Authorization": `Bearer ${await this.signIn(false)}`
        },
      }
    )

    let exist = ""

    try
      {if (check_res.data.files[0].name == `${title}.last`) {
        exist = check_res.data.files[0].id
      }}
    catch (e) {
      
    }
    

    const request_body: string[] = [
      "--ENDPART",
      "Content-Type: application/json; encoding=utf-8",
      "",
      JSON.stringify({
        "name": `${title}.last`,
        "mimeType": "application/json; encoding=utf-8",
        "parents": ["appDataFolder"],
      }),
      "\n--ENDPART\n",
      JSON.stringify({
        "date": Date.now(),
        "total": summary.total,
        "correct": summary.correct,
        "weak_points": summary.weak_points,
        "next_revision_due": summary.next_revision_due,
        "retried": summary.retried
        // "next_revision_due_weak_points": summary.next_revision_due_weak_points
      }),
      "\n--ENDPART--\n"
    ]

    console.log(check_res.data)

    if (exist == '') {
      const res = CapacitorHttp.post(
        {
          url: "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
          headers: {
            "Content-Type": "multipart/related; boundary=ENDPART",
            // @ts-ignore
            "Authorization": `Bearer ${await this.signIn(false)}`
          },
          data: request_body.join("\n")
        }
      )
    } else {
      const res = CapacitorHttp.patch(
        {
          url: `https://www.googleapis.com/upload/drive/v3/files/${exist}`,
          headers: {
            "Content-Type": "multipart/related; boundary=ENDPART",
            // @ts-ignore
            "Authorization": `Bearer ${await this.signIn(false)}`
          },
          data: request_body.join("\n")
        }
      )
    }


    return true
    // return ((await res).status == 200)

  }

  public async createPlan(plan: StudyPlan): Promise<boolean> {
    
    const request_body: string[] = [
      "--ENDPART",
      "Content-Type: application/json; encoding=utf-8",
      "",
      JSON.stringify({
        "name": `${plan.title}.plan.json`,
        "mimeType": "application/json",
        "parents": ["appDataFolder"],
      }),
      "\n--ENDPART\n",
      JSON.stringify({
        "filters": plan.filters,
        "threshold": plan.threshold,
        "due": plan.due,
        "schedule":plan.schedule,
        "recursive": plan.recursive
      }),
      "--ENDPART--"
    ]

    console.log(request_body)

    const r = await CapacitorHttp.post(
      {
        url: "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        headers: {
          "Content-Type": "multipart/related; boundary=ENDPART",
          // @ts-ignore
          "Authorization": `Bearer ${await this.signIn(false)}`
        },
        data: request_body.join("\n")
      }
    )

    if (r.status == 200) return true;
    else return false;
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
