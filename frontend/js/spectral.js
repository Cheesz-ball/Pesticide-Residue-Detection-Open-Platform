class PesticideManager {
    constructor(config) {
        // 配置
        this.apiBase = config.apiBase || 'http://124.222.225.80:8000/api/spectral_data/spectral';
        this.searchButton = document.getElementById(config.searchButtonId || 'search-button');
        this.searchInput = document.getElementById(config.searchInputId || 'pesticide-search');
        this.resultTab = document.getElementById(config.searchInputId || 'results-tab');
        this.resultSection = document.getElementById(config.resultContainerId || 'results-container');
        this.currentPesticideId = null;
        this.echarts = window.echarts; // 假设echarts已全局加载
        this.init();
    }

    init() {
        // 绑定事件
        this.searchButton.addEventListener('click', this.handleSearch.bind(this));
        document.getElementById('pesticideForm')
            .addEventListener('submit', this.handleAddPesticide.bind(this));
    }

    async handleSearch() {
        const query = this.searchInput.value.trim();
        if (!query) {
            alert('请输入农药名称');
            return;
        }
        try {
            const url = new URL(this.apiBase);
            url.searchParams.append('action', 'search_pesticide');
            url.searchParams.append('query', query);

            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) throw new Error(`HTTP错误! 状态码: ${response.status}`);

            const data = await response.json();
            if (!data?.data?.[0]?.fields) throw new Error('不存在该数据');

            this.currentPesticideId = data.data[0].pk;
            this.showPesticideDetail(data.data[0].fields);

        } catch (error) {
            this.showError(error.message);
        }
    }

    showPesticideDetail(p) {
        // 构建详情视图
        this.resultSection.innerHTML = `
            <h2>${p.pesticide_name_cn || '未知农药'}</h2>
            <div class="results-items">
              <div class="results-subitems">
                <label>英文名:</label><label>CAS号:</label>
              </div>
              <div class="results-subitems">
                <p>${p.pesticide_name_en || '无'}</p>
                <p>${p.pesticide_cas || '无'}</p>
              </div>
              <div class="results-subitems">
                <label>分子式:</label><label>备注:</label>
              </div>
              <div class="results-subitems">
                <p>${p.pesticide_molecular_formula || '无'}</p>
                ${p.pesticide_remark ? `<p>${p.pesticide_remark}</p>` : ''}
              </div>
            </div>
            <div class="chart-container" id="spectrum_data"></div>
            <div class="results-subitems">
              <button id="modify-sp">修改/重新上传数据</button>
            </div>
        `;
        document.getElementById('modify-sp').addEventListener('click', () => this.editForm(p));
        this.renderChart(p);
    }

    renderChart(p) {
        // 渲染ECharts
        const frequency = Object.values(JSON.parse(p.pesticide_frequency || '{}'));
        const absorption = Object.values(JSON.parse(p.pesticide_absorption || '{}'));

        const spectrumChart = this.echarts.init(document.getElementById('spectrum_data'));
        spectrumChart.setOption({
            title: { text: 'THz吸收谱', left: 'center' },
            backgroundColor: '#fff',
            grid: { bottom: 80 },
            toolbox: { feature: { dataZoom: { yAxisIndex: 'none' }, restore: {}, saveAsImage: {} } },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross', animation: false, label: { backgroundColor: '#fff' } }
            },
            legend: { data: ['生物传感器检测光谱'], left: 10 },
            dataZoom: [
                { show: true, realtime: true, start: 0, end: 100, backgroundColor: 'rgba(54,147,81,0.2)',
                    fillerColor: 'rgba(54,147,81,0.7)', dataBackground: { areaStyle: { color: 'rgba(54,147,81,1)' } },
                    selectedDataBackground: '#379351', moveHandleStyle: { color: '#379351' },
                    emphasis: { moveHandleStyle: { color: '#379351' } }
                },
                { type: 'inside', realtime: true }
            ],
            xAxis: [{ name: '频率/THz', type: 'category', boundaryGap: false, data: frequency }],
            yAxis: [{ name: 'Absorption', type: 'value' }],
            series: [{
                name: '吸收系数',
                type: 'line',
                itemStyle: { color: 'rgb(51, 140, 140)' },
                areaStyle: { color: 'rgb(54,147,81)' },
                lineStyle: { color: 'rgb(0, 111, 79)', width: 1 },
                emphasis: { focus: 'series', itemStyle: { color: 'rgb(0, 111, 79)' } },
                data: absorption
            }]
        });
        window.addEventListener('resize', () => spectrumChart.resize());
    }

    editForm(p) {
        this.resultSection.innerHTML = `
            <h2>${p.pesticide_name_cn || '未知农药'}</h2>
            <form id="edit-spectrum-form">
                <div class="results-items">
                    <div class="results-subitems">
                        <label>英文名:</label>
                        <label>CAS号:</label>
                    </div>
                    <div class="results-subitems">
                        <p><input name="pesticide_name_en" value="${p.pesticide_name_en || ''}" type="text" /></p>
                        <p><input name="pesticide_cas" value="${p.pesticide_cas || ''}" type="text" /></p>
                    </div>
                    <div class="results-subitems">
                        <label>分子式:</label>
                        <label>备注:</label>
                    </div>
                    <div class="results-subitems">
                        <p><input name="pesticide_molecular_formula" value="${p.pesticide_molecular_formula || ''}" type="text" /></p>
                        <p><input name="pesticide_remark" value="${p.pesticide_remark || ''}" type="text" /></p>
                    </div>
                </div>
                <div class="add-pesticide-form" id="pesticide-modify-upload">
                    <label for="pesticide_thz_spectrum">THz光谱文件：</label>
                    <input accept=".xlsx" id="pesticide_thz_spectrum" name="pesticide_thz_spectrum" type="file">
                </div>
                <div class="results-subitems" id="modify-button-container">
                    <button id="modify-sp" type="submit">提交修改</button>
                    <button type="reset">重置</button>
                    <button id="delete-sp" type="button">删除</button>
                </div>
            </form>
        `;
        document.getElementById('edit-spectrum-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitModifyForm(e, p);
        });
        document.getElementById('delete-sp').addEventListener('click', (e) => {
            e.preventDefault();
            this.deleteSpectrum();
        });
    }

    async submitModifyForm(event, pesticide) {
        const form = event.target;
        const modifyData = new FormData(form);
        modifyData.append('action', 'modify_pesticide');
        modifyData.append('id', this.currentPesticideId);
        const spectrumFile = form.elements['pesticide_thz_spectrum'].files[0];
        if (spectrumFile) modifyData.append('pesticide_thz_spectrum', spectrumFile);

        try {
            const response = await fetch(this.apiBase, { method: 'POST', body: modifyData });
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

    async deleteSpectrum() {
        if (!window.confirm('确定要删除该条记录吗？')) return;
        const deleteData = new FormData();
        deleteData.append('action', 'delete_pesticide');
        deleteData.append('id', this.currentPesticideId);

        try {
            const response = await fetch(this.apiBase, { method: 'POST', body: deleteData });
            const result = await response.json();
            if (response.ok) {
                alert(`删除成功！记录ID: ${result.id}`);
                this.resultSection.innerHTML = '';
                this.currentPesticideId = null;
            } else {
                alert(`删除失败: ${result.ret || '未知错误'}`);
            }
        } catch (error) {
            alert(`网络错误: ${error.message}`);
        }
    }

    async handleAddPesticide(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData();
        formData.append('action', 'add_pesticide');
        formData.append('pesticide_name_cn', form.pesticide_name_cn.value);
        formData.append('pesticide_name_en', form.pesticide_name_en.value);
        formData.append('pesticide_cas', form.pesticide_cas.value);
        formData.append('pesticide_molecular_formula', form.pesticide_molecular_formula.value);
        formData.append('pesticide_remark', form.pesticide_remark.value);

        const spectrumFile = form.pesticide_thz_spectrum.files[0];
        if (spectrumFile) formData.append('pesticide_thz_spectrum', spectrumFile);

        try {
            const response = await fetch(this.apiBase, { method: 'POST', body: formData });
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

    showError(msg) {
        this.resultSection.innerHTML = `
            <div class="error-message">
                <p>搜索失败: ${msg}</p>
                <p>请检查输入内容后重试</p>
            </div>
        `;
    }
}

// 示例使用
const manager = new PesticideManager({
    apiBase: 'http://124.222.225.80:8000/api/spectral_data/spectral',
    searchButtonId: 'search-button',
    searchInputId: 'pesticide-search',
    resultTab: 'results-tab',
    resultContainerId: 'results-container'
});