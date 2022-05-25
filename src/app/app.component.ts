import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { ApiCallerService } from './api-caller.service';
import { HttpClient } from '@angular/common/http';

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
  name = sessionStorage.getItem('username')

  language: string | null

  constructor(translate: TranslateService, private titleService: Title, private api: ApiCallerService, 
    private msalService: MsalService,
    public httpClient: HttpClient) {    
    translate.setDefaultLang("en")

    //translate.use(sessionStorage.getItem('language') || 'en');

    // Re check it
    this.language = sessionStorage.getItem('language')
    if (this.language == null) {
      this.language = 'en'
      sessionStorage.setItem('language', this.language)
    }
    translate.use(this.language)

    this.setTitle("AITU Schedule")

    this.language = sessionStorage.getItem("language")
    if (this.language == null) {
      this.language = "en"
      sessionStorage.setItem("language", this.language)
    }

    this.username = sessionStorage.getItem('username')
  }

  ngOnInit(): void {
    this.msalService.instance.handleRedirectPromise().then(
      res => {
        if(res != null && res.account != null){
          this.msalService.instance.setActiveAccount(res.account)
          this.getUser()
          this.callProfile()
          sessionStorage.setItem("username", this.username)
          console.log(this.msalService.instance.getActiveAccount());
          sessionStorage.setItem("email", this.email)
          sessionStorage.setItem("id", this.id)
          var response = this.api.sendPostRequest("/login/office", {email: this.email, organization: "Astana IT University"})
          response.subscribe(data => {
            const r = JSON.parse(JSON.stringify(data))
            this.api.jwt = r.payload       
            console.log(this.api.jwt);
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
    this.httpClient.get("https://graph.microsoft.com/beta/me/profile").subscribe( res => {
      this.apiResponse = JSON.stringify(res)
      this.profileInfo = res
      this.department = this.profileInfo.positions[0].detail.company.department
      sessionStorage.setItem("department", this.department)
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
    sessionStorage.clear()
  }

  public setLanguage(event: any) {
    sessionStorage.setItem("language", event.value)
    window.location.reload()
  }

  public setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle)
  }
}
