class Dashboard{
    constructor(config) {
        this.apiBase = config.apiBase || 'http://124.222.225.80:8000/dashboard/';
        this.echarts = window.echarts;
        this.init();
    }
    init() {
        this.renderSummary();
        this.renderWeekSummary();
        this.getDashboardContext();
        this.updateOnlineCount();
        this.getRecent3info();
    }
    renderSummary(){
        const exceeding_rate = this.echarts.init(document.getElementById('exceeding_rate'));
        const ApiUrl = this.apiBase + 'analysis_summary/';
        fetch(ApiUrl)
            .then(response => response.json())
            .then(data => {
                const option = {
                    title: {text: data.title},
                    tooltip: {},
                    toolbox: {
                        show: true,
                        feature: {
                            dataZoom: {
                                yAxisIndex: 'none'
                            },
                            dataView: {readOnly: false},
                            magicType: {type: ['line', 'bar']},
                            restore: {},
                            saveAsImage: {}
                        }
                    },
                    legend: {
                        data: ["超标次数", "正常次数"]
                    },
                    xAxis: {
                        data: data.categories
                    },
                    yAxis: {},
                    series: [
                        {name: "超标次数",
                            type: "bar",
                            data: data.series.positive,
                            itemStyle: {
                                borderRadius: 5,
                                color: {
                                    type: 'linear',
                                    x: 0, y: 0, x2: 0, y2: 1,
                                    colorStops: [{
                                        offset: 0, color: '#dc733c'
                                    }, {
                                        offset: 1, color: '#dc540f'
                                    }]
                                }
                            },
                        },
                        {name: "正常次数",
                            type: "bar",
                            data: data.series.negative,
                            itemStyle: {
                                borderRadius: 5,
                                color: {
                                    type: 'linear',
                                    x: 0, y: 0, x2: 0, y2: 1,
                                    colorStops: [{
                                        offset: 0, color: 'rgb(42,177,138)'
                                    }, {
                                        offset: 1, color: 'rgb(4,145,104)'
                                    }]
                                }
                            },
                        },
                    ],
                };
                exceeding_rate.setOption(option);
            })
            .catch(error => {
                console.error('加载数据失败:', error);
                exceeding_rate.setOption({
                    title: {text: '数据加载失败'},
                    xAxis: {},
                    yAxis: {},
                    series: []
                });
            });
        window.addEventListener('resize', function () {
            exceeding_rate.resize();
        });
    }
    renderWeekSummary() {
        const abnormal_trend = echarts.init(document.getElementById('abnormal_trend'));
        const ApiUrl = this.apiBase + 'week_summary/';
        fetch(ApiUrl)
            .then(response => response.json())
            .then(data => {
                const option = {
                    title: {
                        text: ''
                    },
                    tooltip: {
                        trigger: 'axis'
                    },
                    legend: {},
                    toolbox: {
                        show: true,
                        feature: {
                            dataZoom: {
                                yAxisIndex: 'none'
                            },
                            dataView: {readOnly: false},
                            magicType: {type: ['line', 'bar']},
                            restore: {},
                            saveAsImage: {}
                        }
                    },
                    xAxis: {
                        type: 'category',
                        boundaryGap: false,
                        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                    },
                    yAxis: {
                        type: 'value',
                        axisLabel: {
                            formatter: '{value}'
                        }
                    },
                    series: [
                        {
                            name: '超标次数',
                            type: 'line',
                            data: data.series[0].data,
                            itemStyle: {
                                color: '#dc733c'
                            },
                            lineStyle: {
                                color: '#dc540f',
                                width: 3
                            },
                            markPoint: {
                                symbol: 'pin', // 使用图钉形状
                                symbolSize: 35,
                                label: {
                                    color: '#fff',
                                    fontSize: 12,
                                },
                                itemStyle: {
                                    color: '#dc540f',
                                    borderColor: '#9e3907',
                                    borderWidth: 2
                                },
                                data: [
                                    {
                                        type: 'max',
                                        name: '最大值',
                                        symbolRotate: 0,
                                        label: {

                                        }
                                    },
                                    {
                                        type: 'min',
                                        name: '最小值',
                                        symbolRotate: 0,
                                        label: {
                                        }
                                    }
                                ]
                            },
                            markLine: {
                                symbol: ['none', 'none'],
                                lineStyle: {
                                    type: 'dashed',
                                    width: 2,
                                    color: '#dc540f',
                                    opacity: 0.7
                                },
                                label: {
                                    position: 'insideMiddleTop',
                                    formatter: '平均值: {c}',
                                    color: '#dc540f',
                                    fontSize: 12
                                },
                                data: [
                                    {
                                        type: 'average',
                                        name: '平均值'
                                    },
                                    {
                                        name: '最低点连线',
                                        type: 'min',
                                        lineStyle: {
                                            type: 'solid',
                                            width: 1
                                        },
                                        label: {
                                            show: true,
                                            position: 'end',
                                            formatter: '最低: {c}'
                                        }
                                    },
                                    {
                                        name: '最高点连线',
                                        type: 'max',
                                        lineStyle: {
                                            type: 'solid',
                                            width: 1
                                        },
                                        label: {
                                            show: true,
                                            position: 'end',
                                            formatter: '最高: {c}'
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            name: '正常次数',
                            type: 'line',
                            data: data.series[1].data,
                            itemStyle: {
                                color: 'rgb(42,177,138)'
                            },
                            lineStyle: {
                                color: 'rgb(4,145,104)',
                                width: 3
                            },
                            markPoint: {
                                symbol: 'pin',
                                symbolSize: 35,
                                label: {
                                    color: '#ffffff',
                                    fontSize: 12,
                                },
                                itemStyle: {
                                    color: 'rgb(4,145,104)',
                                    borderColor: '#03533c',
                                    borderWidth: 2
                                },
                                data: [
                                    {
                                        type: 'max',
                                        name: '最大值',
                                        label: {
                                        }
                                    },
                                    {
                                        type: 'min',
                                        name: '最小值',
                                        label: {
                                        }
                                    }
                                ]
                            },
                            markLine: {
                                symbol: ['none', 'none'],
                                lineStyle: {
                                    type: 'dashed',
                                    width: 2,
                                    color: 'rgb(4,145,104)',
                                    opacity: 0.7
                                },
                                label: {
                                    position: 'insideMiddleBottom',
                                    formatter: '平均值: {c}',
                                    color: 'rgb(4,145,104)',
                                    fontSize: 12
                                },
                                data: [
                                    {
                                        type: 'average',
                                        name: '平均值'
                                    },
                                    {
                                        name: '最低点连线',
                                        type: 'min',
                                        lineStyle: {
                                            type: 'solid',
                                            width: 1
                                        },
                                        label: {
                                            show: true,
                                            position: 'end',
                                            formatter: '最低: {c}'
                                        }
                                    },
                                    {
                                        name: '最高点连线',
                                        type: 'max',
                                        lineStyle: {
                                            type: 'solid',
                                            width: 1
                                        },
                                        label: {
                                            show: true,
                                            position: 'end',
                                            formatter: '最高: {c}'
                                        }
                                    }
                                ]
                            }
                        }
                    ]}
                abnormal_trend.setOption(option);
            });
        window.addEventListener('resize', function () {
            abnormal_trend.resize();
        });
    }
    getDashboardContext(){
        const ApiUrlCurrent = this.apiBase + 'get_all_count';
        const ApiUrlCurrentAnalysisTime= this.apiBase + 'get_recent_analysis_time/';
        const ApiUrlTodaySum= this.apiBase + 'get_analysis_today/';
        fetch(ApiUrlCurrent)
            .then(response => response.json())
            .then(data => {
                document.getElementById('all_count').innerHTML = `
                    <h2>${data.value}</h2>
                    `;
            })
            .catch(error => {
                document.getElementById('all_count').innerHTML = error;
            });

        fetch(ApiUrlCurrentAnalysisTime)
            .then(response => response.json())
            .then(data => {
                document.getElementById('recent_analysis_time').innerHTML = `
                    <h2>${data.message}</h2>
                    `;
            })
            .catch(error => {
                document.getElementById('recent_analysis_time').innerHTML = error;
            });

        fetch(ApiUrlTodaySum)
            .then(response => response.json())
            .then(data => {
                document.getElementById('analysis_today').innerText = data.value;
            })
            .catch(error => {
                document.getElementById('analysis_today').innerHTML = error;
            });
    }
    OnlineCount() {
        const ApiUrl =  this.apiBase + 'online_devices';
        fetch(ApiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应不正常');
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    document.getElementById('online_devices').textContent = data.count;
                    // 可选：添加动画效果
                    const metricValue = document.querySelector('.metric-value');
                    if(metricValue) {
                        metricValue.style.transform = 'scale(1.1)';
                        setTimeout(() => {
                            metricValue.style.transform = 'scale(1)';
                        }, 300);
                    }
                }
            })
            .catch(error => {
                console.error('获取在线设备数失败:', error);
                const metricValue = document.querySelector('.metric-value');
                if(metricValue) metricValue.textContent = '--';
            });
    }

    updateOnlineCount() {
        // 先执行一次
        this.OnlineCount();

        // 每30秒更新一次
        // 保存interval id以备后面恢复用
        this.pollInterval = setInterval(this.OnlineCount.bind(this), 30000);

        // 页面可见性API - 当页面不可见时暂停轮询
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                clearInterval(this.pollInterval);
                this.pollInterval = null;
            } else {
                this.OnlineCount(); // 立即更新一次
                this.pollInterval = setInterval(this.OnlineCount.bind(this), 30000);
            }
        });
    }

    getRecent3info() {
        const ApiUrl =  this.apiBase + 'recent_3info';
        fetch(ApiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应不正常');
                }
                return response.json();
            })
            .then(data => {
                function formatDate(str) {
                    const dt = new Date(str);
                    if (isNaN(dt)) return {day: '--', month: '--月'};
                    return {
                        day: dt.getDate() + '日',
                        month: (dt.getMonth() + 1) + '月',
                        hourMinute: dt.getHours().toString().padStart(2,'0') + ':' + dt.getMinutes().toString().padStart(2,'0')
                    };
                }

                const timeline = document.getElementById('activity_timeline');
                timeline.innerHTML = ''; // 清空原内容
                Object.values(data).forEach(item => {
                    const dateObj = formatDate(item.time);
                    const result_brief = item.result_brief;
                    let tagClass = '';
                    if(result_brief === 'positive'){
                        tagClass = 'positive';
                    } else if (result_brief === 'negative') {
                        tagClass = 'negative';
                    }
                    // 你可以自定义time显示格式
                    const timeRange = dateObj.hourMinute + ' - 检测完毕';
                    const html = `
                    <div class="activity-card">
                      <div class="activity-date">
                        <span class="month">${dateObj.month}</span>
                        <span class="day">${dateObj.day}</span>
                      </div>
                      <div class="activity-content">
                        <h3>${item.name}</h3>
                        <p class="activity-time">${timeRange}</p>
                        <p class="activity-description">检测结果：${item.result}</p>
                        <div class="activity-tag ${tagClass}">${result_brief}</div>
                      </div>
                    </div>
                  `;
                    timeline.insertAdjacentHTML('beforeend', html);
                });
            });
    }

}



const dashboard = new Dashboard({});
