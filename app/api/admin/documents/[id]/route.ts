import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { buildKnowledgeBase } from '@/lib/kb-builder';

// Autenticación robusta
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

export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    console.log(`🗑️ DELETE /api/admin/documents/${params.id} - Solicitud recibida`);

    // Verificar autenticación
    if (!checkAuth(req)) {
        console.log('❌ Autenticación DELETE fallida');
        return NextResponse.json(
            { error: 'No autorizado' },
            { status: 401 }
        );
    }

    try {
        // Decodificar ID por si tiene caracteres especiales
        const documentId = decodeURIComponent(params.id);
        console.log('🆔 Document ID decoded:', documentId);

        const documentsDir = path.join(process.cwd(), 'data', 'documents');
        const filePath = path.join(documentsDir, `${documentId}.md`);
        console.log('📂 Target Path:', filePath);

        // Verificar que el archivo existe
        if (!fs.existsSync(filePath)) {
            console.log('❌ Archivo no encontrado');
            return NextResponse.json(
                { error: 'Documento no encontrado' },
                { status: 404 }
            );
        }

        // Eliminar archivo
        console.log('⚠️ Eliminando archivo...');
        fs.unlinkSync(filePath);
        console.log('✅ Archivo eliminado del sistema de archivos');

        // Regenerar knowledge-base.json
        console.log('🔄 Regenerando KB...');
        const kbPath = path.join(process.cwd(), 'data', 'knowledge-base.json');
        const result = buildKnowledgeBase(documentsDir, kbPath);

        if (!result.success) {
            console.error('❌ Error regenerando KB:', result.message);
            return NextResponse.json(
                { error: `Error al regenerar KB: ${result.message}` },
                { status: 500 }
            );
        }

        console.log('✨ Eliminación completada exitosamente');
        return NextResponse.json({
            success: true,
            message: 'Documento eliminado exitosamente',
            stats: result.stats
        });

    } catch (error: any) {
        console.error('Error eliminando documento:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
