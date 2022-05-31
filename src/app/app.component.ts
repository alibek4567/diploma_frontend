import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { ApiCallerService } from './api-caller.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'schedule-system';
  opened = false;
  username: any

  languages = new Map<string, string>([
    ["kz", "Қазақша"],
    ["en", "English"],
    ["ru", "Русский"]
  ])

  //Authorization data
  apiResponse: string
  email: any
  id: any
  department: any
  profileInfo: any
  name = localStorage.getItem('username')
  language: string | null
  isAdmin = false
  today = new Date()

  constructor(translate: TranslateService, private titleService: Title, private api: ApiCallerService, 
    private msalService: MsalService,
    public httpClient: HttpClient,
    public router: Router) {    
        
    if(this.isLoggedIn()){
      console.log(localStorage.getItem('id'));
      const response = api.sendGetRequestWithAuth('/isAdmin/'+localStorage.getItem('id'))
      response.subscribe(data =>{
        const r = JSON.parse(JSON.stringify(data))
        console.log(r.payload);
        if(r.payload != null){
          this.isAdmin = true
        }
      }, error => {
      })
    }  
    translate.setDefaultLang("en")

    //translate.use(localStorage.getItem('language') || 'en');

    // Re check it
    this.language = localStorage.getItem('language')
    if (this.language == null) {
      this.language = 'en'
      localStorage.setItem('language', this.language)
    }
    translate.use(this.language)

    this.setTitle("AITU Schedule")

    this.language = localStorage.getItem("language")
    if (this.language == null) {
      this.language = "en"
      localStorage.setItem("language", this.language)
    }

    this.username = localStorage.getItem('username')
  }

  ngOnInit(): void {
    this.msalService.instance.handleRedirectPromise().then( 
      res => {
        if(res != null && res.account != null){
          this.msalService.instance.setActiveAccount(res.account)
          this.getUser()
          this.callProfile()
          localStorage.setItem("username", this.username)
          console.log(this.msalService.instance.getActiveAccount());
          localStorage.setItem("email", this.email)
          localStorage.setItem("id", this.id)
          var response = this.api.sendPostRequest("/login/office", {email: this.email, organization: "Astana IT University"})
          response.subscribe(data => {
            const r = JSON.parse(JSON.stringify(data))
            // this.api.jwt = r.payload       
            localStorage.setItem('token', r.payload)
          }, error => {
            console.log(error)
          });
        }
      }
    )
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
      console.log(this.department)
      localStorage.setItem("department", this.department)
    })
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
    localStorage.clear()
  }

  public setLanguage(event: any) {
    localStorage.setItem("language", event.value)
    window.location.reload()
  }

  public setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle)
  }
}

function setWithExpiry(key: string, value: any) {
	const now = new Date()

	// `item` is an object which contains the original value
	// as well as the time when it's supposed to expire
	const item = {
		value: value,
		expiry: now.getDate() + 7,
	}
	localStorage.setItem(key, JSON.stringify(item))
}

