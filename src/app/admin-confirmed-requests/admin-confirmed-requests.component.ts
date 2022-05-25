import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiCallerService } from '../api-caller.service';

@Component({
  selector: 'app-admin-confirmed-requests',
  templateUrl: './admin-confirmed-requests.component.html',
  styleUrls: ['./admin-confirmed-requests.component.scss']
})
export class AdminConfirmedRequestsComponent implements OnInit {

  request: string

  requests: any
  searchedRequests: any

  constructor(public api: ApiCallerService, public router: Router) { 
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

  reject(data: any){
    const response = this.api.sendPostRequestWithAuth('/booking/reject/'+data, '')
    response.subscribe(data => {
      console.log(this.api.jwt)
    }, error => {
    })
    this.router.navigate(['/adminConfirmed'])
    .then(() => {
      window.location.reload();
    });
  }

}
