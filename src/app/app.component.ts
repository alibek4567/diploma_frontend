import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { MsalService } from '@azure/msal-angular';
import { MAT_DATE_LOCALE, DateAdapter } from '@angular/material/core';

import { ApiCallerService } from './api-caller.service';
import { ItemsLoaderService } from './items-loader.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit{
  // standard settings
  opened = false;

  languages = new Map<string, string>([
    ["kz", "Қазақша"],
    ["en", "English"],
    ["ru", "Русский"]
  ])

  //Authorization data
  apiResponse: string
  id: any
  email: any
  username: any
  profileInfo: any
  department: any
  language: string | null
  isAdmin = false

  constructor(private titleService: Title, public router: Router, public httpClient: HttpClient, translate: TranslateService, 
    private msalService: MsalService, @Inject(MAT_DATE_LOCALE) private _locale: string, private _adapter: DateAdapter<any>,
    private api: ApiCallerService, public items: ItemsLoaderService) {    
      
      translate.setDefaultLang("en")
      this.language = localStorage.getItem('language')
      if (this.language == null) {
        this.language = 'en'
        localStorage.setItem('language', this.language)
      }
      translate.use(this.language)
    
      this.setTitle("AITU Schedule")
      
      this.checkAdmin()  
      
      this._locale = this.setCalendar(localStorage.getItem('language') || 'en') 
      this._adapter.setLocale(this._locale) 

      this.username = localStorage.getItem('username')
  }

  setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle)
  }

  setLanguage(event: any) {
    localStorage.setItem("language", event.value)
    window.location.reload()
  }

  ngOnInit(): void {
    this.msalService.instance.handleRedirectPromise().then( 
      res => {
        if(res != null && res.account != null){
          this.msalService.instance.setActiveAccount(res.account)
          this.getUser()
          this.callProfile()
          localStorage.setItem("username", this.username)
          localStorage.setItem("email", this.email)
          localStorage.setItem("id", this.id)
          var response = this.api.sendPostRequest("/login/office", {email: this.email, organization: "Astana IT University"})
          response.subscribe(data => {
            const r = JSON.parse(JSON.stringify(data))
            // this.api.jwt = r.payload       
            localStorage.setItem('token', r.payload)
            this.checkAdmin()
          }, error => {
            //console.log(error)
          });
        }
      }
    )
  }

  checkAdmin() {
    if (this.isLoggedIn()) {
      const response = this.api.sendGetRequestWithAuth('/isAdmin/' + localStorage.getItem('id'))
      response.subscribe(data =>{
        const r = JSON.parse(JSON.stringify(data))
        if(r.payload != null){
          this.isAdmin = true
        }
      }, error => {
        //console.log(error)
      })
    }  
  }

  getUser() {
    this.username = this.msalService.instance.getActiveAccount()?.name
    this.id = this.msalService.instance.getActiveAccount()?.localAccountId
    this.email = this.msalService.instance.getActiveAccount()?.username
  }

  callProfile() {
    this.httpClient.get("https://graph.microsoft.com/beta/me/profile").subscribe(res => {
      this.apiResponse = JSON.stringify(res)
      this.profileInfo = res
      this.department = this.profileInfo.positions[0].detail.company.department
      localStorage.setItem("department", this.department)
    })
  }

  isLoggedIn() {
    let flag = this.msalService.instance.getActiveAccount() != null
    if (!flag) {
      localStorage.clear()
    }
    return flag
  }

  login() {
    this.msalService.loginRedirect();
  }

  logout() {
    this.msalService.logout()
    localStorage.clear()
  }

  setCalendar(language: string) {
    switch(language){
      case 'ru':
      return 'ru-RU';
      case 'en':
      return 'en-US';
      case 'kz':
      return 'ru-RU';
    }
    return 'en-US'
  }

  myFilter = (d: Date | null): boolean => {
    const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    return day !== 0;
  };

  sendEmail(subject: string, content: string, email: string) {
    const sendMail = {
      message: {
        subject: subject,
        body: {
          contentType: 'Text',
          content: content
        },
        toRecipients: [
          {
            emailAddress: {
              address: email
            }
          }
        ],
      },
      saveToSentItems: 'true'
    };
  
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Accept': 'application/json',
        })
      };
  
    return this.httpClient.post("https://graph.microsoft.com/beta/me/sendMail", sendMail, httpOptions) 
  }
  
  waitForElm(selector: string) {
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
    
  getTodaysDate(offset: number): Date {
    let today = new Date();
    let utc = today.getTime() + (today.getTimezoneOffset() * 60000);
    let dateByOffset = new Date(utc + (3600000 * offset))
    
    return dateByOffset
  }
    
  getWeekDates(date: Date): Map<string, Date> {
    let currentDay = date.getDay()
    let dayDifference = currentDay
    let weekDates = new Map<string, Date>()
    
    for (let i = 0; i < 7; i ++) {
      let temp = new Date(date)
      if (i == currentDay) {
        weekDates.set('d' + i, temp)
      } else if (i < currentDay) {
        weekDates.set('d' + i, new Date(temp.setDate(temp.getDate() - dayDifference)))
        dayDifference--
      } else {
        dayDifference++
        weekDates.set('d' + i, new Date(temp.setDate(temp.getDate() + dayDifference)))
      }
    }
    
    return weekDates
  }
    
  toGolangDateFormat(date: Date): string {
    // example: "2022-06-19T00:00:00Z" - golang format
    let rowDate = date.toLocaleDateString().split('.')
    let formatDate = rowDate[2] + '-' + rowDate[1] + '-' + rowDate[0] + 'T00:00:00Z'
    return formatDate
  }
    
  compareTime(time1: string, time2: string): number {
    // 1 = time1 > time2
    // 0 = time1 == time2
    // -1 = time1 < time2
    
    var time1date = new Date("1970-01-01 " + time1)
    var time2date = new Date("1970-01-01 " + time2)
    
    if (time1date.getTime() > time2date.getTime()) {
      return 1
    } else if (time1date.getTime() < time2date.getTime()) {
      return -1
    }
    return 0
  }
    
  // string time converts in minutes (number) format
  stringTimeInMinutes(time: string): number {
    let hours = parseInt(time.split(':')[0])
    let minutes = parseInt(time.split(':')[1])
    return (hours * 60) + minutes
  }

  // display selected formatted date
  displaySelectedDate(date: Date): string {
    let language: string = localStorage.getItem('language') || 'en'

    let month = this.items.months.get(language)?.get(date.getMonth())
    let day = this.items.days.get(language)?.get(date.getDay())

    return month + ' ' + date.getDate() + ' | ' + day
  }
}



