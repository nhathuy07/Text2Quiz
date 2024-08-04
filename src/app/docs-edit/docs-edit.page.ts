import { Component, OnInit } from '@angular/core';
import { ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonModal, LoadingController, IonSelect, IonSelectOption, IonItem, IonPopover, IonLabel, IonButtons, IonIcon, IonButton, IonCol, IonCard, IonCardContent, IonCardSubtitle, IonInput, IonGrid, IonRow, IonTextarea, IonText, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import * as ionIcons from 'ionicons/icons'
import { addIcons } from 'ionicons';
import { ActivatedRoute, Router } from '@angular/router';
import { ViewChild } from '@angular/core';
import { CapacitorHttp } from '@capacitor/core';
import { UserResourceService } from '../user-resource.service';
import { environment } from 'src/environments/environment';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-docs-edit',
  templateUrl: './docs-edit.page.html',
  styleUrls: ['./docs-edit.page.scss'],
  standalone: true,
  imports: [TranslateModule, IonModal, IonSelect, IonSelectOption, IonItem, IonPopover,IonLabel, IonButtons, IonIcon, IonCol, IonButton, IonCard, IonCardContent, IonCardSubtitle, IonInput, IonGrid, IonRow, IonTextarea, IonText, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule],

})

export class DocsEditPage implements OnInit {
  // @ts-ignore
  @ViewChild("rtetoolbar") rtetoolbar: ElementRef<HTMLDivElement>;
  // @ts-ignore
  @ViewChild("highlight") highlight: ElementRef<HTMLButtonElement>;
  // @ts-ignore
  @ViewChild("inputfile") inputfile: ElementRef<HTMLInputElement>;
// @ts-ignore
  @ViewChild("fileChooserOptions") fileChooserOptions: HTMLIonPopoverElement;
  // @ts-ignore
  @ViewChild("rte") rte: ElementRef<HTMLDivElement>;

  // @ts-ignore
  @ViewChild("NoteGeneratorModal") NoteGeneratorModal: HTMLIonModalElement;

  private _uploadtype: string = ""

  public note_name: string = "";
  public note_content: any;
  public note_subject: string = "";
  public note_language: string = "";

  private walkthrough_mode: boolean = false;

  public isNoteGeneratorModalOpened = false;
  public noteGeneratorModalPrompt: string = "";
  public noteGeneratorModalLang: string = "Vietnamese";

  private note_keywords: Set<string> = new Set<string>;

  public note_id: string="";

  private toolbarDiv: any;

  public isPopoverOpen: boolean = false;

  private newEditor: boolean = true;

  private lastCmdStates: Map<string, boolean> = new Map<string, boolean>()

  public availableSubjects: Set<string> = new Set<string>()

   constructor(private translate: TranslateService, private ar: ActivatedRoute, private userResource: UserResourceService, private router: Router, private loading_throbber: LoadingController) { 

    addIcons(ionIcons);
  }
  
  async presentLoading() {
    // Show loading throbber while app loads data
    const loading = await this.loading_throbber.create({
        message: this.translate.instant('loadingMsg'),
        translucent: true
    });
    await loading.present();
    return loading;
}

  returnSerializedKeywords() :string{
    return Array.from(this.note_keywords).filter((val, _, __)=>{ return val.trim().length != 0 }).join(', ')
  }

  async ionViewWillEnter() {
      // Show loading throbber while app loads data
      const loading = await this.presentLoading();
      try {
        await this.pageInit()
      } catch (error) {
          console.error('Error loading data:', error);
      } finally {
          await loading.dismiss();
      }
  

  }

  async ngOnInit() {
    await this.pageInit()
    this.translate.use(this.translate.getBrowserLang() ? this.translate.getBrowserLang() as string : 'en')
  
  }

  async pageInit() {
    this.ar.params.subscribe(
      (params: any) => {
        this.note_id = params["id"];
        this.walkthrough_mode = params["auto_redir"];
      }
    )
    // this.quill_editor.editorElem = quill_rte.nativeElement
    // load existing subjects
    this.noteGeneratorModalLang = ""
    this.noteGeneratorModalPrompt = ""
    console.log("walkthrough mode", this.walkthrough_mode)
    await this.getExistingSubjects()


    // (re)init variables
    
     this.note_name = "";
     this.note_content = "";
     this.note_subject = "";
     this.note_language = "";
     this.note_keywords = new Set<string>;

     if (this.note_id != "new") {
      await this.tryGetExistingNoteContent()
     } else {
      this.rte.nativeElement.innerHTML = ""
     }

  }

  async tryGetExistingNoteContent() {
    
    let note = await this.userResource.getNoteByID(this.note_id)
    console.info(note)

    this.rte.nativeElement.innerHTML = note.content
    this.note_name = note.name
    this.note_subject = note.subject
    if (note.keywords != undefined) {
      this.note_keywords = note.keywords
    } else {
      this.note_keywords = new Set<string>();
    }
  }

  async getExistingSubjects() {
    this.availableSubjects = await this.userResource.getSubjectFilters()
    // console.log(this.availableSubjects)
  }

  setTextSubject(event: any): boolean {
    // console.log(event)
    if (event.detail.value == this.translate.instant('addLabel')) {
      return this.newSubject();
    }
    this.note_subject = event.detail.value
    return true;
  }

  validateFields(): boolean {
    if (this.note_name.length == 0 || this.note_subject.length == 0) {
      alert(this.translate.instant("titleEmptyErr"))
      return false;
    }

    if (this.rte.nativeElement.textContent == null || this.rte.nativeElement.textContent == "") {
      alert(this.translate.instant("noteEmptyErr"))
      return false;
    }
    return true;
  }

  newSubject(): boolean {
    let res = prompt(this.translate.instant('newSubjectPrompt'))
    if (res != null && res != "") {
      this.note_subject = res ? res : ""
      this.availableSubjects.add(this.note_subject)
      return true
    }
    return false
  }

  exitEditPage() {
    if (confirm(this.translate.instant('discardPrompt'))) {
      this.router.navigate(['dashboard'])
    }
  }

  async uploadOrUpdateNote() {

    // console.log(this.note_id);
    await this.userResource.signIn(false)

    if (!this.validateFields()) {
      return;
    }

    if (this.note_id == "new") {
      await this.uploadNewNote()
    } else {
      await this.updateNoteContent()
    }
    
  }

  async updateNoteContent() {
    let request_body = [
      "--ENDPART",
      "Content-Type: application/json; encoding=utf-8",
      "",
      JSON.stringify({
        "name": `${this.note_subject}::${this.note_name}.html`,
        "mimeType": "text/html",
      }),
      "\n--ENDPART\n",
      this.returnSerializedKeywords(),
      this.rte.nativeElement.innerHTML.toString(),
      "--ENDPART--"
    ]
    
    // await this.userResource.refreshAccessToken()

    const req = await CapacitorHttp.patch({
      url: `https://www.googleapis.com/upload/drive/v3/files/${this.note_id}`,
      params: {
        uploadType: 'multipart'
      },
      headers: {
        "Content-Type": "multipart/related; boundary=ENDPART",
        // @ts-ignore
        "Authorization": `Bearer ${await this.userResource.signIn(false)}`
      },
      data: request_body.join("\n")
    })
    
    if (req.status == 200) {
      this.note_id = req.data.id
      // console.log(this.note_id)

      alert(this.translate.instant('uploadSuccess'))
      if (this.walkthrough_mode) {
        this.router.navigate(['dashboard'], {queryParams: {redir_id: this.note_id}})
      } else {
        this.router.navigate(['dashboard'])
      }
    } else {
      alert(`${this.translate.instant('uploadFailed')} (${req.status})`)
    }
  }

  async uploadNewNote() {

      let request_body = [
        "--ENDPART",
        "Content-Type: application/json; encoding=utf-8",
        "",
        JSON.stringify({
          "name": `${this.note_subject}::${this.note_name}.html`,
          "mimeType": "text/html",
          "parents": ["appDataFolder"]
        }),
        "\n--ENDPART\n",
        this.returnSerializedKeywords(),
        this.rte.nativeElement.innerHTML.toString(),
        "--ENDPART--"
      ]
      
      console.log(request_body)

      // await this.userResource.refreshAccessToken()

      const req = await CapacitorHttp.post({
        url: "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        headers: {
          "Content-Type": "multipart/related; boundary=ENDPART",
          // @ts-ignore
          "Authorization": `Bearer ${await this.userResource.signIn(false)}`
        },
        data: request_body.join("\n")
      })
      
      if (req.status == 200) {
        this.note_id = req.data.id
        console.log(this.note_id)

        alert("Uploaded successfully!")
        if (this.walkthrough_mode) {
          this.router.navigate(['dashboard'], {queryParams: {redir_id: this.note_id}})
        } else {
          this.router.navigate(['dashboard'])
        }
      } else {
        alert(`Uploading failed (${req.status})`)
      }

  }

  updateText(inner: string) {
    this.note_content = inner
    console.log(inner)
  }

  RTECommand(cmd: string, event: Event) {
    console.log(event)
    event.preventDefault()

    if (document.queryCommandState(cmd)) {
      document.execCommand(cmd, false, "false")
    } else {
      document.execCommand(cmd, false,"true")
    }

    this.lastCmdStates.set(cmd, document.queryCommandState(cmd))
    console.log(document.queryCommandState(cmd))
    
  }

  RTEBlockFormatting(tag: string, event: Event | null) {
    if (document.queryCommandValue("formatBlock") == tag.toLowerCase()) {
      document.execCommand("formatBlock", false, "P")
      return
    }
    
    if (event!=null) {
      event.preventDefault()
    }
    
    document.execCommand("formatBlock", false, tag)
  }

  RTEInsertCheckbox(event: Event) {
    event.preventDefault()

    if (document.queryCommandState("insertOrderedList")) {
      document.execCommand("insertOrderedList",false,"false")
      
      this.lastCmdStates.set("insertOrderedList",false)

    } else if (document.queryCommandState("insertUnorderedList")) {
      document.execCommand("insertUnorderedList",false,"false")
      this.lastCmdStates.set("insertUnorderedList",false)
    }

    let cb = document.createElement("input")
    cb.type = "checkbox"
    document.getSelection()?.getRangeAt(0).insertNode(cb)
  }

  RTEPrevDefault(event: Event) {
    event.preventDefault()
  }

  RTEUpdateEditor() {
    if (this.newEditor) {
      this.RTEInitEditor()
      this.newEditor = false;
    }
    
    this.lastCmdStates.forEach( (val, key) => {
      if (document.queryCommandState(key) != val)
      document.execCommand(key, false, val.toString())
      
    });

  }

  RTEInitEditor() {
    if (this.rte.nativeElement.textContent?.trim() == "") {
      this.RTEBlockFormatting("H1", null)
    }
  }

  RTEUpdateToggle() {
    let buttons = this.rtetoolbar.nativeElement.getElementsByTagName("button")
    for (let i = 0; i < buttons.length; i++) {
      if (this.lastCmdStates.get(buttons[i].id) != undefined) {
        // @ts-expect-error
        buttons[i].setAttribute("activated", this.lastCmdStates.get(buttons[i].id).toString())
      }
    }
  }

  RTEHighlightToggle(event: Event) {
    event.preventDefault()
    let btn = this.highlight.nativeElement
    if (btn.getAttribute("activated") == "false") {
      btn.setAttribute("activated","true")
    } else {
      btn.setAttribute("activated","false")
      document.execCommand("hiliteColor",false,"ffffff")


      // de-highlight selected text
    
      let sel = document.getSelection()?.toString()
      // @ts-ignore
      if (sel.length != 0 && sel.toString() != undefined) {
        this.note_keywords.forEach( (v1, _) => {
          // @ts-ignore
          if (sel?.includes(v1) || v1.includes(sel)) {
            this.note_keywords.delete(v1)
          }
        })
      }

    }
    
  }

  RTEHighlight() {
    let btn = this.highlight.nativeElement
    if (btn.getAttribute("activated") == "true") {
      document.execCommand("hiliteColor",false,"ffc701")

      console.log(this.note_keywords)

      // check if selected elem is a non-empty string
      if (document.getSelection()?.toString() != undefined) {
        let sel = document.getSelection()?.toString()

      if (sel != undefined && sel.length > 0) {

        this.note_keywords.add(sel.trim())
      }
      }
      
    }
  }

  noteGeneratorModalChangeLang(event:any) {
    this.noteGeneratorModalLang = event.detail.value;
  }

  async MLGenerateStudyNote() {

    const loading = await this.presentLoading()

    let r = await CapacitorHttp.post(
      {
        url: `${environment.BACKEND_LOC}/llmGenerateText`,
        data: {"prompt": this.noteGeneratorModalPrompt, "lang": this.noteGeneratorModalLang},
      }
    )

    await loading.dismiss()

    if (!r.status.toString().startsWith('2')) {
      alert(`Operation failed (${r.status})`)
      return;
    }

    this.rte.nativeElement.insertAdjacentHTML("beforeend", `<br/>${r.data}`)
  }

  async RTEOpenFileDialog(type: string) {

    this._uploadtype = type

    // console.log(this.fileChooserOptions)
    this.inputfile.nativeElement.toggleAttribute("multiple")
    if (type == "OCR") {
      this.inputfile.nativeElement.setAttribute("accept", "image/*")
      // this.inputfile.nativeElement.setAttribute("capture","environment")
      this.inputfile.nativeElement.click()
    } else if (type == "Insert") {
      this.inputfile.nativeElement.setAttribute("accept", ".doc,.docx,.xml,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,.md, .rtf,")
      this.inputfile.nativeElement.click()
    } else if (type == 'Auto-generated') {
      this.fileChooserOptions.dismiss()
      this.isNoteGeneratorModalOpened = true;
    } 
    else {
      alert("feature not implemented")
    }
    
  }

  async RTEHandleFileUpload(event: Event | any) {
    const l = await this.presentLoading()
    try {
      await this._handleFileUpload(event)
    } catch (e) {
      console.error(e)
    } finally {
      l.dismiss()
    }

    
  }

  async _handleFileUpload(event: Event | any) {

    let files: Array<File> = event.target.files
    let content = []
    console.log(files)
    let _url = ""


    let upload_form = new FormData()
    let uploadCnt = 0
    // Convert images (OCR mode)
    if (this._uploadtype == 'OCR') {
      _url = `${environment.BACKEND_LOC}/scan2ocr`
      uploadCnt = files.length
      upload_form.append('uploads', uploadCnt.toString())
      for (let i = 0; i < files.length; i++) {
        upload_form.append(`upload_${i}`, files[i].slice(), files[i].name)
      }

    } else {
      _url = `${environment.BACKEND_LOC}/convert2html`
      // Insert documents
      // let uploadQueue: Map<string, any> = new Map<string, any>()

        for (let i = 0; i < files.length; i++) {
          if (files[i].type.startsWith('text')) {
            // If plaintext file, load its content
            this.rte.nativeElement.insertAdjacentText('beforeend', await files[i].text())

          } else {
            // If non-plaintext file, queue it for conversion

            upload_form.append(`upload_${uploadCnt}`, files[i].slice(), files[i].name)
            uploadCnt+=1
          }
        }
    }

    if (uploadCnt != 0) {

    
      upload_form.append('uploads', uploadCnt.toString())

      // Upload non-plaintext files for conversion
      //@ts-ignore
      // console.log(upload_form)
      const res = await CapacitorHttp.post(
        {
          url: _url,
          headers: {
            'Content-Type': 'multipart/form-data'
          },

          data: upload_form
        }
      )


      if (res.status == 200) {
        for (let i = 0; i < res.data.length; i++) {
          
          this.rte.nativeElement.insertAdjacentHTML('beforeend', res.data[i]['content'])
          
        }
      } else {
        alert(`${this.translate.instant('fileConvertErr')} (${res.status})`)
      }

  }
    // Insert parsed text into editor
    this.fileChooserOptions.dismiss()
    this.rte.nativeElement.focus()
    
    // document.execCommand("insertText", false, content.join("\n\n"))
    document.getSelection()?.collapseToEnd()

  }

  }

  
