import { Injectable } from '@angular/core';
import { ApiCallerService } from './api-caller.service';

@Injectable({
  providedIn: 'root'
})
export class ItemsLoaderService {

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
    })

    var response = this.api.sendGetRequest("/group")
    response.subscribe(data => {
      this.groups = JSON.parse(JSON.stringify(data)).payload
      console.log(this.groups);
      this.loadedGroups = true
    }, error => {
    })

    var response = this.api.sendGetRequest("/teacher")
    response.subscribe(data => {
      this.teachers = JSON.parse(JSON.stringify(data)).payload
      console.log(this.teachers);
      this.loadedTeachers = true
    }, error => {
    })
   }
}
