function safeAddListener(elem, evt, handler) {
    if (elem) {
        elem.addEventListener(evt, handler);
    }
}
/* =====================================================
   WaterMark Pro - JavaScript v2.1 (Corrigido)
   ===================================================== */

// ==================== State Management ====================
const state = {
    images: [],
    logo: null,
    textWatermarks: [],
    processedImages: [],
    selectedImageIndex: 0,
    presets: [],
    isComparing: false,
    settings: {
        useLogo: true,
        useText: false,
        useTimestamp: false,
        logoPosition: 'bottom-right',
        logoScale: 30,
        logoOpacity: 50,
        logoMargin: 20,
        logoRotation: 0,
        logoSpacing: 50,
        logoPosX: 50,
        logoPosY: 50,
        textRepeatDiagonal: false,
        timestampFormat: 'dd/mm/yyyy hh:ii',
        timestampColor: '#ffffff',
        timestampSize: 16,
        timestampPosition: 'bottom-left',
        timestampOpacity: 80,
        outputFormat: 'jpg',
        outputQuality: 90,
        resizeEnabled: false,
        maxWidth: 1920,
        maxHeight: 1080,
        maintainAspect: true,
        filePrefix: '',
        fileSuffix: '_wm'
    }
};

// Text watermark counter
let textCounter = 0;

// Logo image cache
let logoImageCache = null;

// ==================== DOM Elements ====================
// ==================== Dynamic Safe Elements Proxy ====================
const elements = new Proxy({}, {
    get(target, prop) {
        if (typeof prop === 'symbol' || prop === 'then') return undefined;
        let found = document.getElementById(prop);
        if (!found && prop === 'previewContainer') found = document.getElementById('livePreviewContainer');
        if (!found && prop === 'livePreviewContainer') found = document.getElementById('previewContainer');
        if (!found && prop === 'previewCanvas') found = document.getElementById('livePreviewCanvas');
        if (!found && prop === 'livePreviewCanvas') found = document.getElementById('previewCanvas');
        if (!found && prop === 'presetModal') found = document.getElementById('presetsModal');
        if (!found && prop === 'presetsModal') found = document.getElementById('presetModal');
        if (!found && prop === 'savePresetModal') found = document.getElementById('presetsModal');
        return found || null;
    }
});

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎨 WaterMark Pro v2.1 inicializando...');
    initEventListeners();
    addDefaultTextWatermark();
    loadTheme();
    loadPresets();
    console.log('✅ WaterMark Pro pronto!');
});

function initEventListeners() {
    // Theme toggle
    safeAddListener(elements.themeToggle, 'click', toggleTheme);
    
    // Image upload
    safeAddListener(elements.imageUploadZone, 'click', () => elements.imageInput.click());
    safeAddListener(elements.imageInput, 'change', handleImageUpload);
    safeAddListener(elements.imageUploadZone, 'dragover', handleDragOver);
    safeAddListener(elements.imageUploadZone, 'dragleave', handleDragLeave);
    safeAddListener(elements.imageUploadZone, 'drop', handleDrop);
    
    // Logo upload
    safeAddListener(elements.logoUploadZone, 'click', () => elements.logoInput.click());
    safeAddListener(elements.logoInput, 'change', handleLogoUpload);
    safeAddListener(elements.removeLogo, 'click', removeLogo);
    
    // Watermark type toggles
    safeAddListener(elements.useLogo, 'change', updateWatermarkTypeVisibility);
    safeAddListener(elements.useText, 'change', updateWatermarkTypeVisibility);
    safeAddListener(elements.useTimestamp, 'change', updateWatermarkTypeVisibility);
    
    // Logo settings
    safeAddListener(elements.logoPosition, 'change', handleLogoPositionChange);
    safeAddListener(elements.logoScale, 'input', updateSliderValue);
    safeAddListener(elements.logoOpacity, 'input', updateSliderValue);
    safeAddListener(elements.logoMargin, 'input', updateSliderValue);
    safeAddListener(elements.logoRotation, 'input', updateSliderValue);
    safeAddListener(elements.logoSpacing, 'input', updateSliderValue);
    safeAddListener(elements.logoPosX, 'input', updateSliderValue);
    safeAddListener(elements.logoPosY, 'input', updateSliderValue);
    
    // Text settings
    safeAddListener(elements.addTextBtn, 'click', addTextWatermark);
    safeAddListener(elements.textRepeatDiagonal, 'change', updateSettings);
    
    // Timestamp settings
    safeAddListener(elements.timestampOpacity, 'input', updateSliderValue);
    safeAddListener(elements.timestampFormat, 'change', updateSettings);
    safeAddListener(elements.timestampPosition, 'change', updateSettings);
    
    // Output settings
    safeAddListener(elements.outputQuality, 'input', updateSliderValue);
    safeAddListener(elements.outputFormat, 'change', updateSettings);
    safeAddListener(elements.resizeEnabled, 'change', toggleResizeOptions);
    
    // Action buttons - CORRIGIDOS
    safeAddListener(elements.previewWatermark, 'click', () => {
        console.log('🔍 Botão Preview clicado');
        showLivePreview();
    });
    
    safeAddListener(elements.applyWatermark, 'click', () => {
        console.log('⚡ Botão Aplicar clicado');
        processWatermarks();
    });
    
    safeAddListener(elements.downloadAll, 'click', downloadAllImages);
    
    safeAddListener(elements.clearAll, 'click', clearAllImages);
    
    safeAddListener(elements.closeLivePreview, 'click', closeLivePreview);
    
    safeAddListener(elements.toggleCompare, 'click', () => {
        console.log('⚖️ Botão Comparar clicado');
        toggleComparison();
    });
    
    // Modal
    safeAddListener(elements.modalClose, 'click', closeModal);
    safeAddListener(elements.imageModal, 'click', (e) => {
        if (e.target === elements.imageModal) closeModal();
    });
    safeAddListener(elements.modalCompare, 'click', showComparisonFromModal);
    
    // Preset modals
    safeAddListener(document.getElementById('loadPreset'), 'click', openPresetModal);
    safeAddListener(document.getElementById('savePreset'), 'click', openSavePresetModal);
    safeAddListener(document.getElementById('closePresetsModal'), 'click', closePresetModal);
    
    // Comparison slider
    initComparisonSlider();
}

// ==================== Theme ====================
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
    
    const isDark = document.body.classList.contains('dark-theme');
    if (elements.themeToggle) elements.themeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    
    localStorage.setItem('watermark_theme', isDark ? 'dark' : 'light');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('watermark_theme') || 'dark';
    document.body.classList.remove('dark-theme', 'light-theme');
    document.body.classList.add(savedTheme + '-theme');
    if (elements.themeToggle) elements.themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

// ==================== Image Upload ====================
function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    processImageFiles(files);
}

function handleDragOver(e) {
    e.preventDefault();
    if (elements.imageUploadZone) elements.imageUploadZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    if (elements.imageUploadZone) elements.imageUploadZone.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    if (elements.imageUploadZone) elements.imageUploadZone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    processImageFiles(files);
}

function processImageFiles(files) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    let addedCount = 0;
    
    files.forEach(file => {
        // Validate type
        if (!validTypes.includes(file.type)) {
            showToast(`${file.name}: Formato não suportado`, 'error');
            return;
        }
        
        // Validate size
        if (file.size > maxSize) {
            showToast(`${file.name}: Arquivo muito grande (máx. 10MB)`, 'error');
            return;
        }
        
        // Read and add image
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const imageData = {
                    id: Date.now() + Math.random(),
                    file: file,
                    name: file.name,
                    size: file.size,
                    width: img.width,
                    height: img.height,
                    dataUrl: e.target.result,
                    processed: false,
                    processedUrl: null
                };
                
                state.images.push(imageData);
                addedCount++;
                updatePreviewGrid();
                updateUploadedCount();
                updateActionButtons();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
    
    if (addedCount > 0) {
        setTimeout(() => {
            showToast(`${addedCount} imagem(ns) carregada(s)`, 'success');
        }, 300);
    }
    
    // Reset input
    if (elements.imageInput) elements.imageInput.value = '';
}

function updateUploadedCount() {
    const count = state.images.length;
    if (count > 0) {
        if (elements.uploadedCount) elements.uploadedCount.textContent = `${count} imagem(ns) carregada(s)`;
    } else {
        if (elements.uploadedCount) elements.uploadedCount.textContent = '';
    }
}

// ==================== Logo Upload ====================
function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showToast('Formato de logo não suportado', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            state.logo = {
                file: file,
                dataUrl: e.target.result,
                width: img.width,
                height: img.height
            };
            
            // Cache the logo image for canvas use
            logoImageCache = img;
            
            if (elements.logoPreview) elements.logoPreview.src = e.target.result;
            if (elements.logoPreviewContainer) elements.logoPreviewContainer.style.display = 'block';
            if (elements.logoUploadZone) elements.logoUploadZone.style.display = 'none';
            
            showToast('Logo carregado com sucesso', 'success');
            updateActionButtons();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function removeLogo() {
    state.logo = null;
    logoImageCache = null;
    if (elements.logoPreviewContainer) elements.logoPreviewContainer.style.display = 'none';
    if (elements.logoUploadZone) elements.logoUploadZone.style.display = 'block';
    if (elements.logoInput) elements.logoInput.value = '';
    updateActionButtons();
}

// ==================== Watermark Type Visibility ====================
function updateWatermarkTypeVisibility() {
    state.settings.useLogo = elements.useLogo ? elements.useLogo.checked : true;
    state.settings.useText = elements.useText ? elements.useText.checked : false;
    state.settings.useTimestamp = elements.useTimestamp ? elements.useTimestamp.checked : false;
    
    if (elements.logoSettings) elements.logoSettings.style.display = state.settings.useLogo ? 'block' : 'none';
    if (elements.textSettings) elements.textSettings.style.display = state.settings.useText ? 'block' : 'none';
    if (elements.timestampSettings) elements.timestampSettings.style.display = state.settings.useTimestamp ? 'block' : 'none';
    
    updateActionButtons();
}

// ==================== Logo Position ====================
function handleLogoPositionChange() {
    const position = elements.logoPosition ? elements.logoPosition.value : 'bottom-right';
    if (elements.logoCustomPosition) elements.logoCustomPosition.style.display = position === 'custom' ? 'block' : 'none';
    updateSettings();
}

// ==================== Resize Options ====================
function toggleResizeOptions() {
    state.settings.resizeEnabled = elements.resizeEnabled ? elements.resizeEnabled.checked : false;
    if (elements.resizeOptions) elements.resizeOptions.style.display = state.settings.resizeEnabled ? 'block' : 'none';
}

// ==================== Slider Updates ====================
function updateSliderValue(e) {
    const slider = e.target;
    const valueSpan = document.getElementById(slider.id + 'Value');
    if (valueSpan) {
        valueSpan.textContent = slider.value;
    }
    updateSettings();
}

function updateSettings() {
    state.settings.logoPosition = elements.logoPosition ? elements.logoPosition.value : 'bottom-right';
    state.settings.logoScale = elements.logoScale ? parseInt(elements.logoScale.value) : 30;
    state.settings.logoOpacity = elements.logoOpacity ? parseInt(elements.logoOpacity.value) : 50;
    state.settings.logoMargin = elements.logoMargin ? parseInt(elements.logoMargin.value) : 20;
    state.settings.logoRotation = elements.logoRotation ? parseInt(elements.logoRotation.value) : 0;
    state.settings.logoSpacing = elements.logoSpacing ? parseInt(elements.logoSpacing.value) : 50;
    state.settings.logoPosX = elements.logoPosX ? parseInt(elements.logoPosX.value) : 50;
    state.settings.logoPosY = elements.logoPosY ? parseInt(elements.logoPosY.value) : 50;
    state.settings.textRepeatDiagonal = elements.textRepeatDiagonal ? elements.textRepeatDiagonal.checked : false;
    state.settings.timestampFormat = elements.timestampFormat ? elements.timestampFormat.value : 'dd/mm/yyyy hh:ii';
    state.settings.timestampColor = elements.timestampColor ? elements.timestampColor.value : '#ffffff';
    state.settings.timestampSize = elements.timestampSize ? parseInt(elements.timestampSize.value) : 16;
    state.settings.timestampPosition = elements.timestampPosition ? elements.timestampPosition.value : 'bottom-left';
    state.settings.timestampOpacity = elements.timestampOpacity ? parseInt(elements.timestampOpacity.value) : 80;
    state.settings.outputFormat = elements.outputFormat ? elements.outputFormat.value : 'jpg';
    state.settings.outputQuality = elements.outputQuality ? parseInt(elements.outputQuality.value) : 90;
    state.settings.maxWidth = (elements.maxWidth ? parseInt(elements.maxWidth.value) : 1920);
    state.settings.maxHeight = (elements.maxHeight ? parseInt(elements.maxHeight.value) : 1080);
    state.settings.maintainAspect = (elements.maintainAspect ? elements.maintainAspect.checked : true);
    state.settings.filePrefix = (elements.filePrefix ? elements.filePrefix.value : '');
    state.settings.fileSuffix = (elements.fileSuffix ? elements.fileSuffix.value : '_wm');
}

// ==================== Text Watermarks ====================
function addDefaultTextWatermark() {
    addTextWatermark();
}

function addTextWatermark() {
    textCounter++;
    const id = 'text_' + textCounter;
    
    const textEntry = document.createElement('div');
    textEntry.className = 'text-entry';
    textEntry.id = id;
    textEntry.innerHTML = `
        <div class="text-entry-header">
            <span>Texto #${textCounter}</span>
            <button class="btn-remove" onclick="removeTextWatermark('${id}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="form-group full-width">
            <label>Texto</label>
            <input type="text" class="text-content" placeholder="Digite o texto da marca d'água" value="© Seu Nome">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Fonte</label>
                <select class="text-font">
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Impact">Impact</option>
                </select>
            </div>
            <div class="form-group">
                <label>Tamanho</label>
                <input type="number" class="text-size" value="24" min="8" max="200">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Cor</label>
                <input type="color" class="text-color" value="#ffffff">
            </div>
            <div class="form-group">
                <label>Opacidade (%)</label>
                <input type="number" class="text-opacity" value="50" min="5" max="100">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Posição</label>
                <select class="text-position">
                    <option value="top-left">Superior Esquerdo</option>
                    <option value="top-right">Superior Direito</option>
                    <option value="bottom-left">Inferior Esquerdo</option>
                    <option value="bottom-right" selected>Inferior Direito</option>
                    <option value="center">Centro</option>
                </select>
            </div>
            <div class="form-group">
                <label>Rotação (°)</label>
                <input type="number" class="text-rotation" value="0" min="-180" max="180">
            </div>
        </div>
        <div class="text-effects">
            <button class="effect-btn" data-effect="shadow" onclick="toggleTextEffect(this, '${id}')">
                <i class="fas fa-clone"></i> Sombra
            </button>
            <button class="effect-btn" data-effect="outline" onclick="toggleTextEffect(this, '${id}')">
                <i class="fas fa-square"></i> Contorno
            </button>
            <button class="effect-btn" data-effect="bold" onclick="toggleTextEffect(this, '${id}')">
                <i class="fas fa-bold"></i> Negrito
            </button>
        </div>
        <input type="hidden" class="text-effects-data" value="{}">
    `;
    
    if (elements.textWatermarks) elements.textWatermarks.appendChild(textEntry);
}

function toggleTextEffect(btn, id) {
    btn.classList.toggle('active');
    const entry = document.getElementById(id);
    const effectsInput = entry.querySelector('.text-effects-data');
    let effects = JSON.parse(effectsInput.value || '{}');
    const effect = btn.dataset.effect;
    effects[effect] = btn.classList.contains('active');
    effectsInput.value = JSON.stringify(effects);
}

window.toggleTextEffect = toggleTextEffect;

function removeTextWatermark(id) {
    const entry = document.getElementById(id);
    if (entry) {
        entry.remove();
    }
    
    // Ensure at least one text entry exists
    if (elements.textWatermarks.children.length === 0) {
        addTextWatermark();
    }
}

window.removeTextWatermark = removeTextWatermark;

function getTextWatermarksData() {
    const textEntries = elements.textWatermarks.querySelectorAll('.text-entry');
    const data = [];
    
    textEntries.forEach(entry => {
        const effectsData = JSON.parse(entry.querySelector('.text-effects-data').value || '{}');
        data.push({
            content: entry.querySelector('.text-content').value,
            font: entry.querySelector('.text-font').value,
            size: parseInt(entry.querySelector('.text-size').value),
            color: entry.querySelector('.text-color').value,
            opacity: parseInt(entry.querySelector('.text-opacity').value),
            position: entry.querySelector('.text-position').value,
            rotation: parseInt(entry.querySelector('.text-rotation').value),
            shadow: effectsData.shadow || false,
            outline: effectsData.outline || false,
            bold: effectsData.bold || false
        });
    });
    
    return data;
}

// ==================== Preview Grid ====================
function updatePreviewGrid() {
    if (state.images.length === 0) {
        if (elements.previewGrid) elements.previewGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-images"></i>
                <p>Nenhuma imagem carregada</p>
                <span>Faça upload de imagens para começar</span>
            </div>
        `;
        if (elements.clearAll) elements.clearAll.style.display = 'none';
        if (elements.toggleCompare) elements.toggleCompare.style.display = 'none';
        return;
    }
    
    if (elements.clearAll) elements.clearAll.style.display = 'block';
    if (elements.previewGrid) elements.previewGrid.innerHTML = '';
    
    state.images.forEach((image, index) => {
        const card = document.createElement('div');
        card.className = `preview-card ${state.selectedImageIndex === index ? 'selected' : ''}`;
        card.innerHTML = `
            <button class="preview-card-remove" onclick="removeImage(${index})">
                <i class="fas fa-times"></i>
            </button>
            <span class="preview-card-status ${image.processed ? 'status-processed' : 'status-pending'}">
                ${image.processed ? 'Processada' : 'Pendente'}
            </span>
            <img src="${image.processedUrl || image.dataUrl}" alt="${image.name}" class="preview-card-image" onclick="openModal('${image.processedUrl || image.dataUrl}', ${index})">
            <button class="preview-card-select" onclick="selectImageForPreview(${index})" title="Selecionar para preview">
                <i class="fas fa-eye"></i>
            </button>
            <div class="preview-card-info">
                <div class="preview-card-name" title="${image.name}">${image.name}</div>
                <div class="preview-card-size">${image.width} x ${image.height} • ${formatFileSize(image.size)}</div>
                ${image.processed ? `
                    <div class="preview-card-actions">
                        <button class="btn btn-primary btn-small" onclick="downloadSingle(${index})">
                            <i class="fas fa-download"></i> Baixar
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        if (elements.previewGrid) {
    elements.previewGrid.appendChild(card);
}
const thumbBar = elements.thumbnailBar || document.getElementById('thumbnailBar');
const thumbBarContainer = elements.thumbnailBarContainer || document.getElementById('thumbnailBarContainer');
if (thumbBar) {
    thumbBar.innerHTML = '';
    state.images.forEach((img, idx) => {
        const thumb = document.createElement('div');
        thumb.className = `thumb-item ${state.selectedImageIndex === idx ? 'active' : ''}`;
        thumb.onclick = () => selectImageForPreview(idx);
        thumb.innerHTML = `<img src="${img.processedUrl || img.dataUrl}" alt="${img.name}">`;
        thumbBar.appendChild(thumb);
    });
    if (thumbBarContainer) thumbBarContainer.style.display = 'block';
}
    });
    
    // Show compare button if there are processed images
    const hasProcessed = state.images.some(img => img.processed);
    if (elements.toggleCompare) elements.toggleCompare.style.display = hasProcessed ? 'inline-flex' : 'none';
}

function selectImageForPreview(index) {
    state.selectedImageIndex = index;
    updatePreviewGrid();
    showToast(`Imagem "${state.images[index].name}" selecionada para preview`, 'info');
}

window.selectImageForPreview = selectImageForPreview;

function removeImage(index) {
    state.images.splice(index, 1);
    if (state.selectedImageIndex >= state.images.length) {
        state.selectedImageIndex = Math.max(0, state.images.length - 1);
    }
    updatePreviewGrid();
    updateUploadedCount();
    updateActionButtons();
}

window.removeImage = removeImage;

function clearAllImages() {
    if (confirm('Tem certeza que deseja remover todas as imagens?')) {
        state.images = [];
        state.processedImages = [];
        state.selectedImageIndex = 0;
        updatePreviewGrid();
        updateUploadedCount();
        updateActionButtons();
        closeLivePreview();
        showToast('Todas as imagens foram removidas', 'success');
    }
}

// ==================== Action Buttons ====================
function updateActionButtons() {
    const hasImages = state.images.length > 0;
    const hasWatermarkSource = (state.settings.useLogo && state.logo) || state.settings.useText || state.settings.useTimestamp;
    const hasProcessedImages = state.images.some(img => img.processed);
    
    if (elements.previewWatermark) elements.previewWatermark.disabled = !hasImages || !hasWatermarkSource;
    if (elements.applyWatermark) elements.applyWatermark.disabled = !hasImages || !hasWatermarkSource;
    if (elements.downloadAll) elements.downloadAll.disabled = !hasProcessedImages;
    
    console.log('📊 Estado dos botões:', {
        hasImages,
        hasWatermarkSource,
        hasProcessedImages,
        previewDisabled: elements.previewWatermark ? elements.previewWatermark.disabled : false,
        applyDisabled: elements.applyWatermark ? elements.applyWatermark.disabled : false
    });
}

// ==================== Live Preview - CORRIGIDO ====================
function showLivePreview() {
    console.log('🔍 Iniciando preview...');
    
    if (state.images.length === 0) {
        showToast('Nenhuma imagem para visualizar', 'error');
        return;
    }
    
    updateSettings();
    const image = state.images[state.selectedImageIndex];
    
    if (!image) {
        showToast('Selecione uma imagem primeiro', 'error');
        return;
    }
    
    console.log('📷 Imagem selecionada:', image.name);
    
    if (elements.livePreviewContainer) elements.livePreviewContainer.style.display = 'block';
    if (elements.comparisonSlider) elements.comparisonSlider.style.display = 'none';
    if (elements.livePreviewCanvas) elements.livePreviewCanvas.style.display = 'block';
    if (elements.previewImageName) elements.previewImageName.textContent = image.name;
    if (elements.previewImageSize) elements.previewImageSize.textContent = `${image.width} x ${image.height}`;
    
    renderPreview(image);
    
    showToast('Preview gerado! Veja acima.', 'success');
}

async function renderPreview(imageData) {
    console.log('🎨 Renderizando preview...');
    
    const canvas = elements.livePreviewCanvas;
    const ctx = canvas.getContext('2d');
    
    // Load main image
    const img = await loadImageAsync(imageData.dataUrl);
    
    // Calculate canvas size (scaled for preview)
    const maxPreviewWidth = 700;
    const maxPreviewHeight = 400;
    let scale = 1;
    
    if (img.width > maxPreviewWidth || img.height > maxPreviewHeight) {
        scale = Math.min(maxPreviewWidth / img.width, maxPreviewHeight / img.height);
    }
    
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    
    console.log('📐 Canvas:', canvas.width, 'x', canvas.height, 'Scale:', scale);
    
    // Draw original image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Apply logo watermark
    if (state.settings.useLogo && state.logo) {
        console.log('🖼️ Aplicando logo...');
        await applyLogoToCanvas(ctx, canvas.width, canvas.height, scale);
    }
    
    // Apply text watermarks
    if (state.settings.useText) {
        console.log('✏️ Aplicando texto...');
        applyTextToCanvas(ctx, canvas.width, canvas.height, scale);
    }
    
    // Apply timestamp
    if (state.settings.useTimestamp) {
        console.log('🕐 Aplicando timestamp...');
        applyTimestampToCanvas(ctx, canvas.width, canvas.height, scale);
    }
    
    console.log('✅ Preview renderizado!');
}

// Helper function to load image as Promise
function loadImageAsync(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function applyLogoToCanvas(ctx, canvasWidth, canvasHeight, scale) {
    // Load logo image
    const logoImg = await loadImageAsync(state.logo.dataUrl);
    
    const logoScale = state.settings.logoScale / 100;
    const opacity = state.settings.logoOpacity / 100;
    const margin = state.settings.logoMargin * scale;
    const rotation = state.settings.logoRotation * (Math.PI / 180);
    const spacing = state.settings.logoSpacing * scale;
    
    const logoWidth = canvasWidth * logoScale;
    const logoHeight = logoImg.height * (logoWidth / logoImg.width);
    
    ctx.globalAlpha = opacity;
    
    if (state.settings.logoPosition === 'repeat') {
        // Repeated pattern
        for (let y = margin; y < canvasHeight; y += logoHeight + spacing) {
            for (let x = margin; x < canvasWidth; x += logoWidth + spacing) {
                drawRotatedImage(ctx, logoImg, x, y, logoWidth, logoHeight, rotation);
            }
        }
    } else if (state.settings.logoPosition === 'custom') {
        const x = (canvasWidth - logoWidth) * (state.settings.logoPosX / 100);
        const y = (canvasHeight - logoHeight) * (state.settings.logoPosY / 100);
        drawRotatedImage(ctx, logoImg, x, y, logoWidth, logoHeight, rotation);
    } else {
        const pos = calculatePosition(state.settings.logoPosition, canvasWidth, canvasHeight, logoWidth, logoHeight, margin);
        drawRotatedImage(ctx, logoImg, pos.x, pos.y, logoWidth, logoHeight, rotation);
    }
    
    ctx.globalAlpha = 1;
}

function applyTextToCanvas(ctx, canvasWidth, canvasHeight, scale) {
    const textData = getTextWatermarksData();
    const repeatDiagonal = state.settings.textRepeatDiagonal;
    
    textData.forEach(text => {
        if (!text.content.trim()) return;
        
        const fontSize = text.size * scale;
        const fontWeight = text.bold ? 'bold' : 'normal';
        ctx.font = `${fontWeight} ${fontSize}px ${text.font}`;
        ctx.fillStyle = hexToRgba(text.color, text.opacity / 100);
        
        const metrics = ctx.measureText(text.content);
        const textWidth = metrics.width;
        const textHeight = fontSize;
        const margin = 30 * scale;
        
        if (repeatDiagonal) {
            const spacingX = textWidth + 100 * scale;
            const spacingY = textHeight + 80 * scale;
            const angle = -30 * (Math.PI / 180);
            
            ctx.save();
            for (let y = -canvasHeight; y < canvasHeight * 2; y += spacingY) {
                for (let x = -canvasWidth; x < canvasWidth * 2; x += spacingX) {
                    const offsetX = x + (y / 2);
                    ctx.save();
                    ctx.translate(offsetX, y);
                    ctx.rotate(angle);
                    
                    if (text.shadow) {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                        ctx.fillText(text.content, 2, 2);
                        ctx.fillStyle = hexToRgba(text.color, text.opacity / 100);
                    }
                    
                    if (text.outline) {
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                        ctx.lineWidth = 2;
                        ctx.strokeText(text.content, 0, 0);
                    }
                    
                    ctx.fillText(text.content, 0, 0);
                    ctx.restore();
                }
            }
            ctx.restore();
        } else {
            const pos = calculatePosition(text.position, canvasWidth, canvasHeight, textWidth, textHeight, margin);
            const rotation = text.rotation * (Math.PI / 180);
            
            ctx.save();
            ctx.translate(pos.x + textWidth / 2, pos.y + textHeight / 2);
            ctx.rotate(rotation);
            
            if (text.shadow) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillText(text.content, -textWidth / 2 + 2, textHeight / 2 + 2);
                ctx.fillStyle = hexToRgba(text.color, text.opacity / 100);
            }
            
            if (text.outline) {
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.lineWidth = 2;
                ctx.strokeText(text.content, -textWidth / 2, textHeight / 2);
            }
            
            ctx.fillText(text.content, -textWidth / 2, textHeight / 2);
            ctx.restore();
        }
    });
}

function applyTimestampToCanvas(ctx, canvasWidth, canvasHeight, scale) {
    const timestamp = formatTimestamp(state.settings.timestampFormat);
    const fontSize = state.settings.timestampSize * scale;
    const opacity = state.settings.timestampOpacity / 100;
    const color = state.settings.timestampColor;
    const margin = 20 * scale;
    
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = hexToRgba(color, opacity);
    
    const metrics = ctx.measureText(timestamp);
    const textWidth = metrics.width;
    const textHeight = fontSize;
    
    const pos = calculatePosition(state.settings.timestampPosition, canvasWidth, canvasHeight, textWidth, textHeight, margin);
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillText(timestamp, pos.x + 1, pos.y + textHeight + 1);
    
    ctx.fillStyle = hexToRgba(color, opacity);
    ctx.fillText(timestamp, pos.x, pos.y + textHeight);
}

function formatTimestamp(format) {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    switch (format) {
        case 'dd/mm/yyyy hh:ii':
            return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
        case 'yyyy-mm-dd hh:ii':
            return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
        case 'dd/mm/yyyy':
            return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
        case 'hh:ii:ss':
            return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        case 'full':
            return `${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
        default:
            return now.toLocaleString('pt-BR');
    }
}

function drawRotatedImage(ctx, img, x, y, width, height, rotation) {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(rotation);
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    ctx.restore();
}

function calculatePosition(position, containerWidth, containerHeight, elementWidth, elementHeight, margin) {
    switch (position) {
        case 'top-left':
            return { x: margin, y: margin };
        case 'top-right':
            return { x: containerWidth - elementWidth - margin, y: margin };
        case 'bottom-left':
            return { x: margin, y: containerHeight - elementHeight - margin };
        case 'bottom-right':
            return { x: containerWidth - elementWidth - margin, y: containerHeight - elementHeight - margin };
        case 'center':
            return { x: (containerWidth - elementWidth) / 2, y: (containerHeight - elementHeight) / 2 };
        default:
            return { x: margin, y: margin };
    }
}

function closeLivePreview() {
    if (elements.livePreviewContainer) elements.livePreviewContainer.style.display = 'none';
    if (elements.comparisonSlider) elements.comparisonSlider.style.display = 'none';
    if (elements.livePreviewCanvas) elements.livePreviewCanvas.style.display = 'block';
    state.isComparing = false;
}

// ==================== Comparison Slider - CORRIGIDO ====================
function initComparisonSlider() {
    const handle = elements.comparisonHandle || document.getElementById('comparisonHandle');
    const slider = elements.comparisonSlider || document.getElementById('comparisonSlider');
    if (!handle || !slider) return;
    let isDragging = false;
    
    handle.addEventListener('mousedown', (e) => {
        isDragging = true;
        e.preventDefault();
    });
    
    handle.addEventListener('touchstart', (e) => {
        isDragging = true;
    });
    
    document.addEventListener('mouseup', () => isDragging = false);
    document.addEventListener('touchend', () => isDragging = false);
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        updateComparisonPosition(e.clientX, slider);
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        updateComparisonPosition(e.touches[0].clientX, slider);
    });
}

function updateComparisonPosition(clientX, slider) {
    const rect = slider.getBoundingClientRect();
    let pos = (clientX - rect.left) / rect.width * 100;
    pos = Math.max(0, Math.min(100, pos));
    
    if (elements.comparisonAfter) elements.comparisonAfter.style.width = pos + '%';
    if (elements.comparisonHandle) elements.comparisonHandle.style.left = pos + '%';
}

function toggleComparison() {
    console.log('⚖️ Toggle comparação...');
    
    if (state.images.length === 0) {
        showToast('Nenhuma imagem disponível', 'error');
        return;
    }
    
    const image = state.images[state.selectedImageIndex];
    
    if (!image) {
        showToast('Selecione uma imagem primeiro', 'error');
        return;
    }
    
    if (!image.processed) {
        showToast('Processe a imagem primeiro para comparar. Clique em "Aplicar Marca d\'água"', 'warning');
        return;
    }
    
    console.log('📷 Mostrando comparação para:', image.name);
    showComparisonView(image.dataUrl, image.processedUrl);
}

function showComparisonFromModal() {
    const currentImage = state.images[state.selectedImageIndex];
    if (!currentImage || !currentImage.processed) {
        showToast('Processe a imagem primeiro para comparar', 'warning');
        return;
    }
    
    closeModal();
    showComparisonView(currentImage.dataUrl, currentImage.processedUrl);
}

function showComparisonView(beforeUrl, afterUrl) {
    console.log('⚖️ Exibindo comparação...');
    
    if (elements.livePreviewContainer) elements.livePreviewContainer.style.display = 'block';
    elements.livePreviewCanvas.style.display = 'none';
    elements.comparisonSlider.style.display = 'block';
    
    if (elements.beforeImage) elements.beforeImage.src = beforeUrl;
    if (elements.afterImage) elements.afterImage.src = afterUrl;
    
    elements.comparisonAfter.style.width = '50%';
    elements.comparisonHandle.style.left = '50%';
    
    state.isComparing = true;
    
    showToast('Arraste o controle para comparar antes/depois', 'info');
}

// ==================== Process Watermarks ====================
async function processWatermarks() {
    updateSettings();
    
    const textData = state.settings.useText ? getTextWatermarksData() : [];
    
    // Validate
    if (state.images.length === 0) {
        showToast('Nenhuma imagem para processar', 'error');
        return;
    }
    
    if (state.settings.useLogo && !state.logo) {
        showToast('Faça upload de um logo primeiro', 'error');
        return;
    }
    
    // Show progress
    if (elements.progressContainer) if (elements.progressContainer) elements.progressContainer.style.display = 'block';
    if (elements.applyWatermark) if (elements.applyWatermark) elements.applyWatermark.disabled = true;
    if (elements.previewWatermark) if (elements.previewWatermark) elements.previewWatermark.disabled = true;
    
    let processed = 0;
    const total = state.images.length;
    
    for (let i = 0; i < state.images.length; i++) {
        const image = state.images[i];
        
        updateProgress(processed, total, `Processando ${image.name}...`);
        
        try {
            const formData = new FormData();
            formData.append('image', image.file);
            formData.append('settings', JSON.stringify({
                ...state.settings,
                timestamp: formatTimestamp(state.settings.timestampFormat)
            }));
            formData.append('textWatermarks', JSON.stringify(textData));
            
            if (state.settings.useLogo && state.logo) {
                formData.append('logo', state.logo.file);
            }
            
            const response = await fetch('watermark.php', {
                method: 'POST',
                body: formData
            });
            
            const responseText = await response.text();
            console.log('📥 Resposta do servidor:', responseText);
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                throw new Error('Resposta inválida do servidor: ' + responseText.substring(0, 200));
            }
            
            if (result.success) {
                state.images[i].processed = true;
                state.images[i].processedUrl = result.imageUrl;
                state.images[i].downloadName = result.downloadName;
            } else {
                throw new Error(result.error || 'Erro ao processar');
            }
            
        } catch (error) {
            console.error('❌ Error processing image:', error);
            showToast(`Erro ao processar ${image.name}: ${error.message}`, 'error');
        }
        
        processed++;
        updateProgress(processed, total, `Processando ${image.name}...`);
    }
    
    // Hide progress
    setTimeout(() => {
        if (elements.progressContainer) elements.progressContainer.style.display = 'none';
        updatePreviewGrid();
        updateActionButtons();
        showToast(`${processed} imagem(ns) processada(s) com sucesso!`, 'success');
    }, 500);
}

function updateProgress(current, total, text) {
    const percent = Math.round((current / total) * 100);
    if (elements.progressText) elements.progressText.textContent = text;
    if (elements.progressPercent) elements.progressPercent.textContent = `${percent}%`;
    if (elements.progressFill) elements.progressFill.style.width = `${percent}%`;
}

// ==================== Download ====================
function downloadSingle(index) {
    const image = state.images[index];
    if (!image.processedUrl) return;
    
    const link = document.createElement('a');
    link.href = image.processedUrl;
    link.download = image.downloadName || image.name.replace(/\.[^.]+$/, '_watermark.jpg');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

window.downloadSingle = downloadSingle;

async function downloadAllImages() {
    const processedImages = state.images.filter(img => img.processed);
    
    if (processedImages.length === 0) {
        showToast('Nenhuma imagem processada para baixar', 'error');
        return;
    }
    
    showToast('Preparando download...', 'info');
    
    try {
        const files = processedImages.map(img => ({
            url: img.processedUrl,
            name: img.downloadName || img.name.replace(/\.[^.]+$/, '_watermark.jpg')
        }));
        
        const response = await fetch('download.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ files })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao criar ZIP');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'imagens_watermark.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showToast('Download iniciado!', 'success');
        
    } catch (error) {
        console.error('Error downloading:', error);
        showToast('Erro ao preparar download: ' + error.message, 'error');
    }
}

// ==================== Modal ====================
function openModal(imageUrl, index) {
    state.selectedImageIndex = index;
    if (elements.modalImage) elements.modalImage.src = imageUrl;
    if (elements.imageModal) elements.imageModal.classList.add('active');
    
    const image = state.images[index];
    elements.modalCompare.style.display = image.processed ? 'inline-flex' : 'none';
    
    elements.modalDownload.onclick = () => {
        if (image.processed) {
            downloadSingle(index);
        } else {
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = image.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
}

window.openModal = openModal;

function closeModal() {
    if (elements.imageModal) elements.imageModal.classList.remove('active');
}

// ==================== Presets ====================
function loadPresets() {
    const saved = localStorage.getItem('watermark_presets');
    if (saved) {
        state.presets = JSON.parse(saved);
    }
}

function savePresets() {
    localStorage.setItem('watermark_presets', JSON.stringify(state.presets));
}

function openPresetModal() {
    const modal = document.getElementById('presetsModal') || document.getElementById('presetModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
    }
    renderPresetList();
}

function closePresetModal() {
    const modal = document.getElementById('presetsModal') || document.getElementById('presetModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

function openSavePresetModal() {
    const defaultName = `Preset ${state.presets.length + 1} (${new Date().toLocaleDateString('pt-BR')})`;
    const name = prompt('Digite um nome para salvar sua configuração de marca d\'água:', defaultName);
    if (name && name.trim()) {
        saveCurrentPresetWithName(name.trim());
    }
}

function closeSavePresetModal() {
    closePresetModal();
}

function saveCurrentPreset() {
    openSavePresetModal();
}

function saveCurrentPresetWithName(name) {
    updateSettings();
    const preset = {
        id: Date.now(),
        name: name,
        date: new Date().toLocaleDateString('pt-BR'),
        settings: { ...state.settings }
    };
    state.presets.push(preset);
    savePresets();
    showToast(`Preset "${name}" salvo com sucesso!`, 'success');
}

function deletePreset(id) {
    state.presets = state.presets.filter(p => p.id !== id);
    savePresets();
    renderPresetList();
    showToast('Preset removido com sucesso!', 'info');
}

function loadPreset(id) {
    const preset = state.presets.find(p => p.id === id);
    if (!preset) return;
    
    // Apply settings
    state.settings = { ...preset.settings };
    
    // Update UI
    if (elements.useLogo) elements.useLogo.checked = state.settings.useLogo;
    if (elements.useText) elements.useText.checked = state.settings.useText;
    if (elements.useTimestamp) elements.useTimestamp.checked = state.settings.useTimestamp;
    if (elements.logoPosition) elements.logoPosition.value = state.settings.logoPosition;
    if (elements.logoScale) elements.logoScale.value = state.settings.logoScale;
    if (elements.logoOpacity) elements.logoOpacity.value = state.settings.logoOpacity;
    if (elements.logoMargin) elements.logoMargin.value = state.settings.logoMargin;
    if (elements.logoRotation) elements.logoRotation.value = state.settings.logoRotation;
    if (elements.logoSpacing) elements.logoSpacing.value = state.settings.logoSpacing;
    if (elements.logoPosX) elements.logoPosX.value = state.settings.logoPosX;
    if (elements.logoPosY) elements.logoPosY.value = state.settings.logoPosY;
    if (elements.textRepeatDiagonal) elements.textRepeatDiagonal.checked = state.settings.textRepeatDiagonal;
    if (elements.timestampFormat) elements.timestampFormat.value = state.settings.timestampFormat;
    if (elements.timestampColor) elements.timestampColor.value = state.settings.timestampColor;
    if (elements.timestampSize) elements.timestampSize.value = state.settings.timestampSize;
    if (elements.timestampPosition) elements.timestampPosition.value = state.settings.timestampPosition;
    if (elements.timestampOpacity) elements.timestampOpacity.value = state.settings.timestampOpacity;
    if (elements.outputFormat) elements.outputFormat.value = state.settings.outputFormat;
    if (elements.outputQuality) elements.outputQuality.value = state.settings.outputQuality;
    if (elements.resizeEnabled) elements.resizeEnabled.checked = state.settings.resizeEnabled;
    if (elements.maxWidth) elements.maxWidth.value = state.settings.maxWidth;
    if (elements.maxHeight) elements.maxHeight.value = state.settings.maxHeight;
    if (elements.maintainAspect) elements.maintainAspect.checked = state.settings.maintainAspect;
    if (elements.filePrefix) elements.filePrefix.value = state.settings.filePrefix;
    if (elements.fileSuffix) elements.fileSuffix.value = state.settings.fileSuffix;
    
    // Update slider displays
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        const valueSpan = document.getElementById(slider.id + 'Value');
        if (valueSpan) {
            valueSpan.textContent = slider.value;
        }
    });
    
    // Update visibility
    updateWatermarkTypeVisibility();
    handleLogoPositionChange();
    toggleResizeOptions();
    
    // Apply text watermarks
    if (preset.textWatermarks && preset.textWatermarks.length > 0) {
        if (elements.textWatermarks) elements.textWatermarks.innerHTML = '';
        textCounter = 0;
        preset.textWatermarks.forEach(text => {
            addTextWatermark();
            const lastEntry = elements.textWatermarks.lastElementChild;
            lastEntry.querySelector('.text-content').value = text.content;
            lastEntry.querySelector('.text-font').value = text.font;
            lastEntry.querySelector('.text-size').value = text.size;
            lastEntry.querySelector('.text-color').value = text.color;
            lastEntry.querySelector('.text-opacity').value = text.opacity;
            lastEntry.querySelector('.text-position').value = text.position;
            lastEntry.querySelector('.text-rotation').value = text.rotation;
            
            const effects = { shadow: text.shadow, outline: text.outline, bold: text.bold };
            lastEntry.querySelector('.text-effects-data').value = JSON.stringify(effects);
            
            if (text.shadow) lastEntry.querySelector('[data-effect="shadow"]').classList.add('active');
            if (text.outline) lastEntry.querySelector('[data-effect="outline"]').classList.add('active');
            if (text.bold) lastEntry.querySelector('[data-effect="bold"]').classList.add('active');
        });
    }
    
    closePresetModal();
    showToast(`Preset "${preset.name}" carregado!`, 'success');
}

window.loadPreset = loadPreset;
window.deletePreset = deletePreset;
window.closePresetModal = closePresetModal;
window.openPresetModal = openPresetModal;
window.openSavePresetModal = openSavePresetModal;

function deletePreset(id) {
    if (!confirm('Tem certeza que deseja excluir este preset?')) return;
    
    state.presets = state.presets.filter(p => p.id !== id);
    savePresets();
    renderPresetList();
    showToast('Preset excluído', 'success');
}

window.deletePreset = deletePreset;
window.closeSavePresetModal = closeSavePresetModal;
window.saveCurrentPreset = saveCurrentPreset;

function renderPresetList() {
    if (state.presets.length === 0) {
        if (elements.presetList) elements.presetList.innerHTML = `
            <div class="empty-state small">
                <i class="fas fa-bookmark"></i>
                <p>Nenhum preset salvo</p>
            </div>
        `;
        return;
    }
    
    if (elements.presetList) elements.presetList.innerHTML = state.presets.map(preset => `
        <div class="preset-item">
            <div>
                <div class="preset-item-name">${preset.name}</div>
                <div class="preset-item-date">${preset.date}</div>
            </div>
            <div class="preset-item-actions">
                <button class="btn btn-primary btn-small" onclick="loadPreset(${preset.id})">
                    <i class="fas fa-check"></i> Usar
                </button>
                <button class="btn btn-secondary btn-small" onclick="deletePreset(${preset.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ==================== Toast Notifications ====================
function showToast(message, type = 'success') {
    let container = elements.toastContainer || document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;';
        document.body.appendChild(container);
    }
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span class="toast-message">${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==================== Utilities ====================
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ==================== Presets & Auto BG Upgrade ====================
document.addEventListener('DOMContentLoaded', () => {
    const pElegante = document.getElementById('presetElegante');
    const pEcommerce = document.getElementById('presetEcommerce');
    const pProtecao = document.getElementById('presetProtecao');
    const btnAutoBg = document.getElementById('autoRemoveBgBtn');

    if (pElegante) {
        pElegante.addEventListener('click', () => {
            if (elements.useLogo) elements.useLogo.checked = true;
            if (elements.useText) elements.useText.checked = false;
            if (elements.logoPosition) elements.logoPosition.value = 'bottom-right';
            if (elements.logoScale) { elements.logoScale.value = 25; if (elements.logoScaleValue) elements.logoScaleValue.innerText = '25'; }
            if (elements.logoOpacity) { elements.logoOpacity.value = 40; if (elements.logoOpacityValue) elements.logoOpacityValue.innerText = '40'; }
            updateWatermarkTypeVisibility();
            updateSettings();
            showToast('Preset Fotógrafo Elegante aplicado!', 'success');
            if (state.images.length > 0) showLivePreview();
        });
    }

    if (pEcommerce) {
        pEcommerce.addEventListener('click', () => {
            if (elements.useLogo) elements.useLogo.checked = true;
            if (elements.useText) elements.useText.checked = false;
            if (elements.logoPosition) elements.logoPosition.value = 'center';
            if (elements.logoScale) { elements.logoScale.value = 35; if (elements.logoScaleValue) elements.logoScaleValue.innerText = '35'; }
            if (elements.logoOpacity) { elements.logoOpacity.value = 20; if (elements.logoOpacityValue) elements.logoOpacityValue.innerText = '20'; }
            updateWatermarkTypeVisibility();
            updateSettings();
            showToast('Preset E-Commerce Discreto aplicado!', 'success');
            if (state.images.length > 0) showLivePreview();
        });
    }

    if (pProtecao) {
        pProtecao.addEventListener('click', () => {
            if (elements.useLogo) elements.useLogo.checked = true;
            if (elements.useText) elements.useText.checked = true;
            if (elements.textRepeatDiagonal) elements.textRepeatDiagonal.checked = true;
            if (elements.logoPosition) elements.logoPosition.value = 'repeat';
            if (elements.logoOpacity) { elements.logoOpacity.value = 15; if (elements.logoOpacityValue) elements.logoOpacityValue.innerText = '15'; }
            updateWatermarkTypeVisibility();
            updateSettings();
            showToast('Preset Proteção Total Diagonal aplicado!', 'success');
            if (state.images.length > 0) showLivePreview();
        });
    }

    if (btnAutoBg) {
        btnAutoBg.addEventListener('click', () => {
            if (!logoImageCache && !elements.logoPreview.src) {
                showToast('Faça o upload do logo primeiro!', 'warning');
                return;
            }
            try {
                const img = logoImageCache || elements.logoPreview;
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imgData.data;

                // Color of top-left pixel as background target
                const bgR = data[0], bgG = data[1], bgB = data[2];
                const tolerance = 45;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i+1], b = data[i+2];
                    const diff = Math.sqrt(Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2));
                    if (diff < tolerance) {
                        data[i + 3] = 0; // Transparent
                    }
                }

                ctx.putImageData(imgData, 0, 0);

                const cleanImg = new Image();
                cleanImg.onload = () => {
                    logoImageCache = cleanImg;
                    if (elements.logoPreview) elements.logoPreview.src = cleanImg.src;
                    showToast('Fundo do logo removido com sucesso!', 'success');
                    if (state.images.length > 0) showLivePreview();
                };
                cleanImg.src = canvas.toDataURL('image/png');
            } catch (err) {
                console.error(err);
                showToast('Erro ao processar fundo do logo.', 'error');
            }
        });
    }
});
