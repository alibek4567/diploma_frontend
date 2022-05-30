import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiCallerService } from '../api-caller.service';
import { MatDialog } from '@angular/material/dialog'
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MdePopoverTrigger } from '@material-extended/mde';
import { ItemsLoaderService } from '../items-loader.service';
import { SubjectPopUpComponent } from '../subject-pop-up/subject-pop-up.component';
import { Subject } from '../subject'

@Component({
  selector: 'app-search-by',
  templateUrl: './search-by.component.html',
  styleUrls: ['./search-by.component.scss']
})

export class SearchByComponent implements OnInit {

  @ViewChild('autoCompleteInput', { read: MatAutocompleteTrigger }) autoComplete: MatAutocompleteTrigger;
  @ViewChild(MdePopoverTrigger, { static: false }) trigger: MdePopoverTrigger;

  // loader display
  loading: boolean = true

  // dates
  selectedDate: Date = new Date();
  weekDates = new Map<string, Date>()

  // search parameters
  searchStart: boolean = false
  searchMode: string = 'by-group'
  searchValue: string = ''
  searchResult: string = ''
  searchSuccess: boolean = false
  suggestionsArray: any[]
  searchedArray: any[]

  // search by cabinet
  isCabinet: boolean = false

  // time parameters of schedule
  scheduleStartTime: string = "24:00"
  scheduleEndTime: string = "00:00"
  timeArray: string[] = []

  // d1 = MON; d2 = TUS; d3 = WED; d4 = THU; d5 = FRI; d6 = SAT
  weekSchedule = new Map<string, Map<string, Subject[]>>()

  // schedule for cabinet consists also the bookings
  bookingOverall: Subject[]
  bookingSchedule = new Map<string, Map<string, Subject[]>>()
  
  constructor(private api: ApiCallerService, 
    private dialogRef: MatDialog,
    public searchSuggestions: ItemsLoaderService) {

    // wait until search suggestions will be loaded
    let interval = setInterval(() => {
      if (searchSuggestions.loadedGroups && searchSuggestions.loadedRooms && searchSuggestions.loadedTeachers) {
        this.loading = false
        this.setSearchSuggestions()
        clearInterval(interval)
      }
    }, 10);
    
    // current week dates
    this.selectedDate = getTodaysDate(+6)
    this.weekDates = getWeekDates(this.selectedDate)
    console.log(this.weekDates)
  }

  ngOnInit(): void { }

  // +
  setSearchSuggestions() {
    switch(this.searchMode) { 
      case 'by-group': {
        this.searchValue = ''
        this.searchedArray = [] 
        this.suggestionsArray = this.searchSuggestions.groups
        break; 
      }
      case 'by-teacher': { 
        this.searchValue = '' 
        this.searchedArray = [] 
        this.suggestionsArray = this.searchSuggestions.teachers
        break; 
      }
      case 'by-cabinet': { 
        this.searchValue = '' 
        this.searchedArray = [] 
        this.suggestionsArray = this.searchSuggestions.rooms
        break; 
     } 
      default: { 
         console.log("No search suggestions")
      } 
    } 
  }

  // +
  filter() {
    if (this.searchValue.length==0) {
      this.searchedArray = []
    } else {
      this.searchedArray = this.suggestionsArray.filter((data: any) => {
        return data.name.toLowerCase().includes(this.searchValue.toLowerCase());
      })
    }
  }

  async setSearch() {
    if (this.searchValue == '') {
      this.trigger.openPopover();
      window.setTimeout(() => { this.trigger.closePopover() }, 2000);
    } else {
      this.trigger.closePopover()
      this.loading = true
      
      this.timeArray = []
      this.scheduleStartTime = "24:00"
      this.scheduleEndTime = "00:00"

      this.searchStart = true
      //this.searchResult = this.searchValue

      switch(this.searchMode) { 
        case 'by-group': { 
          this.isCabinet = false
          this.getTimetable("/timetable/group/" + this.searchValue)
          break; 
        }
        case 'by-teacher': { 
          this.isCabinet = false
          let requestId = 0
          for (let s of this.suggestionsArray) {
            if (s.name == this.searchValue) {
              requestId = s.id
            }
          }
          this.getTimetable("/timetable/tutor/" + requestId)
          break; 
        }
        case 'by-cabinet': { 
          this.isCabinet = true
          let requestId = 0
          for (let s of this.suggestionsArray) {
            if (s.name == this.searchValue) {
              requestId = s.id
            }
          }
          //await this.getBookingData("/booking/room/" + requestId)
          this.getTimetable("/timetable/room/" + requestId)
          break; 
        } 
        default: { 
           console.log("no correct search mode")
        }
      }
      this.loading = false
    }
  }  

  async getTimetable(request: string) {
    this.weekSchedule.clear()
     
    var response = this.api.sendGetRequest(request)
    response.subscribe(data => {
      //?
      this.searchSuccess = true

      const schedule = JSON.parse(JSON.stringify(data))
      // process data
      for (let i = 1; i < 7; i++) {
        if (schedule.payload["d" + i] != null) {
          for (let element of schedule.payload["d" + i]) {
            // dynamic time setting
            if (compareTime(element.start_time, this.scheduleStartTime) == -1) {
              this.scheduleStartTime = element.start_time
            }
            if (compareTime(element.end_time, this.scheduleEndTime) == 1) {
              this.scheduleEndTime = element.end_time
            }
            // mapping
            if (this.weekSchedule.get("d" + i) != undefined) {
              if (this.weekSchedule.get("d" + i)?.get(element.start_time) != undefined) {
                this.weekSchedule.get("d" + i)?.get(element.start_time)?.push(element)
              } else {
                this.weekSchedule.get("d" + i)?.set(element.start_time, [element])
              }
            } else {
              this.weekSchedule.set("d" + i, new Map())
              this.weekSchedule.get("d" + i)?.set(element.start_time, [element])
            }
          }
        }
      }

      // Drawing Time blocks
      let myArray: string[] = []
      let start = parseInt(this.scheduleStartTime.split(':')[0])
      let end = parseInt(this.scheduleEndTime.split(':')[0]) + 1
      for (let i = start; i < end; i++) {
        myArray.push(i + ':00')
        myArray.push(i + ':30')
      }
      this.timeArray = myArray

      // Drawing Subjects
      waitForElm('.grid-container').then(async () => {
        for (let i = 1; i < 7; i++) {
          await this.setSubjects("d" + i, this.weekSchedule.get("d" + i))
        }
        // for (let i = 1; i < 7; i++) {
        //   await this.setBooking("d" + i, this.bookingSchedule.get("d" + i))
        // }
      });

    }, error => { 
      this.searchSuccess = false
      //console.log(error) 
      //responseError = error.status
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

  // async getBookingData(request: string) {
  //   this.bookingSchedule.clear()

  //   //let temp = getTodaysDate(+6).split(',')[1].trim()
  //   let temp1 = this.selectedDate.toLocaleString().split(',')[0]
  //   let temp2 = temp1.split('.')
  //   let calculatedDate = temp2[2] + '-' + temp2[1] + '-' + temp2[0]

  //   //this.weekDates = getWeekDates(calculatedDate + ' 00:00:00')

  //   let data = {
  //     date: calculatedDate + 'T00:00:00Z', //"2022-06-19T00:00:00Z", 
  //   }
  //   var response = this.api.sendPostRequest(request, data)
  //   response.subscribe(data => {
  //     const schedule = JSON.parse(JSON.stringify(data))
  //     this.searchSuccess = true

  //     this.bookingOverall = schedule.payload

  //     for (let date of this.weekDates) {
  //       //let i = 1
  //       let timetableDay = date[0]

  //       let dateNeeded = date[1].split(',')[0]
  //       let dateCustom = dateNeeded.split('.')
  //       let dateFormat = dateCustom[2] + '-' + dateCustom[1] + '-' + dateCustom[0] //+ "T00:00:00+06:00"
  //       //console.log(dateFormat)
  //       for (let booking of this.bookingOverall) {
  //         let date2 = booking.date.split('T')[0]
  //         //console.log(i, date2, dateFormat, date2 == dateFormat)
  //         if (date2 == dateFormat) {

  //           // Time set
  //           if (compareTime(booking.start_time, this.scheduleStartTime) == -1) {
  //             this.scheduleStartTime = booking.start_time
  //           }
  //           if (compareTime(booking.end_time, this.scheduleEndTime) == 1) {
  //             this.scheduleEndTime = booking.end_time
  //           }

  //           if (this.bookingSchedule.get(timetableDay) != undefined) {
  //             if (this.bookingSchedule.get(timetableDay)?.get(booking.start_time) != undefined) {
  //               this.bookingSchedule.get(timetableDay)?.get(booking.start_time)?.push(booking)
  //             } else {
  //               this.bookingSchedule.get(timetableDay)?.set(booking.start_time, [booking])
  //             }
  //           } else {
  //             this.bookingSchedule.set(timetableDay, new Map())
  //             this.bookingSchedule.get(timetableDay)?.set(booking.start_time, [booking])
  //           }
  //         }
  //       }
  //     }
  //     //console.log("Week:", this.weekDates)
  //     //console.log(this.bookingSchedule)
  //     //console.log(this.scheduleStartTime, this.scheduleEndTime)

  //     let myArray: string[] = []
  //     let start = parseInt(this.scheduleStartTime.split(':')[0])
  //     let end = parseInt(this.scheduleEndTime.split(':')[0]) + 1
  //     for (let i = start; i < end; i++) {
  //       myArray.push(i + ':00')
  //       myArray.push(i + ':30')
  //     }
  //     this.timeArray = myArray

  //     waitForElm('.grid-container').then(async () => {
  //       //console.log('success?')
  //       for (let i = 1; i < 7; i++) {
  //         await this.setBooking("d" + i, this.bookingSchedule.get("d" + i))
  //         //console.log("d" + i, this.bookingSchedule.get("d" + i))
  //       }

  //       for (let i = 1; i < 7; i++) {
  //         await this.setSubjects("d" + i, this.weekSchedule.get("d" + i))
  //         //console.log("d" + i, this.bookingSchedule.get("d" + i))
  //       }
  //     });

  //   }, error => {
  //     console.log(error)
  //     console.log(this.weekSchedule)
  //     if (this.weekSchedule == null) {
  //       this.timeArray = []
  //     }
  //     this.errorBooking = error.status
  //   })
  // }

  // async setBooking(day: string, daySchedule: any) {
  //   if (daySchedule != null) {
  //     daySchedule.forEach(async (subjects: Subject[]) => {
  
  //     var subjectStartTime = subjects[0].start_time.split(':');
  //     var hours = parseInt(subjectStartTime[0])
  //     var minutes = parseInt(subjectStartTime[1])
  
  //     var confirmed = subjects[0].confirmed
  
  //     let id = day + "_t" + subjectStartTime[0] + subjectStartTime[1]
  
  //     await waitForElm('#' + id).then(() => {
  //       const el = (<HTMLElement>document.getElementById(id));
  
  //       let duration = stringTimeInMinutes(subjects[0].end_time) - stringTimeInMinutes(subjects[0].start_time)
  
  //       el.style.height = (duration * 5 / 60) + "rem"
  
  //       // Displacement = (Borders) + (Full Hours) + (Minutes)
  //       let startHour = parseInt(this.scheduleStartTime.split(':')[0]) // 8 hours
  //       el.style.top = ((0.1 * 2 * (hours - startHour)) + ((hours - startHour) * 5) + (minutes / 60) * 5) + "rem"
  //       el.style.visibility = "visible"
  
  //       if (confirmed) {
  //         el.style.background = "#15BE4C"
  //         //el.style.color = "#EABC04"
  //       } else {
  //         el.style.background = "#EABC04"
  //         //el.style.color = "#15BE4C"
  //       }
  
  //       const el_title = (<HTMLElement>document.getElementById(id + "_title"));
  //       const el_room = (<HTMLElement>document.getElementById(id + "_room"));
  //       el_title.textContent = subjects[0].reason
  //       el_room.textContent = subjects[0].room
  //     })
  //   })
  // } 
  // }

  setSubjectId(subject: string): string {
    let time = subject.split(':');
    return "t" + time[0] + time[1]
  }

  openSubject(subject: Subject[]) {
    this.dialogRef.open(SubjectPopUpComponent, {
      data: {
        object: subject,
        panelClass: 'my-custom-dialog-class'
      }
    })
  }

  formatDate(data: Date) {
    let formDate = data.toString()
    return formDate.slice(3, 10) + ' | ' + formDate.slice(0, 3)
  }

  // HTML interface functions // +
  displayHumanDate(date: Date | undefined): string {
    if (date == undefined) {
      return ''
    }
    return date.toLocaleString().split(',')[0].trim()
  }
}

// +
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

// +
function getTodaysDate(offset: number): Date {
  let today = new Date();
  let utc = today.getTime() + (today.getTimezoneOffset() * 60000);
  let dateByOffset = new Date(utc + (3600000 * offset))

  return dateByOffset
}

// +
function getWeekDates(date: Date): Map<string, Date> {
  let currentDay = date.getDay()
  let dayDifference = currentDay
  let weekDates = new Map<string, Date>()

  for (let i = 0; i < 7; i ++) {
    let temp = new Date(date)
    if (i == currentDay) {
      weekDates.set('d' + i, temp)
      //console.log('d' + i, 'me', temp)
    } else if (i < currentDay) {
      weekDates.set('d' + i, new Date(temp.setDate(temp.getDate() - dayDifference)))
      //console.log('d' + i, new Date(temp.setDate(temp.getDate() - dayDifference)))
      dayDifference--
    } else {
      dayDifference++
      weekDates.set('d' + i, new Date(temp.setDate(temp.getDate() + dayDifference)))
      //console.log('d' + i, new Date(temp.setDate(temp.getDate() + dayDifference)))
    }
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