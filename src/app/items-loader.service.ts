import { Injectable } from '@angular/core';
import { ApiCallerService } from './api-caller.service';

@Injectable({
  providedIn: 'root'
})
export class ItemsLoaderService {

  months = new Map<string, Map<number, string>>([
    [
      'en', 
      new Map<number, string>([
        [0, 'Jan'],
        [1, 'Feb'],
        [2, 'Mar'],
        [3, 'Apr'],
        [4, 'May'],
        [5, 'Jun'],
        [6, 'Jul'],
        [7, 'Aug'],
        [8, 'Sep'],
        [9, 'Oct'],
        [10, 'Nov'],
        [11, 'Dec'],
      ])
    ],
    [
      'kz', 
      new Map<number, string>([
        [0, 'Қаң'],
        [1, 'Ақп'],
        [2, 'Нау'],
        [3, 'Сәу'],
        [4, 'Мам'],
        [5, 'Мау'],
        [6, 'Шіл'],
        [7, 'Там'],
        [8, 'Қыр'],
        [9, 'Қаз'],
        [10, 'Қар'],
        [11, 'Жел'],
      ])
    ],
    [
      'ru', 
      new Map<number, string>([
        [0, 'Янв'],
        [1, 'Фев'],
        [2, 'Мар'],
        [3, 'Апр'],
        [4, 'Май'],
        [5, 'Июнь'],
        [6, 'Июль'],
        [7, 'Авг'],
        [8, 'Сен'],
        [9, 'Окт'],
        [10, 'Ноя'],
        [11, 'Дек'],
      ])
    ]
  ])

  days = new Map<string, Map<number, string>>([
    [
      'en', 
      new Map<number, string>([
        [0, 'Sun'],
        [1, 'Mon'],
        [2, 'Tue'],
        [3, 'Wed'],
        [4, 'Thu'],
        [5, 'Fri'],
        [6, 'Sat'],
      ])
    ],
    [
      'kz', 
      new Map<number, string>([
        [0, 'Жек'],
        [1, 'Дүй'],
        [2, 'Сей'],
        [3, 'Сәр'],
        [4, 'Бей'],
        [5, 'Жұм'],
        [6, 'Сен'],
      ])
    ],
    [
      'ru', 
      new Map<number, string>([
        [0, 'Вс'],
        [1, 'Пн'],
        [2, 'Вт'],
        [3, 'Ср'],
        [4, 'Чт'],
        [5, 'Пт'],
        [6, 'Сб'],
      ])
    ]
  ])

  timeTableFields = new Map<string, string[]>([
    [
      'en', 
      ['Week days', 'Time', 'Discipline', 'Cabinet', 'Type', 'Tutor']
    ],
    [
      'kz', 
      ['Апта күндері', 'Уақыт', 'Дисциплина', 'Кабинет', 'Тип', 'Оқытушы']
    ],
    [
      'ru', 
      ['Дни недели', 'Время', 'Дисциплина', 'Кабинет', 'Тип', 'Препод.']
    ]
  ])

  bookingTableFields = new Map<string, string[]>([
    [
      'en', 
      ['Week days', 'Time', 'Reason', 'Cabinet', 'Confirmed', 'Owner']
    ],
    [
      'kz', 
      ['Апта күндері', 'Уақыт', 'Себеп', 'Кабинет', 'Расталған', 'Иесі']
    ],
    [
      'ru', 
      ['Дни недели', 'Время', 'Причина', 'Кабинет', 'Подтвержден', 'Владелец']
    ]
  ])

  rooms: []
  groups: []
  teachers: []
  loadedRooms = false
  loadedTeachers = false
  loadedGroups = false

  constructor(private api: ApiCallerService) {
    var response = this.api.sendGetRequest("/room")
    response.subscribe(data => {
      this.rooms = JSON.parse(JSON.stringify(data)).payload
      console.log(this.rooms);
      this.loadedRooms = true
    }, error => {
      console.log(error)
    })

    var response = this.api.sendGetRequest("/group")
    response.subscribe(data => {
      this.groups = JSON.parse(JSON.stringify(data)).payload
      console.log(this.groups);
      this.loadedGroups = true
    }, error => {
      console.log(error)
    })

    var response = this.api.sendGetRequest("/teacher")
    response.subscribe(data => {
      this.teachers = JSON.parse(JSON.stringify(data)).payload
      console.log(this.teachers);
      this.loadedTeachers = true
    }, error => {
      console.log(error)
    })
   }
}
