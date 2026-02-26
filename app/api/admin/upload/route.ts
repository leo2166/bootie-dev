import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
    convertDocxToMarkdown,
    convertPptxToMarkdown,
    convertPdfToMarkdown,
    convertImageToMarkdown,
    sanitizeFilename,
    getConverterByExtension
} from '@/lib/converters';
import { buildKnowledgeBase } from '@/lib/kb-builder';

// Forzar comportamiento dinámico
export const dynamic = 'force-dynamic';

function checkAuth(req: NextRequest): boolean {
    let authString = req.headers.get('x-admin-auth');
    if (!authString) {
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Basic ')) {
            authString = authHeader.split(' ')[1];
        }
    }

    if (!authString) return false;

    try {
        const decoded = Buffer.from(authString, 'base64').toString('utf-8');
        const [username, password] = decoded.split(':');
        const validUsername = process.env.ADMIN_USERNAME || 'admin';
        const validPassword = process.env.ADMIN_PASSWORD || 'bootie2026';
        return username === validUsername && password === validPassword;
    } catch (e) {
        return false;
    }
}

export async function POST(req: NextRequest) {
    const debugInfo: any = { steps: [] };

    try {
        debugInfo.steps.push('Request received');

        if (!checkAuth(req)) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 });
        }

        debugInfo.file = { name: file.name, size: file.size };
        console.log(`Processing file: ${file.name} (${file.size} bytes)`);

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json({ error: 'Archivo demasiado grande (máximo 10MB)' }, { status: 400 });
        }

        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'pptx' || ext === 'ppt') {
            return NextResponse.json({
                error: 'Soporte para PPTX temporalmente deshabilitado. Por favor convierta a PDF o DOCX.'
            }, { status: 400 });
        }

        const fileType = getConverterByExtension(file.name);
        if (!fileType) {
            return NextResponse.json({ error: 'Tipo de archivo no soportado o deshabilitado' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let markdownContent = '';
        debugInfo.steps.push(`Starting conversion for ${fileType}`);

        switch (fileType) {
            case 'docx':
                markdownContent = await convertDocxToMarkdown(buffer);
                break;
            case 'pptx':
                markdownContent = await convertPptxToMarkdown(buffer);
                break;
            case 'pdf':
                markdownContent = await convertPdfToMarkdown(buffer);
                break;
            case 'image':
                markdownContent = await convertImageToMarkdown(buffer);
                break;
            case 'txt':
            case 'md':
                markdownContent = buffer.toString('utf-8');
                break;
        }

        debugInfo.rawLength = markdownContent.length;
        console.log(`Raw converted length: ${markdownContent.length}`);

        // Limpieza suave - NO eliminar tags excesivamente para evitar borrar contenido útil
        // Solo quitamos etiquetas scripts/styles si las hubiera
        markdownContent = markdownContent.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
        markdownContent = markdownContent.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "");

        // Trim básico
        markdownContent = markdownContent.trim();

        debugInfo.finalLength = markdownContent.length;

        const originalName = path.parse(file.name).name;
        const safeName = sanitizeFilename(originalName);
        const outputFilename = `${safeName}.md`;
        const documentsDir = path.join(process.cwd(), 'data', 'documents');
        const outputPath = path.join(documentsDir, outputFilename);

        // Guardar archivo SIEMPRE para debug, incluso si es empty (pero lanzamos error)
        fs.writeFileSync(outputPath, markdownContent, 'utf-8');

        if (markdownContent.length < 10) {
            console.error('Content too short after conversion');
            return NextResponse.json({
                error: 'El archivo convertido está vacío o tiene muy poco texto.',
                debug: debugInfo
            }, { status: 400 });
        }

        const url = new URL(req.url);
        const skipRebuild = url.searchParams.get('skipRebuild') === 'true';

        if (skipRebuild) {
            return NextResponse.json({
                success: true,
                message: 'Fase 1 completada',
                filename: outputFilename,
                preview: markdownContent,
                debug: debugInfo
            });
        }

        const kbPath = path.join(process.cwd(), 'data', 'knowledge-base.json');
        const result = buildKnowledgeBase(documentsDir, kbPath);

        if (!result.success) {
            return NextResponse.json({ error: `Error KB: ${result.message}` }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Procesado exitosamente',
            filename: outputFilename,
            stats: result.stats
        });

    } catch (error: any) {
        console.error('Upload Error:', error);
        return NextResponse.json({
            error: error.message || 'Error interno',
            details: error.toString(),
            debug: debugInfo
        }, { status: 500 });
    }
}
