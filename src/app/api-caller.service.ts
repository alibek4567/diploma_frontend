import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiCallerService {

  constructor(public http: HttpClient) { }

  addr = "http://localhost:4003"

  sendGetRequest(url: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Accept': 'application/json',
        })
      };

    return this.http.get(this.addr+url, httpOptions)
  }

  sendGetRequestWithAuth(url: string) {
    console.log(sessionStorage.getItem('token'));
    
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Accept': 'application/json',
        'Gao-Jwt-Token': sessionStorage.getItem('token') || ''
        })
      };
    return this.http.get(this.addr+url, httpOptions)
  }
  
  sendPostRequest(url: string, data: any) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Accept': 'application/json',
        })
      };

    return this.http.post(this.addr+url, data, httpOptions)
  }

  sendPostRequestWithAuth(url: string, data: any) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Accept': 'application/json',
        'Gao-Jwt-Token': sessionStorage.getItem('token') || ''
        })
      };
    return this.http.post(this.addr+url, data, httpOptions)
  }

  sendPatchRequestWithAuth(url: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Accept': 'application/json',
        'Gao-Jwt-Token': sessionStorage.getItem('token') || ''
        })
      };
    return this.http.patch(this.addr+url, httpOptions)
  }
}
