class PesticideAnalysis {
    constructor(config) {
        this.apiBase = config.apiBase || 'http://124.222.225.80:8000/api/analysis/upload';
        this.uploadArea = document.getElementById('upload-area');
        this.spectrumFile = document.getElementById('spectrum-file');
        this.selectDataButton = document.getElementById('select-upload-btn');
        this.getUploadExampleButton = document.getElementById('get-upload-example');
        this.fileList = document.getElementById('file-list');
        this.filesUploadInfo = document.getElementById('files-upload-info');
        this.confirmUploadButton = document.getElementById('confirm-upload');
        this.clearUploadButton = document.getElementById('clear-upload');

        this.renderOriginButton = document.getElementById('render-origin');
        this.renderProcessedButton = document.getElementById('render-processed');
        this.echarts = window.echarts;
        this.chartContainer = document.getElementById('upload_data');
        this.currentAnaylsisId = null;
        this.selectedFiles = [];

        this.settingForm = document.getElementById('detection-form');
        this.startAnalysis = document.getElementById('start-analysis');
        this.resultSection = document.getElementById('results-section');

        this.init();
    }

    init() {
        this.getUploadExampleButton.addEventListener('click',(e)=>{
            e.preventDefault();
            e.stopPropagation();
            this.getUploadExample();
        })
        // 点击上传区域
        this.uploadArea.addEventListener('click', (e) => {
            if (e.target !== this.spectrumFile && e.target !== this.selectDataButton && e.target !== this.getUploadExampleButton) {
                this.spectrumFile.click();
            }
        });

        // 点击选择文件按钮
        this.selectDataButton.addEventListener('click', (e) => {
            console.log('test');
            e.preventDefault();
            e.stopPropagation();
            this.spectrumFile.click();
        });

        // 文件选择变化
        this.spectrumFile.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // 拖放功能
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // 清除上传
        this.clearUploadButton.addEventListener('click', () => {
            this.selectedFiles = [];
            this.updateFileList();
            this.spectrumFile.value = '';
        });

        // 确认上传
        this.confirmUploadButton.addEventListener('click', () => {
            if (this.selectedFiles.length > 0) {
                this.upload();
            }
        });

        //渲染原始数据
        this.renderOriginButton.addEventListener('click', () => {
            this.renderUploadResult();
            this.renderProcessedButton.classList.remove('active');
            this.renderOriginButton.classList.add('active');
        })

        //渲染预处理数据
        this.renderProcessedButton.addEventListener('click', () => {
            this.renderUploadResult('processed');
            this.renderProcessedButton.classList.add('active');
            this.renderOriginButton.classList.remove('active');
        })

        //分析设置
        this.settingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.uploadSetting(e);
        })

    }

    handleFiles(files) {
        if (files && files.length > 0) {
            const allowTypes = ['.xlsx'];
            const validFiles = Array.from(files).filter(file => {
                const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                return allowTypes.includes(extension);
            });

            if (validFiles.length > 0) {
                this.selectedFiles = [...this.selectedFiles, ...validFiles];
                this.updateFileList();
            } else {
                alert('请上传 .xlsx 格式的文件');
            }
        }
    }

    updateFileList() {
        this.fileList.innerHTML = '';

        if (this.selectedFiles.length === 0) {
            this.fileList.appendChild(this.filesUploadInfo.cloneNode(true));
            this.confirmUploadButton.disabled = true;
            this.clearUploadButton.disabled = true;
        } else {
            this.selectedFiles.forEach((file, index) => {
                const listItem = document.createElement('li');
                const fileInfo = document.createElement('div');
                fileInfo.className = 'file-info-item';

                const fileName = document.createElement("span");
                fileName.className = 'file-name';
                fileName.textContent = file.name;

                const fileSize = document.createElement('span');
                fileSize.className = 'file-size';
                fileSize.textContent = this.formatFileSize(file.size);

                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-file';
                removeBtn.textContent="删除"
                removeBtn.addEventListener('click', () => this.removeFile(index));

                fileInfo.appendChild(fileName);
                fileInfo.appendChild(fileSize);
                listItem.appendChild(fileInfo);
                fileInfo.appendChild(removeBtn);
                this.fileList.appendChild(listItem);
            });

            this.confirmUploadButton.disabled = false;
            this.clearUploadButton.disabled = false;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updateFileList();
    }
    async getUploadExample() {
        const formData = new FormData();
        formData.append('action', 'get_upload_example');
        fetch(this.apiBase, {  // 这里改成你实际的api地址
            method: 'POST',
            body: formData
        })
            .then(function(response) {
                if (!response.ok) {
                    return response.text().then(function(text) { throw new Error(text) });
                }
                // 获取文件名
                const disposition = response.headers.get('Content-Disposition');
                let filename = 'upload_example.xlsx';
                const match = disposition && disposition.match(/filename="(.+)"/);
                if (match && match.length === 2) {
                    filename = match[1];
                }
                return response.blob().then(function(blob) {
                    return { blob: blob, filename: filename };
                });
            })
            .then(function(obj) {
                const blob = obj.blob;
                const filename = obj.filename;

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(function(err) {
                alert('下载失败: ' + err.message);
            });
    }
    async upload() {
        if (this.selectedFiles.length === 0) {
            alert('请先选择文件');
            return;
        }

        try {
            for (const file of this.selectedFiles) {
                const formData = new FormData();
                formData.append('action', 'upload_spectrum');
                formData.append('file', file);

                const response = await fetch(this.apiBase, {
                    method: 'POST',
                    body: formData
                });

                this.uploadResult = await response.json();
                console.log(this.uploadResult.msg);

                if (!response.ok) {
                    throw new Error(this.uploadResult.msg || '上传失败');
                }
            }

            alert('所有文件上传成功！');
            this.selectedFiles = [];
            this.updateFileList();
            this.spectrumFile.value = '';
            this.currentAnaylsisId = this.uploadResult.id;
            this.uploadData = this.uploadResult.data;
            this.renderUploadResult();
        } catch (error) {
            alert(`上传出错: ${error.message}`);
        }
    }

    renderUploadResult(option) {
        const frequency = this.uploadData.frequency;
        const transmission = this.uploadData.transmission;
        const smoothed = this.uploadData.smoothed;
        const standardized = this.uploadData.standardized;
        const derivative = this.uploadData.derivative;

        document.getElementById('preview-section').classList.add('active');
        document.getElementById('detection-section').classList.add('active');
        const dataChart = this.echarts.init(this.chartContainer);
        dataChart.clear();
        dataChart.resize();

        const series = [];
        const legendData = [];

        series.push({
            name: '原始数据',
            type: 'line',
            itemStyle: { color: 'rgb(51, 140, 140)' },
            areaStyle: { color: 'rgba(54,147,81,0.3)' },
            lineStyle: { color: 'rgb(0, 111, 79)', width: 1 },
            emphasis: { focus: 'series', itemStyle: { color: 'rgb(0, 111, 79)' } },
            data: transmission,
        });
        legendData.push('原始数据');

        if (option === 'processed') {
            series.push({
                name: '平滑处理',
                type: 'line',
                itemStyle: { color: 'rgb(255, 127, 14)' },
                lineStyle: { color: 'rgb(255, 127, 14)', width: 2 },
                emphasis: { focus: 'series' },
                data: smoothed,
            });
            legendData.push('平滑处理');

            series.push({
                name: '标准化',
                type: 'line',
                itemStyle: { color: 'rgb(214, 39, 40)' },
                lineStyle: { color: 'rgb(214, 39, 40)', width: 2 },
                emphasis: { focus: 'series' },
                data: standardized,
            });
            legendData.push('标准化');

            series.push({
                name: '导数',
                type: 'line',
                itemStyle: { color: 'rgb(148, 103, 189)' },
                lineStyle: { color: 'rgb(148, 103, 189)', width: 2 },
                emphasis: { focus: 'series' },
                data: derivative,
            });
            legendData.push('导数');
        }

        dataChart.setOption({
            title: { text: '数据预览', left: 'center' },
            backgroundColor: '#fff',
            grid: { bottom: 80 },
            toolbox: {
                feature: {
                    dataZoom: { yAxisIndex: 'none' },
                    // restore: {},
                    saveAsImage: {}
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    animation: false,
                    label: { backgroundColor: '#fff' }
                }
            },
            legend: {
                data: legendData,
                left: 10
            },
            dataZoom: [
                {
                    show: true,
                    realtime: true,
                    start: 0,
                    end: 100,
                    backgroundColor: 'rgba(54,147,81,0.2)',
                    fillerColor: 'rgba(54,147,81,0.7)',
                    dataBackground: {
                        areaStyle: { color: 'rgba(54,147,81,1)' }
                    },
                    selectedDataBackground: '#379351',
                    moveHandleStyle: { color: '#379351' },
                    emphasis: { moveHandleStyle: { color: '#379351' } }
                },
                { type: 'inside', realtime: true }
            ],
            xAxis: [{
                name: '频率/THz',
                type: 'category',
                boundaryGap: false,
                data: frequency
            }],
            yAxis: [{ name: 'Transmission', type: 'value' }],
            series: series
        });

        window.addEventListener('resize', () => dataChart.resize());
    }
    async uploadSetting(event) {
        if (this.currentAnaylsisId === null) {
            alert('请先上传文件');
            return;
        }

        try {
            const form = event.target;
            const formData = new FormData(form);
            formData.append('action', 'upload_setting');
            formData.append('analysis-id', this.currentAnaylsisId);

            const response = await fetch(this.apiBase, {
                method: 'POST',
                body: formData
            });

            this.analysisResult = await response.json();
            this.renderAnalysisResult(this.analysisResult.data);
            if (!response.ok) {
                throw new Error(this.analysisResult.message || '上传失败');
            }

            alert('设置成功，开始分析！');

        } catch (error) {
            alert(`上传出错: ${error.message}`);
        }
    }
    renderAnalysisResult(analysisResult) {
        const result_brief = analysisResult.test_result;
        const prediction_step1 = analysisResult.classifier_prediction;
        const prediction_step1_confidence = analysisResult.classifier_confidence;
        const prediction_step2 = analysisResult.stacking_prediction;
        const mahalanobis_distance = analysisResult.mahalanobis_distance;
        const created_at = analysisResult.time;
        document.getElementById('results-section').classList.add('active');
        const details = document.getElementById('results-container');
        const details_info = document.createElement('div');
        details.innerHTML = `
                <div class="result-summary">
                    <div class="result-status">
                        <h3>检测完成</h3>
                    </div>
                    <div class="result-brief">
                        <p><strong>样品ID:</strong> <span>${this.currentAnaylsisId}</span></p>
                        <p><strong>检测时间:</strong> <span>${created_at}</span></p>
                        <p><strong>检测结果:</strong> <span id="result-display">${result_brief}</span></p>
                        <p><strong>可信度:</strong> <span>${prediction_step1_confidence}</span></p>
                    </div>
                    <div class="result-actions">
                        <button class="action-btn">下载报告</button>
                    </div>
                </div>
        `;
        const result_display = document.getElementById('result-display');
        if (!(prediction_step1.length === 1 && prediction_step1[0] === 'unknown')){
            result_display.classList.add('result-positive');
            details_info.classList.add('result-details');
            details_info.innerHTML = `
                    <div class="tabs">
                        <button class="tab-btn active" data-tab="tab-1">详细结果</button>
                        <button class="tab-btn" data-tab="tab-2">建议措施</button>
                    </div>
                    <div class="tab-content">
                        <div id="tab-1" class="tab-pane active">
                            <h4>检出农药信息</h4>
                            <table class="result-table">
                                <thead>
                                <tr>
                                    <th>农药名称</th>
                                    <th>检出含量</th>
                                    <th>最大残留限量</th>
                                    <th>是否超标</th>
                                    <th>可信度</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    <td>${prediction_step1}</td>
                                    <td>${prediction_step2} ug/kg</td>
                                    <td>50 ug/kg</td>
                                    <td class="exceed">${result_brief}</td>
                                    <td>${prediction_step1_confidence}%</td>
                                </tr>
                                </tbody>
                            </table>
                            <div class="analysis-text">
                                <h4>检测分析</h4>
                                <p>
                                     该样品中检测出农药残留，其中${prediction_step1}含量超过国家规定的最大残留限量标准。建议对样品进行进一步的实验室化学分析确认，并采取相应的处理措施。
                                </p>
                            </div>
                        </div>
                        <div id="tab-2" class="tab-pane">
                            <div class="recommendations">
                                <h4>建议措施</h4>
                                <ul>
                                    <li>进行化学分析法二次确认检测结果</li>
                                    <li>追溯样品来源，检查生产过程中农药使用情况</li>
                                    <li>对样品进行适当处理，减少农药残留含量</li>
                                    <li>加强农产品生产环节的农药使用管理</li>
                                </ul>
                                <h4>相关标准</h4>
                                <p>参考标准：GB 2763-2021《食品安全国家标准 食品中农药最大残留限量》</p>
                            </div>
                        </div>
                    </div>
        `;
            details.appendChild(details_info);
            document.querySelectorAll('.tab-btn').forEach((tabBtn) => {
                tabBtn.addEventListener('click', () => {
                    document.querySelectorAll('.tab-btn, .tab-pane').forEach((el) => {
                        el.classList.remove('active');
                    });
                    tabBtn.classList.add('active');
                    const tabId = tabBtn.getAttribute('data-tab');
                    document.getElementById(tabId).classList.add('active');
                })
            })
        } else {
            result_display.classList.add('result-negative');
        }
    }
}

const test = new PesticideAnalysis({
});

