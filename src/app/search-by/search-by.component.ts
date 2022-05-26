import { Component, OnInit, Renderer2 } from '@angular/core';
import { ApiCallerService } from '../api-caller.service';
import { MsalService } from '@azure/msal-angular';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog'
import { SubjectPopUpComponent } from '../subject-pop-up/subject-pop-up.component';
import { Subject } from '../subject'

@Component({
  selector: 'app-search-by',
  templateUrl: './search-by.component.html',
  styleUrls: ['./search-by.component.scss']
})

export class SearchByComponent implements OnInit {

  // dates
  selectedDate: Date = new Date();
  weekDates = new Map<string, string>()

  // search parameters
  searchStart: boolean = false
  searchMode: string = 'by-group'
  searchValue: string = ''
  searchResult: string = ''
  searchSuccess: boolean = false

  // search by cabinet
  cabinet: boolean = false

  // time parameters of schedule
  scheduleStartTime: string = "24:00"
  scheduleEndTime: string = "00:00"
  timeArray: string[] = []

  // d1 = MON; d2 = TUS; d3 = WED; d4 = THU; d5 = FRI; d6 = SAT
  weekSchedule = new Map<string, Map<string, Subject[]>>()

  // schedule for cabinet consists also the bookings
  bookingOverall: Subject[]
  bookingSchedule = new Map<string, Map<string, Subject[]>>()
  
  constructor(private api: ApiCallerService, public renderer: Renderer2, 
    private msalService: MsalService, private httpClient: HttpClient, private dialogRef: MatDialog) {

    // current Week Date
    let temp = getTodaysDate(+6).split(',')[1].trim()
    let date = temp.split('.')
    let dateInFormat = date[2] + '/' + date[1] + '/' + date[0]
    let time = getTodaysDate(+6).split(',')[2].trim()
    this.weekDates = getWeekDates(dateInFormat + ' ' + time)
  }

  ngOnInit(): void { }

  setSearch() {
    if (this.searchValue == '') {
      console.log(this.searchValue)
    } else {
      this.timeArray = []
      this.scheduleStartTime = "24:00" //"22:00"
      this.scheduleEndTime = "00:00" //"8:00"
      this.searchStart = true
      this.searchResult = this.searchValue
      switch(this.searchMode) { 
        case 'by-group': { 
          this.cabinet = false
          this.getSearchResult("/timetable/group/" + this.searchValue)
          break; 
        }
        case 'by-teacher': { 
          this.cabinet = false
          this.getSearchResult("/timetable/tutor/" + this.searchValue)
          break; 
        }
        case 'by-cabinet': { 
          this.cabinet = true
          this.getSearchResult("/timetable/room/" + this.searchValue)
          // Booking part to add
          this.getBookingData("/booking/room/" + this.searchValue)
          break; 
       } 
        default: { 
           console.log("no correct search Mode")
        } 
      } 
    }
  }  

  getSearchResult(request: string) {
    this.weekSchedule.clear()
    //this.timeArray = []
     
    var response = this.api.sendGetRequest(request)
    response.subscribe(data => {
      this.searchSuccess = true
      const schedule = JSON.parse(JSON.stringify(data))
      // Sorting
      for (let i = 1; i < 7; i++) {
        if (schedule.payload["d" + i] != null) {
          for (let item of schedule.payload["d" + i]) {
            // Time set
            if (compareTime(item.start_time, this.scheduleStartTime) == -1) {
              this.scheduleStartTime = item.start_time
            }
            if (compareTime(item.end_time, this.scheduleEndTime) == 1) {
              this.scheduleEndTime = item.end_time
            }

            // Mapping
            if (this.weekSchedule.get("d" + i) != undefined) {
              if (this.weekSchedule.get("d" + i)?.get(item.start_time) != undefined) {
                this.weekSchedule.get("d" + i)?.get(item.start_time)?.push(item)
              } else {
                this.weekSchedule.get("d" + i)?.set(item.start_time, [item])
              }
            } else {
              this.weekSchedule.set("d" + i, new Map())
              this.weekSchedule.get("d" + i)?.set(item.start_time, [item])
            }
          }
        }
      }

      // Drawing Time blocks
      //if (this.searchMode != 'by-cabinet') {
        let myArray: string[] = []
        let start = parseInt(this.scheduleStartTime.split(':')[0])
        let end = parseInt(this.scheduleEndTime.split(':')[0]) + 1
        for (let i = start; i < end; i++) {
          myArray.push(i + ':00')
          myArray.push(i + ':30')
        }
        this.timeArray = myArray
      //}

      // Drawing Subjects
      waitForElm('.grid-container').then(async () => {
        for (let i = 1; i < 7; i++) {
          await this.setSubjects("d" + i, this.weekSchedule.get("d" + i))
        }
      });
    }, error => { 
      this.searchSuccess = false
      console.log(error) 
      //this.searchResult = 'No lessons schedule'
      this.timeArray = [ ]
    })
  }

  async setSubjects(day: string, daySchedule: any) {
    if (daySchedule != null) {
      daySchedule.forEach(async (subjects: Subject[]) => {

      var subjectStartTime = subjects[0].start_time.split(':');
      var hours = parseInt(subjectStartTime[0])
      var minutes = parseInt(subjectStartTime[1])

      //console.log(subjects[0].start_time, subjects[0].end_time)

      let id = day + "_t" + subjectStartTime[0] + subjectStartTime[1]

      await waitForElm('#' + id).then(() => {
        //console.log('success?')
        const el = (<HTMLElement>document.getElementById(id));

        let duration = stringTimeInMinutes(subjects[0].end_time) - stringTimeInMinutes(subjects[0].start_time)

        el.style.height = (duration * 5 / 60) + "rem"

        // Displacement = (Borders) + (Full Hours) + (Minutes)
        let startHour = parseInt(this.scheduleStartTime.split(':')[0]) // 8 hours
        el.style.top = ((0.1 * 2 * (hours - startHour)) + ((hours - startHour) * 5) + (minutes / 60) * 5) + "rem"
        el.style.visibility = "visible"

        const el_title = (<HTMLElement>document.getElementById(id + "_title"));
        const el_room = (<HTMLElement>document.getElementById(id + "_room"));
        el_title.textContent = ''
        el_room.textContent = ''

        let title: string = ''
        let room: string = ''
        for (let subject of subjects) {
          title += subject.subject + ' / '
          room += subject.room + ' / '
        }

        if (subjects.length > 1) {
          el.style.background = 'linear-gradient(90deg, rgb(69, 124, 206), rgb(165, 52, 214))';
        }

        el_title.textContent = title.slice(0, -3);
        el_room.textContent = room.slice(0, -3);

      })
    })
  } 
}

async setBooking(day: string, daySchedule: any) {
  if (daySchedule != null) {
    daySchedule.forEach(async (subjects: Subject[]) => {

    var subjectStartTime = subjects[0].start_time.split(':');
    var hours = parseInt(subjectStartTime[0])
    var minutes = parseInt(subjectStartTime[1])

    //console.log(subjects[0].start_time, subjects[0].end_time)

    let id = day + "_t" + subjectStartTime[0] + subjectStartTime[1]

    await waitForElm('#' + id).then(() => {
      console.log('success?')
      const el = (<HTMLElement>document.getElementById(id));

      let duration = stringTimeInMinutes(subjects[0].end_time) - stringTimeInMinutes(subjects[0].start_time)

      el.style.height = (duration * 5 / 60) + "rem"

      // Displacement = (Borders) + (Full Hours) + (Minutes)
      let startHour = parseInt(this.scheduleStartTime.split(':')[0]) // 8 hours
      el.style.top = ((0.1 * 2 * (hours - startHour)) + ((hours - startHour) * 5) + (minutes / 60) * 5) + "rem"
      el.style.visibility = "visible"

      const el_title = (<HTMLElement>document.getElementById(id + "_title"));
      const el_room = (<HTMLElement>document.getElementById(id + "_room"));
      el_title.textContent = ''
      el_room.textContent = ''

      let title: string = ''
      let room: string = ''
      for (let subject of subjects) {
        title += subject.reason + ' / '
        room += subject.room + ' / '
      }

      if (subjects.length > 1) {
        el.style.background = 'linear-gradient(90deg, rgb(69, 124, 206), rgb(165, 52, 214))';
      }

      el_title.textContent = title.slice(0, -3);
      el_room.textContent = room.slice(0, -3);

    })
  })
} 
}

  getBookingData(request: string) {
    this.bookingSchedule.clear()

    let temp = getTodaysDate(+6).split(',')[1].trim()

    let casualDateArray = temp.split('.')
    let formatDate = casualDateArray[2] + '-' + casualDateArray[1] + '-' + casualDateArray[0]
    formatDate += 'T00:00:00Z'
    //console.log(formatDate)
    let data = {
      date: formatDate, //"2022-06-19T00:00:00Z", 
    }
    var response = this.api.sendPostRequest(request, data)
    response.subscribe(data => {
      const schedule = JSON.parse(JSON.stringify(data))
      this.searchSuccess = true
      //const rooms = timeTables.payload
      //console.log(rooms)

      this.bookingOverall = schedule.payload
      //console.log(this.bookingOverall)

      for (let date of this.weekDates) {
        let i = 1
        let timetableDay = date[0]
        //console.log(date[0])

        let dateNeeded = date[1].split(',')[0]
        let dateCustom = dateNeeded.split('.')
        let dateFormat = dateCustom[2] + '-' + dateCustom[1] + '-' + dateCustom[0] //+ "T00:00:00+06:00"
        //console.log(dateFormat)
        for (let booking of this.bookingOverall) {
          let date2 = booking.date.split('T')[0]
          //console.log(i, date2, dateFormat, date2 == dateFormat)
          if (date2 == dateFormat) {

            // Time set
            if (compareTime(booking.start_time, this.scheduleStartTime) == -1) {
              this.scheduleStartTime = booking.start_time
            }
            if (compareTime(booking.end_time, this.scheduleEndTime) == 1) {
              this.scheduleEndTime = booking.end_time
            }

            if (this.bookingSchedule.get(timetableDay) != undefined) {
              if (this.bookingSchedule.get(timetableDay)?.get(booking.start_time) != undefined) {
                this.bookingSchedule.get(timetableDay)?.get(booking.start_time)?.push(booking)
              } else {
                this.bookingSchedule.get(timetableDay)?.set(booking.start_time, [booking])
              }
            } else {
              this.bookingSchedule.set(timetableDay, new Map())
              this.bookingSchedule.get(timetableDay)?.set(booking.start_time, [booking])
            }
          }
        }
      }
      //console.log("Week:", this.weekDates)
      //console.log(this.bookingSchedule)
      //console.log(this.scheduleStartTime, this.scheduleEndTime)

      let myArray: string[] = []
      let start = parseInt(this.scheduleStartTime.split(':')[0])
      let end = parseInt(this.scheduleEndTime.split(':')[0]) + 1
      for (let i = start; i < end; i++) {
        myArray.push(i + ':00')
        myArray.push(i + ':30')
      }
      this.timeArray = myArray

      waitForElm('.grid-container').then(async () => {
        //console.log('success?')
        for (let i = 1; i < 7; i++) {
          await this.setBooking("d" + i, this.bookingSchedule.get("d" + i))
          //console.log("d" + i, this.bookingSchedule.get("d" + i))
        }
      });

    }, error => {
      console.log(error)
      console.log(this.weekSchedule)
      if (this.weekSchedule == null) {
        this.timeArray = []
      }
    })
  }

  setSubjectId(subject: string): string {
    let time = subject.split(':');
    return "t" + time[0] + time[1]
  }

  openSubject(subject: Subject[]) {
    this.dialogRef.open(SubjectPopUpComponent, {
      data: {
        object: subject
      }
    })
  }

  formatDate(data: Date) {
    let formDate = data.toString()
    return formDate.slice(3, 10) + ' | ' + formDate.slice(0, 3)
  }

  // HTML interface functions
  formatDayAndWeek(date: string | undefined): string {
    if (date == undefined) {
      return ''
    }
    return date.split(',')[0].trim()
  }
}

function waitForElm(selector: string) {
  return new Promise(resolve => {
      if (document.querySelector(selector)) {
          return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver(mutations => {
          if (document.querySelector(selector)) {
              resolve(document.querySelector(selector));
              observer.disconnect();
          }
      });

      observer.observe(document.body, {
          childList: true,
          subtree: true
      });
  });
}

function getTodaysDate(offset: number): string {
  var date = new Date();
  var utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  var nd = new Date(utc + (3600000 * offset));
  return nd.getDay() + ", " + nd.toLocaleString();

  // let today = new Date();
  // let utc = today.getTime() + (today.getTimezoneOffset() * 60000);
  // let localeFormatDate = new Date(utc + (3600000 * offset)).toLocaleString();

  // let dateArray = localeFormatDate.split(',')
  // let dayArray = dateArray[0].split('.')

  // let uniFormatDate = dayArray[2] + '-' + dayArray[1] + '-' + dayArray[0] 
  // + 'T' + dateArray[1].trim() 
  // + 'D' + localeFormatDate.getDay()
  
  // return uniFormatDate
}

function getWeekDates(date: string): Map<string, string> {
  let currentDay = (date == '') ? new Date(): new Date(date)
  let monday = (currentDay.getDate()+2) - currentDay.getDay()

  let weekDates = new Map<string, string>()
  for (let i = 0; i < 7; i ++) {
    weekDates.set('d' + (i + 1), new Date(currentDay.setDate(monday + i - 1)).toLocaleString()) // toUTCString()
  }
  return weekDates
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

function stringTimeInMinutes(time: string): number {
  let hours = parseInt(time.split(':')[0])
  let minutes = parseInt(time.split(':')[1])
  return (hours * 60) + minutes
}