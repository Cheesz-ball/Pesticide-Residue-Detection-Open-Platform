const searchButton = document.getElementById('search-button');
const searchInput = document.getElementById('pesticide-search');
const resultSection = document.getElementById('results-container');
let currentPesticideId = null;

searchButton.addEventListener('click', async () => {
    const searchValue = searchInput.value.trim();

    // 验证输入
    if (!searchValue) {
        alert('请输入农药名称');
        return;
    }

    try {
        // 构造API URL
        const apiUrl = new URL('http://124.222.225.80:8000/api/spectral_data/spectral');
        apiUrl.searchParams.append('action', 'search_pesticide');
        apiUrl.searchParams.append('query', searchValue);

        // 发起请求
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }

        const data = await response.json();
        console.log('API响应数据:', data);

        // 验证数据格式
        if (!data?.data?.[0]?.fields) {
            throw new Error('无效的数据格式');
        }
        currentPesticideId = data.data[0].pk;
        const pesticide = data.data[0].fields;

        resultSection.innerHTML = `
                    <h2>${pesticide.pesticide_name_cn || '未知农药'}</h2>
                    <div class="results-items">
                        <p><strong>英文名:</strong> ${pesticide.pesticide_name_en || '无'}</p>
                        <p><strong>CAS号:</strong> ${pesticide.pesticide_cas || '无'}</p>
                    </div>
                    <div class="results-items">
                        <p><strong>分子式:</strong> ${pesticide.pesticide_molecular_formula || '无'}</p>
                        ${pesticide.pesticide_remark ? `<p><strong>备注:</strong> ${pesticide.pesticide_remark}</p>` : ''}
                    </div>
                    <div class="chart-container" id="spectrum_data"></div>
                    <div class="results-items">
                        <button id="modify-sp">修改</button>
                        <button id="delete-sp">删除</button>
                    </div>
            `;
        document.getElementById('modify-sp').addEventListener('click', function() {
            editSpectrumForm(pesticide)
        });


        const spectrum_data = echarts.init(document.getElementById('spectrum_data'));

        spectrum_data.setOption({
            title: {
                text: 'THz吸收谱',
                left: 'center'
            },
            backgroundColor: '#ffffff',
            grid: {
                bottom: 80
            },
            toolbox: {
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none'
                    },
                    restore: {},
                    saveAsImage: {}
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    animation: false,
                    label: {
                        backgroundColor: '#ffffff'
                    }
                }
            },
            legend: {
                data: ['生物传感器检测光谱'],
                left: 10
            },
            dataZoom: [
                {
                    show: true,
                    realtime: true,
                    start: 0,
                    end: 100,
                    backgroundColor: 'rgba(54,147,81,0.2)', fillerColor: 'rgba(54,147,81,0.7)',
                    dataBackground: {areaStyle: {color: 'rgba(54,147,81,1)'}},
                    selectedDataBackground: '#379351',
                    moveHandleStyle: {color: '#379351'},
                    emphasis: {moveHandleStyle: {color: '#379351'}}
                },
                {
                    type: 'inside',
                    realtime: true,

                }
            ],
            xAxis: [
                {
                    name: '频率/THz',
                    type: 'category',
                    boundaryGap: false,
                    axisLine: {onZero: false},
                    // prettier-ignore
                    data: Object.values(JSON.parse(pesticide.pesticide_frequency)),
                }
            ],
            yAxis: [
                {
                    name: 'Absorption',
                    type: 'value'
                },
            ],
            series: [
                {
                    name: '吸收系数',
                    type: 'line',
                    itemStyle: {
                        color: 'rgb(51, 140, 140)'

                    },
                    areaStyle: {
                        color: 'rgb(54,147,81)'
                    },
                    lineStyle: {
                        color: 'rgb(0, 111, 79)',
                        width: 1
                    },
                    emphasis: {
                        focus: 'series',
                        itemStyle: {
                            color: 'rgb(0, 111, 79)'
                        }
                    },
                    // prettier-ignore
                    data: Object.values(JSON.parse(pesticide.pesticide_absorption)),
                },

            ]
        });
        window.addEventListener('resize', function () {
            spectrum_data.resize();
        });
    } catch (error) {
        console.error('搜索过程中出错:', error);
        const resultSection = document.getElementById('results-container');
        resultSection.innerHTML = `
                <div class="error-message">
                    <p>搜索失败: ${error.message}</p>
                    <p>请检查输入内容后重试</p>
                </div>
            `;
    }
});

function editSpectrumForm(pesticide) {
    resultSection.innerHTML = `
   <h2>${pesticide.pesticide_name_cn || '未知农药'}</h2> 
    <form id="edit-spectrum-form">
        <div class="results-items">
            <p><strong>英文名:</strong><input name="pesticide_name_en" value="${pesticide.pesticide_name_en || '无'}" type="text"> </p>
            <p><strong>CAS号:</strong><input name="pesticide_cas" value="${pesticide.pesticide_cas || '无'}" type="text"></p>
        </div>
            <div class="results-items">
            <p><strong>分子式:</strong><input name="pesticide_molecular_formula" value="${pesticide.pesticide_molecular_formula || '无'}" type="text"></p>
            <p><strong>备注:</strong><input name="pesticide_remark" value="${pesticide.pesticide_remark}" type="text"></p>
        </div>
        <div class="add-pesticide-form" id="pesticide-modify-upload">
            <label for="pesticide_thz_spectrum">THz光谱文件：</label>
            <input accept=".xlsx" id="pesticide_thz_spectrum" name="pesticide_thz_spectrum" type="file">
        </div>
        <div class="results-items">
            <button id="modify-sp" type="submit">提交修改</button>
            <button type="reset">重置</button> 
            <button id="delete-sp">删除</button>
        </div> 
    </form>
   `
    document.getElementById('edit-spectrum-form').addEventListener('submit', function (e) {
        e.preventDefault();
        submitModifyForm(e);
    })
}

async function submitModifyForm(event) {
    console.log('test')

    const form = event.target; // 获取表单元素
    const modifyData = new FormData(form);
    modifyData.append('action', 'modify_pesticide');
    modifyData.append('id',currentPesticideId);
    console.log(currentPesticideId)
    const spectrumFile = form.elements['pesticide_thz_spectrum'].files[0];
    if (spectrumFile) {
        modifyData.append('pesticide_thz_spectrum', spectrumFile);
    }
    const apiUrl = new URL('http://124.222.225.80:8000/api/spectral_data/spectral');
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: modifyData
        });

        const result = await response.json();
        if (response.ok) {
            alert(`上传成功！记录ID: ${result.id}`);
        } else {
            alert(`上传失败: ${result.ret || '未知错误'}`);
        }
    } catch (error) {
        alert(`网络错误: ${error.message}`);
    }
}


document.getElementById('pesticideForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('action', 'add_pesticide');
    formData.append('pesticide_name_cn', e.target.pesticide_name_cn.value);
    formData.append('pesticide_name_en', e.target.pesticide_name_en.value);
    formData.append('pesticide_cas', e.target.pesticide_cas.value);
    formData.append('pesticide_molecular_formula', e.target.pesticide_molecular_formula.value);
    formData.append('pesticide_remark', e.target.pesticide_remark.value);

    // 添加光谱文件（如果有）
    const spectrumFile = e.target.pesticide_thz_spectrum.files[0];
    if (spectrumFile) {
        formData.append('pesticide_thz_spectrum', spectrumFile);
    }
    const apiUrl = new URL('http://124.222.225.80:8000/api/spectral_data/spectral');
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (response.ok) {
            alert(`上传成功！记录ID: ${result.id}`);
        } else {
            alert(`上传失败: ${result.ret || '未知错误'}`);
        }
    } catch (error) {
        alert(`网络错误: ${error.message}`);
    }
});