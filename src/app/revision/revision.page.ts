import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonImg, IonProgressBar, IonCard, IonCardContent, IonCardSubtitle, IonCardTitle, IonButtons, IonButton, IonGrid, IonRow, IonIcon, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import * as ionIcons from 'ionicons/icons'

@Component({
  selector: 'app-revision',
  templateUrl: './revision.page.html',
  styleUrls: ['./revision.page.scss'],
  standalone: true,
  imports: [IonImg, IonProgressBar, IonCard,  IonCardContent, IonCardSubtitle, IonCardTitle, IonButtons, IonButton, IonGrid, IonRow, IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class RevisionPage implements OnInit {

  public q_index: number = 0;
  private paragraph_index: number = 0;
  public question: string = "";
  public possible_choices: Array<string> = [];
  public user_answers: Array<string> = [];
  public correct_answers: Array<string> = [];

  private correct_qs_by_paragraph: Array<number> = [];
  private num_qs_by_paragraph: Array<number> = [];

  constructor() { }

  ngOnInit() {
    addIcons(ionIcons);
  }

}
