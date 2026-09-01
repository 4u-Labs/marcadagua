<?php
/**
 * WaterMark Pro - Processador de Marca d'água v2.0
 * Suporta: Logo, Texto, Timestamp, Redimensionamento, Múltiplos formatos
 */

// Configurações
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('memory_limit', '512M');
set_time_limit(180);

// Headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Constantes
define('UPLOAD_DIR', 'temp/');
define('OUTPUT_DIR', 'output/');
define('MAX_FILE_SIZE', 10 * 1024 * 1024);
define('ALLOWED_TYPES', ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

// Criar diretórios
foreach ([UPLOAD_DIR, OUTPUT_DIR, 'fonts/'] as $dir) {
    if (!file_exists($dir)) {
        @mkdir($dir, 0755, true);
    }
}

// Limpar arquivos antigos (mais de 1 hora)
cleanOldFiles(UPLOAD_DIR, 3600);
cleanOldFiles(OUTPUT_DIR, 3600);

/**
 * Função principal
 */
function processWatermark() {
    try {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            throw new Exception('Método não permitido');
        }
        
        // Validar imagem
        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            $errorMsg = getUploadErrorMessage($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE);
            throw new Exception($errorMsg);
        }
        
        $imageFile = $_FILES['image'];
        
        // Validar tipo
        $imageInfo = @getimagesize($imageFile['tmp_name']);
        if ($imageInfo === false) {
            throw new Exception('Arquivo não é uma imagem válida');
        }
        
        $mimeType = $imageInfo['mime'];
        if (!in_array($mimeType, ALLOWED_TYPES)) {
            throw new Exception('Tipo não permitido: ' . $mimeType);
        }
        
        // Validar tamanho
        if ($imageFile['size'] > MAX_FILE_SIZE) {
            throw new Exception('Arquivo muito grande (máx. 10MB)');
        }
        
        // Obter configurações
        $settings = json_decode($_POST['settings'] ?? '{}', true) ?: [];
        $textWatermarks = json_decode($_POST['textWatermarks'] ?? '[]', true) ?: [];
        
        // Carregar imagem
        $image = loadImage($imageFile['tmp_name'], $mimeType);
        if (!$image) {
            throw new Exception('Erro ao carregar imagem');
        }
        
        $width = imagesx($image);
        $height = imagesy($image);
        
        // Redimensionar se necessário
        if (!empty($settings['resizeEnabled'])) {
            $image = resizeImage($image, $settings);
            $width = imagesx($image);
            $height = imagesy($image);
        }
        
        // Ativar alpha blending
        imagealphablending($image, true);
        imagesavealpha($image, true);
        
        // Aplicar marca d'água de logo
        if (!empty($settings['useLogo']) && isset($_FILES['logo']) && $_FILES['logo']['error'] === UPLOAD_ERR_OK) {
            $logoInfo = @getimagesize($_FILES['logo']['tmp_name']);
            if ($logoInfo !== false && in_array($logoInfo['mime'], ALLOWED_TYPES)) {
                $logo = loadImage($_FILES['logo']['tmp_name'], $logoInfo['mime']);
                if ($logo) {
                    $image = applyLogoWatermark($image, $logo, $settings);
                    imagedestroy($logo);
                }
            }
        }
        
        // Aplicar marca d'água de texto
        if (!empty($settings['useText']) && !empty($textWatermarks)) {
            $image = applyTextWatermarks($image, $textWatermarks, $settings);
        }
        
        // Aplicar timestamp
        if (!empty($settings['useTimestamp'])) {
            $image = applyTimestamp($image, $settings);
        }
        
        // Gerar nome do arquivo
        $originalName = pathinfo($imageFile['name'], PATHINFO_FILENAME);
        $prefix = sanitizeFilename($settings['filePrefix'] ?? '');
        $suffix = sanitizeFilename($settings['fileSuffix'] ?? '_wm');
        $format = $settings['outputFormat'] ?? 'jpg';
        
        $outputName = $prefix . sanitizeFilename($originalName) . $suffix . '_' . uniqid() . '.' . $format;
        $outputPath = OUTPUT_DIR . $outputName;
        
        // Qualidade
        $quality = isset($settings['outputQuality']) ? intval($settings['outputQuality']) : 90;
        $quality = max(50, min(100, $quality));
        
        // Salvar imagem no formato escolhido
        $saved = saveImage($image, $outputPath, $format, $quality);
        imagedestroy($image);
        
        if (!$saved) {
            throw new Exception('Erro ao salvar imagem');
        }
        
        // Retornar sucesso
        echo json_encode([
            'success' => true,
            'imageUrl' => $outputPath,
            'downloadName' => $prefix . $originalName . $suffix . '.' . $format
        ]);
        
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

/**
 * Mensagens de erro de upload
 */
function getUploadErrorMessage($code) {
    $messages = [
        UPLOAD_ERR_INI_SIZE => 'Arquivo excede limite do servidor',
        UPLOAD_ERR_FORM_SIZE => 'Arquivo excede limite do formulário',
        UPLOAD_ERR_PARTIAL => 'Upload incompleto',
        UPLOAD_ERR_NO_FILE => 'Nenhum arquivo enviado',
        UPLOAD_ERR_NO_TMP_DIR => 'Pasta temporária não encontrada',
        UPLOAD_ERR_CANT_WRITE => 'Falha ao escrever arquivo',
        UPLOAD_ERR_EXTENSION => 'Upload bloqueado'
    ];
    return $messages[$code] ?? 'Erro desconhecido no upload';
}

/**
 * Carrega imagem
 */
function loadImage($path, $mimeType) {
    switch ($mimeType) {
        case 'image/jpeg':
        case 'image/jpg':
            return @imagecreatefromjpeg($path);
        case 'image/png':
            $img = @imagecreatefrompng($path);
            if ($img) {
                $width = imagesx($img);
                $height = imagesy($img);
                $truecolor = imagecreatetruecolor($width, $height);
                imagealphablending($truecolor, false);
                imagesavealpha($truecolor, true);
                $transparent = imagecolorallocatealpha($truecolor, 255, 255, 255, 0);
                imagefill($truecolor, 0, 0, $transparent);
                imagealphablending($truecolor, true);
                imagecopy($truecolor, $img, 0, 0, 0, 0, $width, $height);
                imagedestroy($img);
                return $truecolor;
            }
            return false;
        case 'image/webp':
            return @imagecreatefromwebp($path);
        default:
            return false;
    }
}

/**
 * Salva imagem no formato especificado
 */
function saveImage($image, $path, $format, $quality) {
    switch ($format) {
        case 'png':
            // PNG usa compressão de 0-9, converter de qualidade
            $compression = max(0, min(9, intval((100 - $quality) / 10)));
            return imagepng($image, $path, $compression);
        case 'webp':
            return imagewebp($image, $path, $quality);
        case 'jpg':
        default:
            return imagejpeg($image, $path, $quality);
    }
}

/**
 * Redimensiona imagem
 */
function resizeImage($image, $settings) {
    $width = imagesx($image);
    $height = imagesy($image);
    
    $maxWidth = isset($settings['maxWidth']) ? intval($settings['maxWidth']) : 1920;
    $maxHeight = isset($settings['maxHeight']) ? intval($settings['maxHeight']) : 1080;
    $maintainAspect = isset($settings['maintainAspect']) ? $settings['maintainAspect'] : true;
    
    // Verificar se precisa redimensionar
    if ($width <= $maxWidth && $height <= $maxHeight) {
        return $image;
    }
    
    if ($maintainAspect) {
        $ratio = min($maxWidth / $width, $maxHeight / $height);
        $newWidth = intval($width * $ratio);
        $newHeight = intval($height * $ratio);
    } else {
        $newWidth = min($width, $maxWidth);
        $newHeight = min($height, $maxHeight);
    }
    
    $resized = imagecreatetruecolor($newWidth, $newHeight);
    imagealphablending($resized, false);
    imagesavealpha($resized, true);
    $transparent = imagecolorallocatealpha($resized, 0, 0, 0, 127);
    imagefill($resized, 0, 0, $transparent);
    imagealphablending($resized, true);
    
    imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
    imagedestroy($image);
    
    return $resized;
}

/**
 * Aplica marca d'água de logo
 */
function applyLogoWatermark($image, $logo, $settings) {
    $imgWidth = imagesx($image);
    $imgHeight = imagesy($image);
    $logoWidth = imagesx($logo);
    $logoHeight = imagesy($logo);
    
    if ($logoWidth <= 0 || $logoHeight <= 0) return $image;
    
    // Configurações
    $scale = max(0.05, min(1, ($settings['logoScale'] ?? 30) / 100));
    $opacity = max(5, min(100, $settings['logoOpacity'] ?? 50));
    $margin = max(0, min(500, $settings['logoMargin'] ?? 20));
    $rotation = $settings['logoRotation'] ?? 0;
    $spacing = max(10, min(500, $settings['logoSpacing'] ?? 50));
    $position = $settings['logoPosition'] ?? 'bottom-right';
    
    // Redimensionar logo
    $newLogoWidth = max(1, intval($imgWidth * $scale));
    $newLogoHeight = max(1, intval($logoHeight * ($newLogoWidth / $logoWidth)));
    
    $resizedLogo = imagecreatetruecolor($newLogoWidth, $newLogoHeight);
    imagealphablending($resizedLogo, false);
    imagesavealpha($resizedLogo, true);
    $transparent = imagecolorallocatealpha($resizedLogo, 0, 0, 0, 127);
    imagefill($resizedLogo, 0, 0, $transparent);
    imagecopyresampled($resizedLogo, $logo, 0, 0, 0, 0, $newLogoWidth, $newLogoHeight, $logoWidth, $logoHeight);
    
    // Aplicar opacidade
    $resizedLogo = setImageOpacity($resizedLogo, $opacity);
    
    // Rotação
    if ($rotation != 0) {
        $transparent = imagecolorallocatealpha($resizedLogo, 0, 0, 0, 127);
        $rotated = imagerotate($resizedLogo, -$rotation, $transparent);
        if ($rotated) {
            imagedestroy($resizedLogo);
            $resizedLogo = $rotated;
            imagesavealpha($resizedLogo, true);
        }
        $newLogoWidth = imagesx($resizedLogo);
        $newLogoHeight = imagesy($resizedLogo);
    }
    
    // Posicionamento
    if ($position === 'repeat') {
        $spacingX = $newLogoWidth + $spacing;
        $spacingY = $newLogoHeight + $spacing;
        
        for ($y = $margin; $y < $imgHeight; $y += $spacingY) {
            for ($x = $margin; $x < $imgWidth; $x += $spacingX) {
                imagecopymerge_alpha($image, $resizedLogo, $x, $y, 0, 0, $newLogoWidth, $newLogoHeight, 100);
            }
        }
    } elseif ($position === 'custom') {
        $posX = isset($settings['logoPosX']) ? intval($settings['logoPosX']) : 50;
        $posY = isset($settings['logoPosY']) ? intval($settings['logoPosY']) : 50;
        $x = intval(($imgWidth - $newLogoWidth) * ($posX / 100));
        $y = intval(($imgHeight - $newLogoHeight) * ($posY / 100));
        imagecopymerge_alpha($image, $resizedLogo, $x, $y, 0, 0, $newLogoWidth, $newLogoHeight, 100);
    } else {
        list($x, $y) = calculatePosition($position, $imgWidth, $imgHeight, $newLogoWidth, $newLogoHeight, $margin);
        imagecopymerge_alpha($image, $resizedLogo, $x, $y, 0, 0, $newLogoWidth, $newLogoHeight, 100);
    }
    
    imagedestroy($resizedLogo);
    return $image;
}

/**
 * Mescla imagens com transparência
 */
function imagecopymerge_alpha($dst_im, $src_im, $dst_x, $dst_y, $src_x, $src_y, $src_w, $src_h, $pct) {
    $src_w = min($src_w, imagesx($src_im) - $src_x);
    $src_h = min($src_h, imagesy($src_im) - $src_y);
    
    if ($src_w <= 0 || $src_h <= 0) return;
    
    $cut = imagecreatetruecolor($src_w, $src_h);
    imagealphablending($cut, false);
    imagesavealpha($cut, true);
    
    imagecopy($cut, $dst_im, 0, 0, $dst_x, $dst_y, $src_w, $src_h);
    imagealphablending($cut, true);
    imagecopy($cut, $src_im, 0, 0, $src_x, $src_y, $src_w, $src_h);
    imagecopy($dst_im, $cut, $dst_x, $dst_y, 0, 0, $src_w, $src_h);
    
    imagedestroy($cut);
}

/**
 * Aplica marcas d'água de texto
 */
function applyTextWatermarks($image, $textWatermarks, $settings) {
    $imgWidth = imagesx($image);
    $imgHeight = imagesy($image);
    $repeatDiagonal = !empty($settings['textRepeatDiagonal']);
    
    foreach ($textWatermarks as $textConfig) {
        $text = $textConfig['content'] ?? '';
        if (empty(trim($text))) continue;
        
        $fontSize = max(8, min(200, intval($textConfig['size'] ?? 24)));
        $font = findFont($textConfig['font'] ?? 'Arial');
        $color = hexToRgb($textConfig['color'] ?? '#ffffff');
        $opacity = max(5, min(100, intval($textConfig['opacity'] ?? 50)));
        $rotation = intval($textConfig['rotation'] ?? 0);
        $position = $textConfig['position'] ?? 'bottom-right';
        $shadow = !empty($textConfig['shadow']);
        $outline = !empty($textConfig['outline']);
        $bold = !empty($textConfig['bold']);
        
        // Alpha (0 = opaco, 127 = transparente)
        $alpha = intval((100 - $opacity) * 127 / 100);
        $textColor = imagecolorallocatealpha($image, $color['r'], $color['g'], $color['b'], $alpha);
        $shadowColor = imagecolorallocatealpha($image, 0, 0, 0, min(127, $alpha + 30));
        $outlineColor = imagecolorallocatealpha($image, 0, 0, 0, min(127, $alpha + 20));
        
        if (is_string($font) && file_exists($font)) {
            // Usar fonte TrueType
            $bbox = imagettfbbox($fontSize, 0, $font, $text);
            $textWidth = abs($bbox[4] - $bbox[0]);
            $textHeight = abs($bbox[5] - $bbox[1]);
            
            if ($repeatDiagonal) {
                $spacingX = max(50, $textWidth + 100);
                $spacingY = max(40, $textHeight + 80);
                $diagRotation = -30;
                
                for ($y = -$imgHeight; $y < $imgHeight * 2; $y += $spacingY) {
                    for ($x = -$imgWidth; $x < $imgWidth * 2; $x += $spacingX) {
                        $offsetX = $x + ($y / 2);
                        
                        if ($shadow) {
                            imagettftext($image, $fontSize, $diagRotation, intval($offsetX + 2), intval($y + 2), $shadowColor, $font, $text);
                        }
                        if ($outline) {
                            for ($ox = -1; $ox <= 1; $ox++) {
                                for ($oy = -1; $oy <= 1; $oy++) {
                                    if ($ox != 0 || $oy != 0) {
                                        imagettftext($image, $fontSize, $diagRotation, intval($offsetX + $ox), intval($y + $oy), $outlineColor, $font, $text);
                                    }
                                }
                            }
                        }
                        imagettftext($image, $fontSize, $diagRotation, intval($offsetX), intval($y), $textColor, $font, $text);
                    }
                }
            } else {
                $margin = 30;
                list($x, $y) = calculatePosition($position, $imgWidth, $imgHeight, $textWidth, $textHeight, $margin);
                $y += $textHeight;
                
                if ($shadow) {
                    imagettftext($image, $fontSize, $rotation, intval($x + 2), intval($y + 2), $shadowColor, $font, $text);
                }
                if ($outline) {
                    for ($ox = -1; $ox <= 1; $ox++) {
                        for ($oy = -1; $oy <= 1; $oy++) {
                            if ($ox != 0 || $oy != 0) {
                                imagettftext($image, $fontSize, $rotation, intval($x + $ox), intval($y + $oy), $outlineColor, $font, $text);
                            }
                        }
                    }
                }
                imagettftext($image, $fontSize, $rotation, intval($x), intval($y), $textColor, $font, $text);
            }
        } else {
            // Usar fonte built-in
            $builtInFont = max(1, min(5, intval($fontSize / 8)));
            $charWidth = imagefontwidth($builtInFont);
            $charHeight = imagefontheight($builtInFont);
            $textWidth = strlen($text) * $charWidth;
            $textHeight = $charHeight;
            
            if ($repeatDiagonal) {
                $spacingX = max(50, $textWidth + 100);
                $spacingY = max(40, $textHeight + 80);
                
                for ($y = 0; $y < $imgHeight; $y += $spacingY) {
                    for ($x = -$textWidth; $x < $imgWidth + $textWidth; $x += $spacingX) {
                        $offsetX = $x + ($y / 3);
                        
                        if ($shadow) {
                            imagestring($image, $builtInFont, intval($offsetX + 1), intval($y + 1), $text, $shadowColor);
                        }
                        imagestring($image, $builtInFont, intval($offsetX), intval($y), $text, $textColor);
                    }
                }
            } else {
                $margin = 30;
                list($x, $y) = calculatePosition($position, $imgWidth, $imgHeight, $textWidth, $textHeight, $margin);
                
                if ($shadow) {
                    imagestring($image, $builtInFont, intval($x + 1), intval($y + 1), $text, $shadowColor);
                }
                imagestring($image, $builtInFont, intval($x), intval($y), $text, $textColor);
            }
        }
    }
    
    return $image;
}

/**
 * Aplica timestamp
 */
function applyTimestamp($image, $settings) {
    $imgWidth = imagesx($image);
    $imgHeight = imagesy($image);
    
    $timestamp = $settings['timestamp'] ?? date('d/m/Y H:i');
    $color = hexToRgb($settings['timestampColor'] ?? '#ffffff');
    $fontSize = max(8, min(72, intval($settings['timestampSize'] ?? 16)));
    $position = $settings['timestampPosition'] ?? 'bottom-left';
    $opacity = max(10, min(100, intval($settings['timestampOpacity'] ?? 80)));
    
    $alpha = intval((100 - $opacity) * 127 / 100);
    $textColor = imagecolorallocatealpha($image, $color['r'], $color['g'], $color['b'], $alpha);
    $shadowColor = imagecolorallocatealpha($image, 0, 0, 0, min(127, $alpha + 30));
    
    $font = findFont('Arial');
    $margin = 20;
    
    if (is_string($font) && file_exists($font)) {
        $bbox = imagettfbbox($fontSize, 0, $font, $timestamp);
        $textWidth = abs($bbox[4] - $bbox[0]);
        $textHeight = abs($bbox[5] - $bbox[1]);
        
        list($x, $y) = calculatePosition($position, $imgWidth, $imgHeight, $textWidth, $textHeight, $margin);
        $y += $textHeight;
        
        imagettftext($image, $fontSize, 0, intval($x + 1), intval($y + 1), $shadowColor, $font, $timestamp);
        imagettftext($image, $fontSize, 0, intval($x), intval($y), $textColor, $font, $timestamp);
    } else {
        $builtInFont = max(1, min(5, intval($fontSize / 8)));
        $textWidth = strlen($timestamp) * imagefontwidth($builtInFont);
        $textHeight = imagefontheight($builtInFont);
        
        list($x, $y) = calculatePosition($position, $imgWidth, $imgHeight, $textWidth, $textHeight, $margin);
        
        imagestring($image, $builtInFont, intval($x + 1), intval($y + 1), $timestamp, $shadowColor);
        imagestring($image, $builtInFont, intval($x), intval($y), $timestamp, $textColor);
    }
    
    return $image;
}

/**
 * Define opacidade de imagem
 */
function setImageOpacity($image, $opacity) {
    $width = imagesx($image);
    $height = imagesy($image);
    
    $newImage = imagecreatetruecolor($width, $height);
    imagealphablending($newImage, false);
    imagesavealpha($newImage, true);
    $transparent = imagecolorallocatealpha($newImage, 0, 0, 0, 127);
    imagefill($newImage, 0, 0, $transparent);
    
    for ($x = 0; $x < $width; $x++) {
        for ($y = 0; $y < $height; $y++) {
            $rgba = imagecolorat($image, $x, $y);
            $alpha = ($rgba >> 24) & 0x7F;
            $r = ($rgba >> 16) & 0xFF;
            $g = ($rgba >> 8) & 0xFF;
            $b = $rgba & 0xFF;
            
            $newAlpha = intval($alpha + ((127 - $alpha) * (100 - $opacity) / 100));
            $newAlpha = min(127, max(0, $newAlpha));
            
            $newColor = imagecolorallocatealpha($newImage, $r, $g, $b, $newAlpha);
            imagesetpixel($newImage, $x, $y, $newColor);
        }
    }
    
    imagedestroy($image);
    return $newImage;
}

/**
 * Calcula posição
 */
function calculatePosition($position, $containerWidth, $containerHeight, $elementWidth, $elementHeight, $margin) {
    switch ($position) {
        case 'top-left':
            return [$margin, $margin];
        case 'top-right':
            return [max(0, $containerWidth - $elementWidth - $margin), $margin];
        case 'bottom-left':
            return [$margin, max(0, $containerHeight - $elementHeight - $margin)];
        case 'bottom-right':
            return [max(0, $containerWidth - $elementWidth - $margin), max(0, $containerHeight - $elementHeight - $margin)];
        case 'center':
            return [max(0, ($containerWidth - $elementWidth) / 2), max(0, ($containerHeight - $elementHeight) / 2)];
        default:
            return [$margin, $margin];
    }
}

/**
 * Encontra fonte
 */
function findFont($fontName) {
    $fontPaths = [
        // Linux
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
        '/usr/share/fonts/TTF/DejaVuSans.ttf',
        '/usr/share/fonts/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf',
        // Windows
        'C:/Windows/Fonts/arial.ttf',
        'C:/Windows/Fonts/verdana.ttf',
        // macOS
        '/Library/Fonts/Arial.ttf',
        '/System/Library/Fonts/Helvetica.ttf',
        '/System/Library/Fonts/Supplemental/Arial.ttf',
        // Local
        __DIR__ . '/fonts/arial.ttf',
        __DIR__ . '/fonts/Arial.ttf',
        __DIR__ . '/fonts/DejaVuSans.ttf',
        __DIR__ . '/fonts/Roboto-Regular.ttf',
        __DIR__ . '/fonts/OpenSans-Regular.ttf',
    ];
    
    foreach ($fontPaths as $path) {
        if (file_exists($path) && is_readable($path)) {
            return $path;
        }
    }
    
    return 5;
}

/**
 * Hex para RGB
 */
function hexToRgb($hex) {
    $hex = ltrim($hex, '#');
    if (strlen($hex) === 3) {
        $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
    }
    if (strlen($hex) !== 6 || !ctype_xdigit($hex)) {
        return ['r' => 255, 'g' => 255, 'b' => 255];
    }
    return [
        'r' => hexdec(substr($hex, 0, 2)),
        'g' => hexdec(substr($hex, 2, 2)),
        'b' => hexdec(substr($hex, 4, 2))
    ];
}

/**
 * Sanitiza nome de arquivo
 */
function sanitizeFilename($filename) {
    $filename = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $filename);
    $filename = preg_replace('/_+/', '_', $filename);
    return substr(trim($filename, '_'), 0, 50);
}

/**
 * Limpa arquivos antigos
 */
function cleanOldFiles($dir, $maxAge) {
    if (!is_dir($dir)) return;
    $files = @glob($dir . '*');
    if (!$files) return;
    $now = time();
    
    foreach ($files as $file) {
        if (is_file($file) && ($now - @filemtime($file)) > $maxAge) {
            @unlink($file);
        }
    }
}

// Executar
processWatermark();
