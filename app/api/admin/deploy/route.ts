import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

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
    if (!checkAuth(req)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        // En Vercel no se debe ejecutar esto (no hay git ni permisos)
        if (process.env.VERCEL) {
            return NextResponse.json({ error: 'Despliegue automático solo disponible en entorno local.' }, { status: 400 });
        }

        console.log('🚀 Iniciando sincronización con GitHub...');
        
        // Comandos de Git para subir los cambios de la KB
        const commands = [
            'git add data/documents/*',
            'git add data/knowledge-base.json',
            'git commit -m "Auto-update knowledge base from Admin Panel"',
            'git push'
        ];

        let log = '';
        for (const cmd of commands) {
            console.log(`Ejecutando: ${cmd}`);
            try {
                const { stdout, stderr } = await execAsync(cmd, { cwd: process.cwd() });
                log += `\n$ ${cmd}\n${stdout}\n${stderr}`;
            } catch (cmdError: any) {
                // git commit falla si no hay cambios, lo cual no es un error crítico
                log += `\n$ ${cmd}\nERROR: ${cmdError.message}`;
                if (cmd.includes('commit') && (cmdError.stdout?.includes('nothing to commit') || cmdError.stdout?.includes('no changes added'))) {
                    console.log('No hay cambios para commitear, continuando...');
                } else if (cmd.includes('push')) {
                    throw new Error(`Error en git push: ${cmdError.message}`);
                }
            }
        }

        console.log('✅ Sincronización finalizada con éxito.');
        return NextResponse.json({ 
            success: true, 
            message: 'Cambios subidos a GitHub exitosamente. Vercel comenzará el despliegue automáticamente.', 
            log 
        });

    } catch (error: any) {
        console.error('Error desplegando:', error);
        return NextResponse.json({ error: 'Error al sincronizar con GitHub: ' + error.message }, { status: 500 });
    }
}
