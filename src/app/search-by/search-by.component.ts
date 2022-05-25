import { Component, OnInit, Renderer2 } from '@angular/core';
// import { ElementRef, ViewChild} from '@angular/core';
import { ApiCallerService } from '../api-caller.service';
import { MsalService } from '@azure/msal-angular';
// import { AuthenticationResult } from '@azure/msal-browser';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog'
import { SubjectPopUpComponent } from '../subject-pop-up/subject-pop-up.component';
import { Subject } from '../subject'
// import { AppComponent } from '../app.component';

@Component({
  selector: 'app-search-by',
  templateUrl: './search-by.component.html',
  styleUrls: ['./search-by.component.scss']
})

export class SearchByComponent implements OnInit {

  date: Date = new Date();
  weekDates = new Map<string, string>()

  // Search Bar
  search: boolean = false
  searchValue: string = ''
  searchResult: string = ''
  searchMode: string = 'by-group'

  // Search by cabinet
  cabinet: boolean = false

  // Schedule parameters
  scheduleStartTime: string = "22:00"
  scheduleEndTime: string = "8:00"
  timeArray: string[] = [
    "8:00", "8:30", "9:00", "9:30",
    "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", 
    "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30",
    "20:00", "20:30", "21:00", "21:30"
  ]

  // d1 = MON; d2 = TUS; d3 = WED; d4 = THU; d5 = FRI; d6 = SAT
  weekSchedule = new Map<string, Map<string, Subject[]>>()

  // timeMap: Map<string, object[]>

  lessonDuration: number = 50
  
  constructor(private api: ApiCallerService, public renderer: Renderer2, 
    private msalService: MsalService, private httpClient: HttpClient, private dialogRef: MatDialog) {

    // Current Week value
    let temp = getTodaysDate(+6).split(',')[1].trim()
    let date = temp.split('.')
    let dateInFormat = date[2] + '/' + date[1] + '/' + date[0]
    let time = getTodaysDate(+6).split(',')[2].trim()
    this.weekDates = getWeekDates(dateInFormat + ' ' + time)

    // console.log(compareTime('24:00', '14:00'))
  }

  ngOnInit(): void {}

  setSearch() {
    //console.log(this.searchMode)
    if (this.searchValue == '') {
      console.log(this.searchValue)
    } else {
      this.search = true

      this.searchResult = this.searchValue
      switch(this.searchMode) { 
        case 'by-group': { 
          //this.cabinet = false
          this.getSearchResult("/timetable/group/" + this.searchValue)
          break; 
        }
        case 'by-teacher': { 
          //this.cabinet = false
          this.getSearchResult("/timetable/tutor/" + this.searchValue)
          break; 
        }
        case 'by-cabinet': { 
          //this.cabinet = true
          this.getSearchResult("/timetable/room/" + this.searchValue)
          // Booking part to add
          break; 
       } 
        default: { 
           console.log("ERROR")
        } 
      } 
    }
  }  

  getSearchResult(request: string) {
    this.weekSchedule.clear()
    
    waitForElm('.grid-container').then(async () => {
      this.setTimeline()
      setInterval(this.setTimeline, 60 * 1000);
    });
     
    var response = this.api.sendGetRequest(request)
    response.subscribe(data => {
      const schedule = JSON.parse(JSON.stringify(data))
      // Sorting
      for (let i = 1; i < 7; i++) {
        if (schedule.payload["d" + i] != null) {
          for (let item of schedule.payload["d" + i]) {

            if (this.weekSchedule.get("d" + i) != undefined) {
              if (this.weekSchedule.get("d" + i)?.get(item.classtime_time) != undefined) {
                this.weekSchedule.get("d" + i)?.get(item.classtime_time)?.push(item)
              } else {
                this.weekSchedule.get("d" + i)?.set(item.classtime_time, [item])
              }
            } else {
              this.weekSchedule.set("d" + i, new Map())
              this.weekSchedule.get("d" + i)?.set(item.classtime_time, [item])
            }
          }
        }
      }

      // Compare time -----
      for (let i = 1; i < 7; i++) {
        if (this.weekSchedule.get("d" + i) != undefined) {
          let times = this.weekSchedule.get("d" + i)?.keys()
          if (times != undefined) {
            for (let time of times) {
              let result = compareTime(time, this.scheduleEndTime)
              if (result == 1) {
                this.scheduleEndTime = time
              }
              result = compareTime(time, this.scheduleStartTime)
              if (result == -1) {
                this.scheduleStartTime = time
              }
            }
          }
        }
      }
      console.log(this.scheduleStartTime, this.scheduleEndTime)

      // Time Array Values:

      // this.scheduleStartTime
      // this.scheduleEndTime

      //this.timeArray = []
      // let myArray = []
      // for (let i = parseInt(this.scheduleStartTime.split(':')[0]); i++; i< (parseInt(this.scheduleEndTime.split(':')[0]) + 2)) {
      //   myArray.push(i + ':00')
      //   myArray.push(i + ':30')
      // }
      // console.log(myArray)

      // ------------------

      // Drawing
      waitForElm('.grid-container').then(async () => {
        for (let i = 1; i < 7; i++) {
          await this.setSubjects("d" + i, this.weekSchedule.get("d" + i))
        }
      });
    }, error => { console.log(error) })
  }

  async setSubjects(day: string, daySchedule: any) {
    if (daySchedule != null) {

      var dateTime = getTodaysDate(+6).split(',') // Todays Date and Time with Timezone +6
      var dayOfTheWeek = parseInt(dateTime[0])
      var otherDay = true
      if (day == ('d' + dayOfTheWeek)) {
        otherDay = false
      }

      daySchedule.forEach(async (value: Subject[], key: string) => {

      var timer = key.split(':');
      // Get Subject Time + Time starts from 8:00
      var hours = parseInt(timer[0]) //- 8 
      var minutes = parseInt(timer[1]) /// 60

      await waitForElm('#' + day + "_t" + timer[0] + timer[1]).then(() => {
        const el = (<HTMLElement>document.getElementById(day + "_t" + timer[0] + timer[1]));
          
        el.style.height = (this.lessonDuration * 5 / 60) + "rem"
        // Displacement = (Borders) + (Full Hours) + (Minutes)

        // test this.scheduleStartTime.split(':')[0]

         el.style.top = ((0.1 * 2 * (hours - 8)) + ((hours - 8) * 5) + (minutes/60) * 5) + "rem"
        el.style.visibility = "visible"

        const el_title = (<HTMLElement>document.getElementById(day + "_t" + timer[0] + timer[1] + "_title"));
        const el_room = (<HTMLElement>document.getElementById(day + "_t" + timer[0] + timer[1] + "_room"));
        el_title.textContent = ''
        el_room.textContent = ''

        let title: string = ''
        let room: string = ''
        for (let subject of value) {
          title += subject.subject + ' / '
          room += subject.room + ' / '
        }

        if (value.length > 1) {
          el.style.background = 'linear-gradient(90deg, rgb(69, 124, 206), rgb(165, 52, 214))';
        }

        el_title.textContent = title.slice(0, -3);
        el_room.textContent = room.slice(0, -3);

        if (!otherDay) {
          let result = compareTime(dateTime[2], key)
          if (result == 1 || result == 0) {
            el.style.background = 'gray'
            el.style.borderLeft = '0.2rem solid rgb(240,128,128)'
          }
        }
      })
    })
  } 
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

  setTimeline() {
    // Work of Time Line
    var dateTime = getTodaysDate(+6).split(',') // Todays Date and Time with Timezone +6

    //var dateTimeArray = dateTime.split(',');

    var dayOfTheWeek = parseInt(dateTime[0])
    //var date = dateTimeArray[1]
    var time = dateTime[2].split(':')
    var hours = parseInt(time[0])
    var minutes = parseInt(time[1]) / 60
    var final = 0
    if (hours < 8) {
      setVerticalLocation("d" + dayOfTheWeek + "_line", final)
      setHeightHTML("d" + dayOfTheWeek + "_cover-column", final)
    } else if (hours > 21) {
      hours = 22
      minutes = 0
      final = ((0.1 * (hours - 8)) + ((hours - 8) * 5) + minutes * 5)
      setVerticalLocation("d" + dayOfTheWeek + "_line", final)
      setHeightHTML("d" + dayOfTheWeek + "_cover-column", final)
    } else {
      final = ((0.1 * (hours - 8)) + ((hours - 8) * 5) + minutes * 5)
      setVerticalLocation("d" + dayOfTheWeek + "_line", final)
      setHeightHTML("d" + dayOfTheWeek + "_cover-column", final)
    }
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

function setVerticalLocation(elementId: string, number: number) {
  let element = <HTMLElement>document.getElementById(elementId);
  element.style.display = "block";
  element.style.top = number + "rem"
}

function setHeightHTML(elementId: string, number: number) {
  let element = <HTMLElement>document.getElementById(elementId);
  element.style.display = "block";
  element.style.height = number + "rem"
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
