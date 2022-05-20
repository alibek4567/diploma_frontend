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

  constructor(translate: TranslateService, private titleService: Title) {    
    translate.setDefaultLang("en")

    translate.use(sessionStorage.getItem('language') || 'en');

    this.setTitle("AITU Schedule")
  }

  public setTitle(newTitle: string) {
    this.titleService.setTitle(newTitle)
  }
}
