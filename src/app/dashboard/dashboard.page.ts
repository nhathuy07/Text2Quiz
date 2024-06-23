import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonFabList, IonCheckbox, IonSelect, IonSelectOption, IonRippleEffect, IonPopover, IonButtons, IonModal, IonThumbnail, LoadingController, IonGrid, IonRow, IonCol, IonChip, IonItem, IonIcon, IonFabButton, IonFab, IonButton, IonLabel, IonCardSubtitle, IonCard, IonCardTitle, IonList, IonCardContent, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { Preferences } from '@capacitor/preferences';
import { addIcons } from 'ionicons';

import { Router } from '@angular/router';

import * as ionIcons from 'ionicons/icons'
import { UserNoteContent, UserNoteMetadata, UserResourceService } from '../user-resource.service';

import { ActivatedRoute } from '@angular/router';

import { ElementRef, ViewChild } from '@angular/core';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [ IonFabList, IonCheckbox,IonSelect, IonSelectOption,  IonRippleEffect, IonPopover, IonButtons, IonModal, IonThumbnail, IonGrid, IonRow, IonCol, IonChip, IonItem , IonFabButton, IonFab, IonIcon, IonButton, IonLabel, IonCardContent,  IonCardSubtitle, IonCard, IonList, IonCardTitle, IonCard, IonCardContent, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class DashboardPage implements OnInit {

  // @ts-ignore
  @ViewChild("rtviewer") rtviewer: ElementRef<HTMLDivElement>;

  // @ts-ignore
  @ViewChild("noteOptionsPopover") noteOptionsPopover: HTMLIonPopoverElement;
  // @ts-ignore
  @ViewChild("noteViewerModal") noteViewerModal: HTMLIonPopoverElement;

  public username: string = "debug_user"
  public hasStudyGoal: boolean = false;

  public noteList: Array<UserNoteMetadata> = [];

  public noteViewerModalOpen: boolean =false;

  public isPopoverOpen: boolean = false;

  public isRevisionOptionsShown: boolean = false;

  public currentFilter: string = "*";

  public inferLang: string = "Vietnamese";

  public approxCheck: boolean = false;

  public currentNote: UserNoteMetadata= {
    name: '',
    subject: '',
    id: ''
  }

  public currentNoteContent: UserNoteContent = {
    name: '',
    subject: '',
    content: '',
    keywords:new Set<string>
  }

  public userSubjects: Set<string> = new Set<string>

  constructor( private ar:ActivatedRoute, private rt: Router, private readonly userResource: UserResourceService, private loading_throbber: LoadingController) { 
    // add icons
    addIcons(ionIcons)
  }

  async presentLoading() {
    // Show loading throbber while app loads data
    const loading = await this.loading_throbber.create({
        message: 'Please wait...',
        translucent: true,
        
    });
    await loading.present();
    return loading;
}

  async ionViewWillEnter() {
      // Show loading throbber while app loads data
      const loading = await this.presentLoading();
      try {
        await this.pageInit()
      } catch (error) {
          alert(`Error loading data: ${error}`);
      } finally {
          await loading.dismiss();
      }
  

  }

  async loadNoteInViewerModal(_note: UserNoteMetadata) {
    const loading = await this.presentLoading()
  
    try {
      await this.__loadNoteContent(_note)
    } catch (e) {
      console.error(e) 
    } finally {
      loading.dismiss()
    }

  }

  async __loadNoteContent(_note: UserNoteMetadata) {

    

    this.currentNoteContent.keywords?.clear()

    this.noteViewerModalOpen = true
    this.currentNote = _note;

    this.currentNoteContent = await this.userResource.getNoteByID(_note.id)

    // inject text html to rich-text-viewer div
    this.rtviewer.nativeElement.innerHTML = this.currentNoteContent.content;
  }

  async pageInit() {
    this.username = await this.userResource.getLoggedInUserName()
    this.noteList = await this.userResource.filterNotesBySubject("*")
    this.userSubjects = await this.userResource.getSubjectFilters()
    this.inferLang = "Vietnamese"

    let redir_note_id: string | undefined = undefined

    this.ar.queryParams.subscribe( (v) => {redir_note_id = v["redir_id"]} )

    console.info(redir_note_id)
    if (redir_note_id != undefined) {
      // @ts-ignore
      let f = this.noteList.find((v) => {return v.id == redir_note_id})
      console.log(f)
      // @ts-ignore
      this.loadNoteInViewerModal(f)
    }

  }

  async fetch_access_key(): Promise<String | null> {
    let _x = await Preferences.get({key: "oauth_token"})
    return _x.value;
  }

  async updateSubjectFilter(s: string) {
    this.currentFilter = s
    const loading = await this.presentLoading()

    try {
      this.noteList = await this.userResource.filterNotesBySubject(s)
    } catch (e) {
      alert(`Error caught while loading resource: ${e}`)
    } finally {
      loading.dismiss()
    }

  }

  create_note(auto_redir: boolean = false) {
    this.rt.navigate(["docs-edit", "new", auto_redir])
  }

  upload_note(): boolean {



    return true
  }

  ngOnInit() {
  }


  dismissNoteViewerModal() {
    this.noteViewerModalOpen = false
    this.isRevisionOptionsShown = false
  }

  toggleNoteOptions(show?:boolean) {
    if (show != undefined) {
      this.isPopoverOpen = show
      return
    }
    this.isPopoverOpen = !this.isPopoverOpen
  }

  async handleNoteOptions(action: string|null) {
    this.isPopoverOpen = false
    this.noteOptionsPopover.dismiss()

    // Your task to be executed after the delay
    if (action == "edit") {

      this.dismissNoteViewerModal()

      setTimeout(() => {
        this.rt.navigate(['docs-edit',this.currentNote.id, false])
      }, 30)
      
    } else if (action == 'delete') {

      if (!confirm("Delete this note?")) {
        return;
      }

      let r = await CapacitorHttp.delete({
        url: `https://www.googleapis.com/drive/v3/files/${this.currentNote.id}`,
        headers: {'Authorization': `Bearer ${await this.userResource.signIn(false)}`}
      })
      if (r.status.toString().startsWith('2')) {
        alert("File deleted.")
        this.dismissNoteViewerModal()
        this.pageInit()

      } else {
        alert (`Deletion failed (${r.status})`)
      }
    }
    
  }

  public navigateToGoalSetter() {
    this.rt.navigate(['goal-setter'])
  }

  public toggleRevisionOptions(show:boolean) {
    this.isRevisionOptionsShown = show
  }

  async changeInferenceLang(event: any) {
    this.inferLang = event.detail.value
  }

  async initFlashcardView() {
    // alert(this.currentNoteContent.keywords?.size)
    this.dismissNoteViewerModal()
    console.log(this.currentNoteContent.keywords)
    let id = await this.userResource.writeServerTempFile(this.currentNoteContent.content, "none", this.currentNoteContent.keywords)

    setTimeout(
      () => {this.rt.navigate(['flashcards', id, this.inferLang])},
      30
    )
    
  }

  async initRevisionProcess(approx_check?:boolean, weak_points_only?:boolean) {
    
    if (!weak_points_only) {
      let id = await this.userResource.writeServerTempFile(this.currentNoteContent.content, this.currentNote.name, this.currentNoteContent.keywords)

      this.isPopoverOpen = false
      this.noteViewerModal.dismiss()
    
      setTimeout(() => {
        this.rt.navigate(['revision', id, this.approxCheck, this.inferLang])
      }, 30)
    } else {
      alert('feature coming soon!')
    }
  }

}
