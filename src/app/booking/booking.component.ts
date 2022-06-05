import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MdePopoverTrigger } from '@material-extended/mde';
import { AppComponent } from '../app.component';
import { ApiCallerService } from '../api-caller.service';
import { ItemsLoaderService } from '../items-loader.service';

export interface Select {
  date: Date,
  cabinet_id: string
  cabinet: string,
  startTime: string,
  endTime: string,
  comment: string,
}

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss']
})

export class BookingComponent implements OnInit {

  @ViewChild(MdePopoverTrigger, { static: false }) trigger: MdePopoverTrigger

  // common parameters for both modes
  select = "Date"

  // ?
  temp = new Date(new Date().setDate(new Date().getDate() + 1))

  today = (new Date().getDay() != 0)? new Date():this.temp
  maxDate = new Date(new Date().setDate(this.today.getDate() + 14) )
  sendMessage: string

  // by date = set date + time
  checked: number
  messageByDate: string
  byDate: Select = {
    date: new Date,
    cabinet_id: '',
    cabinet: '',
    startTime: '',
    endTime: '',
    comment: '',
  }

  // by room = set date + room
  events: any[] = []
  rooms: any
  cabinetFlag = false
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
    if (!app.isLoggedIn()) {
      router.navigateByUrl('')
    }
    this.searchedRooms = this.items.rooms

    console.log(this.today, this.today.getDay())
    console.log(new Date().getDay() == 0)
  }

  ngOnInit(): void { }
  
  // set select mode
  setSelectMode(event: any) {
    this.select = event.value
  }

  getServerErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 400: {
        return (this.select == "Room")?'Time is reserved, try reload page/change time range':'Cabinet is reserved for the selected time, try reload page/select another cabinet'
      }
      case 404: {
        return `Not Found`;
      }
      case 500: {
        return `Internal Server Error`;
      }
      default: {
        return `Unknown Server Error`;
      }
    }
  }

  send() {
    const data = this.select == "Room" ? this.byRoom : this.byDate
    this.sendMessage = ''

    const offset = data.date.getTimezoneOffset()
    data.date = new Date(data.date.getTime() - (offset*60*1000))

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
      if (val == null || val == '') {
        this.sendMessage = keysArr[index] + ' is required'
        flag = false
      }
    });

    if (this.app.compareTime(data.startTime, '8:00') == -1) {
      this.sendMessage = "Time range is 08:00 - 19:00"
      flag = false
    }
    if (this.app.compareTime(data.endTime, '19:00') == 1) {
      this.sendMessage = "Time range is 08:00 - 19:00"
      flag = false
    }
    if (data.endTime < data.startTime) {
      this.sendMessage = "Time range is 08:00 - 19:00"
      flag = false
    }

    if(this.cabinetFlag){
      this.sendMessage = "Incorrect cabinet"
    }

    if(flag && !this.cabinetFlag){
      var response = this.api.sendPostRequestWithAuth("/booking/create", values)
      response.subscribe(() => {
        this.router.navigate(['/booking'])
          .then(() => {
            window.location.reload();
          });
      }, error => {
        this.sendMessage = this.getServerErrorMessage(error)
        this.trigger.openPopover();
        window.setTimeout(() => { this.trigger.closePopover() }, 2000);
      });
    }else{
      this.trigger.openPopover();
      window.setTimeout(() => { this.trigger.closePopover() }, 2000);
    }
  }

  // date mode functions

  // get all cabinets by selecting date
  cabinetByDate() {
    const offset = this.byDate.date.getTimezoneOffset()
    let sendDate = new Date(this.byDate.date.getTime() - (offset*60*1000))

    let data = {
      date: sendDate, 
      start_time: this.byDate.startTime , 
      end_time: this.byDate.endTime
    }

    let flag = true

    if (data.start_time == '') return
    if (data.end_time == '') return

    if (this.app.compareTime(data.start_time, '08:00') == -1) {
      flag = false
    }
    if (this.app.compareTime(data.end_time, '19:00') == 1 ) {
      flag = false
    }
    if (this.app.compareTime(data.start_time, data.end_time) == 1) {
      flag = false
    }

    if (flag == true) {
      var response = this.api.sendPostRequest("/booking/datetime", data)
      response.subscribe(data => {
        const timeTables = JSON.parse(JSON.stringify(data))
        this.rooms = timeTables.payload
        this.messageByDate = ''
        if (this.rooms.length == 0) {
          this.messageByDate == 'No Available Rooms'
        }
      }, error => {
        console.log(error);
      })
    } else {
      this.rooms = []
      this.messageByDate = "Wrong inputs, check entered data"
    }
  }

  // set selected cabinet by date mode
  setCheckedCabinet (name: string,id: string) {
    if (this.byDate.cabinet_id == id) {
      this.checked = 0
      this.byDate.cabinet = ''
      this.byDate.cabinet_id = ''
    } else {
      this.checked = parseInt(id)
      this.byDate.cabinet = name
      this.byDate.cabinet_id = id
    }
  }

  // cabinet mode functions

  // get data about events for room
  getDataForRoomEvents() {
    this.messageByRoom = ''
    this.events = []
    this.getTimetableByDate()
    this.cabinetByRoom()
  }

  cabinetByRoom() {
      const offset = this.byRoom.date.getTimezoneOffset()
      let sendDate = new Date(this.byRoom.date.getTime() - (offset*60*1000))

      var response = this.api.sendPostRequest("/booking/room/"+this.byRoom.cabinet_id, {date: sendDate})
      response.subscribe(r => {
      const data = JSON.parse(JSON.stringify(r))
      if (data.payload != null) {
        for (let item of data.payload) {
          let roomDate = item.date
          if (roomDate.split('T')[0] == this.app.toGolangDateFormat(sendDate).split('T')[0]) {
            this.events.push(item)
            this.events.sort(function(a, b) {
              if (a.start_time > b.start_time) {return 1} else {return -1} 
            })
          }
        }
        if(this.events.length == 0){
          this.messageByRoom = 'The Cabinet is free'
          this.cabinetFlag = false
        }
      }
    }, error => {
      this.messageByRoom = this.getServerErrorMessage(error)
    })
  }

  getTimetableByDate() {
    const offset = this.byRoom.date.getTimezoneOffset()
    let sendDate = new Date(this.byRoom.date.getTime() - (offset*60*1000))

    const response = this.api.sendGetRequest("/timetable/room/" + this.byRoom.cabinet_id)
    response.subscribe(data => {
      const schedule = JSON.parse(JSON.stringify(data))
      if(schedule.payload['d' + sendDate.getDay()] != undefined) {
        for (let item of schedule.payload['d' + sendDate.getDay()]) {
          this.events.push({ start_time: item.start_time, end_time: item.end_time, reason: item.subject, reserver: item.tutor })
          this.events.sort(function(a, b) {
            if (a.start_time > b.start_time) {return 1} else {return -1}
          })
        }
        if (this.events.length == 0) {
          this.messageByRoom = 'The Cabinet is free'
          this.cabinetFlag = false
        }
      }
    }, error => {
      console.log(error)
    })
  }

  //filter list of rooms by room name
  filter() {
    this.events = []
    this.messageByRoom = ''
    this.searchedRooms = this.items.rooms.filter((data: any) => {  
      return data.name.toLowerCase().includes(this.byRoom.cabinet.toLowerCase());
    })
    this.messageByRoom = ''
    if(this.searchedRooms?.length == 0){
      this.messageByRoom = 'Not found Cabinet'
      this.cabinetFlag = true
    }else{
      this.messageByRoom = 'Select Cabinet from List'
    }
  }

  //set room_id and room_name by room mode
  setValues(event: any) {
    this.byRoom.cabinet_id = event.option.value.split('-')[1]
    this.byRoom.cabinet = event.option.value.split('-')[0]
    console.log(this.byRoom.cabinet);
  }
}



