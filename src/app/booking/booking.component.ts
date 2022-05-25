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

  events: any
  rooms: any

  constructor(private api: ApiCallerService, private router: Router, public items: ItemsLoaderService) {
    console.log(this.maxDate);
    
    this.select = false
  }

  ngOnInit(): void {
  }

  today = new Date()
  maxDate = new Date( new Date().setDate(this.today.getDate() + 14) )
  cabinet = ''
  room_id = ''
  date: Date = new Date();
  startTime: ''
  endTime: ''
  comment: ''

  select: boolean

  minTime = '08:00'

  setCabinet(event: any) { 
    this.cabinet = event.target.value;
  }

  pickCabinet(name: any, id: any) {
    this.cabinet = name
    this.room_id = id
    var response = this.api.sendGetRequest("/booking/room/"+id)
    response.subscribe(r => {
      const data = JSON.parse(JSON.stringify(r))
      if(data.payload['d'+this.date.getDay()] != null){
        this.events = data.payload['d'+this.date.getDay()]
      }
      else{
        console.log("No events")
      }
    }, error => {
    })
  }

  // listCabinet(date: any, startTime: any, endTime: any){
  //   if(date && startTime && endTime && (endTime > startTime)){
  //     console.log(date, startTime, endTime)
  //     let data = {date: date, start_time: startTime, end_time: endTime}
  //     var response = this.api.sendPostRequest("/booking/datetime", data)
  //     response.subscribe(data => {
  //       const timeTables = JSON.parse(JSON.stringify(data))
  //       this.rooms = timeTables.payload
  //       console.log(this.rooms);
  //     }, error => {
  //     })
  //   }
  //   else{
  //     this.rooms = null
  //   }
  // }

  setSelect() {
    this.select = !this.select
  }

  setDate(event: any) { 
    this.date = event.target.value;
    // this.timeTable = this.timeTables['d'+this.date.getDay()]
  }

  sliceString(data: string){
    return data.split("+")[1]
  }

  formatDate(data: Date){
    let formDate = data.toString()
    return formDate.slice(3, 10) + ' | ' + formDate.slice(0, 3)
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
