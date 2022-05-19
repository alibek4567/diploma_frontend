import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { ApiCallerService } from '../api-caller.service';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss']
})
export class BookingComponent implements OnInit {

  timeTable: any

  constructor(private api: ApiCallerService) {
    var response = this.api.sendGetRequest("/booking/room/1")
    response.subscribe(data => {
      const timeTables = JSON.parse(JSON.stringify(data))
      this.timeTable = timeTables.payload["d1"]
      console.log(this.timeTable)
    }, error => {
    })
   }

  ngOnInit(): void {
  }

  cabinet = ''
  date: Date = new Date();

  setCabinet(event: any) { 
    this.cabinet = event.target.value;
  }

  setDate(event: any) { 
    this.date = event.target.value;
    console.log(this.date)
  }

  sliceString(data: string){
    return data.split("+")[1]
  }
}
