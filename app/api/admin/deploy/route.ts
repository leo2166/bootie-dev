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

        console.log('🚀 Iniciando sincronización robusta con GitHub...');
        
        // 1. Verificar si hay cambios antes de intentar nada (independiente del idioma)
        const { stdout: statusOut } = await execAsync('git status --porcelain', { cwd: process.cwd() });
        
        if (!statusOut.trim()) {
            return NextResponse.json({ 
                success: true, 
                message: 'No hay cambios nuevos para subir. Todo está al día.',
                log: 'Git status: clean'
            });
        }

        // 2. Comandos optimizados
        const commands = [
            'git add -A', // Sincroniza TODO (scripts, documentos, imágenes)
            `git commit -m "Auto-update: ${new Date().toISOString()}"`,
            'git push origin main' // Especificamos rama para evitar ambigüedad
        ];

        let log = '';
        for (const cmd of commands) {
            console.log(`Ejecutando: ${cmd}`);
            try {
                // Añadimos un timeout de 30 segundos para evitar procesos zombies en Windows
                const { stdout, stderr } = await execAsync(cmd, { 
                    cwd: process.cwd(),
                    timeout: 30000 
                });
                log += `\n$ ${cmd}\n${stdout}\n${stderr}`;
            } catch (cmdError: any) {
                // Manejo especial para el commit por si acaso, aunque status --porcelain debería evitar esto
                if (cmd.includes('commit') && (cmdError.stdout?.includes('nothing to commit') || cmdError.stdout?.includes('no changes added'))) {
                    console.log('Aviso: Nada que commitear detectado en ejecución.');
                    continue;
                }
                
                // Si el push falla o tarda demasiado (timeout)
                throw new Error(`Error en comando [${cmd}]: ${cmdError.message}`);
            }
        }

        console.log('✅ Sincronización finalizada con éxito.');
        return NextResponse.json({ 
            success: true, 
            message: 'Sincronización total completada. Vercel actualizará el sitio pronto.', 
            log 
        });

    } catch (error: any) {
        console.error('Error desplegando:', error);
        return NextResponse.json({ error: 'Error al sincronizar con GitHub: ' + error.message }, { status: 500 });
    }
}
