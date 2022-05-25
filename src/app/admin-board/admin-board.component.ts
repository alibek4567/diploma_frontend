import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiCallerService } from '../api-caller.service';

@Component({
  selector: 'app-admin-board',
  templateUrl: './admin-board.component.html',
  styleUrls: ['./admin-board.component.scss']
})
export class AdminBoardComponent implements OnInit {

  requests: any
  searchedRequests: any
  room: string

  constructor(public api: ApiCallerService, public httpClient: HttpClient, public router: Router) {
    console.log(api.jwt);
    
    var response = api.sendGetRequest("/booking/requests")
    response.subscribe(data => {
      this.requests = JSON.parse(JSON.stringify(data)).payload
      this.searchedRequests = this.requests
      console.log(this.requests)
    }, error => {
    })
   }

  ngOnInit(): void {
  }

  formatDate(date: string){
    return date.split('T')[0]
  }

  filter(){
    this.searchedRequests = this.requests.filter((data: any) => {
      return data.room.toLowerCase().includes(this.room.toLowerCase());
    })
    console.log(this.room);
  }

  accept(data: any){
    const response = this.api.sendPostRequestWithAuth('/booking/confirm/'+data, '')
    response.subscribe(data => {
      console.log(this.api.jwt)
    }, error => {
    })
    this.router.navigate(['/adminboard'])
    .then(() => {
      window.location.reload();
    });
  }

  reject(data: any){
    const response = this.api.sendPostRequestWithAuth('/booking/reject/'+data, '')
    response.subscribe(data => {
      console.log(this.api.jwt)
    }, error => {
    })
    this.router.navigate(['/adminboard'])
    .then(() => {
      window.location.reload();
    });
  }

}
