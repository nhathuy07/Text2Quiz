import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {IonButtons, IonButton,IonIcon, IonGrid, IonCol, IonRow, IonList, IonItem, IonCard, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
// import { AfterViewInit } from '@angular/core';
import { GestureController } from '@ionic/angular'
import { ActivatedRoute } from '@angular/router';
import { ElementRef } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
import { QueryList } from '@angular/core';
import {Gesture} from '@ionic/angular'
import { ViewChildren } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { UserResourceService } from '../user-resource.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {IonImg} from '@ionic/angular/standalone'
import * as icons from 'ionicons/icons';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-flashcards',
  templateUrl: './flashcards.page.html',
  styleUrls: ['./flashcards.page.scss'],
  standalone: true,
  imports: [IonImg,IonButtons, IonButton,IonIcon,IonGrid,IonRow,IonCol, IonList,IonItem, IonCard, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class FlashcardsPage implements OnInit {
  // @ts-ignore
  @ViewChildren(IonItem, {read: ElementRef}) draggables: QueryList<ElementRef>
  // @ts-ignore
  @ViewChild('dropzone', {read:ElementRef}) dropzone: ElementRef
  // @ts-ignore
  @ViewChild('flashcardImg', {read: ElementRef}) flashcardImg: ElementRef

  gestures: Gesture[] = []
  id: string;
  lang: string;
  isResourceReady: boolean=false;
  keywords: Map<string, string> = new Map<any, any>()
  imgs: Map<string, string> = new Map<string, string>()
  keys: string[] = []
  qs: string[] = []
  skipBtnLabel:string="Skip"
  showImage:boolean = true;
  acceptScroll:boolean =true;
  currentQ:string = "";
  qIndex:number = 0;

  qRetried:boolean=false;
  retries:number =0;
  correct:number =0;
  finished:boolean=false;
  currentA:string="..............."

  constructor(private readonly ur: UserResourceService, private ar: ActivatedRoute, private gestureCtrl: GestureController, private changeDetectorRef: ChangeDetectorRef, private rt: Router) {
    this.id = ""
    this.lang = ""
    addIcons(icons)
   }

  async ionViewWillEnter() {
    await this.pageInit()
  }

  async exitRevision() {
    this.rt.navigate(['dashboard'])
  }

  async pageInit() {

    this.ar.params.subscribe( (p) => {
      this.id = p['id'],
      this.lang = p['lang']
    } )

    this.draggables.changes.subscribe( 
      res => {
        // console.log('items changed: ', res.toString())
        if (this.gestures.length != this.draggables.length) {
          this.updateGestures()
        }
        
      }
    )

    await this.fetchFlashcards(this.id, this.lang)
    // // this.keys=this.getKeys()
    this.keys = this.getKeys()
    this.qs = this.ur._shuffle_list(this.getVals())

    // // Load first question
    this.currentQ = this.qs[this.qIndex]
    this.currentA ="..............."
    this.updateImg()
    this.isResourceReady = true
  }
  
  async ngOnInit(): Promise<void> {

    await this.pageInit()
    this.updateGestures()
  }

  updateImg() {
    console.log(typeof(this.imgs))

    this.flashcardImg.nativeElement.src = this.imgs.get(this.currentQ)
  }

  nextQ() {
    this.skipBtnLabel = "Skip"
    this.dropzone.nativeElement.style.color = '#1b2783'
    this.dropzone.nativeElement.style.backgroundColor = '#ffffff'
    this.qRetried=false;
    this.qIndex+=1
    this.currentA ="..............."

    if (this.qIndex >= this.qs.length) {
      this.finished = true
      alert(`Flashcard session finished!\n\nCorrect:${this.correct}\nRetries:${this.retries}\nIncorrect/Skipped:${this.keywords.size - this.correct}`)
      this.rt.navigate(['dashboard'])
    } else {
      this.currentQ = this.qs[this.qIndex]
      this.updateImg()
    }
  }

  handleDrop(x:number, y:number, i:number): boolean {
    let rect = this.dropzone.nativeElement.getBoundingClientRect()
    if (x < rect.left || x > rect.right) {
      return false
    }
    if (y < rect.top || y > rect.bottom) {
      return false
    }
    if (this.keywords.get(this.keys[i]) ==this.currentQ) {
      if (this.qRetried) {
        this.retries+=1
      }
        return true
    } else {
      alert('Try again :(')
      if (this.qRetried) {
        this.retries+=1
      }
      this.qRetried = true
      return false
    }
  }

  checkOverlap(x:number, y:number) {
    let rect = this.dropzone.nativeElement.getBoundingClientRect()
    if (x < rect.left || x > rect.right) {
      return false
    }
    if (y < rect.top || y > rect.bottom) {
      return false
    }
    return true
  }


  
  updateGestures() {

    this.gestures.map((x) => {x.destroy()})

    const itemArr = this.draggables.toArray()
    itemArr.forEach( (val, i, _) => {
      console.log(val.nativeElement.classList)
      if (val.nativeElement.classList.contains('draggable')) {
      const itemGesture = this.gestureCtrl.create(
        {
          el: val.nativeElement,
          gestureName: 'drag',
          threshold: 4,
          onStart: () => {
            this.acceptScroll=false
            val.nativeElement.style.transistion = '';
            val.nativeElement.style.fontWeight = 'bold';
            val.nativeElement.style.color = '#674ac9';
            val.nativeElement.style.zIndex = 10
            val.nativeElement.style.opacity = '0.8';
            this.changeDetectorRef.detectChanges()
          },
          onMove: (ev) => {
            
            val.nativeElement.style.transform = `translate(${ev.deltaX}px, ${ev.deltaY}px)`
            if (this.checkOverlap(ev.currentX, ev.currentY)) {
              this.dropzone.nativeElement.style.backgroundColor =`#d9ddff`
            } else {
              this.dropzone.nativeElement.style.backgroundColor =`#ffffff`
            }
          },
          onEnd: (ev) => {
            this.acceptScroll=true
            if (this.handleDrop(ev.currentX, ev.currentY, i)) {
              let spl = this.keys.splice(i, 1)[0]
              this.correct+=1

              // console.log(this.keys.splice(i, 1)[0])
              this.skipBtnLabel = "Next >>"
              this.currentA = spl
              this.dropzone.nativeElement.style.color = '#ffffff'
              this.dropzone.nativeElement.style.backgroundColor = '#49a17d'
              console.log(spl)
              val.nativeElement.remove()
              // alert('Correct!')
              // this.changeDetectorRef.detectChanges()

              // setTimeout(()=> {this.nextQ()}, 200)
              // this.nextQ()
            } else {
              val.nativeElement.style.transform = `translate(0px, 0px)`
              val.nativeElement.style.zIndex = `inherit`
              val.nativeElement.style.fontWeight = `normal`
              val.nativeElement.style.color = `black`
              this.dropzone.nativeElement.style.backgroundColor =`#ffffff`
            }
            // this.dropzone.nativeElement.style.backgroundColor =`#ffffff`
            this.changeDetectorRef.detectChanges()
          }
        }
      )
      itemGesture.enable()
      this.gestures.push(itemGesture)}
    } )
  }

  public getKeys(): string[] {
    let ret: string[] = []
    this.keywords.forEach( (v, k, m) => {
      ret.push(k)
    } )
    return ret
  }

  public getVals(): string[] {
    let ret: string[] = []
    this.keywords.forEach( (v, k, m) => {
      ret.push(v)
    } )
    return ret
  }

  async fetchFlashcards(id:string, lang:string) {
    // let __kw = new Map<string, string>()
    // let __imgs = new Map<string, string>()
    const _req = await CapacitorHttp.get({
      url: `http://${environment.BACKEND_LOC}/getFlashcards/${id}/${lang}`
    })
    // console.log(_req)
    for (let i = 0; i < _req.data.defs.length; i++) {
      this.keywords.set(_req.data.defs[i][0], _req.data.defs[i][1])
      this.imgs.set(_req.data.defs[i][1], _req.data.imgs[i][1])
    }
    // this.imgs = _req.data.imgs
    console.log(this.imgs)
  }
  
}
