import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { Router } from '@angular/router';
import { MdePopover, MdePopoverTrigger } from '@material-extended/mde';
import { catchError, NotFoundError, retry, throwError } from 'rxjs';
import { ApiCallerService } from '../api-caller.service';
import { AppComponent } from '../app.component';
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

  @ViewChild(MdePopoverTrigger, { static: false }) trigger: MdePopoverTrigger
  formArray = ['Room', 'Reserver', 'Reserver_Info', 'Day', 'Start Time', 'End Time', 'Reason', 'Room ID', 'Reserver ID', 'Date']

  // By Date = set Date + Time
  // By Room = set Date + Room

  events: any[] = []
  rooms: any
  searchedRooms: any

  today = new Date()
  maxDate = new Date( new Date().setDate(this.today.getDate() + 14) )
  cabinet: string
  room_id: string
  date: Date = new Date();
  select = "Date"
  messageByRoom: string
  messageByDate: string
  checked: number
  message: string

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

  constructor(private api: ApiCallerService, private router: Router, public items: ItemsLoaderService, public app: AppComponent) {
    if(!app.isLoggedIn()){
      router.navigateByUrl('')
    }
    this.searchedRooms = this.items.rooms
  }

  ngOnInit(): void {
  }

  formatCabinet(room: string){
    return room.split('-')[1]
  }

  cabinetByRoom() {
    var response = this.api.sendPostRequest("/booking/room/"+this.byRoom.cabinet_id, {date: this.byRoom.date})
    response.subscribe(r => {
      const data = JSON.parse(JSON.stringify(r))
      if(data.payload != null){
        for(let item of data.payload){
          let roomDate = item.date
          if(roomDate.split('T')[0] == this.dateSplit(this.byRoom.date)){
            this.events.push(item)
            this.events.sort(function(a, b){if(a.start_time > b.start_time){return 1}else{return -1}})
          }
        }
        this.messageByRoom = ''
        if(this.events.length == 0){
          this.messageByRoom = 'The Cabinet is free'
        }
      }
    }, error => {
      this.getServerErrorMessage(error)
    })
  }

  getTimetableByDate(){
    const response = this.api.sendGetRequest("/timetable/room/" + this.byRoom.cabinet_id)
    response.subscribe(data => {
      const schedule = JSON.parse(JSON.stringify(data))
      if(schedule.payload['d'+this.byRoom.date.getDay()] != undefined){
        for(let item of schedule.payload['d'+this.byRoom.date.getDay()]){
          this.events.push({start_time: item.start_time, end_time: item.end_time, reason: item.subject, reserver: item.tutor})
          this.events.sort(function(a, b){if(a.start_time > b.start_time){return 1}else{return -1}})
        }
        this.messageByRoom = ''
        if(this.events.length == 0){
          this.messageByRoom = 'The Cabinet is free'
        }
      }
    }, error => {
    })
  }

cabinetByDate(){
    let data = {
      date: this.byDate.date, 
      start_time: this.byDate.startTime , 
      end_time: this.byDate.endTime
    }
    var response = this.api.sendPostRequest("/booking/datetime", data)
    response.subscribe(data => {
      const timeTables = JSON.parse(JSON.stringify(data))
      this.rooms = timeTables.payload
      this.messageByDate = ''
      if(this.rooms.length == 0){
        this.messageByDate == 'No Available Rooms'
      }
    }, error => {
      console.log(error);
    }
  )
}

  filter(){
    this.searchedRooms = this.items.rooms.filter((data: any) => {
      return data.name.toLowerCase().includes(this.byRoom.cabinet.toLowerCase());
    })  
  }

  getData(){
    this.events = []
    this.cabinetByRoom()
    this.getTimetableByDate()
  }

  setSelect(event: any) {
    this.select = event.value
  }

  setDate(event: any) { 
    this.date = event.value;
    // this.timeTable = this.timeTables['d'+this.date.getDay()]
  }

  setCheck(name: string,id: string){
    if(this.byDate.cabinet_id == id){
    this.checked = 0
    this.byDate.cabinet = ''
    this.byDate.cabinet_id = ''
    }
    else{
      this.checked = parseInt(id)
      this.byDate.cabinet = name
      this.byDate.cabinet_id = id
      console.log(this.byDate.cabinet, this.byDate.cabinet_id)
    }
  }

  sliceString(data: string){
    return data.split("+")[1]
  }

  formatDate(data: Date){
    let formDate = data.toString()
    return formDate.slice(3, 10) + ' | ' + formDate.slice(0, 3)
  }

  dateSplit(date: Date){
    let date2 = date.toLocaleString().split(',')[0]
    let date3 = date2.split('.')
    return date3[2]+'-'+date3[1]+'-'+date3[0]
  }

  show(select: string){
    if(select == 'Date'){
      console.log(this.byDate);
    }
    else{
      console.log(this.byRoom);
    }
  }

  showEvent(event: any){
    console.log(event);
  }

  setValues(event: any){
    this.byRoom.cabinet_id = event.option.value.split('-')[1]
    this.byRoom.cabinet = event.option.value.split('-')[0]
    console.log(this.byRoom.cabinet_id, this.byRoom.cabinet);
  }

  getServerErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
        case 400: {
          if(this.byDate.cabinet == ''){
            return 'Room is required'
          }
          else{
            return 'Cabinet is reserved for the selected time, try reload page'
          }
        }
        case 403: {
            return `Access Denied`;
        }
        case 500: {
            return `Internal Server Error`;
        }
        default: {
            return `Unknown Server Error`;
        }
    }
}

  send(){
    const data = this.select == "Room" ? this.byRoom : this.byDate

    let values = {
      room: data.cabinet, 
      reserver: localStorage.getItem("username"), 
      reserver_info: localStorage.getItem("department"), 
      day: "d"+data.date.getDay(),
      start_time: data.startTime,
      end_time: data.endTime,
      reason: data.comment,
      room_id: parseInt(data.cabinet_id),
      reserver_id: localStorage.getItem("id"),
      date: data.date,
    }

    console.log(values)

    let flag = true

    const valuesArr = Object.values(values)
    valuesArr.forEach((val, index) => {
      if(val == null || val == ''){
        this.message = this.formArray[index] + ' is required'
        flag = false
      }
    });

    if(compareTime(data.startTime, '8:00') == -1){
      this.message = "Time range is 08:00 - 19:00"
      flag = false
    }

    if(compareTime(data.endTime, '19:00') == 1){
      this.message = "Time range is 08:00 - 19:00"
      flag = false
    }

    if(data.endTime < data.startTime){
      this.message = "Time range is 08:00 - 19:00"
      flag = false
    }

    if(flag != true){
      this.trigger.openPopover();
      window.setTimeout(() => { this.trigger.closePopover() }, 2000);
    }
    
    var response = this.api.sendPostRequestWithAuth("/booking/create", values)
    response.subscribe(data => {
      this.router.navigate(['/booking'])
      .then(() => {
        window.location.reload();
      });
    }, error => {
      this.message = this.getServerErrorMessage(error)
      this.trigger.openPopover();
      window.setTimeout(() => { this.trigger.closePopover() }, 2000);
    });
  }
}

function compareTime(time1: string, time2: string): number {
  // 1 = time1 > time2
  // 0 = time1 == time2
  // -1 = time1 < time2

  var time1date = new Date("1970-01-01 " + time1)
  var time2date = new Date("1970-01-01 " + time2)

  if (time1date.getTime() > time2date.getTime()) {
    return 1
  } else if (time1date.getTime() < time2date.getTime()) {
    return -1
  }
  return 0

  // 24:00 and 00:00 = ?
}

