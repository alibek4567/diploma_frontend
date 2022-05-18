import { Component, ElementRef, OnInit, ViewChild, Renderer2 } from '@angular/core';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { BarController, BarElement, CategoryScale, Chart, LinearScale, Tooltip} from 'chart.js';
import { ApiCallerService } from '../api-caller.service';
Chart.register(BarElement, BarController, CategoryScale, LinearScale, Tooltip, ChartDataLabels);

@Component({
  selector: 'app-search-by',
  templateUrl: './search-by.component.html',
  styleUrls: ['./search-by.component.scss']
})
export class SearchByComponent implements OnInit {

  allTimeTables: any
  timeArray = [8,9,10,11,12,13,14,15,16,17,18]
  d1: any
  d2: any
  d3: any
  d4: any
  d5: any  
  
  constructor(private api: ApiCallerService, public renderer: Renderer2) {
    var response = this.api.sendGetRequest("/getTimetable/1")
    response.subscribe(data => {
      const timeTables = JSON.parse(JSON.stringify(data))
      this.d1 = timeTables.payload["d1"]
      this.d2 = timeTables.payload["d2"]
      this.d3 = timeTables.payload["d3"]
      this.d4 = timeTables.payload["d4"]
      this.d5 = timeTables.payload["d5"]
      this.updateHtml(this.d1)
      this.updateHtml(this.d2)
      this.updateHtml(this.d3)
      this.updateHtml(this.d4)
      this.updateHtml(this.d5)
    }, error => {
    })
   
   }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
      // (<HTMLElement>document.getElementById(""+item.classtime_time.chartAt(0))).className = "block"
  }

  updateHtml(data: any){
    if(data!=null){
      for(let item of data){
        let el = (<HTMLElement>document.getElementById(item.classtime_day+"_"+(item.classtime_time).split(':')[0]));
        el.className = "block";
        el.insertAdjacentHTML("beforeend", "<p style='margin: 0 0 0.5rem 0;; padding: 0; font-size:0.9rem'>"+item.subject+"</p>");
        el.insertAdjacentHTML("beforeend", "<p style='margin: 0 0 0.5rem 0;; padding: 0; font-size:0.8rem'>"+item.tutor+"</p>")
        el.insertAdjacentHTML("beforeend", "<p style='margin: 0 0 0.5rem 0;; padding: 0; font-size:0.8rem'>"+item.room+"</p>");
      }
    }
  }
}
