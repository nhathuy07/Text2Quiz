import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon, IonGrid, IonRow, IonCol,IonButton, IonLabel, IonCard, IonCardTitle, IonCardContent, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import * as ionIcons from "ionicons/icons";
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-goal-setter',
  templateUrl: './goal-setter.page.html',
  styleUrls: ['./goal-setter.page.scss'],
  standalone: true,
  imports: [IonIcon, IonGrid,IonRow,IonCol,IonLabel, IonButton, IonCardContent, IonCardTitle, IonCard, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class GoalSetterPage implements OnInit {

  constructor() { }

  ngOnInit() {
    addIcons(ionIcons)
  }

}
