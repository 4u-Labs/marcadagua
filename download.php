<?php
/**
 * WaterMark Pro - Download Handler
 * Este arquivo gerencia o download individual e em lote (ZIP) das imagens processadas
 */

// Configurações
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Diretório de saída
define('OUTPUT_DIR', 'output/');
define('TEMP_DIR', 'temp/');

// Criar diretórios se não existirem
if (!file_exists(TEMP_DIR)) mkdir(TEMP_DIR, 0755, true);

/**
 * Processa requisição de download
 */
function handleDownload() {
    // Verificar método
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        die('Método não permitido');
    }
    
    // Obter dados JSON
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['files']) || !is_array($data['files'])) {
        http_response_code(400);
        die('Dados inválidos');
    }
    
    $files = $data['files'];
    
    if (empty($files)) {
        http_response_code(400);
        die('Nenhum arquivo para baixar');
    }
    
    // Verificar se ZipArchive está disponível
    if (!class_exists('ZipArchive')) {
        // Fallback: baixar primeiro arquivo apenas
        downloadSingleFile($files[0]);
        return;
    }
    
    // Criar arquivo ZIP
    $zipName = 'watermark_images_' . date('Y-m-d_H-i-s') . '.zip';
    $zipPath = TEMP_DIR . $zipName;
    
    $zip = new ZipArchive();
    
    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        http_response_code(500);
        die('Erro ao criar arquivo ZIP');
    }
    
    // Adicionar arquivos ao ZIP
    $addedFiles = 0;
    foreach ($files as $file) {
        $filePath = $file['url'];
        $fileName = $file['name'];
        
        // Verificar se arquivo existe e é seguro
        if (isValidFile($filePath)) {
            // Sanitizar nome do arquivo
            $safeName = sanitizeFilename($fileName);
            
            // Evitar duplicatas
            $finalName = $safeName;
            $counter = 1;
            while ($zip->locateName($finalName) !== false) {
                $pathInfo = pathinfo($safeName);
                $finalName = $pathInfo['filename'] . '_' . $counter . '.' . ($pathInfo['extension'] ?? 'jpg');
                $counter++;
            }
            
            $zip->addFile($filePath, $finalName);
            $addedFiles++;
        }
    }
    
    $zip->close();
    
    if ($addedFiles === 0) {
        @unlink($zipPath);
        http_response_code(400);
        die('Nenhum arquivo válido encontrado');
    }
    
    // Enviar arquivo ZIP
    if (file_exists($zipPath)) {
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="' . $zipName . '"');
        header('Content-Length: ' . filesize($zipPath));
        header('Cache-Control: no-cache, must-revalidate');
        header('Pragma: no-cache');
        
        readfile($zipPath);
        
        // Deletar arquivo ZIP após envio
        @unlink($zipPath);
        exit;
    }
    
    http_response_code(500);
    die('Erro ao gerar arquivo ZIP');
}

/**
 * Download de arquivo único
 */
function downloadSingleFile($file) {
    $filePath = $file['url'];
    $fileName = $file['name'];
    
    if (!isValidFile($filePath)) {
        http_response_code(404);
        die('Arquivo não encontrado');
    }
    
    $mimeType = mime_content_type($filePath);
    
    header('Content-Type: ' . $mimeType);
    header('Content-Disposition: attachment; filename="' . sanitizeFilename($fileName) . '"');
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: no-cache, must-revalidate');
    
    readfile($filePath);
    exit;
}

/**
 * Verifica se o arquivo é válido e seguro
 */
function isValidFile($path) {
    // Verificar se o caminho está dentro do diretório permitido
    $realPath = realpath($path);
    $outputRealPath = realpath(OUTPUT_DIR);
    
    if (!$realPath || !$outputRealPath) {
        return false;
    }
    
    // Verificar se está dentro do diretório de output
    if (strpos($realPath, $outputRealPath) !== 0) {
        return false;
    }
    
    // Verificar se é um arquivo
    if (!is_file($realPath)) {
        return false;
    }
    
    // Verificar extensão
    $extension = strtolower(pathinfo($realPath, PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    if (!in_array($extension, $allowedExtensions)) {
        return false;
    }
    
    // Verificar MIME type
    $mimeType = mime_content_type($realPath);
    $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!in_array($mimeType, $allowedMimes)) {
        return false;
    }
    
    return true;
}

/**
 * Sanitiza nome de arquivo
 */
function sanitizeFilename($filename) {
    // Remover path traversal
    $filename = basename($filename);
    
    // Manter apenas caracteres seguros
    $filename = preg_replace('/[^a-zA-Z0-9_\-\.]/', '_', $filename);
    
    // Garantir extensão
    if (!preg_match('/\.(jpg|jpeg|png|webp)$/i', $filename)) {
        $filename .= '.jpg';
    }
    
    return $filename;
}

/**
 * Limpa arquivos temporários antigos
 */
function cleanupOldFiles() {
    $dirs = [OUTPUT_DIR, TEMP_DIR];
    $maxAge = 3600; // 1 hora
    $now = time();
    
    foreach ($dirs as $dir) {
        if (!is_dir($dir)) continue;
        
        $files = glob($dir . '*');
        foreach ($files as $file) {
            if (is_file($file) && ($now - filemtime($file)) > $maxAge) {
                @unlink($file);
            }
        }
    }
}

// Limpar arquivos antigos ocasionalmente (1% das requisições)
if (rand(1, 100) === 1) {
    cleanupOldFiles();
}

// Executar
handleDownload();
