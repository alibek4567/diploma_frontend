import { Component } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'schedule-system';
  opened = false;

  language: string | null

  constructor(translate: TranslateService, private titleService: Title) {    
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
  }

  public setLanguage(event: any) {
    sessionStorage.setItem("language", event.value)
    window.location.reload()
  }

  public setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle)
  }
}
