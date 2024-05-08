import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonPopover, IonButtons, IonModal, IonThumbnail, LoadingController, IonGrid, IonRow, IonCol, IonChip, IonItem, IonIcon, IonFabButton, IonFab, IonButton, IonLabel, IonCardSubtitle, IonCard, IonCardTitle, IonList, IonCardContent, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { CapacitorHttp } from '@capacitor/core';
import { GetResult, Preferences } from '@capacitor/preferences';
import { addIcons } from 'ionicons';

import { Router } from '@angular/router';

import * as ionIcons from 'ionicons/icons'
import { UserNoteContent, UserNoteMetadata, UserResourceService } from '../user-resource.service';

import { ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [IonPopover, IonButtons, IonModal, IonThumbnail, IonGrid, IonRow, IonCol, IonChip, IonItem , IonFabButton, IonFab, IonIcon, IonButton, IonLabel, IonCardContent,  IonCardSubtitle, IonCard, IonList, IonCardTitle, IonCard, IonCardContent, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class DashboardPage implements OnInit {

  // @ts-ignore
  @ViewChild("rtviewer") rtviewer: ElementRef<HTMLDivElement>;

  // @ts-ignore
  @ViewChild("noteOptionsPopover") noteOptionsPopover: HTMLIonPopoverElement;

  public username: string = "debug_user"
  public hasStudyGoal: boolean = false;

  public noteList: Array<UserNoteMetadata> = [];

  public noteViewerModalOpen: boolean =false;

  public isPopoverOpen: boolean = false;

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

  constructor(private rt: Router, private readonly userResource: UserResourceService, private loading_throbber: LoadingController) { 
    // add icons
    addIcons(ionIcons)
  }

  async presentLoading() {
    // Show loading throbber while app loads data
    const loading = await this.loading_throbber.create({
        message: 'Please wait...',
        translucent: true
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
    this.noteViewerModalOpen = true
    this.currentNote = _note;

    this.currentNoteContent = await this.userResource.getNoteByID(_note.id)

    // inject text html to rich-text-viewer div
    this.rtviewer.nativeElement.innerHTML = this.currentNoteContent.content;

  }

  async pageInit() {
    this.noteList = await this.userResource.filterNotesBySubject("*")
    this.userSubjects = await this.userResource.getSubjectFilters()
  }

  async fetch_access_key(): Promise<String | null> {
    let _x = await Preferences.get({key: "oauth_token"})
    return _x.value;
  }

  create_note() {
    this.rt.navigate(["docs-edit", "new"])
  }

  upload_note(): boolean {



    return true
  }

  ngOnInit() {
  }


  dismissNoteViewerModal() {
    this.noteViewerModalOpen = false
  }

  toggleNoteOptions(show?:boolean) {
    if (show != undefined) {
      this.isPopoverOpen = show
      return
    }
    this.isPopoverOpen = !this.isPopoverOpen
  }

  handleNoteOptions(action: string|null) {
    this.isPopoverOpen = false
    this.noteOptionsPopover.dismiss()

    // Your task to be executed after the delay
    if (action == "edit") {

      this.dismissNoteViewerModal()

      setTimeout(() => {
        this.rt.navigate(['docs-edit',this.currentNote.id])
      }, 30)
      
    }
    
  }

}
