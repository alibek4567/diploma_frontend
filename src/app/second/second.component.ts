import { Component, OnInit } from '@angular/core';
import { BarController, BarElement, CategoryScale, Chart, LinearScale, Title, Legend, Tooltip} from 'chart.js';
import 'chartjs-adapter-luxon';
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(BarElement, BarController, CategoryScale, LinearScale, ChartDataLabels);

@Component({
  selector: 'app-second',
  templateUrl: './second.component.html',
  styleUrls: ['./second.component.scss']
})
export class SecondComponent implements OnInit {

  backgroundColor = ["rgba(255, 195, 0, 0.5)"]

  constructor() { 
    for(let i = 0; i<3; i++){
      const r = Math.floor(Math.random() * 255)
      const g = Math.floor(Math.random() * 255)
      const b = Math.floor(Math.random() * 255)
      this.backgroundColor.push("rgba("+r+", "+g+", "+b+", 0.5)");
    }
  }

  ngOnInit(): void {
    const myChart = new Chart("barChart", {
        plugins: [ChartDataLabels],
        type: 'bar',
        data: {
          labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          datasets: [{
              label: 'Project Management',
              data: [
                [8, 9],
                [11, 13],
                [8, 9]
              ],
              barThickness: 'flex',
              backgroundColor: this.backgroundColor[0],
            },
            {
              label: 'Operation Systems',
              data: [
                [8, 9],
                [14, 15],
                [12, 15]
              ], 
              barThickness: 'flex',
              backgroundColor: this.backgroundColor[1],
            },
            {
              label: 'ADS',
              data: [
                null,
                [16, 18],
                [17, 18]
              ],
              barThickness: 'flex',
              backgroundColor: this.backgroundColor[2],
            },
          ]
        },
        options: {
          plugins: {
            datalabels: {
              formatter: (value, context) => { 
                if(value!=null){ return context.dataset.label}
                return null
              },
              textAlign: 'center',
              anchor: 'center',
              align: 'center',
              color: 'black',
              display: 'auto',
              font: {
                size: 12
              }
            }
          },
          responsive: true,
          indexAxis: 'x',
          scales: {
            y: {
              type: 'linear',
              min: 8,
              max: 18,
              reverse: true
            },
            x: {
              axis: 'x',
              stacked: true,
            },
          }
        }
      });
  }

}
