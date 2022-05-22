import { Component, ElementRef, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { ApiCallerService } from '../api-caller.service';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult } from '@azure/msal-browser';
import { HttpClient } from '@angular/common/http';

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

  // Search by cabinet
  cabinet: boolean

  // Schedule parameters
  allTimeTables: any
  timeArray = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
  d1: any // Monday
  d2: any // Tuesday
  d3: any // Wednesday
  d4: any // Thursday
  d5: any // Friday
  d6: any // Saturday

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
    private msalService: MsalService, private httpClient: HttpClient) {

    this.search = false
    this.cabinet = false

    this.language = sessionStorage.getItem("language")
    if (this.language == null) {
      this.language = "en"
      sessionStorage.setItem("language", this.language)
    }

    var response = this.api.sendGetRequest("/timetable/group/1")
    response.subscribe(data => {
      const timeTables = JSON.parse(JSON.stringify(data))

      this.d1 = timeTables.payload["d1"]
      this.d2 = timeTables.payload["d2"]
      this.d3 = timeTables.payload["d3"]
      this.d4 = timeTables.payload["d4"]
      this.d5 = timeTables.payload["d5"]
      this.d5 = timeTables.payload["d6"]

      this.setSubjects(this.d1)
      this.setSubjects(this.d2)
      this.setSubjects(this.d3)
      this.setSubjects(this.d4)
      this.setSubjects(this.d5)
      this.setSubjects(this.d6)

      this.updateHtml(this.d1)
      this.updateHtml(this.d2)
      this.updateHtml(this.d3)
      this.updateHtml(this.d4)
      this.updateHtml(this.d5)
      this.updateHtml(this.d6)
    }, error => { console.log(error) })

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

  setSearch(){
    this.search = true
  }  

  setDate(event: any) { 
    this.date = event.target.value;
  }

  formatDate(data: Date){
    let formDate = data.toString()
    return formDate.slice(0, 11)
  }

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

  setLanguage(event: any) {
    console.log(event.value)
    sessionStorage.setItem("language", event.value)
    window.location.reload()
  }

  updateHtml(data: any) {
    if (data != null) {
      for (let item of data) {
        let el = (<HTMLElement>document.getElementById(item.classtime_day+"_"+(item.classtime_time).split(':')[0]));
        el.className = "block";
        el.insertAdjacentHTML("beforeend", "<p style='margin: 0 0 0.2rem 0;; padding: 0.2rem 0 0 0; font-size:0.8rem'>"+item.subject+"</p>");
        // el.insertAdjacentHTML("beforeend", "<p style='margin: 0 0 0.5rem 0;; padding: 0; font-size:0.8rem'>"+item.tutor+"</p>")
        el.insertAdjacentHTML("beforeend", "<p style='margin: 0 0 0.2rem 0;; padding: 0 0 0.2rem 0; font-size:0.7rem'>"+item.room+"</p>");
      }
    }
  }

  setSubjects(data: any) {
    if (data != null) {
      for (let item of data) {
        let el = (<HTMLElement>document.getElementById(item.classtime_day+"_"+(item.classtime_time).split(':')[0]));
        el.style.position = "absolute"

        // height = 5rem = 60 min = 100%
        // height = 4.16666667rem = 50 min
        el.style.height = (this.lessonDuration * 5 / 60) + "rem"
        
        var timer = item.classtime_time.split(':');
        // Get Subject Time + Time starts from 8:00
        var hours = parseInt(timer[0]) - 8 
        var minutes = parseInt(timer[1]) / 60
        // Displacement = (Borders) + (Full Hours) + (Minutes)
        var final = ((0.1 * hours) + (hours * 5) + minutes * 5) + "rem"

        el.style.top = final
        el.style.left = "0.1rem";

        // Выставление ширины блока в зависимости от ширины колонны
        // let element = <HTMLElement>document.getElementById('test');
        // let style = window.getComputedStyle(element);
        // let width = style.getPropertyValue('width');
        // // console.log(width);
        // el.style.width = width;
      }
    }
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
