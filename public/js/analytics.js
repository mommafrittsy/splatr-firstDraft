/* global fetch xhr Chart */
const analyticsBtns = document.getElementsByClassName('user-analytic-btn'),
      galleryBtns = document.getElementsByClassName('galleryButton'),
      sidebarBtn = document.getElementById('analyticButton');

sidebarBtn.addEventListener('click', function(){
  let start = Date.now() - 604800000,
      end = Date.now(),
      url = `/analytics/user/${start}/${end}`,
      init = {method: 'GET', credentials: 'include'};
  fetch(url, init)
  .then((response)=>{
    return response.json();
  })
  .then((data)=>{
    drawChart(data);
  })
  .catch((err)=>{
    console.log(err);
  });
});
for(let btn of galleryBtns){
  btn.addEventListener('click', function(){
    let today = new Date(),
        end = Date.parse(today),
        startDate = new Date(end - 314496000000),
        start = Date.parse(startDate),
        url = `/analytics/gallery/${btn.dataset.id}/${start}/${end}`,
        init = {method:'GET', credentials:'include'},
        chart = document.getElementById('galleryChart');
    fetch(url, init)
    .then((response)=>{
      return response.json();
    })
    .then((data)=>{
      console.log(data);
      chartGallery(chart, data);
    })
    .catch((err)=>{
      console.log(err);
    });
  });
}

for(let btn of analyticsBtns){
  btn.addEventListener('click', function(){
    let start = btn.dataset.start,
        end = btn.dataset.end,
        url = `/analytics/user/${start}/${end}`,
        init = {
          method:'GET',
          credentials: 'include'
        };
    fetch(url, init)
    .then((response)=>{
      return response.json();
    })
    .then((data)=>{
      drawChart(data);
    })
    .catch((err)=>{
      console.log(err);
    });
  });
}

function drawChart(data){
  let commCanvas = document.getElementById('user-analytics-canvas').getContext('2d'),
      moneyCanvas = document.getElementById('money-analytics-canvas').getContext('2d'),
      colors = {
        accepted:'rgba(119, 13, 186, 1)',
        completed_payments: 'rgba(70, 226, 176, 1)',
        deposits:'rgba(96, 96, 96, 1)',
        declined:'rgba(244, 101, 182, 1)',
        fans: 'rgba(70, 171, 226, 1)',
        finalized: 'rgba(226, 153, 70, 1)',
        requests: 'rgba(226, 70, 70, 1)',
      },
      accepted = {
        label: "Accepted",
        data: [],
        borderColor: colors.accepted,
        fill: false,
        pointBackgroundColor: colors.accepted,
        pointBorderColor: colors.accepted
      },
      completed_payments = {
        label: "Completed Payments ($)(USD)",
        data: [],
        borderColor: colors.completed_payments,
        fill: false,
        pointBackgroundColor: colors.completed_payments,
        pointBorderColor: colors.completed_payments
      },
      declined = {
        label: "Declined",
        data: [],
        borderColor: colors.declined,
        fill: false,
        pointBackgroundColor: colors.declined,
        pointBorderColor: colors.declined
      },
      deposits = {
        label: "Deposits ($)(USD)",
        data: [],
        fill: false,
        borderColor: colors.deposits,
        pointBackgroundColor: colors.deposits,
        pointBorderColor: colors.deposits
      },
      fans = {label: "New Fans",
        data: [],
        borderColor: colors.fans,
        fill: false,
        pointBackgroundColor: colors.fans,
        pointBorderColor: colors.fans
      },
      finalized = {
        label: "Finalized",
        data: [],
        borderColor: colors.finalized,
        fill: false,
        pointBackgroundColor: colors.finalized,
        pointBorderColor: colors.finalized
      },
      requests = {
        label: "Requests",
        data: [],
        borderColor: colors.requests,
        fill: false,
        pointBackgroundColor: colors.requests,
        pointBorderColor: colors.requests
      },
      commChartData = {
        labels:[],
        datasets:[accepted, declined, fans, finalized, requests],
      },
      moneyChartData = {
        labels:[],
        datasets:[completed_payments, deposits]
      };
  for(let day of data){
    commChartData.labels.push(day.date.string);
    moneyChartData.labels.push(day.date.string);
    accepted.data.push(day.accepted);
    completed_payments.data.push((day.completed_payments/100).toFixed(2));
    declined.data.push(day.declined);
    deposits.data.push((day.deposits/100).toFixed(2));
    fans.data.push(day.fans);
    finalized.data.push(day.finalized);
    requests.data.push(day.requests);
  }
  let commChart = new Chart(commCanvas, {
    type: 'line',
    data: commChartData,
     options: {
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero:true
          }
        }]
      },
      title: {
        display: true,
        text:'Your Commissions'
      }
    }
  });
  let moneyChart = new Chart(moneyCanvas, {
    type: 'line',
    data: moneyChartData,
    options: {
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero:true
          }
        }]
      },
      title: {
        display: true,
        text:'Your Income'
      }
    }
  });
}
function chartGallery(chart, data){
  let canvas = chart.getContext('2d'),
      views = {
        label: "Views",
        data: [],
        borderColor: 'rgba(70, 226, 176, 1)',
        fill: false,
        pointBackgroundColor: 'rgba(70, 226, 176, 1)',
        pointBorderColor: 'rgba(70, 226, 176, 1)'
      },
      likes = {
        label: "Likes",
        data: [],
        borderColor: 'rgba(7116, 2, 198, 1)',
        fill: false,
        pointBackgroundColor: 'rgba(116, 2, 198, 1)',
        pointBorderColor: 'rgba(116, 2, 198, 1)'
      },
      chartData = {
        labels:[],
        datasets:[views, likes]
      };
  for(let day of data){
    chartData.labels.push(day.date.string);
    views.data.push(day.views);
    likes.data.push(day.likes);
  }
  if(views.data.length != 0 || likes.data.length != 0){
    let lineChart = new Chart(canvas,{
      type:'line',
      data:chartData,
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero:true
            }
          }]
        }
      }
    });
  }
}