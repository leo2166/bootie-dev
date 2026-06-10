'use client';

import { useState, useEffect } from 'react';

interface Doc {
    id: string;
    filename: string;
    size: number;
    modified: string;
    preview: string;
}

// Credenciales fijas — único administrador, sin pantalla de login
const getAuthHeader = () => btoa('admin:bootie2026');

export default function AdminPage() {
    const [documents, setDocuments] = useState<Doc[]>([]);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Estados para el flujo multi-etapa
    const [uploadPhase, setUploadPhase] = useState<'IDLE' | 'PHASE_1_PROCESSING' | 'PHASE_1_COMPLETE' | 'PHASE_2_PROCESSING' | 'COMPLETE'>('IDLE');
    const [previewContent, setPreviewContent] = useState('');
    const [uploadedFilename, setUploadedFilename] = useState('');
    const [uploadedFileId, setUploadedFileId] = useState('');

    useEffect(() => {
        loadDocuments();
    }, []);


    const loadDocuments = async () => {
        try {
            const res = await fetch('/api/admin/documents', {
                headers: {
                    'x-admin-auth': getAuthHeader()
                }
            });
            const data = await res.json();
            if (res.ok && data.documents) {
                setDocuments(data.documents);
            } else {
                console.error('Error en respuesta de documentos:', data.error);
                setDocuments([]);
                setMessage({ type: 'error', text: data.error || 'No se pudieron cargar los documentos' });
            }
        } catch (error) {
            console.error('Error cargando documentos:', error);
        }
    };

    // FASE 1: Subir y Convertir (sin regenerar KB)
    const handleUploadPhase1 = async (file: File) => {
        setUploadPhase('PHASE_1_PROCESSING');
        setMessage(null);
        setPreviewContent('');

        console.log('🚀 Iniciando Fase 1: Subida y Conversión');

        try {
            const formData = new FormData();
            formData.append('file', file);

            // Añadir parametro skipRebuild=true
            const res = await fetch('/api/admin/upload?skipRebuild=true', {
                method: 'POST',
                headers: {
                    'x-admin-auth': getAuthHeader()
                },
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                console.log('✅ Fase 1 completada');
                setPreviewContent(data.preview || 'No se pudo generar previsualización.');
                setUploadedFilename(data.filename);
                setUploadedFileId(data.filename.replace('.md', '')); // Asumimos ID básico para eliminación si cancela
                setUploadPhase('PHASE_1_COMPLETE');

                if (data.savedToDisk === false) {
                    setMessage({
                        type: 'error',
                        text: '⚠️ Previsualización generada, pero este entorno (Vercel) no puede guardar archivos. Para integrar documentos, usa el panel local → "Subir a Vercel".'
                    });
                } else {
                    setMessage({ type: 'success', text: '✅ Fase 1: Archivo convertido. Por favor revisa y confirma.' });
                }
            } else {
                console.error('❌ Error Fase 1:', data.error);
                setMessage({ type: 'error', text: data.error || 'Error en Fase 1' });
                setUploadPhase('IDLE');
            }
        } catch (error) {
            console.error('💥 Excepción Fase 1:', error);
            setMessage({ type: 'error', text: 'Error de conexión en Fase 1' });
            setUploadPhase('IDLE');
        }
    };

    // FASE 2: Confirmar e Integrar a KB
    const handlePhase2Integrate = async () => {
        setUploadPhase('PHASE_2_PROCESSING');
        setMessage(null);
        console.log('🚀 Iniciando Fase 2: Integración a KB');

        try {
            // Llamamos al endpoint de rebuild para integrar cambios
            const res = await fetch('/api/admin/rebuild', {
                method: 'POST',
                headers: {
                    'x-admin-auth': getAuthHeader()
                }
            });

            const data = await res.json();

            if (res.ok) {
                console.log('✅ Fase 2 completada');
                setMessage({ type: 'success', text: `🎉 Proceso completado: ${uploadedFilename} integrado a la Base de Conocimiento.` });
                setUploadPhase('IDLE'); // Reset para siguiente archivo
                setPreviewContent('');
                loadDocuments();
            } else {
                setMessage({ type: 'error', text: `Error en Fase 2: ${data.error || data.message || 'Error desconocido'}` });
                setUploadPhase('PHASE_1_COMPLETE'); // Permitir reintentar
            }
        } catch (error) {
            console.error('💥 Excepción Fase 2:', error);
            setMessage({ type: 'error', text: 'Error de conexión en Fase 2' });
            setUploadPhase('PHASE_1_COMPLETE');
        }
    };

    // Cancelar proceso (Borrar el archivo subido en Fase 1)
    const handleCancelPhase1 = async () => {
        if (!uploadedFileId) {
            setUploadPhase('IDLE');
            return;
        }

        if (!confirm('¿Estás seguro de cancelar? Se eliminará el archivo convertido.')) return;

        try {
            console.log('🗑️ Cancelando proceso, eliminando archivo:', uploadedFileId);
            await fetch(`/api/admin/documents/${encodeURIComponent(uploadedFileId)}`, {
                method: 'DELETE',
                headers: { 'x-admin-auth': getAuthHeader() }
            });

            setMessage({ type: 'success', text: 'Proceso cancelado y archivo eliminado.' });
            setUploadPhase('IDLE');
            setPreviewContent('');
        } catch (error) {
            console.error('Error limpiando archivo:', error);
            setUploadPhase('IDLE');
        }
    };

    const handleDelete = async (id: string) => {
        console.log('🗑️ handleDelete solicitado para:', id);
        if (!confirm(`¿Eliminar ${id}.md?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/documents/${encodeURIComponent(id)}`, {
                method: 'DELETE',
                headers: {
                    'x-admin-auth': getAuthHeader()
                }
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Documento eliminado' });
                setDocuments(prev => prev.filter(doc => doc.id !== id));
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                setMessage({ type: 'error', text: data.error });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error al eliminar' });
        }
    };

    const handleRebuild = async () => {
        setMessage(null);
        try {
            const res = await fetch('/api/admin/rebuild', {
                method: 'POST',
                headers: {
                    'x-admin-auth': getAuthHeader()
                }
            });
            const data = await res.json();
            if (res.ok) {
                const totalDocs = data.stats?.totalDocs ?? data.stats?.documentCount ?? 0;
                const totalChunks = data.stats?.totalChunks ?? 0;
                setMessage({ type: 'success', text: `✅ KB reconstruida. ${totalDocs} docs, ${totalChunks} chunks.` });
            } else {
                setMessage({ type: 'error', text: data.error || data.message || 'Error desconocido' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error reconstruyendo KB' });
        }
    };

    const handleDeploy = async () => {
        if (!confirm('¿Estás seguro de que deseas subir los cambios a GitHub? Esto actualizará la versión pública en Vercel.')) {
            return;
        }

        setMessage({ type: 'success', text: 'Iniciando sincronización con GitHub... Por favor espera.' });
        try {
            const res = await fetch('/api/admin/deploy', {
                method: 'POST',
                headers: {
                    'x-admin-auth': getAuthHeader()
                }
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: `✅ ${data.message}` });
            } else {
                setMessage({ type: 'error', text: data.error || 'Error en la sincronización' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión al intentar sincronizar' });
        }
    };


    return (
        <div className="min-h-screen p-8 bg-gray-900 text-gray-100 scanlines font-mono">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex justify-between items-center border-b border-purple-500/30 pb-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                            PANEL DE CONTROL
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Gestión de Conocimiento v2.1</p>
                    </div>

                </header>

                {message && (
                    <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-900/20 border-green-500/50 text-green-200' : 'bg-red-900/20 border-red-500/50 text-red-200'} animate-fade-in`}>
                        {message.text}
                    </div>
                )}

                {/* ZONA DE CARGA MULTI-ETAPA */}
                <section className="bg-gray-800/50 border border-purple-500/20 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="text-purple-400">⚡</span> Nuevo Documento
                    </h2>

                    {uploadPhase === 'IDLE' && (
                        <div
                            className={`border-2 border-dashed border-gray-600 rounded-lg p-12 text-center transition-all cursor-pointer hover:border-purple-500 hover:bg-gray-700/30`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files[0];
                                if (file) handleUploadPhase1(file);
                            }}
                            onClick={() => document.getElementById('fileInput')?.click()}
                        >
                            <input
                                type="file"
                                id="fileInput"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleUploadPhase1(e.target.files[0])}
                                accept=".docx,.pdf,.pptx,.txt,.md,.jpg,.jpeg,.png"
                            />
                            <div className="text-4xl mb-4">📂</div>
                            <p className="text-gray-300 font-medium">Arrastra archivos aquí o haz clic para seleccionar</p>
                            <p className="text-xs text-gray-500 mt-2">Formatos: PPTX, DOCX, PDF, TXT, MD (máx 10MB)</p>
                        </div>
                    )}

                    {uploadPhase === 'PHASE_1_PROCESSING' && (
                        <div className="text-center py-12">
                            <div className="animate-spin text-4xl mb-4">⚙️</div>
                            <p className="text-lg font-bold text-purple-300">Fase 1: Convirtiendo Documento...</p>
                            <p className="text-sm text-gray-500">Extrayendo texto, imágenes y tablas.</p>
                        </div>
                    )}

                    {uploadPhase === 'PHASE_1_COMPLETE' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <h3 className="text-green-400 font-bold">✅ Conversión Exitosa (Vista Previa)</h3>
                                <div className="text-xs text-gray-500">Por favor verifica el contenido antes de integrar.</div>
                            </div>

                            <textarea
                                className="w-full h-64 bg-black/50 border border-gray-700 rounded p-4 text-xs font-mono text-green-300 shadow-inner"
                                value={previewContent}
                                readOnly
                            />

                            {/* Aviso de flujo Vercel */}
                            {message?.text?.includes('Vercel') && (
                                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-300 space-y-2">
                                    <p className="font-bold">📋 Flujo para integrar desde Vercel:</p>
                                    <ol className="list-decimal list-inside space-y-1 text-amber-200/80 text-xs">
                                        <li>Descarga el archivo <code className="bg-black/30 px-1 rounded">.md</code> con el botón de abajo.</li>
                                        <li>Cópialo en <code className="bg-black/30 px-1 rounded">data/documents/</code> en tu PC local.</li>
                                        <li>Desde el panel <strong>local</strong> (<code className="bg-black/30 px-1 rounded">npm run dev</code>), haz clic en <strong>"Subir a Vercel"</strong>.</li>
                                    </ol>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-3 justify-end">
                                <button
                                    onClick={handleCancelPhase1}
                                    className="px-6 py-2 rounded bg-red-900/30 text-red-300 border border-red-500/30 hover:bg-red-900/50 transition-colors"
                                >
                                    ❌ Cancelar
                                </button>

                                {/* Botón descargar .md — siempre disponible */}
                                <button
                                    onClick={() => {
                                        const blob = new Blob([previewContent], { type: 'text/markdown' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = uploadedFilename || 'documento.md';
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                    }}
                                    className="px-6 py-2 rounded bg-blue-700/80 text-blue-200 border border-blue-500/40 hover:bg-blue-600 transition-colors flex items-center gap-2"
                                >
                                    ⬇️ Descargar .md
                                </button>

                                {/* Integrar a KB — solo funciona en local */}
                                <button
                                    onClick={handlePhase2Integrate}
                                    disabled={message?.text?.includes('Vercel')}
                                    title={message?.text?.includes('Vercel') ? 'No disponible en Vercel. Usa el flujo local.' : ''}
                                    className="px-6 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-500 hover:shadow-lg hover:shadow-green-500/20 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-600 disabled:hover:shadow-none"
                                >
                                    <span>💾</span> Aceptar e Integrar a KB
                                </button>
                            </div>
                        </div>
                    )}

                    {uploadPhase === 'PHASE_2_PROCESSING' && (
                        <div className="text-center py-12">
                            <div className="animate-spin text-4xl mb-4">🔄</div>
                            <p className="text-lg font-bold text-green-300">Fase 2: Integrando a Base de Conocimientos...</p>
                            <p className="text-sm text-gray-500">Indexando contenido y generando vectores.</p>
                        </div>
                    )}

                </section>

                {/* LISTA DE DOCUMENTOS */}
                <section>
                    <div className="flex justify-between items-end mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span className="text-pink-400">📚</span> Documentos Actuales ({documents.length})
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDeploy}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-all shadow-lg"
                            >
                                🚀 Subir a Vercel
                            </button>
                            <button
                                onClick={handleRebuild}
                                className="bg-blue-600/80 hover:bg-blue-500 px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-colors"
                            >
                                🔄 Regenerar KB
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {documents.map((doc) => (
                            <div key={doc.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-200 group-hover:text-purple-300 transition-colors">{doc.filename}</h3>
                                        <div className="flex gap-4 text-xs text-gray-500 mt-1">
                                            <span>{(doc.size / 1024).toFixed(1)} KB</span>
                                            <span>Modificado: {new Date(doc.modified).toLocaleDateString()} {new Date(doc.modified).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-900/30 transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                                <p className="text-gray-500 text-sm mt-3 line-clamp-2 bg-black/20 p-2 rounded">
                                    {doc.preview}
                                </p>
                            </div>
                        ))}

                        {documents.length === 0 && (
                            <div className="text-center py-12 text-gray-600 italic">
                                No hay documentos en la base de conocimientos.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
