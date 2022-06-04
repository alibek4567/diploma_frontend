import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
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

  reject(booking: any){
    const subject = "Booking Status: Deleted"
    const content = "Dear " + booking.reserver + ",\nyour booking has been deleted \n" +
                    "Cabinet: "+booking.room +'\n' + 
                    "Booking Reason: "+booking.reason +'\n' +
                    "Date: "+this.formatDate(booking.date) +'\n' +
                    "Time: "+booking.start_time + '-' + booking.end_time

    const response = this.api.sendPostRequestWithAuth('/booking/reject/'+booking.id, '')
    const r = response.subscribe(data =>{
    this.app.sendEmail(subject, content, booking.reserver_email).subscribe(res => {
      const message = JSON.stringify(res)
      console.log(message);

      this.router.navigate(['/admin-confirmed'])
      .then(() => {
        window.location.reload();
      });
    })
    },error =>{
      console.log(error);
    })
  }
}

