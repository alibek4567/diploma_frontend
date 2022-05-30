import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  //All confirmed bookings from now to next 2 weeks

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
      console.log(this.searchedRequests)
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
    const message = response.subscribe(data =>{
    },error =>{
      console.log(error);
    })

    // setTimeout(() => {
    // }, 3000);
    
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

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Accept': 'application/json',
        })
      };

    console.log("Sending message")
    this.httpClient.post("https://graph.microsoft.com/beta/me/sendMail", sendMail, httpOptions).subscribe(res => {
      const message = JSON.stringify(res)
      console.log(message);

      this.router.navigate(['/admin-confirmed'])
      .then(() => {
        window.location.reload();
      });
    })
    
  }
}
