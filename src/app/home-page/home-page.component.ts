import { Component, OnInit } from '@angular/core';
import { Subject } from '../subject';
import { MatDialog } from '@angular/material/dialog';
import { SubjectPopUpComponent } from '../subject-pop-up/subject-pop-up.component';
import { ApiCallerService } from '../api-caller.service';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {

  weekSchedule = new Map<string, Map<string, Subject[]>>()

  department = ''
  searchStart: boolean = false
  searchMode: string = ''
  searchValue: string
  searchResult: string
  searchSuccess: boolean = false

  // search by cabinet
  cabinet: boolean = false

  // time parameters of schedule
  scheduleStartTime: string = "24:00"
  scheduleEndTime: string = "00:00"
  timeArray: string[] = []

  id: string | null = sessionStorage.getItem('id')
  bookings: any[]
  message = ''
  loading = true

  constructor(private dialogRef: MatDialog, public api: ApiCallerService, public app: AppComponent) {

    console.log(sessionStorage.getItem('department'));
  
    if(!isNumber(this.department?.substring(this.department.length - 4))){
      let temp1 = sessionStorage.getItem('department')?.replace('-', '')
      if (temp1 != undefined)
      this.searchValue = temp1
      this.searchMode = 'by-group'
    } else {
      let temp2 = sessionStorage.getItem('username')
      if (temp2 != null) {
        this.searchValue = temp2
        this.searchMode = 'by-teacher'
      }
    }
    
    console.log(this.searchValue);

    waitForElm('.searchField').then(async () => {
      this.setSearch()
    });

    var response = this.api.sendGetRequest("/booking/reserver/"+this.id)
    response.subscribe(r => {
      const data = JSON.parse(JSON.stringify(r))
      if(data.payload != null){
        this.bookings = data.payload
        this.message = "success"
        console.log(this.bookings);
      }
      else{
        this.message = "empty"
      }
    }, error => {
      this.message = error
    })

  }

  ngOnInit(): void {
  }

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

function isNumber(char: any) {
  return /^\d$/.test(char);
}