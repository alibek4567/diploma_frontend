import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MdePopoverTrigger } from '@material-extended/mde';
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
  select = "Date"
  today = new Date()
  maxDate = new Date( new Date().setDate(this.today.getDate() + 14) )
  sendMessage: string

  // By Date = set Date + Time
  checked: number
  messageByDate: string
  byDate: Select = {
    cabinet: '',
    startTime: '',
    endTime: '',
    comment: '',
    date: new Date,
    cabinet_id: ''
  }

  // By Room = set Date + Room
  events: any[] = []
  rooms: any
  searchedRooms: any
  messageByRoom: string
  byRoom: Select = {
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
  
  //set select mode
  setSelectMode(event: any) {
    this.select = event.value
  }

  getServerErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
        case 400: {
            return (this.select == "Room")?'Time is reserved, try reload page/change time range':'Cabinet is reserved for the selected time, try reload page/select another cabinet'
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
    this.sendMessage = ''

    let values = {
      reason: data.comment,
      start_time: data.startTime,
      end_time: data.endTime,
      room_id: parseInt(data.cabinet_id),
      room: data.cabinet, 
      date: data.date,
      day: "d"+data.date.getDay(),
      reserver: localStorage.getItem("username"), 
      reserver_info: localStorage.getItem("department"), 
      reserver_id: localStorage.getItem("id"),
    }

    let flag = true

    const valuesArr = Object.values(values)
    const keysArr = Object.keys(values)
    valuesArr.forEach((val, index) => {
      if(val == null || val == ''){
        this.sendMessage = keysArr[index] + ' is required'
        console.log(index);
        flag = false
      }
    });

    if(this.app.compareTime(data.startTime, '8:00') == -1){
      this.sendMessage = "Time range is 08:00 - 19:00"
      flag = false
    }

    if(this.app.compareTime(data.endTime, '19:00') == 1){
      this.sendMessage = "Time range is 08:00 - 19:00"
      flag = false
    }

    if(data.endTime < data.startTime){
      this.sendMessage = "Time range is 08:00 - 19:00"
      flag = false
    }

    if(flag != true){
      this.trigger.openPopover();
      window.setTimeout(() => { this.trigger.closePopover() }, 2000);
    }else{
      var response = this.api.sendPostRequestWithAuth("/booking/create", values)
      response.subscribe(data => {
        this.router.navigate(['/booking'])
        .then(() => {
          window.location.reload();
        });
      }, error => {
        this.sendMessage = this.getServerErrorMessage(error)
        this.trigger.openPopover();
        window.setTimeout(() => { this.trigger.closePopover() }, 2000);
      });
    }
  }

  //Date mode functions

  //get all cabinets by selecting date
  cabinetByDate(){
    let data = {
      date: this.byDate.date, 
      start_time: this.byDate.startTime , 
      end_time: this.byDate.endTime
    }

    let flag = true

    if(data.start_time == ''){
      return
    }

    if(data.end_time == ''){
      return
    }

    console.log(data.start_time, data.end_time)

    if(this.app.compareTime(data.start_time, '08:00') == -1){
      flag = false
    }

    if(this.app.compareTime(data.end_time, '19:00') == 1 ){
      flag = false
    }

    if(this.app.compareTime(data.start_time, data.end_time) == 1){
      flag = false
    }

    if(flag == true){
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
      })
    }
    else{
      this.rooms = []
      this.messageByDate = "Wrong inputs, check entered data"
    }
  }

  //set selected cabinet by date mode
  setCheckedCabinet(name: string,id: string){
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

  //Cabinet mode functions

  //get data about events for room
  getDataForRoomEvents(){
    this.events = []
    this.cabinetByRoom()
    this.getTimetableByDate()
  }

  cabinetByRoom() {
    var response = this.api.sendPostRequest("/booking/room/"+this.byRoom.cabinet_id, {date: this.byRoom.date})
    response.subscribe(r => {
      const data = JSON.parse(JSON.stringify(r))
      if(data.payload != null){
        for(let item of data.payload){
          let roomDate = item.date
          if(roomDate.split('T')[0] == this.app.toGolangDateFormat(this.byRoom.date).split('T')[0]){
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

  //filter list of rooms by room name
  filter(){
    this.searchedRooms = this.items.rooms.filter((data: any) => {
      return data.name.toLowerCase().includes(this.byRoom.cabinet.toLowerCase());
    })  
  }

  //set room_id and room_name by room mode
  setValues(event: any){
    this.byRoom.cabinet_id = event.option.value.split('-')[1]
    this.byRoom.cabinet = event.option.value.split('-')[0]
    console.log(this.byRoom.cabinet_id, this.byRoom.cabinet);
  }
}



