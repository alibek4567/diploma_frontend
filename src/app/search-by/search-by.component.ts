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
  weekDates = new Map<string, string>()

  // Search Bar
  search: boolean = false
  searchValue: string = ''
  searchResult: string = ''
  searchMode: string = 'by-group'

  // Search by cabinet
  cabinet: boolean = false

  // Schedule parameters
  startTime: number
  endTime: number
  timeArray = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]

  // d1 = MON; d2 = TUS; d3 = WED; d4 = THU; d5 = FRI; d6 = SAT
  weekSchedule = new Map<string, Map<string, Subject[]>>()

  // timeMap: Map<string, object[]>

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
    // Language
    this.language = sessionStorage.getItem("language")

    // Current Week value
    let temp = getTodaysDate(+6).split(',')[1].trim()
    let date = temp.split('.')
    let dateInFormat = date[2] + '/' + date[1] + '/' + date[0]
    let time = getTodaysDate(+6).split(',')[2].trim()

    this.weekDates = getWeekDates(dateInFormat + ' ' + time)

    console.log(this.weekDates)
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
    if (this.searchValue == '') {
      console.log("Empty")
    } else {
      this.search = true

      this.searchResult = this.searchValue
      switch(this.searchMode) { 
        case 'by-group': { 
          this.getSearchResult("/timetable/group/" + this.searchValue)
          break; 
        }
        case 'by-teacher': { 
          this.getSearchResult("/timetable/tutor/" + this.searchValue)
          break; 
        }
        case 'by-cabinet': { 
          this.getSearchResult("/timetable/room/" + this.searchValue)
          // Booking part to add
          break; 
       } 
        default: { 
           console.log("ERROR")
        } 
     } 
    }
  }  

  getSearchResult(request: string) {
    this.weekSchedule.clear()
     
    var response = this.api.sendGetRequest(request)
    response.subscribe(data => {
      const schedule = JSON.parse(JSON.stringify(data))
      // Sorting
      for (let i = 1; i < 7; i++) {
        if (schedule.payload["d" + i] != null) {
          for (let item of schedule.payload["d" + i]) {
            if (this.weekSchedule.get("d" + i) != undefined) {
              if (this.weekSchedule.get("d" + i)?.get(item.classtime_time) != undefined) {
                this.weekSchedule.get("d" + i)?.get(item.classtime_time)?.push(item)
              } else {
                this.weekSchedule.get("d" + i)?.set(item.classtime_time, [item])
              }
            } else {
              this.weekSchedule.set("d" + i, new Map())
              this.weekSchedule.get("d" + i)?.set(item.classtime_time, [item])
            }
          }
        }
      }
      // Drawing
      waitForElm('.grid-container').then(async () => {
        for (let i = 1; i < 7; i++) {
          await this.setSubjects("d" + i, this.weekSchedule.get("d" + i))
        }
      });
    }, error => { console.log(error) })
  }

  async setSubjects(day: string, daySchedule: any) {
    if (daySchedule != null) {
        daySchedule.forEach(async (value: Subject[], key: string) => {

        var timer = key.split(':');
        // Get Subject Time + Time starts from 8:00
        var hours = parseInt(timer[0]) //- 8 
        var minutes = parseInt(timer[1]) /// 60

        await waitForElm('#' + day + "_t" + timer[0] + timer[1]).then(() => {
          const el = (<HTMLElement>document.getElementById(day + "_t" + timer[0] + timer[1]));
          
          el.style.height = (this.lessonDuration * 5 / 60) + "rem"
          // Displacement = (Borders) + (Full Hours) + (Minutes)
          el.style.top = ((0.1 * (hours - 8)) + ((hours - 8) * 5) + (minutes/60) * 5) + "rem"
          el.style.visibility = "visible"

          const el_title = (<HTMLElement>document.getElementById(day + "_t" + timer[0] + timer[1] + "_title"));
          const el_room = (<HTMLElement>document.getElementById(day + "_t" + timer[0] + timer[1] + "_room"));
          el_title.textContent = ''
          el_room.textContent = ''

          let title: string = ''
          let room: string = ''
          for (let subject of value) {
            title += subject.subject + ' / '
            room += subject.room + ' / '
          }

          el_title.textContent = title.slice(0, -3);
          el_room.textContent = room.slice(0, -3);
        })
      })
    } 
  }

  setSubjectId(subject: string): string {
    let time = subject.split(':');
    return "t" + time[0] + time[1]
  }

  openSubject(subject: Subject[]) {
    this.dialogRef.open(SubjectPopUpComponent, {
      data: {
        object: subject
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

  formatDayAndWeek(date: string | undefined): string {
    if (date == undefined) {
      return ''
    }
    return date.split(',')[0].trim()
  }
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

function getTodaysDate(offset: number): string {
  var date = new Date();
  var utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  var nd = new Date(utc + (3600000 * offset));
  return nd.getDay() + ", " + nd.toLocaleString();
}

function getWeekDates(date: string): Map<string, string> {
  let currentDay = (date == '') ? new Date(): new Date(date)
  let monday = (currentDay.getDate()+2) - currentDay.getDay()

  let weekDates = new Map<string, string>()
  for (let i = 0; i < 7; i ++) {
    weekDates.set('d' + (i + 1), new Date(currentDay.setDate(monday + i - 1)).toLocaleString()) // toUTCString()
  }
  return weekDates
}

function setVerticalLocation(elementId: string, number: number) {
  let element = <HTMLElement>document.getElementById(elementId);
  element.style.display = "block";
  element.style.top = number + "rem"
}

