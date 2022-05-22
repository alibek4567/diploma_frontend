import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { Router } from '@angular/router';
import { ApiCallerService } from '../api-caller.service';
import { ItemsLoaderService } from '../items-loader.service';

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss']
})
export class BookingComponent implements OnInit {

  timeTable: any
  timeTables: any

  constructor(private api: ApiCallerService, private router: Router, public items: ItemsLoaderService) {
  }

  ngOnInit(): void {
  }

  cabinet = ''
  room_id = ''
  date: Date = new Date();
  startTime: ''
  endTime: ''
  comment: ''

  setCabinet(event: any) { 
    this.cabinet = event.target.value;
  }

  pickCabinet(data: any, id: any) {
    this.cabinet = data
    this.room_id = id
    var response = this.api.sendGetRequest("/booking/room/"+id)
    response.subscribe(data => {
      const timeTables = JSON.parse(JSON.stringify(data))
      this.timeTables = timeTables.payload
      console.log(this.timeTables)
    }, error => {
    })
  }

  setDate(event: any) { 
    this.date = event.target.value;
    this.timeTable = this.timeTables['d'+this.date.getDay()]
    console.log(this.date)
  }

  sliceString(data: string){
    return data.split("+")[1]
  }

  formatDate(data: Date){
    let formDate = data.toString()
    return formDate.slice(0, 11)
  }

  setTime(message: string, event: any){
    if(message == "start"){
      this.startTime = event.target.value
    }
    this.endTime = event.target.value
  }

  setComment(event: any){
    this.comment = event.target.value;
  }

  send(){
    let values = {
      room: this.cabinet, 
      reserver: sessionStorage.getItem("username"), 
      reserver_info: sessionStorage.getItem("department"), 
      day: "d1",
      start_time: this.startTime,
      end_time: this.endTime,
      reason: this.comment,
      room_id: 1,
      reserver_id: sessionStorage.getItem("id"),
      date: this.date,
  }

    var response = this.api.sendPostRequest("/booking/create", values)
    response.subscribe(data => {
      this.router.navigateByUrl('/booking');
    }, error => {
      console.log(error)
    });
  }
}
