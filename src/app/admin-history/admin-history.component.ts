import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiCallerService } from '../api-caller.service';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-admin-history',
  templateUrl: './admin-history.component.html',
  styleUrls: ['./admin-history.component.scss']
})
export class AdminHistoryComponent implements OnInit {

  bookings: any
  searchedBookings: any
  room: string

  constructor(public api: ApiCallerService, public app: AppComponent, public router: Router) { 
    if(!app.isLoggedIn() && !app.isAdmin){
      router.navigateByUrl('')
    }

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
