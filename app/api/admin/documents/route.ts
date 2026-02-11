
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Forzar comportamiento dinámico para evitar caché de Next.js
export const dynamic = 'force-dynamic';

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

export async function GET(req: NextRequest) {
    // Verificar autenticación
    if (!checkAuth(req)) {
        return NextResponse.json(
            { error: 'No autorizado' },
            { status: 401 }
        );
    }

    try {
        const documentsDir = path.join(process.cwd(), 'documents');

        // Verificar que existe el directorio
        if (!fs.existsSync(documentsDir)) {
            return NextResponse.json({ documents: [] });
        }

        // Leer archivos .md
        const files = fs.readdirSync(documentsDir)
            .filter(f => f.endsWith('.md'))
            .map(filename => {
                const filePath = path.join(documentsDir, filename);
                const stats = fs.statSync(filePath);
                const content = fs.readFileSync(filePath, 'utf-8');

                // Preview (primeras 200 caracteres)
                const preview = content.substring(0, 200) + (content.length > 200 ? '...' : '');

                return {
                    id: filename.replace('.md', ''),
                    filename,
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    preview
                };
            })
            .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

        return NextResponse.json({ documents: files });

    } catch (error: any) {
        console.error('Error listando documentos:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
