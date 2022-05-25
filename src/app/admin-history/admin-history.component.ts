import { Component, OnInit } from '@angular/core';
import { ApiCallerService } from '../api-caller.service';

@Component({
  selector: 'app-admin-history',
  templateUrl: './admin-history.component.html',
  styleUrls: ['./admin-history.component.scss']
})
export class AdminHistoryComponent implements OnInit {

  bookings: any
  searchedBookings: any
  room: string

  constructor(public api: ApiCallerService) { 
    var response = api.sendGetRequest("/booking")
    response.subscribe(data => {
      this.bookings = JSON.parse(JSON.stringify(data)).payload
      this.searchedBookings = this.bookings
      console.log(this.bookings)
    }, error => {
    })
  }

  ngOnInit(): void {
  }

  formatDate(date: string){
    return date.split('T')[0]
  }

  filter(){
    this.searchedBookings = this.bookings.filter((data: any) => {
      return data.room.toLowerCase().includes(this.room.toLowerCase());
    })
    console.log(this.room);
  }

}
