import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { Subject } from '../subject';
import { MatDialog } from '@angular/material/dialog';
import { SubjectPopUpComponent } from '../subject-pop-up/subject-pop-up.component';
import { ApiCallerService } from '../api-caller.service';
import { AppComponent } from '../app.component';
import { Router } from '@angular/router';
import { MdePopoverTrigger } from '@material-extended/mde';
import { ItemsLoaderService } from '../items-loader.service';

import { jsPDF } from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';

import '../../assets/fonts/OpenSans-Regular-normal'

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {

  @ViewChildren(MdePopoverTrigger) trigger: QueryList<MdePopoverTrigger>;

  // search parameters
  department = ''
  searchMode: string = ''
  searchValue: string
  searchSuccess: boolean = false

  // time parameters of schedule
  scheduleStartTime: string = "24:00"
  scheduleEndTime: string = "00:00"
  timeArray: string[] = []

  weekSchedule = new Map<string, Map<string, Subject[]>>()

  // Booking Data
  id: string | null = localStorage.getItem('id')
  bookings: any[] = []

  errorStatusBooking: number = 0
  errorStatusTimetable: number = 0

  errorMessages = new Map<string, Map<number, string>>([
    [
      'en', 
      new Map<number, string>([
        [0, ''],
        [400, 'Request error, check the request correctness'],
        [404, 'No records in the server'],
        [500, 'Server error, try to request later ...'],
      ])
    ],
    [
      'kz', 
      new Map<number, string>([
        [0, ''],
        [400, 'Сұраныстағы қате, сұраудың дұрыстығын тексеріңіз'],
        [404, 'Серверде жазбалар жоқ'],
        [500, 'Сервер қатесі, әрекетті кейінірек қайталаңыз ...'],
      ])
    ],
    [
      'ru', 
      new Map<number, string>([
        [0, ''],
        [400, 'Ошибка в запроса, проверьте правильность запроса'],
        [404, 'Нет записей на сервере'],
        [500, 'Ошибка сервера, попробуйте запросить позже...'],
      ])
    ]
  ])

  constructor(private dialogRef: MatDialog, public api: ApiCallerService, public app: AppComponent, public router: Router, public itemsLoader: ItemsLoaderService,) {    
    // check auth info
    if(!app.isLoggedIn()){
      router.navigateByUrl('')
    }
  
    // check department of user
    if(isNumber(this.department?.substring(this.department.length - 4))){
      let department = localStorage.getItem('department')
      if (department != undefined)
      this.searchValue = department
      this.searchMode = 'by-group'
    } else {
      let email = localStorage.getItem('email')
      if (email != null) {
        this.searchValue = email
        this.searchMode = 'by-teacher'
      }
    }

    // getting study timetable of user
    this.app.waitForElm('.searchField').then(async () => {
      this.setSearch()
    });

    // geeting study rooms booking of user
    var response = this.api.sendGetRequest("/booking/reserver/" + this.id)
    response.subscribe(r => {
      const data = JSON.parse(JSON.stringify(r))
      if(data.payload != undefined){
        const temp = data.payload
        for(let item of temp){
          if(dateCompare(item.date.split('T')[0], this.app.toGolangDateFormat( this.app.getTodaysDate(+6) ).split('T')[0]) == 1 ||
            dateCompare(item.date.split('T')[0], this.app.toGolangDateFormat( this.app.getTodaysDate(+6) ).split('T')[0]) == 0){
            this.bookings.push(item)
          }
        }
      }
    }, error => {
      this.errorStatusBooking = error.status
    })
  }

  ngOnInit(): void { }

  setSearch() {
    if (this.searchValue != '') {
      this.weekSchedule.clear()

      this.timeArray = []
      this.scheduleStartTime = "24:00"
      this.scheduleEndTime = "00:00"

      switch(this.searchMode) { 
        case 'by-group': { 
          this.getStudyTimetable("/timetable/group/" + this.searchValue)
          break; 
        }
        case 'by-teacher': { 
          this.getStudyTimetable("/timetable/tutor/email/" + this.searchValue)
          break; 
        }
      } 
    }
  }  

  getStudyTimetable(request: string) {
    var response = this.api.sendGetRequest(request)
    response.subscribe(data => {
      this.searchSuccess = true
      const schedule = JSON.parse(JSON.stringify(data))
      // process data
      for (let i = 1; i < 7; i++) {
        if (schedule.payload["d" + i] != null) {
          for (let item of schedule.payload["d" + i]) {
            // dynamic time setting
            if (this.app.compareTime(item.start_time, this.scheduleStartTime) == -1) {
              this.scheduleStartTime = item.start_time
            }
            if (this.app.compareTime(item.end_time, this.scheduleEndTime) == 1) {
              this.scheduleEndTime = item.end_time
            }
            // mapping
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

      // drawing time blocks
      this.drawTimeBlocks()

      // Drawing Subjects
      this.app.waitForElm('.grid-container').then(async () => {
        for (let i = 1; i < 7; i++) {
          await this.setSubjects("d" + i, this.weekSchedule.get("d" + i))
        }
      });
    }, error => { 
      this.errorStatusTimetable= error.status
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

  // set subjects blocks for arrays to display
  async setSubjects(day: string, daySchedule: any) {
    if (daySchedule != null) {
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
        object: subject
      }
    })
  }

  // Render and return pdf file with schedule tables.
  getPdf(id: number) {
    if (this.weekSchedule.size != 0) {
    
      const doc = new jsPDF('portrait', 'pt', 'a4')

      doc.setFont('OpenSans-Regular', 'normal')
      doc.setFontSize(10)

      let isSchedule = this.weekSchedule.size != 0

      let headerTxt = this.itemsLoader.jspdfDictionary.get(this.app.language)?.get(0) + ': ' + this.searchValue
     
      doc.text(headerTxt, 50, 50);

      let rowsTimetable: { "content": string, "rowSpan": number }[][] = []

      if (isSchedule) {
        this.weekSchedule.forEach((schedule, day) => {
        let dayNumber = parseInt(day[1])
        let theDay = this.itemsLoader.days.get(this.app.language)?.get(dayNumber) || ''

        schedule.forEach((subjects, time) => {
          let title = ''
          let room = ''
          let type = ''
          let tutor = ''
          let end_time = ''
          for (let i = 0; i < subjects.length; i++) {
            if (i + 1 != subjects.length) {
              title += subjects[i].subject + ' / '
              room += subjects[i].room + ' / '
              type = subjects[i].lesson_type + ' / '
              tutor += subjects[i].tutor + ' / '
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
            { "content": theDay, "rowSpan": 1 }, 
            { "content": time + '-' + end_time, "rowSpan": 1 }, 
            { "content": title, "rowSpan": 1 }, 
            { "content": room, "rowSpan": 1 }, 
            { "content": type, "rowSpan": 1 }, 
            { "content": tutor, "rowSpan": 1 }])
        })
        })

        let counter = 0
        let index = 0
        let day = rowsTimetable[0][0].content
        for (var i = 0; i < rowsTimetable.length; i++) {
        if (day == rowsTimetable[i][0].content) {
          counter++
          if (i != index) {
            rowsTimetable[i].shift()
          }
        } else {
          day = rowsTimetable[i][0].content
          rowsTimetable[index][0].rowSpan = counter
          counter = 1
          index = i
        }
        if (i + 1 == rowsTimetable.length) {
          rowsTimetable[index][0].rowSpan = counter
        }
        }

        let header: RowInput = this.itemsLoader.timeTableFields.get(this.app.language) || []

        autoTable(doc, {
          head: [ header ],
          body: rowsTimetable,
          theme: 'grid',
          headStyles: {halign: 'center', valign: 'middle', fillColor: [0,0,55]},
          styles: { font: "OpenSans-Regular", fontSize: 8 },
          margin: {top: 60, bottom: 60},
          horizontalPageBreak: true
        })
      }
  
      doc.save(this.searchValue + '.pdf')
    } else {
      this.trigger.toArray()[id].openPopover();
      window.setTimeout(() => { this.trigger.toArray()[id].closePopover() }, 2000);
    }
  }
}

// compare 2 string dates
function dateCompare(d1: string, d2: string): number{
  const date1 = new Date(d1);
  const date2 = new Date(d2);

  if(date1 > date2){
      return 1
  } else if(date1 < date2){
      return -1
  } else{
      return 0
  }
}

// check is Number
function isNumber(char: any) {
  //return /^\d$/.test(char);
  return !Number.isNaN(Number(char))
}
