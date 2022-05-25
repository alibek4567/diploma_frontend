import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { Router } from '@angular/router';
import { retry } from 'rxjs';
import { ApiCallerService } from '../api-caller.service';
import { ItemsLoaderService } from '../items-loader.service';

export interface Select {
  date: Date,
  cabinet: string,
  startTime: string,
  endTime: string,
  comment: string,
  cabinet_id: string
}

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss']
})

export class BookingComponent implements OnInit {

  // By Date = set Date + Time
  // By Room = set Date + Room

  events: any
  rooms: any

  searchedRooms: any

  today = new Date()
  maxDate = new Date( new Date().setDate(this.today.getDate() + 14) )
  cabinet: string
  room_id: string
  date: Date = new Date();
  select = "Date"
  message: string
  checked: number

  byRoom: Select = {
    cabinet: '',
    startTime: '',
    endTime: '',
    comment: '',
    date: new Date,
    cabinet_id: ''
  }

  byDate: Select = {
    cabinet: '',
    startTime: '',
    endTime: '',
    comment: '',
    date: new Date,
    cabinet_id: ''
  }

  constructor(private api: ApiCallerService, private router: Router, public items: ItemsLoaderService) {
    this.searchedRooms = this.items.rooms
  }

  ngOnInit(): void {
  }

  formatCabinet(room: string){
    return room.split('-')[1]
  }

  cabinetByRoom() {
    var response = this.api.sendGetRequest("/booking/room/"+this.byRoom.cabinet_id)
    response.subscribe(r => {
      const data = JSON.parse(JSON.stringify(r))
      if(data.payload['d'+this.date.getDay()] != null){
        this.events = data.payload['d'+this.date.getDay()]
        this.message = "success"
        console.log(this.events);
      }
      else{
        this.message = "empty"
      }
    }, error => {
      this.message = "empty"
    })
  }

  filter(){
    this.searchedRooms = this.items.rooms.filter((data: any) => {
      return data.name.toLowerCase().includes(this.byRoom.cabinet.toLowerCase());
    })
    console.log(this.byRoom.cabinet);
  }

  cabinetByDate(){
    if(this.byDate.date && this.byDate.startTime && this.byDate.endTime && (this.byDate.endTime > this.byDate.startTime)){
      let data = {
        date: this.byDate.date, 
        start_time: this.byDate.startTime , 
        end_time: this.byDate.endTime
      }
      var response = this.api.sendPostRequest("/booking/datetime", data)
      response.subscribe(data => {
        const timeTables = JSON.parse(JSON.stringify(data))
        this.rooms = timeTables.payload
        this.message = 'success'
        console.log(this.rooms);
      }, error => {
      })
    }
    else{
      this.message = 'empty'
      this.rooms = null
      console.log("test")
    }
  }

  setSelect(event: any) {
    this.select = event.value
  }

  setDate(event: any) { 
    this.date = event.value;
    // this.timeTable = this.timeTables['d'+this.date.getDay()]
  }

  setCheck(name: string,id: string){
    this.checked = parseInt(id)
    this.byDate.cabinet = name
    this.byDate.cabinet_id = id
    console.log(this.byDate.cabinet, this.byDate.cabinet_id)
  }

  sliceString(data: string){
    return data.split("+")[1]
  }

  formatDate(data: Date){
    let formDate = data.toString()
    return formDate.slice(3, 10) + ' | ' + formDate.slice(0, 3)
  }

  show(select: string){
    if(select == 'Date'){
      console.log(this.byDate);
    }
    else{
      console.log(this.byRoom);
    }
  }

  setId(id: string){
    this.byRoom.cabinet_id = id
  }

  send(){
    let data = null
    if(this.select == 'Room'){
      data = this.byRoom
    }
    else if(this.select == 'Date'){
      data = this.byDate
    }
    else{
      return
    }

    let values = {
      room: data.cabinet, 
      reserver: sessionStorage.getItem("username"), 
      reserver_info: sessionStorage.getItem("department"), 
      day: "d"+this.date.getDay(),
      start_time: data.startTime,
      end_time: data.endTime,
      reason: data.comment,
      room_id: parseInt(data.cabinet_id),
      reserver_id: sessionStorage.getItem("id"),
      date: data.date,
    }

    var response = this.api.sendPostRequestWithAuth("/booking/create", values)
    response.subscribe(data => {
      this.router.navigateByUrl('/booking');
    }, error => {
      console.log(error)
    });
    
  }

}

