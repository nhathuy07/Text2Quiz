import { ChangeDetectorRef, Component, ElementRef, OnInit, QueryList, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonList, IonItem, IonCardTitle, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, IonLabel } from '@ionic/angular/standalone';
import { AfterViewInit } from '@angular/core';
import { GestureController } from '@ionic/angular'
import { ViewChildren } from '@angular/core';
import { Gesture } from '@ionic/angular'

@Component({
  selector: 'app-drag-drop-testbed',
  templateUrl: './drag-drop-testbed.page.html',
  styleUrls: ['./drag-drop-testbed.page.scss'],
  standalone: true,
  imports: [ IonList, IonItem, IonCardTitle, IonCard, IonCardContent, IonLabel, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class DragDropTestbedPage implements OnInit, AfterViewInit  {

  // @ts-ignore
  @ViewChildren(IonItem, {read: ElementRef}) unsortedItems: QueryList<ElementRef> ;
  // @ts-ignore
  @ViewChild("dropzoneA") dropzoneA: ElementRef;
  // @ts-ignore
  @ViewChild("itemFrame") itemFrame: ElementRef;

  public myArray = Array.from(Array(30).keys())
  public acceptScroll: boolean
  // public subscriptions: Subscription[] = []
  gestures: Gesture[] = []

  constructor(private gestureCtrl: GestureController, private changeDetectorRef: ChangeDetectorRef) {
    this.acceptScroll=true
  }

  ngAfterViewInit() {
    this.unsortedItems.changes.subscribe( 
      res => {
        // console.log('items changed: ', res.toString())
        if (this.gestures.length != this.unsortedItems.length) {
          this.updateGestures()
        }
        
      }
    )
    this.updateGestures()
    
  }

  updateGestures() {
    this.gestures.map(g => g.destroy())
    this.gestures = []
    const arr = this.unsortedItems.toArray()
    for (let i = 0; i < arr.length; i++) {
      const curItem = arr[i]
      const dragGesture = this.gestureCtrl.create({
        el: curItem.nativeElement,
        threshold: 4,
        gestureName: 'drag',
        onStart: (ev) => {
          this.acceptScroll = false
          this.itemFrame.nativeElement.style.zIndex = 0;
          curItem.nativeElement.style.transistion = '';
          curItem.nativeElement.style.fontWeight = 'bold';
          curItem.nativeElement.style.color = '#674ac9';
          
          curItem.nativeElement.style.opacity = '0.8';
          this.changeDetectorRef.detectChanges()
        },
        onMove: (ev) => {
          curItem.nativeElement.style.transform = `translate(${ev.deltaX}px, ${ev.deltaY}px)`
          curItem.nativeElement.style.zIndex = 11;
          // check dropzone hover
          this.checkDropzoneHover(ev.currentX, ev.currentY)
        },
        onEnd: (ev) => {
          this.itemFrame.nativeElement.style.zIndex = 2;
          this.acceptScroll =true
          
          this.handleDrop(curItem, ev.currentX, ev.currentY, i)
          
        }
      })
      dragGesture.enable()
      this.gestures.push(dragGesture)
    }


  }

  ngOnInit() {

  }

  handleDrop(it:any, x:number, y:number, i:number) {
    const drop = this.dropzoneA.nativeElement.getBoundingClientRect()
    if (this.isInDropzone(x, y, drop)) {
      console.log(this.myArray.splice(i, 1)[0])
      this.dropzoneA.nativeElement.style.backgroundColor = '#fff'
      it.nativeElement.remove()
    } else {
      it.nativeElement.style.transistion = '.2s ease-out'
      it.nativeElement.style.transform = 'translate(0px, 0px)'
      it.nativeElement.style.opacity = '1'
      it.nativeElement.style.fontWeight = 'normal'
      it.nativeElement.style.zIndex = 'inherit'
      it.nativeElement.style.color = 'black'
    }
    this.acceptScroll=true
    this.changeDetectorRef.detectChanges()
  }

  checkDropzoneHover(x:number, y:number) {
    const drop = this.dropzoneA.nativeElement.getBoundingClientRect();
    if (this.isInDropzone(x, y, drop)) {
      this.dropzoneA.nativeElement.style.backgroundColor = "#e8e6ff"
      console.log(`in dropzone ${this.dropzoneA}`)
    } else {
      this.dropzoneA.nativeElement.style.backgroundColor = "#fff"
    }
  }

  isInDropzone(x:number, y:number, dropzone:any):boolean{
    if (x < dropzone.left || x > dropzone.right) {
      return false
    }
    if (y < dropzone.top || y > dropzone.bottom) {
      return false
    }
    return true
  }

}
