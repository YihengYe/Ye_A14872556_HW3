generation=[];
generation_p=[];
['mousemove', 'touchmove', 'touchstart'].forEach(function (eventType) {
    document.getElementById('container').addEventListener(
        eventType,
        function (e) {
            var chart,
                point,
                i,
                event,
                sources,
                loads,
                renewable;

            for (i = 0; i < Highcharts.charts.length; i = i + 1) {
                chart = Highcharts.charts[i];
                if (chart){
                    // Find coordinates within the chart
                    event = chart.pointer.normalize(e);
                    // Get the hovered point
                    var j;
                    sources = 0;
                    loads = 0;
                    renewable = 0;
                    for (j = 0; j < chart.series.length; j = j + 1){
                        point = chart.series[j].searchPoint(event, true);
                        if (point) {
                            point.highlight(e);
                            if (chart.series.length > 1){
                            if (["exports","pumps"].includes(point.series.name)) {
                                loads -= point.y;
                                if (point.y){document.getElementById(point.series.name).innerHTML = -point.y.toFixed(4);
                                }
                                else{
                                    document.getElementById(point.series.name).innerHTML = "-";
                                }
                                
                            } else {
                                sources += point.y;
                                document.getElementById(point.series.name).innerHTML = point.y.toFixed(4);
                            }
                            
                        }
                        }
                    }
                    if (point){
                        if (point.series.name == "Springfield.price"){
                            document.getElementById('price').innerHTML = "$"+point.y;
                        }
                        var nowdate=new Date(point.x)
                        document.getElementById('time_memory').innerHTML=nowdate.toISOString()
                    }
                    
                    if (chart.series.length > 1){
                        var current = [];
                        var current_p = [];
                        var nets = (loads+sources).toFixed(4)
                        document.getElementById("loads").innerHTML = loads.toFixed(4);
                        document.getElementById("sources").innerHTML = sources.toFixed(4);
                        document.getElementById("net").innerHTML = nets;
                        for (j = 0; j < chart.series.length; j = j + 1){
                        point = chart.series[j].searchPoint(event, true);
                        if (point) {
                            point.highlight(e);
                            if (chart.series.length > 1){
                            if (["exports","pumps"].includes(point.series.name)) {
                                if (point.y){
                                    document.getElementById(point.series.name+"per").innerHTML = (-point.y*100.0/nets).toFixed(4) + "%";
                                }
                                else{
                                    document.getElementById(point.series.name+"per").innerHTML = "-";
                                }  
                            } else {
                                if (["wind","hydro"].includes(point.series.name)){
                                        renewable += (point.y*100.0/nets);
                                }
                                current.push([point.series.name,point.y]);
                                current_p.push([point.series.name,+((point.y*100.0/nets).toFixed(4))])
                                document.getElementById(point.series.name+"per").innerHTML = (point.y*100.0/nets).toFixed(4) + "%";
                            }
                            
                        }
                        }

                    }
                    document.getElementById( "renew" ).innerHTML =  renewable.toFixed(4) + "%";
                    generation=current
                    generation_p=current_p
                    if(document.getElementById('chartType').value=='pie'){
                    var chartDiv=document.getElementById('pieGrid')
                    var changing=Highcharts.chart(chartDiv, {
                        chart:{
                            backgroundColor: '#ece9e6'

                        },

                        title: {
                            text:sources.toFixed(2)+"MW",
                            verticalAlign: 'middle'
                        },
                        plotOptions: {
                            
                            series: {
                                animation: false
                            },
                            
                        },
                        series:[{
                            data: current,
                            type:'pie',
                            innerSize: '50%',
                        }]
                
                    });
                    }else{
                    var chartDiv=document.getElementById('pieGrid');
                    var changing=Highcharts.chart(chartDiv, {
                        chart:{
                            backgroundColor: '#ece9e6'

                        },

                        title: {
                            text:sources.toFixed(2)+"MW",
                            verticalAlign: 'middle'
                        },
                        plotOptions: {
                            
                            series: {
                                animation: false
                            },
                            bar: {
                                dataLabels: {
                                    formatter: function(){
                                        return this.y+'%'

                                    },
                                    enabled: true
                                }
                            }
                        },
                        xAxis:{
                            categories:current_p.map(i=>i[0])
                        },
                       
                        series:[{
                            data: current_p,
                            type:'bar',
                            innerSize: '50%',
                        }]
                    })

                    };

                    
                    
                        
                
                }
            }
            }
        }
    );
});




/**
* Override the reset function, we don't need to hide the tooltips and
* crosshairs.
*/
Highcharts.Pointer.prototype.reset = function () {
  return undefined;
};

/**
* Highlight a point by showing tooltip, setting hover state and draw crosshair
*/
Highcharts.Point.prototype.highlight = function (event) {
  event = this.series.chart.pointer.normalize(event);
  this.onMouseOver(); // Show the hover marker
  this.series.chart.tooltip.refresh(this); // Show the tooltip
  this.series.chart.xAxis[0].drawCrosshair(event, this); // Show the crosshair
};

/**
* Synchronize zooming through the setExtremes event handler.
*/
function syncExtremes(e) {
  var thisChart = this.chart;

  if (e.trigger !== 'syncExtremes') { // Prevent feedback loop
      Highcharts.each(Highcharts.charts, function (chart) {
          if (chart !== thisChart) {
              if (chart.xAxis[0].setExtremes) { // It is null while updating
                  chart.xAxis[0].setExtremes(
                      e.min,
                      e.max,
                      undefined,
                      false,
                      { trigger: 'syncExtremes' }
                  );
              }
          }
      });
  }
}

// Get the data. The contents of the data file can be viewed at
Highcharts.ajax({
  url: 'assets/springfield.json',
  dataType: 'text',
  success: function (activity) {

      activity = JSON.parse(activity);
      activity=activity.filter(function(item){
          return item.id !='Springfield.fuel_tech.rooftop_solar.power'
      })
      var activity2=activity.filter(function(item){
          return item.type != 'power'
      })

      activity2=activity2.filter(function(item){
          return item.type !='demand'
      })

      var activity3=activity.filter(function(item){
        return item.type == 'power'
      })
      activity3.forEach(function(dataset){
          dataset.history.data=dataset.history.data.filter(function(item, index, Arr){
              return index%6 ==0
              
          })
          dataset.interval='30m'
          return dataset

      })

      powers=activity3.map(i => {return ({name: i['fuel_tech'], data: i['history']['data']})})

      var chartDiv=document.createElement('div');
      chartDiv.className='chart';
      document.getElementById('container').appendChild(chartDiv);
      Highcharts.chart(chartDiv,
        {
            chart:{
                margin: 40,
                spacingTop: 20,
                spacingBottom: 20,
                type: 'area',
                backgroundColor: '#ece9e6',
                
            },
            title:{
                text: 'Generation',
                align:'left',
                margin: 0,
                x: 30
            },
            credits:{
                enabled: false
            },
            legend:{
                enabled: false
            },
            xAxis: {
                crosshair:{
                    width:5,
                    color: 'red'

                },
                events: {
                    setExtremes: syncExtremes
                },
                type: 'datetime',
                tickInterval: 30*60*1000,
                
            },
            yAxis: {
                title: {
                    text: null
                },
                
                
                
            },
            tooltip: {
                positioner: function () {
                    return {
                        // right aligned
                        x: this.chart.chartWidth - this.label.width,
                        y: 10 // align to title
                    };
                },
                borderWidth: 0,
                backgroundColor:'#ece9e6',
                pointFormat: '{point.y}',
                headerFormat: '',
                shadow: false,
                style: {
                    fontSize: '18px'
                },
                valueDecimals: 0,
                animation: false,
                
            },
            plotOptions: {
                area: {
                    stacking: 'normal',
                    lineColor: '#666666',
                    lineWidth: 1,
                    marker: {
                        lineWidth: 1,
                        lineColor: '#666666'
                    }
                },
                series:{
                    pointStart: Date.UTC(2019,9,21,10),
                    pointInterval: 1000*60*30,
                    states: {
                        inactive: {
                            opacity: 1
                        }
                    }
                }
            },
            series: powers,
            tooltip: {
                valueSuffix: " MW",
               
            }

        }

      )


      activity2.forEach(function (dataset, i) {

          // Add X values

          var chartDiv = document.createElement('div');
          chartDiv.className = 'chart';
          document.getElementById('container').appendChild(chartDiv);

          Highcharts.chart(chartDiv, {
              chart: {
                  marginLeft: 40, // Keep all charts left aligned
                  spacingTop: 20,
                  spacingBottom: 20,
                  backgroundColor: '#ece9e6'
              },
              title: {
                  text: dataset.type,
                  align: 'left',
                  margin: 0,
                  x: 30
              },
              credits: {
                  enabled: false
              },
              legend: {
                  enabled: false
              },
              xAxis: {
                  crosshair: {
                      width: 5,
                      color: 'red',

                  },
                  events: {
                      setExtremes: syncExtremes
                  },
                  type: 'datetime',
                  tickInterval: 30*60*1000,
                  
              },
              yAxis: {
                  title: {
                      text: null
                  }
              },
              tooltip: {
                  positioner: function () {
                      return {
                          // right aligned
                          x: this.chart.chartWidth - this.label.width,
                          y: 10 // align to title
                      };
                  },
                  borderWidth: 0,
                  backgroundColor: '#ece9e6',
                  pointFormat:'{point.y}',
                  headerFormat: '',
                  shadow: false,
                  style: {
                      fontSize: '15px'
                  },
                  valueDecimals: 0,
                  formatter: function(){
                            var pdate=new Date(this.x)
                            return pdate.toISOString()+' '+' '+this.y+' '+dataset.units
                  }
                  
                  
              },
              plotOptions: {
                series: {
                    pointStart: Date.UTC(2019,9,21,10),
                    pointInterval: 1000*60*30
                }
              },
              series: [{
                  data: dataset.history.data,
                  name: dataset.id,
                  type: 'line',
                  color: Highcharts.getOptions().colors[i],
                  fillOpacity: 0.3,
                  tooltip: {
                      valueSuffix: ' ' + dataset.units
                  }
              }]
          });
      });

    
  }
});