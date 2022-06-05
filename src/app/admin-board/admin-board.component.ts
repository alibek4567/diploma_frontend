import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiCallerService } from '../api-caller.service';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-admin-board',
  templateUrl: './admin-board.component.html',
  styleUrls: ['./admin-board.component.scss']
})
export class AdminBoardComponent implements OnInit {

  //All booking in processing

  requests: []
  searchedRequests: any[] = []
  room: string = ''
  date: string = ''
  start_time: string = ''
  end_time: string = ''

  constructor(public api: ApiCallerService, public httpClient: HttpClient, public router: Router, public app: AppComponent) {
    if(!app.isLoggedIn() || !app.isAdmin) { 
      router.navigateByUrl('')
    }
        
    var response = api.sendGetRequest("/booking/requests")
    response.subscribe(data => {
      this.requests = JSON.parse(JSON.stringify(data)).payload
      this.searchedRequests = this.requests
      // console.log(this.requests)
    }, error => {
    })
   }

  ngOnInit(): void { }

  filter(){
    this.searchedRequests = this.requests.filter((data: any) => {
      return data.room.toLowerCase().includes(this.room.toLowerCase())
    })
    //this.searchedRequests = this.requests.filter(this.roomFilter)
  }

  accept(booking: any){
    const subject = "Booking Status: Accepted"
    const content = "Dear " + booking.reserver + ", your booking has been accepted \n" +
                    "Cabinet: "+booking.room +'\n' + 
                    "Booking Reason: "+booking.reason +'\n' +
                    "Date: "+this.app.formatDate(booking.date) +'\n' +
                    "Time: "+booking.start_time + '-' + booking.end_time

    const response = this.api.sendPostRequestWithAuth('/booking/confirm/'+booking.id, '')
    const r = response.subscribe(data =>{
    this.app.sendEmail(subject, content, booking.reserver_email).subscribe(res => {
      const message = JSON.stringify(res)
      //console.log(message);

      this.router.navigate(['/admin-board'])
      .then(() => {
        window.location.reload();
      });
    })
    },error =>{
      //console.log(error);
    })
  }

  reject(booking: any){
    const subject = "Booking Status: Rejected"
    const content = "Dear " + booking.reserver + ",\nyour booking has been rejected \n" +
                    "Cabinet: "+booking.room +'\n' + 
                    "Booking Reason: "+booking.reason +'\n' +
                    "Date: "+this.app.formatDate(booking.date) +'\n' +
                    "Time: "+booking.start_time + '-' + booking.end_time

    const response = this.api.sendPostRequestWithAuth('/booking/reject/'+booking.id, '')
    const r = response.subscribe(data =>{
    this.app.sendEmail(subject, content, booking.reserver_email).subscribe(res => {
      const message = JSON.stringify(res)
      //console.log(message);

      this.router.navigate(['/admin-board'])
      .then(() => {
        window.location.reload();
      });
    })
    },error =>{
      //console.log(error);
    })
  }
}
