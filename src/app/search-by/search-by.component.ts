import { Component, ElementRef, OnInit, ViewChild, Renderer2 } from '@angular/core';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { BarController, BarElement, CategoryScale, Chart, LinearScale, Tooltip} from 'chart.js';
import { ApiCallerService } from '../api-caller.service';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult } from '@azure/msal-browser';
import { HttpClient } from '@angular/common/http';
Chart.register(BarElement, BarController, CategoryScale, LinearScale, Tooltip, ChartDataLabels);

@Component({
  selector: 'app-search-by',
  templateUrl: './search-by.component.html',
  styleUrls: ['./search-by.component.scss']
})
export class SearchByComponent implements OnInit {

  user: any
  allTimeTables: any
  timeArray = [8,9,10,11,12,13,14,15,16,17,18]
  d1: any
  d2: any
  d3: any
  d4: any
  d5: any  

  profileInfo: any

  languages = new Map<string, string>([
    ["kz", "Kazaksha"],
    ["en", "English"],
    ["ru", "Русский"]
  ])

  Subjects = [
    {
      "title": "",
      "location": "",
      "startatime": "",
      "endTime": "",
      "tutor": ""
    }
  ]

  apiResponse: string
  
  constructor(private api: ApiCallerService, public renderer: Renderer2, private msalService: MsalService, private httpClient: HttpClient) {
    var response = this.api.sendGetRequest("/getTimetable/1")
    response.subscribe(data => {
      const timeTables = JSON.parse(JSON.stringify(data))
      this.d1 = timeTables.payload["d1"]
      this.d2 = timeTables.payload["d2"]
      this.d3 = timeTables.payload["d3"]
      this.d4 = timeTables.payload["d4"]
      this.d5 = timeTables.payload["d5"]
      this.updateHtml(this.d1)
      this.updateHtml(this.d2)
      this.updateHtml(this.d3)
      this.updateHtml(this.d4)
      this.updateHtml(this.d5)
    }, error => {
    })
   
   }

  ngOnInit(): void {
    this.msalService.instance.handleRedirectPromise().then(
      res => {
        if(res != null && res.account != null){
          this.msalService.instance.setActiveAccount(res.account)
          console.log(this.msalService.instance.getActiveAccount())
        }
      }
    )
  }

  ngAfterViewInit(): void {
      // (<HTMLElement>document.getElementById(""+item.classtime_time.chartAt(0))).className = "block"
  }

  isLoggedIn(){
    return this.msalService.instance.getActiveAccount() != null
  }

  login(){
    this.msalService.loginRedirect();
    // this.msalService.loginPopup().subscribe( (response: AuthenticationResult) => {
    //   this.msalService.instance.setActiveAccount(response.account)
    // })
  }

  logout(){
    this.msalService.logout()
  }
  
  getUser(){
    return this.msalService.instance.getActiveAccount()?.name
  }

  callProfile(){
    this.httpClient.get("https://graph.microsoft.com/beta/me/profile").subscribe( res => {
      this.apiResponse = JSON.stringify(res)
      this.profileInfo = res
      console.log(this.profileInfo.positions[0].detail.company.department)
    })
  }

  updateHtml(data: any){
    if(data!=null){
      for(let item of data){
        let el = (<HTMLElement>document.getElementById(item.classtime_day+"_"+(item.classtime_time).split(':')[0]));
        el.className = "block";
        el.insertAdjacentHTML("beforeend", "<p style='margin: 0 0 0.5rem 0;; padding: 0; font-size:0.9rem'>"+item.subject+"</p>");
        el.insertAdjacentHTML("beforeend", "<p style='margin: 0 0 0.5rem 0;; padding: 0; font-size:0.8rem'>"+item.tutor+"</p>")
        el.insertAdjacentHTML("beforeend", "<p style='margin: 0 0 0.5rem 0;; padding: 0; font-size:0.8rem'>"+item.room+"</p>");
      }
    }
  }
}
