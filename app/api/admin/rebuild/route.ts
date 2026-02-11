import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(req: NextRequest) {
    // Verificar autenticación
    if (!checkAuth(req)) {
        return NextResponse.json(
            { error: 'No autorizado' },
            { status: 401 }
        );
    }

    try {
        const documentsDir = path.join(process.cwd(), 'documents');
        const kbPath = path.join(process.cwd(), 'knowledge-base.json');

        const result = buildKnowledgeBase(documentsDir, kbPath);

        if (!result.success) {
            return NextResponse.json(
                { error: result.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: result.message,
            stats: result.stats
        });

    } catch (error: any) {
        console.error('Error regenerando KB:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
