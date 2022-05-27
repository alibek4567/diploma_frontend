import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiCallerService } from '../api-caller.service';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-admin-confirmed-requests',
  templateUrl: './admin-confirmed-requests.component.html',
  styleUrls: ['./admin-confirmed-requests.component.scss']
})
export class AdminConfirmedRequestsComponent implements OnInit {

  request: string

  requests: any
  searchedRequests: any

  constructor(public api: ApiCallerService, public router: Router, public app: AppComponent, public httpClient: HttpClient) { 
    if(!app.isLoggedIn() && !app.isAdmin){
      router.navigateByUrl('')
    }

    var response = api.sendGetRequest("/booking/confirm")
    response.subscribe(data => {
      this.requests = JSON.parse(JSON.stringify(data)).payload
      this.searchedRequests = this.requests
      console.log(this.requests)
    }, error => {
    })
  }

  ngOnInit(): void {}

  formatDate(date: string){
    return date.split('T')[0]
  }

  filter(){
    this.searchedRequests = this.requests.filter((data: any) => {
      return data.room.toLowerCase().includes(this.request.toLowerCase());
    })
    console.log(this.request);
  }

  reject(data: any, email: string){
    const response = this.api.sendPostRequestWithAuth('/booking/reject/'+data, '')
    
    const sendMail = {
      message: {
        subject: 'Booking status',
        body: {
          contentType: 'Text',
          content: 'Your booking was rejected'
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

    this.api.sendPostRequest("https://graph.microsoft.com/v1.0/me/sendMail", sendMail).subscribe(res => {
      const message = JSON.stringify(res)
      console.log(message);
    })
  }
}
