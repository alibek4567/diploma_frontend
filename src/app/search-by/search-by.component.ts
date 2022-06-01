import { Component, OnInit, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { MatDialog } from '@angular/material/dialog'
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MdePopoverTrigger } from '@material-extended/mde';

import { ApiCallerService } from '../api-caller.service';
import { ItemsLoaderService } from '../items-loader.service';
import { SubjectPopUpComponent } from '../subject-pop-up/subject-pop-up.component';
import { Subject } from '../subject'
import { AppComponent } from '../app.component';

import { jsPDF } from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';

import '../../assets/fonts/OpenSans-Regular-normal'

@Component({
  selector: 'app-search-by',
  templateUrl: './search-by.component.html',
  styleUrls: ['./search-by.component.scss'],
  
})

export class SearchByComponent implements OnInit {

  @ViewChild('autoCompleteInput', { read: MatAutocompleteTrigger }) autoComplete: MatAutocompleteTrigger;
  @ViewChildren(MdePopoverTrigger) trigger: QueryList<MdePopoverTrigger>;

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
  bookingSchedule = new Map<string, Map<string, Subject[]>>()

  // Error Handling
  errorStatusTimetable: number = 0
  errorStatusBooking: number = 0

  errorMessages = new Map<string, Map<number, string>>([
    [
      'en', 
      new Map<number, string>([
        [400, 'Request error, check the request correctness'],
        [404, 'No records in the server'],
        [500, 'Server error, try to request later ...'],
      ])
    ],
    [
      'kz', 
      new Map<number, string>([
        [400, 'Сұраныстағы қате, сұраудың дұрыстығын тексеріңіз'],
        [404, 'Серверде жазбалар жоқ'],
        [500, 'Сервер қатесі, әрекетті кейінірек қайталаңыз ...'],
      ])
    ],
    [
      'ru', 
      new Map<number, string>([
        [400, 'Ошибка в запроса, проверьте правильность запроса'],
        [404, 'Нет записей на сервере'],
        [500, 'Ошибка сервера, попробуйте запросить позже...'],
      ])
    ]
  ])
  
  constructor(private api: ApiCallerService, 
    private dialogRef: MatDialog,
    public itemsLoader: ItemsLoaderService,
    public app: AppComponent) {

    // wait until search suggestions will be loaded
    let interval = setInterval(() => {
      if (itemsLoader.loadedGroups && itemsLoader.loadedRooms && itemsLoader.loadedTeachers) {
        this.loading = false
        this.setSearchSuggestions()
        clearInterval(interval)
      }
    }, 10);
    
    // current week dates
    this.selectedDate = this.app.getTodaysDate(+6)
    this.weekDates = this.app.getWeekDates(this.selectedDate)
  }

  ngOnInit(): void { }

  // set suggestions for search
  setSearchSuggestions() {
    switch(this.searchMode) { 
      case 'by-group': {
        this.searchValue = ''
        this.searchedArray = [] 
        this.suggestionsArray = this.itemsLoader.groups
        break; 
      }
      case 'by-teacher': { 
        this.searchValue = '' 
        this.searchedArray = [] 
        this.suggestionsArray = this.itemsLoader.teachers
        break; 
      }
      case 'by-cabinet': { 
        this.searchValue = '' 
        this.searchedArray = [] 
        this.suggestionsArray = this.itemsLoader.rooms
        break; 
      } 
    } 
  }

  myFilter = (d: any): boolean => {
    const day = (d || new Date()).getDay();
    // Prevent Saturday and Sunday from being selected.
    return day !== 0;
  };

  // search filter
  filter() {
    if (this.searchValue.length==0) {
      this.searchedArray = []
    } else {
      this.searchedArray = this.suggestionsArray.filter((data: any) => {
        return data.name.toLowerCase().includes(this.searchValue.toLowerCase());
      })
    }
  }

  // start search process
  setSearch(id: number) {
    if (this.searchValue == '') {
      this.trigger.toArray()[id].openPopover();
      window.setTimeout(() => { this.trigger.toArray()[id].closePopover() }, 2000);
    } else {
      this.trigger.toArray()[id].closePopover()
      this.loading = true

      this.weekSchedule.clear()
      this.bookingSchedule.clear()
      
      this.timeArray = []
      this.scheduleStartTime = "24:00"
      this.scheduleEndTime = "00:00"

      this.searchStart = true
      this.searchResult = this.searchValue

      this.errorStatusTimetable = 0
      this.errorStatusBooking = 0

      switch(this.searchMode) { 
        case 'by-group': { 
          this.isCabinet = false
          this.getTimetableData("/timetable/group/" + this.searchValue)
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
          this.getTimetableData("/timetable/tutor/" + requestId)
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
          this.getBookingData("/booking/room/" + requestId)
          this.getTimetableData("/timetable/room/" + requestId)
          break; 
        } 
      }
      window.setTimeout(() => { this.loading = false }, 500);
      //this.loading = false
    }
  }  

  // return timetable data by requesting to server
  async getTimetableData(request: string) {
    this.weekSchedule.clear()
    var response = this.api.sendGetRequest(request)
    response.subscribe(data => {
      const schedule = JSON.parse(JSON.stringify(data))
      // process data
      for (let i = 1; i < 7; i++) {
        if (schedule.payload["d" + i] != null) {
          for (let element of schedule.payload["d" + i]) {
            // dynamic time setting
            if (this.app.compareTime(element.start_time, this.scheduleStartTime) == -1) {
              this.scheduleStartTime = element.start_time
            }
            if (this.app.compareTime(element.end_time, this.scheduleEndTime) == 1) {
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

      // drawing time blocks
      this.drawTimeBlocks()

      // drawing schedule elements
      this.drawScheduleBlocks()
    }, error => { 
      this.errorStatusTimetable = error.status
    })
  }

  // set subjects blocks for arrays to display
  async setSubjects(day: string, daySchedule: any) {
    daySchedule.forEach(async (subjects: Subject[]) => {

      var subjectStartTime = subjects[0].start_time.split(':');
      var hours = parseInt(subjectStartTime[0])
      var minutes = parseInt(subjectStartTime[1])
      let id = day + "_t" + subjectStartTime[0] + subjectStartTime[1]

      await this.app.waitForElm('#' + id).then(() => {
        const el = (<HTMLElement>document.getElementById(id));

        let duration = this.app.stringTimeInMinutes(subjects[0].end_time) - this.app.stringTimeInMinutes(subjects[0].start_time)
        el.style.height = (duration * 5 / 60) + "rem"

        let startHour = parseInt(this.scheduleStartTime.split(':')[0])
        // Displacement = (Borders) + (Full Hours) + (Minutes)
        el.style.top = ((0.1 * 2.15 * (hours - startHour)) + ((hours - startHour) * 5) + (minutes / 60) * 5) + "rem"
        
        if (subjects.length > 1) {
          el.style.background = 'linear-gradient(90deg, rgb(69, 124, 206), rgb(165, 52, 214))';
        }

        const el_title = (<HTMLElement>document.getElementById(id + "_title"));
        const el_room = (<HTMLElement>document.getElementById(id + "_room"));

        let title: string = ''
        let room: string = ''
        for (let subject of subjects) {
          title += subject.subject + ' / '
          room += subject.room + ' / '
        }
        el_title.textContent = title.slice(0, -3);
        el_room.textContent = room.slice(0, -3);

        el.style.visibility = "visible"
      })
    })
  }

  // return booking data by requesting to server
  async getBookingData(request: string) {
    this.bookingSchedule.clear()
    this.weekDates = this.app.getWeekDates(this.selectedDate)

    let data = {
      date: this.app.toGolangDateFormat(this.selectedDate) 
    }
    var response = this.api.sendPostRequest(request, data)
    response.subscribe(data => {
      const schedule = JSON.parse(JSON.stringify(data))
      // process data
      for (let date of this.weekDates) {
        let timetableDay = date[0]
        let tempDate = this.app.toGolangDateFormat(date[1]).split('T')[0]

        for (let booking of schedule.payload) {
          let date2 = booking.date.split('T')[0]

          if (date2 == tempDate) {
            // dynamic time setting
            if (this.app.compareTime(booking.start_time, this.scheduleStartTime) == -1) {
              this.scheduleStartTime = booking.start_time
            }
            if (this.app.compareTime(booking.end_time, this.scheduleEndTime) == 1) {
              this.scheduleEndTime = booking.end_time
            }
            // mapping
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

      // drawing time blocks
      this.drawTimeBlocks()
      
      // drawing schedule elements
      this.drawScheduleBlocks()
    }, error => {
      this.errorStatusBooking= error.status
    })
  }

  // set bookings blocks for arrays to display
  async setBooking(day: string, daySchedule: any) {
      daySchedule.forEach(async (subjects: Subject[]) => {
  
      var subjectStartTime = subjects[0].start_time.split(':');
      var hours = parseInt(subjectStartTime[0])
      var minutes = parseInt(subjectStartTime[1])
      let id = day + "_t" + subjectStartTime[0] + subjectStartTime[1]

      var confirmed = subjects[0].confirmed
  
      await this.app.waitForElm('#' + id).then(() => {
        const el = (<HTMLElement>document.getElementById(id));
  
        let duration = this.app.stringTimeInMinutes(subjects[0].end_time) - this.app.stringTimeInMinutes(subjects[0].start_time)
        el.style.height = (duration * 5 / 60) + "rem"
  
        let startHour = parseInt(this.scheduleStartTime.split(':')[0])
        // Displacement = (Borders) + (Full Hours) + (Minutes)
        el.style.top = ((0.1 * 2.15 * (hours - startHour)) + ((hours - startHour) * 5) + (minutes / 60) * 5) + "rem"
        
        if (confirmed) {
          el.style.background = "green"
        } else {
          el.style.background = "#EABC04"
        }
  
        const el_title = (<HTMLElement>document.getElementById(id + "_title"));
        const el_room = (<HTMLElement>document.getElementById(id + "_room"));
        el_title.textContent = subjects[0].reason
        el_room.textContent = subjects[0].room

        el.style.visibility = "visible"
      })
    })
  }

  // draw time blocks
  drawTimeBlocks() {
    let myArray: string[] = []
    let start = parseInt(this.scheduleStartTime.split(':')[0])
    let end = parseInt(this.scheduleEndTime.split(':')[0]) + 1
    for (let i = start; i < end; i++) {
      myArray.push(i + ':00')
      myArray.push(i + ':30')
    }
    this.timeArray = myArray
  }

  // draw schedule blocks
  drawScheduleBlocks() {
    this.app.waitForElm('.grid-container').then(async () => {
      for (let i = 1; i < 7; i++) {
        if (this.weekSchedule.get("d" + i) != null) {
          await this.setSubjects("d" + i, this.weekSchedule.get("d" + i))
        }
      }
      for (let i = 1; i < 7; i++) {
        if (this.bookingSchedule.get("d" + i) != null) {
          await this.setBooking("d" + i, this.bookingSchedule.get("d" + i))
        }
      }
    });
  }

  // HTML interface functions 
  // display human date
  displayHumanDate(date: Date | undefined): string {
    if (date == undefined) {
      return ''
    }
    let tempDate = date.toLocaleString().split(',')[0].trim().split('.')
    return tempDate[0] + '.' + tempDate[1]
  }

  // setting unique id for schedule blocks
  setSubjectId(subject: string): string {
    let time = subject.split(':');
    return "t" + time[0] + time[1]
  }

  // pass subject/booking to open in modal window
  openSubject(subject: Subject[]) {
    this.dialogRef.open(SubjectPopUpComponent, {
      data: {
        object: subject,
        panelClass: 'my-custom-dialog-class'
      }
    })
  }

  // display selected formatted date
  displaySelectedDate(date: Date): string {
    let language: string = localStorage.getItem('language') || 'en'

    let month = this.itemsLoader.months.get(language)?.get(date.getMonth())
    let day = this.itemsLoader.days.get(language)?.get(date.getDay())

    return month + ' ' + date.getDate() + ' | ' + day
  }

  // display search result / errors
  getSearchResult(): string {
    if (this.searchMode != 'by-cabinet') {
      if (this.errorStatusTimetable != 0) {
        let lang = localStorage?.getItem('language') || 'en'
        let message = this.errorMessages.get(lang)?.get(this.errorStatusTimetable) || ''
        return message
      }
    } else if (this.searchMode == 'by-cabinet' && this.isCabinet) {
      if (this.weekSchedule.size == 0 && this.bookingSchedule.size == 0) {
        let errorStatus = 0
        if (this.errorStatusTimetable != 0 && this.errorStatusBooking != 0) {
          if (this.errorStatusTimetable == 400 || this.errorStatusBooking == 400) {
            errorStatus = 400
          } else if (this.errorStatusTimetable == 500 || this.errorStatusBooking == 500) {
            errorStatus = 500
          }
        }

        errorStatus = 404

        let lang = localStorage?.getItem('language') || 'en'
        let message = this.errorMessages.get(lang)?.get(errorStatus) || ''
        return message
      }
    }

    return this.searchResult
  }

  // Render and return pdf file with schedule tables.
  getPdf(id: number) {
    if (this.weekSchedule.size != 0 || this.bookingSchedule.size != 0) {
      let language: string = localStorage.getItem('language') || 'en'
    
      const doc = new jsPDF('portrait', 'pt', 'a4')

      doc.setFont('OpenSans-Regular', 'normal')
      doc.setFontSize(10)

      let isSchedule = this.weekSchedule.size != 0
      let isBooking = this.bookingSchedule.size != 0

      let headerTxt = ''

      let rowsTimetable: { "content": string }[][] = []
      let rowsBookings: { "content": string }[][] = []

      if (isSchedule) {
        headerTxt = 'Schedule: ' + this.searchResult
        doc.text(headerTxt, 50, 50);

        this.weekSchedule.forEach((schedule, day) => {
          let dayNumber = parseInt(day[1])
          let theDay = this.itemsLoader.days.get(language)?.get(dayNumber) || ''

          schedule.forEach((subjects, time) => {
            let title = ''
            let room = ''
            let type = ''
            let tutor = ''
            let end_time = ''
            for (let i = 0; i < subjects.length; i++) {
              if (i + 1 != subjects.length) {
                title += subjects[i].subject + ' / \n'
                room += subjects[i].room + ' / \n'
                type = subjects[i].lesson_type + ' / \n'
                tutor += subjects[i].tutor + ' / \n'
                end_time = subjects[i].end_time
              } else {
                title += subjects[i].subject
                room += subjects[i].room
                type = subjects[i].lesson_type
                tutor += subjects[i].tutor
                end_time = subjects[i].end_time
              }
            }
            rowsTimetable.push([
              { "content": theDay }, 
              { "content": time + '-' + end_time }, 
              { "content": title }, 
              { "content": room }, 
              { "content": type }, 
              { "content": tutor }
            ])
          })
        })

        let index = 0
        let day = rowsTimetable[0][0].content
        for (var i = 0; i < rowsTimetable.length; i++) {
          if (day == rowsTimetable[i][0].content) {
            if (i != index) {
              rowsTimetable[i][0].content = ''
            }
          } else {
            day = rowsTimetable[i][0].content
            index = i
          }
        } 

        let header: RowInput = this.itemsLoader.timeTableFields.get(language) || []

        autoTable(doc, {
          head: [ header ],
          columnStyles: { 0: { halign: 'center'}, 1: { halign: 'center'} },
          body: rowsTimetable,
          theme: 'grid',
          headStyles: {halign: 'center', valign: 'middle', fillColor: [0,0,55]},
          styles: { font: "OpenSans-Regular", fontSize: 8 },
          margin: {top: 60, bottom: 60},
        })
      }

      if (isBooking) {
      if (isSchedule) {
        doc.addPage()
      } 
      headerTxt = 'Booking: ' + this.searchResult
      doc.text(headerTxt, 50, 50);

      this.bookingSchedule.forEach((schedule, day) => {
        let dayNumber = parseInt(day[1])
        let theDay = this.itemsLoader.days.get(language)?.get(dayNumber) || ''

        let date = this.weekDates.get(day)

        schedule.forEach((bookings, time) => {

          let status = bookings[0].confirmed?'+':'-'

          rowsBookings.push([
            { "content": theDay + '\n' + this.displayHumanDate(date) }, 
            { "content": time + '-' + bookings[0].end_time }, 
            { "content": bookings[0].reason }, 
            { "content": bookings[0].room }, 
            { "content": status  }, 
            { "content": bookings[0].reserver }])
          })
        })

        let index = 0
        let day = rowsBookings[0][0].content
        for (var i = 0; i < rowsBookings.length; i++) {
          if (day == rowsBookings[i][0].content) {
            if (i != index) {
              rowsBookings[i][0].content = ''
            }
          } else {
            day = rowsBookings[i][0].content
            index = i
          }
        }

        let header: RowInput = this.itemsLoader.bookingTableFields.get(language) || []

        autoTable(doc, {
          head: [ header ],
          columnStyles: { 0: { halign: 'center'}, 1: { halign: 'center'} },
          body: rowsBookings,
          theme: 'grid',
          headStyles: {halign: 'center', valign: 'middle', fillColor: [0,0,55]},
          styles: { font: "OpenSans-Regular", fontSize: 8 },
          margin: {top: 60, bottom: 60},
        })
      }
  
      doc.save(this.searchResult + '.pdf')
    } else {
      this.trigger.toArray()[id].openPopover();
      window.setTimeout(() => { this.trigger.toArray()[id].closePopover() }, 2000);
    }
  }
}