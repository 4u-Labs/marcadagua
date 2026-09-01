<?php
// Anti-cache headers for dynamic assets
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
$v = time();
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>WaterMark Pro - Marca d'água & Proteção de Imagens</title>
    <link rel="stylesheet" href="style.css?v=<?php echo $v; ?>">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="dark-theme">
    <!-- Mesh Glow Background -->
    <div class="mesh-bg"></div>

    <!-- Header -->
    <header class="header">
        <div class="logo">
            <div class="logo-icon-wrap">
                <i class="fas fa-tint"></i>
            </div>
            <div class="logo-text">
                <span class="brand-name">WaterMark <span class="badge-pro">PRO</span></span>
                <span class="brand-sub">Suíte de Proteção & Marcas d'água</span>
            </div>
        </div>
        <div class="header-actions">
            <div class="quick-presets">
                <button class="btn btn-preset" id="presetElegante" title="Fotografia / Elegante">
                    <i class="fas fa-camera"></i> <span>Fotógrafo</span>
                </button>
                <button class="btn btn-preset" id="presetEcommerce" title="Loja Virtual / E-Commerce">
                    <i class="fas fa-shopping-bag"></i> <span>E-Commerce</span>
                </button>
                <button class="btn btn-preset" id="presetProtecao" title="Proteção Total Diagonal">
                    <i class="fas fa-shield-alt"></i> <span>Proteção</span>
                </button>
            </div>

            <button class="btn btn-small btn-secondary" id="loadPreset" title="Carregar Preset">
                <i class="fas fa-folder-open"></i>
                <span class="btn-text">Presets</span>
            </button>
            <button class="btn btn-small btn-secondary" id="savePreset" title="Salvar Preset">
                <i class="fas fa-save"></i>
                <span class="btn-text">Salvar</span>
            </button>
            
        </div>
    </header>

    <!-- Main Container -->
    <main class="main-container">
        <!-- Left Panel - Settings -->
        <aside class="settings-panel">
            <div class="panel-header">
                <h2><i class="fas fa-sliders-h"></i> Painel de Controle</h2>
            </div>

            <!-- Upload Section -->
            <section class="settings-section">
                <h3><i class="fas fa-images"></i> 1. Fotos para Marcar</h3>
                <div class="upload-zone" id="imageUploadZone">
                    <div class="upload-icon-pulse">
                        <i class="fas fa-cloud-upload-alt"></i>
                    </div>
                    <p class="upload-title">Arraste fotos aqui ou clique para selecionar</p>
                    <span class="upload-info">JPG, PNG, WEBP (Lote ilimitado)</span>
                    <input type="file" id="imageInput" multiple accept=".jpg,.jpeg,.png,.webp" hidden>
                </div>
                <div class="uploaded-count" id="uploadedCount"></div>
            </section>

            <!-- Watermark Type Selection -->
            <section class="settings-section">
                <h3><i class="fas fa-layer-group"></i> 2. Elementos da Marca</h3>
                <div class="checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="useLogo" checked>
                        <span class="checkmark"></span>
                        <span>Logo (Imagem)</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="useText">
                        <span class="checkmark"></span>
                        <span>Texto</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="useTimestamp">
                        <span class="checkmark"></span>
                        <span>Data/Hora Automática</span>
                    </label>
                </div>
            </section>

            <!-- Logo Watermark Settings -->
            <section class="settings-section logo-settings" id="logoSettings">
                <div class="section-title-wrap">
                    <h3><i class="fas fa-image"></i> Configurações do Logo</h3>
                    <button class="btn-micro" id="autoRemoveBgBtn" title="Remover Fundo Branco/Preto do Logo em 1 Clique">
                        <i class="fas fa-magic"></i> Auto BG Transparent
                    </button>
                </div>
                
                <div class="upload-zone small" id="logoUploadZone">
                    <i class="fas fa-file-image"></i>
                    <p>Upload do Logo (PNG Transparente)</p>
                    <input type="file" id="logoInput" accept=".png,.jpg,.jpeg,.webp" hidden>
                </div>
                <div class="logo-preview-container" id="logoPreviewContainer" style="display:none;">
                    <img id="logoPreview" src="" alt="Logo Preview">
                    <button class="btn-remove" id="removeLogo" title="Remover Logo"><i class="fas fa-times"></i></button>
                </div>

                <div class="form-group">
                    <label>Posição do Logo</label>
                    <select id="logoPosition">
                        <option value="top-left">Canto Superior Esquerdo</option>
                        <option value="top-right">Canto Superior Direito</option>
                        <option value="bottom-left">Canto Inferior Esquerdo</option>
                        <option value="bottom-right" selected>Canto Inferior Direito</option>
                        <option value="center">Centro da Imagem</option>
                        <option value="custom">Posição Livre (Personalizada)</option>
                        <option value="repeat">Repetido (Padrão de Grade)</option>
                    </select>
                </div>

                <!-- Custom Position Controls -->
                <div class="custom-position-controls" id="logoCustomPosition" style="display:none;">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Posição X: <span class="badge-val" id="logoPosXValue">50</span>%</label>
                            <input type="range" id="logoPosX" min="0" max="100" value="50">
                        </div>
                        <div class="form-group">
                            <label>Posição Y: <span class="badge-val" id="logoPosYValue">50</span>%</label>
                            <input type="range" id="logoPosY" min="0" max="100" value="50">
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label>Tamanho (Escala): <span class="badge-val" id="logoScaleValue">30</span>%</label>
                    <input type="range" id="logoScale" min="5" max="100" value="30">
                </div>

                <div class="form-group">
                    <label>Transparência (Opacidade): <span class="badge-val" id="logoOpacityValue">50</span>%</label>
                    <input type="range" id="logoOpacity" min="5" max="100" value="50">
                </div>

                <div class="form-group">
                    <label>Margem das Bordas (px): <span class="badge-val" id="logoMarginValue">20</span></label>
                    <input type="range" id="logoMargin" min="0" max="100" value="20">
                </div>

                <div class="form-group">
                    <label>Ângulo de Rotação: <span class="badge-val" id="logoRotationValue">0</span>°</label>
                    <input type="range" id="logoRotation" min="-180" max="180" value="0">
                </div>

                <div class="form-group">
                    <label>Espaçamento na Repetição: <span class="badge-val" id="logoSpacingValue">50</span>px</label>
                    <input type="range" id="logoSpacing" min="10" max="200" value="50">
                </div>
            </section>

            <!-- Text Watermark Settings -->
            <section class="settings-section text-settings" id="textSettings" style="display:none;">
                <h3><i class="fas fa-font"></i> Configurações de Texto</h3>
                
                <div id="textWatermarks">
                    <!-- Dynamic text entries -->
                </div>
                
                <button class="btn btn-secondary" id="addTextBtn">
                    <i class="fas fa-plus"></i> Adicionar Texto
                </button>

                <div class="form-group" style="margin-top: 15px;">
                    <label class="checkbox-label">
                        <input type="checkbox" id="textRepeatDiagonal">
                        <span class="checkmark"></span>
                        <span>Repetir em padrão diagonal</span>
                    </label>
                </div>
            </section>

            <!-- Timestamp Settings -->
            <section class="settings-section timestamp-settings" id="timestampSettings" style="display:none;">
                <h3><i class="fas fa-clock"></i> Data e Hora Automática</h3>
                
                <div class="form-group">
                    <label>Formato da Data</label>
                    <select id="timestampFormat">
                        <option value="dd/mm/yyyy hh:ii">DD/MM/AAAA HH:MM</option>
                        <option value="yyyy-mm-dd hh:ii">AAAA-MM-DD HH:MM</option>
                        <option value="dd/mm/yyyy">DD/MM/AAAA</option>
                        <option value="hh:ii:ss">HH:MM:SS</option>
                        <option value="full">Completo (ex: 15 de Janeiro de 2026)</option>
                    </select>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Cor da Fonte</label>
                        <input type="color" id="timestampColor" value="#ffffff">
                    </div>
                    <div class="form-group">
                        <label>Tamanho Fonte (pt)</label>
                        <input type="number" id="timestampSize" value="16" min="8" max="72">
                    </div>
                </div>

                <div class="form-group">
                    <label>Posição na Imagem</label>
                    <select id="timestampPosition">
                        <option value="top-left">Superior Esquerdo</option>
                        <option value="top-right">Superior Direito</option>
                        <option value="bottom-left" selected>Inferior Esquerdo</option>
                        <option value="bottom-right">Inferior Direito</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Opacidade: <span class="badge-val" id="timestampOpacityValue">80</span>%</label>
                    <input type="range" id="timestampOpacity" min="10" max="100" value="80">
                </div>
            </section>

            <!-- Output Settings -->
            <section class="settings-section">
                <h3><i class="fas fa-cogs"></i> Exportação & Qualidade</h3>
                
                <div class="form-group">
                    <label>Formato de Saída</label>
                    <select id="outputFormat">
                        <option value="jpg" selected>JPG (Compacted / Rápido)</option>
                        <option value="png">PNG (Transparência Máxima)</option>
                        <option value="webp">WebP (Moderno & Leve)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Qualidade do Arquivo: <span class="badge-val" id="qualityValue">90</span>%</label>
                    <input type="range" id="outputQuality" min="50" max="100" value="90">
                </div>

                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="resizeEnabled">
                        <span class="checkmark"></span>
                        <span>Redimensionar imagens</span>
                    </label>
                </div>

                <div class="resize-options" id="resizeOptions" style="display:none;">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Largura Máx.</label>
                            <input type="number" id="maxWidth" value="1920" min="100" max="8000">
                        </div>
                        <div class="form-group">
                            <label>Altura Máx.</label>
                            <input type="number" id="maxHeight" value="1080" min="100" max="8000">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="maintainAspect" checked>
                            <span class="checkmark"></span>
                            <span>Manter Proporção Original</span>
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label>Prefixo do Nome</label>
                    <input type="text" id="filePrefix" value="" placeholder="ex: marca_">
                </div>

                <div class="form-group">
                    <label>Sufixo do Nome</label>
                    <input type="text" id="fileSuffix" value="_wm" placeholder="ex: _watermark">
                </div>
            </section>

            <!-- Action Buttons -->
            <div class="action-buttons">
                <button class="btn btn-primary" id="previewWatermark" disabled>
                    <i class="fas fa-eye"></i> Pré-visualizar
                </button>
                <button class="btn btn-action-main" id="applyWatermark" disabled>
                    <i class="fas fa-magic"></i> Aplicar Marca d'água
                </button>
                <button class="btn btn-success" id="downloadAll" disabled>
                    <i class="fas fa-download"></i> Baixar Lote (ZIP)
                </button>
            </div>
        </aside>

        <!-- Right Panel - Interactive Workspace & Preview -->
        <section class="workspace-panel">
            <div class="workspace-header">
                <div class="workspace-title">
                    <i class="fas fa-desktop"></i>
                    <span>Área de Trabalho & Pré-visualização</span>
                </div>
                <div class="workspace-stats" id="workspaceStats">
                    Nenhuma imagem selecionada
                </div>
            </div>

            <!-- Preview Card -->
            <div class="preview-card" id="previewCard">
                <div class="empty-state" id="emptyState">
                    <div class="empty-icon">
                        <i class="fas fa-photo-video"></i>
                    </div>
                    <h3>Sua foto aparecerá aqui</h3>
                    <p>Faça o upload de uma foto no painel esquerdo para começar a aplicar marcas d'água em tempo real.</p>
                </div>

                <div class="preview-container" id="previewContainer" style="display:none;">
                    <canvas id="previewCanvas"></canvas>
                </div>
            </div>

            <!-- Thumbnail Carousel Bar -->
            <div class="thumbnail-bar-container" id="thumbnailBarContainer" style="display:none;">
                <div class="thumbnail-bar-title">
                    <i class="fas fa-th-large"></i> Imagens no Lote
                </div>
                <div class="thumbnail-bar" id="thumbnailBar">
                    <!-- Dynamic Thumbnails -->
                </div>
            </div>
        </section>
    </main>

    <!-- Standardized Institutional Footer -->
    <footer class="footer-clean">
        <div class="footer-brand">
            <i class="fas fa-shield-alt"></i> <span>WaterMark PRO — 4U.IA.BR</span>
        </div>
        <div class="footer-links">
            <a href="privacidade.php" target="_blank">Privacidade</a>
            <span class="sep">•</span>
            <a href="termos.php" target="_blank">Termos de Uso</a>
            <span class="sep">•</span>
            <a href="suporte.php" target="_blank">Suporte & FAQ</a>
        </div>
        <div class="footer-copyright">
            © <?php echo date('Y'); ?> 4U.IA.BR — Todos os direitos reservados. Processamento seguro com retenção zero.
        </div>
    </footer>

    <!-- Presets Modal -->
    <div class="modal" id="presetsModal" style="display:none;">
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-bookmark"></i> Gerenciador de Presets</h3>
                <button class="btn-close" id="closePresetsModal"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div class="preset-list" id="presetList">
                    <!-- Dynamic presets -->
                </div>
            </div>
        </div>
    </div>

    <div id="toastContainer" class="toast-container"></div>
    <!-- Scripts -->
    <script src="script.js?v=<?php echo $v; ?>"></script>
</body>
</html>
