import { Component, OnInit, Renderer2 } from '@angular/core';
// import { ElementRef, ViewChild} from '@angular/core';
import { ApiCallerService } from '../api-caller.service';
import { MsalService } from '@azure/msal-angular';
// import { AuthenticationResult } from '@azure/msal-browser';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog'
import { SubjectPopUpComponent } from '../subject-pop-up/subject-pop-up.component';
import { Subject } from '../subject'
// import { AppComponent } from '../app.component';

@Component({
  selector: 'app-search-by',
  templateUrl: './search-by.component.html',
  styleUrls: ['./search-by.component.scss']
})

export class SearchByComponent implements OnInit {

  // Personal Info - Auth
  profileInfo: any

  username: any
  email: any
  id: any
  department: any

  date: Date = new Date();

  // Search Bar
  search: boolean
  searchValue: string = ''
  searchResult: string = ''
  searchMode: string = 'by-group'

  // Search by cabinet
  cabinet: boolean

  // Schedule parameters
  startTime: number
  endTime: number
  timeArray = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
  d1_schedule: Subject[] // Monday
  d2_schedule: Subject[] // Tuesday
  d3_schedule: Subject[] // Wednesday
  d4_schedule: Subject[] // Thursday
  d5_schedule: Subject[] // Friday
  d6_schedule: Subject[] // Saturday

  lessonDuration: number = 50

  // Language
  languages = new Map<string, string>([
    ["kz", "Қазақша"],
    ["en", "English"],
    ["ru", "Русский"]
  ])

  language:any

  apiResponse: string
  
  constructor(private api: ApiCallerService, public renderer: Renderer2, 
    private msalService: MsalService, private httpClient: HttpClient, private dialogRef: MatDialog) {

    this.search = false
    this.cabinet = false

    this.language = sessionStorage.getItem("language")
    // if (this.language == null) {
      // this.language = "en"
      // sessionStorage.setItem("language", this.language)
    //   this.language = sessionStorage.getItem('language') || 'en';
    // }

    // waitForElm('#login').then(() => {
    //   console.log("Success?")
    // });
  }

  ngOnInit(): void {
    this.msalService.instance.handleRedirectPromise().then(
      res => {
        if(res != null && res.account != null){
          this.msalService.instance.setActiveAccount(res.account)
          this.getUser()
          this.callProfile()
          sessionStorage.setItem("username", this.username)
          sessionStorage.setItem("email", this.email)
          sessionStorage.setItem("id", this.id)
        }
      }
    )
  }

  setSearch() {
    this.search = true

    if (this.searchValue == '') {
      console.log("Empty")
    } else {
      this.searchResult = this.searchValue
      switch(this.searchMode) { 
        case 'by-group': { 
          this.searchByGroup()
          break; 
        }
        case 'by-teacher': { 
          this.searchByTeacher()
          break; 
        }
        case 'by-cabinet': { 
          this.searchByCabinet()
          break; 
       } 
        default: { 
           console.log("ERROR")
        } 
     } 
    }
  }  

  searchByGroup() {
    var response = this.api.sendGetRequest("/timetable/group/" + this.searchValue)
    response.subscribe(data => {
      const timeTables = JSON.parse(JSON.stringify(data))

      this.d1_schedule = timeTables.payload["d1"]
      this.d2_schedule = timeTables.payload["d2"]
      this.d3_schedule = timeTables.payload["d3"]
      this.d4_schedule = timeTables.payload["d4"]
      this.d5_schedule = timeTables.payload["d5"]
      this.d5_schedule = timeTables.payload["d6"]

      waitForElm('.grid-container').then(async () => {
        await this.setSubjects(this.d1_schedule)
        await this.setSubjects(this.d2_schedule)
        await this.setSubjects(this.d3_schedule)
        await this.setSubjects(this.d4_schedule)
        await this.setSubjects(this.d5_schedule)
        await this.setSubjects(this.d6_schedule)
    });
    }, error => { console.log(error) })
  }

  searchByTeacher() {
    var response = this.api.sendGetRequest("/timetable/tutor/" + this.searchValue)
    response.subscribe(data => {
      const temp = JSON.parse(JSON.stringify(data))
      console.log(temp)

    }, error => { console.log(error) })
  }

  searchByCabinet() {
    var response = this.api.sendGetRequest("/timetable/room/" + this.searchValue)
    response.subscribe(data => {
      const temp = JSON.parse(JSON.stringify(data))
      console.log(temp)

    }, error => { console.log(error) })
  }

  async setSubjects(subjects: any) {
    if (subjects != null) {
      for (let subject of subjects) {
        
        var timer = subject.classtime_time.split(':');
        // Get Subject Time + Time starts from 8:00
        var hours = parseInt(timer[0]) //- 8 
        var minutes = parseInt(timer[1]) /// 60

        await waitForElm('#' + subject.classtime_day + "t" + timer[0] + timer[1]).then(() => {

          const el = (<HTMLElement>document.getElementById(subject.classtime_day + "t" + timer[0] + timer[1]));
  
          el.style.height = (this.lessonDuration * 5 / 60) + "rem"
  
          // Displacement = (Borders) + (Full Hours) + (Minutes)
          var final = ((0.1 * (hours - 8)) + ((hours - 8) * 5) + (minutes/60) * 5) + "rem"
          el.style.top = final

          el.style.visibility = "visible"
        })
      }
    } else {
      console.log("NULL")
    }
  }

  setSubjectId(subject: Subject): string {
    let time = subject.classtime_time.split(':');
    return subject.classtime_day + "t" + time[0] + time[1]
  }

  openSubject(subject: Subject) {
    this.dialogRef.open(SubjectPopUpComponent, {
      data: {
        title: subject.subject,
        tutor: subject.tutor,
        room: subject.room,
        time: subject.classtime_time
      }
    })
  }

  formatDate(data: Date) {
    let formDate = data.toString()
    return formDate.slice(0, 11)
  }

  // Auth
  isLoggedIn() {
    return this.msalService.instance.getActiveAccount() != null
  }

  login() {
    this.msalService.loginRedirect();
    // this.msalService.loginPopup().subscribe( (response: AuthenticationResult) => {
    //   this.msalService.instance.setActiveAccount(response.account)
    // })
  }

  logout() {
    this.msalService.logout()
    sessionStorage.clear()
  }
  
  getUser() {
    this.username = this.msalService.instance.getActiveAccount()?.name
    this.id = this.msalService.instance.getActiveAccount()?.localAccountId
    this.email = this.msalService.instance.getActiveAccount()?.username
  }

  callProfile() {
    this.httpClient.get("https://graph.microsoft.com/beta/me/profile").subscribe( res => {
      this.apiResponse = JSON.stringify(res)
      this.profileInfo = res
      this.department = this.profileInfo.positions[0].detail.company.department
      sessionStorage.setItem("department", this.department)
    })
  }

  public setLanguage(event: any) {
    sessionStorage.setItem("language", event.value)
    window.location.reload()
  }

  setTimeline() {
    // Work of Time Line
    window.addEventListener('load', function () {

      var dateTime = getTodaysDate(+6) // Todays Date and Time with Timezone +6

      var dateTimeArray = dateTime.split(',');

      var dayOfTheWeek = parseInt(dateTimeArray[0])
      var date = dateTimeArray[1]
      var time = dateTimeArray[2].split(':')
      var hours = parseInt(time[0])
      var minutes = parseInt(time[1]) / 60
      var final = 0
      if (hours < 8) {
        setVerticalLocation("d" + dayOfTheWeek + "_line", final)
      } else if (hours > 21) {
        hours = 22
        minutes = 0
        final = ((0.1 * (hours - 8)) + ((hours - 8) * 5) + minutes * 5)
        setVerticalLocation("d" + dayOfTheWeek + "_line", final)
      } else {
        final = ((0.1 * (hours - 8)) + ((hours - 8) * 5) + minutes * 5)
        setVerticalLocation("d" + dayOfTheWeek + "_line", final)
      }
    })
  }
}

function getTodaysDate(offset: number): string {
  var date = new Date();
  var utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  var nd = new Date(utc + (3600000 * offset));
  return nd.getDay() + ", " + nd.toLocaleString();
}

function setVerticalLocation(elementId: string, number: number) {
  let element = <HTMLElement>document.getElementById(elementId);
  element.style.display = "block";
  element.style.top = number + "rem"
}

function waitForElm(selector: string) {
  return new Promise(resolve => {
      if (document.querySelector(selector)) {
          return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver(mutations => {
          if (document.querySelector(selector)) {
              resolve(document.querySelector(selector));
              observer.disconnect();
          }
      });

      observer.observe(document.body, {
          childList: true,
          subtree: true
      });
  });
}
