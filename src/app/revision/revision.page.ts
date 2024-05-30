import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonChip, IonAvatar, IonModal, IonTextarea, IonInput, IonLabel, IonReorderGroup, IonReorder, IonList, IonItem, IonCheckbox, IonImg, IonProgressBar, IonCard, IonCardContent, IonCardSubtitle, IonCardTitle, IonButtons, IonButton, IonGrid, IonRow, IonIcon, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import * as ionIcons from 'ionicons/icons'

import {ItemReorderEventDetail} from '@ionic/angular'

import { RevisionSummary, UserResourceService } from '../user-resource.service'
import { ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CapacitorHttp } from '@capacitor/core';
import { environment } from 'src/environments/environment';


export interface QuesitionState {
  id: number;
  response: Array<string>;
  correct: boolean | null;
  tried_again?: boolean;
  time_elapsed?: number;
  
}

export interface Question {
  pgph_i: number;
  prompt: string;
  type: "MCQ" | "MULT" | "ARRANGE" | "OPEN" | "AMEND";
  choices: Array<string>;
  keys: Array<string>;
  resource_uri?: string;
}

export interface MultChoiceState {
  stmt: string;
  checked: boolean;
}

export interface Paragraph {
  content: string;
  header: string;
}

@Component({
  selector: 'app-revision',
  templateUrl: './revision.page.html',
  styleUrls: ['./revision.page.scss'],
  standalone: true,
  imports: [IonChip, IonAvatar, IonModal, IonTextarea, IonInput, IonLabel, IonReorder, IonReorderGroup, IonList, IonItem, IonCheckbox, IonImg, IonProgressBar, IonCard,  IonCardContent, IonCardSubtitle, IonCardTitle, IonButtons, IonButton, IonGrid, IonRow, IonIcon, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class RevisionPage implements OnInit {
  
  // @ts-ignore
  @ViewChild("revisionSummary") revisionSummary: HTMLIonModalElement

  public paragraphs: Array<Paragraph> = [];
  public questions: Array<Question> = [
  ];

  public q_states: Array<QuesitionState> = [];
  public cur_state: QuesitionState;

  public revision_finished: boolean = false;

  // For MULTIPLE CORRECT CHOICES question type
  public __mult_ret: Array<MultChoiceState> = []

  // For REARRANGE question type
  public __arrange_ret: Array<string> = []

  public prog_bar_color: "success" | "danger" | "secondary" = "secondary"

  public revision_progress: number = 0
  public finished_loading: boolean

  private n_title: string = ""
  private n_content: any = {}
  private n_id: string = ""
  private n_lang: string=""

  public summary: RevisionSummary = {
    next_revision_due: 0,
    next_revision_due_weak_points: 0,
    total: 0,
    correct: 0,
    retried: 0,
    weak_points: []
  }

  public acceptable_thresh = 0.8

  constructor(private readonly userResource: UserResourceService, private ar: ActivatedRoute, private rt: Router) { 
    // Init variables
    this.finished_loading = false;
    this.cur_state = {
      id: 0, response: [], correct: null, tried_again: false
    }
  }

  // Run when Revision page is accessed
  async ionViewDidEnter() {
    await this.pageInit()
    this.finished_loading = true;
  }

  // Init quiz interface
  async pageInit() {

    // this.userResource.readServerTempFile(_id)

    // this.revision_finished = true

    for (let i = 0; i < this.questions.length; i++) {
      this.q_states.push({id: i, response: [], correct:null, tried_again:false})
    }

    this.cur_state = {
      id: 0, response: [], correct: null, tried_again: false
    }

    await this.loadQuizContent()

    this.loadQuestion()
  }

  async loadQuizContent() {
    // let __id = ""
    this.ar.params.subscribe(
      (params: any) => {
        this.n_id = params["id"];
        this.n_lang = params["lang"]
      }
    )
    // console.log(__i)

    let n_file = await this.userResource.readServerTempFile(this.n_id)
    this.n_title = n_file[0]

    const _r = await CapacitorHttp.get({url: `http://${environment.BACKEND_LOC}/generateQuiz/${this.n_id}/${this.n_lang}`})
    for (let i = 0; i < _r.data.questions.length; i++) {

      this.questions.push( JSON.parse(JSON.stringify(_r.data.questions[i])) as Question)
      // console.log(JSON.parse(JSON.stringify(_r.data.questions[i])))
    }
    // this.n_content = _r.data.paragraphs

    for (let i = 0; i < _r.data.paragraphs.length; i++) {
      this.paragraphs.push( _r.data.paragraphs[i] as Paragraph )
    }

    if (_r.status != 200) {
      alert(`Fetching resource failed (${_r.status})`)
      this.rt.navigate(['dashboard'])
    }

    console.log(this.paragraphs)
    
  }

  loadQuestion() {
    this.prog_bar_color = "secondary"

    switch (this.questions[this.cur_state.id].type) {
      case 'MULT':
        this.__mult_get_possible_opts()
        break
      case 'ARRANGE':
        this.__arrange_get_possible_opts()
        break
      case 'OPEN':
        this.__opn_init_input_fields()
        break
      case 'AMEND':
        this.__amend_init_input_field()
        break
    }
  }

  reset_q_state() {
    this.cur_state.response = []
    this.cur_state.correct = null
    this.cur_state.time_elapsed = 0
    this.cur_state.tried_again = false

    // Question-type-specific variables
    this.__arrange_ret = []
    this.__mult_ret = []

  }

  next_q() {
    this.q_states[this.cur_state.id] = (Object.assign({}, this.cur_state))
    if (this.cur_state.id < this.questions.length-1) {
      
      this.cur_state.id += 1
      this.revision_progress = this.cur_state.id / this.questions.length
      this.reset_q_state()
      this.loadQuestion()
    } else {
      this.revision_progress = 1
      this.__show_revision_summary()
    }
  }

  prev_q() {
    if (this.cur_state.id < this.questions.length) {
      this.q_states.push(this.cur_state)
      this.cur_state.id -= 1
      this.revision_progress = this.cur_state.id / this.questions.length
      this.reset_q_state()
      this.loadQuestion()
    }
  }

  check_response(approx_check?: boolean) {
    // Convert Arrays to strings to compare their content
    // because Array comparision only eval to True if pointed to same address
    
    if (this.questions[this.cur_state.id].type == 'MULT') {
      this.cur_state.response.sort()
      this.questions[this.cur_state.id].keys.sort()
    }

    let correct: boolean = this.cur_state.response.toString() == this.questions[this.cur_state.id].keys.toString()


    if (correct) {
      this.cur_state.correct = true;
      this.prog_bar_color ="success";

      // TODO: Change inbuilt alert() to fancier anim/effect
      alert("Correct!")
      this.next_q()
    } else {

      if ((this.questions[this.cur_state.id].type == 'OPEN'
        || this.questions[this.cur_state.id].type == 'AMEND')
        && approx_check) 
        {
        
        }
        else {
        this.cur_state.correct = false;
        this.prog_bar_color = "danger"
        // TODO: Change inbuilt alert() to fancier anim/effect
        this.cur_state.tried_again = true;
        alert("Try again :(")
        }


    }


  }

  get_current_prompt():string {
    return this.questions[this.cur_state.id].prompt
  }

  get_question_type():string {
    return this.questions[this.cur_state.id].type
  }

  __mcq_get_possible_opts(): Array<string>{
    return this.questions[this.cur_state.id].choices
  }

  __mult_get_possible_opts(): void {

    // this.questions[this.cur_state.id].choices.forEach( (v, i) => {ret.push({checked: false, stmt: v})} )
    // console.log(ret)
    // console.log(this.questions[this.cur_state.id].choices)
    // console.log("r")
    for (let i = 0; i < this.questions[this.cur_state.id].choices.length; i++) {
      this.__mult_ret.push({checked: false, stmt: this.questions[this.cur_state.id].choices[i]})
    }
  }

  __arrange_get_possible_opts(): void {
    for (let i = 0; i < this.questions[this.cur_state.id].choices.length; i++) {
      this.__arrange_ret.push(this.questions[this.cur_state.id].choices[i])  
    }
  }

  __track_items(index: number, itemObject: any) {
    return index
  }

  set_user_response(re:Array<string>) {
    this.cur_state.response = re
    this.check_response()
  }

  __mult_check_result() {
    this.cur_state.response = []
    for (let i = 0; i < this.__mult_ret.length; i++) {
      if (this.__mult_ret[i].checked) {
        this.cur_state.response.push(this.__mult_ret[i].stmt)
      }
    }
    console.log(this.cur_state.response)
    this.check_response()
  }

  __arrange_check_result() {
    this.cur_state.response = this.__arrange_ret
    this.check_response()
  }

  __arrange_set_response(ev: CustomEvent<ItemReorderEventDetail>) {
    this.__arrange_ret = ev.detail.complete(this.__arrange_ret)
  }

  __opn_init_input_fields() {
    for (let i = 0; i < this.questions[this.cur_state.id].keys.length; i++) {
      this.cur_state.response.push("")
    }
  }
  
  __amend_init_input_field() {
    this.cur_state.response = this.questions[this.cur_state.id].choices
  }

  __dismiss_revision_summary() {
    this.revisionSummary.dismiss()
  }

  __get_complement(): string {
    if (this.__calc_weighted_score() == 1) {
      return "Perfection!"
    }
    if (this.__calc_weighted_score() >= this.acceptable_thresh) {
      return "Well done"
    }
    return "Could do better"
  }

  __get_serialized_percentage(): string {
    return `${this.__calc_weighted_score().toFixed(1)}`
  }

  __calc_weighted_score():number {
    return (this.summary.correct - this.summary.retried) + (this.summary.retried*0.5)
  }

  __show_paragraph_detail(pgph_i: number) {
    alert(this.paragraphs[pgph_i].content)
  }

  __show_revision_summary() {
    
    let weak_pts = Array<number>(this.paragraphs.length).fill(0)
    let questions_in_pgph = Array<number>(this.paragraphs.length).fill(0)

    this.summary.total = this.questions.length
    for (let i = 0; i < this.q_states.length; i++) {
      
      questions_in_pgph[this.questions[this.q_states[i].id].pgph_i]+=1;

      if (this.q_states[i].correct) {
        this.summary.correct += 1

        if (this.q_states[i].tried_again) {
          this.summary.retried += 1
          weak_pts[this.questions[i].pgph_i] += 0.3
        }
      } else {
        weak_pts[this.questions[i].pgph_i] += 1
      }
    }

    // Evaluate whether paragraph i is weak point
    // If paragraph_i<correct_q> = 65% paragraph_i<total_qs>
    for (let i = 0; i < weak_pts.length; i++) {
      if (weak_pts[i]/questions_in_pgph[i] > (1-0.64)) {
        this.summary.weak_points.push( this.paragraphs[i].header )
      }
    }

    if (this.summary.total == this.questions.length) {
      this.summary.next_revision_due = new Date().getTime() + 604800000
    } else if (this.__calc_weighted_score() >= this.acceptable_thresh) {
      this.summary.next_revision_due = new Date().getTime() + 345600000
    } else {
      this.summary.next_revision_due = new Date().getTime() + 86400000
    }

    console.log(this.q_states)
    console.log(this.questions)
    this.revision_finished = true
  }

  try_get_serialized_array(arr: Array<any>) {
    let _r = ""
    try
      {_r = arr.join(", ")}
    catch (e)
      { try {_r = arr.toString()} catch (__e) { _r = "" }}
    finally {
      return _r
    }
  }

  async __log_result_and_exit() {
    await this.userResource.logRevisionResult(this.n_title, this.summary)
    this.__dismiss_revision_summary()
    setTimeout(() => {
      this.rt.navigate(['dashboard'])
    }, 30)
  }

  async init_weak_point_revision() {

  }

  async __log_result_and_retry() {
    await this.userResource.logRevisionResult(this.n_title, this.summary)
    
  }



  ngOnInit() {
    addIcons(ionIcons);
  }

  public backToDashboard() {
    if (confirm('Exit to dashboard? This will abandon your current progress.'))
      this.rt.navigate(['dashboard'])
  }

}
