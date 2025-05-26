class PesticideAnalysis {
    constructor(config) {
        this.apiBase = config.apiBase || 'http://124.222.225.80:8000/api/analysis/upload';
        this.uploadArea = document.getElementById('upload-area');
        this.spectrumFile = document.getElementById('spectrum-file');
        this.selectDataButton = document.getElementById('select-upload-btn');
        this.fileList = document.getElementById('file-list');
        this.filesUploadInfo = document.getElementById('files-upload-info');
        this.confirmUploadButton = document.getElementById('confirm-upload');
        this.clearUploadButton = document.getElementById('clear-upload');
        this.currentAnaylsisId = null;
        this.selectedFiles = [];
        this.init();
    }

    init() {
        console.log(this.uploadArea);
        // 点击上传区域
        this.uploadArea.addEventListener('click', (e) => {
            if (e.target !== this.spectrumFile && e.target !== this.selectDataButton) {
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

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || '上传失败');
                }
            }

            alert('所有文件上传成功！');
            this.selectedFiles = [];
            this.updateFileList();
            this.spectrumFile.value = '';
        } catch (error) {
            alert(`上传出错: ${error.message}`);
        }
    }
}

const test = new PesticideAnalysis({
});
// test.init();